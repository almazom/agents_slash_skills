# Trello Card Template Reference

Use this real card as the canonical structure reference for newly generated
Trello cards:

- `https://trello.com/c/GD6BYT3D/56-describe-legacy-debt-boundaries-swift-native-improvement-decisions-and-what-not-to-carry-forward`

The reference card structure is:

1. `## User Story`
2. `## Story Points: N`
3. `## Operator Verification (how Al tests this manually)`
4. `## What you will see / feel`
5. `## Definition of Done`
6. `## Technical details`
7. `## Technical acceptance criteria`
8. `## Dependencies`
9. `## Research references`
10. `## What this is NOT`
11. `## Workflow lane evidence`

## Rules

- Preserve this block order when generating new Trello card descriptions.
- Keep every block present even when the content is brief.
- Prefer one shared rendered Markdown source for both local card files and
  Trello descriptions so the structure cannot drift.
- Prefer operator-facing language in:
  - `User Story`
  - `Operator Verification`
  - `What you will see / feel`
  - `Definition of Done`
- Keep implementation detail in:
  - `Technical details`
  - `Technical acceptance criteria`
  - `Dependencies`
  - `Research references`
- Keep scope boundaries explicit in `What this is NOT`.
- Keep lane-specific automation evidence explicit in `Workflow lane evidence`.

## Adaptation Guidance

- Replace `Al` with the current operator only when that is explicitly known.
- Use the real reviewed issue and file evidence, not generic filler.
- When a card comes from `deep-review`, source reports may appear under
  `Research references`.
- If a section has little content, keep it short rather than dropping it.
