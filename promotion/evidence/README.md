# Promotion evidence

Every file here has a producer in this directory. That is the gate's rule and it
is the reason this directory exists: a number in prose is not an artifact, and a
screenshot whose generator was deleted is half an artifact.

## One command regenerates all of it

```bash
node promotion/evidence/audit.mjs
```

Needs only Node ≥ 18, network access for `npx`, and a Chrome on PATH.
Playwright is installed on first run with `npm i --no-save`, so `package.json`
keeps its zero dependencies. Everything below is overwritten in place; a reader
who gets different numbers has found a regression or a newer toolchain, not an
ambiguity.

## What it measures, and against what

The producer runs this repo's own CLI (`node bin/init.mjs qa promotion-audit`)
into a temp directory, serves the emitted `gmail-magic-resend.html` on
`127.0.0.1` — port 4917 when it is free, an ephemeral port otherwise, which is
why `summary.json` records the URL it actually used — and points three
independent tools at that URL. It audits the file a user receives, not the
template with placeholders still in it.

| Artifact | Producer | Tool | Conditions it carries |
|---|---|---|---|
| `lighthouse.json` | `audit.mjs` | `npx --yes lighthouse@13.4.1 <url> --output=json --output-path=<file> --chrome-flags="--headless"` | 8, 10 |
| `axe.json` | `audit.mjs` | `npx --yes @axe-core/cli@4.13.0 <url> --save axe.json` | 6, 8 |
| `surface-measurements.json` | `audit.mjs` | Playwright chromium, three viewports | 3, 4, 6, 9, 10, 12 |
| `screenshot-desktop-1440.png` | `audit.mjs` | Playwright, 1440×900 | 3, 4 |
| `screenshot-tablet-768.png` | `audit.mjs` | Playwright, 768×1024 | 3, 4 |
| `screenshot-mobile-375.png` | `audit.mjs` | Playwright, 375×812, `isMobile: true`, DPR 3 | 3, 4 |
| `npm-test.txt` | `audit.mjs` | `npm test` (`node --test test/cli.test.mjs`) | 5, 11 |
| `summary.json` | `audit.mjs` | derived from every file above | all of the above |
| `WIG_REVIEW.md` | a human reading the checklist against `surface-measurements.json` | not a tool | 7 |

`WIG_REVIEW.md` is deliberately the one row with no tool. Condition 7 is a
review; Lighthouse and axe are condition 8. A Lighthouse score presented as a
Web Interface Guidelines review would be a different claim than the one made.

## Current numbers

From `summary.json`, generated 2026-08-14. Its `commit` field names the HEAD the
run measured, which is the parent of the commit carrying these files — a run
cannot record the hash of a commit that does not exist yet. Re-run the producer
after pulling and the field will name your HEAD.

- **Lighthouse 13.4.1**, mobile form factor: performance **1.00**, accessibility
  **1.00**, best-practices **1.00**, SEO **0.90**.
- **Core Web Vitals**: LCP **675 ms**, CLS **0**, TBT **0 ms**, max potential FID
  **16 ms**.
- **axe-core 4.13.0**: **0 violations**, 23 rules passing. (Before this pass: 3
  violations over 6 nodes, one of them `color-contrast` at impact *serious*.)
- **Three widths**, 1440 / 768 / 375: horizontal overflow **0 px** at each,
  `visualViewport.scale` **1** at each, minimum text contrast **5.03:1**,
  smallest interactive target **38 px**, **0** console errors, **0** failed
  requests.
- **Keyboard**: 8 `Tab` presses observed, 7 landed on an interactive element,
  every one reporting `:focus-visible` and a visible outline.
- **CLI latency**, Node v22.22.2 on win32, each run spawning the real process
  into a fresh `mkdtemp` so interpreter startup is inside the number: `init`
  **111 ms** median of 7, `qa` **96 ms** median of 5.
- **Tests**: `npm test` → **20 pass, 0 fail**, exit 0. Full output in
  `npm-test.txt`.

## The three Lighthouse audits still scoring below 1, and why they stay

Recorded rather than hidden, because a clean-looking audit with an unexplained
gap is worse than a documented one.

- `meta-description` (0) — real, minor, unresolved. The page is opened from a
  link in an email body and is never crawled. This audit alone is the entire
  0.90 SEO score.
- `document-latency-insight` (0.5) — "No compression applied" on a 2,098-byte
  document. That is a property of the throwaway static server inside
  `audit.mjs`, not of the page. The real delivery channel is a Gmail message
  body.
- `forced-reflow-insight` (0) — 38 ms attributed to `[unattributed]`. The page
  ships no scripts at all (`subresourceRefs` is the inline `data:,` icon and
  nothing else), so this is Lighthouse's own instrumentation. Harness artifact.
