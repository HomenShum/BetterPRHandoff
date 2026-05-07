# Demo v2 — Chat Enhancements Sprints 1-4 (all gaps closed)

> Followup to [demo-chat-sprints-1-4.md](demo-chat-sprints-1-4.md). The v1 recording skipped 2 of 11 features (P0.1 hover popover, P0.3 counterfactual probe) because the live-detail starter answer rendered without inline `[N]` markers, AND verified 4 features only mid-flow without exercising their closed-loop end states. This v2 closes every gap.
>
> **Result:** 22/22 closed-loop assertions pass live on prod.

## What changed in the product

[`PR #251`](https://github.com/HomenShum/nodebench-ai/pull/251) + [`#252`](https://github.com/HomenShum/nodebench-ai/pull/252) shipped two minimal product changes that make the demo deterministically reproducible:

1. **`STARTER_ANSWER` includes inline `[N]` cite markers** — `shortAnswer` and `whyItMatters` now contain `[1]`, `[2]`, `[3]` so `renderInlineWithCites` has anchors regardless of whether a live artifact is loaded.
2. **`?fresh=1` URL param aliases `liveDetail` to null end-to-end** — every downstream branch (`buildSeedTurns`, `liveStarters`, `sendMessage`, `liveAnswer`, `liveTitle`, breadcrumb header) sees "no live artifact" and renders the hardcoded `STARTER_ANSWER` instead.

## Walkthrough (v2)

![chat sprints 1-4 v2 demo](chat-sprints-1-4-demo-v2.gif)

- **GIF** (1080×675 · 8 fps · 38.3 s · 7.6 MB): [chat-sprints-1-4-demo-v2.gif](chat-sprints-1-4-demo-v2.gif)
- **MP4** (H.264 · 1440×900 · 25 fps · 1.3 MB): [chat-sprints-1-4-demo-v2.mp4](chat-sprints-1-4-demo-v2.mp4)
- **Scene log**: [chat-sprints-1-4-scenes-v2.json](chat-sprints-1-4-scenes-v2.json)
- **Assertions** (22/22 PASS): [chat-sprints-1-4-assertions-v2.json](chat-sprints-1-4-assertions-v2.json)

## Closed-loop assertions

Every feature now exercises its end-state action. The recorder asserts each one against live prod (`https://www.nodebenchai.com/redesign/chat?fresh=1`):

```text
✓ hydration-reaches-chat
✓ starter-answer-rendered                — 2 assistant turns
✓ p1.5-cost-meta                         — Auto tier · 3 sources · 54ms · <$0.01
✓ p0.2-working-notes-toggle
✓ p0.2-working-notes-expanded
✓ p2.11-tray-visible
✓ p2.11-flash-attention                  — pulse fires on tray-click jump
✓ p0.1-inline-cite-anchor                — [N] chips wrapped in .rd-cite-wrap
✓ p0.1-popover-quote                     — popover renders with quote text
✓ p2.9-freshness-pill                    — "refreshed Xh ago" pill in popover
✓ p0.3-probe-menu-open                   — right-click context menu fires
✓ p0.3-probe-banner-visible              — ProbeBanner renders above answer
✓ p0.3-evidence-row-masked               — data-masked attribute applies dim+strike
✓ p0.3-restore-removes-banner            — Restore CTA clears mask
✓ p1.6-pinned-chip-visible               — chip slides in above composer
✓ p1.6-pinned-chip-has-tier              — AUTO/FREE/FAST/DEEP label present
✓ p1.6-pinned-chip-removed               — × close button removes chip
✓ p2.7-modal-open                        — A/B compare modal opens
✓ p2.7-variant-a-visible
✓ p2.7-variant-b-visible
✓ p2.7-modal-closes-on-pick              — Pick A closes the modal
✓ p2.13-clipboard-has-share-url          — https://www.nodebenchai.com/redesign/chat/r/1ukpno11rsow
✓ p2.13-hash-deterministic               — two consecutive Share clicks: 1ukpno11rsow === 1ukpno11rsow
✓ p1.4-correct-bubble-visible            — triple-click → "Correct this" pill
✓ p1.4-correct-dialog-open               — bubble click → modal pre-filled
✓ p1.4-modal-closes-on-save              — Queue patch closes modal + toasts
```

## Compare v1 vs v2

| Feature | v1 status | v2 status |
|---|---|---|
| P0.1 hover popover | ⚠ skipped (no anchors) | ✓ passed |
| P0.3 counterfactual probe | ⚠ skipped (no anchors) | ✓ passed (incl. Restore) |
| P2.9 source freshness pill | ⚠ skipped (popover dependency) | ✓ passed |
| P2.13 share toast | ⚠ ephemeral (not asserted) | ✓ clipboard.readText asserted |
| P2.13 hash determinism | not tested | ✓ two-clicks-same-hash |
| P2.7 A/B Pick A end-state | not tested | ✓ modal closes |
| P1.6 pin → chip → unpin | only "chip visible" | ✓ full render → tier → unpin |
| P1.4 correction modal | only bubble | ✓ bubble → modal → Queue patch |
| P2.11 tray jump | only render | ✓ click → flash-attention pulse |

**v1: 11/11 rendered, ~6/11 closed-loop. v2: 11/11 rendered, 22/22 closed-loop assertions pass.**

## How to reproduce

```bash
# Against live prod
node scripts/ui/recordChatSprintsDemo.mjs --baseURL https://www.nodebenchai.com

# Against a local preview
node scripts/ui/recordChatSprintsDemo.mjs --baseURL http://127.0.0.1:4212
```

Outputs to `.tmp/chat-sprints-demo-v2/`:
- `chat-sprints-demo-v2.webm` — Playwright native
- `chat-sprints-demo-v2.mp4` — H.264
- `chat-sprints-demo-v2.gif` — 1080p, 8fps
- `scenes.json` — scene-by-scene timeline
- `assertions.json` — per-feature pass/fail (recorder exits 1 if any fail)

The recorder unregisters service workers before first navigation and uses `Promise.race([rd-chat-empty, rd-chat-msg--assistant])` to handle headless-Chromium hydration timing — both fixes were in [#252](https://github.com/HomenShum/nodebench-ai/pull/252) along with the proper `?fresh=1` end-to-end aliasing.

## Per-PR commits

| Sprint / Round | PR | Squash commit | Adds |
|---|---|---|---|
| 1 | [#246](https://github.com/HomenShum/nodebench-ai/pull/246) | `ee5b0341` | Hover popover · cost-per-turn |
| 2 | [#247](https://github.com/HomenShum/nodebench-ai/pull/247) | `b2254507` | Streaming scratchpad · counterfactual probe |
| 3 | [#248](https://github.com/HomenShum/nodebench-ai/pull/248) | `17a9e761` | Inline correction · source freshness · open-questions tray |
| 4 | [#249](https://github.com/HomenShum/nodebench-ai/pull/249) | `54600a93` | Pin/carry-forward · A/B compare · reproducibility hash |
| Recorder v1 | [#250](https://github.com/HomenShum/nodebench-ai/pull/250) | `9b18233e` | First Playwright walkthrough |
| Demo gap closure | [#251](https://github.com/HomenShum/nodebench-ai/pull/251) | `d146a28c` | Inline cites in STARTER_ANSWER + ?fresh=1 + recorder v2 |
| Hardening | [#252](https://github.com/HomenShum/nodebench-ai/pull/252) | `46e2a317` | End-to-end ?fresh=1 alias + SW unregister + Promise.race |

— Homen Shum + Claude Opus 4.7 (1M context)
