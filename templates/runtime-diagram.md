# ASCII runtime change diagram — format spec + examples

When a code change crosses two or more layers (frontend / backend / database / agent), prose alone is illegible. A reviewer should not have to read three files in three directories to understand how data moves through the change. Draw an ASCII diagram instead.

This file: the format rules + 4 worked examples (1-layer, 2-layer, 3-layer, 4-layer). Copy whichever is closest to your change and adapt.

---

## Format rules

1. **Top-to-bottom flow.** Frontend at top, agent at bottom. Data flows down (request) or up (response) — show the dominant direction with arrows.
2. **One box per layer.** Drop any layer that didn't change.
3. **Labeled connectors.** Every arrow has a protocol/transport label (`tRPC`, `REST`, `WebSocket`, `Drizzle`, `pi-ai`).
4. **Markers inside the box** — what changed and what's new:
   - `+ NEW` — file/table/endpoint added
   - `~ MODIFIED` — existing file/table/endpoint changed
   - `- REMOVED` — deleted
   - `· UNCHANGED` — shown for context only (when needed to explain the new piece)
5. **Width fits in 100 chars.** ASCII boxes look bad in narrow PR diff viewers if wider.
6. **Footer legend.** Always include the marker legend so first-time readers know the symbols.

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

## Example 4 — Four-layer (the full stack)

The actual SitFlow `care_rules` introduction: structured per-pet rules driven by AI extraction from M&G transcripts. Touches frontend (3 components), backend (2 modules), database (1 new table + relation), and agent (new prompt + schema + cost cap).

```
┌──────────────────────── FRONTEND (Expo + React Native) ────────────────────────┐
│                                                                                 │
│  ~ app/(tabs)/index.tsx           ~ app/clients/[id].tsx                       │
│      [Inbox]                          [Client Detail]                          │
│         │                                  │                                    │
│         │ uses CareCard(compact)          │ uses CareCard(full)                │
│         │                                  │                                    │
│         └──────────────┬───────────────────┘                                   │
│                        ▼                                                       │
│                 + components/CareCard.tsx (NEW)                                │
│                     • 3 modes: compact / today / full                          │
│                     • severity → color stripe (red / yellow / blue)            │
│                     • category emoji icons                                     │
│                     • legacy fallback to behaviorNotes                         │
│                                                                                 │
└────────────────────────────┬───────────────────────────────────────────────────┘
                             │ tRPC (clients.getById)
                             ▼
┌──────────────────────── BACKEND (Express + tRPC) ─────────────────────────────┐
│                                                                                 │
│  ~ server/db.ts                                                                │
│      ~ getClientById() now joins care_rules per pet                           │
│      + listCareRulesForPet(petId) → CareRule[]                                │
│                                                                                 │
│  + server/m-and-g.ts (NEW)                                                     │
│      extractCarePlanFromText(transcript) → ProposedCarePlan                    │
│           │                                                                    │
│           └─→ server/llm.ts (pi-ai chat with TypeBox schema enforcement)      │
│                                                                                 │
└──────────────┬─────────────────────────────────────────────┬───────────────────┘
               │ Drizzle ORM                                 │ pi-ai (Anthropic Haiku)
               ▼                                             ▼
┌────────────── DATABASE (MySQL) ──────────────┐  ┌────────── AGENT ─────────────────┐
│                                              │  │                                  │
│  · pets table (existing)                     │  │  Prompt: "Extract care rules    │
│    ┌──────────────────┐                      │  │   from this M&G transcript..."   │
│    │ id               │←── FK ────────┐     │  │  Schema: ProposedCarePlan        │
│    │ name             │               │     │  │   (TypeBox, strict)             │
│    │ behaviorNotes    │ ← legacy KEPT │     │  │  Tools: none (pure extraction)  │
│    └──────────────────┘               │     │  │                                  │
│                                       │     │  │  Cost cap: $5/day USD enforced  │
│  + care_rules table (NEW)             │     │  │   via ensureUnderCap() — 429    │
│    ┌──────────────────────┐          │     │  │   if exceeded, never silent      │
│    │ id                   │          │     │  │                                  │
│    │ pet_id               │──────────┘     │  │  ~ $0.0014 per extract           │
│    │ category (8 enums)   │                │  │  ~ 2-3s round trip               │
│    │ severity (4 enums)   │                │  │                                  │
│    │ rule TEXT            │                │  └──────────────────────────────────┘
│    │ context TEXT NULL    │                │
│    │ source ENUM          │                │
│    │ created_at DATETIME  │                │
│    └──────────────────────┘                │
│                                              │
│  Migration: drizzle/0001_care_rules.sql      │
│                                              │
└──────────────────────────────────────────────┘

Legend:  + NEW   ~ MODIFIED   - REMOVED   · UNCHANGED (shown for context)
```

This is the level of detail to aim for on a 4-layer change. Notice:
- Every box names actual files (not abstract "the frontend").
- The DATABASE box draws the FK relationship inline.
- The AGENT box names the prompt category, schema, tools, model, cost.
- The legend tells a first-time reader what the markers mean.

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
