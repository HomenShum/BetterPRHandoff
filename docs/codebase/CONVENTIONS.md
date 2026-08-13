# Conventions

Short, because most of the code is one file. These are the rules a change here
is expected to follow, each with the reason it exists.

## Naming

- **Subcommands are verbs a person would say**: `init`, `add`, `install`, `qa`.
  The one hyphenated name, `qa-init`, is hyphenated because it is `init` for the
  QA half, and reads that way.
- **The six categories are the domain vocabulary.** `pages`, `components`,
  `server`, `db`, `integrations`, `scripts`. They are a directory name, a CLI
  argument and a line of help text simultaneously. Do not paraphrase them
  anywhere; refer to `CATEGORIES` in code and to the same six words in prose.
- **A "lane" is one append-only file for one surface.** A "surface" is a thing a
  user or an operator meets — a screen, a component, an endpoint, a table, a
  third-party service, a script. Use both words consistently; a reader who has
  learnt them can read every other document here.
- **A "packet" is one reviewer hand-off artifact**, `QA_DOGFOOD/<feature-id>/`.

## Code style in `bin/init.mjs`

- **One file, no exports.** Adding a second source file means a reader has to
  hold a second file open. At 325 lines that trade is not worth making yet. If
  it ever is, the split to make first is the QA half.
- **One async function per subcommand**, named after the verb, dispatched by
  string match at the bottom.
- **Fail by `console.error` + `process.exit(1)`, never by throwing.** The
  outermost `try/catch` exists to turn an unexpected throw into one red line
  instead of a stack trace; expected failures should not reach it.
- **Every error message names the fix.** `✗ Bad category: widgets` is followed
  by the six valid values, so the user never has to leave the terminal. Keep
  that shape.
- **Node built-ins only.** See STACK.md for why.
- **Reach for the platform before writing a helper.** Three helpers were
  deleted in the wave-3 pass because `node:fs` and `node:path` already did the
  job. Check the standard library first; it is usually there.

## Markdown conventions

- **`AGENTS.md` and `SKILL.md` must be changed together.** They are the same
  contract for two audiences and there is no build step to generate one from
  the other. A change to a phase, a step, a category, or a file path in one
  belongs in the other in the same commit. This is the single most likely place
  for drift in the repo — it is not enforced by anything but this rule.
- **One canonical copy of anything long.** The four ASCII diagram examples live
  in `templates/runtime-diagram.md`; the template inventory lives in
  `docs/codebase/STRUCTURE.md`; the defect ledger lives in
  `promotion/PROMOTION_LOG.md`. Other documents link. This rule was written
  after a 72-line diagram was found byte-identical in two files.
- **Templates must not name another product.** A file under `templates/` is
  copied into a stranger's repository. Concrete routes, assert strings, brand
  names and personal names do not belong there — that mistake cost this repo
  753 lines of JavaScript and 127 lines of markdown, all deleted in one pass.
  Use `<placeholder>` shapes and generic examples.
- **Plain language before jargon.** Name the person and the job before the
  technical term: "someone handing a branch to a reviewer" before "per-surface
  changelog lane".

## Commits

The repo follows its own protocol — see `AGENTS.md` step 6. In short: a brief
imperative subject, a body that explains **why** rather than what, and every
non-obvious claim in the body backed by something the reader can re-run.
Commits from this pass are worth reading as examples; each one states the
measurement that justified it.

## Tests

- **Scenario, not unit.** Each test is a person trying to finish a job. See
  TESTING.md.
- **A test that pins a known defect says so in a comment, names the defect id,
  and states what the correct behaviour would be.** Two such tests exist (D1
  and D7). This is the only acceptable way to encode wrong behaviour: it makes
  fixing the defect require a deliberate edit, and it stops a future reader
  mistaking the assertion for a specification.
