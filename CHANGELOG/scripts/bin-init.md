# Changelog — bin/init.mjs

> **Surface**: Create protocol files without replacing a developer's existing work.
>
> **Append rule**: New entries go at the TOP. Never rewrite older entries.

## 2026-09-06 — Preserve existing files and reserve new destinations
Use exclusive creation and content-aware copy conflicts so repeated or competing CLI runs cannot silently replace existing rules, lanes, or QA packets. Validate lane names before making directories and quote source invocations containing spaces; a partial conflict remains a failed operation for manual reconciliation. Add ordinary Node 22 Windows and Ubuntu CI for the scenario tests and exact source packaging; actual shared-run results are recorded separately.
**Commit**: `pending`. **Author**: pending.
**Touches**: `CHANGELOG/components/changelog-lane.md`, `CHANGELOG/components/qa-packet.md`

## Entry template

```md
## YYYY-MM-DD — Short imperative title
What changed and why in one to three sentences.
**Commit**: `pending`. **Author**: pending.
**Touches**: <other CHANGELOG files affected>
```
