# Changelog — nodekit.yaml

> **Surface**: Tell a maintainer which local CLI checks and handoff contract exist.
>
> **Append rule**: New entries go at the TOP. Never rewrite older entries.

## 2026-09-07 — Describe the existing finite CLI contract
Declare preview lifecycle, canonical handoff ownership and finite aliases for the existing `npm run test` script, with no runtime contract consumption or receipt producer. Scope no-key certification to local CLI scaffolding and use a null receipt schema so a QA skeleton cannot be mistaken for executed proof. Keep [the developer handoff](../../HANDOFF.md), historical source bindings and package contents unchanged; this metadata does not upgrade their visual or readiness claims.
**Commit**: `23c4e01`. **Author**: homen.
**Touches**: none; only this contract lane.

The contract is checkout metadata outside the existing npm package allowlist.
Run `npm test` from the repository root for the finite CLI scenarios; the
doctor, check and proof declarations all reference that same script. No new
service environment is required; existing home-path variables still choose
where an explicitly requested rule installation writes files. The current
NodeKit repository schema accepts `proof.receiptSchema: null`. Central registry
alignment is a separate integration step, not a claimed runtime capability.
