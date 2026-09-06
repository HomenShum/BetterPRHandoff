# Readability evidence

A developer shares a QA packet so another person can identify the change and
read its preparation instructions and proof fields. The previous large repeated
title and three narrow columns made this difficult on phones. The changed
template uses a compact heading, a complete body-size title and three labelled
fields, with the exact feature ID retained in a footer. Review actions remain
ordinary unconfigured text.

Start with [HANDOFF](../../../../HANDOFF.md). This supplement extends the
[existing packet](../README.md) and uses its unchanged standard-library verifier.

## Actual source and outcomes

- [Fresh producer](raw/E6m_BETTERPRHANDOFF_READABILITY_CONSUMER.json): 30 normal
  tests, a 19-member tarball, actual local installation and eight generated
  output files. Only the HTML tar member changed; the other 18 members and six
  companion outputs remained identical. The tarball SHA256 is
  `19eab29d70bfe3859e55b625a778bf951dd8c77958646e27d7d0a15de8e4e9e1`.
- [Before receipt](raw/E6m_BETTERPRHANDOFF_READABILITY_BEFORE_RECEIPT.json):
  six exact states with 24 raw/labelled PNGs and restoration evidence.
- [Final browser report](raw/E6m-betterpr-readability-after-01/browser/report.json):
  168 checks across six matched layout states and two native no-action journeys,
  with 24 actual after PNGs. Raw DOM, lexical/range observations, requests and
  cleanup records accompany the pixels.
- [Independent judgment](raw/E6m_BETTERPRHANDOFF_READABILITY_FINAL_JUDGE.md.txt) and
  [criterion observations](raw/E6m_BETTERPRHANDOFF_READABILITY_CRITERION_ASSESSMENT.md.txt) assess this bounded change.
  Eight scoped observations improved from 3/5 to 4/5; the other 36 rows are
  unchanged. Their original JSON values are retained unchanged. All full grades
  remain null.

The visible first instruction ends within the initial viewport for both long
phone examples. The complete field labels/values remain in DOM order and the
exact ID is visible on ordinary scrolling. The desktop snippet is deliberately
taller: the long 1440 × 960 example is 967 pixels high and needs 7 pixels of
ordinary vertical scrolling. These are static local browser observations, not
Gmail or email delivery.

## Matched viewport evidence

Each row preserves its actual viewport and text condition. Computed doubled
text is not native browser zoom. Before top/snippet and after footer are
different recorded scroll states; no nonexistent before-footer comparison is
claimed. All actual before boundary labels and restoration receipts are also
retained in the copy map.

| State | Before | After |
| --- | --- | --- |
| normal-320x800-normal | [Top](raw/E6m-betterpr-readability-before-01/browser/normal-320x800-normal-top-before.png) / [snippet](raw/E6m-betterpr-readability-before-01/browser/normal-320x800-normal-snippet-before.png) | [Top](raw/E6m-betterpr-readability-after-01/browser/normal-320x800-normal-top.png) / [snippet](raw/E6m-betterpr-readability-after-01/browser/normal-320x800-normal-snippet.png) / [ID footer](raw/E6m-betterpr-readability-after-01/browser/normal-320x800-normal-footer.png) |
| long-320x800-normal | [Top](raw/E6m-betterpr-readability-before-01/browser/long-320x800-normal-top-before.png) / [snippet](raw/E6m-betterpr-readability-before-01/browser/long-320x800-normal-snippet-before.png) | [Top](raw/E6m-betterpr-readability-after-01/browser/long-320x800-normal-top.png) / [snippet](raw/E6m-betterpr-readability-after-01/browser/long-320x800-normal-snippet.png) / [ID footer](raw/E6m-betterpr-readability-after-01/browser/long-320x800-normal-footer.png) |
| normal-390x844-text200 | [Top](raw/E6m-betterpr-readability-before-01/browser/normal-390x844-text200-top-before.png) / [snippet](raw/E6m-betterpr-readability-before-01/browser/normal-390x844-text200-snippet-before.png) | [Top](raw/E6m-betterpr-readability-after-01/browser/normal-390x844-text200-top.png) / [snippet](raw/E6m-betterpr-readability-after-01/browser/normal-390x844-text200-snippet.png) / [ID footer](raw/E6m-betterpr-readability-after-01/browser/normal-390x844-text200-footer.png) |
| long-390x844-text200 | [Top](raw/E6m-betterpr-readability-before-01/browser/long-390x844-text200-top-before.png) / [snippet](raw/E6m-betterpr-readability-before-01/browser/long-390x844-text200-snippet-before.png) | [Top](raw/E6m-betterpr-readability-after-01/browser/long-390x844-text200-top.png) / [snippet](raw/E6m-betterpr-readability-after-01/browser/long-390x844-text200-snippet.png) / [ID footer](raw/E6m-betterpr-readability-after-01/browser/long-390x844-text200-footer.png) |
| normal-1440x960-normal | [Top](raw/E6m-betterpr-readability-before-01/browser/normal-1440x960-normal-top-before.png) / [snippet](raw/E6m-betterpr-readability-before-01/browser/normal-1440x960-normal-snippet-before.png) | [Top](raw/E6m-betterpr-readability-after-01/browser/normal-1440x960-normal-top.png) / [snippet](raw/E6m-betterpr-readability-after-01/browser/normal-1440x960-normal-snippet.png) / [ID footer](raw/E6m-betterpr-readability-after-01/browser/normal-1440x960-normal-footer.png) |
| long-1440x960-normal | [Top](raw/E6m-betterpr-readability-before-01/browser/long-1440x960-normal-top-before.png) / [snippet](raw/E6m-betterpr-readability-before-01/browser/long-1440x960-normal-snippet-before.png) | [Top](raw/E6m-betterpr-readability-after-01/browser/long-1440x960-normal-top.png) / [snippet](raw/E6m-betterpr-readability-after-01/browser/long-1440x960-normal-snippet.png) / [ID footer](raw/E6m-betterpr-readability-after-01/browser/long-1440x960-normal-footer.png) |

The two actual native journeys use the [long 390 doubled-text keyboard state](raw/E6m-betterpr-readability-after-01/browser/native-long-390x844-text200-keyboard.png)
and [normal 1440 keyboard state](raw/E6m-betterpr-readability-after-01/browser/native-normal-1440x960-normal-keyboard.png).
Tab/Enter skips the four inert review labels; pointer clicks do not trigger an
action, request or navigation. Native scrolling reaches the footer. The raw
journeys retain exact observed events and do not claim keyboard focus on plain
text or a working approval/resend service.

## Historical and current bindings

The base commit remains `42e57a96f9ae961f501729ec6ace5c3d8dbe3aee`; the actual
working template SHA256 is
`92dbb0deb2b3f8055f6def51bf231fd9f082dffaeb558c2290ddc738701f13ba`.
[Lineage](lineage.json) separates the historical publication, actual producer,
browser observations and later publication documentation. The producer used
69 working source files; current binding updates to HANDOFF and the changelog
do not claim another runtime execution. Earlier 67/68/69-file proofs and
criterion values remain historical.

The exact old [source bindings](history/42e57-source-bindings.json.txt),
[manifest](history/42e57-manifest.json.txt),
[index](history/42e57-packet-README.md.txt) and
[HANDOFF](history/42e57-HANDOFF.md.txt) are inert lineage copies. Use a matching
42e57 checkout to verify that complete old packet and source. This supplement
does not duplicate the old packet or modify its 554 raw copies/two HTML examples.

The [42e57 shared judgment](raw/E6m_BETTERPRHANDOFF_SHARED_JUDGE.md.txt)
records the earlier Windows/Ubuntu 30/30 result. It does not certify the later
readability source on shared CI or rerun a browser.

## Verify and locate evidence

From the repository root:

```sh
python promotion/evidence/current-handoff-20260906/verify.py
python promotion/evidence/current-handoff-20260906/verify.py --source-root .
```

Raw packet bytes stay strict. Current source checks use actual Git-canonical
identities, allowing only proven per-row CRLF-to-LF text conversion; binary
media stays exact. A verifier pass proves bytes, not another browser, source
test, Git index inspection or visual grade.

[raw-copy-map.json](raw-copy-map.json) records every selected original and
physical copy. The root packet manifest protects the new payloads and the new
map; independent publication review verifies the new original-to-copy mapping.
[excluded-artifacts.json](excluded-artifacts.json) lists omissions. Raw paths
are original provenance and may name omitted operator-local files; only current
authored indexes promise portable links. No private printed-command diagnostic,
environment/profile/DB/cache or browser-capability inventory is included.

Only six affected layout states and two native journeys were rerun. The earlier
seven-pair observations are not relabelled as this source. There is no physical
device, screen-reader, native zoom, email-client, provider, recording, approval
backend or performance certification. Omitted full inventories and browser
capabilities prevent reconstruction of the exact old session; retained DOM and
pixels support only their recorded state. Full readiness scores remain null.
