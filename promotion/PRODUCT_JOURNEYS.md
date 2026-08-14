# Canonical journeys — BetterPRHandoff

Five real workflows. Not feature tours: a journey is one person, one goal, and
the artifact they hold when it worked. These are the promotion loop's work
queue, exercised in order of importance.

**A journey with no browser evidence is unfinished**, regardless of test status.

Reduced gate: this package has no application of its own. Four of the five
journeys below finish in a terminal, because that is the surface a stranger
meets. J4 is the only one that ends in a browser, and it is the only journey
that can carry browser evidence at all.

## Journey shape

Each journey states, in this order:

- **Persona and situation** — who arrived, and why today.
- **Goal** — what they want to be true when they leave.
- **Steps** — what they actually do, in the UI, in order.
- **Done when** — the observable artifact or state that proves completion.
- **Evidence** — path to the capture that shows it working. Empty until proven.

---

## J1 — "Get this history thing into my repo without reading a manual"

- **Persona and situation:** A solo engineer read the README, has a repo with a
  messy commit log, and wants the scaffold in place before she forgets about it.
  She has never run this package and will not clone it first.
- **Goal:** A `CHANGELOG/` folder exists in her repo, with a master index and a
  format spec she can hand to a teammate.
- **Steps:**
  1. `cd` into her own repo.
  2. `npx @homenshum/easier-to-read-submissions@1.2.1 init` — the exact command
     from README line 29 / line 47, run from the public npm registry.
- **Done when:** exit 0, and `CHANGELOG/README.md` + `CHANGELOG/TEMPLATE.md`
  exist alongside six lane subdirectories.
- **Drives:** `bin/init.mjs` → `init()`, copying `templates/CHANGELOG-README.md`
  and `templates/CHANGELOG-TEMPLATE.md`.
- **Evidence:** PASS, baseline 2026-08-13. Ran from an empty directory against
  the published `@homenshum/easier-to-read-submissions@1.2.1` (registry version
  confirmed with `npm view`). Exit 0; `ls -R` showed `CHANGELOG/README.md`,
  `CHANGELOG/TEMPLATE.md`, and `components/ db/ integrations/ pages/ scripts/
  server/`. Terminal transcript in [PROMOTION_LOG.md](PROMOTION_LOG.md).

## J2 — "My teammate cloned the repo and wants to add a lane"

- **Persona and situation:** The second engineer on the team pulls the branch
  after J1 was committed. He touched the dashboard page and, per the protocol in
  `AGENTS.md`, owes that surface a changelog entry.
- **Goal:** A new lane file `CHANGELOG/pages/dashboard.md` exists in his clone,
  ready for its first dated entry.
- **Steps:**
  1. `git clone <the repo>` and `cd` into it.
  2. `npx @homenshum/easier-to-read-submissions add pages dashboard` (or, from
     a clone of this repo, `node bin/init.mjs add pages dashboard`).
- **Done when:** exit 0 and `CHANGELOG/pages/dashboard.md` exists with today's
  date pre-filled.
- **Drives:** `bin/init.mjs` → `addLane()`, reading `templates/lane.md`.
- **Evidence:** **FAIL**, baseline 2026-08-13 — defect D1. Exit **1**,
  `✗ ...\CHANGELOG\pages does not exist`. `git ls-files` in the origin repo
  shows only `CHANGELOG/README.md`, `CHANGELOG/TEMPLATE.md` and the one lane
  file that had content; the five empty lane directories `init` created were
  never tracked, because git does not track empty directories and `init()`
  writes no `.gitkeep`. The recovery the error message named then printed
  `! CHANGELOG/ already exists ... Skipping scaffold` and exited 0 without
  repairing anything — a closed loop with no way out but `mkdir`.
- **Evidence:** **PASS**, iteration 2, 2026-08-13 — D1 closed. Same
  reproduction re-run against this tree: `git init` a temp repo, `init`,
  `git add CHANGELOG && git commit`, `git ls-files` → still exactly
  `CHANGELOG/README.md` and `CHANGELOG/TEMPLATE.md` (git's behaviour did not
  change and was never the thing to fix), delete the five empty lane dirs to
  reproduce what a clone hands the second person, then
  `node bin/init.mjs add pages dashboard` → **exit 0**,
  `✓ Created CHANGELOG\pages\dashboard.md`, file present on disk. `add` now
  creates the lane directory instead of demanding it.

## J3 — "Wire the protocol into whichever agent I actually use"

- **Persona and situation:** Someone on Cursor, not Claude Code, wants their
  agent to follow the protocol before every commit. The README promises six
  install targets and an auto-detect.
- **Goal:** The instruction file lands where their specific agent reads it.
- **Steps:**
  1. `npx @homenshum/easier-to-read-submissions install` (auto), or the same
     with `cursor` / `cline` / `aider`.
- **Done when:** exit 0 and the agent-specific path exists — `.claude/skills/
  easier-to-read-submissions/` for project mode, `.cursor/rules/
  easier-to-read-submissions.md` for Cursor, `.clinerules` for Cline,
  `AGENTS.md` for Aider — each with the `templates/` directory beside it.
- **Drives:** `bin/init.mjs` → `install()`.
- **Evidence:** PASS, baseline 2026-08-13. Four targets driven in throwaway
  directories. Auto-detect in a git repo chose `project` and wrote
  `.claude/skills/easier-to-read-submissions/{SKILL.md, AGENTS.md, templates/×14}`,
  exit 0. `install cursor` → `.cursor/rules/easier-to-read-submissions.md` +
  `templates-easier/`, exit 0. `install cline` → `.clinerules` +
  `.cline-easier-templates/`, exit 0. `install aider` → `AGENTS.md`, exit 0.
  `install nonsense` → exit 1 with the valid-target list. `SKILL.md` carries
  valid `name:`/`description:` frontmatter, so the Claude Code path loads.

## J4 — "Hand a reviewer one page they can open on their phone"

- **Persona and situation:** An engineer finished a UI change and wants the
  reviewer — who checks things on a phone between meetings — to open one page
  with the preview link, the per-state lanes, and approve/needs-fix buttons.
  This is the only browser surface the package produces.
- **Goal:** A self-contained HTML page exists that reads correctly on a desktop
  browser and on a phone.
- **Steps:**
  1. `npx @homenshum/easier-to-read-submissions qa nodebench-chat-v1`.
  2. Open `QA_DOGFOOD/nodebench-chat-v1/gmail-magic-resend.html` in a browser.
  3. Look at it at desktop width and at phone width.
- **Done when:** the page renders legibly at both widths, with no console errors
  and no failed requests.
- **Drives:** `bin/init.mjs` → `scaffoldQaPacket()` →
  `templates/gmail-magic-resend.html`, `qa-dogfood-manifest.json`,
  `qa-dogfood-packet.md`, `remotion-storyboard.json`.
- **Evidence:** **FAIL on the phone half**, baseline 2026-08-13 — defect D2.
  Scaffold step is clean: exit 0, four files written, feature id slugified into
  the title. Desktop 1280 is clean: `scrollWidth === clientWidth === 1280`, zero
  console messages, three requests all `200`. Phone is not: with no
  `<meta name="viewport">` the emulated Pixel 8 (375 CSS px) reported
  `clientWidth 980` and `visualViewport.scale 0.383`, so the 13px table text
  renders at roughly 5 effective pixels. The page's own copy invites exactly
  this ("Open this from Gmail on desktop or phone").
- **Evidence:** **PASS**, iteration 3, 2026-08-13 — D2 closed, re-proved in the
  browser rather than inferred from the diff. Driven by
  `node promotion/evidence/audit.mjs`, which scaffolds the packet with the
  product's own `qa` verb, serves it, and drives Playwright chromium at three
  widths. At 375×812 with `isMobile: true`: `clientWidth` **375** (was 980),
  `visualViewport.scale` **1** (was 0.383), table text **13** effective px (was
  4.97), horizontal overflow **0 px** (was 1). Screenshots for all three widths,
  zero console errors, zero failed requests:
  [`promotion/evidence/`](evidence/). The reviewer's phone half of this journey
  now works.

## J5 — "Prove the demo I recorded actually shows what I claim"

- **Persona and situation:** Same engineer, now at README Phase 2. They want the
  Playwright recorder plus the Gemini video pass that the README says must both
  succeed before pushing.
- **Goal:** An MP4, a GIF and an evidence JSON that a reviewer can trust.
- **Steps:**
  1. Copy `templates/recorder.mjs` into their repo and run it against their app.
  2. Run `templates/verifier.mjs` over the recording.
- **Done when:** both the DOM checks and the Gemini pass report success.
- **Drives:** `templates/recorder.mjs`, `templates/verifier.mjs`,
  `templates/probe-routes.mjs`.
- **Evidence:** **UNVERIFIED** — not run, for two stated reasons. (a) It needs
  `GEMINI_API_KEY`; this pass does not create or rotate secrets, and
  `verifier.mjs:245-247` reads the key and skips content verification when it is
  absent, so a run would prove only the local half. (b) It needs `playwright`, which is not a dependency of
  this package (`package.json` has none) and needs a running target app. A third
  finding surfaced from reading, and is logged as D3 rather than scored: the
  file is not a template — it asserts SitFlow's literal strings (`'SitFlow'`,
  `'Booking inbox'`, `'No human food'`, `'Walk after every nap'`, `'Care Rules'`)
  and `sitflow:`-prefixed localStorage keys, so a stranger who copies it gets a
  recorder pointed at somebody else's product.
- **Evidence:** **FAIL**, iteration 3, 2026-08-13 — defect **D8**. This journey
  is no longer merely unverified; it is undrivable. Wave 3 closed D3 by deleting
  all three files step 1 and step 2 name, and nothing replaced them:

  ```bash
  git ls-files templates/ | grep mjs     # no output, exit 1
  ```

  The journey is deliberately left in place rather than deleted, because
  deleting a journey to make a scorecard read better is the failure the gate
  exists to catch. README lines 15, 70 and 109 still present the verified demo
  as one of the three things this skill delivers; line 177 discloses that the
  implementation was removed. Both cannot be true for a reader who stops at
  line 15. Closing this needs either a framework-agnostic recorder or a README
  that promises only what ships — a decision, not a measurement, which is why
  this pass records it instead of picking one.

---

## Journeys every agent surface owes

**None of the three apply, and that is a decision rather than an omission.**
BetterPRHandoff never runs an agent on the user's behalf. It ships markdown
rules (`AGENTS.md`, `SKILL.md`) that the user's *own* agent reads, plus a
synchronous file-scaffolding CLI whose longest verb takes 495ms. There is no
run to recover from, no run to steer mid-flight, and no consequential action
this product takes that would owe the user a receipt — the only writes are new
files in the user's working tree, which `git status` already accounts for, and
every verb refuses rather than overwrites when its target exists (proved by the
duplicate-`add`, duplicate-`qa` and re-`init` runs in J1/J3).

If a future version gains a verb that calls a model or mutates existing files in
place, all three become required and this section must be rewritten, not
re-justified.
