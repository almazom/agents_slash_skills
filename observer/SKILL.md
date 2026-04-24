---
name: observer
description: Observe WezTerm worker runs through mini-pane heartbeats, sleep-loop watchers, cron-friendly checks, and strict manager wakeup delivery. Use when Codex needs to (1) create a small observer pane under a visible worker, (2) watch `active | idle | stuck | gone` state over time, (3) wake a manager or Shehroz pane when a worker returns to idle, (4) prove `inject -> submit -> 30s watch` for manager wakeups, or (5) run recurring pane/process heartbeat checks through sleep loops or cron.
---

# Observer

Use this skill for observation surfaces around visible workers. This skill is
about heartbeat truth, idle detection, stuck suspicion, and waking the manager
reliably. It is not the worker itself.

## Choose a Surface

- `mini-pane under worker`:
  default for same-tab visible workers; keep a small observer pane below the
  worker pane in the right column
- `sleep loop`:
  one local shell loop for `60s` cadence heartbeats
- `cron`:
  recurring external checks when the manager should not babysit the pane
- `one-shot inspect`:
  classify current pane state once without starting a durable watcher

Default rules:

1. Default cadence is `60s`.
2. Default minimum loop budget is `100` cycles unless the operator overrides it.
3. For same-tab visible workers, prefer a small pane under the worker, not a new tab.
4. Observe both surfaces:
   worker truth and manager wakeup delivery truth.
5. A manager wakeup is not done at injection alone.
   Require `inject -> submit -> 30s watch`.
6. Report `startup_proved` only when the manager pane moved after submit and the raw wakeup text is not still stuck in the last prompt line.
7. One missing wrapper tee heartbeat does not by itself mean idle.
   `iter-1 -> none -> iter-2` rollover is still `PROGRESS` when pane and tty remain alive.
8. When the observed worker is a visible epic runner and the worker returns to
   `IDLE` or `GONE`, do not treat the pane transition as the final operator
   outcome by itself; the manager must inspect the epic gate and send one loud
   explicit epic-runner-done notification before closing observation.

## Core States

- `PROGRESS`: worker pane, tty, tee path, or JSONL size changed since the last heartbeat
- `IDLE`: worker pane shows an idle Codex prompt or a shell prompt
- `QUIET`: no fresh changes yet, but not enough proof to call it idle
- `PROBABLE_STUCK`: unchanged heartbeats reached the stuck threshold
- `GONE`: target pane no longer exists
- `WAKEUP_PROVED`: manager wakeup submit succeeded and the `30s` watch saw manager-side movement
- `WAKEUP_DEGRADED`: submit was attempted but startup proof was weak
- `WAKEUP_FAILED`: inject or submit boundary failed

## Default Scripts

- `$HOME/.agents/skills/observer/scripts/observer-under-worker`
  Spawn a small bottom observer pane under a visible worker pane.
- `$HOME/.agents/skills/observer/scripts/manager-pane-idle-wakeup`
  Run the sleep loop, write heartbeats, and wake the manager on `IDLE` or `GONE`.
- `$HOME/.agents/skills/observer/scripts/manager-note-to-manager`
  Send a wakeup note into the manager pane, submit it, and perform the required `30s` watch.

## Quick Start

Mini-pane under worker:

```bash
$HOME/.agents/skills/observer/scripts/observer-under-worker \
  --manager-pane 0 \
  --worker-pane 31 \
  --worker-label Tahir \
  --run-root /abs/run-root \
  --message 'Tahir fix pane 31 idle. Inspect SSOT, decide next, do not stay idle.'
```

This is now the canonical visible layout.

Direct sleep-loop watcher:

```bash
$HOME/.agents/skills/observer/scripts/manager-pane-idle-wakeup \
  --manager-pane 0 \
  --worker-pane 31 \
  --worker-label Tahir \
  --run-root /abs/run-root \
  --message 'Tahir fix pane 31 idle. Inspect SSOT, decide next, do not stay idle.'
```

One-shot manager wakeup proof:

```bash
$HOME/.agents/skills/observer/scripts/manager-note-to-manager \
  --manager-pane 0 \
  --message 'Tahir fix pane 31 idle. Inspect SSOT, decide next, do not stay idle.' \
  --watch-seconds 30
```

## Cron Use

Use this skill together with `$cron-skill` or the built-in cron surface when
the watcher should run outside the visible tab.

Cron rules:

1. Prefer a neutral manager workdir for cron observers when the worker repo has a live repo-local Stop hook.
2. Cron heartbeats should inspect the pane, tty, and session/log growth when possible.
3. Cron should not claim `awake` or `delivered` unless the wakeup path still enforces `submit -> 30s watch`.

## Read This For

| Need | Read |
|------|------|
| Default observation surfaces and wakeup proof rules | `references/observer-modes.md` |

## Notes

- Keep the wakeup message short and action-first.
- Prefer `Tahir pane <id> idle. Inspect SSOT, decide next, do not stay idle.`
- Keep manager wakeup proof explicit in logs and result files.
- For visible epic runners, prefer a final operator-facing note that is loud at
  a glance: `EPIC #N DONE` plus the simplified `Done | In Progress | Remaining`
  bar.
