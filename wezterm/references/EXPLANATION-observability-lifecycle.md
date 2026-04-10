# EXPLANATION — Observability Lifecycle

Why spawn requires diagnostics and ongoing observation.

## Spawn Success ≠ Pane Exists

`pane exists` does **not** mean `spawn succeeded`. Successful spawn requires:

1. correct pane created
2. correct tab placement
3. intended launcher started
4. first snapshot confirms activity or healthy idle state

## Mandatory Post-Spawn Diagnostics

After any visible worker spawn, verify all four conditions:

```bash
WORKER_ID=$(wezterm cli split-pane --pane-id "${WEZTERM_PANE:?}" --right --percent 50 -- bash -lc 'exec bash')
wezterm cli list --format json | python3 - "$WORKER_ID" <<'PY'
import json, sys
worker_id = int(sys.argv[1])
for pane in json.load(sys.stdin):
    if pane["pane_id"] == worker_id:
        print(f"pane={pane['pane_id']} tab={pane['tab_id']} left={pane['left_col']} top={pane['top_row']} title={pane['title']}")
        break
PY
wezterm cli get-text --pane-id "$WORKER_ID" --start-line -30 | tail -20
```

If the worker landed in the wrong tab or the launcher did not start, **respawn or repair** — do not call it successful.

## Periodic Observability

After diagnostics, keep observing:

- immediate startup snapshot
- then heartbeat or repeated `get-text` polling
- continue until healthy, blocked, or done

**Do not stop at pane creation.** A pane that exists but is idle, crashed, or running the wrong command is a failed spawn, not a successful one.

## Why This Matters

The whole point of the observer+worker pattern is that the observer stays engaged. A "fire and forget" spawn with no follow-up check is a common failure mode — the worker might have started in the wrong tab, the command might have failed immediately, or the pane might be sitting at a login prompt instead of running the intended process.
