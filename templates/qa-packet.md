# QA Packet protocol — the visual proof half of the skill

A QA packet is the unit of dogfood. One feature → one packet → one resendable email. It contains every artifact a reviewer needs to evaluate the change without running the app: links, before/after screenshots, component-level snippets, GIFs, a Remotion demo video, and per-state notes.

This file is the **protocol**. Generation is implemented elsewhere (Parity Studio is the reference implementation; SitFlow's `scripts/record-jaynee-demo.mjs` is the lightweight variant). All implementations write packets that conform to [`qa-packet-schema.json`](qa-packet-schema.json).

---

## Roles — who does what

```
┌────────────── easier-to-read-submissions (this repo) ──────────────┐
│  · qa-packet-schema.json     the contract                          │
│  · qa-packet.md (this file)  the protocol + lifecycle              │
│  · qa-email.html.mustache    Gmail Magic Resend template           │
│  · qa-states.example.json    consumer fixture format               │
│  · SKILL.md / AGENTS.md      tells agents WHEN to invoke           │
└────────────────────────────┬────────────────────────────────────────┘
                             │ schema + template references
                             ▼
┌────────────── Parity Studio (the generator) ─────────────────────────┐
│  · reads consumer's qa.config.json                                  │
│  · drives Playwright per state (before + after)                     │
│  · captures component snippets via existing decompose pipeline      │
│  · diffs + GIF + Remotion video                                     │
│  · writes packet.json conforming to qa-packet-schema.json           │
│  · renders qa-email.html.mustache → ready to send                   │
│  · hosts the side-by-side review page                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │ packet.json + email.html
                             ▼
┌────────────── Consumer repo (SitFlow / NodeBench / your app) ────────┐
│  · qa.config.json or qa-states.json — declares what to test         │
│  · optional: persona / state seed helpers                           │
│  · runs `npx parity-studio qa-packet` (or equivalent)               │
└──────────────────────────────────────────────────────────────────────┘
```

The contract: **consumers declare states; generators produce artifacts; the schema is the only thing both sides agree on**. Neither side imports the other's product code.

---

## When to generate a packet

Generate a packet when **any** of these are true:

- A feature branch is ready for human/AI review
- A UI change affects 2+ user states
- Cross-functional reviewers (PM / design / ops) need to weigh in
- A handoff is happening (engineer → engineer, branch → PR, AI agent → human)
- You're about to claim "shipped" and want a falsifiable record

**Skip the packet for**:
- Server-only refactors (no UI surface affected)
- Trivia (typos, formatting, lockfile bumps)
- Pre-release scaffolding before any state can be exercised

---

## Lifecycle

```
1. Author finishes change on branch
2. Author writes qa.config.json declaring states (or it already exists)
3. Author runs `npx parity-studio qa-packet --feature <id>`
4. Generator captures before screenshots from main / last-shipped
5. Generator captures after screenshots from current branch
6. Generator diffs each pair, builds component snippets, GIFs, Remotion mp4
7. Generator writes packet.json conforming to schema
8. Generator renders qa-email.html.mustache → email.html
9. Generator hosts review page at packet.reviewUrl
10. Author runs `npx parity-studio qa-send --to <email>` (Gmail Magic Resend)
11. Reviewers open email, click links, leave verdicts
12. Author fixes issues, re-runs step 3 (version bumps)
13. Magic resend updates the same thread
14. qaStatus moves to approved → shipped
```

The packet is append-only on `version`; old versions stay reachable for the audit trail. Each state's `qaVerdict` flips between regenerations — that's the loop.

---

## Consumer side: what you write

A repo opting into the QA packet system declares its states in `qa.config.json` (or `qa.config.js` for dynamic states). The format mirrors [`qa-states.example.json`](qa-states.example.json):

```json
{
  "schemaVersion": "1.0.0",
  "feature": {
    "id": "sitflow.care_rules.v1",
    "title": "Structured care plan + AI extraction",
    "primaryComponents": ["CareCard", "ExpressComposer"]
  },
  "previewUrlTemplate": "http://localhost:8081{path}",
  "states": [
    {
      "id": "inbox-bella-red-callout",
      "workflow": "inbox",
      "userState": "returning_with_critical_pet",
      "persona": "pet_sitter",
      "path": "/",
      "viewport": { "width": 1280, "height": 800 },
      "expectedChanges": [
        "Bella's card shows compact CareCard with red 'No human food' + 'NEVER alone' chips",
        "Other clients show standard cards"
      ],
      "snippets": ["inbox.bella-card", "inbox.filter-chips"]
    }
  ]
}
```

That's it. The consumer doesn't touch screenshots, GIFs, Remotion — just declares the test matrix. The generator reads this file and produces all artifacts.

---

## Generator side: what Parity Studio (or an alternative) implements

Reference implementation in `HomenShum/parity-studio` (see [`docs/QA-PACKET.md`](https://github.com/HomenShum/parity-studio/blob/main/docs/QA-PACKET.md) once landed):

```bash
# CLI shape — implementations should match this surface
parity-studio qa-packet \
  --feature sitflow.care_rules.v1 \
  --branch homen/may2026-prod-hardening \
  --baseline main \
  --config ./qa.config.json \
  --out ./qa-artifacts/sitflow.care_rules.v1/

parity-studio qa-send \
  --packet ./qa-artifacts/sitflow.care_rules.v1/packet.json \
  --to hshum2018@gmail.com \
  --provider gmail-smtp        # or resend, mailgun, ses
```

A minimum-viable generator must:

1. Read `qa.config.json` and validate against the consumer schema slice.
2. For each state: launch Playwright, navigate to `path`, wait, screenshot `after`, then check out `baseline` ref and screenshot `before`. (Or pull `before` from a stored baseline.)
3. Emit `packet.json` conforming to [`qa-packet-schema.json`](qa-packet-schema.json).
4. Render [`qa-email.html.mustache`](qa-email.html.mustache) with the packet → `email.html`.
5. Host (or upload to S3 / Vercel Blob / similar) the review HTML with side-by-side compare per state.

The generator may add fancier features (Remotion video composition, Convex storage, MCP tooling, Gemini second-pair-of-eyes) but those are non-required.

---

## Email behavior — Gmail Magic Resend

The protocol calls it **Magic Resend** because the same email thread is updated on regeneration:

- `email.subject`: `[<repo> QA] <title> — v<version>`
- `email.html`: rendered from the mustache template, embedded screenshots/GIFs as `cid:` attachments or inline base64
- `email.to`: from CLI flag or `qa.config.json`
- Each send increments `email.lastSentAt` and bumps `version`

Authoring guidance: keep the email **scannable**. Reviewers open it on phone first. The primary CTA above the fold is "Open review page" → side-by-side. Everything else is optional drill-down.

---

## State-lane vocabulary

Use these standard lane names so packets from different repos compose into shared dashboards. Workflow names are repo-specific, but the **userState** names below should be consistent:

| userState | When to use |
|---|---|
| `new_user` | First session, no data, no preferences set |
| `returning_user` | Has prior history, defaults populated |
| `power_user` | Heavy state, many entities, edge of capacity |
| `empty` | Logged in but no data yet (post-onboarding silence) |
| `loading` | Spinner / skeleton state during async work |
| `success` | Confirmation toast, post-action cooldown |
| `error` | Server error / network error / validation failure |
| `paid_locked` | Free tier hit limit, paywall surface visible |
| `permission_needed` | OAuth scope missing, mic/camera prompt |
| `mobile_portrait` | < 768px width |
| `desktop_wide` | ≥ 1280px width |

Personas are repo-specific; declare your repo's personas in a top-level `personas.json` inside `qa.config.json`.

---

## Why a shared schema instead of duplicating logic

If every consumer rolled their own QA packet:
- Email rendering forks would diverge.
- Reviewer fatigue (each repo's email looks different).
- Cross-repo dashboards (one inbox listing every team's open packets) become impossible.
- Migrating from one generator to another (Parity Studio → CI-native) would be a rewrite.

With this contract:
- Consumers declare states once. Done.
- Generators compete on capture quality, video polish, hosting price, etc. — all interchangeable.
- One Gmail filter rule (`subject:[QA] from:noreply@parity-studio.com`) catches every team's packets.
- A future "QA inbox" UI can list packets from all your repos sorted by qaStatus.

This is the same pattern as the changelog lanes: **the protocol lives here; the implementation lives wherever**.

---

## Smaller alternatives

If Parity Studio is overkill for a project, the lightweight path:

- Use SitFlow's [`scripts/record-jaynee-demo.mjs`](https://github.com/jayneebui/sitflow-mobile/blob/homen/may2026-prod-hardening/scripts/record-jaynee-demo.mjs) as a starting point.
- Hand-roll the email HTML by interpolating the mustache template.
- Skip Remotion until you have 5+ states and need the cinematic version.
- Skip Gmail SMTP — `gh issue comment` with embedded screenshots works for solo work.

The schema is small enough that any tool can target it. The point isn't the tool; it's the **shape of the artifact** every reviewer can rely on.
