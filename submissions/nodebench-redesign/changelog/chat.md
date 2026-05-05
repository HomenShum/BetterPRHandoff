# Changelog — `src/features/redesign/surfaces/ChatSurface.tsx`

> **Surface**: Live operating chat. Center column = active conversation + answer packets. Right side = entity card + sources (RightInspector). Bottom = UniversalComposer.

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
