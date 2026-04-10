# HOWTO — Visible Worker (Same-Tab GUI)

Spawn, diagnose, and manage a worker pane visible in the current WezTerm tab.

## Spawn Visible Worker

```bash
MANAGER_PANE="${WEZTERM_PANE:?current pane required}"
WORKER_ID=$(wezterm cli split-pane --pane-id "$MANAGER_PANE" --right --percent 50 -- bash -lc 'echo "WORKER READY pane=$WEZTERM_PANE"; exec bash')
printf 'worker=%s\n' "$WORKER_ID"
```

## Spawn Additional Worker in Right Column

```bash
RIGHT_PANE="<existing right-column pane id>"
WORKER_ID=$(wezterm cli split-pane --bottom --pane-id "$RIGHT_PANE" --percent 40 -- bash -lc 'echo "WORKER READY pane=$WEZTERM_PANE"; exec bash')
printf 'worker=%s\n' "$WORKER_ID"
```

## Diagnose Worker Pane

```bash
WORKER_ID="<pane id>"
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

## Basic Observer Loop

```bash
# 1. Resolve worker pane (adjacent to the right)
WORKER=$(wezterm cli get-pane-direction Right)

# 2. Read its content
CONTENT=$(wezterm cli get-text --pane-id "$WORKER")

# 3. Analyze and react
if echo "$CONTENT" | grep -q "ERROR"; then
  wezterm cli send-text --pane-id "$WORKER" --no-paste $'\x03'   # Ctrl+C
  wezterm cli send-text --pane-id "$WORKER" --no-paste "fix-command"$'\x0d'
fi
```

## Send Command and Verify

```bash
WORKER=$(wezterm cli get-pane-direction Right)
wezterm cli send-text --pane-id "$WORKER" --no-paste "git status"$'\x0d'
sleep 1

RESULT=$(wezterm cli get-text --pane-id "$WORKER")
if echo "$RESULT" | grep -q "nothing to commit"; then
  echo "Clean working tree"
elif echo "$RESULT" | grep -q "Changes not staged"; then
  echo "Has unstaged changes"
fi
```

## Setup Observer/Worker Split

```bash
# Create worker pane on the right
WORKER_ID=$(wezterm cli split-pane --right --percent 50 -- bash -c 'exec bash')
WORKER=$(wezterm cli get-pane-direction Right)

# Send work to worker
wezterm cli send-text --pane-id "$WORKER" --no-paste "cd /my/project"$'\x0d'
wezterm cli send-text --pane-id "$WORKER" --no-paste "npm run build"$'\x0d'
```
