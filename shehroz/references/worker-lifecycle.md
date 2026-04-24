# Worker Lifecycle Reference

Use this for visible worker spawn, diagnostics, health interpretation, and
periodic observation.

## Contents

- Lifecycle
- Placement rules
- Minimal visible spawn pattern
- Diagnostics checklist
- Observability contract
- Health taxonomy
- Startup blocker taxonomy
- Status patterns in pane output

## Lifecycle

Treat every worker run as:

```text
spawn -> diagnostics -> submit check or inline-prompt watch -> 30s startup watch -> periodic observation
```

Spawn is not complete until diagnostics pass, any interactive task packet is
actually submitted, and the post-submit watch shows real worker activity.

## Placement Rules

- visible local workers belong in the same tab as the active manager control
  pane
- before a fresh split, run the pane census and prefer truthful reuse over
  automatic pane creation
- workers stack vertically in the right column
- protected panes must not be repurposed or closed, but they do not by
  themselves justify switching the worker to a new tab
- only create a dedicated workbench tab when the operator explicitly asks for
  separate-tab isolation, or when a same-tab conflict is real enough that the
  manager pauses and gets approval first
- after the first right split, additional workers should split from the right
  column pane with `--bottom`
- a worker in another tab does not satisfy a visible-worker request unless
  the operator explicitly chose that other tab before spawn

## Pre-Spawn Pane Census And Reuse Gate

Before splitting a new visible worker pane, inspect the already-open panes in
the active execution tab and classify them.

Classification set:
- `live worker` -> active work or uncertain state; do not reuse or close blindly
- `reusable idle codex` -> idle Codex prompt with no live-work risk and matching task shape
- `reusable shell` -> plain shell pane that can truthfully host the next worker launch
- `manual-close candidate` -> stopped or dropped pane with no active work, but closure still needs saved reasoning
- `protected` -> unrelated pane or history surface the manager should not repurpose

For repeated lessons in the same manager/worker dialogue, strengthen
`reusable idle codex` like this:
- same named role still fits the next lesson
- same workdir still fits
- prompt is idle and not blocked by reminder/interstitial state
- pane history is part of the lesson value rather than contamination

Decision rule:
1. If one pane is a truthful reuse candidate, reuse it instead of creating a new pane.
2. If no pane is safely reusable, spawn a new pane in the right column.
3. If stale stopped panes are accumulating, save diagnostics and either close
   them with an explicit reason or surface them as manual-close candidates
   before adding more pane sprawl.

Bias:
- for repeated lesson work, prefer `reuse existing named pane` over
  `spawn new pane`
- spawn a fresh pane only when reuse would hide the transport truth or would
  mix the next probe with obviously dirty state

Minimum census checks:
- `wezterm cli list --format json` for pane id, tab id, title, cwd, and position
- `wezterm cli get-text --pane-id <id> --start-line -40` for latest state
- manager interpretation: `live | idle reusable | stopped-close-candidate | protected`

## Workbench Tab Isolation

Use this only when the operator explicitly wants another tab, or after the
manager surfaced a real same-tab conflict and got approval.

Rule:
- do not split, kill, or repurpose panes in the protected tab once that
  separate-tab choice was made
- spawn a new tab in the same window
- verify the new `pane_id` and `tab_id`
- do all new worker splits in that workbench tab

Minimal workbench pattern:

```bash
WORKBENCH_PANE="$(wezterm cli spawn --window-id "$WINDOW_ID" --cwd "$WORKDIR" -- bash -lc 'printf "WORKBENCH READY pane=%s cwd=%s\n" "$WEZTERM_PANE" "$PWD"; exec bash -l')"
wezterm cli get-text --pane-id "$WORKBENCH_PANE" --start-line -20
```

Then treat `WORKBENCH_PANE` as the manager pane for same-tab visible worker
spawns.

## Minimal Visible Spawn Pattern

```bash
MANAGER_PANE="${WEZTERM_PANE:?current pane required}"
FIRST_WORKER="$(wezterm cli split-pane --pane-id "$MANAGER_PANE" --right --percent 50 -- bash -lc 'printf "WORKER READY pane=%s\n" "$WEZTERM_PANE"; exec bash')"
WORKER_ID="$FIRST_WORKER"
wezterm cli get-text --pane-id "$WORKER_ID" --start-line -40 | tail -20
```

Additional stacked worker:

```bash
NEXT_WORKER="$(wezterm cli split-pane --bottom --pane-id "$RIGHT_COLUMN_PANE" --percent 40 -- bash -lc 'printf "WORKER READY pane=%s\n" "$WEZTERM_PANE"; exec bash')"
```

## Direct Launch With Initial Prompt

For a tiny self-contained visible worker run, Shehroz may launch interactive
Codex with the prompt already attached:

```bash
WORKER_ID="$(wezterm cli split-pane --pane-id "$MANAGER_PANE" --right --percent 50 -- bash -lc 'exec codex_wp "Reply with only the number 3."' )"
sleep 30
wezterm cli get-text --pane-id "$WORKER_ID" --start-line -60 | tail -40
```

Rules:
- `codex_wp "prompt"` is interactive and is valid for a visible worker pane
- `codex_wp exec "prompt"` is headless and is not the visible-worker shortcut
- use this shortcut only for tiny literal prompts or smoke probes
- if Stop-hook review is required, install the temporary repo-local hook before
  launching `codex_wp`, because the initial prompt is submitted at process
  start
- for developer, QA, code-changing, or ambiguous work, prefer the full
  task-first 6-field packet flow

## Diagnostics Checklist

Immediately after `split-pane`:

1. capture the returned `pane_id`
2. confirm the pane is in the intended `tab_id`
3. confirm the pane is in the right-side worker area
4. inspect pane text to verify the launcher or contract actually started

If workbench-tab isolation is active, confirm against the workbench `tab_id`,
not the original protected tab.

Minimal diagnostic pattern:

```bash
wezterm cli list --format json | python3 - "$WORKER_ID" <<'PY'
import json, sys
worker_id = int(sys.argv[1])
for pane in json.load(sys.stdin):
    if pane["pane_id"] == worker_id:
        print(f"pane={pane['pane_id']} tab={pane['tab_id']} left={pane['left_col']} top={pane['top_row']} title={pane['title']}")
        break
PY

wezterm cli get-text --pane-id "$WORKER_ID" --start-line -40 | tail -20
```

## Submit Check For Interactive Codex Workers

If the pane runs interactive `codex_wp` and the manager sends a contract or
prompt:

1. send the text
2. send Enter explicitly
3. wait `30s`
4. read the pane again before claiming the worker started

Minimal pattern:

```bash
wezterm cli send-text --pane-id "$WORKER_ID" --no-paste "$PROMPT_TEXT"
sleep 0.3
wezterm cli send-text --pane-id "$WORKER_ID" --no-paste $'\x0d'
sleep 30
wezterm cli get-text --pane-id "$WORKER_ID" --start-line -60 | tail -40
```

Hard rule:
- visible prompt text without Enter is not a started worker
- a pasted contract that still sits at the prompt is an incomplete spawn
- if the pane stays idle through the `30s` watch, treat startup as failed or
  not yet submitted, not healthy
- if the pane was launched as `codex_wp "<prompt>"`, the prompt is already
  submitted and the manager should start the `30s` watch immediately after
  spawn instead of sending another Enter

## Pane Closure Safeguard

The manager must not close or kill a pane if there may still be live work.

Before any planned pane closure:

1. run full diagnostics
2. save the pane state to an artifact path
3. record why closure is being considered
4. close only if the pane is truly done, failed startup, or the operator
   explicitly wants closure

Minimum saved diagnostics:
- `pane_id`, `tab_id`, position, size, title, and cwd
- latest pane text snapshot
- current manager interpretation: done | blocked | failed startup | returned to shell
- reason for closure

If there is doubt, do not close the pane.

## Observability Contract

State this before the run starts:

```text
FIRST SNAPSHOT: immediately after spawn
POST-SUBMIT WATCH: 30s after Enter, or 30s after spawn for `codex_wp "<prompt>"`
NEXT SNAPSHOT: <N seconds>
HEARTBEAT CADENCE: <interval or manual cadence>
STOP CONDITIONS: healthy | blocked | done | failed startup | operator stop
```

Defaults:
- remote long-running implementation: `60s` cadence
- `non-stop observation`: at least `100` cycles at `60s` unless the operator
  changes it

Preferred order:
- first `wezterm cli get-text --pane-id <id> --start-line -40`
- then `bin/mw-heartbeat <id> <interval> <beats>` or repeated snapshots

## Health Taxonomy

| Health state | Meaning | Action |
|--------------|---------|--------|
| Visible but wrong tab | worker exists, but not where the operator expected | repair or respawn |
| Pane exists but launcher failed | pane opened, command did not start | inspect startup text and fix launcher |
| Auth failed | runtime cannot do the requested work | surface auth issue clearly |
| Idle | worker is alive and waiting | send next task or keep observing until closure is clearly justified |
| Blocked | worker waits on approval, clarification, or dependency | report the block reason explicitly |
| Running but unhealthy | activity exists, but progress quality is poor or unstable | preserve artifacts and diagnose |
| Returned to shell | launcher finished and the pane is now a plain shell | confirm via logs or artifacts |

## Startup Blocker Taxonomy

| Blocker | Meaning | Action |
|---------|---------|--------|
| Wrong tab | worker exists, but not in expected visible tab | respawn or repair placement |
| Dead launcher | pane opened, launcher exited or never started | fix launcher before retry |
| Not submitted | contract text is visible, but Enter was not sent | submit it, then restart the `30s` watch |
| Missing command | runtime command is unavailable on `PATH` | install, adjust `PATH`, or change launcher |
| Auth failure | required login or token is missing or expired | repair auth before relaunch |
| Env missing | required runtime variable is absent | inject env safely and retry |
| Wrong repo | worker started in the wrong repo or workdir | correct `WORKDIR` and relaunch |

## Status Patterns In Pane Output

| State | Pattern | Action |
|-------|---------|--------|
| Working | `Working (Xs)` or equivalent active status line | continue observation |
| Done | `completed`, `finished`, or equivalent final status | collect results |
| Error | real `ERROR` or `FATAL` in the status area | diagnose or relaunch |
| Idle | prompt visible, no active work marker | send next task |
| Stuck | same content for repeated checks | investigate before continuing |
| Not submitted | prompt shows pasted task text with no runtime movement | send Enter and restart the `30s` watch |

When a pane has already returned to a plain shell prompt, prefer terminal logs
and artifacts over heartbeat-only interpretation.

## Cron-Observed Long Worker Run Pattern

For 1-3 hour non-stop implementation runs, the manager should combine a
same-tab visible Tahir worker with recurring cron observation in Claude Code.

### Setup checklist

1. **Prepare task contract** — write 6-field packet to run-root `prompts/task.txt`
2. **Spawn Tahir** — `wezterm cli split-pane --right --percent 50` from manager
3. **Launch `codex_wp`** with inline prompt pointing at the task file, send Enter
4. **30s post-submit watch** — verify worker actually started reading kanban/repo
5. **Create CronCreate job** — every 15 min (`7,22,37,52 * * * *` or similar)
6. **Set tab title** — reflect project and worker state

### Cron observer contract

Each cron tick must report:

```text
PROGRESS BAR: [##---] X/5 done
CURRENT CARD: <id> <status> <title>
WORKER STATE: ACTIVE | IDLE | GONE
SESSION JSONL: <size> <last_event_type> <last_event_time>
CHANGES THIS TICK: <what transitioned, what file changed, test results>
```

Rules:
- Do NOT send Mattermost on routine ticks
- DO report explicitly when: all cards done, worker gone with cards remaining,
  or worker idle for 2+ consecutive ticks
- Prefer built-in CronCreate over codex-cron when in Claude Code harness
- Use `7,22,37,52` off-minute pattern to avoid hitting the scheduler at :00/:15/:30/:45

### Manager decision on idle/stop

When the cron observer reports worker IDLE or GONE:
1. Read worker pane tail for last action
2. Read kanban.json for current card state
3. If cards remain and next step is clear -> spawn follow-up in same pane or new pane
4. If all cards done -> cancel cron, run final verification, report to operator
5. If blocked with unclear path -> escalate to operator via `$notify-me`

### Durable skill update rule

After running a cron-observed long worker session, update this reference
(`worker-lifecycle.md`) with any new stable pattern discovered during the run.
Also check if `$talha` or `$saad` sibling skills need corresponding updates.
