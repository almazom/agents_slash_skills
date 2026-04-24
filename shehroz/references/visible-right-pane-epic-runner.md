# Visible Right-Pane Epic Runner

Use this reference when:

- an epic bash/script runner is launched visibly in the worker pane on the
  right
- the manager stays on the left in the same tab
- the run should continue non-stop until Trello truth says otherwise

## Canonical visible shape

- left pane: manager
- right pane: epic runner worker
- small pane under worker: observer

Do not treat the observer as optional. For visible epic runs, the start is only
truthful when both surfaces exist:

1. the runner is actually running in the right worker pane
2. the observer is armed and can wake the manager truthfully

## Required action chain

1. launch the runner in the right worker pane
2. arm `$observer` immediately with `observer-under-worker`
3. keep the wakeup message short and action-first
4. require `inject -> submit -> 30s watch` for manager wakeup proof
5. if the manager will not babysit the tab, add a recurring watcher on the
   execution host as backup

## Preferred watcher stack

- primary surface:
  `$HOME/.agents/skills/observer/scripts/observer-under-worker`
- wakeup proof:
  `$HOME/.agents/skills/observer/scripts/manager-note-to-manager`
- recurring backup when needed:
  `$HOME/.agents/skills/observer/scripts/manager-pane-idle-wakeup`

## Worked example

Validated on `2026-04-20` for `cloude_screenshot_swift`, EPIC `#9`:

- manager pane: `35` on the left
- worker pane: `36` on the right
- observer pane: `72` under the worker
- runner label:
  `shehroz-cloude-screenshot-swift-20260420T053723Z-pane36-live`

Observer arming shape:

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

Wakeup proof shape:

```bash
$HOME/.agents/skills/observer/scripts/manager-note-to-manager \
  --manager-pane 35 \
  --message 'EPIC #9 pane 36 idle. Review SSOT, decide next, continue to Done.' \
  --watch-seconds 30
```

Confidence rule:

- do not call the visible runner coverage `95%+` from process-start proof alone
- prefer strict helper verdict `startup_proved`
- cross-check one live pane snapshot before reporting the run as safely under
  observation
