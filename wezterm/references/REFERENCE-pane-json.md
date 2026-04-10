# REFERENCE — Pane JSON Schema

Output from `wezterm cli list --format json`. Each object represents one pane.

## Schema (verified from source: `wezterm/src/cli/list.rs`)

```json
{
  "window_id": 0,
  "tab_id": 0,
  "pane_id": 0,
  "workspace": "default",
  "size": {
    "rows": 24,
    "cols": 80,
    "pixel_width": 0,
    "pixel_height": 0,
    "dpi": 0
  },
  "title": "~",
  "cwd": "file://hostname/home/user",
  "cursor_x": 5,
  "cursor_y": 10,
  "cursor_shape": "Default",
  "cursor_visibility": "Visible",
  "left_col": 0,
  "top_row": 0,
  "tab_title": "tab name",
  "window_title": "window name",
  "is_active": true,
  "is_zoomed": false,
  "tty_name": "/dev/pts/44"
}
```

## Useful Fields

| Field | Use for |
|---|---|
| `pane_id` | All CLI commands — the primary identifier |
| `title` | Pane title (unreliable for interactive shells, often just `~`) |
| `cwd` | Working directory (URI format: `file://hostname/path`) |
| `is_active` | Is this the focused pane? |
| `cursor_y` | Detect if cursor is at prompt row |
| `left_col` + `top_row` | Spatial position within tab — useful for right-pane discovery |
| `window_id` + `tab_id` | Scope panes to current window/tab |
| `workspace` | Workspace name |
| `tab_title` + `window_title` | Human-readable tab/window names |
| `size.pixel_width` / `pixel_height` / `dpi` | Pixel dimensions (often 0 in mux mode) |
| `cursor_shape` / `cursor_visibility` | Cursor state (SteadyBlock, BlinkBar, etc.) |
| `tty_name` | TTY device path (null in mux) |

## list-clients JSON Schema (verified from source: `wezterm/src/cli/list_clients.rs`)

```json
{
  "username": "user",
  "hostname": "host",
  "pid": 12345,
  "connection_elapsed": { "secs": 226, "nanos": 502667166 },
  "idle_time": { "secs": 0, "nanos": 502667166 },
  "workspace": "default",
  "focused_pane_id": 0,
  "ssh_auth_sock": "/path/to/auth/sock"
}
```

Table output columns: `USER`, `HOST`, `PID`, `CONNECTED`, `IDLE`, `WORKSPACE`, `FOCUS`, `SSH_AUTH_SOCK`.
