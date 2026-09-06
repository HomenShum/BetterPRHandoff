# Testing

## Run them

The current source registers 30 scenarios. That count is not a passing result;
run the command and retain its actual exit status and summary.

```bash
npm test          # node --test test/cli.test.mjs
```

No install step, no framework, no config file. `node:test` and
`node:assert/strict` ship with Node.

## Shared source checks

[Source checks](../../.github/workflows/ci.yml) runs normal `npm install`,
`npm test`, and `npm pack --json` on Node 22 with Windows and Ubuntu runners.
The workflow is configured for main pushes and pull requests. Local results
and configured jobs do not establish a shared passing run; retain the actual
job logs and source or test-merge identity. Browser proof remains separate.

## What they are

30 registered scenarios in one file, `test/cli.test.mjs`, including six cases
registered by the installer-target loop. Each one is a person trying
to finish a job, not a function with its inputs mocked.

They run the **real CLI as a subprocess** in a **real throwaway directory**,
and assert two things: the exit code, and the files that actually landed on
disk. Two helpers make that cheap:

```js
function easier(cwd, ...args) {
  const r = spawnSync(process.execPath, [CLI, ...args], {
    cwd, encoding: "utf8", env: fixtureEnv(cwd), timeout: 10_000, maxBuffer: 1024 * 1024,
  });
  const strip = (s) => (s || "").replace(/\x1b\[[0-9;]*m/g, "");
  return { code: r.status, out: strip(r.stdout) + strip(r.stderr) };
}

function sandbox(fn) {
  const dir = mkdtempSync(join(tmpdir(), "easier-test-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
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
| **J1** | a solo developer adopting the protocol in their own repo | 9 |
| **J2** | a teammate who cloned the repo the first developer committed | 1 |
| **J3** | someone installing the rules where their agent will read them | 10 |
| **J4** | someone preparing a reviewer hand-off packet | 4 |
| front door | a stranger guessing at the command line | 2 |
| upkeep | the walkthroughs still cite the right lines, and no document tells a reader to run `npx easier` | 3 |
| D6 regression | the printed next-steps can be followed in the printed order | 1 |

## Preserve a defect before changing its expectation

The original D7 scenario accepted the template's apparent historical commits.
The replacement checks an unfilled current entry, pending commit/author fields,
and a fenced format example. Original failing observations remain historical
evidence; a repaired expectation must explain why its contract changed.

The D1 scenario still checks that a teammate can add a lane after Git omitted
empty category directories. Preservation cases additionally cover all six rule
destinations, repeated and concurrent installers, conflicting lane/QA writers,
invalid and Unicode lane names, and finite accumulating writes. Exact generated
bytes and process exit codes matter; a subprocess that prints success while
replacing someone's edits must fail the scenario.

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
  line contains that text. 25 current citations checked across these documentation owners. `promotion/` is excluded on
  purpose: it is an append-only ledger, and its rows record what a line said on
  the day it was measured.

A third block fails the build if any tracked file outside `promotion/` prints
`npx easier <verb>`, which resolves an unrelated package on npm and has never
run this CLI.

## What is not covered

- **Actual host activation.** User, project, Cursor, Cline, Aider, and generic
  file destinations can be tested in owned temporary profiles. Those checks do
  not establish that an external agent loaded or followed the copied rules.
- **The rendered HTML.** `templates/gmail-magic-resend.html` is asserted to
  exist and to have its placeholders substituted, but nothing here opens a
  browser. The historical producer `promotion/evidence/audit.mjs` and its
  recorded outputs document the earlier D2 audit. Preserve that historical
  evidence; do not rerun the producer into its original output directory.
  A contributor changing the HTML must generate fresh input with the current
  CLI and retain browser proof in a new owned output directory, including
  DOM state, rendered pixels, and native actions. This separate browser proof
  is not part of `npm test`; no current producer is added by these instructions.
- **Unbounded concurrency or service load.** The scenarios use four competing
  creators/installers and eight later lane writes. They inspect
  preservation after process restart; they do not certify arbitrary filesystem
  races, symlinked directories, or a long-running service.
- **Other runtime and shell combinations.** The retained local lane uses
  Windows and Node v22.22.2. Direct argv and copy/pasting the printed command
  are separate checks; a Windows result does not prove arbitrary POSIX shell
  metacharacters. See STACK.md.

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
