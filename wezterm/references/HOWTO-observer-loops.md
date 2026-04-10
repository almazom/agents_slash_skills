# HOWTO — Observer Loops

Repeated observation patterns for long-running worker panes.

## Poll-and-React

```bash
WORKER=$(wezterm cli get-pane-direction Right)
wezterm cli send-text --pane-id "$WORKER" --no-paste "long-running-task"$'\x0d'

for i in $(seq 1 60); do
  sleep 2
  CONTENT=$(wezterm cli get-text --pane-id "$WORKER")
  if echo "$CONTENT" | tail -5 | grep -qE "DONE|finished|completed|\\$ "; then
    echo "Worker finished!"
    break
  fi
  if echo "$CONTENT" | tail -5 | grep -qi "ERROR|fatal|failed"; then
    echo "Worker hit an error!"
    wezterm cli send-text --pane-id "$WORKER" --no-paste $'\x03'
    wezterm cli send-text --pane-id "$WORKER" --no-paste "fix-command"$'\x0d'
    break
  fi
done
```

## Snapshot and Parse

```bash
WORKER=$(wezterm cli get-pane-direction Right)
SNAPSHOT=$(wezterm cli get-text --pane-id "$WORKER")

ERRORS=$(echo "$SNAPSHOT" | grep -c "ERROR")
URL=$(echo "$SNAPSHOT" | grep -oP 'http[s]?://\S+' | tail -1)
LAST_LINE=$(echo "$SNAPSHOT" | grep -v '^$' | tail -1)

echo "Errors: $ERRORS"
echo "Last URL: $URL"
echo "Last line: $LAST_LINE"
```

## Monitor Two Panes

```bash
LEFT=$(wezterm cli get-pane-direction Left)
RIGHT=$(wezterm cli get-pane-direction Right)

echo "Left pane:  $(wezterm cli get-text --pane-id "$LEFT" | tail -1)"
echo "Right pane: $(wezterm cli get-text --pane-id "$RIGHT" | tail -1)"
```

## Interrupt and Recover (Stuck Detection)

Detect stuck pane (same content 3 checks in a row), interrupt and retry.

```bash
WORKER=$(wezterm cli get-pane-direction Right)
PREV=$(wezterm cli get-text --pane-id "$WORKER" | md5sum)
sleep 3
CURR=$(wezterm cli get-text --pane-id "$WORKER" | md5sum)
sleep 3
NEXT=$(wezterm cli get-text --pane-id "$WORKER" | md5sum)

if [ "$PREV" = "$CURR" ] && [ "$CURR" = "$NEXT" ]; then
  echo "Worker stuck, interrupting..."
  wezterm cli send-text --pane-id "$WORKER" --no-paste $'\x03'
  sleep 0.3
  wezterm cli send-text --pane-id "$WORKER" --no-paste "retry-command"$'\x0d'
fi
```

## Heartbeat Until Logical Stop

Best for long-running tasks. Watches every 30s until done or idle.

```bash
WORKER=$(wezterm cli get-pane-direction Right)
idle=0
beat=0

while true; do
  beat=$((beat + 1))
  SNAPSHOT=$(wezterm cli get-text --pane-id "$WORKER" --start-line -120)
  TAIL=$(printf '%s\n' "$SNAPSHOT" | awk 'NF{lines[++n]=$0} END{start=(n>20?n-19:1); for(i=start;i<=n;i++) print lines[i]}')

  echo "=== HEARTBEAT $beat t+$(((beat-1)*30))s ==="
  printf '%s\n' "$TAIL"

  if printf '%s\n' "$TAIL" | grep -qE '\[skill:.*\] DONE|\[skill:.*\] BLOCKED'; then
    echo "Worker reached an explicit final state."
    break
  fi

  if printf '%s\n' "$TAIL" | grep -q 'Working ('; then
    idle=0
  else
    idle=$((idle + 1))
  fi

  if [ "$idle" -ge 2 ]; then
    echo "Logical stop: no Working line for two consecutive heartbeats."
    break
  fi

  sleep 30
done
```

## Periodic Quick Check

```bash
WORKER_ID="<pane id>"
sleep 2
wezterm cli get-text --pane-id "$WORKER_ID" --start-line -40 | tail -20

for _ in 1 2 3; do
  sleep 10
  wezterm cli get-text --pane-id "$WORKER_ID" --start-line -40 | tail -20
done
```

## Read Multiple Panes (Server Status Check)

Check status across multiple panes — e.g. one pane per server:

```bash
for id in 42 43 44; do
  echo "=== Pane $id ==="
  wezterm cli get-text --pane-id "$id" --start-line -5 | tail -3
done
```

This is the core observation primitive: read each pane to understand what's happening on each server.

## Broadcast Command to Multiple Panes

Send the same command to multiple panes — activate + send in a loop:

```bash
for id in 42 43 44; do
  wezterm cli activate-pane --pane-id "$id"
  wezterm cli send-text --pane-id "$id" --no-paste "git pull"
  wezterm cli send-text --pane-id "$id" --no-paste $'\x0d'
done
```

Pattern: activate focus, send command text, send Enter. Works for any command that needs to run on multiple workers or servers simultaneously.
