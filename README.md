# BetterPRHandoff

BetterPRHandoff is the public repo for the `@homenshum/easier-to-read-submissions`
protocol and CLI. The npm package name stays stable for existing installs.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE) [![npm](https://img.shields.io/badge/npm-@homenshum%2Feasier--to--read--submissions-blue)](https://www.npmjs.com/package/@homenshum/easier-to-read-submissions) [![Works with](https://img.shields.io/badge/works%20with-Claude%20Code%20%7C%20Cursor%20%7C%20Cline%20%7C%20Aider%20%7C%20Codex%20%7C%20any%20LLM-purple)](#install-anywhere-pick-your-agent)

A drop-in protocol for **any** LLM-driven coding agent that turns "made some changes, time to commit" into a deterministic, verifiable submission. Built so the next person reading your branch — your reviewer, your future self, the engineer you're handing the project to, the next AI agent — doesn't have to spelunk through 40 commit messages to understand what changed.

Four artifacts the protocol produces per submission, automatically:

- **Per-surface changelog entries** — append-only files under `CHANGELOG/<category>/<slug>.md`, one entry per touched surface, cross-linked.
- **Verified demo recording** (UI changes only) — Playwright recorder + Gemini video analysis. Both must pass.
- **ASCII runtime diagram** (multi-layer changes) — visual map of what changed across DEPLOY → FRONTEND → BACKEND → DATABASE → AGENT, including parallel-stack labels (`· LIVE` / `· DORMANT`).
- **QA packet** (when handoff matters) — single email/page with preview link, per-state test URLs, before/after screenshots, component snippets, GIFs, optional Remotion demo, and per-state verdicts. Schema-shared so any generator (Parity Studio, your CI, custom tool) emits the same shape. Gmail Magic Resend updates the same email thread on regeneration.

---

## Install anywhere — pick your agent

```bash
# One-line install (Mac / Linux / Git Bash) — auto-detects your environment
curl -fsSL https://raw.githubusercontent.com/HomenShum/BetterPRHandoff/main/install.sh | bash

# One-line install (Windows PowerShell)
iwr https://raw.githubusercontent.com/HomenShum/BetterPRHandoff/main/install.ps1 -useb | iex

# OR via npm (works everywhere)
npx @homenshum/easier-to-read-submissions install
```

That installs the skill to the right path for whichever agent you're using. Manual paths if you'd rather:

| Your agent | Where to install | What to drop |
|---|---|---|
| **Claude Code** (per-user) | `~/.claude/skills/easier-to-read-submissions/` | full skill (SKILL.md + templates/) |
| **Claude Code** (per-repo) | `<repo>/.claude/skills/easier-to-read-submissions/` | full skill |
| **Cursor** | `<repo>/.cursor/rules/easier-to-read-submissions.md` | AGENTS.md |
| **Cline** | `<repo>/.clinerules` | AGENTS.md |
| **Aider** | `<repo>/AGENTS.md` (use with `aider --read AGENTS.md`) | AGENTS.md |
| **Codex / Continue.dev / Devin / generic LLM** | `<repo>/AGENTS.md` (point your `systemMessage` at it) | AGENTS.md |
| **No agent** (humans only) | wherever — read `SKILL.md` and apply by hand | full skill |

After install, bootstrap your repo's CHANGELOG/:

```bash
npx easier init                    # scaffolds CHANGELOG/ + TEMPLATE.md
npx easier add components Button   # add a new lane file
npx easier qa-init                 # scaffolds qa.config.json (Phase 5 / QA packet)
npx easier qa nodebench-chat-v1    # scaffolds QA_DOGFOOD/<feature-id>/ packet files
npx easier present submissions/my-change/handoff.json  # export NodeKit Present inputs
```

Then tell your agent: **"Follow `AGENTS.md` before every commit / push / PR."**

**Want the full QA packet** (preview link + before/after + GIFs + Remotion video + Gmail Magic Resend)? See [`INTEGRATIONS.md`](INTEGRATIONS.md) — this skill defines the schema, [Parity Studio](https://github.com/HomenShum/parity-studio) generates the artifacts. One contract, multiple generators.

### NodeKit Present transport

For a handoff that should become an evidence-backed presentation, describe the
existing artifacts with [`betterprhandoff.handoff/v1`](templates/handoff-schema.json)
and run the local adapter:

```bash
npx easier present submissions/my-change/handoff.json

# CI/proof mode: fail if committed output drifted from the source handoff
npx easier present submissions/my-change/handoff.json \
  --out changes/my-change \
  --check
```

The adapter writes the NodeKit `changes/<change-id>/` Change Story, claims,
Evidence Index, architecture diff, limitations, and a content-hashed receipt.
It is a deterministic file projection: it does not call a model, invent an
agent runtime, write to NodeSlide, authenticate, deploy, or publish. The
contract names and directory shape are pinned to
[`HomenShum/node-platform` commit `05b4e0e`](https://github.com/HomenShum/node-platform/commit/05b4e0e).
The archived NodeBench handoff under
[`submissions/nodebench-redesign`](submissions/nodebench-redesign) is the real
worked example; its generated output is under
[`changes/nodebench-redesign-chat-sprints-1-4-v2`](changes/nodebench-redesign-chat-sprints-1-4-v2).

---

## What it produces

Three artifacts per commit, applied based on what the change touched:

1. **Per-surface changelog entries** — append-only files under `CHANGELOG/<category>/<slug>.md`, one entry per touched surface, cross-linked.
2. **Verified demo (UI changes only)** — Playwright recorder + Gemini video analysis, both must pass.
3. **ASCII runtime diagram (multi-layer changes)** — visual map of what changed across frontend / backend / database / agent. Renders unchanged in commit bodies, PR descriptions, GitHub markdown, and terminal `git log`.

### What a full-stack diagram looks like

This is the actual diagram from SitFlow's `care_rules` introduction. The change touched all 5 runtime layers — DEPLOY (Vercel), FRONTEND (Expo Router), BACKEND (Express + tRPC), DATABASE (MySQL live + Convex dormant in parallel), AGENT (Anthropic Haiku via pi-ai). Drawn once, dropped into the commit body, the affected lane entries, and the PR description — every reviewer sees the same map:

```
┌─────────────────────────── DEPLOY (Vercel — production web) ──────────────────────┐
│                                                                                    │
│  · jayneebui.vercel.app  (default URL — set custom domain later)                  │
│  · vercel.json:                                                                   │
│      buildCommand: "npx expo export --platform web"                               │
│      outputDirectory: "dist"                                                      │
│      rewrites: /(.*) → /index.html  (SPA fallback so refresh works on routes)     │
│      cache: JS/CSS immutable for 1y, HTML no-cache                                │
│  · Alternate path: GitHub Pages branch "pages-deploy" (also wired in repo)        │
│                                                                                    │
│  Server side runs separately on Render / Railway / Fly (server/_core/index.ts)    │
│                                                                                    │
└─────────────────────────────────────┬──────────────────────────────────────────────┘
                                      │ user fetches /index.html, then /_expo/*.js bundle
                                      ▼
┌─────────────────────── FRONTEND (Expo Router 6 + React Native + NativeWind) ──────┐
│                                                                                    │
│  ~ app/(tabs)/index.tsx              ~ app/clients/[id].tsx                       │
│      [Inbox]                              [Client Detail]                         │
│         │                                      │                                  │
│         │ uses CareCard(compact)              │ uses CareCard(full)               │
│         │                                      │                                  │
│         └──────────────────┬───────────────────┘                                  │
│                            ▼                                                      │
│                  + components/CareCard.tsx (NEW — 3 modes, severity stripes)      │
│                                                                                    │
│  Calls EXPO_PUBLIC_API_URL (env-baked at build time) for tRPC requests.           │
│                                                                                    │
└────────────────────────────────────┬───────────────────────────────────────────────┘
                                     │ tRPC over HTTPS (clients.getById)
                                     ▼
┌──────────────────────── BACKEND (Express + tRPC v11 on Node 22) ──────────────────┐
│                                                                                    │
│  ~ server/db.ts                                                                   │
│      ~ getClientById() now joins care_rules per pet                              │
│      + listCareRulesForPet(petId) → CareRule[]                                   │
│                                                                                    │
│  + server/m-and-g.ts (NEW)   extractCarePlanFromText() → ProposedCarePlan         │
│  + server/llm.ts (NEW)       pi-ai adapter, $5/day USD cap                       │
│                                                                                    │
│  Boot guard: NODE_ENV=production && !API_SECRET → process.exit(1)                │
│                                                                                    │
└──────────────┬─────────────────────────────────────────────┬───────────────────────┘
               │ Drizzle ORM                                 │ pi-ai (Anthropic Haiku)
               ▼                                             ▼
┌──── DATABASE · LIVE (MySQL) ─────┐  ┌── DATABASE · DORMANT (Convex) ──┐  ┌── AGENT ────────┐
│                                  │  │                                 │  │                 │
│  · pets table (existing)         │  │  · convex/schema.ts (PARALLEL) │  │ Prompt: "Extract│
│    ┌────────────────┐            │  │      mirrors every Drizzle      │  │  care rules..."│
│    │ id             │←── FK ──┐  │  │      table 1:1 (clients, pets, │  │                 │
│    │ name           │         │  │  │      careRules, consents, etc) │  │ Schema:         │
│    │ behaviorNotes  │ legacy  │  │  │  · convex/{carePlan,clients,   │  │  ProposedCarePlan│
│    └────────────────┘         │  │  │      consent}.ts (functions)   │  │  (TypeBox)      │
│                               │  │  │  · CONVEX_URL set in .env but  │  │                 │
│  + care_rules table (NEW)     │  │  │      no `npx convex dev` yet — │  │ Tools: none     │
│    ┌──────────────────────┐  │  │  │      schema doesn't push        │  │                 │
│    │ id                   │  │  │  │      until activated            │  │ Cost cap: $5/day│
│    │ pet_id               │──┘  │  │  │                                 │  │   ensureUnderCap│
│    │ category (8 enums)   │     │  │  │  Migration plan: when active,  │  │   429 if over   │
│    │ severity (4 enums)   │     │  │  │   server/db.ts swaps to       │  │                 │
│    │ rule TEXT            │     │  │  │   convex/_generated/api.ts    │  │ ~$0.0014/extract│
│    │ context TEXT NULL    │     │  │  │   client; tRPC routes become  │  │ ~2-3s round-trip│
│    │ source ENUM          │     │  │  │   thin pass-throughs.         │  │                 │
│    │ created_at DATETIME  │     │  │  │                                 │  └─────────────────┘
│    └──────────────────────┘     │  │  │                                 │
│                                  │  │  │                                 │
│  Migration:                      │  │  │                                 │
│   drizzle/0001_care_rules.sql    │  │  │                                 │
│                                  │  │  │                                 │
└──────────────────────────────────┘  └─────────────────────────────────┘

Legend:  + NEW   ~ MODIFIED   - REMOVED   · UNCHANGED   · LIVE   · DORMANT (parallel, ready to activate)
```

A reviewer who sees this knows in 15 seconds: a new component is rendered by two screens, a new server module fronts a new table, an agent prompt+schema with a cost cap fills it, the live data lives in MySQL but a Convex foundation is scaffolded for future migration, and it all ships through Vercel with a SPA-fallback rewrite. Three other worked examples (1-layer skip, 2-layer, 3-layer) in [`templates/runtime-diagram.md`](templates/runtime-diagram.md).

The `· LIVE` / `· DORMANT` labels matter — they tell readers what tech debt or migration paths exist without forcing them to grep `convex/` or `web/` to discover the alternate stack. Same convention applies to alternate deploy paths (Vercel + GitHub Pages both wired = both shown in DEPLOY box).

## What each phase actually does

**Phase 1 — Per-surface changelog lanes (always).** Every page, component, server module, db table, integration, and script gets its own `CHANGELOG/<category>/<slug>.md` file. When you change a surface, you prepend a new dated entry. Multi-surface changes write entries to **each** affected lane, cross-linked via `**Touches**:`. Append-only — the audit trail is the whole point.

**Phase 2 — Verified demo recording (when relevant).** For UI changes: a Playwright recorder asserts every claim via DOM grep, then a Gemini-2.5-Flash pass watches the recorded MP4 and confirms what's actually visible. Both layers must pass before you push. Catches the gap between "the string is in the DOM" and "the string is visibly on screen."

**Phase 3 — Live-DOM verification before claiming done.** Never claim "deployed" / "shipped" / "live" on the basis of CLI exit codes or build logs. Always fetch the live URL (or authenticated API) and grep for a concrete content signal. Catches webhooks silently disconnected, Suspense traps, CDN-cached stale HTML.

**Phase 4 — ASCII runtime diagram (when the change crosses 2+ layers).** Draw what changed across frontend / backend / database / agent so reviewers see the data flow at a glance. Don't draw for trivia; draw for any cross-cutting feature.

## Why per-surface beats repo-wide changelogs

The top-level `git log` is one undifferentiated stream — useful for "what shipped this week," useless for "what has the Inbox screen looked like over time." Per-surface lanes solve four problems at once:

- **Onboarding**: read the lane for what you're about to touch.
- **Debugging regressions**: recent entries are the suspect list.
- **Career narrative**: point at any one lane, explain the design evolution of that single thing — sharper than "I worked on the whole app."
- **Append-friendly for AI agents**: when Claude Code makes a fix, it grep-finds the lane and prepends an entry. Deterministic, no merge drama.

## Why a verified demo

Two failure modes the skill catches:

1. **DOM check passes, video doesn't show it.** The recorder confirms the string is in the rendered HTML, but if it's past the fold of the recorded viewport, viewers (and reviewers) see nothing. Gemini watches the actual pixels and flags this.
2. **Code-review claims that can't be falsified.** "I added the Care Plan to the inbox card" is a claim. "I added it AND the recorder asserts it AND Gemini confirms it's visible in the 3-second hold at 0:12" is a verified claim.

Time cost: ~75 seconds to record, ~30 seconds for Gemini analysis. Worth it on every UI change.

## Install

### As a Claude Code skill (one user, one machine)

```bash
git clone https://github.com/HomenShum/BetterPRHandoff ~/.claude/skills/easier-to-read-submissions
```

The skill auto-loads on next Claude Code session. Triggers on prompts like "commit", "push this", "open a PR", "I'm done", "wrap this up", "before we hand off."

### As a project-shipped skill (whole team gets it)

```bash
git clone https://github.com/HomenShum/BetterPRHandoff <your-repo>/.claude/skills/easier-to-read-submissions
```

Commit `.claude/skills/easier-to-read-submissions/` to the repo. Anyone who clones the repo and opens it in Claude Code gets the skill automatically.

### Manual fallback (no Claude Code)

The skill is just markdown — read `SKILL.md` and `templates/` and apply the protocol by hand. The templates are framework-agnostic.

## What's in the box

```
SKILL.md                           the contract — read this first
templates/
  CHANGELOG-README.md              master index template
  CHANGELOG-TEMPLATE.md            format spec
  lane.md                          single-surface lane template
  bootstrap-prompt.md              parallel-subagent backfill prompt
  recorder.mjs                     Playwright + smoothPan + ffmpeg
  verifier.mjs                     local checks + Gemini Files API
  probe-routes.mjs                 diagnostic for "Gemini says X is off-screen"
```

## Origin

Came out of the SitFlow → Jaynee handoff. SitFlow is a pet-sitter booking copilot (Expo + Express + tRPC + MySQL) being passed from the original engineer (Homen) to a PM-in-training (Jaynee). She needed:

- A way to understand what 20 commits of prod hardening did, surface by surface
- A way to verify her own changes didn't break the demo
- A way for her future Claude Code agent to keep the audit trail going

Per-surface lanes solved 1 and 3. Playwright + Gemini solved 2. Codified into this skill so the next handoff is just `git clone <skill-url> ~/.claude/skills/easier-to-read-submissions`.

## License

MIT. Take it, fork it, adapt it. PRs welcome — particularly:

- Templates for other frameworks (Next.js App Router, Remix, SvelteKit, vanilla web)
- Better Gemini prompts for scene verification
- Docker / CI integrations so the verifier runs in PR checks
- Slack / Discord webhooks that post the verifier verdict

## Contact

[@HomenShum](https://github.com/HomenShum) — built this for a friend learning AI PM. Reach out if you adapt it for your team.
