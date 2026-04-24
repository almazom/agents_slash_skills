# Runner-To-Manager Communication Contract

Use this reference when a visible epic runner must know how to find the manager
pane, how to use `p2p`, and which events must wake Shehroz.

## Topology truth

- standard visible same-tab topology is:
  `left manager -> right runner worker -> mini observer under worker`
- in that standard topology, the manager pane is expected to be both:
  - the left pane
  - the lowest `pane_id` in the current tab
- if those two signals disagree, treat the layout as topology drift and
  re-resolve with live pane inspection before trusting the route

## Short inspection forms

- use `p2p --help` when the runner needs the current CLI surface
- use `p2p --ids` for the shortest current-tab pane census
- use `p2p --where` when the runner wants a human-readable layout summary
- use `p2p tail --pane-id "$TARGET_PANE" --lines 40` when delivery proof or
  recent transcript context is needed

Example manager-pane resolution:

```bash
MANAGER_PANE_ID="$(
  p2p --ids | python3 -c 'import json,sys; print(min(json.load(sys.stdin)["pane_ids"]))'
)"
```

## Delivery contract

- prefer the local `p2p` helper over ad hoc raw `send-text` sequences
- standard submission form:
  `p2p --pane-id "$MANAGER_PANE_ID" --submit '...message...'`
- major runner events that should wake the manager pane are:
  - blocker or decision-needed state
  - major scope or contract change
  - final epic completion or idle boundary
- per-card `Done` still sends Mattermost-only `$notify-me`; do not replace
  that with pane messaging
- final epic completion should do both:
  - Mattermost-only `$notify-me`
  - manager-pane wakeup through `p2p`

## Final wakeup shape

The final manager wakeup should explicitly ask Shehroz to review the result,
notify the operator, and continue momentum into the next epic.

Preferred shape:

```bash
p2p --pane-id "$MANAGER_PANE_ID" --submit \
  'Shehroz, runner pane <worker-pane-id> idle. EPIC #N finished. Review SSOT/results, notify Almaz, and if the result is acceptable, decide the next step yourself and start the next epic runner without waiting.'
```

## Runner card disclosure rule

- the paired Trello runner card should expose the exact launch command with an
  explicit hook budget
- preferred example:
  `HOOK_TIMES=80 /Users/al/zoo_apps/manager_window/run-shehroz-headless.sh`
- keep that explicit `HOOK_TIMES=<n>` even if the launcher has its own
  internal default; the card should still show the operator-facing budget
