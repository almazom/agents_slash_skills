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
spawn -> diagnostics -> startup snapshot -> periodic observation
```

Spawn is not complete until diagnostics and the first snapshot pass.

## Placement Rules

- visible local workers belong in the same tab as the manager pane
- workers stack vertically in the right column
- after the first right split, additional workers should split from the right
  column pane with `--bottom`
- a worker in another tab does not satisfy a visible-worker request

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

## Diagnostics Checklist

Immediately after `split-pane`:

1. capture the returned `pane_id`
2. confirm the pane is in the intended `tab_id`
3. confirm the pane is in the right-side worker area
4. inspect pane text to verify the launcher or contract actually started

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

## Observability Contract

State this before the run starts:

```text
FIRST SNAPSHOT: immediately after spawn
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
| Idle | worker is alive and waiting | send next task or close deliberately |
| Blocked | worker waits on approval, clarification, or dependency | report the block reason explicitly |
| Running but unhealthy | activity exists, but progress quality is poor or unstable | preserve artifacts and diagnose |
| Returned to shell | launcher finished and the pane is now a plain shell | confirm via logs or artifacts |

## Startup Blocker Taxonomy

| Blocker | Meaning | Action |
|---------|---------|--------|
| Wrong tab | worker exists, but not in expected visible tab | respawn or repair placement |
| Dead launcher | pane opened, launcher exited or never started | fix launcher before retry |
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

When a pane has already returned to a plain shell prompt, prefer terminal logs
and artifacts over heartbeat-only interpretation.
