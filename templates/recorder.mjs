#!/usr/bin/env node
/**
 * Record SitFlow's "what working looks like" demo for Jaynee.
 *
 * Pattern lifted from HomenShum/parity-studio/scripts/record-six-step-demo.mjs:
 *   - Playwright drives Chromium at a fixed viewport
 *   - Scene-based — each scene maps to a checklist item from
 *     JAYNEE-LAUNCH-PLAYBOOK.md Phase 0 ("what working looks like")
 *   - Off-camera waits for slow operations (AI extraction)
 *   - Evidence JSON tracks every check so the verifier can confirm
 *   - Final outputs: out/jaynee-demo.mp4 + .gif + -720.gif
 *
 * Run:
 *   node scripts/record-jaynee-demo.mjs
 *
 * Env (all optional):
 *   PWA_URL=http://localhost:8081      target app
 *   API_URL=http://localhost:3000      target server (for AI extraction)
 *   API_SECRET=...                     server auth secret
 *   HEADED=1                           show the browser window
 *   VIEWPORT_WIDTH=1280  HEIGHT=800    desktop viewport
 *   AI_WAIT_MS=15000                   how long to wait for AI extraction
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile, copyFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

// Load .env so EXPO_PUBLIC_API_SECRET is available
const ENV_PATH = resolve(repoRoot, '.env');
if (existsSync(ENV_PATH)) {
  for (const line of readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const PWA_URL = process.env.PWA_URL ?? 'http://localhost:8081';
const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const API_SECRET = process.env.API_SECRET ?? process.env.EXPO_PUBLIC_API_SECRET ?? 'sitflow-dev-secret-rotate-before-prod';
const HEADED = process.env.HEADED === '1';
const WIDTH = Number.parseInt(process.env.VIEWPORT_WIDTH ?? '1280', 10);
const HEIGHT = Number.parseInt(process.env.VIEWPORT_HEIGHT ?? '800', 10);
const AI_WAIT_MS = Number.parseInt(process.env.AI_WAIT_MS ?? '15000', 10);

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = resolve(repoRoot, 'out');
const sceneDir = join(outDir, 'demo-scenes');
const videoDir = join(outDir, `demo-recording-${stamp}`);
const finalMp4 = join(outDir, 'jaynee-demo.mp4');
const finalGif = join(outDir, 'jaynee-demo.gif');
const finalGif720 = join(outDir, 'jaynee-demo-720.gif');
const evidencePath = join(outDir, 'jaynee-demo-evidence.json');

await mkdir(outDir, { recursive: true });
await mkdir(sceneDir, { recursive: true });

const evidence = {
  version: 1,
  createdAt: new Date().toISOString(),
  pwaUrl: PWA_URL,
  apiUrl: API_URL,
  viewport: { width: WIDTH, height: HEIGHT },
  scenes: [],
  checks: {},
  outputs: { mp4: finalMp4, gif: finalGif, gif720: finalGif720 },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function recordCheck(key, ok, detail = {}) {
  evidence.checks[key] = { ok, ...detail, at: new Date().toISOString() };
  console.log(`  ${ok ? '✓' : '✗'} ${key}${detail.note ? ` — ${detail.note}` : ''}`);
}

async function expectText(page, text, key, timeoutMs = 5000) {
  try {
    await page.locator(`text=${text}`).first().waitFor({ state: 'visible', timeout: timeoutMs });
    recordCheck(key, true, { text });
    return true;
  } catch {
    recordCheck(key, false, { text, note: 'not visible in viewport' });
    return false;
  }
}

async function bodyContains(page, fragments) {
  const text = await page.evaluate(() => document.body.innerText || '');
  return Object.fromEntries(fragments.map((f) => [f, text.includes(f)]));
}

async function scene(page, label, durationMs, fn) {
  console.log(`\n→ Scene: ${label}`);
  const t0 = Date.now();
  await fn();
  // Hold the final frame for a moment so viewers can read it
  await sleep(Math.max(0, durationMs - (Date.now() - t0)));
  evidence.scenes.push({ label, durationMs: Date.now() - t0 });
}

// Pan the inner React-Native scroller smoothly to a target offset.
// RN-Web does not honor window.scroll; the actual scroller is an inner
// `<div>` with overflowY=auto. We grab every such scroller and animate
// each one in lockstep so the camera sees the full surface.
async function smoothPan(page, targetTop, durationMs = 1500, steps = 30) {
  await page.evaluate(
    async ({ targetTop, durationMs, steps }) => {
      const scrollers = Array.from(document.querySelectorAll('*')).filter((el) => {
        const cs = getComputedStyle(el);
        return (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
      });
      if (scrollers.length === 0) return;
      const starts = scrollers.map((s) => s.scrollTop);
      const stepMs = Math.max(8, Math.floor(durationMs / steps));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        scrollers.forEach((s, idx) => {
          const max = s.scrollHeight - s.clientHeight;
          const goal = Math.min(targetTop, max);
          s.scrollTop = starts[idx] + (goal - starts[idx]) * t;
        });
        await new Promise((r) => setTimeout(r, stepMs));
      }
    },
    { targetTop, durationMs, steps }
  );
}

async function clearStorageAndReload(page) {
  await page.evaluate(() => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sitflow:'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
  });
  await page.reload({ waitUntil: 'load' });
  await sleep(1500);
}

async function ensureLocalAlive() {
  console.log(`\n→ Checking local stack`);
  const ping = async (url) => {
    try {
      const r = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(4000) });
      return r.status;
    } catch {
      return 0;
    }
  };
  const m = await ping(`${PWA_URL}/`);
  const a = await ping(`${API_URL}/api/health`);
  console.log(`  PWA ${PWA_URL}: HTTP ${m}`);
  console.log(`  API ${API_URL}: HTTP ${a}`);
  if (m !== 200) throw new Error('PWA not reachable — start `pnpm dev` first');
  if (a !== 200) console.warn('  ⚠ API down — Scene 5 (live AI extraction) will skip');
  evidence.checks.localStack = { ok: m === 200, pwa: m, api: a };
  return { pwaOk: m === 200, apiOk: a === 200 };
}

async function main() {
  const { apiOk } = await ensureLocalAlive();

  const browser = await chromium.launch({ headless: !HEADED });
  const ctx = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: { width: WIDTH, height: HEIGHT } },
    colorScheme: 'dark',
  });
  const page = await ctx.newPage();

  try {
    // Pre-roll: warm up the bundle
    console.log(`\n→ Loading PWA bundle (first request)`);
    await page.goto(`${PWA_URL}/`, { waitUntil: 'load', timeout: 60_000 });
    await sleep(2500);

    // ─── Scene 1: Inbox shows 5 mock clients + Bella's red callout ───
    await scene(page, 'inbox', 6500, async () => {
      await page.goto(`${PWA_URL}/`, { waitUntil: 'load' });
      await sleep(2500);

      const fragments = await bodyContains(page, [
        'SitFlow', 'Booking inbox',
        'All', 'Needs reply', 'New client', 'Confirmed',
        'The Smith Family', 'Bella', 'Golden Retriever',
        'No human food', 'NEVER alone',
        'Tom Harris', 'Zeus',
        'James Kim', 'Mochi',
      ]);
      recordCheck('inbox.brand', fragments['SitFlow'] && fragments['Booking inbox']);
      recordCheck('inbox.filterChips', fragments['All'] && fragments['Needs reply'] && fragments['New client'] && fragments['Confirmed']);
      recordCheck('inbox.bellaCard', fragments['The Smith Family'] && fragments['Bella'] && fragments['Golden Retriever']);
      recordCheck('inbox.bellaCriticalRules', fragments['No human food'] && fragments['NEVER alone'],
        { note: 'compact CareCard surfacing must_not rules' });
      recordCheck('inbox.tomHarris', fragments['Tom Harris'] && fragments['Zeus']);
      recordCheck('inbox.jamesKim', fragments['James Kim'] && fragments['Mochi']);
    });

    // ─── Scene 2: Calendar Today view with stats + Care Card ───
    // Inner scroller is ~1744px tall but only 660px visible. Pan past the
    // month grid to expose the Today panel (4-stat strip + Care Card).
    await scene(page, 'calendar', 9500, async () => {
      await page.goto(`${PWA_URL}/calendar`, { waitUntil: 'load' });
      await sleep(2200);
      // 1) Show the month grid for ~1.5s
      await sleep(1500);
      // 2) Pan to the day-detail panel (4-stat strip + Care Card)
      await smoothPan(page, 700, 1500);
      await sleep(2200);
      // 3) Pan further to the Care Card with rules
      await smoothPan(page, 1100, 1200);
      await sleep(1800);

      const fragments = await bodyContains(page, [
        'Calendar', 'Today',
        'booking', 'M&G', 'blocks', 'hours free',
        'Bella', 'No human food',
      ]);
      recordCheck('calendar.header', fragments['Calendar'] && fragments['Today']);
      recordCheck('calendar.stats', fragments['booking'] && fragments['M&G'] && fragments['blocks'] && fragments['hours free'],
        { note: '4-stat strip (bookings/M&G/blocks/free)' });
      recordCheck('calendar.bellaAppointment', fragments['Bella'] && fragments['No human food'],
        { note: 'Care Card on today’s booking' });
    });

    // ─── Scene 3: Smith Family detail — full Care Plan + AI permissions ───
    // Inner scroller is ~1787px tall but only 753px visible. Pan in three
    // stops so the camera shows: client header → Care Plan rules → AI
    // permissions toggles + Fail-closed footer.
    await scene(page, 'client-detail', 11500, async () => {
      await page.goto(`${PWA_URL}/clients/c5`, { waitUntil: 'load' });
      await sleep(2200);
      // 1) Hold on the header (client name + pet)
      await sleep(1500);
      // 2) Pan to the categorized Care Plan rules
      await smoothPan(page, 500, 1200);
      await sleep(2000);
      // 3) Pan further to expose AI permissions (READ/DRAFT/SEND toggles)
      await smoothPan(page, 1100, 1200);
      await sleep(1800);
      // 4) Pan to the very bottom — Fail-closed footer
      await smoothPan(page, 1700, 1000);
      await sleep(1500);
      const fragments = await bodyContains(page, [
        'The Smith Family', 'Bella',
        'No human food', 'Walk after every nap', 'Never alone',
        'AI permissions', 'AI can READ messages',
        'AI can DRAFT replies', 'AI can SEND replies',
        'Fail-closed by default',
      ]);
      recordCheck('detail.client', fragments['The Smith Family'] && fragments['Bella']);
      recordCheck('detail.carePlan', fragments['No human food'] && fragments['Walk after every nap'] && fragments['Never alone'],
        { note: '8 categorized rules from M&G' });
      recordCheck('detail.aiPermissions',
        fragments['AI permissions'] && fragments['AI can READ messages'] && fragments['AI can DRAFT replies'] && fragments['AI can SEND replies'],
        { note: 'consent gateway, fail-closed by default' });
      recordCheck('detail.failClosed', fragments['Fail-closed by default']);
    });

    // ─── Scene 4: Express composer (the AI extraction UI) ───
    // Inner scroller is ~1830px tall but only 747px visible. Pan from the
    // Express composer (FASTEST PATH badge) down to the Care Rules editor
    // so both halves of the form are on camera.
    await scene(page, 'composer', 9500, async () => {
      await page.goto(`${PWA_URL}/clients/new`, { waitUntil: 'load' });
      await sleep(2200);
      // 1) Hold on the Express composer — the FASTEST PATH banner
      await sleep(1500);
      // 2) Pan to the Care Rules editor section below the composer
      await smoothPan(page, 800, 1200);
      await sleep(1800);
      // 3) Pan further to show the rest of the form
      await smoothPan(page, 1300, 1000);
      await sleep(1500);
      // 4) Pan back to top so Scene 5 starts clean (live AI types into composer)
      await smoothPan(page, 0, 1000);
      await sleep(700);

      const fragments = await bodyContains(page, [
        'New Client', 'Express add', 'FASTEST PATH',
        'drag in a photo',
        'Drag a photo here',
        'Care Rules',
      ]);
      recordCheck('composer.header', fragments['New Client'] && fragments['Express add']);
      recordCheck('composer.fastestBadge', fragments['FASTEST PATH']);
      recordCheck('composer.dragHint', fragments['drag in a photo'] || fragments['Drag a photo here']);
      recordCheck('composer.careRulesEditor', fragments['Care Rules']);
    });

    // ─── Scene 5: Live AI extraction (only if API alive) ───
    if (apiOk) {
      await scene(page, 'live-ai', 18000, async () => {
        // Type the Mochi paragraph into the composer textarea
        const typed = await page.evaluate((text) => {
          const ta = document.querySelectorAll('textarea')[0];
          if (!ta) return false;
          const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
          setter.call(ta, text);
          ta.dispatchEvent(new Event('input', { bubbles: true }));
          return ta.value.length > 0;
        }, "Mochi is a 5yo Shiba Inu. Owner James Kim (555) 555-1010. Apoquel 16mg with breakfast. NO other dogs. Shy at first — give 10 min to warm up.");
        recordCheck('liveAi.typed', typed, { note: 'paragraph entered in composer' });
        await sleep(1500);

        // Click the send arrow (↑)
        const clicked = await page.evaluate(() => {
          const els = Array.from(document.querySelectorAll('div, span, button'));
          const sendBtn = els.find((e) => e.textContent?.trim() === '↑' && e.children.length === 0);
          if (!sendBtn) return false;
          sendBtn.click();
          return true;
        });
        recordCheck('liveAi.sendClicked', clicked);

        // Wait for the AI round-trip
        await sleep(AI_WAIT_MS);

        // Verify form auto-filled
        const filled = await page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input')).slice(0, 5);
          return inputs.map((i) => ({ ph: i.placeholder, val: i.value }));
        });
        const fullName = filled.find((i) => /Sarah Mitchell/.test(i.ph))?.val ?? '';
        const phone = filled.find((i) => /000-0000/.test(i.ph))?.val ?? '';
        const petName = filled.find((i) => /Biscuit/.test(i.ph))?.val ?? '';
        const age = filled.find((i) => /e\.g\. 10/.test(i.ph))?.val ?? '';
        recordCheck('liveAi.formFilled',
          fullName.length > 0 && petName.length > 0,
          { note: `Full Name="${fullName}" Phone="${phone}" Pet="${petName}" Age="${age}"` });

        // Hold so viewers can see the filled form
        await sleep(2500);
      });
    } else {
      console.log('\n→ Skipping Scene 5 (live AI) — API server is down');
      evidence.scenes.push({ label: 'live-ai', skipped: true, reason: 'api offline' });
    }

    // Closing frame: jump back to inbox so the demo loops nicely
    await scene(page, 'closing-inbox', 3000, async () => {
      await page.goto(`${PWA_URL}/`, { waitUntil: 'load' });
      await sleep(2000);
    });
  } finally {
    await page.close();
    await ctx.close();
    await browser.close();
  }

  // Locate the recorded webm file (Playwright drops a .webm per page)
  const videos = await readdir(videoDir);
  const webmFile = videos.find((f) => f.endsWith('.webm'));
  if (!webmFile) {
    console.error('\n✗ No .webm produced — recording failed');
    await writeFile(evidencePath, JSON.stringify({ ...evidence, error: 'no-webm' }, null, 2));
    process.exit(1);
  }
  const webmPath = join(videoDir, webmFile);
  evidence.webmPath = webmPath;

  console.log(`\n→ Converting webm → mp4 + gif (ffmpeg)`);
  // 1. webm → mp4 (h264, broadly compatible)
  const ffWebmToMp4 = spawnSync('ffmpeg', [
    '-y', '-i', webmPath,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '22',
    '-pix_fmt', 'yuv420p',
    '-an',
    finalMp4,
  ], { encoding: 'utf8' });
  if (ffWebmToMp4.status !== 0) {
    console.error('ffmpeg mp4 failed:', ffWebmToMp4.stderr?.slice(-400));
    process.exit(1);
  }
  const mp4Stat = await stat(finalMp4);
  recordCheck('ffmpeg.mp4', mp4Stat.size > 0, { sizeBytes: mp4Stat.size });

  // 2. mp4 → gif (palette-optimized, 12fps, 720px wide)
  console.log('  → gif (720p, 12fps)');
  const palettePath = join(videoDir, 'palette.png');
  const ffPalette = spawnSync('ffmpeg', [
    '-y', '-i', finalMp4,
    '-vf', 'fps=12,scale=720:-1:flags=lanczos,palettegen',
    palettePath,
  ], { encoding: 'utf8' });
  if (ffPalette.status === 0) {
    spawnSync('ffmpeg', [
      '-y', '-i', finalMp4, '-i', palettePath,
      '-filter_complex', 'fps=12,scale=720:-1:flags=lanczos[x];[x][1:v]paletteuse',
      finalGif720,
    ], { encoding: 'utf8' });
    if (existsSync(finalGif720)) {
      // Also produce a non-720 alias (same content for now)
      await copyFile(finalGif720, finalGif);
      const gifStat = await stat(finalGif720);
      recordCheck('ffmpeg.gif720', true, { sizeBytes: gifStat.size });
    }
  }

  await writeFile(evidencePath, JSON.stringify(evidence, null, 2));

  // Summary
  console.log('\n──────── DEMO RECORDED ────────');
  console.log(`mp4:      ${finalMp4}`);
  console.log(`gif:      ${finalGif720} (720p)`);
  console.log(`evidence: ${evidencePath}`);
  console.log(`scenes:   ${evidence.scenes.length}`);
  const checks = Object.entries(evidence.checks);
  const ok = checks.filter(([, v]) => v.ok).length;
  console.log(`checks:   ${ok}/${checks.length} pass`);
  for (const [k, v] of checks) {
    if (!v.ok) console.log(`  ✗ ${k} — ${v.note ?? ''}`);
  }
}

main().catch((e) => {
  console.error('\n✗ FATAL:', e?.message ?? e);
  process.exit(1);
});
