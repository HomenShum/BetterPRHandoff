#!/usr/bin/env node
/**
 * Producer for everything in promotion/evidence/. Re-runnable from a fresh clone:
 *
 *   node promotion/evidence/audit.mjs
 *
 * It emits the real user-facing surface with this repo's own CLI
 * (`qa <feature-id>` -> QA_DOGFOOD/<id>/gmail-magic-resend.html), serves it on
 * 127.0.0.1:4917, and runs three independent measurements against that URL:
 *
 *   1. Lighthouse 13.4.1  -> lighthouse.json   (performance, a11y, best-practices, SEO, CWV)
 *   2. @axe-core/cli 4.13.0 -> axe.json        (accessibility violations)
 *   3. Playwright chromium -> surface-measurements.json + screenshot-*.png
 *      (viewport/overflow at three widths, keyboard order, focus visibility,
 *       tap-target sizes, computed contrast, console + network during load)
 *
 * Nothing here summarises anything by hand: summary.json is derived from the
 * three raw files above, so a reader can disagree with the call by opening them.
 *
 * Playwright is not a dependency of this package (it ships zero). This script
 * installs it with `npm i --no-save` on first run and leaves package.json alone.
 */
import { createServer } from 'node:http';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
const PREFERRED_PORT = 4917;
const FEATURE_ID = 'promotion-audit';
const PAGE = 'gmail-magic-resend.html';
let URL; // assigned once the server has a port; 4917 is preferred, not required
const PW_VERSION = '1.56.0';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const out = (name) => join(HERE, name);
const log = (...a) => console.log('  ', ...a);

// Must be async: the static server below lives in THIS process, so a blocking
// spawnSync would stall the event loop and the audit tool would get no response.
const run = (cmd, args, opts = {}) =>
  new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
    p.on('close', (code) => resolve(code));
  });

// --- 1. emit the surface with the product's own CLI -------------------------
const work = mkdtempSync(join(tmpdir(), 'promo-audit-'));
execFileSync(process.execPath, [join(REPO, 'bin', 'init.mjs'), 'qa', FEATURE_ID], {
  cwd: work,
  stdio: 'inherit',
});
const surfaceDir = join(work, 'QA_DOGFOOD', FEATURE_ID);
log('surface:', join(surfaceDir, PAGE));

// --- 1b. the other surface: CLI latency + the test suite --------------------
// Condition 10 covers both surfaces and condition 11 wants its output retained,
// so both are produced here instead of being typed into a table by hand.
const timeVerb = (args, runs = 7) => {
  const ms = [];
  for (let i = 0; i < runs; i++) {
    const dir = mkdtempSync(join(tmpdir(), 'promo-time-'));
    const t = process.hrtime.bigint();
    execFileSync(process.execPath, [join(REPO, 'bin', 'init.mjs'), ...args], { cwd: dir, stdio: 'ignore' });
    ms.push(Number(process.hrtime.bigint() - t) / 1e6);
  }
  const sorted = [...ms].sort((a, b) => a - b);
  return { runs, medianMs: Math.round(sorted[Math.floor(runs / 2)]), allMs: ms.map((n) => Math.round(n)) };
};
const cliTiming = { init: timeVerb(['init']), qa: timeVerb(['qa', 'timing-probe'], 5) };
log('cli medians (ms): init', cliTiming.init.medianMs, '| qa', cliTiming.qa.medianMs);

const npmTest = spawnSync(npm, ['test'], { cwd: REPO, encoding: 'utf8', shell: process.platform === 'win32' });
writeFileSync(out('npm-test.txt'),
  `$ npm test\n# node ${process.version} on ${process.platform}\n\n${npmTest.stdout}${npmTest.stderr}\n# exit ${npmTest.status}\n`);
const testCounts = Object.fromEntries(
  ['pass', 'fail', 'skipped'].map((k) => [k, Number(npmTest.stdout.match(new RegExp(`^# ${k} (\\d+)`, 'm'))?.[1] ?? -1)]));
log('npm test:', JSON.stringify(testCounts), 'exit', npmTest.status);

// --- 2. serve it ------------------------------------------------------------
const MIME = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8' };
const server = createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || PAGE;
  const file = join(surfaceDir, rel);
  if (!file.startsWith(surfaceDir) || !existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    return res.end('not found');
  }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
// Prefer 4917 so a reader recognises the URL in the artifacts, but never fail
// because some other process on the machine already holds it.
const listen = (port) => new Promise((resolve) => {
  const onErr = (e) => (e.code === 'EADDRINUSE' ? resolve(false) : Promise.reject(e));
  server.once('error', onErr);
  server.listen(port, '127.0.0.1', () => { server.off('error', onErr); resolve(true); });
});
if (!(await listen(PREFERRED_PORT))) {
  log(`port ${PREFERRED_PORT} is taken; using an ephemeral port instead`);
  await listen(0);
}
URL = `http://127.0.0.1:${server.address().port}/${PAGE}`;
log('serving', URL);

// --- 3. Lighthouse ----------------------------------------------------------
log('lighthouse 13.4.1 ...');
const lhExit = await run(npx, [
  '--yes', 'lighthouse@13.4.1', URL, '--output=json', `--output-path=${out('lighthouse.json')}`,
  '--chrome-flags=--headless', '--quiet',
]);

// --- 4. axe ------------------------------------------------------------------
log('@axe-core/cli 4.13.0 ...');
// `--save` resolves relative to cwd, so give it a bare name and run it in here.
const axeExit = await run(npx, ['--yes', '@axe-core/cli@4.13.0', URL, '--save', 'axe.json'], { cwd: HERE });

// --- 5. Playwright ------------------------------------------------------------
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  log(`installing playwright@${PW_VERSION} (--no-save; package.json is not touched)`);
  await run(npm, ['i', '--no-save', '--no-audit', '--no-fund', `playwright@${PW_VERSION}`], { cwd: REPO });
  await run(npx, ['--yes', `playwright@${PW_VERSION}`, 'install', 'chromium'], { cwd: REPO });
  ({ chromium } = await import('playwright'));
}

const WIDTHS = [
  { name: 'desktop-1440', viewport: { width: 1440, height: 900 }, isMobile: false, deviceScaleFactor: 1 },
  { name: 'tablet-768', viewport: { width: 768, height: 1024 }, isMobile: false, deviceScaleFactor: 1 },
  { name: 'mobile-375', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
];

// Runs inside the page. Returns only measured values -- no judgements.
const probe = () => {
  const lum = (rgb) => {
    const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number)
      .map((v) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (fg, bg) => {
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
    return Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100;
  };
  const de = document.documentElement;
  const targets = [...document.querySelectorAll('a, button, input, [tabindex]')].map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      selector: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''),
      text: (el.textContent || '').trim().slice(0, 40),
      href: el.getAttribute('href'),
      width: Math.round(r.width), height: Math.round(r.height),
      fontSizePx: parseFloat(cs.fontSize),
      color: cs.color, background: cs.backgroundColor,
      contrastRatio: contrast(cs.color, cs.backgroundColor === 'rgba(0, 0, 0, 0)'
        ? getComputedStyle(document.body).backgroundColor : cs.backgroundColor),
    };
  });
  const bodyText = getComputedStyle(document.body);
  const tableCell = document.querySelector('td');
  return {
    hasMetaViewport: !!document.querySelector('meta[name="viewport"]'),
    metaViewportContent: document.querySelector('meta[name="viewport"]')?.content ?? null,
    hasMetaDescription: !!document.querySelector('meta[name="description"]'),
    metaColorScheme: document.querySelector('meta[name="color-scheme"]')?.content ?? null,
    animationCount: [...document.querySelectorAll('*')]
      .filter((e) => { const c = getComputedStyle(e); return c.animationName !== 'none' || c.transitionProperty !== 'all' && c.transitionDuration !== '0s'; }).length,
    lang: de.lang || null,
    title: document.title,
    landmarks: [...document.querySelectorAll('main, [role="main"], nav, header, footer, aside')].map((e) => e.tagName.toLowerCase()),
    headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => h.tagName + ': ' + h.textContent.trim().slice(0, 40)),
    layoutViewportWidth: de.clientWidth,
    documentScrollWidth: de.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    horizontalOverflowPx: Math.max(0, de.scrollWidth - de.clientWidth),
    visualViewportScale: window.visualViewport ? Math.round(window.visualViewport.scale * 1000) / 1000 : null,
    cardWidthPx: Math.round(document.querySelector('.card')?.getBoundingClientRect().width ?? 0),
    bodyFontSizePx: parseFloat(bodyText.fontSize),
    tableCellFontSizePx: tableCell ? parseFloat(getComputedStyle(tableCell).fontSize) : null,
    effectiveTableTextPx: tableCell && window.visualViewport
      ? Math.round(parseFloat(getComputedStyle(tableCell).fontSize) * window.visualViewport.scale * 100) / 100
      : null,
    interactiveTargets: targets,
    deadHrefCount: [...document.querySelectorAll('a[href="#"]')].length,
    subresourceRefs: [...document.querySelectorAll('script[src], link[href], img[src], iframe[src]')]
      .map((e) => e.getAttribute('src') || e.getAttribute('href')),
  };
};

const browser = await chromium.launch();
const measurements = { url: URL, measuredAt: new Date().toISOString(), widths: {}, keyboard: null, network: null };

for (const w of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: w.viewport, isMobile: w.isMobile, hasTouch: !!w.hasTouch, deviceScaleFactor: w.deviceScaleFactor,
  });
  const page = await ctx.newPage();
  const consoleMessages = [];
  const failedRequests = [];
  page.on('console', (m) => consoleMessages.push({ type: m.type(), text: m.text() }));
  page.on('requestfailed', (r) => failedRequests.push({ url: r.url(), failure: r.failure()?.errorText }));
  page.on('response', (r) => { if (r.status() >= 400) failedRequests.push({ url: r.url(), status: r.status() }); });

  await page.goto(URL, { waitUntil: 'networkidle' });
  const m = await page.evaluate(probe);
  m.consoleMessages = consoleMessages;
  m.failedRequests = failedRequests;
  await page.screenshot({ path: out(`screenshot-${w.name}.png`), fullPage: true });
  measurements.widths[w.name] = m;
  log(w.name, 'layoutViewport', m.layoutViewportWidth, '| overflow', m.horizontalOverflowPx, 'px | scale', m.visualViewportScale);

  if (w.name === 'desktop-1440') {
    // Condition 6: keyboard order + focus visibility, observed by pressing Tab.
    const seq = [];
    for (let i = 0; i < 8; i++) {
      const t0 = Date.now();
      await page.keyboard.press('Tab');
      seq.push(await page.evaluate((dt) => {
        const el = document.activeElement;
        const cs = el === document.body ? null : getComputedStyle(el);
        return {
          tag: el.tagName, text: (el.textContent || '').trim().slice(0, 30),
          focusVisibleOutline: cs ? `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}` : null,
          matchesFocusVisible: el.matches?.(':focus-visible') ?? false,
          keypressToFocusMs: dt,
        };
      }, Date.now() - t0));
    }
    measurements.keyboard = seq;
    measurements.network = { consoleMessages, failedRequests };
  }
  await ctx.close();
}
await browser.close();
writeFileSync(out('surface-measurements.json'), JSON.stringify(measurements, null, 2));

// --- 6. summary derived from the raw files, not from memory -----------------
const lhJson = JSON.parse(readFileSync(out('lighthouse.json'), 'utf8'));
const axeJson = JSON.parse(readFileSync(out('axe.json'), 'utf8'));
const axeRun = Array.isArray(axeJson) ? axeJson[0] : axeJson;
const summary = {
  generatedBy: 'node promotion/evidence/audit.mjs',
  generatedAt: new Date().toISOString(),
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO }).toString().trim(),
  url: URL,
  lighthouse: {
    version: lhJson.lighthouseVersion,
    formFactor: lhJson.configSettings.formFactor,
    scores: Object.fromEntries(Object.entries(lhJson.categories).map(([k, c]) => [k, c.score])),
    coreWebVitals: {
      lcpMs: Math.round(lhJson.audits['largest-contentful-paint'].numericValue),
      cls: lhJson.audits['cumulative-layout-shift'].numericValue,
      tbtMs: Math.round(lhJson.audits['total-blocking-time'].numericValue),
      maxPotentialFidMs: Math.round(lhJson.audits['max-potential-fid'].numericValue),
    },
    failingAudits: Object.entries(lhJson.audits)
      .filter(([, a]) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative')
      .map(([id, a]) => ({ id, score: a.score, title: a.title })),
  },
  axe: {
    version: axeRun.testEngine?.version,
    violations: axeRun.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })),
    seriousOrCritical: axeRun.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').length,
    passes: axeRun.passes?.length ?? null,
  },
  surface: Object.fromEntries(Object.entries(measurements.widths).map(([k, v]) => [k, {
    layoutViewportWidth: v.layoutViewportWidth,
    horizontalOverflowPx: v.horizontalOverflowPx,
    visualViewportScale: v.visualViewportScale,
    effectiveTableTextPx: v.effectiveTableTextPx,
    minContrastRatio: Math.min(...v.interactiveTargets.map((t) => t.contrastRatio)),
    smallestTargetPx: Math.min(...v.interactiveTargets.map((t) => Math.min(t.width, t.height))),
    failedRequests: v.failedRequests.length,
    consoleErrors: v.consoleMessages.filter((c) => c.type === 'error').length,
  }])),
  keyboardStopsReached: measurements.keyboard.filter((k) => k.tag !== 'BODY').length,
  cli: { node: process.version, platform: process.platform, ...cliTiming },
  tests: { command: 'npm test', ...testCounts, exit: npmTest.status, output: 'npm-test.txt' },
  exitCodes: { lighthouse: lhExit, axe: axeExit },
};
writeFileSync(out('summary.json'), JSON.stringify(summary, null, 2));
server.close();
console.log('\n' + JSON.stringify(summary, null, 2));
