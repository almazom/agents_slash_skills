# Paired Skill Routing

Use this reference when Shehroz must decide which paired skill to load around
the manager layer and where that paired skill should actually run across Mac
and `pets`.

## Manager Rule

Shehroz stays the routing and decision layer.

The paired skill owns the specialist truth surface:

- `$pane-to-pane-communication` owns pane delivery truth
- `$trello` owns board/card/list/label/comment mechanics
- `$epic-runner-script` owns runner-anchor, launcher, and epic-label gate

## Quick Matrix

| Situation | Load | Run where | Why |
|------|------|------|------|
| Worker note into another pane, manager wakeup, same-tab relay, current-pane submit, PING/PONG | `$pane-to-pane-communication` | on the host that owns the target pane | `pane_id` and `wezterm cli` are host-local |
| Board readiness, epic planning, card CRUD, labels, comments, lane moves | `$trello` | on either host with Trello CLI access | Trello API is global, but manager memory canon stays on `pets` |
| Runner card, launcher script, epic-label stop gate, runner sync | `$epic-runner-script` + `$trello` | launcher on repo owner host; board truth on `pets` | runner contract spans repo plus board |
| Visible right-pane epic runner with observer and wakeup proof | `$epic-runner-script` + `$trello` + `$observer` + `$pane-to-pane-communication` | runner and pane delivery on pane owner host; board/memory on `pets` | visible run needs both board truth and pane truth |

## Host Truth

### `$pane-to-pane-communication`

If the target pane lives on Mac, run the actual pane delivery on Mac:

```bash
ssh al@100.112.49.58 "p2p --pane-id 34 --submit 'Reply with exactly one line: OK.'"
```

If the target pane lives on `pets`, run the pane delivery on `pets`:

```bash
ssh pets@100.105.56.68 "p2p --pane-id 34 --submit 'Reply with exactly one line: OK.'"
```

Rule:

- do not reuse a Mac `pane_id` directly on `pets`
- do not reuse a `pets` `pane_id` directly on Mac
- the pane owner host is the truthful executor of `wezterm cli` or `p2p`

### `$trello`

Trello board operations can be driven from either host if the CLI is
available, but Shehroz still keeps durable manager records on `pets`.

Examples:

```bash
trello list-boards
trello list-lists <board_id> --format json
trello card-info <card_id> --format json
```

Memory rule:

- Trello comments and board moves are board truth
- manager `.MEMORY/` artifacts still land on
  `/home/pets/TOOLS/manager_wezterm_cli/.MEMORY/`

### `$epic-runner-script`

Use this when the work is specifically about:

- the runner anchor card in `Epics Runners`
- the epic-specific launcher under `automation/headless/`
- the epic-label completion gate
- visible right-pane runner discipline

Default pairing:

- add `$trello` for board/card/list truth
- add `$observer` for a visible same-tab runner
- add `$pane-to-pane-communication` when wakeup/submit truth into live panes
  matters

## Stable Update Sync Rule

When Shehroz learns a stable cross-skill lesson:

1. update `shehroz`
2. update the paired skill too if its own contract changed
3. sync every changed skill to the peer host in the same turn
4. verify by checksum or content grep

Current skill homes:

- Mac: `/Users/al/.agents/skills/`
- `pets`: `/home/pets/.agents/skills/`

Suggested commands:

```bash
bash ~/.agents/skills/shehroz/scripts/sync-skill.sh
bash ~/.agents/skills/pane-to-pane-communication/scripts/sync-skill.sh
```

If only `shehroz` changed, sync only `shehroz`.

If the paired skill changed too, sync both before calling the manager routing
stable.
