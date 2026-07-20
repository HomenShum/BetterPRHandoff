# Changelog format

Each maintained surface has an append-only lane at
`CHANGELOG/<category>/<slug>.md`. Put the newest entry first and do not rewrite
older entries.

```md
## YYYY-MM-DD — Short imperative title

Explain what changed, why, and the user-visible effect in one to three
sentences.

**Commit**: identify the implementing commit. **Author**: name.

**Touches**: link other affected lanes when the change spans surfaces.
```
