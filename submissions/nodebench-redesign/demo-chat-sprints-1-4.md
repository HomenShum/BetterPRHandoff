# Demo — Chat Enhancements Sprints 1-4

> 11 chat affordances landed across PRs [#246](https://github.com/HomenShum/NodeBenchAI/pull/246), [#247](https://github.com/HomenShum/NodeBenchAI/pull/247), [#248](https://github.com/HomenShum/NodeBenchAI/pull/248), [#249](https://github.com/HomenShum/NodeBenchAI/pull/249) per [REDESIGN_CHAT_ENHANCEMENTS.md](https://github.com/HomenShum/NodeBenchAI/blob/main/docs/architecture/REDESIGN_CHAT_ENHANCEMENTS.md). This doc is the visual reference.

## Walkthrough

![chat sprints 1-4 demo](chat-sprints-1-4-demo.gif)

- **GIF** (1080×675, 8 fps, ~25 s): [chat-sprints-1-4-demo.gif](chat-sprints-1-4-demo.gif) · 6.5 MB
- **MP4** (H.264, original 1440×900, 25 fps): [chat-sprints-1-4-demo.mp4](chat-sprints-1-4-demo.mp4) · 1.3 MB
- **Scene log** (machine-readable): [chat-sprints-1-4-scenes.json](chat-sprints-1-4-scenes.json)

## Scenes

| # | Sprint | Feature | What you see in the recording |
|---|---|---|---|
| 0 | — | Navigate to `/redesign/chat` | Live `Daily Brief - 2026-05-06` thread loaded from Convex; right rail shows Active Live Artifact, Sources Used (4/27), Prior Threads. |
| 1 | 1 P1.5 | **Cost-per-turn header** | AnswerPacket meta line reads `Auto tier · 27 sources · 167ms · <$0.01`. Computed from `packet.trace[].durationMs` at $0.005/sec showcase rate. |
| 2 | 2 P0.2 | **Streaming scratchpad / Working notes** | Expanding the `WORKING NOTES · 14 lines` collapsible reveals the agent's plan / notes / confidence calibration mid-card. |
| 3 | 3 P2.11 | **Open Questions tray** | Sticky tray at top of thread with 3 flagged claims (`🤖` agent / `👎` user) + "tap to jump, ✓ to clear" hint. |
| 4 | 1 P0.1 + 3 P2.9 | Hover citation popover (skipped in this run) | Recording walked the cite-chip locator but the live-detail starter answer in this thread has no inline `[N]` markers in body prose. Popover renders correctly when prose contains `[1]`, `[2]`, etc. — see [chat.md](changelog/chat.md) Sprint 1 entry. |
| 5 | 4 P1.6 | **Pin / carry-forward** | Click the Pin icon in MessageActions → a `📌 CARRIES FORWARD · 1` chip slides in above the composer with the answer's tier, label, and source count. × to unpin. |
| 6 | 2 P0.3 | Counterfactual probe (skipped — same fixture limitation as scene 4) | Right-click on inline cite chip would open `<rd-cite-menu>` with "Probe without source [N]" / "Jump to evidence row". Visually verified separately. |
| 7 | 4 P2.7 | **A/B compare modal** | Compare icon → side-by-side `Variant A (current)` vs `Variant B (parallel run, high confidence)` with `Pick A` / `Pick B`. Toast on pick. Mobile breakpoint collapses to single column. |
| 8 | 4 P2.13 | **Reproducibility hash + share** | Share icon hashes the packet (FNV-1a + Knuth multiplicative over `{tier, shortAnswer, sourceCount, sorted-trace-shape}`) into a 12-char URL, builds `/redesign/chat/r/{hash}`, copies + toasts. Same packet → same URL across deploys. |
| 9 | 3 P1.4 | **Inline correction** | Triple-clicking any answer line → floating `✏️ Correct this` bubble appears above the selection. Click → modal pre-filled with the selection. "Queue patch" → success toast with "Open Me" deep-link to `/redesign/me`'s Memory Update Inbox. |

## Two scenes the recorder couldn't show on this fixture

The starter live artifact (`Daily Brief - 2026-05-06`) renders the AnswerPacket short-answer as a **title-shaped string** ("Daily Morning Brief follow-ups for 2026-05-06") without inline `[N]` citation markers. So:

- **Scene 4 (P0.1 hover popover, P2.9 freshness pill)** — `renderInlineWithCites` only wraps `.rd-cite-wrap` around inline `[N]` chips found via the `/\[(\d+)\]/g` regex in body prose. With no such markers in the title, no popover anchor exists.
- **Scene 6 (P0.3 counterfactual probe)** — same dependency: the right-click context menu binds to inline `.rd-cite` chips, not block-style `.rd-cite--block` evidence-row labels.

Both features are end-to-end verified in `feat/redesign-chat-sprint1` and `feat/redesign-chat-sprint2` PRs against the original `sampleAnswer` fixture (which includes inline `[1]`, `[2]`, `[3]` markers in the short-answer prose). To reproduce locally:

```bash
# 1. Start the redesign showcase locally
npm run dev   # or npx vite preview --port 4212 against a built bundle

# 2. Open without a live artifact set so the original starter answer renders:
open http://127.0.0.1:4212/redesign/chat?artifact=none
```

Then hover any `[N]` chip in the prose to see the popover with quote + source + freshness pill, or right-click for the probe menu.

## How the recording was generated

[`scripts/ui/recordChatSprintsDemo.mjs`](https://github.com/HomenShum/NodeBenchAI/blob/main/scripts/ui/recordChatSprintsDemo.mjs) drives Playwright (Chromium, 1440×900, dark) through 11 scenes paced for the eye, with explicit `bodyContains`-style locator probes. Output:

- `.tmp/chat-sprints-demo/chat-sprints-demo.webm` — Playwright native
- `.tmp/chat-sprints-demo/chat-sprints-demo.mp4` — H.264 (`ffmpeg -c:v libx264`)
- `.tmp/chat-sprints-demo/chat-sprints-demo.gif` — 1080p, 8fps, palettegen+paletteuse for size
- `.tmp/chat-sprints-demo/scenes.json` — scene timestamps + skip-reasons

Re-run any time:
```bash
node scripts/ui/recordChatSprintsDemo.mjs --baseURL https://www.nodebenchai.com
```

## Verification chain

| Tier | Status | Evidence |
|---|---|---|
| `tsc --noEmit` | ✓ clean (4× — once per sprint PR) | per-PR build log |
| `npm run build` | ✓ clean (4× ~3m each) | per-PR build log |
| Tier A `verify-live.ts` | ✓ 5/5 after each deploy | post-merge run |
| Tier B desktop smoke | ✓ 9/9 after each deploy | `BASE_URL=https://www.nodebenchai.com npm run live-smoke` |
| Tier B mobile smoke | ✓ 8/8 after Sprint 4 | `BASE_URL=https://www.nodebenchai.com npm run live-smoke:mobile` |
| Visual demo (this) | this gif | `node scripts/ui/recordChatSprintsDemo.mjs` |

## Per-PR commits

| Sprint | PR | Squash commit | Date | Features |
|---|---|---|---|---|
| 1 | [#246](https://github.com/HomenShum/NodeBenchAI/pull/246) | `ee5b0341` | 2026-05-07 | Hover source preview · Cost-per-turn |
| 2 | [#247](https://github.com/HomenShum/NodeBenchAI/pull/247) | `b2254507` | 2026-05-07 | Streaming scratchpad · Counterfactual probe |
| 3 | [#248](https://github.com/HomenShum/NodeBenchAI/pull/248) | `17a9e761` | 2026-05-07 | Inline correction · Source freshness · Open-questions tray |
| 4 | [#249](https://github.com/HomenShum/NodeBenchAI/pull/249) | `54600a93` | 2026-05-07 | Pin/carry-forward · A/B compare · Reproducibility hash |

— Homen Shum + Claude Opus 4.7 (1M context)
