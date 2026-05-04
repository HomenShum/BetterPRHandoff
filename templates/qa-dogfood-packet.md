# __TITLE__ QA Dogfood Packet

Feature ID: `__FEATURE_ID__`
Created: `__DATE__`

This packet is the readable proof bundle for a visible feature change. It should be generated from a Parity Studio design mission, browser QA run, or equivalent local preview before production code is considered done.

## Links

- Preview/test link:
- Parity Studio run:
- Side-by-side review:
- GIF:
- MP4:
- Remotion render:
- Gmail resend HTML: `gmail-magic-resend.html`

## User-visible outcome

Describe what changed for the end user in plain language. Avoid implementation-only claims.

## Workflow lanes

- New or empty user state:
- Returning user state:
- Main happy path:
- Comment/edit correction:
- Error or permission state:
- Mobile state:
- Desktop state:

## Persona lanes

- First-time non-technical user:
- Product/design reviewer:
- Coding agent maintainer:

## Snapshot snippets

| Component slug | Before | After | Diff | Verdict | Correction prompt |
|---|---|---|---|---|---|
| `surface.primary` |  |  |  | pending |  |
| `surface.secondary` |  |  |  | pending |  |

## QA checklist

- [ ] The preview/test link opens without console errors.
- [ ] Full-page before/after screenshots exist.
- [ ] Component-level snippets exist for each visible change.
- [ ] A GIF shows the primary workflow.
- [ ] An MP4 or Remotion render explains the end-to-end workflow.
- [ ] The End-user impact readout explains customer impact, not only score meaning.
- [ ] Any failed/weak state has a correction prompt attached to a component slug.
- [ ] CHANGELOG lanes were updated for every touched surface.

## Correction prompt

Use this when asking a coding agent to repair a failed visual QA finding:

```text
Use the QA packet at QA_DOGFOOD/__FEATURE_ID__.
Fix component slug <component-slug>.
Expected: <expected visible result>.
Actual: <actual visible result>.
Use the before/after/diff screenshots as the source of truth.
Rerun browser QA, update manifest.json, regenerate the GIF/MP4 if visible behavior changed, and update the relevant CHANGELOG lane before committing.
```
