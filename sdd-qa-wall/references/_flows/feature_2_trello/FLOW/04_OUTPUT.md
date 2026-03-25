# SDD Output Structure

Goal: generate a complete SDD package with executable Trello cards. Planning only; do not implement or modify project code.

## Output Location

Default: `docs/sdd/<task-name>-sdd/` in the project root.
Use a different path only if the user requests it.

## Required Files (Top Level)

- `README.md` (entry point)
- `requirements.md`
- `ui-flow.md`
- `domain-spec.md` (optional - for features with detection/triggers)
- `gaps.md`
- `manual-e2e-test.md`
- `trello-cards/` (folder)

## trello-cards/ Required Files

- `BOARD.md` - card index and pipeline visualization
- `KICKOFF.md` - entry point for implementation agent
- `AGENT_PROTOCOL.md` - state update patterns
- `progress.md` - visual progress tracking
- `state.json` - machine-readable progress
- `01-<short-title>.md` through `NN-<short-title>.md` - numbered cards

## Card Count and Ordering

- Card count is DYNAMIC based on complexity (1-50 cards)
- See `CARD_COUNT_GUIDELINES.md` for complexity scoring
- Max 4 story points per card (KISS principle)
- Cards execute in linear order: 01 -> 02 -> ... -> NN

## Templates to Use

| Output File | Template Location |
|-------------|-------------------|
| `README.md` | `TEMPLATES/README.template.md` |
| `requirements.md` | `TEMPLATES/requirements.template.md` |
| `ui-flow.md` | `TEMPLATES/ui-flow.template.md` |
| `domain-spec.md` | `TEMPLATES/keyword-detection.template.md` |
| `gaps.md` | `TEMPLATES/gaps.template.md` |
| `manual-e2e-test.md` | `TEMPLATES/manual-e2e-test.template.md` |
| `trello-cards/KICKOFF.md` | `TRELLO_TEMPLATES/KICKOFF.template.md` |
| `trello-cards/AGENT_PROTOCOL.md` | `TRELLO_TEMPLATES/AGENT_PROTOCOL.template.md` |
| `trello-cards/BOARD.md` | `TRELLO_TEMPLATES/BOARD.template.md` |
| `trello-cards/progress.md` | `TRELLO_TEMPLATES/progress.template.md` |
| `trello-cards/state.json` | `TRELLO_TEMPLATES/state.json.template` |
| `trello-cards/NN-*.md` | `TRELLO_TEMPLATES/card-XX-template.md` |

## Completion Rule

Do not finalize outputs until all gaps are closed and requirements are consistent.

## Guardian Gate (Implementation Lock)

After generating the SDD package and Trello cards, **stop** and request explicit user approval before any implementation work.

Required user confirmations:
- All gaps are filled and `gaps.md` is complete.
- Auto-filled assumptions are accepted.
- The SDD package in `docs/sdd/<task-name>-sdd` is the final deliverable for this phase.
- An explicit request to implement (e.g., "start implementation", "proceed to code changes").

If any confirmation is missing, do not proceed beyond planning; ask for the missing approval.
