# Changelog — `easier present`

> **Surface**: Deterministic local adapter from a machine-readable handoff to
> NodeKit Present artifacts and a content-hashed proof receipt.

## 2026-07-19 — Export an evidence-bound Change Story

Add `easier present <handoff.json>` with write and fail-on-drift check modes.
The adapter rejects path traversal, missing evidence, false assertion maps,
duplicate IDs, and unbound claims; the existing init, lane, QA, and install CLI
behavior is unchanged.

**Commit**: `de17c8b`. **Author**: Codex.

**Touches**: [`CHANGELOG/integrations/nodekit-present.md`](../integrations/nodekit-present.md)
