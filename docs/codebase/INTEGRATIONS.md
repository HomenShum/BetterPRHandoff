# Integrations

The long-form protocol document is `INTEGRATIONS.md` at the repo root, and it
is not repeated here. This page answers the narrower engineering question: what
does this codebase actually talk to, and where would a new integration attach?

## Outbound calls at runtime: none

`bin/init.mjs` makes no network requests, reads no API keys, and spawns no
processes. Confirm it:

```bash
grep -nE "fetch\(|https?://|child_process|spawn|exec" bin/init.mjs
```

The only two hits are the same documentation URL, printed as text. Before the wave-3 pass the same
grep found the Gemini Files API, `ffmpeg`, `ffprobe` and a `git clone`, all in
the three template scripts that were deleted.

## The integration surface is a JSON schema, not an API

`templates/qa-packet-schema.json` (193 lines) is the contract. Another tool
produces a QA packet — screenshots, before/after diffs, GIFs, an optional
Remotion video, a Gmail-threaded email — and that packet conforms to this
schema. This repo never generates any of it.

```
this repo                     other repos
─────────                     ───────────
qa-packet-schema.json  ◄────  Parity Studio  (npx parity-studio qa-packet)
qa-email.html.mustache ◄────  your CI
qa-states.example.json ─────► the adopter's qa.config.json
```

The adopter's side of the contract is `qa.config.json`, scaffolded by
`easier qa-init` from `templates/qa-states.example.json`. It declares which
states get captured. That is the only file the consumer writes.

## Environment variables read

Three, all in `install()`, all about *where to put files*:

| Variable | Read at | Used for |
|---|---|---|
| `CLAUDE_CONFIG_DIR` | `bin/init.mjs:268` → `user: join(process.env.CLAUDE_CONFIG_DIR` | overrides `~/.claude` for the `user` install target |
| `HOME` | `bin/init.mjs:265` → `const home = process.env.HOME || process.env.USERPROFILE;` | home directory on POSIX |
| `USERPROFILE` | `bin/init.mjs:265` → `const home = process.env.HOME || process.env.USERPROFILE;` | home directory on Windows |

No secrets, no tokens, no endpoints. If a change introduces a fourth variable,
ask first whether the work belongs on the generator side of the schema
boundary.

## Where the adopter's own agent plugs in

`easier install` writes the rule files where each agent looks for them.
The detection ladder starts at `bin/init.mjs:278` → `if (existsSync(join(cwd, ".cursor"))) mode = "cursor";`
and runs six rows, in this order:

| Marker found in the current directory | Mode | Files written |
|---|---|---|
| `.cursor/` | `cursor` | `.cursor/rules/easier-to-read-submissions.md` + `.cursor/rules/templates-easier/` |
| `.clinerules` or `.cline/` | `cline` | `.clinerules` + `.cline-easier-templates/` |
| `.aider/` or `.aider.conf.yml` | `aider` | `AGENTS.md` at the repo root + `.easier-templates/` |
| `.git/` | `project` | `.claude/skills/easier-to-read-submissions/` |
| `~/.claude/` exists | `user` | `<CLAUDE_CONFIG_DIR or ~/.claude>/skills/easier-to-read-submissions/` |
| none of the above | `generic` | `agents/easier-to-read-submissions/` |

First match wins, so the order is the policy: a repo-local agent config beats a
plain git repo, which beats the user's home configuration. Any of the six can
be forced by name — `easier install cursor`.

**Adding a seventh agent** means one row in the `targets` object
(`bin/init.mjs:267` → `const targets = {`), one branch in the detection ladder, one `else if` in
the copy block, and one line of help text. There is no plugin mechanism and
adding one for six entries would cost more than it saves.

## Integrations that no longer exist here

Removed in the wave-3 pass because they were another product's concrete
wiring rather than this product's contract — see
`docs/SIMPLIFICATION_REPORT.md`:

- **Google Gemini Files API** — video upload, poll-for-ACTIVE, and a
  scene-verification prompt naming another product's screens.
- **ffmpeg / ffprobe** — webm→mp4→gif conversion and duration probing.
- **Playwright** — imported but never declared as a dependency, so the scripts
  that used it could not run from a clean install.

The *protocol* still asks for a recorder and a video verifier — that is
`AGENTS.md` step 4 and `SKILL.md` Phase 2. What it no longer does is ship a
broken one.
