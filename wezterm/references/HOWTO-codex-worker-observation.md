# HOWTO — Codex Worker Observation

Patterns specific to observing Codex-style workers (skill trace markers, fallback questions, headless codex loops).

## Detect Skill Trace Markers

Workers emit `[skill:*] DONE` and `[skill:*] BLOCKED` when they reach terminal states. Watch for these in heartbeat loops.

## Detect Fallback Question and Resume

Codex workers sometimes pause and ask:

```bash
WORKER=$(wezterm cli get-pane-direction Right)
SNAPSHOT=$(wezterm cli get-text --pane-id "$WORKER" --start-line -80)

if printf '%s\n' "$SNAPSHOT" | grep -q "Start implementation now, or pause here?"; then
  wezterm cli send-text --pane-id "$WORKER" --no-paste "Yes. Start implementation."$'\x0d'
fi
```

Then switch to a heartbeat loop. Always verify the answer was accepted by observing the pane after sending.

## Codex Headless Observer

Combine headless spawn with get-text inspection.

```bash
# Start a repo-native loop (if available)
bash scripts/codex_headless/run-wezterm-implementation-loop.sh

# Or spawn manually
PANE_ID=$(wezterm cli --prefer-mux spawn \
  --new-window \
  --workspace impl \
  --cwd /abs/path/to/repo \
  bash -lc 'printf '\''\033]2;%s\007'\'' "codex-impl"; exec codex "$@"' -- task.md)

# Inspect
wezterm cli --prefer-mux list
wezterm cli get-text --pane-id "$PANE_ID" | tail -n 80

# Stop when done
wezterm cli kill-pane --pane-id "$PANE_ID"
```
