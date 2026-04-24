# Trello Workflow

`deep-review` exports the generated SDD package into a real Trello board on
`pets` through the `trello` CLI over SSH.

## Remote Runtime

- host: `pets`
- command: `trello`
- read discovery:
  - `ssh pets 'trello --help-board --format json'`
  - `ssh pets 'trello --help-list --format json'`
  - `ssh pets 'trello --help-card --format json'`
- do not use write-command `--help` for discovery on this runtime
- use `scripts/trello_remote.js` as the only command-aware transport layer

## Board Model

Create one real board per generated review package.

Required lists, in this exact order:

1. `Backlog`
2. `In progress`
3. `Blocked`
4. `Review`
5. `Simplification`
6. `Auto-commit`
7. `Done`

## SSOT Rule

- `kanban.json` is the local SSOT
- Trello mirrors `kanban.json`
- `trello/cards.json` is the ID bridge between package cards and Trello cards
- local artifacts must be checkpointed immediately after each remote success so
  reruns can resume cleanly

## Export Rule

After the SDD package is built:

1. create or reuse the Trello board
2. on a freshly created board, archive unexpected default lists
3. create any missing required lists
4. create a real Trello card for every generated package card
5. save board, list, and card IDs under `sdd_package_<run_id>/trello/`

Use initial create-card description, not a fragile follow-up `update-card`
call, unless the transport has been explicitly verified for that command.

## Card Description Rule

- Use the exact block order from
  [trello-card-template-reference.md](trello-card-template-reference.md).
- Keep all sections present.
- Do not replace the reference structure with a custom abbreviated layout.

## Comment Rule

Never move a Trello card silently.
Every move must be paired with a short human-facing Trello comment in
simplified Russian, generated from the structured lane evidence.

Use the canonical message catalog from
[notifications.md](notifications.md).

## Lane Rules

### Backlog

- default landing list for new execution cards
- creation comment recommended:
  `Карточка создана из deep-review.`

### In progress

- move when work really starts
- generated comment:
  `Взял в работу.`

### Blocked

- move only with a blocker comment
- persist blocker reason in `kanban.json` lane evidence
- required flags:
  - `--blocked-reason "..."`
- generated comment shape:
  - `Есть блокер: ...`

### Review

- before moving into `Review`, run a real review command on the actual changes
- preferred command family: `codex_wp review`
- use the smallest truthful selector:
  - `codex_wp review --uncommitted`
  - `codex_wp review --base <branch>`
  - `codex_wp review --commit <sha>`
- persist:
  - selector
  - verdict
  - short summary
- required flags:
  - `--review-selector ...`
  - `--review-verdict BLOCKED|APPROVED_WITH_NOTES|LGTM`
  - `--review-summary "..."`
- if the selector itself starts with dashes, pass it as
  `--review-selector=--base main` or similar
- then move the card and let the script generate the short Russian comment with
  verdict and key issue

### Simplification

- before moving into `Simplification`, run `$code-simplification`
- persist:
  - outcome
  - short summary
- required flags:
  - `--simplification-outcome "..."`
  - `--simplification-summary "..."`
- only move the card if the simplification pass actually started
- generated comment shape:
  - `Упростил: ...`

### Auto-commit

- before moving into `Auto-commit`, run `$auto-commit`
- persist:
  - short SHA and subject, or blocked reason
- required flags:
  - `--commit-sha abc123 --commit-subject "fix: ..."`
  - or `--commit-blocked-reason "..."`
- generated comment shape:
  - `Коммит: abc123 ...`
  - or `Коммит блокирован: ...`

### Done

- move only after the lane-specific work is complete
- move only after `Review`, `Simplification`, and `Auto-commit` evidence exists
- required flags:
  - `--done-summary "..."`
- generated comment shape:
  - `Готово: ...`

## Script Hooks

Use:

- `scripts/create_trello_board.js`
- `scripts/export_package_to_trello.js`
- `scripts/move_trello_card.js`

`move_trello_card.js` is responsible for:

- validating required lane evidence
- generating the short Russian Trello comment from that evidence
- moving the remote Trello card
- posting the Russian comment
- writing a two-phase move journal in `moves.jsonl`
- reconciling unfinished pending moves on rerun
- rolling back the move if the comment step fails
- moving the local Markdown card between lane directories
- updating `kanban.json`
- appending `trello/moves.jsonl`
