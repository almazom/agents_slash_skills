# Troubleshooting Reference

Use this when a worker launch or observation path does not behave as expected.

## Contents

- Common failures
- Observation-specific issues
- Long prompt fragility
- Raw `codex_wp exec` launch problems

## Common Failures

### Accidentally operating in a protected tab

Symptom:
- the current tab contains unrelated live work the operator said not to touch

Action:
- stop before splitting, killing, or repurposing panes there
- create a separate workbench tab in the same window
- continue only inside that workbench tab

### Wrong tab

Symptom:
- the worker exists, but not in the current visible tab

Action:
- do not count the spawn as successful
- respawn or repair placement in the intended execution tab

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

### Before closing a pane

Rule:
- do not close a pane just because it looks quiet
- if closure is being considered, save full diagnostics first
- if the pane might still contain live work, leave it open

### Too many idle dropped panes are accumulating

Symptom:
- every new worker run creates another pane while older stopped panes remain open

Action:
- stop before splitting again
- run a pane census on the active execution tab
- classify each old pane as `reusable`, `manual-close candidate`, or `protected`
- if a pane is safely reusable, route the next worker there instead of opening another pane
- if a pane is only a close candidate, save diagnostics and keep the closure reason explicit

Checks:
- latest pane text is saved
- pane metadata is saved
- the manager has a written reason for closure
- done vs blocked vs failed startup is distinguished clearly

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
sleep 30
wezterm cli get-text --pane-id "$WORKER_ID" --start-line -60 | tail -40
```

Rule:
- do not count the worker as started until the `30s` post-submit watch shows
  real runtime movement
- if the pane still looks idle after that watch, treat the spawn as incomplete
  or failed startup

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

### Multi-line contract sent to shell worker fails

**Symptom:**
- Each line of the contract produces shell errors like:
  ```
  zsh: command not found: REFERENCES:
  zsh: command not found: STOP
  cd: too many arguments
  ```

**Cause:**
- The 6-field task contract is designed for `codex` workers, not shell workers
- Shell workers interpret each line as a separate shell command

**Solutions:**
1. **Use a codex worker** (recommended for contracts):
   ```bash
   mw-start <worker_id>  # Launch codex_wp first
   mw-send-file <worker_id> /path/to/contract.txt
   ```

2. **Use mw-send-file for shell workers** (sends as heredoc):
   ```bash
   mw-send-file <worker_id> /path/to/contract.txt
   ```

3. **Validate contract before sending:**
   ```bash
   mw-check-contract /path/to/contract.txt
   ```

### Contract validation fails

**Symptom:**
- `mw-check-contract` reports missing required fields

**Action:**
- Fill in all 6 required fields: WORKDIR, CONTEXT, PROBLEM, TASK, DONE, REFERENCES
- Add STOP directive for isolated tasks
- See `references/task-contract.md` for field definitions

## Raw `codex_wp exec` Launch Problems

If a raw launch fails on wrapper flag order or quoting:
- rerun `codex_wp exec --help` in the same runtime context
- rebuild the launcher from the confirmed help output
- avoid guessing the wrapper syntax from memory
