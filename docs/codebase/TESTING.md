# Testing

## Run them

```bash
npm test          # node --test test/cli.test.mjs — 20 tests, ~4s
```

No install step, no framework, no config file. `node:test` and
`node:assert/strict` ship with Node.

## What they are

20 scenario tests in one file, `test/cli.test.mjs`. Each one is a person trying
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
| upkeep | the walkthroughs still cite the right lines, and no document tells a reader to run `npx easier` | 3 |
| D6 regression | the printed next-steps can be followed in the printed order | 1 |

## The one test that pins wrong behaviour on purpose

This is the only sanctioned way to encode a known defect: name the defect id in
a comment, say what correct would look like, and pin the observed value so a fix
has to change it deliberately.

**D7** — a new lane keeps the template's two sample entries. Pinned at the
observed count of three `## YYYY-MM-DD —` headings. The comment records the
assertion that was written first (`!body.includes("YYYY-MM-DD —")`) and failed,
which is how D7 was found.

There were two. The **D1** block asserted exit **1** for `add` in a fresh clone
and said in its own comment that a fix should flip it to 0. The fix landed, so
the block now asserts exit **0** and a lane file on disk. The old expectation is
written into the comment, which is the rule for any loosened assertion here: a
changed test is guilty until its justification is legible without git.

## The two guards over the walkthroughs

A walkthrough that cites a file and a line number is making a claim, and a claim
needs a check. The check shipped in wave 3 asserted only that the number was
somewhere inside the file.
That proves a citation is **stable**; it never proves it is **correct**. Insert
thirteen lines at the top of the file and every step points one function too
early with the guard still green — which is exactly what happened when the
invocation constant was added.

Both guards now demand an anchor and assert the cited line matches it:

- `.tours/*.tour` — every step with a `file` must carry CodeTour's own
  `pattern` field, and the cited line must match that regex. 26 steps checked.
- Markdown docs outside `promotion/` — every ``path:line`` citation must be
  written ``path:line`` → ``the text on that line``, and the guard asserts the
  line contains that text. 26 citations checked. `promotion/` is excluded on
  purpose: it is an append-only ledger, and its rows record what a line said on
  the day it was measured.

A third block fails the build if any tracked file outside `promotion/` prints
`npx easier <verb>`, which resolves an unrelated package on npm and has never
run this CLI.

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
green in a way that could not go red. That was defect D4, since closed. Every
behaviour the promotion baseline recorded had been verified by hand and was
unprotected against regression, including D1, which three lines of test would
have caught.

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
