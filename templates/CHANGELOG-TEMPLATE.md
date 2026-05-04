# Changelog format — read this once

Each surface (page, component, server module, db table, integration, script) gets its **own changelog file** under `CHANGELOG/<category>/<slug>.md`. New entries go at the **top** so the most recent change is visible first. Old entries are never deleted or rewritten — append-only.

This format is what every agent (human or AI) should follow when modifying a surface. If your change touches multiple surfaces, add an entry to **each** affected lane with the same date + commit hash.

---

## File template (copy this when creating a new lane)

```md
# Changelog — <relative/path/to/file>

> **Surface**: <one-line description of what this surface does for the user>
>
> **Append rule**: New entries go at the TOP. Date format: `YYYY-MM-DD`. Use the entry template at the bottom of this file. Never delete old entries — they are the audit trail.

## YYYY-MM-DD — Short imperative title
What changed and **why** (1-3 sentences, written for the next person who has to maintain this — not the original author). Mention any user-visible effect.
**Commit**: `abc1234`. **Author**: Name.
**Touches**: <other surfaces this change also affected, if any>

## (older entries below, in reverse-chronological order)

---

## Entry template

```md
## YYYY-MM-DD — Short imperative title
What and why in 1-3 sentences. Note user-visible effects.
**Commit**: `<7-char sha>`. **Author**: <name>.
**Touches**: <other CHANGELOG files affected>
```
```

---

## Why per-surface lanes

The whole repo's `git log` is one undifferentiated stream — useful for "what shipped this week" but useless for "what has the Inbox screen looked like over time." Per-surface lanes solve that:

- **Onboarding a new contributor**: read the lane for the surface you're about to touch. You learn the design history, what's been tried, what's been retired.
- **Debugging a regression**: when the Inbox breaks, look at `CHANGELOG/pages/tabs-index-inbox.md` — the recent entries are the only candidates.
- **PM career narrative**: when Jaynee's at a job interview talking about how she shipped SitFlow, she can point at any one lane and explain the design evolution of that single thing — much sharper than "I worked on the whole app."
- **Append-friendly for AI agents**: when Claude Code makes a fix, it can grep for the surface it touched, find the lane file, prepend a new entry. Deterministic, no merge drama.

---

## Index

See [`CHANGELOG/README.md`](README.md) for the full index of every lane organized by category.
