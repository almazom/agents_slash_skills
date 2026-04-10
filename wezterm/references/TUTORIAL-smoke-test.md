# TUTORIAL — Smoke Test

Verify WezTerm CLI is functional and the environment is correct.

## Checks

```bash
# 1. Confirm wezterm cli is available
wezterm cli list && echo "OK: wezterm cli works"

# 2. Confirm running inside WezTerm (GUI mode)
echo "WEZTERM_PANE=${WEZTERM_PANE:-UNSET}"

# 3. Split a pane, read it, clean up
WORKER_ID=$(wezterm cli split-pane --right --percent 30 -- bash -c 'echo "SMOKE TEST OK"; sleep 2')
sleep 1
wezterm cli get-text --pane-id "$WORKER_ID" --start-line -5
wezterm cli kill-pane --pane-id "$WORKER_ID"

# 4. Test headless mux (if needed)
wezterm cli --prefer-mux list && echo "OK: mux mode works"
```

## Expected Output

- `wezterm cli list` prints a table of panes
- `WEZTERM_PANE` is set to a number (GUI mode)
- Split creates a new pane, `get-text` shows "SMOKE TEST OK", kill removes it
- Mux list works without errors
