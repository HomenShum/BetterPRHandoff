---
name: easier-to-read-submissions
description: Make every code submission (commit, branch, PR) easier to read for the next person picking it up — human or AI. Forces per-surface changelog entries (one append-only file per page/component/server module/db table/integration/script, not one undifferentiated git log) and (when UI changed) a verified demo recording with both DOM checks and Gemini video analysis. Use any time you commit, push, open a PR, hand off a branch, or finish a task that touched user-facing code.
trigger: when user says "commit", "push", "PR", "open a pull request", "ship this", "I'm done with X", "wrap this up", "finalize the branch", "hand this off", "what changed", "changelog", "record a demo", "verify the demo", "before we hand off", "before jaynee pulls", "for the next agent", "make this easier to read", "for the reviewer", "for the next person"
version: 1.0.0
---

# Easier-to-read submissions

A code submission — a commit, a branch, a PR, a hand-off — that the next person can read without spelunking. The next person might be your reviewer, your future self three months from now, the engineer you're handing the project to, or the next AI agent picking up the branch. They all benefit from the same protocol.

You are about to commit, push, open a PR, or hand off a branch. Before you call the change "done," you owe two artifacts that make the submission readable:

1. **Per-surface changelog entries** — one entry in each lane file for every surface your diff touched. Append-only, dated, cross-linked.
2. **(When the change touched a screen the demo asserts)** A re-recorded, verified demo MP4 + GIF + evidence JSON. Both DOM checks and a Gemini video pass must succeed before you push.

Both halves exist because **a code diff alone is illegible** to the next person on the branch — human or AI. Without per-surface lanes, the next contributor has to read the whole `git log` to understand what one screen used to look like. Without a verified demo, your "this works" claim is unfalsifiable.

This protocol came out of the SitFlow → Jaynee handoff — see [`https://github.com/HomenShum/easier-to-read-submissions`](https://github.com/HomenShum/easier-to-read-submissions) for the public skill repo and the original use case.

---

## Phase 1 — Per-surface changelog lanes (always)

### What a "lane" is

For every user-facing surface in the repo (page, component, server module, db table, integration, script), there's an append-only changelog file at `CHANGELOG/<category>/<slug>.md`. The repo's top-level `git log` is one undifferentiated stream — useful for "what shipped this week," useless for "what has the Inbox screen looked like over time." Per-surface lanes solve that.

### When you change code

1. **Identify every surface your diff touched.** Look at `git status` + `git diff --stat`. A typical change touches 1-3 surfaces. Multi-surface = multiple lane updates.

2. **For each touched surface**, find its lane file (e.g., `CHANGELOG/components/CareCard.md`). If the lane doesn't exist, **create it** using `templates/lane.md` from this skill. Slug naming: replace `/` with `-`, drop extension, drop angle brackets and parens. Examples:
   - `components/CareCard.tsx` → `CHANGELOG/components/CareCard.md`
   - `app/(tabs)/index.tsx` → `CHANGELOG/pages/tabs-index-inbox.md`
   - `server/_core/index.ts` → `CHANGELOG/server/_core-index.md`
   - Database table named `care_rules` → `CHANGELOG/db/care_rules.md`

3. **Prepend a new entry at the top** of each lane file (right after the file header, before the previous most-recent entry). Use the entry template — every lane file ends with one. **Never delete or rewrite old entries.** The audit trail is the whole point.

4. **Cross-link multi-surface changes via `**Touches**:`** — same date, same commit hash on every entry. Each entry lists the other lanes it cross-references. Bidirectional linkage means the next agent can grep into any lane and find every related change.

### Entry format

```md
## YYYY-MM-DD — Short imperative title
What changed and **why** (1-3 sentences, written for the next person who has to maintain this — not for you, the original author). Mention any user-visible effect.
**Commit**: `<7-char sha>`. **Author**: <name>.
**Touches**: `<other CHANGELOG files affected>` (omit if none)
```

Date is `YYYY-MM-DD` (drop time and timezone). Title is imperative ("Add toast on save" not "Added a toast on save"). The 1-3 sentence body answers the next maintainer's question — what + why + user-visible effect. Anything longer belongs in the commit body, not the lane.

### What does NOT get an entry

- Pure formatting fixes / lint runs / typo corrections
- Lockfile bumps from a deps install
- Generated-file regenerations (drizzle migrations, pnpm-lock changes)

If in doubt: would the next maintainer care about this change three months from now? If no, skip the entry.

### CHANGELOG/README.md and TEMPLATE.md

The first time you set up the lanes in a repo, scaffold:
- `CHANGELOG/README.md` — master index organized by category
- `CHANGELOG/TEMPLATE.md` — format spec (this section, basically)

Both ship in `templates/` of this skill. Copy them, then fill in the index with the lane files specific to your repo.

### Bootstrapping an existing repo (one-time)

If a repo doesn't have lanes yet, **dispatch parallel subagents to read `git log --follow` per file and write entries from the commit bodies**. Don't invent entries — only write entries for commits that actually touched the file. See `templates/bootstrap-prompt.md` for the prompt to give each subagent. Slice by category (pages / components / server / db / integrations / scripts) so 4-6 agents can run in parallel without overlap.

---

## Phase 2 — Verified demo recording (when the change touches an asserted scene)

### When to re-record

Skip this phase entirely if your change is server-only or doesn't affect the UI.

Re-record if your diff touched:
- Any DOM string the recorder asserts via `bodyContains([...])` — copy edits, label changes, route renames
- Any layout that the recorder pans through — if you moved a section above/below the fold, the `smoothPan()` offsets need updating
- Any AI extraction behavior the recorder validates

If you're not sure, re-record anyway. The recorder is fast (~75s for a 5-scene demo).

### The recipe

Two scripts, one pipeline:

1. **`scripts/record-jaynee-demo.mjs`** (or whatever the repo names it) — Playwright drives the live PWA. Each scene is a function that:
   - Navigates to a route
   - Optionally smooth-pans the inner scroller through multiple stops (RN-Web inner scrollers are taller than the viewport — content past the fold won't be in the recorded video unless you scroll to it)
   - Asserts every claim via `bodyContains([...])` → records pass/fail in evidence JSON
   - Holds the final frame for ~1.5-2.5s so viewers can read it

2. **`scripts/verify-jaynee-demo.mjs`** — two-layer verifier:
   - **Local**: video exists, duration in expected range, all required DOM checks passed in the evidence JSON
   - **Gemini**: uploads the MP4 to Gemini Files API (resumable), polls for `ACTIVE` state, asks gemini-2.5-flash to confirm each scene's expected content is **visibly on screen**. Returns PASS / PARTIAL / FAIL with per-scene reasoning.

If Gemini flags a scene as PARTIAL or FAIL, the content is in the DOM (local checks passed) but past the fold in the recorded video. Update the scene's `smoothPan()` offsets, re-record, re-verify. Repeat until PASS.

### Evidence JSON

Every recorder run writes `out/<demo-name>-evidence.json` with:
- `pwaUrl`, `apiUrl`, `viewport`, `createdAt`
- `scenes[]` — label + duration per scene
- `checks{}` — every DOM assertion key with `{ ok, note?, at }`
- `outputs{}` — paths to mp4, gif, gif720

This JSON is what reviewers grep when they ask "did the AI extraction actually fire?" — they read `liveAi.formFilled.note` instead of having to watch 71 seconds of video.

### Templates ship in this skill

- `templates/recorder.mjs` — adapt to your repo's routes
- `templates/verifier.mjs` — adapt the per-scene prompt to your asserts
- `templates/probe-routes.mjs` — diagnostic for "Gemini says X is off-screen, is it actually in the DOM?"

---

## Phase 3 — Verify before claiming done (the live-DOM rule)

Before you say "deployed," "shipped," "live," "the site now shows X," or anything in that family:

1. **Push** with `git push <remote> <branch>`.
2. **Confirm the commit landed on the remote** with an authenticated query:
   ```bash
   gh api repos/<owner>/<repo>/branches/<branch> --jq '{sha: .commit.sha[0:8], msg: (.commit.commit.message | split("\n")[0])}'
   ```
3. **For each artifact you claimed shipped**, fetch it from the remote and confirm it's there. For demo files, hit the GitHub API for that path. For deployed apps, fetch the live URL and grep the response for the concrete content signal you promised (a testid, a specific string, a count). Three landmines this catches:
   - GitHub→Vercel/Netlify webhooks silently disconnected (pushes land, nothing rebuilds)
   - Next.js App Router Suspense traps (client components with `useSearchParams` only render fallback in SSR — crawlers/agents see a blank shell)
   - CDN-cached stale HTML

If the signal is not in the raw HTML/API response, the change is not shipped — regardless of what the build log said.

This rule supersedes optimistic deploy language. CLI exit codes lie, build logs lie, "Deployment Ready" badges lie. The only thing that doesn't lie is the live URL or the authenticated API.

---

## Phase 4 — Runtime change diagram (when the change crosses 2+ layers)

When a change touches more than one runtime layer, prose alone is illegible. A reviewer should not have to read three files in three directories to understand how data moves through your change. Draw an ASCII diagram.

### The five layer categories

1. **DEPLOY** — hosting / CDN / edge (Vercel, GitHub Pages, Cloudflare Pages, Netlify, Render, Fly.io, AWS Amplify). Sits at the very top. The user URL terminates here.
2. **FRONTEND** — React / RN / Vue / Svelte components, screens, routes, client-side state.
3. **BACKEND** — Express / tRPC / Next API routes / Hono / Fastify modules, endpoints, middleware.
4. **DATABASE** — MySQL, Postgres, SQLite, MongoDB, Convex, DynamoDB. Show table boxes with FK lines inline.
5. **AGENT** — LLM prompts, tool schemas, model choice, cost cap, multimodal inputs.

Drop any layer that didn't change in your diff.

### When to draw one

- Always for **new features that span layers** (e.g., "add care plan extraction" touches frontend + backend + db + agent — 4 layers).
- Always for **migrations** that change data flow (e.g., "swap LLM provider", "move from REST to WebSocket").
- Always when **introducing a new layer** or **alternate stack** (e.g., adding a Convex foundation alongside MySQL — see "Parallel stacks" below).
- Always when **changing the deploy target** (Vercel ↔ Render, GitHub Pages enabled, custom domain wired).
- **Skip** for single-layer changes (CSS tweak, server-only refactor with no API change, db-only column rename).

### Parallel stacks (live + dormant alternatives)

If your repo has more than one stack for the same layer (e.g., MySQL today + Convex scaffolded for later, or Express today + Next API routes planned), show **both side-by-side** with one labeled `· LIVE` and the other `· DORMANT` or `· PARALLEL (ready to activate)`. This is more honest than hiding the dormant stack — readers see what tech debt / migration paths exist without having to grep `convex/` or `web/` to discover them.

### Format

Top-to-bottom flow with arrows showing **data flow direction** (not just imports):

```
┌────────────── DEPLOY ────────────────┐
│  Vercel project + URL                │
│  build command, output dir           │
│  cache rules                         │
└────────────────┬─────────────────────┘
                 │ user fetches index.html, then JS bundle
                 ▼
┌────────────── FRONTEND ──────────────┐
│  files + components touched          │
│  + NEW   ~ MODIFIED   - REMOVED      │
└────────────────┬─────────────────────┘
                 │ <protocol> (tRPC / REST / WebSocket / fetch)
                 ▼
┌────────────── BACKEND ───────────────┐
│  modules touched, endpoints added    │
└────────────────┬─────────────────────┘
                 │ <ORM / driver> (Drizzle / Prisma / Convex client / raw SQL)
                 ▼
┌────── DATABASE (LIVE) ────────┐  ┌────── DATABASE (PARALLEL) ──────┐
│  MySQL via Drizzle            │  │  Convex (dormant — schema       │
│  tables, columns, FKs         │  │   mirrored, awaiting activation)│
└─────────────────┬─────────────┘  └─────────────────────────────────┘
                  │ <triggers> (e.g., M&G transcript → extract)
                  ▼
┌────────────── AGENT ─────────────────┐
│  prompts, tools, schemas, model      │
│  cost cap if applicable              │
└──────────────────────────────────────┘

Legend:  + NEW   ~ MODIFIED   - REMOVED   · UNCHANGED   · LIVE   · DORMANT
```

If the change is frontend↔backend with no DB / AGENT / DEPLOY touched, draw two boxes. The DEPLOY box specifically is mandatory whenever the change affects what gets shipped to production (env vars, build commands, output dirs, redirects, headers).

### Where the diagram lives

- **Inline in the commit body** for small/medium changes (most cases).
- **In each affected CHANGELOG lane entry** when the diagram is small (collapse to the slice that lane cares about — frontend lane shows frontend + the immediate adjacent layer).
- **In the PR description** as the headline — reviewers should see it before they see the diff.
- **At the top of `docs/RUNTIME.md`** if the repo wants an always-current architecture diagram. Append a new "Last change" footer section per major change.

### Use the template

`templates/runtime-diagram.md` ships a copy-paste skeleton with three worked examples (single-layer, two-layer, four-layer). Read it before drawing your first diagram in any repo.

---

## Phase 5 — QA dogfood relay (when handoff matters)

When a feature is ready for review by another human or AI agent — design partner, PM, the next agent picking up the branch, your own future self — produce a **QA packet**. The packet is the single artifact every reviewer opens; it carries every visual, every state, every link they need to evaluate the change without spinning up the app.

A QA packet contains:
- Preview deploy URL (live, clickable)
- Per-state test URLs (deterministic seed via query params)
- Before / after screenshots, full-page + per-component snippets
- GIFs of key workflows
- Optional Remotion end-to-end demo video
- Pre-rendered email HTML (Gmail Magic Resend — same thread updates on regenerate)
- Per-state QA verdicts and fix prompts

### When to generate one

- Feature branch ready for review
- UI change spans 2+ user states
- Cross-functional reviewer involved (PM / design / ops / QA)
- Branch handoff (engineer → engineer, AI → human, agent → agent)
- About to claim "shipped" — packet becomes the falsifiable record

### How — split: protocol (this skill) vs. generator (separate tool)

This skill ships only the **schema + email template + protocol doc**:
- [`templates/qa-packet-schema.json`](templates/qa-packet-schema.json) — JSON schema every packet conforms to
- [`templates/qa-email.html.mustache`](templates/qa-email.html.mustache) — Gmail Magic Resend template
- [`templates/qa-states.example.json`](templates/qa-states.example.json) — consumer config example
- [`templates/qa-packet.md`](templates/qa-packet.md) — full protocol doc (read this once)
- [`INTEGRATIONS.md`](INTEGRATIONS.md) — which generators implement the contract

Generation (Playwright capture, diff, GIF, Remotion video, Gmail send, hosted review page) lives in a separate generator like **Parity Studio** (`HomenShum/parity-studio`) or the lightweight **SitFlow scripts** (`scripts/record-jaynee-demo.mjs`). Pick the one that fits your scale.

### Lifecycle

```
1. author finishes change on branch
2. author writes (or already has) qa.config.json declaring states
3. `npx easier qa-init` (one-time per repo) scaffolds qa.config.json from the example
4. `parity-studio qa-packet --feature <id>`   # captures before+after, builds packet.json
5. `parity-studio qa-send --to <email>`        # Gmail Magic Resend
6. reviewers open email → click side-by-side review → leave verdicts
7. author fixes → re-runs step 4 → version bumps → resend updates same thread
8. qaStatus moves to approved → shipped
```

The generator and consumer never share product code — they share **the schema**. That's the whole point.

### Skip the QA packet for

- Server-only changes (no UI surface affected)
- Single-state changes that the verified demo (Phase 2) already covers
- Trivia / typos / formatting

---

## Commit message style

Brief subject (60 chars, imperative). Body is wrapped at 72 chars and explains the **why**, not the **what** — readers can `git diff` for what.

If your commit:
- Closes a dogfood QA hit, name the hit ("QA hit #3 — toast on save")
- Implements a planned phase, reference the doc ("AGENT_PLAN Phase 1, fail-closed gate")
- Fixes a regression, link the breaking commit ("regressed by `abc1234`")

End every commit message with:
```
Co-Authored-By: Claude <noreply@anthropic.com>
```

(Customize the model name / version per your runtime.)

---

## When to break the protocol

You skip the lane-update for:
- Generated-file commits (drizzle migrations, lockfile updates)
- Pure formatting commits (run `prettier`, no logic change)
- Branch-mechanics commits (`git mv`, dependency rename, no behavior change)

You skip the demo-record for:
- Server-only changes (no UI surface affected)
- Changes that don't touch any asserted DOM string
- Pre-release scaffolding work where no demo exists yet

You **never** skip the live-DOM verification on anything claiming a deploy.

---

## Quick reference

| Step | Tool | Output |
|---|---|---|
| Identify touched surfaces | `git diff --stat` | List of file paths |
| Find lane files | `find CHANGELOG -name '*.md'` | One file per surface |
| Prepend entry | Edit | New `## YYYY-MM-DD ...` block at top |
| (UI changed) Re-record | `node scripts/record-*.mjs` | `out/*.mp4`, `out/*.gif`, `out/*-evidence.json` |
| (UI changed) Verify | `node scripts/verify-*.mjs` | PASS / PARTIAL / FAIL + per-scene reasons |
| Commit | `git commit -m ...` | Local commit |
| Push | `git push origin <branch>` | Remote update |
| Verify remote | `gh api repos/.../branches/<branch>` | Authenticated SHA confirmation |
| Verify deploy | `fetch(liveURL)` + grep for content signal | Concrete proof, not log claim |
| (Multi-layer change) Draw runtime diagram | ASCII boxes + flow arrows | Visual map of data flow across layers |

---

## Resources in this skill

- `templates/CHANGELOG-README.md` — master index template (drop into `CHANGELOG/README.md` and customize)
- `templates/CHANGELOG-TEMPLATE.md` — format spec (drop into `CHANGELOG/TEMPLATE.md`)
- `templates/lane.md` — one-lane template (copy when creating a new lane)
- `templates/bootstrap-prompt.md` — prompt for parallel subagents to backfill lanes from `git log`
- `templates/recorder.mjs` — Playwright recorder template (adapt scenes to your routes)
- `templates/verifier.mjs` — Gemini video verifier template
- `templates/probe-routes.mjs` — diagnostic script

If you're working in a repo that already has `CHANGELOG/` and `scripts/record-*.mjs`, follow them. If it doesn't, scaffold from these templates.
