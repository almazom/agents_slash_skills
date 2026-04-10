# Troubleshooting Reference

Use this when a worker launch or observation path does not behave as expected.

## Contents

- Common failures
- Observation-specific issues
- Long prompt fragility
- Raw `codex_wp exec` launch problems

## Common Failures

### Wrong tab

Symptom:
- the worker exists, but not in the current visible tab

Action:
- do not count the spawn as successful
- respawn or repair placement in the current tab

### Dead launcher

Symptom:
- pane opened, but the intended command did not start

Action:
- inspect the first pane snapshot
- fix the launcher before retrying

### Missing command

Symptom:
- the runtime command is unavailable on `PATH`

Action:
- install it, fix `PATH`, or change the launcher

### Auth failure

Symptom:
- runtime cannot access the required service or review path

Action:
- repair auth before relaunching

### Env missing

Symptom:
- required runtime variable is absent

Action:
- inject env safely without copying raw secrets into prompts

### Wrong repo

Symptom:
- worker starts in the wrong repo or workdir

Action:
- correct `WORKDIR` and relaunch

## Observation-Specific Issues

### Heartbeat shows false error

Cause:
- code scrollback contains identifiers such as `failed` or `error`, but the
  actual worker status area is healthy

Action:
- read the last status lines, not broad historical scrollback, for state
  detection
- prefer `bin/mw-heartbeat` or targeted `get-text --start-line -40`

### Text appears but is not submitted

Cause:
- text was sent, but Enter was not sent separately

Action:

```bash
wezterm cli send-text --pane-id "$WORKER_ID" --no-paste "your prompt"
sleep 0.3
wezterm cli send-text --pane-id "$WORKER_ID" --no-paste $'\x0d'
```

### Worker not responding

Checks:
- confirm the pane still exists
- inspect the latest snapshot
- check whether the launcher already returned to a shell prompt
- look for log movement before assuming the worker is stuck

### Cannot find the worker pane

Checks:
- `wezterm cli list --format json`
- current `tab_id`
- pane title and coordinates

If the pane is gone, treat that as a failed or completed run, not a visible
healthy worker.

## Long Prompt Fragility

If a multi-line prompt is brittle through `send-text`:
- stop typing the full contract inline
- use a prompt file plus launcher script
- keep the terminal log as the postmortem surface

## Raw `codex_wp exec` Launch Problems

If a raw launch fails on wrapper flag order or quoting:
- rerun `codex_wp exec --help` in the same runtime context
- rebuild the launcher from the confirmed help output
- avoid guessing the wrapper syntax from memory
