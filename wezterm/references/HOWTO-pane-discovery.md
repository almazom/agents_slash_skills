# HOWTO — Pane Discovery

Find the right pane ID without hardcoding. Pane IDs change on split/close/restart — always resolve dynamically.

## Resolution Hierarchy

1. **First choice:** `wezterm cli get-pane-direction <DIR>` for adjacent panes
2. **Fallback:** `wezterm cli list --format json` — resolve by `window_id`, `tab_id`, `left_col`, `cwd`, or `title`
3. **Headless mux:** `wezterm cli --prefer-mux list` then match by workspace/title

## Adjacent Pane

```bash
# Find pane to the right (prints pane ID or nothing)
RIGHT=$(wezterm cli get-pane-direction Right)

# Always check before using
if [ -n "$RIGHT" ]; then
  CONTENT=$(wezterm cli get-text --pane-id "$RIGHT")
fi
```

Directions: `Left`, `Right`, `Up`, `Down`, `Next`, `Prev`.

## Non-Adjacent Right Pane (Same Tab Fallback)

When direction lookup fails but the worker is in the same tab:

```bash
python3 - <<'PY'
import json, os, subprocess
current = int(os.environ["WEZTERM_PANE"])
panes = json.loads(subprocess.check_output(["wezterm", "cli", "list", "--format", "json"], text=True))
here = next(p for p in panes if p["pane_id"] == current)
candidates = [
    p for p in panes
    if p["window_id"] == here["window_id"]
    and p["tab_id"] == here["tab_id"]
    and p["left_col"] > here["left_col"]
]
if candidates:
    target = sorted(candidates, key=lambda p: p["left_col"])[0]
    print(target["pane_id"])
PY
```

## Find by Workspace and Title (Headless)

```bash
wezterm cli --prefer-mux list --format json | python3 -c "
import json, sys
for p in json.load(sys.stdin):
    if p['workspace'] == 'impl' and 'codex' in p['title']:
        print(p['pane_id'])
"
```

## List All Panes in Current Tab

```bash
wezterm cli list --format json | python3 -c "
import json, os
current = int(os.environ['WEZTERM_PANE'])
panes = json.load(sys.stdin)
here = next(p for p in panes if p['pane_id'] == current)
for p in panes:
    if p['window_id'] == here['window_id'] and p['tab_id'] == here['tab_id']:
        print(f\"{p['pane_id']}  {p['title']}  col={p['left_col']} row={p['top_row']}\")
"
```
