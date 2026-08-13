# <Your repo> — per-surface changelog index

This directory holds **per-surface changelog lanes**. Every page, component, server module, database table, integration, and script gets its own append-only `.md` file with a date-sorted history (most recent at the top).

## Why this exists

The repo's top-level `git log` is one undifferentiated stream. Useful for "what shipped this week," useless for "what has the Inbox screen looked like over time."

Per-surface lanes solve four problems:

1. **Onboarding** — read the lane for the surface you're about to touch. You learn the design history, what's been tried, what's been retired.
2. **Debugging regressions** — when a screen breaks, look at that screen's lane under `pages/`. The recent entries are the only candidates.
3. **Career narrative** — anyone on the team can point at one lane and explain the design evolution of that single thing. Sharper than "I worked on the whole app."
4. **Append-friendly for AI agents** — when Claude Code makes a fix, it can grep for the surface it touched, find the lane file, and prepend a new entry. Deterministic, no merge drama.

## Format rules

Read [`TEMPLATE.md`](TEMPLATE.md). Three rules that matter:

- **Append at the top.** Most recent first. Never delete or rewrite old entries — they are the audit trail.
- **Date format `YYYY-MM-DD`** (drop time + tz).
- **Multi-surface changes** = an entry in **each** affected lane, with the same date + commit hash. Cross-link via the `**Touches**:` line.

Every lane file ends with the entry template you should copy when adding a new entry.

## Index

Replace every row below with a real lane from this repo. One row per surface,
one lane file per row. Delete a whole section if this repo has no surfaces of
that kind — an empty heading is worse than no heading.

### `pages/` — user-facing screens and routes

| Lane | What the user does here |
|---|---|
| [`pages/<route-slug>.md`](pages/<route-slug>.md) | e.g. the screen a signed-in user lands on |

### `components/` — reusable UI

| Lane | What it renders |
|---|---|
| [`components/<Name>.md`](components/<Name>.md) | e.g. the card that shows one order |

### `server/` — backend modules, endpoints, middleware

| Lane | What it serves |
|---|---|
| [`server/<module>.md`](server/<module>.md) | e.g. the handler that accepts a booking |

### `db/` — database tables (one lane per table, not per migration)

| Lane | What it stores |
|---|---|
| [`db/<table>.md`](db/<table>.md) | e.g. one row per customer |

### `integrations/` — external services (one lane per service, not per file)

| Lane | Who it talks to |
|---|---|
| [`integrations/<service>.md`](integrations/<service>.md) | e.g. the SMS provider |

### `scripts/` — build, demo and ops scripts

| Lane | What it automates |
|---|---|
| [`scripts/<script>.md`](scripts/<script>.md) | e.g. the nightly data export |

---

## How to add a new entry (the rule for AI agents)

When you (Claude Code, or any agent) make a code change:

1. **Identify every surface touched** by your diff. A typical change touches 1-3 surfaces.
2. **For each touched surface**, find the lane file (e.g., `CHANGELOG/components/<Name>.md`).
3. **Prepend** a new entry at the top — directly below the file header, before the previous most-recent entry.
4. **Use the entry template** at the bottom of each lane file. Don't invent your own format.
5. **Cross-link with `**Touches**:`** if multiple surfaces. Same date + commit hash on every entry.

Example: if your commit added a toggle to a settings component and the endpoint behind it, you write **two** entries — one in the component lane, one in the server lane. Both with today's date, both with the same <7-char sha>. Each entry cross-links the other via **Touches**:.

## How to read it (the rule for humans)

- **Coming back to a surface after a while**: read its lane top-to-bottom. The first entry tells you what it does today; later entries tell you what it used to do and why it changed.
- **Investigating a regression**: open the lane for the broken surface. The recent entries are your suspect list.
- **Preparing for a redesign**: read the full lane to learn what's been tried. Don't repeat retired experiments.
