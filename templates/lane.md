# Changelog — <relative/path/to/file>

> **Surface**: <one-line description of what this surface does for the user>
>
> **Append rule**: New entries go at the TOP. Date format: `YYYY-MM-DD`. Use the entry template at the bottom of this file. Never delete old entries — they are the audit trail.

## YYYY-MM-DD — Short imperative title (most recent)
What changed and **why** (1-3 sentences, written for the next person who has to maintain this — not for you, the original author). Mention any user-visible effect.
**Commit**: `abc1234`. **Author**: Name.
**Touches**: `<other CHANGELOG files affected>`, or omit line if none.

## YYYY-MM-DD — Older entry
...

## YYYY-MM-DD — Created — initial implementation
First appearance in the repo. Brief description of what it did at birth.
**Commit**: `abc1234`. **Author**: Name.

---

## Entry template

```md
## YYYY-MM-DD — Short imperative title
What and why in 1-3 sentences. Note user-visible effects.
**Commit**: `<7-char sha>`. **Author**: <name>.
**Touches**: <other CHANGELOG files affected>
```
