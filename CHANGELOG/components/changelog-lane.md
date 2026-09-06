# Changelog — templates/lane.md

> **Surface**: Give a maintainer a lane with truthful current facts and a reusable entry format.
>
> **Append rule**: New entries go at the TOP. Never rewrite older entries.

## 2026-09-06 — Leave new change-history facts visibly pending
Replace apparent sample history with one unfilled current entry and a fenced instructional example. A developer supplies the real change, commit, and author, so scaffolding cannot present invented past work as an append-only record.
**Commit**: `pending`. **Author**: pending.
**Touches**: `CHANGELOG/scripts/bin-init.md`

## Entry template

```md
## YYYY-MM-DD — Short imperative title
What changed and why in one to three sentences.
**Commit**: `pending`. **Author**: pending.
**Touches**: <other CHANGELOG files affected>
```
