# branch-contribution — a Claude Code skill

A Claude Code skill that turns "made some changes, time to commit" into a deterministic, verifiable contribution protocol. Built for handing branches between humans and AI agents without the receiving end having to read 40 commit messages to understand what changed.

## What it does

Two phases, applied to every branch contribution:

**Phase 1 — Per-surface changelog lanes (always).** Every page, component, server module, db table, integration, and script gets its own `CHANGELOG/<category>/<slug>.md` file. When you change a surface, you prepend a new dated entry. Multi-surface changes write entries to **each** affected lane, cross-linked via `**Touches**:`. Append-only — the audit trail is the whole point.

**Phase 2 — Verified demo recording (when relevant).** For UI changes: a Playwright recorder asserts every claim via DOM grep, then a Gemini-2.5-Flash pass watches the recorded MP4 and confirms what's actually visible. Both layers must pass before you push. Catches the gap between "the string is in the DOM" and "the string is visibly on screen."

**Plus a bonus rule** the skill enforces: never claim "deployed" / "shipped" / "live" on the basis of CLI exit codes. Always fetch the live URL and grep for a concrete content signal.

## Why per-surface beats repo-wide changelogs

The top-level `git log` is one undifferentiated stream — useful for "what shipped this week," useless for "what has the Inbox screen looked like over time." Per-surface lanes solve four problems at once:

- **Onboarding**: read the lane for what you're about to touch.
- **Debugging regressions**: recent entries are the suspect list.
- **Career narrative**: point at any one lane, explain the design evolution of that single thing — sharper than "I worked on the whole app."
- **Append-friendly for AI agents**: when Claude Code makes a fix, it grep-finds the lane and prepends an entry. Deterministic, no merge drama.

## Why a verified demo

Two failure modes the skill catches:

1. **DOM check passes, video doesn't show it.** The recorder confirms the string is in the rendered HTML, but if it's past the fold of the recorded viewport, viewers (and reviewers) see nothing. Gemini watches the actual pixels and flags this.
2. **Code-review claims that can't be falsified.** "I added the Care Plan to the inbox card" is a claim. "I added it AND the recorder asserts it AND Gemini confirms it's visible in the 3-second hold at 0:12" is a verified claim.

Time cost: ~75 seconds to record, ~30 seconds for Gemini analysis. Worth it on every UI change.

## Install

### As a Claude Code skill (one user, one machine)

```bash
git clone https://github.com/HomenShum/branch-contribution-skill ~/.claude/skills/branch-contribution
```

The skill auto-loads on next Claude Code session. Triggers on prompts like "commit", "push this", "open a PR", "I'm done", "wrap this up", "before we hand off."

### As a project-shipped skill (whole team gets it)

```bash
git clone https://github.com/HomenShum/branch-contribution-skill <your-repo>/.claude/skills/branch-contribution
```

Commit `.claude/skills/branch-contribution/` to the repo. Anyone who clones the repo and opens it in Claude Code gets the skill automatically.

### Manual fallback (no Claude Code)

The skill is just markdown — read `SKILL.md` and `templates/` and apply the protocol by hand. The templates are framework-agnostic.

## What's in the box

```
SKILL.md                           the contract — read this first
templates/
  CHANGELOG-README.md              master index template
  CHANGELOG-TEMPLATE.md            format spec
  lane.md                          single-surface lane template
  bootstrap-prompt.md              parallel-subagent backfill prompt
  recorder.mjs                     Playwright + smoothPan + ffmpeg
  verifier.mjs                     local checks + Gemini Files API
  probe-routes.mjs                 diagnostic for "Gemini says X is off-screen"
```

## Origin

Came out of the SitFlow → Jaynee handoff. SitFlow is a pet-sitter booking copilot (Expo + Express + tRPC + MySQL) being passed from the original engineer (Homen) to a PM-in-training (Jaynee). She needed:

- A way to understand what 20 commits of prod hardening did, surface by surface
- A way to verify her own changes didn't break the demo
- A way for her future Claude Code agent to keep the audit trail going

Per-surface lanes solved 1 and 3. Playwright + Gemini solved 2. Codified into this skill so the next handoff is just `git clone <skill-url> ~/.claude/skills/branch-contribution`.

## License

MIT. Take it, fork it, adapt it. PRs welcome — particularly:

- Templates for other frameworks (Next.js App Router, Remix, SvelteKit, vanilla web)
- Better Gemini prompts for scene verification
- Docker / CI integrations so the verifier runs in PR checks
- Slack / Discord webhooks that post the verifier verdict

## Contact

[@HomenShum](https://github.com/HomenShum) — built this for a friend learning AI PM. Reach out if you adapt it for your team.
