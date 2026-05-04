# Integrations — who implements which half of the protocol

`easier-to-read-submissions` is the **protocol**. It defines the shape of every artifact (changelog lanes, runtime diagrams, QA packets) and tells AI agents when to produce them. It does **not** ship product code that captures screenshots, runs Playwright, renders Remotion videos, or sends Gmail. Those are the **generators** — separate tools you can mix and match per project.

This file documents the canonical generators and how to wire them. The goal is no duplication: one repo defines the contract, every other repo (consumer or generator) reads from this contract.

---

## The contract

```
┌─────── easier-to-read-submissions (THIS REPO) ──────────┐
│                                                          │
│   PROTOCOL DOCS              SCHEMAS                     │
│   · SKILL.md                 · qa-packet-schema.json     │
│   · AGENTS.md                · (changelog format spec)   │
│   · qa-packet.md             · (runtime diagram format)  │
│                                                          │
│   TEMPLATES                                              │
│   · qa-email.html.mustache                               │
│   · CHANGELOG-README.md                                  │
│   · CHANGELOG-TEMPLATE.md                                │
│   · lane.md                                              │
│   · runtime-diagram.md                                   │
│   · recorder.mjs / verifier.mjs (lightweight reference)  │
│                                                          │
│   CLI                                                    │
│   · npx easier init / add / install / qa-init           │
│                                                          │
└──────────────────────────────────────────────────────────┘
                  │                   │
       reads      │                   │   reads
       schema     │                   │   templates
                  ▼                   ▼
┌──────────── GENERATORS (other repos) ────────────────────┐
│                                                          │
│   PARITY STUDIO  (heavy: image→ui_kit + visual QA)       │
│     · screenshot capture per state                       │
│     · component snippet decompose                        │
│     · before/after diff                                  │
│     · GIF                                                │
│     · Remotion video                                     │
│     · Gmail Magic Resend                                 │
│     · review page hosting                                │
│                                                          │
│   SITFLOW SCRIPTS  (lightweight: per-feature recorder)   │
│     · scripts/record-jaynee-demo.mjs                     │
│     · scripts/verify-jaynee-demo.mjs                     │
│     · MP4 + GIF + evidence JSON                          │
│                                                          │
│   YOUR TOOL  (CI-native, in-IDE, custom)                 │
│     · whatever you build                                 │
│     · just emit qa-packet-schema.json output             │
│                                                          │
└──────────────────────────────────────────────────────────┘
                  │                   │
                  │                   │   conforms to
                  │                   │   schema
                  ▼                   ▼
┌──────────── CONSUMER REPOS ──────────────────────────────┐
│                                                          │
│   SitFlow / NodeBench / your app                         │
│   · qa.config.json (declares states)                     │
│   · CHANGELOG/ (bootstrapped by `npx easier init`)       │
│   · runs `parity-studio qa-packet` (or equivalent)       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Rule**: this repo never imports a generator. Generators never fork the schema. Consumers know about both but depend on neither's internals.

---

## Generator: Parity Studio

**Repo**: https://github.com/HomenShum/parity-studio
**Role**: heavy QA packet generator with full visual decompose pipeline.

### What Parity Studio implements (proposed)

```bash
# CLI surface
parity-studio qa-packet \
  --feature <featureId> \
  --branch <git-branch> \
  --baseline <git-ref> \
  --config ./qa.config.json \
  --out ./qa-artifacts/<featureId>/

parity-studio qa-send \
  --packet ./qa-artifacts/<featureId>/packet.json \
  --to <email> \
  --provider <gmail-smtp|resend|mailgun|ses>
```

Files Parity Studio adds (see [tracking issue](https://github.com/HomenShum/parity-studio/issues) once filed):

| File | Purpose |
|---|---|
| `mcp/src/lib/qaPacket.ts` | Read/write QA packet JSON; validate against schema |
| `mcp/src/lib/qaCapture.ts` | Drive Playwright per state from `qa.config.json` |
| `mcp/src/lib/qaEmail.ts` | Render `qa-email.html.mustache` + send via SMTP/Resend |
| `scripts/qa-packet.mjs` | CLI entry point |
| `convex/qaPackets.ts` | Convex table for hosted packet storage + review page state |
| `src/qa-review/[featureId].tsx` | Side-by-side review HTML page |
| `docs/QA-PACKET.md` | Repo-side README for the QA packet feature |

### What Parity Studio reuses from this repo

- [`templates/qa-packet-schema.json`](templates/qa-packet-schema.json) — the contract Parity Studio's output must conform to.
- [`templates/qa-email.html.mustache`](templates/qa-email.html.mustache) — the email template Parity Studio renders.
- [`templates/qa-states.example.json`](templates/qa-states.example.json) — shape of the consumer config Parity Studio reads.
- [`templates/qa-packet.md`](templates/qa-packet.md) — protocol doc (Parity Studio's docs link to this).

Parity Studio fetches these at install time (`npm i @homenshum/easier-to-read-submissions` or git submodule) — does **not** fork them. If the schema bumps, Parity Studio bumps its dependency.

---

## Generator: SitFlow's lightweight scripts

**Repo**: https://github.com/jayneebui/sitflow-mobile (branch `homen/may2026-prod-hardening`)
**Role**: per-repo Playwright recorder. No Convex, no MCP — just `node scripts/record-jaynee-demo.mjs`.

Adequate when:
- Single repo, single dev
- No need for hosted review page (GitHub raw + browser is enough)
- Already wired to a known set of routes

Output is a subset of the QA packet schema (mp4 + gif + evidence JSON). Adapter to full packet:

```bash
# Convert SitFlow's evidence.json + mp4/gif → packet.json
node scripts/sitflow-evidence-to-packet.mjs   # not built yet — open issue if needed
```

---

## Consumer: how any repo joins

```bash
# 1. Install the protocol (this repo)
npx @homenshum/easier-to-read-submissions install

# 2. Bootstrap CHANGELOG/ (lane files)
npx easier init

# 3. Declare your QA states
npx easier qa-init                    # writes qa.config.json from qa-states.example.json

# 4. Pick a generator. For full Parity Studio path:
npx parity-studio qa-packet --feature myapp.thing.v1 --config ./qa.config.json
npx parity-studio qa-send --packet ./qa-artifacts/myapp.thing.v1/packet.json --to me@example.com

# (or use SitFlow's scripts directly)
```

---

## Why this split

If protocol and generator lived in one repo:

- **Heavyweight repo**: anyone wanting just the changelog format had to clone Convex, Playwright, ffmpeg, Remotion, Gmail credentials.
- **Slow iteration on the schema**: schema bumps require re-publishing the heavy stack.
- **No alternative generators**: if you don't want Parity Studio's MCP server, you'd have to fork.

Splitting:

- **Protocol stays tiny**: `easier-to-read-submissions` is markdown + a JSON schema + a mustache template. Anyone can read it in 10 minutes.
- **Generators compete**: someone writes a Vitest-native generator, a CI-native one, an Electron desktop one — all conform to the same schema.
- **Consumers don't lock in**: switching from Parity Studio to a different generator is a config swap.

---

## Status — what's wired today

| Piece | Status |
|---|---|
| Schema + protocol docs | ✅ shipped this repo v1.2.0+ |
| `qa-email.html.mustache` template | ✅ shipped this repo v1.2.0+ |
| `qa-states.example.json` | ✅ shipped this repo v1.2.0+ |
| `npx easier qa-init` CLI | ✅ shipped this repo v1.2.0+ |
| `npx easier qa <feature-id>` (QA_DOGFOOD scaffold) | ✅ shipped this repo v1.2.1 |
| **`@homenshum/easier-to-read-submissions` on npm** | ✅ live, latest `1.2.1` |
| **Parity Studio `qa-packet` MCP tool** | ✅ shipped [`parity-studio-mcp@0.3.6`](https://www.npmjs.com/package/parity-studio-mcp) ([release notes](https://github.com/HomenShum/parity-studio/releases/tag/v0.3.6)) |
| Parity Studio review page | 🚧 spec filed (post-v0.3.6 follow-up) |
| Parity Studio Gmail send | 🚧 spec filed (post-v0.3.6 follow-up) |
| SitFlow → packet adapter | 🚧 stub, build when needed |

The protocol works **today** with the SitFlow-style scripts as your generator. Parity Studio integration is the upgrade path when you outgrow per-repo recorders.
