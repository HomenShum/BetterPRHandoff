# Changelog — templates/gmail-magic-resend.html

> **Surface**: Let a reviewer read a static handoff preview without mistaking an unconfigured label for a working approval action.
>
> **Append rule**: New entries go at the TOP. Never rewrite older entries.

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
