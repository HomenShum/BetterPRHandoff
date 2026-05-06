# NodeBench Redesign — Submission

**Submitted by:** Homen Shum (with Claude Opus 4.7)
**Date:** 2026-05-05
**Repo:** [HomenShum/nodebench-ai](https://github.com/HomenShum/nodebench-ai)
**Branch / PR:** `feat/redesign-showcase` → [PR #240](https://github.com/HomenShum/nodebench-ai/pull/240)
**Live URL:** [https://www.nodebenchai.com/redesign](https://www.nodebenchai.com/redesign) (after merge)
**Companion doc:** [docs/architecture/REDESIGN_CHANGES.md](https://github.com/HomenShum/nodebench-ai/blob/main/docs/architecture/REDESIGN_CHANGES.md) in the source repo

---

## What this is

A parallel `/redesign/*` route in NodeBench that ships an entity-intelligence redesign — Notion + Roam + Obsidian + Karpathy + Pitchbook hybrid — alongside the live cockpit. Designed so production users don't see it until each surface is promoted via feature flag. Investors and operators see it via deep link.

55 files, 16,773 insertions. Strictly additive — no live cockpit code paths modified except the route registration in [src/App.tsx](https://github.com/HomenShum/nodebench-ai/blob/main/src/App.tsx) which wraps the new shell in lazy import + ErrorBoundary.

## Surfaces

| Surface | Route | Pattern |
|---|---|---|
| Home | `/redesign` | Bloomberg cover hero + Pitchbook entity feed + Notion-templates situation gallery + WhatChangedStrip |
| Reports | `/redesign/reports` | Crunchbase facet bar + compact 3-col card grid + universe sections + bulk export action bar |
| Reports detail | `/redesign/reports/:id` | TipTap notebook with three writers (user/chat/agent) + pending-patch queue + `?focus=zen` |
| Chat | `/redesign/chat` | Avatar-based assistant rendering (parity-studio) + streaming markdown + inline tool-call cards + per-message actions + citation linkage |
| Inbox | `/redesign/inbox` | 5 lanes + date range filter + multi-select bulk Accept/Reject/Snooze + open-design header-anchored preview |
| Me | `/redesign/me` | Personal Context Notebook hero + completeness meter + Export USER.md |

## Cross-surface primitives

Mounted on every redesign route:
- **CommandPalette** (⌘K) — Linear/Raycast spotlight (15 commands, 4 groups)
- **ShortcutsOverlay** (?) — 5 groups · 23 shortcuts documented
- **Toast system** — info/success/warning/error variants with auto-dismiss + action
- **Skeleton primitives** — reduced-motion-safe shimmer placeholders

## Backend integration sprint

| Sprint | Status | Hook | Convex query |
|---|---|---|---|
| S1: Reports → live brief docs | shipped | useReportsLive | batchAutopilot.queries.getRecentRuns |
| S2: Chat → live batch monitor | shipped | useBatchLive | same query, filtered to active |
| S3: Inbox aggregator | shipped (client-side union) | useInboxLive | batchAutopilot ∪ pipelineRuns |
| S4: Home pulse | partial | useHomePulseLive | derives from briefMarkdown headlines |
| S5: schema + domain handlers | this PR | (mutations ready, hooks deferred) | new tables below |

### Sprint S5 — 5 new Convex tables

```ts
styleProfiles            // operator analyst manifest
redesignDocumentPatches  // chat/agent → document edit contract
redesignUniverses        // saved entity collections
inboxSnoozes             // soft-hide inbox items
agentRunFeedback         // 👍/👎 reactions for the eval flywheel
```

Plus auth-gated handlers in `convex/domains/redesign/`:
- `styleProfile.ts` — getActive / list / upsert / setActive
- `documentPatches.ts` — listPending / listForUser / propose / accept / reject
- `inboxSnoozes.ts` — listActive / snooze / unsnooze / unsnoozeAll
- `agentRunFeedback.ts` — recordReaction / listForRun / summary
- `universes.ts` — list / upsert / setMonitoring

## QA evidence

Multi-persona Gemini 3.1 Pro Preview judge — 7 personas (banker / founder / researcher / teacher / operator / karpathy / obsidian) × 30+ rubric dimensions.

| Pass | Avg | P0 | P1 |
|------|-----|----|----|
| 1 | 71 | 0 | 7 |
| 9 | 80 | 0 | 3 |
| 10 | **81** | 0 | **1** |
| 13 | 79 | 0 | 3 |

Per-persona all-time highs: **banker 90 · operator 88 · obsidian 90 · karpathy 82**.

Persona-tunable focus mode (`?focus=zen` URL param + `⌘\` toggle) resolved a months-long persona-antagonism ceiling: Karpathy hated chrome, banker/founder wanted full Notion affordances. The structural break was the per-persona-tunable mode toggle.

## Verification

- `npx tsc --noEmit --pretty false` — clean
- `npm run build` — clean (1m 13s)
- `npx convex codegen` — clean
- `npm run qa:redesign` — 7 personas, avg 78–81

After deploy:
- `npx tsx scripts/verify-live.ts` (Tier A — raw HTML grep)
- `BASE_URL=https://www.nodebenchai.com npm run live-smoke` (Tier B — Playwright)

## Deploy status

PR #240 is open with auto-merge enabled. **Currently blocked at GitHub merge** because Actions are disabled for the user account ("Actions has been disabled for this user" — confirmed via `gh workflow run`). The 4 required CI checks (Typecheck / Runtime smoke / Build) cannot attach to the PR until that restriction is lifted.

To unblock (any one):
1. Re-enable Actions for the user account at GitHub Settings → Billing
2. Push an empty commit from a different account that has Actions enabled
3. Temporarily lower branch protection on `main`, then `gh pr merge 240 --admin --squash --delete-branch`

After CI runs green, **auto-merge is already armed** — it will merge automatically. Then:
- Vercel webhook → frontend deploy (~3-4 min)
- `convex-deploy.yml` → Convex schema + functions deploy (~30-60s)

## Why this submission style

Per the source repo's [CLAUDE.md](https://github.com/HomenShum/nodebench-ai/blob/main/CLAUDE.md):
- **Completion traceability** — every change cites the original ask
- **Live-DOM verification** — never claim "deployed" without fetching the live URL
- **Self-direction** — when a task completes, immediately identify next highest-impact action
- **Scenario-based testing** — 7 real-world personas, not happy-path unit tests

Built autonomously while the user was asleep. Deploy paused at the platform-level CI block; user can unblock on wake.

— Claude Opus 4.7 (1M context)
