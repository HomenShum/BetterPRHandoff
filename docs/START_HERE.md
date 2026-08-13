# Start here

You have never seen this repo. This page walks the code in the order it
actually runs, not the order the folders are arranged in. Follow it top to
bottom and you will have traced a full user action end to end.

Every code citation below is written `path:line` → `the text on that line`.
The arrow half is not decoration: `npm test` reads these citations and asserts
that the cited line still contains that text, so a citation cannot rot into
pointing at the wrong symbol while still pointing at a line that exists.

## What this thing is, in plain language

A developer has spent a week changing code and is about to hand the branch to
somebody else — a reviewer, a teammate taking over, themselves in three months,
or the next AI coding assistant that opens the repo. The person picking it up
opens the commit history, sees "fix", "wip", "address feedback", and cannot
answer a plain question like *what has the checkout screen looked like over the
last six months, and why did it change*.

This repo's answer is a filing system plus the rules for keeping it filled in.
The filing system is one dated, append-only markdown file per screen, component,
server module, database table, integration and script — a **per-surface
changelog lane**. The rules live in `AGENTS.md` and `SKILL.md`, which the
developer's own coding assistant reads before every commit.

**The product is rules and empty folders. It does not run an agent for anyone.**
The command-line tool in this repo creates the folders and copies the rules to
wherever the developer's assistant will read them. That is the whole scope, and
knowing it up front saves you looking for a server, a database or a model call
that does not exist.

## Run it before you read it

```bash
npm install          # zero dependencies; confirms the toolchain works
npm test             # 20 scenario tests, ~4s
cd "$(mktemp -d)" && node <this-repo>/bin/init.mjs init
```

That last command is the primary user action. Everything below traces what it
did.

---

## Step 1 — Application entry and route

- **File**: `bin/init.mjs`
- **Symbol**: the argument read at `bin/init.mjs:42` → `const args = process.argv.slice(2);`,
  and the dispatch block that starts at `bin/init.mjs:322` → `(async () => {`
- **Called by**: the shell. `package.json` maps two binary names,
  `easier-to-read-submissions` and `easier`, to this one file, so
  `npx @homenshum/easier-to-read-submissions init` and `node bin/init.mjs init`
  are the same entry. `npx easier` is not — that word belongs to an unrelated
  package on npm.
- **Calls next**: exactly one of `init()`, `addLane()`, `qaInit()`,
  `scaffoldQaPacket()`, `install()`, or `help()`.
- **Why this exists**: a command-line tool has no router and no request object.
  The first word after the program name *is* the route, and this if/else chain
  is the whole routing table. There is no framework in between, which is the
  point — a reader can hold all five routes in their head.

```js
const args = process.argv.slice(2);
const cmd = args[0] || "help";
// …
if (cmd === "init") await init();
else if (cmd === "add") await addLane();
else if (cmd === "qa-init") await qaInit();
else if (cmd === "qa") await scaffoldQaPacket();
else if (cmd === "install") await install();
else if (cmd === "--help" || cmd === "-h" || cmd === "help") help();
```

- **Input**: `process.argv`. Nothing else. No config file is read, no
  environment variable is required, no network call is made.
- **Output**: lines on stdout, files on disk, and a process exit code.
- **Failure behavior**: an unrecognised word prints `✗ Unknown command: <word>`,
  then the full help, then exits **1**. No word at all is treated as `help` and
  exits **0**.
- **Next**: step 2.

## Step 2 — The primary user action

- **File**: `bin/init.mjs`
- **Symbol**: `bin/init.mjs:97` → `async function init() {`
- **Called by**: the dispatcher, on `init`.
- **Calls next**: `mkdir` and `copyFile` from `node:fs/promises`. Nothing in
  this repo.
- **Why this exists**: this is the moment a repo adopts the protocol. It
  creates `CHANGELOG/` with six empty lane directories, drops in the master
  index and the format spec, and prints the three things to do next.

```js
if (existsSync(cl)) {
  console.log(C.yellow(`! CHANGELOG/ already exists at ${cl}`));
  console.log(C.dim("  Skipping scaffold to avoid clobbering existing lanes."));
  return;                       // exit 0 — refusing is not an error
}
for (const sub of CATEGORIES) {
  await mkdir(join(cl, sub), { recursive: true });
}
await copyFile(join(TPL_DIR, "CHANGELOG-README.md"), join(cl, "README.md"));
await copyFile(join(TPL_DIR, "CHANGELOG-TEMPLATE.md"), join(cl, "TEMPLATE.md"));
```

- **Input**: the current working directory.
- **Output**: `CHANGELOG/README.md`, `CHANGELOG/TEMPLATE.md`, and the six
  directories `pages/ components/ server/ db/ integrations/ scripts/`.
- **Failure behavior**: if `CHANGELOG/` already exists it writes nothing and
  exits **0**. This is deliberate — a second run must never overwrite a lane
  that already holds real history. It still does not *repair* a partially
  present `CHANGELOG/`, and it does not have to: `add` now creates whatever
  lane directory it needs (step 6), so a half-present `CHANGELOG/` is no longer
  a dead end. That dead end was defect **D1**, now closed.
- **Next**: step 3.

## Step 3 — Validation and domain types

- **File**: `bin/init.mjs`
- **Symbol**: `bin/init.mjs:40` → `const CATEGORIES = ["pages", "components", "server", "db", "integrations", "scripts"];`,
  enforced at `bin/init.mjs:146` → `if (!CATEGORIES.includes(category)) {`
- **Called by**: `init()`, `addLane()`, and the help text.
- **Calls next**: nothing; on a bad value it exits.
- **Why this exists**: there are exactly six kinds of surface a change can
  touch, and that list is the domain vocabulary of the entire protocol. It is
  a lane directory name, a valid argument, and a line of help text all at once.
  It is declared here once so those three cannot drift apart — before the
  wave-3 pass the same six words were written out in four places.

```js
const CATEGORIES = ["pages", "components", "server", "db", "integrations", "scripts"];
// …
if (!CATEGORIES.includes(category)) {
  console.error(C.red(`✗ Bad category: ${category}`));
  console.error(C.dim(`  Must be one of: ${CATEGORIES.join(", ")}`));
  process.exit(1);
}
```

- **Input**: the first word after `add`.
- **Output**: nothing on success — validation is a gate, not a transform.
- **Failure behavior**: exits **1** and lists all six valid values, so the user
  never has to go find the list.
- **Note on trust**: `slug` is *not* validated. It is joined into a path
  (`join(dir, slug + ".md")`), so `easier add components ../../evil` escapes the
  `CHANGELOG/` directory. This is a local developer tool run by hand on the
  user's own machine, so it is recorded as a known limit rather than defended
  against — see `docs/codebase/CONCERNS.md`.
- **Next**: step 4.

## Step 4 — Agent orchestration

**This stage does not exist in this codebase, and that is a design decision
rather than a gap.**

The product is a protocol other people's agents follow. No model is ever
called, no prompt is ever sent, no API key is ever read. What plays the part of
"orchestration" is a pair of markdown files that a user's own assistant reads:

- `AGENTS.md` — the agent-agnostic instruction set (Cursor, Cline, Aider,
  Codex, any LLM). Six numbered steps the assistant runs before every commit.
- `SKILL.md` — the same protocol in Claude Code's skill format, with YAML
  front-matter that declares when it should trigger.

If you are looking for where the "agent" lives, it is `AGENTS.md` step 1
through step 6. Reading those two files is how you learn what this tool is
scaffolding *for*.

## Step 5 — Tool registration and invocation

**No tool registry exists**, for the same reason as step 4 — there is no agent
to register tools with.

The nearest structural analogue is the subcommand table in step 1: five verbs,
each a plain async function, dispatched by string match. If you were adding a
sixth verb you would add one `else if` in the dispatcher, one function, one
block of help text, and one test. Nothing else registers it.

## Step 6 — Persistence and artifact mutation

- **File**: `bin/init.mjs`
- **Symbol**: `bin/init.mjs:135` → `async function addLane() {` and
  `bin/init.mjs:252` → `async function writeTemplate(templateName, dest, replacements) {`
- **Called by**: the dispatcher, on `easier add <category> <slug>` and
  `easier qa <feature-id>`.
- **Calls next**: `readFile` then `writeFile` from `node:fs/promises`.
- **Why this exists**: this is the only place the tool creates a file with
  *content* rather than copying one. It reads a template, substitutes the
  caller's values, and writes the result. The "database" of this product is the
  user's git repository; a lane file is a row.

```js
const tpl = await readFile(join(TPL_DIR, "lane.md"), "utf8");
const today = new Date().toISOString().slice(0, 10);
const personalized = tpl
  .replace("<relative/path/to/file>", `${category}/${slug}`)
  .replace("YYYY-MM-DD — Short imperative title (most recent)",
           `${today} — Created — initial implementation`);
await writeFile(target, personalized);
```

- **Input**: a category, a slug, and `templates/lane.md`.
- **Output**: `CHANGELOG/<category>/<slug>.md`, dated today.
- **Failure behavior**: refuses to overwrite an existing lane (exit **1**),
  because lanes are append-only and clobbering one destroys the audit trail
  that is the entire point of the product. A missing category directory is
  *not* a failure — `bin/init.mjs:159` → `await mkdir(dir, { recursive: true });`
  creates it. It used to exit **1** there, which was defect D1: git does not
  track empty directories, so the five lane folders `init` leaves empty never
  reach the second person on the team.
- **Known gap**: substitution is partial. The template's two sample entries
  survive into the new lane carrying a fake commit sha. That is defect **D7**,
  pinned by a test so a fix has to change it deliberately.
- **Next**: step 7.

## Step 7 — Streaming and rendering

**There is no streaming.** Every verb is synchronous file scaffolding that
finishes in under half a second, so there is no progress to stream and nothing
to keep a user waiting.

Rendering is `console.log` plus six ANSI colour helpers:

- **File**: `bin/init.mjs`
- **Symbol**: `bin/init.mjs:60` → `const C = {`
- **Why this exists**: a CLI's entire user interface is its stdout. Green means
  a file was written, yellow means the tool declined to act and that is fine,
  red means it stopped.

```js
const C = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  // …
};
```

- **Known limit**: the escape codes are emitted unconditionally, including when
  output is redirected to a file. See `docs/codebase/CONCERNS.md`.

The one thing this product renders in a browser is
`QA_DOGFOOD/<feature-id>/gmail-magic-resend.html`, written by
`easier qa <feature-id>` from `templates/gmail-magic-resend.html`. It is a
static email preview — no scripts, no fonts, no images.

## Step 8 — Failure and recovery

- **File**: `bin/init.mjs`
- **Symbol**: the `try/catch` wrapping the dispatcher, caught at
  `bin/init.mjs:335` → `} catch (e) {`
- **Called by**: nothing — it is the outermost frame.
- **Calls next**: `process.exit(1)`.
- **Why this exists**: so a user never sees a Node stack trace. Any error
  thrown anywhere inside any verb surfaces as one red line.

```js
} catch (e) {
  console.error(C.red("✗ FATAL:"), e?.message || e);
  process.exit(1);
}
```

- **Failure behavior, as a whole**: exit **0** means the requested state now
  exists (including "it already existed, so nothing was done"). Exit **1** means
  it does not, and a line beginning `✗` says why. There is no retry anywhere and
  no partial rollback — a verb that fails halfway leaves whatever it had already
  written, which is safe here because everything it writes is new files in new
  directories.
- **The recovery path that used to be broken**: `add` in a freshly cloned repo
  failed with `CHANGELOG\pages does not exist` and told you to run `init`;
  `init` then saw `CHANGELOG/` and declined. That closed loop was defect **D1**.
  It is closed — `add` creates the directory — and the test that used to pin the
  failure now asserts the recovery.

## Step 9 — The tests that prove this flow

- **File**: `test/cli.test.mjs`
- **Symbol**: 20 `test(...)` blocks, grouped by journey
- **Called by**: `npm test` → `node --test test/cli.test.mjs`
- **Why this exists**: before the wave-3 pass, `npm test` ran
  `node bin/init.mjs --help` — a help print with zero assertions, green in a
  way that could not go red. Every behaviour above was verified by hand and
  unprotected.

Each block runs the real CLI as a subprocess in a throwaway directory and
asserts the exit code plus the files that actually landed on disk:

```js
function easier(cwd, ...args) {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8" });
  const strip = (s) => (s || "").replace(/\x1b\[[0-9;]*m/g, "");
  return { code: r.status, out: strip(r.stdout) + strip(r.stderr) };
}
```

Which test proves which step:

| Step | Test |
|---|---|
| 1 — entry and routing | `help lists every subcommand the dispatcher actually handles`, `an unknown command fails and shows the help instead of a stack trace` |
| 2 — primary action | `J1 init scaffolds the six lanes, the index and the format spec`, `J1 init on an existing CHANGELOG refuses to clobber and still exits 0` |
| 3 — validation | `J1 add rejects a category that is not one of the six, and lists the six`, `J1 add with no arguments prints usage and fails` |
| 6 — persistence | `J1 add writes a dated lane file naming the surface it tracks`, `J4 qa scaffolds four packet files with every placeholder substituted` |
| 7 — rendering | `J1 the next steps init prints can be followed in the order printed (D6)` |
| 8 — failure paths | `J2 add creates the lane directory git dropped from the clone (D1)`, `J4 qa with no feature id, and qa on an existing packet, both fail loudly` |
| install | `J3 install project copies the contract and every template into .claude/skills`, `J3 install auto-detects a git repo as a project install`, `J3 install rejects an unknown target and lists the real ones` |
| this document's citations | `every .tours step names what it expects to find, and finds it there`, `every doc citation of the form ``path:line`` proves it cites the right line`, `no shipped instruction says ``npx easier <verb>``` |

One of those tests pins behaviour that is **wrong on purpose** — D7. It says so
in a comment naming the defect, so fixing the defect forces a deliberate edit to
the test rather than a silent one. There were two: the D1 block was unpinned
this pass, and it kept the old expectation in its comment so the change reads as
deliberate rather than as a quietly weakened assertion.

The last three rows are the guards over this page and the two CodeTours. Until
this pass the only one that existed checked that a cited line number was inside
the file — true of every wrong line too. It is now an error to cite a line
without naming what should be on it.

---

## Where you would extend it

| You want to… | Touch |
|---|---|
| add a seventh surface category | `bin/init.mjs:40` → `const CATEGORIES = ["pages", "components", "server", "db", "integrations", "scripts"];`, the lane taxonomy in `AGENTS.md` step 1 and `SKILL.md` Phase 1, and the index skeleton in `templates/CHANGELOG-README.md` |
| add a new subcommand | one `else if` in the dispatcher, one async function, one help block, one test block |
| change what a new lane file looks like | `templates/lane.md` — but read D7 first, because `addLane()` only substitutes part of it |
| change what the protocol asks an agent to do | `AGENTS.md` *and* `SKILL.md`. They are deliberately two files: `install` copies `AGENTS.md` alone to Cursor / Cline / Aider, and both to Claude Code. Changing one without the other is the most likely way to introduce drift here. |
| change the QA packet shape | `templates/qa-packet-schema.json` is the contract; other tools generate against it. See `INTEGRATIONS.md`. |

## Reading order after this page

1. `docs/codebase/STRUCTURE.md` — what every file is, and who consumes it
2. `docs/codebase/ARCHITECTURE.md` — the boundaries and the one invariant
3. `docs/codebase/CONCERNS.md` — every known defect and limit, with reproductions
4. `promotion/PROMOTION_LOG.md` — the live defect ledger
5. `docs/SIMPLIFICATION_REPORT.md` — what the wave-3 pass removed and why
