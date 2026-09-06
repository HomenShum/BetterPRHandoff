# Changelog — templates/gmail-magic-resend.html

> **Surface**: Let a reviewer read a static handoff preview without mistaking an unconfigured label for a working approval action.
>
> **Append rule**: New entries go at the TOP. Never rewrite older entries.

## 2026-09-06 — Put the change title and proof fields in reading order
Use a compact “QA packet” heading, retain the complete human-derived title beneath it, and move the unchanged exact feature ID to a labelled footer. Replace the single three-column snippet with full-width Component, Proof and Correction prompt fields at body size. All original values and four unavailable review labels stay visible; no new control or backend is added.
**Verification**: The fresh package passed 30 normal tests; its 18 other tar members and six companion outputs remained identical. The six matched layout states and two native no-action journeys passed 168 checks, with complete title, identifier and field values preserved. See the [readability evidence](../../promotion/evidence/current-handoff-20260906/readability-20260906/README.md) for exact source bindings, independent review and limits. Earlier table/heading results remain historical; no email-client or full product grade is claimed.
**Commit**: `pending`. **Author**: pending.
**Touches**: none; one template surface.

## 2026-09-06 — Wrap preview content and disclose unconfigured actions
Keep long table and code content within the preview layout, and replace placeholder links with ordinary review labels marked Not configured. The template states that it cannot approve, request a fix, or resend. Long headings also wrap within the card. Current generated normal and long previews pass the focused 320-pixel, desktop and computed doubled-text containment checks; the broader table and native-action observations retain their earlier source bindings. No email-client or delivery result is claimed.
**Commit**: `pending`. **Author**: pending.
**Touches**: `CHANGELOG/scripts/bin-init.md`

## Entry template

```md
## YYYY-MM-DD — Short imperative title
What changed and why in one to three sentences.
**Commit**: `pending`. **Author**: pending.
**Touches**: <other CHANGELOG files affected>
```
