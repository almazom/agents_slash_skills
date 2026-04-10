# EXPLANATION — Transport Selection

Why mode separation exists and when each mode is the right choice.

## Two Modes

| | **Mode A — Local / GUI** | **Mode B — Headless / Mux** |
|---|---|---|
| Primary use | Split pane, observe+worker in same tab | Spawn detached panes, inspect without attach |
| Control surface | `wezterm cli` (default) | `wezterm cli --prefer-mux` |
| Discovery | `get-pane-direction`, `split-pane` | `spawn`, `list`, semantic titles |
| Observer style | Poll adjacent pane via direction | `get-text` on known pane ID |

## Why Separation Matters

The two modes target fundamentally different runtime environments:

- **GUI mode** requires an active WezTerm window with `WEZTERM_PANE` set. The operator can see the worker. Pane discovery uses spatial direction (`Left`, `Right`, etc.). Splits happen visually in the same tab.
- **Headless mode** works without any GUI — over SSH, in background, or on a remote mux server. There is no spatial layout. Pane discovery uses workspace, title, and JSON filtering. Workers survive terminal detach.

Mixing the two leads to commands that silently fail or workers that appear in unexpected places. The mode choice is a session-level decision, not a per-command toggle.

## When to Choose Each

- The operator explicitly asks to see the worker → GUI mode
- No GUI is available (SSH, cron, background) → headless mode
- The worker must survive terminal detach → headless mode
- The worker runs on a remote machine via SSH → headless mode on the remote

## Common Mistakes

- Using `--prefer-mux spawn` when the operator said "spawn a worker in the right pane" — they expect to see it in their current window
- Using `split-pane --right` in a headless SSH session where no GUI exists — the command fails silently
- Switching mid-session from GUI to headless or vice versa without an explicit decision — causes confusion about where workers live
