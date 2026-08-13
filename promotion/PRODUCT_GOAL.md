# Product goal — BetterPRHandoff

## Who opens this, and what they are trying to finish

Someone has just finished a week of changes and is about to hand the branch to
somebody else — a reviewer, a teammate taking the project over, themselves in
three months, or the next AI coding assistant that opens the repo. They arrive
with one job: leave behind a record the next reader can follow without
reconstructing it from forty commit messages. Right now that record does not
exist. The person picking up the branch opens the commit history, sees "fix",
"wip", "address feedback", and has no way to answer a plain question like *what
has the checkout screen looked like over the last six months, and why did it
change*. This repo hands them a protocol and a small command-line tool that
scaffolds it: one dated, append-only file per screen, component, server module,
database table, integration and script (a **per-surface changelog lane**), plus
templates for a recorded demo and a reviewer hand-off packet. When it worked,
they walk away holding a `CHANGELOG/` folder of per-surface history committed
next to the code, and an instructions file their own coding assistant reads
before every commit so that history keeps itself current. **BetterPRHandoff does
not run an agent for anyone — it is rules and scaffolding that the user's
existing agent follows.**

## The gate

This repo is judged by the twelve-condition PROMOTION gate, which lives in one
place and is not restated here:

**https://github.com/HomenShum/NodeKit/blob/main/templates/promotion/GATE.md**

Gate variant: `reduced` <!-- reduced = library/CLI judged on its demo
surface and quickstart; see the GATE's reduced-gate section -->

Scoring vocabulary is PASS / FAIL / **UNVERIFIED**, and UNVERIFIED is never PASS.

### Which surface each condition was scored against

This package has two surfaces a stranger actually meets, and they are not the
same shape. The split is stated here so the scoring below is auditable rather
than convenient:

- **CLI quickstart** (`bin/init.mjs` — `init`, `add`, `qa-init`, `qa`,
  `install`) — the surface the README's install block sends you to. Scored:
  conditions 5, 10, 11.
- **The one browser-rendered artifact the product emits** —
  `QA_DOGFOOD/<feature-id>/gmail-magic-resend.html`, written by
  the CLI's `qa <feature-id>` from `templates/gmail-magic-resend.html`. It is
  the only HTML a user of this package ever opens. Scored: conditions 3, 4, 6, 9.
- Conditions 1 and 2 span every journey in
  [PRODUCT_JOURNEYS.md](PRODUCT_JOURNEYS.md), on whichever surface each runs.
- Conditions 7, 8 and 12 were not run at all. They are UNVERIFIED with the
  reason written next to them, not quietly folded into the surfaces above.

## Canonical journeys

The work queue lives in [PRODUCT_JOURNEYS.md](PRODUCT_JOURNEYS.md). A journey
without browser evidence is unfinished, however green the tests are.

## Loop state

Every iteration is recorded in [PROMOTION_LOG.md](PROMOTION_LOG.md) — journey
exercised, defect fixed, evidence path, conditions newly passing. Loop state
lives in git, never in an agent's memory, so any agent can resume the loop cold.

## Current scorecard

Baseline pass, 2026-08-13. Nothing was fixed in this pass — this is a starting
line, not a result. This repo is marked **DEFERRED** pending marketplace
consolidation with NodeAgentSpec, so every row below is **provisional**: it
describes the tree at commit `9537bbd`, and a consolidation that changes the
package boundary invalidates it.

| # | Condition | Status | Evidence / reason |
|---|-----------|--------|-------------------|
| 1 | Journeys succeed end-to-end in a real browser | FAIL | J2 completed as of iteration 2: the same reproduction — adopt the protocol, `git add CHANGELOG && git commit`, drop the untracked empty lane dirs as a clone would, `node bin/init.mjs add pages dashboard` — now exits **0** and writes the lane, because `add` creates the directory it needs. J1/J3 pass, J5 unverified. Still FAIL overall: J4 completes but renders wrong on phones (row 3), and no journey has been driven in a browser since the baseline. |
| 2 | No critical or major usability defect open | FAIL | D1 is closed in iteration 2. D2 (major, row 3) is still open in the [defect ledger](PROMOTION_LOG.md#defect-ledger), so this stays FAIL. |
| 3 | Mobile and desktop both intentional | FAIL | `templates/gmail-magic-resend.html` ships no `<meta name="viewport">`. Measured in the rendered page on an emulated Pixel 8 (375 CSS px): `document.documentElement.clientWidth === 980` and `visualViewport.scale === 0.383` — the browser fell back to its legacy 980px desktop layout and shrank the page to 38%. The file's own body copy reads "Open this from Gmail on desktop **or phone**", so mobile is claimed, not out of scope. Desktop at 1280 is fine. |
| 4 | No horizontal overflow at supported widths | PASS | Measured in the rendered page. Desktop 1280: `scrollWidth 1280 === clientWidth 1280`. Mobile preset: `.card` is 810px inside the 980px layout viewport; `scrollWidth 981` vs `clientWidth 980` — a 1px emulator rounding artifact, no scrollable content overflow. Recorded verbatim so a reader can disagree with the call. |
| 5 | Loading/empty/success/error/agent-running designed | PASS | CLI surface. Eight states driven, each with a distinct message and a correct exit code: `init` 0 (success), `init` on an existing `CHANGELOG/` 0 (warning, refuses to clobber), `add` 0, `add` duplicate 1, `add widgets Thing` 1 (bad category), `qa` with no argument 1, `qa` duplicate 1, `install nonsense` 1. Loading and agent-running have no subject here: every verb is synchronous file scaffolding (row 10), and the product runs no agent. |
| 6 | Keyboard and basic accessibility pass | UNVERIFIED | Not observed. `Tab` keypresses did not reach the page — after Tab×2 at desktop width `document.activeElement` was still `BODY`, because the Browser pane was not compositing frames in this session (the same reason `screenshot` timed out). Static attributes are present (`lang="en"`, a `<title>`, one `<h1>`, three `<th>` inside `<thead>`, zero images missing `alt`) but that was **read, not observed**, so it is not a PASS. |
| 7 | Web Interface Guidelines: no major unresolved | UNVERIFIED | Review not run in this pass. |
| 8 | Web-quality audit: no major unresolved | UNVERIFIED | No Lighthouse / Core Web Vitals run was performed in this pass. |
| 9 | No unexplained console errors or failed requests | PASS | Rendered `gmail-magic-resend.html` over `http://127.0.0.1:8931`. `read_console_messages` returned "No console logs"; all three document requests returned `200 OK`. The page loads no scripts, fonts or images. |
| 10 | Performance does not obstruct interaction | PASS | CLI surface, four timed runs on Node v22.22.2 including interpreter startup: `init` 403ms / 369ms / 370ms, `qa` 495ms. Caveat recorded: the browser artifact was never interactively driven (row 6), so this PASS covers the CLI only. |
| 11 | Tests and build green | PASS | `npm test` → exit **0**; `npm install` → exit **0** (zero dependencies). Disclosed rather than hidden: the test script is literally `node bin/init.mjs --help`, a smoke print with **zero assertions**, and the package has no build step. The greenness is real and near-vacuous — logged as D4. |
| 12 | Verified in the rendered app, not inferred from code | UNVERIFIED | The condition has no subject yet: this is a baseline and no improvement was made. Separately, part of the row-6 evidence was read rather than observed, which is exactly what this condition exists to catch. |

**Status: NOT PROMOTED** — 5/12 PASS, 3 FAIL, 4 UNVERIFIED.
