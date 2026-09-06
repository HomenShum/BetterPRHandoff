# Architecture

## The one thing to hold in your head

**This repo ships rules and empty folders. It does not run an agent for
anyone.**

That single sentence explains every structural choice below. If you are
expecting a service, a model call, a queue or a database, none exist, and their
absence is the design rather than an unfinished part of it.

## The two halves, and the line between them

```
┌──────────────────────── WHAT THIS REPO IS ────────────────────────┐
│                                                                   │
│  THE PROTOCOL (markdown, read by somebody else's agent)           │
│    · SKILL.md          five phases, Claude Code skill format      │
│    · AGENTS.md         same six steps, any other agent            │
│    · templates/*.md    the forms the protocol fills in            │
│    · templates/qa-packet-schema.json   the shared contract        │
│                                                                   │
│  THE SCAFFOLDER (one node file, run by a human at a shell)        │
│    · bin/init.mjs      init · add · qa-init · qa · install        │
│                                                                   │
└───────────────────────────────┬───────────────────────────────────┘
                                │ writes files into
                                ▼
┌──────────────────── THE ADOPTER'S OWN REPOSITORY ─────────────────┐
│                                                                   │
│   CHANGELOG/<category>/<slug>.md   one append-only lane per       │
│                                    surface — the durable state    │
│   qa.config.json                   which states get QA'd          │
│   QA_DOGFOOD/<feature-id>/         one reviewer hand-off packet   │
│   .claude/skills/… or .clinerules  the rules, where the adopter's │
│                                    own agent will read them       │
│                                                                   │
└───────────────────────────────┬───────────────────────────────────┘
                                │ conforms to qa-packet-schema.json
                                ▼
┌──────────────── GENERATORS (other repos, not this one) ───────────┐
│   Parity Studio, your CI, your own tool — they capture the        │
│   screenshots, build the GIFs, send the email. See INTEGRATIONS.md│
└───────────────────────────────────────────────────────────────────┘

Legend:  · UNCHANGED by this pass
```

The line that matters is the bottom one. **This repo defines the schema;
other repos generate the artifacts.** Every time someone has been tempted to
put generation in here, the result was a script hard-coded to one product —
which is exactly what the wave-3 pass deleted 753 lines of. If a change needs
Playwright, ffmpeg, or an API key, it belongs on the far side of that line.

## Durable state lives in the user's git repository

There is no database and no cache. Lane files hold the history, and Git records
changes to those files. Git does not prevent two local CLI processes from
writing the same new destination: creation must reserve that destination at
the filesystem boundary. Existing history remains append-only.

The CLI holds no in-memory state between runs. Every subcommand reads
`process.argv` and the filesystem, writes files, and exits. Existing scaffolds
are preserved; `add` and `qa` refuse duplicate destinations. Installer copies
may reuse identical completed files, but different existing bytes produce a
nonzero conflict. `qa-init` deliberately preserves any existing configuration,
even if it differs from the example. There is no rollback: a failed install can
leave new files without replacing the developer's existing content.

## Boundaries

| Boundary | Where it is enforced | What it protects |
|---|---|---|
| Six surface categories, not seven | `bin/init.mjs:40` → `const CATEGORIES = ["pages", "components", "server", "db", "integrations", "scripts"];` | the lane taxonomy stays the same in the directory layout, the CLI, and both rule files |
| Never overwrite an existing lane | `bin/init.mjs:179` → `await writeFile(target, personalized, { flag: "wx" });` | the audit trail, which is the entire product |
| Never clobber an existing `CHANGELOG/` | `bin/init.mjs:102` → `await mkdir(cl);` | atomic creation reserves the directory; an existing directory is a no-op, without validation of its contents |
| Preserve installed rules and templates | `bin/init.mjs:271` → `await copyFile(source, dest, constants.COPYFILE_EXCL);` | existing different bytes produce a manual-merge conflict; no overwrite permission follows from reading them |
| Reserve a QA packet before writing members | `bin/init.mjs:237` → `await mkdir(dir);` | only the process creating the leaf directory writes the packet |
| The package ships only what `files:` lists | `package.json:40` → `"files": [` | `promotion/`, `submissions/`, `docs/`, `test/` never land in a user's `node_modules` |
| QA packet shape | `templates/qa-packet-schema.json` | multiple generators stay interchangeable |

## Invariants

1. **Zero runtime dependencies.** This installs into other people's repos; a
   dependency here becomes a dependency there.
2. **No network at runtime.** The CLI makes no requests. Its only URL is a docs
   link it prints.
3. **No shell.** After the wave-3 pass, `bin/init.mjs` imports no
   `child_process`, so no code path can spawn a process.
4. **Exit code reports completion.** 0 means the requested scaffold exists or
   a documented existing-state no-op occurred. A nonzero conflict means the
   operation did not finish, even when earlier steps created files. Do not
   print `Installed` after that conflict or imply agent activation.
5. **Lanes are append-only.** Nothing in this repo ever edits an existing entry.

Invariants 2 and 3 became true only in this pass; the deleted scripts called
the Gemini Files API and spawned `ffmpeg`, `ffprobe` and `git`.

## What is deliberately not abstracted

- **Five subcommands dispatched by an if/else chain.** No command registry, no
  plugin interface. Five is a number a reader holds in their head; a registry
  would add a layer to look through without removing one.
- **`AGENTS.md` and `SKILL.md` as two files with overlapping content.** They
  have different consumers: `install` copies `AGENTS.md` alone to Cursor, Cline
  and Aider, and both to Claude Code. Merging them would need a build step in a
  package that has no build step. The cost is real — see CONVENTIONS.md for the
  drift rule.
- **Colour helpers as six one-line functions.** `util.styleText` would replace
  them but was added in Node 20.12, above the declared floor.
