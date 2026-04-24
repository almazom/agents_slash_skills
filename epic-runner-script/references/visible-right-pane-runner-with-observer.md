# Visible Right-Pane Runner With Observer

Use this reference when an epic script runner is launched visibly in the right
worker pane instead of as a fully headless run.

## Rule

- visible epic runner on the right always means `$observer` too
- do not leave a visible runner alone without an observer surface
- default same-tab shape is:
  `left manager -> right runner worker -> mini observer under worker`
- in that standard same-tab shape, the manager pane is expected to be both:
  - the left pane
  - the lowest `pane_id` in the current tab
- if the runner cannot confirm that topology, stop treating the layout as
  trusted and re-resolve the panes before leaving the run unattended

## Why

The runner process alone does not prove that the manager will be woken when the
worker pane becomes idle, gone, or suspiciously quiet. The observer closes that
gap.

## Required launch chain

1. start the runner in the right worker pane
2. arm `observer-under-worker` in the same action chain
3. resolve the manager pane in the same tab; default rule:
   `manager pane id = min(current-tab pane ids)`
4. prefer `p2p` for runner-to-manager delivery:
   - `p2p --ids`
   - `p2p --pane-id "$MANAGER_PANE_ID" --submit '...'`
5. prove manager wakeup with `inject -> submit -> 30s watch`
6. teach the runner to wake the manager on major events:
   - blocker or decision-needed state
   - major scope or contract change
   - final epic completion or idle boundary
7. make the final wakeup ask Shehroz to review SSOT, notify the operator, and
   continue to the next epic without waiting when the verdict is good enough
8. add a recurring backup watcher only when the manager should stop babysitting

## Worked example

Validated on `2026-04-20` for `cloude_screenshot_swift`, EPIC `#9`:

- left manager pane: `35`
- right runner pane: `36`
- observer pane under worker: `72`

Observer arming command:

```bash
$HOME/.agents/skills/observer/scripts/observer-under-worker \
  --manager-pane 35 \
  --worker-pane 36 \
  --worker-label EPIC9 \
  --run-root "$RUN_ROOT/observer-pane" \
  --every 300 \
  --max-cycles 100 \
  --idle-streak 1 \
  --watch-seconds 30 \
  --submit-retries 3 \
  --notify-mattermost \
  --message 'EPIC #9 pane 36 idle. Review SSOT, decide next, continue to Done.'
```

Wakeup proof standard:

- prefer `manager-note-to-manager`
- prefer verdict `startup_proved`
- do one live pane cross-check before calling the visible runner safely covered

Example final wakeup:

```bash
p2p --pane-id "$MANAGER_PANE_ID" --submit \
  'Shehroz, runner pane 36 idle. EPIC #9 finished. Review SSOT/results, notify Almaz, and if the result is acceptable, decide the next step yourself and start the next epic runner without waiting.'
```
