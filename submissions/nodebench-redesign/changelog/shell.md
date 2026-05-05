# Changelog — `src/features/redesign/RedesignShell.tsx`

> **Surface**: Top-level shell for `/redesign/*`. Mounts tokens.css + primitives.css. Owns URL → surface routing. Mounts CommandPalette + ShortcutsOverlay + ToastViewport at the layout level so every redesign route gets them.

## 2026-05-05 — Created · parallel route shell

New top-level shell for the entity-intelligence redesign showcase. Mounts tokens scoped via `[data-redesign]` attribute so design tokens never leak to the live cockpit at `/`.

Routes:
- `/redesign` → Home
- `/redesign/reports` → Reports list
- `/redesign/reports/<id>` → ReportNotebookView (TipTap)
- `/redesign/chat` → Chat
- `/redesign/inbox` → Inbox
- `/redesign/me` → Me
- `/redesign/workspace[/...]` → Workspace

Mounts cross-surface primitives at the layout level: CommandPalette (⌘K), ShortcutsOverlay (?), ToastViewport.

Honors `?focus=zen` URL param via `body[data-redesign-focus-mode="on"]` attribute that collapses the left rail and rewrites the parent grid template (resolves the months-long persona-antagonism ceiling between Karpathy zen and banker chrome modes).

Theme + viewport state held locally — `<ThemeFab />` for light/dark toggle, `<ViewportFab />` for force-mobile preview, `<NavBanner />` for the persistent route indicator.

**Commit**: `737b02a` (feat/redesign-showcase). **Author**: Homen Shum + Claude Opus 4.7.
