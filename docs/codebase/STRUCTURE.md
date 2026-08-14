# Structure

Every tracked file, what it is for, and who consumes it. This is the one
inventory — `README.md`, `AGENTS.md` and `SKILL.md` used to each keep their own
copy and all three had drifted, so they now point here instead.

## Top level

| Path | Lines | What it is | Read by |
|---|---:|---|---|
| `README.md` | 173 | The shop window. Install, what the four artifacts are, why per-surface beats a repo-wide changelog. | humans arriving from npm or GitHub |
| `SKILL.md` | 334 | **The contract**, in Claude Code skill format with YAML front-matter declaring its trigger phrases. Five phases. | Claude Code, and humans applying the protocol by hand |
| `AGENTS.md` | 220 | The same contract, agent-agnostic. Six numbered steps, plain markdown and bash. | Cursor, Cline, Aider, Codex, Continue.dev, any LLM |
| `INTEGRATIONS.md` | 191 | Which other tools implement the QA-packet contract, and the boundary between "this repo defines the schema" and "another repo generates artifacts". | anyone wiring up a generator |
| `package.json` | 54 | Two binary names (`easier-to-read-submissions`, `easier`), the `files` allow-list, `engines`, and the test script. | npm |
| `LICENSE` | 21 | MIT. | — |

## `bin/` — the whole program

| Path | Lines | What it is |
|---|---:|---|
| `bin/init.mjs` | 339 | Every subcommand, the dispatcher, the colour helpers, the category vocabulary. There is no second source file. Walk it in runtime order via `docs/START_HERE.md`. |

## `test/` — the behaviour lock

| Path | Lines | What it is |
|---|---:|---|
| `test/cli.test.mjs` | 369 | 20 scenario tests. Each runs the real CLI as a subprocess in a throwaway directory and asserts the exit code plus the files that landed. One pins a known defect on purpose and says so; three guard the walkthroughs and the documented invocation. |

## `templates/` — everything the CLI copies into a user's repo

Nothing here is imported. Every file is data: it is either copied verbatim or
copied with `__PLACEHOLDER__` substitution. That is why `knip` reports no
unused exports — there are none.

| Path | Lines | Copied by | Becomes |
|---|---:|---|---|
| `CHANGELOG-README.md` | 86 | `easier init` | `CHANGELOG/README.md` — the master index the adopter fills in |
| `CHANGELOG-TEMPLATE.md` | 52 | `easier init` | `CHANGELOG/TEMPLATE.md` — the entry format spec |
| `lane.md` | 28 | `easier add <category> <slug>` | `CHANGELOG/<category>/<slug>.md`, with the path and today's date substituted |
| `bootstrap-prompt.md` | 95 | `easier install` (as part of `templates/`) | the prompt you hand parallel subagents to backfill lanes from `git log` |
| `runtime-diagram.md` | 220 | `easier install` | format spec plus four worked ASCII diagrams (one, two, three, and five layers). The single copy — `README.md` shows only the top box and links here. |
| `qa-packet.md` | 211 | `easier install` | the full QA-packet protocol doc, read once |
| `qa-packet-schema.json` | 193 | `easier install` | **the contract** every QA-packet generator conforms to |
| `qa-states.example.json` | 160 | `easier qa-init` | `qa.config.json` at the adopter's repo root |
| `qa-dogfood-packet.md` | 67 | `easier qa <id>` | `QA_DOGFOOD/<id>/README.md` |
| `qa-dogfood-manifest.json` | 73 | `easier qa <id>` | `QA_DOGFOOD/<id>/manifest.json` |
| `gmail-magic-resend.html` | 107 | `easier qa <id>` | `QA_DOGFOOD/<id>/gmail-magic-resend.html` — **the only file this product renders in a browser** |
| `remotion-storyboard.json` | 47 | `easier qa <id>` | `QA_DOGFOOD/<id>/remotion-storyboard.json` |
| `qa-email.html.mustache` | 111 | `easier install` | the Gmail Magic Resend email template, rendered by a generator, not by this CLI |

Placeholder substitution is three tokens only — `__FEATURE_ID__`, `__TITLE__`,
`__DATE__` — done at `bin/init.mjs:252` →
`async function writeTemplate(templateName, dest, replacements) {`. A test asserts
none of the three survive into a generated packet.

## `promotion/` — the product loop's state, in git

| Path | What it is |
|---|---|
| `PRODUCT_GOAL.md` | Who opens this and what they are trying to finish; the twelve-condition scorecard |
| `PRODUCT_JOURNEYS.md` | The five canonical journeys, J1-J5 |
| `PROMOTION_LOG.md` | **The live defect ledger.** Read this before you believe anything works. One entry per loop iteration, append-only. |
| `SKILLS.md` | Which skills the loop uses |

This directory is not shipped by `package.json#files`. It is the record of a
different loop from the one that produced `docs/` — the product loop drives
journeys and files defects; the wave-3 pass reduced and documented the code.
Where they disagree, `PROMOTION_LOG.md` is the authority on what is broken and
`docs/SIMPLIFICATION_REPORT.md` is the authority on what changed.

## `submissions/` — evidence from a past hand-off

`submissions/nodebench-redesign/` holds 14 files: a README, an ASCII runtime
diagram, three per-surface changelog entries under `changelog/`, two demo
write-ups, two scene definitions and one assertion result as JSON, and four
media files (two MP4s and two GIFs) that are the recorded demo.

It is **not product code and not a template**. It is what this protocol's
output actually looked like on one real submission, kept as evidence. It is not
in `package.json#files`, so nobody who installs the package downloads it. If
you are looking for a worked example of the protocol applied end to end, this
is it.

## `docs/` — this packet

| Path | What it is |
|---|---|
| `START_HERE.md` | The code in the order it runs, one step per stage |
| `SIMPLIFICATION_REPORT.md` | What the wave-3 pass removed, measured before and after, with every evidence command |
| `codebase/*.md` | This reference set |

## `.tours/` — CodeTour walkthroughs

JSON files consumed by the CodeTour VS Code extension. Each step names a file
and a line. `test/cli.test.mjs` asserts every one of those references still
resolves, so a tour cannot rot silently.

## What is deliberately absent

No `src/`, no `lib/`, no `dist/`. No server, no database, no migrations, no
component library, no environment file. If you are looking for one of those,
it does not exist rather than being somewhere clever.
