# Developer and reviewer handoff

A developer uses this CLI to create change-history lanes and a review-packet
skeleton in a project they own. The next reviewer can then see what changed,
why it changed, and which proof is still missing. The CLI creates files; it
does not record a browser, verify a video, send email, or implement approvals.

Read [README.md](README.md) for the available commands and
[AGENTS.md](AGENTS.md) for the submission protocol. A project's existing rules
still need deliberate integration. Copying a rule file does not prove an agent
host loaded it or followed it.

## First use from the reviewed source

The package declares Node 18 or newer. The retained local proof uses Windows
with Node 22.22.2; that result does not certify every declared runtime or shell.
This repository has no runtime dependencies or tracked lockfile. From its root:

```sh
npm test
node bin/init.mjs help
```

The current source runs 30 registered scenario tests with real child processes
and owned temporary files. For a project of your own, run the following from
that project's root, replacing the quoted path with the reviewed checkout's
absolute path:

```sh
node "<reviewed-checkout>/bin/init.mjs" init
node "<reviewed-checkout>/bin/init.mjs" add components supplier-review
node "<reviewed-checkout>/bin/init.mjs" qa-init
node "<reviewed-checkout>/bin/init.mjs" qa supplier-review
```

Inspect `CHANGELOG/components/supplier-review.md`, `qa.config.json` and the four
files in `QA_DOGFOOD/supplier-review/`. Fill current facts and real evidence;
pending commit and author fields are intentional. A fenced format example is
not historical work. The static HTML labels its four review actions as not
configured. It cannot approve, request changes, comment or resend anything.

Repeated init preserves an existing CHANGELOG directory without validating
its contents. qa-init preserves any existing config. Lane and packet creation
refuse a conflicting destination. Rule installation preserves identical files
and refuses differing content for manual integration; a partial failed install
may leave newly created files without overwriting existing work. These are
finite file-preservation guarantees, not a transaction or a general guarantee
for symlinks and arbitrary competing writers.

## Source, package and evidence boundaries

The retained local package was packed from exact source, installed into a new
consumer and invoked through its installed bin. The installed CLI journey
passed 53 checks and the normal source command passed 30 tests. These are local
artifacts, not evidence that a new package version reached the npm registry.
Use an exact reviewed tarball or this checkout when reproducing the repair.

This handoff and its dated promotion evidence are Git-checkout documents. The
existing npm `files` allowlist includes README, AGENTS, skill, CLI and templates,
and excludes HANDOFF and promotion evidence. No package allowlist change is
implied. Package consumers should follow their included README and use the
reviewed source checkout for the historical proof packet.

The readability layout starts with “QA packet”, keeps the complete change title
beneath it and places the exact feature ID in a labelled footer. Component,
Proof and Correction prompt use full-width labelled fields; the four review
actions remain unconfigured. The [readability supplement](promotion/evidence/current-handoff-20260906/readability-20260906/README.md)
records a fresh 19-member package, its actual installation and generated normal
and long previews. All 18 other tar members and six companion outputs stayed
identical; the normal source command passed 30 tests.

The final readability observation passed 168 checks across six matched layout
states and two native no-action journeys. It used normal and long inputs at
320 × 800, 390 × 844 with computed doubled text, and 1440 × 960. The first
instruction is visible in both long phone states, and the three proof fields
retain their complete values in reading order. The full feature ID remains in
the footer. The [independent judgment](promotion/evidence/current-handoff-20260906/readability-20260906/raw/E6m_BETTERPRHANDOFF_READABILITY_FINAL_JUDGE.md.txt)
and [scoped criterion observations](promotion/evidence/current-handoff-20260906/readability-20260906/raw/E6m_BETTERPRHANDOFF_READABILITY_CRITERION_ASSESSMENT.md.txt)
state the remaining limits. These results do not certify all viewports or
email clients; the earlier results below retain their original source.
Eight scoped readability observations improved from 3/5 to 4/5; the other
36 criterion rows stay historical and all full grades remain null. The long
desktop example needs 7 pixels of ordinary vertical scrolling.

The historical browser proof addresses the preceding static preview with normal
and long illustrative inputs. It preserves original narrow-table, misleading-action and
enlarged-heading failures. The final heading-only run passed 68 checks across
six normal/long states and
two scrolled tables. Its 14 PNGs include illustrative full-page captures; this
packet retains the eight actual viewport/scrolled images and structured state.
The broad seven-pair and native-action observations belong to the preceding
source with unchanged table/action bytes. They were not rerun or silently
relabeled as final-source observations. The historical review identified long
titles and heavily wrapped narrow columns as reading limitations. It does not
establish the new layout's usability. Full visual, responsive, interaction and
readiness scores remain unassigned.

The [independent criterion assessment](promotion/evidence/current-handoff-20260906/raw/E6m_BETTERPRHANDOFF_CRITERION_ASSESSMENT.md.txt)
records 29 partial observations and 15 criteria not run. Eight observed 3/5
criteria identify long-title and narrow-table reading friction. All 44 final
criterion values, eight dimension scores and the overall grade remain null.
It evaluates the historical 67-file source and does not certify the later CI
or this handoff as a newly executed runtime.

## What still needs separate verification

Rendered screenshots and native browser actions do not establish an email
client's rendering, a delivery service, a review backend, recording/video
verification, a physical device or a model/provider. Computed doubled text is
not native browser zoom. No global host was activated and no email was sent.

The [ordinary CI](.github/workflows/ci.yml) ran on the published source
`42e57a96f9ae961f501729ec6ace5c3d8dbe3aee`: [shared run 34010433758](https://github.com/HomenShum/BetterPRHandoff/actions/runs/34010433758)
completed installation, 30/30 scenarios and packaging on both Windows and
Ubuntu with Node 22.23.2. It did not replay a browser or certify this later
readability change, which requires its own current-source shared result.
Historical promotion records remain unchanged and describe their original
source. The historical publication bindings include its CI and handoff versions;
they do not certify the later readability template or this updated handoff.

## Preserve and verify evidence

The [dated packet](promotion/evidence/current-handoff-20260906/README.md) provides
a standard-library Python byte verifier, an exact original-to-copy map, and a
finite omission list. It retains native
viewport images and the scrolled before/after states needed for the observed
defects. Redundant full-page images remain local and cannot support a portable
viewport claim. Raw historical paths are provenance, not fresh-run commands.

The original printed-source command was not isolated correctly and executed an
unintended local file. Its private stderr and aggregate command diagnostic are
excluded without reading or copying them. The failure remains disclosed; the
controlled repaired command cases supply the current proof. Profiles, private
environment/state and caches are also excluded. A byte verifier does not rerun
the CLI or browser and cannot reconstruct omitted sessions or files.

Run the current packet's byte check from the repository root; Python needs
no added package:

```sh
python promotion/evidence/current-handoff-20260906/verify.py
```

Its optional current source check uses the same verifier:

```sh
python promotion/evidence/current-handoff-20260906/verify.py --source-root .
```

This checks 69 effective source files, including the later publication handoff
and changelog text. The producer's exact 69-file snapshot is separately bound;
updating documentation does not rerun the package or browser. Source checking
allows only proven per-file CRLF-to-LF conversion and keeps binary media exact.
Raw evidence always remains byte-exact.

For the old complete packet and source check, use its matching publication
checkout at `42e57a96f9ae961f501729ec6ace5c3d8dbe3aee`. The supplement preserves
the old bindings, manifest, index and handoff as inert history. All 554 earlier
raw copies and both earlier HTML examples remain unchanged; their old grades
and runtime identities are not relabelled as readability proof.
