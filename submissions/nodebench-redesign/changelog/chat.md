# Changelog — `src/features/redesign/surfaces/ChatSurface.tsx`

> **Surface**: Live operating chat. Center column = active conversation + answer packets. Right side = entity card + sources (RightInspector). Bottom = UniversalComposer.

## 2026-05-07 — Sprint 4 · pin/carry-forward + A/B compare + reproducibility hash

Three differentiating chat affordances landed via [PR #249](https://github.com/HomenShum/nodebench-ai/pull/249) (`54600a93`):

- **P1.6 Pin / carry-forward** — `MessageActions.onPin` lifts to ChatSurface state. A sticky `rd-pinned-bar` above the composer renders chips (`tier · short answer · [N sources]`). Click × to unpin. Pinned items "carry forward into the next turn as hard context" — confirmation toast wired today; system-prompt prepend deferred until chat is live-wired.
- **P2.7 A/B compare modal** — new Compare icon in `MessageActions` opens `ABCompareModal` rendering Variant A (current) vs Variant B (synthesized confidence bump) side-by-side. Pick A / Pick B → toast records the winner; loser becomes a teach-me example. Mobile breakpoint collapses the grid to single column.
- **P2.13 Reproducibility hash** — new Share icon hashes `{tier, shortAnswer, sourceCount, sorted-trace-shape}` via FNV-1a + Knuth multiplicative into a 12-char URL slug, builds `/redesign/chat/r/{hash}`, copies + toasts. Same packet → same URL across deploys.

**Commit**: `54600a93`. **Author**: Homen Shum + Claude Opus 4.7.
**Touches**: `MessageActions.md` (new), `primitives.css.md`, `demo-chat-sprints-1-4.md`.

## 2026-05-07 — Sprint 3 · inline correction + source freshness + open-questions tray

Three Sprint 3 affordances via [PR #248](https://github.com/HomenShum/nodebench-ai/pull/248) (`17a9e761`):

- **P1.4 Inline correction** — selection observer at `<InlineCorrection>` watches for 5–300 char selections inside `.rd-chat-msg--assistant`. Pops a floating "Correct this" bubble at the selection rect; click opens a modal pre-filled with the selection. "Queue patch" fires a success toast with an "Open Me" action that deep-links to `/redesign/me`. Once chat is live-wired this calls `proposeMemoryPatch` from `convex/domains/operatorProfile/manifest.ts` so corrections land in the Memory Update Inbox.
- **P2.9 Source freshness in citation popover** — `sourceFreshness(source)` deterministically hashes the source string into 0–71h and renders `refreshed Xh ago` as a pill below the source name. Replace with `sourceRefs.lastFetchedAt` once live-wired.
- **P2.11 Open-questions tray** — sticky `<OpenQuestionsTray>` at the top of the thread lists claims flagged by the agent (🤖) or user (👎). Click chip → smooth-scrolls to the originating turn (via `data-turn-id`) with a `rd-flash-attention` pulse. Click ✓ → toast + remove. Each turn render now wraps in `<div data-turn-id={t.id}>` so the jump anchor is stable.

**Commit**: `17a9e761`. **Author**: Homen Shum + Claude Opus 4.7.
**Touches**: `primitives.css.md`, `demo-chat-sprints-1-4.md`.

## 2026-05-07 — Sprint 2 · streaming scratchpad + counterfactual probe

Two Sprint 2 affordances via [PR #247](https://github.com/HomenShum/nodebench-ai/pull/247) (`b2254507`):

- **P0.2 Streaming scratchpad / Working notes** — collapsible `<WorkingNotes>` card rendered between the tool-call cards and the structured AnswerPacket, fed by `WORKING_NOTES_MARKDOWN` (Plan / Notes during run / Confidence sections). Mirrors the `agentScratchpads` Convex table shape. Bridges the gap between thinking dots and the structured packet by showing the agent's plan / notes / confidence calibration inline.
- **P0.3 Counterfactual probe** — right-click any `[N]` cite chip → `<rd-cite-menu>` with "Probe without source [N]" + "Jump to evidence row". Selecting probe sets `maskedIdx` in AnswerPacket → `<ProbeBanner>` appears above the answer with [Restore]; the matching evidence row + cite chip get `data-masked` styling (dimmed, struck through, saturate-0.4). Two toasts fire on probe (info immediately, warning after 1100ms simulating model re-eval).

**Commit**: `b2254507`. **Author**: Homen Shum + Claude Opus 4.7.
**Touches**: `primitives.css.md`, `demo-chat-sprints-1-4.md`.

## 2026-05-07 — Sprint 1 · hover source preview + cost-per-turn

First two enhancements from [docs/architecture/REDESIGN_CHAT_ENHANCEMENTS.md](https://github.com/HomenShum/nodebench-ai/blob/main/docs/architecture/REDESIGN_CHAT_ENHANCEMENTS.md), via [PR #246](https://github.com/HomenShum/nodebench-ai/pull/246) (`ee5b0341`):

- **P0.1 Hover source preview** — hovering any `[N]` citation chip pops a `<rd-cite-popover>` with the source quote + provenance label, in addition to the existing scroll-into-view + evidence-row highlight. Pure-CSS positioning via `.rd-cite-wrap` (no JS positioning math). Keyboard-accessible via `:focus-visible`. Respects `prefers-reduced-motion`.
- **P1.5 Cost + duration inline per turn** — AnswerPacket meta header now reads `Auto tier · 4 sources · 2.7s · $0.013`. Computed via `formatTraceCost(packet)` summing `packet.trace[].durationMs` at $0.005/sec showcase rate. Replace with real provider billing once chat is live-wired.

**Commit**: `ee5b0341`. **Author**: Homen Shum + Claude Opus 4.7.
**Touches**: `primitives.css.md`, `demo-chat-sprints-1-4.md`.

## 2026-05-05 — Created · 13-feature production-grade chat

Adopts the parity-studio chat layout — three-column shell with avatar-based assistant rendering — while keeping NodeBench's structured AnswerPacket (Short answer → Why it matters → Evidence with citations → Risks/unknowns → Next action → Trace) for evidence-grade responses.

13 features:
1. Pre-stream thinking indicator (ChatThinking)
2. Inline tool-call cards (ChatToolCall — replaces hidden trace)
3. Per-message action toolbar (Copy / Regenerate / Pin / Branch / Why? / 👍 / 👎)
4. Citation [N] hover-link to evidence row
5. Composer slash menu (/diligence, /compare, /check-source, /summarize, /run-on-list, /tear-sheet)
6. Composer @ mention with entity autocomplete
7. Composer paste/drop attachments
8. Stop generation (Esc also works)
9. Code block syntax highlighting (js/ts/py/sh/json regex tokenizer, no Shiki)
10. Mermaid block placeholder (lazy-load on click)
11. Empty state with starter chips + Resume thread CTA
12. Live-updating timestamps (30s interval re-render)
13. Branching from any message (truncates thread)

Plus inline image rendering, scroll-to-bottom button with unseen-message badge, auto-scroll on new turn unless user is reading higher.

Wired to useBatchLive (Sprint S2) for sticky BatchMonitorCell. Karpathy persona QA score: 62 → 82 after chat improvements.

**Commit**: `737b02a`. **Author**: Homen Shum + Claude Opus 4.7.
