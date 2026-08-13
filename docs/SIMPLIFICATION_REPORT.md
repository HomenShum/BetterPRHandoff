# Simplification report — wave 3

Baseline commit `e2bb028`. Every row below was produced by running the command
in its last column against that commit and against the tip of this pass, on
Node v22.22.2 / npm 10.9.7 / Windows 11. Rows without an evidence command are
not measurements and are not here.

Reproduce the "before" side with a worktree at the baseline:

```bash
git worktree add /tmp/before e2bb028
```

## Measurements

| Measure | Before | After | Change | Evidence command |
|---|---:|---:|---:|---|
| Repo files (tracked) | 43 | 50 | +7 | `git ls-tree -r --name-only <rev> \| wc -l` |
| Production files (what `package.json#files` ships) | 21 | 18 | −3 | `git ls-tree -r --name-only <rev> \| grep -E '^(SKILL\|AGENTS\|README\|LICENSE)\|^bin/\|^templates/' \| wc -l` |
| Production source lines (executable `.mjs` shipped) | 1076 | 325 | −751 (−70%) | `for f in $(git ls-tree -r --name-only <rev> \| grep -E '^(bin\|templates)/.*\.mjs$'); do git show <rev>:$f \| wc -l; done` |
| `bin/init.mjs` executable lines (non-blank, non-comment) | 250 | 238 | −12 | `git show <rev>:bin/init.mjs \| grep -vE '^\s*(//\|/\*\|\*\|$)' \| wc -l` |
| Prose + shell shipped (lines) | 2074 | 1679 | −395 | `for f in $(git ls-tree -r --name-only <rev> \| grep -E '^(SKILL\|AGENTS\|README\|INTEGRATIONS\|install)\.\|^templates/.*\.(md\|sh\|ps1)$'); do git show <rev>:$f \| wc -l; done` |
| Direct dependencies | 0 | 0 | 0 | `node -e "const p=require('./package.json');console.log(Object.keys(p.dependencies\|\|{}).length)"` |
| Undeclared imports in shipped code | 1 (`playwright`) | 0 | −1 | `node templates/recorder.mjs` → `ERR_MODULE_NOT_FOUND` before; file gone after |
| External binaries invoked | 3 (`ffmpeg`, `ffprobe`, `git`) | 0 | −3 | `git grep -hoE "spawnSync\('[a-z]+'\|execSync" <rev> -- bin templates install.sh` |
| Network hosts contacted at runtime | 2 (Gemini Files API, github.com clone) | 0 | −2 | `git grep -hoE 'https://[a-z.]+' <rev> -- bin templates install.sh install.ps1` |
| Environment variables read | 15 | 3 | −12 | `git grep -hoE 'process[.]env[.][A-Za-z_]+\|\$\{?[A-Z_]{4,}' <rev> -- bin templates install.sh install.ps1 \| sort -u` |
| Documented install paths | 3 | 1 | −2 | count of install one-liners in `README.md` "Install anywhere" |
| Unused files | 3 | 0 | −3 | `npx knip --no-progress` |
| Unused exports | 0 | 0 | 0 | `npx knip --no-progress` |
| Duplicate blocks | 7 | 6 | −1 | `npx jscpd bin templates AGENTS.md SKILL.md README.md INTEGRATIONS.md --reporters console` |
| Duplicated lines | 194 (3.65%) | 129 (3.04%) | −65 | same jscpd command |
| Duplicated tokens | 5637 (9.97%) | 720 (1.81%) | −4917 (−87%) | same jscpd command |
| Duplicate blocks in JavaScript | 1 | 0 | −1 | same jscpd command |
| Circular dependencies | 0 | 0 | 0 | `npx dependency-cruiser --no-config --validate --output-type err bin templates` |
| Modules cruised | 10 | 5 | −5 | same dependency-cruiser command |
| Canonical workflow tests | 0 assertions | 18 passing | +18 | `npm test` |
| Test command | `node bin/init.mjs --help` → exit 0 | `node --test test/cli.test.mjs` → 18 pass | — | `npm test` |
| Browser workflow passes | not applicable — no browser application. The single HTML file this package emits (`QA_DOGFOOD/<id>/gmail-magic-resend.html`) is a static email preview with no scripts; it was measured in the promotion baseline, not re-measured here because no change in this pass touched it. | | | `promotion/PROMOTION_LOG.md` |
| Production bundle size | not applicable — no build step and no bundler; `package.json` has no `build` script and ships source directly | | | `node -e "console.log(Object.keys(require('./package.json').scripts))"` |
| Additions / deletions | — | — | 13 files changed, 397 (+) / 1265 (−) | `git diff --shortstat e2bb028 d18bb0e` |

Two rows need reading carefully.

**Repo files went UP, 43 → 50.** That is not a simplification failure: this
pass deleted 5 files and added 12 documentation files (`docs/`, `.tours/`,
`test/`), none of which ship to a user. The row that answers "did the product
get smaller" is the one below it — production files, 21 → 18 — because
`package.json#files` is what an installer actually downloads. Both are here
rather than only the flattering one.

**Additions/deletions is measured at commit `d18bb0e`**, the last commit that
changed shipped code. Documentation written after it is new material rather
than simplification, and including it would make the row read as growth without
meaning anything.

> **Correction, same day.** The first version of this table quoted four "after"
> numbers taken before the documentation commit: repo files 39, `init.mjs`
> executable lines 237, prose+shell 1677, and duplicated tokens 1.82%. An
> adversarial re-run against the real tip gave 50, 238, 1679 and 1.81%. The
> old values are kept here so the correction is auditable; every other row
> reproduced exactly on re-run.

## What was deleted

**`templates/recorder.mjs`, `templates/verifier.mjs`, `templates/probe-routes.mjs`** —
753 lines, 70% of the repository's JavaScript. Presented in the README as
adaptable templates; they were another product's concrete scripts. 49 lines
across the three carry SitFlow/Jaynee literals: routes (`/clients/c5`,
`localhost:8081`), assert strings (`'SitFlow'`, `'Booking inbox'`,
`'No human food'`, `'Never alone'`), a `sitflow:` localStorage prefix, and
fixed output names `jaynee-demo.mp4` / `.gif`. Copying them into a second repo
per the README produces failing scene checks against an application that works
correctly — this was already logged as defect D3 for the recorder; the same
reproduction applies to the other two, which D3 did not name.

They also could not run at all: `node templates/recorder.mjs` and
`node templates/probe-routes.mjs` both exit 1 with `ERR_MODULE_NOT_FOUND`
because they import `playwright`, which `package.json` does not declare.
`knip` listed all three as unused files. `easier install` copied all 753 lines
into every user's agent directory.

**`install.sh` and `install.ps1`** — 249 lines. Each was a second and third
implementation of `install()` in `bin/init.mjs`: same six modes, same
destinations, same copy rules, three separate auto-detect ladders that had
drifted. Observed by running all three in the same directory:

| directory holds | `bin/init.mjs install` | `install.sh` | `install.ps1` |
|---|---|---|---|
| `.git` only | project | project | **user** |
| `.cursor` only | **cursor** | **user** | **user** |
| `.aider.conf.yml` only | **aider** | **user** | **user** |

`install.ps1` answers `user` for every repository because its first test is
`Test-Path ./package.json -PathType Leaf`; a repo without a `package.json`
never reaches the cursor / cline / aider / project branch. `install.sh` also
printed `npx @homenshum/easier-to-read init` as its next step —
`npm view @homenshum/easier-to-read version` returns **404**; that package does
not exist.

**127 lines of SitFlow's filled-in changelog index**, from
`templates/CHANGELOG-README.md`. `easier init` copies that file verbatim to
`CHANGELOG/README.md`, the first file a new adopter opens on the primary
journey. Line 1 read `# SitFlow — per-surface changelog index`, 83 of its 169
lines were table rows naming another product's routes and tables, and one
bullet named a real individual. Replaced by a six-section skeleton with one
placeholder row per category. 169 lines → 86.

**72 duplicated lines of ASCII diagram** from `README.md`. The full five-layer
runtime diagram existed byte-identically in `README.md` and
`templates/runtime-diagram.md` — 5133 of the repository's 5637 duplicated
tokens, 91% of all duplication, in one block. The README now shows the top box
and points at the single copy.

**Four dead imports and two duplicated helpers** in `bin/init.mjs`:
`readdir`, `stat`, `basename` and `execSync` were imported and never used; the
CLI now imports no `child_process` at all, so nothing in it can spawn a shell.
`pathExists()` wrapped `access()` to answer a question `existsSync` — already
imported in the same file — answers directly. Three of the four copies of the
six-category vocabulary are gone, leaving one `CATEGORIES` constant.

**One line of documentation that described a feature that was never built**:
the header comment of `bin/init.mjs`, line 10 as it stood at commit `e2bb028`,
documented an `entry <lane-file>` subcommand. Running it
printed `Unknown command`. Defect D5's documentation half is resolved by
deleting the claim; the verb itself is still unbuilt and still in the ledger.

## Custom code replaced by an existing capability

| Custom code | Replaced by | Lines |
|---|---|---|
| `copyDir()` — hand-rolled recursive directory copy over `readdirSync` + `copyFile` | `cp(src, dest, { recursive: true })` from `node:fs/promises` | 9 |
| `pathExists()` — async `access()` wrapper in a try/catch | `existsSync` from `node:fs`, already imported in the same file | 4 |
| `target.replace(cwd + "/", "")` — hand-rolled relative path | `relative(cwd, target)` from `node:path` | 1 |
| `install.sh` + `install.ps1` — the install flow in two shell dialects | `npx @homenshum/easier-to-read-submissions install`, which the README already documented | 249 |
| `npm test` = `node bin/init.mjs --help` | `node --test` — the Node test runner, built in since v18, no framework installed | — |

Nothing new was added to the dependency tree. The package still has zero
dependencies, and the test suite uses only `node:test` and `node:assert`.

## Defects found by this pass

Both were found by running things, not by reading them.

**D7 (new, minor)** — `easier add <category> <slug>` substitutes only the
topmost heading of `templates/lane.md`. The template's two sample entries
survive into every new lane carrying the fake commit sha `abc1234`, and the
newest entry keeps a dangling `**Touches**: <other CHANGELOG files affected>`
placeholder. Reproduce:

```bash
cd "$(mktemp -d)" && node <repo>/bin/init.mjs init && node <repo>/bin/init.mjs add components Button
grep -c '^## YYYY-MM-DD —' CHANGELOG/components/Button.md   # 3
```

Found by the first run of `test/cli.test.mjs`, whose original assertion
(`!body.includes("YYYY-MM-DD —")`) failed. Left unfixed — changing what a lane
file looks like is product work, and this pass does not mix feature work with
structural change. The observed count is pinned in the test with the defect id
in a comment, so a fix has to change the number on purpose.

**Path traversal in the `slug` argument (new, documented limit)** — `slug` is
joined into a path without validation:

```bash
cd "$(mktemp -d)" && mkdir sub && cd sub
node <repo>/bin/init.mjs init && node <repo>/bin/init.mjs add components ../../escaped
# ✓ Created escaped.md — written outside CHANGELOG/, exit 0
```

Left as a recorded limit rather than defended against: this is a local
developer tool run by hand, the argument comes from the person at the keyboard,
and there is no trust boundary being crossed. Written up in
`docs/codebase/CONCERNS.md` so the next reader does not have to rediscover it.

## Findings left unresolved, with reasons

| Finding | Why it is still here |
|---|---|
| **D1** — `add` fails in a fresh clone because git does not track the empty lane directories `init` creates, and `init` refuses to repair them | Product defect on journey J2 with an open ledger entry. The fix is a behaviour change on the primary journey and belongs to the product loop, which owns the browser/journey evidence. Pinned by a test that names D1 so the fix must flip it deliberately. |
| **D2** — `templates/gmail-magic-resend.html` ships no `<meta name="viewport">`, so phones render it at 38% | Same reason. No change in this pass touched that file, and re-proving it needs a rendered browser measurement this pass did not run. |
| **D3** — the recorder was another product's script | **Resolved by deletion.** The other two files in the same class (`verifier.mjs`, `probe-routes.mjs`), which D3 did not name, went with it. |
| **D4** — `npm test` had zero assertions | **Resolved.** 18 scenario tests, each running the real CLI in a throwaway directory. |
| **D5** — `entry` subcommand documented but not implemented | **Half resolved.** The false documentation is deleted; the verb is still unbuilt. Building it is feature work. |
| **D6** — `init` pointed first-time users at a file that only exists after a later step | **Resolved**, with a test that follows the printed steps literally. Knocked out against the old ordering to prove it can fail: 17 pass / 1 fail before the fix, 18 pass after. |
| **D7** — new lanes carry the template's sample entries | New this pass, reproduced above. Product work. |
| 15-line ASCII excerpt still duplicated between `README.md` and `templates/runtime-diagram.md` (321 tokens) | Deliberate. A reader needs to see *something* to know whether to click through. The remaining excerpt is the top box only; the other 72 lines are gone. |
| 6-line clone between `templates/CHANGELOG-TEMPLATE.md` and `templates/lane.md` | Deliberate. They are two files with two consumers — one becomes `CHANGELOG/TEMPLATE.md`, one becomes each lane — and both must independently state the entry format. Merging them would create an indirection where a copy is cheaper. |
| 83-line clone reported between `AGENTS.md` and `SKILL.md` (53 tokens) | jscpd is matching box-drawing characters in the two diagram skeletons. The two files exist on purpose: `install` copies `AGENTS.md` alone to Cursor / Cline / Aider and both to Claude Code. Documented in `docs/codebase/CONVENTIONS.md` as the drift risk it is. |
| ANSI colour codes emitted unconditionally, including when stdout is redirected | One-line fix (`process.stdout.isTTY`), but it changes output bytes for every non-terminal consumer and this pass is not mixing behaviour changes into a structural one. Recorded in `docs/codebase/CONCERNS.md` with the fix named. |
| `submissions/nodebench-redesign/` — 13 files including two MP4s and two GIFs | Evidence from a past submission, not product code. `package.json#files` does not ship it, so it costs installers nothing. Deleting someone's recorded evidence is not simplification. Its role is explained in `docs/codebase/STRUCTURE.md`. |
| `templates/qa-packet.md:206` → `- Use SitFlow's [` links to `github.com/jayneebui/sitflow-mobile` on a named branch | A cross-repository reference this pass cannot verify is reachable for a stranger. Flagged in `docs/codebase/CONCERNS.md`; changing it needs someone who knows whether that repo is public. |

## What did not change

Verified rather than asserted. Every subcommand was run against a worktree at
`e2bb028` and against the tip, in matched throwaway directories, and both the
printed output and the resulting file tree were diffed:

```bash
# 15 invocations per side, ANSI stripped, temp paths and today's date normalised
diff out-before.txt out-after.txt
# then: same commands, compare the produced file trees and md5 of every file
```

The file tree produced is **identical**. The output diff and the content diff
show exactly three differences, all three of them intended and each with its
own commit:

1. `init`'s next-steps list is reordered — defect D6.
2. `add` prints `CHANGELOG\components\Button.md` where it previously printed
   the full absolute path. Windows-only; `relative()` replacing a `.replace()`
   that never matched a backslash.
3. `CHANGELOG/README.md`, the file `init` copies, has different content — the
   SitFlow index replaced by a skeleton. Every other file `init`, `add`, `qa`
   and `qa-init` produce is byte-identical.

Unchanged: zero dependencies, all five subcommands and their arguments, every
exit code the promotion baseline recorded, the package name, both binary names,
the published contract, and `AGENTS.md` / `SKILL.md` as two separate files.
