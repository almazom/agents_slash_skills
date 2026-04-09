#!/usr/bin/env bash
# watch-pane.sh — Watch a Zellij pane and detect when it exits
#
# Usage: watch-pane.sh <pane_numeric_id> [poll_interval_seconds]
#   pane_numeric_id: the numeric ID from zellij run (e.g. 11 from terminal_11)
#   poll_interval:   seconds between polls (default: 0.2)
#
# Output: prints status line to stdout
# Exit codes:
#   0  — pane exited (exit_status printed)
#   1  — pane gone / removed (close-on-exit or external close)
#   2  — timeout (120s default)
#   3  — missing argument
#
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: watch-pane.sh <pane_numeric_id> [poll_interval]" >&2
  exit 3
fi

PANE_NUM="$1"
INTERVAL="${2:-0.2}"
MAX_ITERATIONS=600  # ~120s at 0.2s interval

for i in $(seq 1 "$MAX_ITERATIONS"); do
  RESULT=$(zellij action list-panes --json 2>/dev/null | python3 -c "
import sys, json
try:
    panes = json.load(sys.stdin)
except Exception:
    print('ERROR')
    sys.exit(0)
for p in panes:
    if p.get('id') == $PANE_NUM:
        exited = p.get('exited')
        status = p.get('exit_status')
        held = p.get('is_held')
        title = p.get('title', '')
        print(f'exited={exited} exit_status={status} held={held} title={title}')
        sys.exit(0)
print('GONE')
" 2>/dev/null || echo "ERROR")

  if echo "$RESULT" | grep -q "exited=True"; then
    STATUS=$(echo "$RESULT" | grep -oP 'exit_status=\K[^ ]+')
    TITLE=$(echo "$RESULT" | grep -oP 'title=\K[^ ]+')
    echo "EXIT: pane=$PANE_NUM title=$TITLE exit_status=$STATUS"
    exit 0
  fi

  if echo "$RESULT" | grep -q "^GONE$"; then
    echo "GONE: pane=$PANE_NUM removed from session"
    exit 1
  fi

  sleep "$INTERVAL"
done

echo "TIMEOUT: pane=$PANE_NUM still running after ${MAX_ITERATIONS} polls"
exit 2
