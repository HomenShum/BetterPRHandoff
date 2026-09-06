# Stack

## The short version

Node.js, and nothing else.

## What is actually here

| Thing | Value | Where it is stated |
|---|---|---|
| Language | JavaScript, ES modules | `package.json` `"type": "module"`; every file is `.mjs` |
| Runtime | Node.js ≥ 18 | `package.json` `"engines"` |
| Runtime dependencies | **none** | `package.json` has no `dependencies` key at all |
| Dev dependencies | **none** | no `devDependencies` key |
| Test runner | `node:test` + `node:assert/strict`, built into Node | `test/cli.test.mjs:17` → `import { test } from "node:test";` |
| Build step | none | `package.json` `scripts` holds only `test` |
| Bundler / transpiler | none | source is published and executed as written |
| Lockfile | not committed | `npm install` creates one; it is untracked |
| Type checking | none | plain JavaScript, no `tsconfig.json`, no JSDoc types |
| Linter / formatter | none configured | no `.eslintrc`, no `.prettierrc` |
| CI | none | no `.github/workflows` |

## Node built-ins used

The entire CLI imports four modules, all from the standard library
(`bin/init.mjs:26` → `import { mkdir, writeFile, readFile, copyFile, readdir } from "node:fs/promises";`):

```js
import { mkdir, writeFile, readFile, copyFile, readdir } from "node:fs/promises";
import { existsSync, constants } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
```

There is no `child_process` import, so nothing in the shipped CLI can spawn a
shell. There is no `http`/`fetch`, so it makes no network calls. Both were true
only after the wave-3 pass — see `docs/SIMPLIFICATION_REPORT.md`.

The test file additionally uses `node:child_process` (`spawn` and `spawnSync`,
for bounded real CLI and shell subprocesses), `node:os` (`tmpdir`) and the
synchronous `node:fs` helpers.

## Why zero dependencies is a deliberate constraint, not an accident

This package installs into other people's repositories and into their coding
assistant's configuration directory. Every dependency it took would become a
dependency of every repo that adopts the protocol, and would need auditing by
whoever reviews that adoption. The tool's entire job is creating directories
and copying files, which `node:fs` does. Keep it that way; if a change appears
to need a dependency, that is a strong signal the change belongs in a generator
tool (see `INTEGRATIONS.md`) rather than here.

Exclusive file creation and copy flags protect the owned destination from
replacement. They do not make a multi-file installation transactional. The
package remains dependency-free; the preservation rule is implemented with
Node built-ins, not a new installer framework.

## Versions this was measured on

The retained local baseline used Node v22.22.2, npm 10.9.7, and Windows 11.
Read the current test receipt for actual duration and results; the package
engine range is not evidence of execution on every listed runtime.
