# Promotion log — BetterPRHandoff

Loop state lives here, in git, so any agent can resume cold. One entry per
iteration. Append; never rewrite history, because the list of things that turned
out to be wrong is more useful to the next reader than the current values alone.

Iteration cap: **10** (default). On reaching the cap without a gate pass, stop
and leave the remaining defect ledger below — a documented stop is a valid
outcome; a silent one is not.

## Entry shape

```
### Iteration N — YYYY-MM-DD
- Journey exercised: J<k> <name>
- Observed: <the defect, with its reproduction — inputs, width, state>
- Fixed: <the change, using existing components; file paths>
- Re-proved: <evidence path showing the defect gone in the rendered app>
- Tests: <command and result>
- Conditions newly PASS: <numbers, or "none">
```

---

## Baseline — 2026-08-13

**This repo is marked DEFERRED**, pending marketplace consolidation with
NodeAgentSpec. Everything below is therefore **provisional**: it measures the
tree at commit `9537bbd` on `main`, and a consolidation that moves or merges the
package boundary invalidates these rows rather than updating them. Re-run the
baseline after consolidation; do not carry these numbers forward.

- **Repo shape:** a protocol (`AGENTS.md`, `SKILL.md`) plus a zero-dependency
  Node CLI (`bin/init.mjs`, 323 lines) and 14 files in `templates/`. No web app,
  no server, no build step, no test suite. Gate variant `reduced` is correct.
- **App started:** not applicable — there is no app to start. The equivalent was
  run instead: **`npm install` → exit 0** (zero dependencies, "up to date in
  2s"), **`npm test` → exit 0**, and the published package driven live from the
  registry with **`npx --yes @homenshum/easier-to-read-submissions@1.2.1 init`
  → exit 0** (`npm view` confirms `latest: 1.2.1`).
- **Browser:** the only HTML this package emits was served over
  `http://127.0.0.1:8931` and inspected at 1280×800 and at the 375×812 Pixel 8
  preset. Screenshots could not be captured — the Browser pane was not
  compositing frames in this session, so `computer{screenshot}` timed out after
  5s. Evidence for conditions 3, 4 and 9 is therefore live DOM and viewport
  measurement taken inside the rendered page, not images. Condition 6 is
  UNVERIFIED for the same root cause: `Tab` keypresses never reached the
  document.
- **Journeys drivable: 4 of 5.** J1 PASS, J2 **FAIL** (D1), J3 PASS, J4 scaffold
  passes / phone rendering **FAIL** (D2), J5 **UNVERIFIED** (needs
  `GEMINI_API_KEY` and `playwright`; this pass does not create secrets).
- **Scorecard at baseline: 5/12 PASS, 3 FAIL, 4 UNVERIFIED** — see
  [PRODUCT_GOAL.md](PRODUCT_GOAL.md).
- **Nothing was fixed.** This is a starting line. No file outside `promotion/`
  was modified.

### Commands run, with real exit codes

| Command | Exit | Note |
|---|---|---|
| `git clone --depth 50 …/BetterPRHandoff.git` | 0 | fresh tree at `9537bbd` |
| `npm install --no-audit --no-fund` | 0 | "up to date in 2s"; zero deps; leaves an untracked `package-lock.json` (not committed) |
| `npm test` | 0 | script is `node bin/init.mjs --help` — a help print, zero assertions (D4) |
| `npm view @homenshum/easier-to-read-submissions version` | 0 | `1.2.1`, `latest: 1.2.1` |
| `npx --yes @homenshum/easier-to-read-submissions@1.2.1 init` | 0 | J1 from the registry, empty dir |
| `node bin/init.mjs init` (fresh git repo) | 0 | `CHANGELOG/` + 6 subdirs |
| `node bin/init.mjs init` (existing `CHANGELOG/`) | 0 | refuses to clobber; **does not repair missing subdirs** (D1) |
| `node bin/init.mjs add components Button` | 0 | lane written, date substituted correctly |
| `node bin/init.mjs add components Button` (repeat) | 1 | "already exists" |
| `node bin/init.mjs add widgets Thing` | 1 | bad category, lists valid ones |
| `node bin/init.mjs add pages dashboard` (in a clone) | **1** | **D1** — `CHANGELOG\pages does not exist` |
| `node bin/init.mjs qa-init` | 0 | `qa.config.json` from `templates/qa-states.example.json` |
| `node bin/init.mjs qa-init` (repeat) | 0 | warns, no write |
| `node bin/init.mjs qa nodebench-chat-v1` | 0 | 4 files under `QA_DOGFOOD/nodebench-chat-v1/` |
| `node bin/init.mjs qa` (no arg) | 1 | usage |
| `node bin/init.mjs qa nodebench-chat-v1` (repeat) | 1 | "already exists" |
| `node bin/init.mjs entry CHANGELOG/components/Button.md` | **1** | **D5** — "Unknown command: entry", yet documented at `bin/init.mjs:10` |
| `node bin/init.mjs install` (auto) | 0 | detected `project`, wrote 18 files |
| `node bin/init.mjs install cursor` / `cline` / `aider` | 0 | each target's path written |
| `node bin/init.mjs install nonsense` | 1 | lists valid targets |
| `python -m http.server 8931` + browser inspect | served | 3 requests, all `200`, zero console messages |
| `computer{action:screenshot}` | **failed** | "Browser pane is not displayed, so the page is not compositing frames" |

### Timings (condition 10, Node v22.22.2, includes interpreter startup)

`init` 403ms / 369ms / 370ms · `qa` 495ms.

## Defect ledger

Open defects, most-impactful first. A defect is only listed once it has a
reproduction; a hunch is not a defect.

| # | Severity | Journey | Reproduction | Status |
|---|----------|---------|--------------|--------|
| D1 | major | J2 | In a fresh git repo: `node bin/init.mjs init` → `git add CHANGELOG && git commit` → `git ls-files` shows only `CHANGELOG/README.md`, `CHANGELOG/TEMPLATE.md` and lane files that have content. `git clone` that repo, run `node bin/init.mjs add pages dashboard` → **exit 1**, `✗ …\CHANGELOG\pages does not exist`. Git does not track empty directories and `init()` (`bin/init.mjs:98`) writes no `.gitkeep`, so five of the six lanes vanish for every teammate. The error tells them to run `npx easier init`, which then prints `! CHANGELOG/ already exists … Skipping scaffold` and exits 0 without repairing — a closed loop. Team adoption is the product's headline claim, so this breaks it at the second person. | open |
| D2 | major | J4 | `node bin/init.mjs qa demo` → open `QA_DOGFOOD/demo/gmail-magic-resend.html` at the 375×812 Pixel 8 preset. Measured in the page: `document.documentElement.clientWidth === 980`, `visualViewport.scale === 0.383`, `screen.width === 375`. `templates/gmail-magic-resend.html` has no `<meta name="viewport">`, so mobile Chrome falls back to its 980px legacy layout and shrinks everything to 38% — the 13px table text lands near 5 effective pixels. The page's own body copy says "Open this from Gmail on desktop **or phone**". Desktop 1280 is unaffected. | open |
| D3 | major | J5 | `templates/recorder.mjs` is presented by the README as a reusable template but is SitFlow's concrete recorder. It asserts literal foreign strings — `'SitFlow'` and `'Booking inbox'` (line 191), `'No human food'` / `'Walk after every nap'` / `'Never alone'` (line 260), `'Care Rules'` (line 296) — filters localStorage on a `sitflow:` prefix (line 139), defaults `PWA_URL` to `localhost:8081` and hard-codes output names `jaynee-demo.mp4` / `.gif`. Copy it into any other repo per README Phase 2 and every scene check fails against a correctly working app. It also imports `playwright`, which `package.json` does not declare. | open |
| D4 | minor | — | `npm test` exits 0 by running `node bin/init.mjs --help`. There are no assertions anywhere in the repo, so condition 11 is green in a way that cannot go red. Every CLI behaviour recorded in the table above was verified by hand this pass and is unprotected against regression — including D1, which a three-line test would have caught. | open |
| D5 | minor | J2 | `node bin/init.mjs entry CHANGELOG/components/Button.md` → **exit 1**, `✗ Unknown command: entry`. The subcommand is documented in the file's own header comment (`bin/init.mjs:10`, "entry <lane-file> Prepend a new entry to a lane (interactive)") but the dispatcher (lines 306-318) never handles it. Prepending an entry is Phase 1's central action, so the one verb that would automate it is a stub. | open |
| D6 | minor | J1 | In an empty directory, `npx easier init` succeeds and then prints as step 2: "Bootstrap from git history: see `.claude/skills/easier-to-read-submissions/templates/bootstrap-prompt.md`". That path does not exist — `test -e` returns false — because installing the skill is step 3, one line further down. The ordering is inverted: the file it tells you to read only appears after the step that follows it. | open |

## Iterations

_none yet — baseline only. Nothing was fixed in this pass by design._
