# Testing

## Run them

```bash
npm test          # node --test test/cli.test.mjs — 18 tests, ~3s
```

No install step, no framework, no config file. `node:test` and
`node:assert/strict` ship with Node.

## What they are

18 scenario tests in one file, `test/cli.test.mjs`. Each one is a person trying
to finish a job, not a function with its inputs mocked.

They run the **real CLI as a subprocess** in a **real throwaway directory**,
and assert two things: the exit code, and the files that actually landed on
disk. Two helpers make that cheap:

```js
function easier(cwd, ...args) {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8" });
  const strip = (s) => (s || "").replace(/\x1b\[[0-9;]*m/g, "");
  return { code: r.status, out: strip(r.stdout) + strip(r.stderr) };
}

function sandbox(fn) {
  const dir = mkdtempSync(join(tmpdir(), "easier-test-"));
  try { return fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}
```

This shape is deliberate. The tool's entire job is "make the right files and
exit with a truthful code", so a test that stubbed the filesystem would prove
nothing anybody cares about. It also means a test failure is reproducible by
hand: copy the arguments out of the failing block and run them yourself.

## How they are grouped

By journey, matching `promotion/PRODUCT_JOURNEYS.md`:

| Group | Who | Tests |
|---|---|---|
| **J1** | a solo developer adopting the protocol in their own repo | 6 |
| **J2** | a teammate who cloned the repo the first developer committed | 1 |
| **J3** | someone installing the rules where their agent will read them | 3 |
| **J4** | someone preparing a reviewer hand-off packet | 4 |
| front door | a stranger guessing at the command line | 2 |
| upkeep | the CodeTour steps still point at real lines | 1 |
| D6 regression | the printed next-steps can be followed in the printed order | 1 |

## The two tests that pin wrong behaviour on purpose

This is the only sanctioned way to encode a known defect, and both instances
follow the same rule: name the defect id in a comment, say what correct would
look like, and pin the observed value so a fix has to change it deliberately.

**D1** — `add` fails in a fresh clone. The test reproduces what `git clone`
hands the second person by deleting the empty lane directories git never
tracked, then asserts exit **1**. That is not desired behaviour; the comment
says so and says a fix should flip it to 0.

**D7** — a new lane keeps the template's two sample entries. Pinned at the
observed count of three `## YYYY-MM-DD —` headings. The comment records the
assertion that was written first (`!body.includes("YYYY-MM-DD —")`) and failed,
which is how D7 was found.

## What is not covered

- **`install user`** — writing into the real `~/.claude` from a test would
  modify the machine running it. Only `project`, `auto` and the bad-target path
  are exercised.
- **`install cursor` / `cline` / `aider`** — the copy blocks are structurally
  identical to `project`, which is covered. Worth adding if any of them ever
  diverges.
- **The rendered HTML.** `templates/gmail-magic-resend.html` is asserted to
  exist and to have its placeholders substituted, but nothing here opens a
  browser. Its rendering evidence — including open defect D2 — lives in
  `promotion/PROMOTION_LOG.md`.
- **Concurrency, load, long-running state.** There is none: every verb is a
  process that starts, writes files and exits.
- **Node 18 and 20.** Everything here was measured on Node v22.22.2. See
  STACK.md on `fs.cp`.

## Before this existed

`npm test` was `node bin/init.mjs --help` — a help print with zero assertions,
green in a way that could not go red. That was open defect D4. Every behaviour
the promotion baseline recorded had been verified by hand and was unprotected
against regression, including D1, which three lines of test would have caught.

The tests were written and run **before** the wave-3 refactor, against the
unmodified tree, so that "17/17 pass, unchanged" afterwards means something.
Two of the three behaviour changes in that pass show up as deliberate edits
here; the third (`add` printing a relative path on Windows) is not asserted
either way.

## Adding a test

Copy the nearest block. Keep the name a sentence about a person and their goal
— `"J1 add refuses to overwrite an existing lane"`, not `"test addLane 2"` —
because the name is what a failure prints, and a failure should read as a
broken promise rather than a broken function.
