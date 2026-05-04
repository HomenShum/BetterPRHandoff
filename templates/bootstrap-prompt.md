# Bootstrap prompt for parallel-subagent backfill

When a repo doesn't yet have per-surface changelog lanes, dispatch 4-6 parallel `general-purpose` agents to read the git history and write entries from real commit bodies. Each agent owns a slice (pages / components / server / db / integrations / scripts) so they don't overlap.

## How to slice

Inventory first:

```bash
find app -type f \( -name "*.tsx" -o -name "*.ts" \)        # pages
find components -type f \( -name "*.tsx" -o -name "*.ts" \) # components
find server -type f -name "*.ts"                            # server modules
ls drizzle/ scripts/ hooks/                                  # db, scripts, hooks
```

Then build a table per slice listing **file path → output slug → one-line surface description**. Hand each table to its own agent. Keep slices to ~12-25 files each.

## Slug naming

Replace `/` with `-`, drop extensions, drop angle brackets and parens. Examples:

- `app/(tabs)/index.tsx` → `tabs-index-inbox.md`
- `components/CareCard.tsx` → `CareCard.md`
- `server/_core/index.ts` → `_core-index.md`
- DB table `care_rules` → `care_rules.md`
- Integration "Twilio SMS" (conceptual, not file) → `twilio-sms.md`

## The actual prompt to give each subagent

```
You are creating per-surface changelog files for the <REPO_NAME> repo at `<REPO_PATH>`.

# Why
The user is going to dogfood and modify this app. When they or their Claude Code agent modifies a <CATEGORY>, they need a changelog file specific to that surface so the audit trail stays sharp per-surface, not just one undifferentiated repo-wide git log.

The repo's day-0 commit was `<DAY_0_SHA>` on `<DAY_0_DATE>`. The latest is on `<TODAY>`. ~<N> commits total.

# Format
Read `<REPO_PATH>/CHANGELOG/TEMPLATE.md` first — it spells out the file format. New entries go at the TOP. Use `YYYY-MM-DD` dates. Each entry has a short imperative title + 1-3 sentences explaining what + why + commit sha + author + touches.

# Files you own (write one CHANGELOG file per file below)

Output directory: `<REPO_PATH>/CHANGELOG/<CATEGORY>/`. Slug = <SLUG_RULE>.

| File | Output slug | Surface description |
|---|---|---|
<TABLE_ROWS>

# How to gather history per file

For each file, run:
```bash
git log --follow --format='%h|%ai|%s' -- '<file>'
```

For each commit returned, decide if it's substantive enough to warrant an entry:
- "Initial commit" / first appearance → always one entry titled "Created — initial implementation"
- Feature additions, behavior changes, UI changes → one entry each
- Pure formatting / typo fixes / lockfile bumps → skip
- Major refactors → one entry

For commits that look meaningful, run `git log -1 --format='%B' <hash>` to read the body and write 1-3 sentences explaining what the change did to THIS file (not to the whole repo). Quote any specific user-visible behavior changes.

# Format strictly per file (matches TEMPLATE.md)

[paste the template here — see lane.md in this skill]

# Important
- ONLY write changelog markdown files. Don't modify any code.
- Don't make up entries — only write entries for commits that actually touched the file.
- For each file, aim for 2-12 entries (not every commit, only the meaningful ones).
- Date format: `YYYY-MM-DD` only (drop time + tz).
- Author name: take from `git log --format='%an'`.
- Skip files that don't exist or have no git history. Note any skipped files in your final summary.

When you're done, list every file you wrote and a one-line summary count of entries per file.
```

## After all agents return

1. **Audit cross-links** — agents sometimes invent slug names that don't match other agents' outputs. Run:
   ```bash
   grep -hroE '(pages|components|server|db|integrations|scripts)/[A-Za-z0-9_-]+\.md' CHANGELOG/ | sort -u
   ```
   Compare against actual filenames; fix any references to non-existent files.

2. **Write the master `CHANGELOG/README.md`** indexing every lane organized by category. (Use `templates/CHANGELOG-README.md` as a starting point.)

3. **Add a pointer in the repo root README.md** so the CHANGELOG/ directory is discoverable from the GitHub front page.

4. **Commit and push** with a message that explains the pattern, the file count, and the rule for future agents (append-only, prepend at top, cross-link via `**Touches**:`).

## Time budget

Per agent: 5-10 minutes (depends on file count). All four in parallel = 5-10 minutes total. The audit + master README + commit step is another 10-15 minutes. Total: ~30 minutes for a repo with 80-100 surfaces.
