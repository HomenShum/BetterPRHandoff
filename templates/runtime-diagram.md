# ASCII runtime change diagram — format spec + examples

When a code change crosses two or more layers (frontend / backend / database / agent), prose alone is illegible. A reviewer should not have to read three files in three directories to understand how data moves through the change. Draw an ASCII diagram instead.

This file: the format rules + 4 worked examples (1-layer, 2-layer, 3-layer, 4-layer). Copy whichever is closest to your change and adapt.

---

## Format rules

1. **Top-to-bottom flow.** DEPLOY at the top (where the user URL terminates), agent at the bottom. Data flows down (request) or up (response) — show the dominant direction with arrows.
2. **Five layer categories**: DEPLOY → FRONTEND → BACKEND → DATABASE → AGENT. Drop any layer that didn't change.
3. **Parallel stacks**: when the repo has more than one option for a layer (e.g., MySQL live + Convex dormant, or Vercel + GitHub Pages alternate deploys), draw both side-by-side with `· LIVE` / `· DORMANT` / `· PARALLEL` labels.
4. **Labeled connectors.** Every arrow has a protocol/transport label (`tRPC`, `REST`, `WebSocket`, `Drizzle`, `pi-ai`, `Convex client`).
5. **Markers inside the box** — what changed and what's new:
   - `+ NEW` — file/table/endpoint added
   - `~ MODIFIED` — existing file/table/endpoint changed
   - `- REMOVED` — deleted
   - `· UNCHANGED` — shown for context only (when needed to explain the new piece)
   - `· LIVE` / `· DORMANT` / `· PARALLEL` — for parallel-stack labels
6. **Width fits in 100 chars.** ASCII boxes look bad in narrow PR diff viewers if wider.
7. **Footer legend.** Always include the marker legend so first-time readers know the symbols.

### Box-drawing characters cheat sheet

```
┌ ┐ └ ┘  corners
─ │      horizontal / vertical line
├ ┤ ┬ ┴  T-intersections
▲ ▼ ◄ ►  filled arrows
↑ ↓ → ←  thin arrows (use these inside box bodies)
●        bullet for list items inside a box
```

Most editors paste these from `templates/runtime-diagram.md` as-is. Don't try to type from memory — copy the closest example below.

---

## Example 1 — Single layer (skip the diagram)

A pure CSS tweak in `components/CareCard.tsx` that changes the red stripe from #EF4444 to #DC2626. No diagram needed. Just the changelog entry. **Don't draw a diagram for trivia** — readers learn to ignore them.

---

## Example 2 — Two-layer (frontend + backend)

Adding a "mark as read" button to inbox cards that POSTs to a new endpoint.

```
┌───────────────── FRONTEND ─────────────────┐
│                                             │
│  ~ app/(tabs)/index.tsx                     │
│      • new "Mark read" button on each card  │
│      • calls trpc.requests.markRead.useMutation()
│                                             │
└──────────────────┬──────────────────────────┘
                   │ tRPC mutation
                   ▼
┌───────────────── BACKEND ──────────────────┐
│                                             │
│  ~ server/routers.ts                        │
│      + requests.markRead procedure          │
│      • input: { requestId: string }         │
│      • side effect: sets read_at = NOW()    │
│                                             │
└─────────────────────────────────────────────┘

Legend:  + NEW   ~ MODIFIED   - REMOVED   · UNCHANGED
```

(DB column `read_at` already exists from a prior commit, so DB box is dropped.)

---

## Example 3 — Three-layer (frontend + backend + database)

Adding a per-client `notes` field that the user can edit on the client-detail screen.

```
┌───────────────── FRONTEND ─────────────────┐
│                                             │
│  ~ app/clients/[id].tsx                     │
│      • textarea for notes                   │
│      • debounced 500ms → trpc.clients.updateNotes
│                                             │
└──────────────────┬──────────────────────────┘
                   │ tRPC mutation
                   ▼
┌───────────────── BACKEND ──────────────────┐
│                                             │
│  ~ server/routers.ts                        │
│      + clients.updateNotes procedure        │
│  ~ server/db.ts                             │
│      + updateClientNotes(id, notes)         │
│                                             │
└──────────────────┬──────────────────────────┘
                   │ Drizzle ORM
                   ▼
┌───────────────── DATABASE ─────────────────┐
│                                             │
│  ~ clients table                            │
│      + notes TEXT NULL                      │
│      + notes_updated_at DATETIME NULL       │
│                                             │
│  Migration: drizzle/0002_add_client_notes.sql
│                                             │
└─────────────────────────────────────────────┘

Legend:  + NEW   ~ MODIFIED   - REMOVED   · UNCHANGED
```

---

## Example 4 — Full stack (DEPLOY + 4 layers + parallel database)

The actual SitFlow `care_rules` introduction PLUS the deploy story PLUS the parallel-stack reality. Touches every layer the project has, including the dormant Convex foundation that's scaffolded for the future migration. This is what a comprehensive multi-layer diagram looks like.

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

This is the level of detail to aim for on a full-stack change. Notice:
- The DEPLOY box at the top names the actual hosting provider, the build command, the output dir, and any alternate deploy paths the repo supports.
- Every layer box names actual files (not abstract "the frontend").
- The DATABASE row shows BOTH the live MySQL stack AND the dormant Convex foundation, so a reader sees the migration path without having to grep `convex/`.
- The AGENT box names the prompt category, schema, tools, model, cost.
- The legend tells a first-time reader what the markers mean.

If your repo doesn't have a parallel stack, drop the second DATABASE box. If your repo doesn't deploy through a CDN (e.g., it's an internal CLI tool), drop the DEPLOY box. The protocol is "show every layer that exists or changed" — not "always draw 5 boxes."

---

## Where the diagram goes

| Location | When |
|---|---|
| **Commit body** | Every multi-layer commit. Wrap at 100 chars. |
| **CHANGELOG lane entry** | When the diagram is small enough. Slice it to just the surfaces this lane cares about (frontend lane shows frontend + the immediate adjacent box). |
| **PR description** | At the top, before the prose. Reviewers should see flow before details. |
| **`docs/RUNTIME.md`** (optional) | If the repo wants an always-current architecture diagram. Append a "Recent changes" footer with each major diagram. |

---

## Don't draw a diagram for

- Single-layer changes (use prose).
- Pure refactors with no API change (use prose).
- Trivia / typos / formatting (no entry needed at all per the skill rules).
- Generated code (lockfile bumps, migration regenerations).
