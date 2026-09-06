# Changelog entry format

Each surface has an append-only lane. Prepend a new entry below its header,
write one to three sentences explaining the change and why a maintainer needs
it, and cross-link the other touched lanes. Use the same date and real commit
on entries belonging to the same change. Never regenerate existing history.

The fenced block below is an instructional example, not a recorded event.
Until a real commit or author is established, write `pending` in that field.
Do not copy a sample hash or name into current history.

```md
## YYYY-MM-DD — Short imperative title
What changed and why. State the user-visible effect when there is one.
**Commit**: `pending`. **Author**: pending.
**Touches**: `CHANGELOG/<category>/<other-lane>.md`
```

Dates use `YYYY-MM-DD`. Omit Touches when no other surface is affected.
The developer or their own agent fills real facts; the scaffold does not
infer approvals, commits, authors, or historical events.

[Index](README.md)
