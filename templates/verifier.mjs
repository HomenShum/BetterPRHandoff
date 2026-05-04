#!/usr/bin/env node
/**
 * Verify a recorded Jaynee demo against:
 *   1. Local checks — file exists, duration in 25-180s, evidence JSON has all
 *      required checkpoints from the playbook
 *   2. Gemini video analysis — uploads the MP4 to Gemini Files API, asks the
 *      model to confirm the scene-by-scene checklist is visible. Same pattern
 *      parity-studio uses (verify-readme-proof-demo-gemini.mjs).
 *
 * Run:
 *   node scripts/verify-jaynee-demo.mjs out/jaynee-demo.mp4 out/jaynee-demo-evidence.json
 *
 * Env:
 *   GEMINI_API_KEY=AI...       (loaded from .env if present)
 *   GEMINI_VIDEO_MODEL=gemini-2.5-flash   (override if needed)
 *   SKIP_GEMINI=1              skip Gemini upload, do local checks only
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

// Load .env so GEMINI_API_KEY is available
const ENV_PATH = resolve(repoRoot, '.env');
if (existsSync(ENV_PATH)) {
  for (const line of readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const videoPath = resolve(process.argv[2] ?? 'out/jaynee-demo.mp4');
const evidencePath = process.argv[3] ? resolve(process.argv[3]) : resolve('out/jaynee-demo-evidence.json');
const model = process.env.GEMINI_VIDEO_MODEL ?? 'gemini-2.5-flash';
const skipGemini = process.env.SKIP_GEMINI === '1';

if (!existsSync(videoPath)) {
  console.error(`✗ video not found: ${videoPath}`);
  console.error('usage: node scripts/verify-jaynee-demo.mjs <video.mp4> [evidence.json]');
  process.exit(2);
}

// ─── Local checks ────────────────────────────────────────────────────────

function probeDuration(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  const v = Number.parseFloat((r.stdout ?? '').trim());
  return Number.isFinite(v) ? v : null;
}

const REQUIRED_CHECKS = [
  // Scene 1: Inbox
  'inbox.brand', 'inbox.filterChips', 'inbox.bellaCard', 'inbox.bellaCriticalRules',
  'inbox.tomHarris', 'inbox.jamesKim',
  // Scene 2: Calendar
  'calendar.header', 'calendar.stats', 'calendar.bellaAppointment',
  // Scene 3: Client detail
  'detail.client', 'detail.carePlan', 'detail.aiPermissions', 'detail.failClosed',
  // Scene 4: Composer
  'composer.header', 'composer.fastestBadge', 'composer.dragHint', 'composer.careRulesEditor',
  // Scene 5 (only if API alive)
  // 'liveAi.typed', 'liveAi.sendClicked', 'liveAi.formFilled',
];

async function localChecks() {
  const fileStat = await stat(videoPath);
  const durationSec = probeDuration(videoPath);
  const out = {
    videoExists: fileStat.size > 0,
    videoSizeBytes: fileStat.size,
    videoSizeMB: (fileStat.size / 1024 / 1024).toFixed(2),
    durationSec,
    durationOk: durationSec !== null && durationSec >= 25 && durationSec <= 180,
    evidenceOk: true,
    evidenceFailures: [],
    evidenceMissing: [],
  };
  if (existsSync(evidencePath)) {
    const evidence = JSON.parse(await readFile(evidencePath, 'utf8'));
    for (const key of REQUIRED_CHECKS) {
      const row = evidence.checks?.[key];
      if (!row) out.evidenceMissing.push(key);
      else if (!row.ok) out.evidenceFailures.push(key);
    }
    out.evidenceOk = out.evidenceMissing.length === 0 && out.evidenceFailures.length === 0;
    out.totalChecks = Object.keys(evidence.checks ?? {}).length;
    out.passingChecks = Object.entries(evidence.checks ?? {}).filter(([, v]) => v.ok).length;
    out.scenes = (evidence.scenes ?? []).map((s) => s.label);
  }
  return out;
}

// ─── Gemini video analysis ───────────────────────────────────────────────

async function uploadToGemini(apiKey, sizeBytes) {
  // Step 1: start resumable upload
  const startRes = await fetch('https://generativelanguage.googleapis.com/upload/v1beta/files', {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(sizeBytes),
      'X-Goog-Upload-Header-Content-Type': 'video/mp4',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: 'jaynee-demo.mp4' } }),
  });
  if (!startRes.ok) {
    throw new Error(`Gemini upload start failed: ${startRes.status} ${await startRes.text()}`);
  }
  const uploadUrl = startRes.headers.get('x-goog-upload-url') ?? startRes.headers.get('X-Goog-Upload-URL');
  if (!uploadUrl) throw new Error('No upload URL returned by Gemini');

  // Step 2: upload bytes
  const bytes = await readFile(videoPath);
  const upRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(sizeBytes),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: bytes,
  });
  if (!upRes.ok) throw new Error(`Gemini upload finalize failed: ${upRes.status} ${await upRes.text()}`);
  const meta = await upRes.json();
  return meta.file;
}

async function waitForActive(apiKey, fileName) {
  for (let i = 0; i < 30; i++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}`, {
      headers: { 'x-goog-api-key': apiKey },
    });
    if (!r.ok) throw new Error(`Gemini file poll failed: ${r.status}`);
    const m = await r.json();
    if (m.state === 'ACTIVE') return m;
    if (m.state === 'FAILED') throw new Error('Gemini file processing FAILED');
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('Gemini file did not become ACTIVE within 60s');
}

const VERIFICATION_PROMPT = `You are verifying a screen-recorded demo of a pet-sitting app called SitFlow.
The demo walks through 5 scenes in order. Confirm what you see for each scene.

For each scene, answer YES or NO with a one-sentence justification:

1. INBOX — does the screen show "SitFlow" header, "Booking inbox" subtitle,
   filter chips (All / Needs reply / New client / Confirmed), and at least 3
   client cards including "The Smith Family" with a Golden Retriever named Bella
   and a red-stripe callout mentioning "No human food" and "NEVER alone"?

2. CALENDAR — does the screen show "Calendar" header, "Today" + a date, a
   4-stat strip with "bookings", "M&G", "blocks", "hours free", and a Care Card
   with rules including "No human food" and "Walk after every nap"?

3. CLIENT DETAIL — does the screen show "The Smith Family" + Bella, a full
   structured Care Plan with category headers (Diet, Behavior, Schedule,
   Potty, Solo, Items, Comms, Medical), AND an "AI permissions" section
   with three toggles (READ messages / DRAFT replies / SEND replies) that
   says "Fail-closed by default"?

4. NEW CLIENT FORM — does the screen show "New Client" header, an
   "✨ Express add" panel with a "FASTEST PATH" badge, a textarea for
   pasting notes, a paperclip + send arrow, and a "Care Rules" editor below?

5. LIVE AI EXTRACTION (may be skipped if API was offline) — if shown, does
   the form auto-fill with values like "James Kim" / "(555)..." / "Mochi" / "5"
   after a paragraph is pasted and the send arrow is clicked?

Output as JSON:
{
  "scene1_inbox": { "verified": true/false, "reason": "..." },
  "scene2_calendar": { "verified": true/false, "reason": "..." },
  "scene3_clientDetail": { "verified": true/false, "reason": "..." },
  "scene4_composer": { "verified": true/false, "reason": "..." },
  "scene5_liveAI": { "verified": true/false/null, "reason": "..." },
  "overall": "PASS" | "PARTIAL" | "FAIL",
  "summary": "one line"
}`;

async function askGemini(apiKey, fileUri, mimeType) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { fileData: { mimeType, fileUri } },
              { text: VERIFICATION_PROMPT },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini generateContent failed: ${res.status} ${body.slice(0, 400)}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return { raw: text, parsed: safeJson(text) };
}

function safeJson(s) {
  try { return JSON.parse(s); } catch {}
  // Try to extract first {...} block
  const i = s.indexOf('{'); const j = s.lastIndexOf('}');
  if (i >= 0 && j > i) {
    try { return JSON.parse(s.slice(i, j + 1)); } catch {}
  }
  return null;
}

// ─── Main ────────────────────────────────────────────────────────────────

const local = await localChecks();
console.log('──────── LOCAL CHECKS ────────');
console.log(`  video       ${local.videoExists ? '✓' : '✗'} ${local.videoSizeMB} MB`);
console.log(`  duration    ${local.durationOk ? '✓' : '✗'} ${local.durationSec?.toFixed(1)}s (need 25-180s)`);
console.log(`  evidence    ${local.evidenceOk ? '✓' : '✗'} ${local.passingChecks ?? 0}/${local.totalChecks ?? 0} checks pass`);
if (local.evidenceMissing.length) console.log(`    missing:  ${local.evidenceMissing.join(', ')}`);
if (local.evidenceFailures.length) console.log(`    failures: ${local.evidenceFailures.join(', ')}`);
if (local.scenes) console.log(`  scenes      ${local.scenes.join(' → ')}`);

if (skipGemini) {
  console.log('\n(SKIP_GEMINI=1 — skipping content verification)');
  process.exit(local.videoExists && local.durationOk && local.evidenceOk ? 0 : 1);
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.log('\n⚠ GEMINI_API_KEY not set — skipping content verification');
  process.exit(local.videoExists && local.durationOk && local.evidenceOk ? 0 : 1);
}

console.log('\n──────── GEMINI VIDEO ANALYSIS ────────');
console.log(`  uploading ${local.videoSizeMB} MB to Gemini Files API…`);
const file = await uploadToGemini(apiKey, parseInt(local.videoSizeBytes, 10));
console.log(`  file:    ${file.name}`);
console.log(`  state:   ${file.state}`);
const ready = await waitForActive(apiKey, file.name);
console.log(`  ready:   ${ready.state} (${ready.sizeBytes} B)`);
console.log(`  asking ${model}…`);
const { raw, parsed } = await askGemini(apiKey, ready.uri, ready.mimeType ?? 'video/mp4');

if (parsed) {
  for (const [scene, v] of Object.entries(parsed)) {
    if (typeof v === 'object' && v !== null && 'verified' in v) {
      const mark = v.verified === true ? '✓' : v.verified === false ? '✗' : '∅';
      console.log(`  ${mark} ${scene}: ${v.reason ?? ''}`);
    }
  }
  console.log(`\n  overall: ${parsed.overall ?? 'unknown'}`);
  console.log(`  summary: ${parsed.summary ?? ''}`);

  // Append Gemini result to evidence file
  if (existsSync(evidencePath)) {
    const evidence = JSON.parse(await readFile(evidencePath, 'utf8'));
    evidence.gemini = { model, parsed, rawLength: raw.length, verifiedAt: new Date().toISOString() };
    await writeFile(evidencePath, JSON.stringify(evidence, null, 2));
  }
  process.exit(parsed.overall === 'PASS' ? 0 : 1);
} else {
  console.log('  raw response:', raw.slice(0, 800));
  process.exit(1);
}
