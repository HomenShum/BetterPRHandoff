# Agent instructions — easier-to-read submissions

This file is the single canonical prompt for **any** LLM-driven coding agent (Cursor, Cline, Aider, Codex, Continue.dev, GitHub Copilot Workspace, Claude Code, Devin, custom agents). Drop it in your repo as `AGENTS.md` and tell your agent: **"Follow `AGENTS.md` before every commit / push / PR."** No Claude assumptions, no special MCP tooling required — pure markdown rules + bash commands.

If your tool has a project-rule format (Cursor `.cursorrules`, Cline `.clinerules`, Aider `--read AGENTS.md`, Continue.dev `config.json` `systemMessage`), point it at this file.

---

## Your job before every commit

When the user says "commit", "push", "open a PR", "ship this", "wrap this up", or "I'm done with X" — execute this protocol before writing any commit. **Do not skip steps because they feel optional.** A submission that doesn't follow them is half-done.

### Step 1 — Identify touched surfaces

Run:
```bash
git status --short
git diff --stat
```

Group every modified file into one of six categories:
- `pages/` — user-facing screens / routes
- `components/` — reusable UI components
- `server/` — backend modules, endpoints, middleware
- `db/` — database tables (one lane per table, not per migration file)
- `integrations/` — external services (one lane per integration as a whole, e.g. "twilio-sms.md", not per file)
- `scripts/` — build / demo / ops scripts

### Step 2 — Update the changelog lane(s)

For each touched surface, find the lane file at `CHANGELOG/<category>/<slug>.md`. Slug rule: replace `/` with `-`, drop extension, drop angle brackets/parens. Examples:
- `app/(tabs)/index.tsx` → `CHANGELOG/pages/tabs-index-inbox.md`
- `components/Button.tsx` → `CHANGELOG/components/Button.md`
- `server/_core/index.ts` → `CHANGELOG/server/_core-index.md`
- DB table `users` → `CHANGELOG/db/users.md`

If the lane file doesn't exist, create it from `templates/lane.md`. If `CHANGELOG/` itself doesn't exist, run `npx @homenshum/easier-to-read init` first (or copy `templates/CHANGELOG-README.md` and `templates/CHANGELOG-TEMPLATE.md` manually, then bootstrap lanes per `templates/bootstrap-prompt.md`).

**Prepend** a new entry at the TOP of each touched lane (right below the file header, before the previous most-recent entry). Use this format exactly:

```md
## YYYY-MM-DD — Short imperative title
What changed and **why** (1-3 sentences, written for the next maintainer — not for you, the original author). User-visible effect if any.
**Commit**: `<7-char sha>`. **Author**: <name>.
**Touches**: `<other CHANGELOG files affected>`
```

Date is `YYYY-MM-DD` (drop time/timezone). Title is imperative ("Add toast" not "Added toast"). The body answers "what + why + user-visible effect" in 1-3 sentences. Never delete or rewrite old entries.

**Multi-surface changes**: write an entry in **each** affected lane, with the same date + commit hash. Cross-link via the `**Touches**:` line on every entry.

**Skip the entry for**: pure formatting commits, lockfile bumps, generated migrations, typo fixes. Rule: would the next maintainer care 3 months from now? If no, skip.

### Step 3 — When the change crosses 2+ runtime layers, draw a runtime diagram

Five layer categories: **DEPLOY → FRONTEND → BACKEND → DATABASE → AGENT**. If your diff touches two or more, draw an ASCII diagram showing data flow.

Format (use the box-drawing chars literally):

```
┌────────────── <LAYER NAME> ──────────────┐
│  files / tables / endpoints touched      │
│  + NEW   ~ MODIFIED   - REMOVED          │
└──────────────────┬───────────────────────┘
                   │ <protocol> (tRPC / REST / Drizzle / etc)
                   ▼
┌────────────── <NEXT LAYER> ──────────────┐
│  ...                                      │
└──────────────────────────────────────────┘

Legend:  + NEW   ~ MODIFIED   - REMOVED   · UNCHANGED   · LIVE   · DORMANT
```

Rules:
1. Top-to-bottom flow: DEPLOY at top, AGENT at bottom. Drop layers that didn't change.
2. Every arrow has a protocol/transport label.
3. Markers inside the box: `+ NEW`, `~ MODIFIED`, `- REMOVED`, `· UNCHANGED`.
4. **Parallel stacks** (live + dormant alternatives, e.g. MySQL live + Convex scaffolded): draw both side-by-side with `· LIVE` / `· DORMANT` / `· PARALLEL` labels. This surfaces tech debt without forcing readers to grep the repo.
5. Width fits in 100 chars. Always include the legend.
6. Drop the diagram for single-layer changes (CSS tweak, server-only refactor, db column rename) — it's noise.

The diagram goes in: **the commit body**, **each affected lane entry** (slice it to the relevant layers), **the PR description**, and optionally `docs/RUNTIME.md` for an always-current architecture doc. See `templates/runtime-diagram.md` for 4 worked examples.

### Step 4 — When the change touched UI, re-record + verify the demo

If your repo has a Playwright recorder + Gemini verifier (e.g., `scripts/record-*.mjs` + `scripts/verify-*.mjs` like SitFlow does), run them after any DOM-asserting change:

```bash
node scripts/record-demo.mjs                          # ~75s recording
node scripts/verify-demo.mjs out/demo.mp4 out/evidence.json   # local + Gemini
```

Both layers must pass before you push. The local layer asserts DOM strings exist; the Gemini layer confirms they're visibly on screen (catches "string is in DOM but past the fold"). If the recorder isn't set up yet, copy `templates/recorder.mjs` + `templates/verifier.mjs` and adapt the scenes to your routes.

### Step 5 — Live-DOM verify before claiming "deployed" or "shipped"

Never claim "deployed", "shipped", "live", or "the site now shows X" on the basis of CLI exit codes, build logs, or "Deployment Ready" badges. They lie. The only thing that doesn't lie is the live URL or authenticated API.

After pushing:
```bash
git push origin <branch>
gh api repos/<owner>/<repo>/branches/<branch> --jq '{sha: .commit.sha[0:8]}'   # confirm push landed
curl -sf <live-url> | grep -q '<concrete-content-signal>' && echo OK || echo FAIL
```

Three landmines this catches:
- GitHub→Vercel/Netlify webhooks silently disconnected (push lands, nothing rebuilds)
- Next.js App Router Suspense traps (client components with `useSearchParams` only render fallback in SSR — crawlers/agents see a blank shell)
- CDN-cached stale HTML

If the content signal is not in the raw HTML/API response, the change is not shipped — regardless of what the build log said.

### Step 5b — When the branch is ready for review by someone else, produce a QA packet

A QA packet is a single artifact that a reviewer (human or AI) opens to evaluate the change without running the app. It carries the preview URL, per-state test URLs, before/after screenshots, component snippets, GIFs, an optional Remotion demo video, and a pre-rendered email — all conforming to a shared schema so any generator (Parity Studio, SitFlow scripts, your own tool) can produce it.

When to do this:
- Feature ready for review by PM / design / another engineer / another AI agent
- UI change touches 2+ user states
- Branch handoff is happening
- You're about to say "shipped" and want a falsifiable record

When **not** to:
- Server-only changes (no UI affected)
- Single-state changes already covered by Phase-2 verified demo
- Trivia (typos, formatting)

How (the protocol):

1. Make sure `qa.config.json` exists at the repo root. If not: `npx @homenshum/easier-to-read-submissions qa-init` scaffolds it from the example.
2. Run a generator that produces a QA packet conforming to [qa-packet-schema.json](templates/qa-packet-schema.json):
   - **Parity Studio** (heavy, hosted): `npx parity-studio qa-packet --feature <id>` then `npx parity-studio qa-send --to <email>`
   - **SitFlow scripts** (lightweight): `node scripts/record-*.mjs` + manual email
   - **Your tool**: anything that writes packet.json conforming to the schema
3. The email is "magic resend" — re-running the generator updates the same email thread (`version` field bumps).
4. Reviewers click links in the email, leave per-state verdicts, hit "Needs fix" → you fix → regenerate → resend.

The consumer side is just `qa.config.json` declaring states. The generator side does the heavy lifting. Don't fork the schema — point your generator at the version published in this repo.

### Step 6 — Commit message style

Brief subject (60 chars, imperative). Body wrapped at 72 chars explaining **why**, not **what** (readers can `git diff` for what). End every commit with co-author attribution if an AI agent helped:

```
<imperative subject>

<body explaining why>

Co-Authored-By: <agent-name> <noreply@example.com>
```

---

## What does NOT need this protocol

You **skip the lane-update** for:
- Generated-file commits (drizzle migrations, lockfile updates, `pnpm install` artifacts)
- Pure formatting commits (`prettier`, no logic change)
- Branch-mechanics commits (`git mv`, dependency rename, no behavior change)

You **skip the demo-record** for:
- Server-only changes (no UI surface affected)
- Changes that don't touch any asserted DOM string
- Pre-release scaffolding work where no demo exists yet

You **skip the runtime diagram** for:
- Single-layer changes
- Pure refactors with no API change
- Trivia / typos / formatting

You **never** skip the live-DOM verification on anything claiming a deploy.

---

## How to bootstrap a repo that doesn't have CHANGELOG/ yet

If the user invokes the protocol on a fresh repo:

1. Run `npx @homenshum/easier-to-read init` to scaffold `CHANGELOG/README.md` + `CHANGELOG/TEMPLATE.md` + the six category subdirectories.
2. Inventory the repo (`find app server components -type f \( -name "*.tsx" -o -name "*.ts" \)` and equivalent for db tables, scripts, integrations).
3. Dispatch parallel subagents to backfill lane files from `git log --follow` per file. The exact subagent prompt is at `templates/bootstrap-prompt.md`.
4. Audit cross-links: `grep -hroE '(pages|components|server|db|integrations|scripts)/[A-Za-z0-9_-]+\.md' CHANGELOG/ | sort -u` and fix any references to non-existent files.
5. Commit + push.

Time budget: ~30 min for a repo with 80-100 surfaces (4-6 parallel agents).

---

## Why this protocol exists

The repo's top-level `git log` is one undifferentiated stream. Useful for "what shipped this week," useless for "what has the Inbox screen looked like over time."

Per-surface lanes solve four problems at once:

1. **Onboarding** — new contributor reads the lane for the surface they're about to touch. Learns design history, what's been tried, what's been retired.
2. **Debugging regressions** — recent entries on the broken surface are the suspect list.
3. **Career narrative** — engineer/PM can point at any one lane and explain the design evolution of that single thing. Sharper than "I worked on the whole app."
4. **Append-friendly for AI agents** — when an LLM agent makes a fix, it grep-finds the lane and prepends an entry. Deterministic, no merge drama.

Verified demos catch the gap between "the string is in the DOM" and "the string is visibly on screen." Runtime diagrams catch the gap between "I wrote the code" and "the reviewer can see how data flows." Live-DOM verify catches the gap between "the build went green" and "the change is actually shipped."

---

## Reference files

In repos that have this skill installed at `.claude/skills/easier-to-read-submissions/` (Claude Code) or vendored elsewhere:

| File | Purpose |
|---|---|
| `SKILL.md` | Long-form Claude-Code-specific version of these instructions |
| `AGENTS.md` (this file) | Agent-agnostic version |
| `templates/CHANGELOG-README.md` | Master index template |
| `templates/CHANGELOG-TEMPLATE.md` | Format spec |
| `templates/lane.md` | Single-surface lane template |
| `templates/bootstrap-prompt.md` | Parallel-subagent backfill prompt |
| `templates/runtime-diagram.md` | Format spec + 4 worked examples |
| `templates/recorder.mjs` | Playwright + smoothPan + ffmpeg |
| `templates/verifier.mjs` | Local DOM + Gemini Files API |
| `templates/probe-routes.mjs` | Diagnostic for off-screen content |

Source: https://github.com/HomenShum/easier-to-read-submissions
