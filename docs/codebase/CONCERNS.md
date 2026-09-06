# Concerns

Everything known to be wrong or limited, each with a reproduction you can run.
A hunch is not a concern; if it is listed here, someone observed it.

`promotion/PROMOTION_LOG.md` preserves the observations made at its recorded
source versions. This page describes current behavior and remaining limits;
resolved behavior does not rewrite the old evidence.

## Current behavior and open gaps

### D8 — the protocol needs a recorder supplied by the adopter

The old journey describes recorder and verifier files that were removed because
they were specific to another application. The current README now says what
ships: scaffolding, instructions, and contracts. The adopter still needs a
recorder and verifier for their own routes; this CLI neither creates those
executables nor runs them. Historical J5 and D8 observations remain unchanged
in `promotion/`; correcting the feature description does not implement J5.

### D5 — `entry` subcommand still unbuilt (minor)

Prepending an entry to a lane is the protocol's central action and there is no
command that automates it. The false documentation was removed in the wave-3
pass; the verb was not written, because writing it is feature work.

### D7 — fresh history must leave unavailable facts pending

The original `add` output carried two apparent historical entries and sample
commit hashes. The current lane template instead leaves the current change,
commit, and author visibly unfilled, with one fenced reusable format example.
The CLI personalizes the surface and date; it does not infer historical events.
Existing lane histories are never regenerated. The old D7 failure is preserved
in the historical promotion record; use the current scenario proof for the
changed behavior.

## Closed defects worth remembering

### D2 — the emitted HTML had no viewport meta (major, closed 2026-08-13)

`templates/gmail-magic-resend.html` shipped no `<meta name="viewport">`, so
mobile browsers fell back to a 980px legacy layout and shrank the page to 38%.
Measured on an emulated 375×812 phone: `clientWidth === 980`,
`visualViewport.scale === 0.383`, 13px table text at 4.97 effective px. The
page's own copy says to open it on a phone.

Closed by one meta tag and re-measured through `promotion/evidence/audit.mjs`:
`clientWidth 375`, `scale 1`, 13 effective px, 0 px horizontal overflow.
Screenshot at `promotion/evidence/screenshot-mobile-375.png`. Kept here rather
than deleted because the shape of the bug — a template that claims a device it
was never laid out for — is the one most likely to come back.

## Limits that are not defects

### Filename and concurrent-write boundaries

The original lane name was joined directly into a path. A coding agent could
therefore write outside the intended category even without a network service.
The current boundary rejects path separators, dot aliases, control characters,
and Windows alternate-stream syntax before creating directories, while allowing
meaningful Unicode names. New lane files are created exclusively so duplicate
writers cannot both replace the same history.

Installer copies preserve differing existing content and report a manual-merge
conflict. An identical completed file can be a no-op; a concurrent reader may
observe an incomplete new copy and refuse honestly. Copying is not transactional,
and a failed install can leave its newly created files. QA packet creation
reserves its leaf directory before writing members; an existing packet is not
replaced. These guarantees do not certify arbitrary symlinked parent directories
or every possible filesystem race.

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

### Runtime compatibility

The declared Node range is broader than the local Windows execution evidence.
The current installer uses native exclusive-copy behavior to preserve files;
its exact built-in imports and tested runtime are listed in STACK.md. A
successful local run does not certify every supported OS, filesystem, or shell.

### `templates/qa-packet.md` links to another repository on a named branch

Line 206 points at `github.com/jayneebui/sitflow-mobile` on branch
`homen/may2026-prod-hardening`. This pass could not verify that a stranger can
open it. If it is not public the link should go; deciding that needs someone
who knows the repo's visibility.

### Generated line endings

Generated files derive from the checked-out templates. Preserve their actual
bytes when recording source, package, and installed-consumer evidence, and
disclose any observed npm hashbang normalization separately. Markdown rendering
alone does not establish byte identity.

## Coverage gaps worth knowing about

- Installer preservation and detection use owned profiles and destinations.
  They do not activate a real coding-agent host or modify a personal profile.
  See TESTING.md for the exact finite scenarios and current command evidence.
- `npm test` does not render HTML. The current template wraps table/code
  content and presents four unconfigured review labels as ordinary text, with
  explicit disclosure. Its separate browser proof remains required. No Gmail
  delivery, functional approval action, or completed review follows from it.
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
