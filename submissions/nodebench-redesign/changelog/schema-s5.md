# Changelog — `convex/schema.ts` (Sprint S5 tables)

> **Surface**: Convex schema additions for the redesign route. 5 new tables with auth-scoped indexes.

## 2026-05-05 — Added 5 tables

| Table | Indexes | Purpose |
|---|---|---|
| `styleProfiles` | by_user_active, by_user_inferred | Operator analyst manifest. One active per user. Inferred via scripts/qa/inferStyle.ts. |
| `redesignDocumentPatches` | by_document_status, by_user_status, by_pipelineRun | Chat/agent → document edit contract. Renamed from `documentPatches` to avoid collision with the legacy table at line 4816 (which tracks patch-operations history for the live cockpit). |
| `redesignUniverses` | by_user_monitoring | Saved entity collections (Healthcare AI Coverage, YC S25 batch, etc.). Bulk "Run batch" CTA dispatches batchAutopilot.triggerManualRun across entityIds. |
| `inboxSnoozes` | by_user_until, by_user_item | Soft-hide inbox items until snoozeUntil. InboxSurface bulk-snooze writes here. Items expire automatically. |
| `agentRunFeedback` | by_user_created, by_run | Per-message thumbs up/down with optional note. Feeds the eval flywheel. |

All auth-scoped via `userId: v.id("users")`. All queries return `[]` / `null` for unauthenticated users so the redesign demos cleanly without sign-in.

Resolution: initial codegen failed with "Duplicate key documentPatches" (collision with legacy table at line 4816). Renamed redesign table to `redesignDocumentPatches`.

Verification:
- `npx convex codegen` clean
- `npx tsc --noEmit --pretty false` clean
- `npm run build` clean (1m 13s)

**Commit**: `737b02a`. **Author**: Homen Shum + Claude Opus 4.7.
