# Changelog — NodeKit Present integration

> **Surface**: The contract boundary that lets presentation tooling consume a
> BetterPRHandoff payload without owning or rewriting its source evidence.

## 2026-07-19 — Bind handoffs to the NodeKit Change Story

Register BetterPRHandoff as a flat `nodekit.repo/v1` protocol and define the
`betterprhandoff.handoff/v1` source envelope. The real NodeBench submission now
projects into the NodeKit Change Story and Evidence Index while deployment,
authentication, package publication, and NodeSlide writes remain separate
approval gates.

**Commit**: `de17c8b`. **Author**: Codex.

**Touches**: [`CHANGELOG/scripts/nodekit-present.md`](../scripts/nodekit-present.md)
