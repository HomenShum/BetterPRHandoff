# SitFlow — per-surface changelog index

This directory holds **per-surface changelog lanes**. Every page, component, server module, database table, integration, and script gets its own append-only `.md` file with a date-sorted history (most recent at the top).

## Why this exists

The repo's top-level `git log` is one undifferentiated stream. Useful for "what shipped this week," useless for "what has the Inbox screen looked like over time."

Per-surface lanes solve four problems:

1. **Onboarding** — read the lane for the surface you're about to touch. You learn the design history, what's been tried, what's been retired.
2. **Debugging regressions** — when the Inbox breaks, look at [`pages/tabs-index-inbox.md`](pages/tabs-index-inbox.md). The recent entries are the only candidates.
3. **PM career narrative** — when Jaynee's at a job interview, she can point at any one lane and explain the design evolution of that single thing. Sharper than "I worked on the whole app."
4. **Append-friendly for AI agents** — when Claude Code makes a fix, it can grep for the surface it touched, find the lane file, and prepend a new entry. Deterministic, no merge drama.

## Format rules

Read [`TEMPLATE.md`](TEMPLATE.md). Three rules that matter:

- **Append at the top.** Most recent first. Never delete or rewrite old entries — they are the audit trail.
- **Date format `YYYY-MM-DD`** (drop time + tz).
- **Multi-surface changes** = an entry in **each** affected lane, with the same date + commit hash. Cross-link via the `**Touches**:` line.

Every lane file ends with the entry template you should copy when adding a new entry.

## Index

### `pages/` — Expo Router screens (`app/`)

User-facing screens. One file per route or layout.

| Lane | What |
|---|---|
| [`pages/_layout.md`](pages/_layout.md) | Root layout — providers + Stack nav + push registration |
| [`pages/tabs-_layout.md`](pages/tabs-_layout.md) | Tab bar — Inbox / Calendar / Clients / Agent |
| [`pages/tabs-index-inbox.md`](pages/tabs-index-inbox.md) | Inbox — booking request cards + filter chips + compact CareCard |
| [`pages/tabs-calendar.md`](pages/tabs-calendar.md) | Calendar — month grid + Today panel + per-event CareCard |
| [`pages/tabs-clients.md`](pages/tabs-clients.md) | Clients tab — searchable client list |
| [`pages/tabs-agent.md`](pages/tabs-agent.md) | Agent tab — config + AgentValueStrip |
| [`pages/clients-id-detail.md`](pages/clients-id-detail.md) | Client Detail — pets + bookings + ConsentSection + full CareCard |
| [`pages/clients-new.md`](pages/clients-new.md) | New Client — ExpressComposer + breed chip selector + manual fields |
| [`pages/m-and-g-extract.md`](pages/m-and-g-extract.md) | M&G AI extraction — text/audio/photos input |
| [`pages/meetgreet-id.md`](pages/meetgreet-id.md) | M&G detail — slot selection + outcome |
| [`pages/message-draft.md`](pages/message-draft.md) | AI-drafted message review/edit |
| [`pages/oauth-callback.md`](pages/oauth-callback.md) | OAuth redirect handler |
| [`pages/request-id.md`](pages/request-id.md) | Request detail — status timeline + suggested actions |
| [`pages/dev-theme-lab.md`](pages/dev-theme-lab.md) | Dev-only theme testing |

### `components/` — Shared UI components

Reusable building blocks. Used across multiple pages.

| Lane | What |
|---|---|
| [`components/CareCard.md`](components/CareCard.md) | Pet care plan card — 3 modes, severity stripes, category icons |
| [`components/ConsentSection.md`](components/ConsentSection.md) | Per-client AI permissions — READ/DRAFT/SEND, fail-closed |
| [`components/ExpressComposer.md`](components/ExpressComposer.md) | ChatGPT-style composer with paperclip + send arrow + AI extraction |
| [`components/AgentValueStrip.md`](components/AgentValueStrip.md) | "What is the agent doing for me right now" surface |
| [`components/Toast.md`](components/Toast.md) | Slide-in non-blocking toast |
| [`components/screen-container.md`](components/screen-container.md) | Standard screen wrapper |
| [`components/haptic-tab.md`](components/haptic-tab.md) | Tab bar button with haptic feedback |
| [`components/external-link.md`](components/external-link.md) | External link with platform-correct open behavior |
| [`components/hello-wave.md`](components/hello-wave.md) | Animated wave emoji |
| [`components/parallax-scroll-view.md`](components/parallax-scroll-view.md) | Parallax scroll wrapper |
| [`components/themed-view.md`](components/themed-view.md) | Theme-aware View |
| [`components/ui-avatar.md`](components/ui-avatar.md) | Avatar (initials + image fallback) |
| [`components/ui-collapsible.md`](components/ui-collapsible.md) | Collapsible/expandable section |
| [`components/ui-expiry-timer.md`](components/ui-expiry-timer.md) | Booking-request expiry countdown (red <24h) |
| [`components/ui-icon-symbol.md`](components/ui-icon-symbol.md) | SF Symbols / MaterialIcons abstraction |
| [`components/ui-status-badge.md`](components/ui-status-badge.md) | Booking status badge |
| [`components/hook-use-auth.md`](components/hook-use-auth.md) | Auth state + token storage hook |
| [`components/hook-use-colors.md`](components/hook-use-colors.md) | Theme color tokens hook |
| [`components/hook-use-color-scheme.md`](components/hook-use-color-scheme.md) | System color scheme detection |
| [`components/hook-use-push-registration.md`](components/hook-use-push-registration.md) | Native push token registration |

### `server/` — Backend modules

Express + tRPC server modules.

| Lane | What |
|---|---|
| [`server/_core-index.md`](server/_core-index.md) | Express boot — middleware + tRPC + OAuth + fail-closed guard |
| [`server/_core-trpc.md`](server/_core-trpc.md) | tRPC init — public/protected/admin procedures |
| [`server/_core-context.md`](server/_core-context.md) | tRPC context — user auth extraction |
| [`server/_core-oauth.md`](server/_core-oauth.md) | Manus OAuth routes (cookie + Bearer) |
| [`server/_core-sdk.md`](server/_core-sdk.md) | Manus SDK init + authenticateRequest |
| [`server/_core-systemRouter.md`](server/_core-systemRouter.md) | /api/health + system status |
| [`server/_core-llm.md`](server/_core-llm.md) | Original Manus Forge LLM (pre-pi-ai) |
| [`server/_core-voiceTranscription.md`](server/_core-voiceTranscription.md) | Whisper API — audio → text |
| [`server/_core-imageGeneration.md`](server/_core-imageGeneration.md) | Manus Forge image generation |
| [`server/_core-notification.md`](server/_core-notification.md) | Manus-side push helpers |
| [`server/_core-dataApi.md`](server/_core-dataApi.md) | External data API client |
| [`server/llm.md`](server/llm.md) | pi-ai adapter — chat() + cost cap + provider abstraction |
| [`server/m-and-g.md`](server/m-and-g.md) | M&G AI extraction — text/audio/photos → ProposedCarePlan |
| [`server/consent.md`](server/consent.md) | Consent gateway — fail-closed at gate |
| [`server/ingest.md`](server/ingest.md) | Twilio SMS inbound — HMAC-SHA1 → request → AI draft → push |
| [`server/push.md`](server/push.md) | Expo push — register + auto-fire on new bookings |
| [`server/db.md`](server/db.md) | Drizzle MySQL queries |
| [`server/google-calendar.md`](server/google-calendar.md) | GCal API — OAuth refresh + event CRUD |
| [`server/agent-chat.md`](server/agent-chat.md) | Agent chat orchestration |
| [`server/claude-agent.md`](server/claude-agent.md) | Claude integration — classifyIntent + draft generation |
| [`server/routers.md`](server/routers.md) | Main tRPC router |
| [`server/wsEvents.md`](server/wsEvents.md) | WebSocket event broadcasting |
| [`server/storage.md`](server/storage.md) | File storage helpers |

### `db/` — Database tables (one lane per table)

Schema lives in `drizzle/schema.ts`. Each lane tracks the column-level history for one table.

| Lane | What |
|---|---|
| [`db/users.md`](db/users.md) | User accounts (Manus OAuth) |
| [`db/clients.md`](db/clients.md) | Client roster — status (new/returning), pets relation |
| [`db/pets.md`](db/pets.md) | Pet records — ageUnit, behaviorNotes legacy + careRules relation |
| [`db/bookingRequests.md`](db/bookingRequests.md) | Booking pipeline core — status state machine, agentDraft |
| [`db/meetAndGreets.md`](db/meetAndGreets.md) | M&G — proposedSlots, confirmedSlot, result |
| [`db/calendarEvents.md`](db/calendarEvents.md) | Local calendar — startTime, eventType, googleEventId |
| [`db/messageLog.md`](db/messageLog.md) | Audit trail for agent/user messages |
| [`db/webhookEvents.md`](db/webhookEvents.md) | OpenClaw webhook audit log |
| [`db/care_rules.md`](db/care_rules.md) | **NEW** — structured per-pet rules (8 categories × 4 severities) |
| [`db/message_consents.md`](db/message_consents.md) | **NEW** — per-client AI grants, fail-closed default |
| [`db/push_tokens.md`](db/push_tokens.md) | **NEW** — Expo push token per device |

### `integrations/` — Conceptual surfaces

Track the lifecycle of an external integration as a whole, not just one file.

| Lane | What |
|---|---|
| [`integrations/google-calendar.md`](integrations/google-calendar.md) | Google Calendar v3 — OAuth refresh, event CRUD, color-coded events |
| [`integrations/twilio-sms.md`](integrations/twilio-sms.md) | Twilio SMS inbound — HMAC-SHA1 verified |
| [`integrations/openclaw.md`](integrations/openclaw.md) | OpenClaw skill + webhook (6 tools, X-Webhook-Secret auth) |
| [`integrations/push-notifications.md`](integrations/push-notifications.md) | Expo Push — native-only, mom-mode failure isolation |
| [`integrations/whisper-transcription.md`](integrations/whisper-transcription.md) | Whisper API for M&G audio transcription |
| [`integrations/pi-ai.md`](integrations/pi-ai.md) | pi-ai LLM router — Anthropic / OpenAI / Google / OpenRouter |
| [`integrations/anthropic-sdk.md`](integrations/anthropic-sdk.md) | Direct `@anthropic-ai/sdk` use (pre-pi-ai migration) |
| [`integrations/manus-oauth.md`](integrations/manus-oauth.md) | Manus OAuth — cookie (web) + Bearer (mobile) dual path |

### `scripts/` — Build, demo, and ops scripts

| Lane | What |
|---|---|
| [`scripts/parity-capture.md`](scripts/parity-capture.md) | parity-studio-mcp driver — decompose live routes into ui_kit zips |
| [`scripts/record-jaynee-demo.md`](scripts/record-jaynee-demo.md) | Playwright recorder — verified 71s demo |
| [`scripts/verify-jaynee-demo.md`](scripts/verify-jaynee-demo.md) | Local DOM checks + Gemini video analysis |
| [`scripts/probe-routes.md`](scripts/probe-routes.md) | Diagnostic — inner-scroller heights |
| [`scripts/twilio-sim.md`](scripts/twilio-sim.md) | Local Twilio simulator |
| [`scripts/demo-e2e.md`](scripts/demo-e2e.md) | E2E demo helper |
| [`scripts/generate_qr.md`](scripts/generate_qr.md) | QR code generator for mobile testing |

---

## How to add a new entry (the rule for AI agents)

When you (Claude Code, or any agent) make a code change:

1. **Identify every surface touched** by your diff. A typical change touches 1-3 surfaces.
2. **For each touched surface**, find the lane file (e.g., `CHANGELOG/components/CareCard.md`).
3. **Prepend** a new entry at the top — directly below the file header, before the previous most-recent entry.
4. **Use the entry template** at the bottom of each lane file. Don't invent your own format.
5. **Cross-link with `**Touches**:`** if multiple surfaces. Same date + commit hash on every entry.

Example: if your commit added a new toggle to `ConsentSection.tsx` and a new server endpoint in `server/consent.ts`, you write **two** entries — one in `components/ConsentSection.md`, one in `server/consent.md`. Both with today's date, both with the same `<7-char sha>`. Each entry cross-links the other via `**Touches**:`.

## How to read it (the rule for humans)

- **Coming back to a surface after a while**: read its lane top-to-bottom. The first entry tells you what it does today; later entries tell you what it used to do and why it changed.
- **Investigating a regression**: open the lane for the broken surface. The recent entries are your suspect list.
- **Preparing for a redesign**: read the full lane to learn what's been tried. Don't repeat retired experiments.
