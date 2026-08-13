# Concerns

Everything known to be wrong or limited, each with a reproduction you can run.
A hunch is not a concern; if it is listed here, someone observed it.

The live product ledger is `promotion/PROMOTION_LOG.md` and it is the
authority on defect severity and status. This page adds the engineering
detail and the limits that are not defects.

## Open defects

### D2 — the emitted HTML has no viewport meta (major)

`templates/gmail-magic-resend.html` ships no `<meta name="viewport">`, so
mobile browsers fall back to a 980px legacy layout and shrink the page to 38%.
Measured on an emulated Pixel 8: `document.documentElement.clientWidth === 980`,
`visualViewport.scale === 0.383`. The page's own copy says to open it on a
phone. Full evidence in `promotion/PROMOTION_LOG.md`.

### D5 — `entry` subcommand still unbuilt (minor)

Prepending an entry to a lane is the protocol's central action and there is no
command that automates it. The false documentation was removed in the wave-3
pass; the verb was not written, because writing it is feature work.

### D7 — new lanes carry the template's sample entries (minor, new)

```bash
cd "$(mktemp -d)"
node <repo>/bin/init.mjs init >/dev/null
node <repo>/bin/init.mjs add components Button >/dev/null
grep -c '^## YYYY-MM-DD —' CHANGELOG/components/Button.md   # 3
grep -n 'abc1234' CHANGELOG/components/Button.md            # a fake commit sha
```

`addLane()` substitutes only the topmost heading of `templates/lane.md`. The
sample entries below it survive, one of them carrying `abc1234` as a commit
sha, and the newest entry keeps a dangling `**Touches**:` placeholder. A user
who does not clean up commits fake history into an append-only file. Pinned at
the observed count by a test that names D7.

## Limits that are not defects

### Path traversal in the `slug` argument

```bash
cd "$(mktemp -d)" && mkdir sub && cd sub
node <repo>/bin/init.mjs init >/dev/null
node <repo>/bin/init.mjs add components ../../escaped   # ✓ Created escaped.md, exit 0
```

`slug` is joined into a path without validation (`bin/init.mjs:161` →
`const target = join(dir,`), so it can
write outside `CHANGELOG/`. Recorded rather than fixed: this is a local
developer tool, the argument comes from the person at the keyboard, and no
trust boundary is crossed. It becomes a real defect the moment anything drives
this CLI with an argument it did not author — a CI job templating a slug from a
branch name, for instance. If that day comes, reject a slug that is not
`[A-Za-z0-9._-]+`, in `addLane()`, once.

### ANSI colour codes are emitted unconditionally

Redirect the output and the escape sequences go into the file:

```bash
cd "$(mktemp -d)" && node <repo>/bin/init.mjs init > out.txt && head -c 40 out.txt | cat -v
```

Agents that capture this CLI's stdout get escape codes in their transcript; the
test suite has to strip them. One-line fix — gate `C` on
`process.stdout.isTTY`. Not done in this pass because it changes the output
bytes for every non-terminal consumer and that is a behaviour change, which
does not belong in a structural commit.

### `fs.cp` on Node 18 and 20

`bin/init.mjs:299` → `await cp(TPL_DIR, join(dest, "templates"), { recursive: true });`
uses `cp` from `node:fs/promises`, which was marked Stable
only in Node v22.3.0. `engines.node` still says `>=18`. It works on 18 and 20,
both of which are past end-of-life; if a user on one of them reports an
`ExperimentalWarning` during `easier install`, that is the cause, and the fix
is to raise `engines.node` rather than to reintroduce a hand-rolled copy.

### `templates/qa-packet.md` links to another repository on a named branch

Line 206 points at `github.com/jayneebui/sitflow-mobile` on branch
`homen/may2026-prod-hardening`. This pass could not verify that a stranger can
open it. If it is not public the link should go; deciding that needs someone
who knows the repo's visibility.

### Windows line endings inside generated lane files

`addLane()` reads a template checked out with CRLF on Windows and substitutes
using `\n`, so the produced file mixes both. Cosmetic in markdown, and it
disappears if the repo ever gains a `.gitattributes`. Nothing depends on it.

## Coverage gaps worth knowing about

- `install user`, `install cursor`, `install cline` and `install aider` have no
  tests. Only `project` and `auto` are exercised. See TESTING.md.
- Nothing here opens a browser. The one rendered artifact is covered only by
  the promotion baseline's manual measurements.
- Everything was measured on Node v22.22.2 on Windows 11. Nothing has been run
  on macOS or Linux in this pass.

## Things that look like problems and are not

- **`AGENTS.md` and `SKILL.md` overlap heavily.** Deliberate: different
  consumers, no build step. The real risk is drift, and the rule against it is
  in CONVENTIONS.md.
- **jscpd reports an 83-line clone between those two files.** It is matching
  box-drawing characters in two ASCII diagram skeletons — 53 tokens across 83
  lines.
- **`submissions/` contains video files.** Evidence from a past hand-off, not
  shipped to installers. See STRUCTURE.md.
- **`knip` and `dependency-cruiser` report nothing.** That is the current
  state, not a misconfiguration. Both commands are in
  `docs/SIMPLIFICATION_REPORT.md` and both had findings before this pass.
