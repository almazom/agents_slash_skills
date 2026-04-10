# WezTerm CLI Command Reference

Exhaustive command catalog. Load only when exact syntax or rare flags are needed.

## Command Map

Commands grouped by purpose:

**OBSERVE (read state):**
- `list` → all panes, tabs, IDs
- `list-clients` → who is connected to mux
- `get-text` → read pane screen content

**CREATE (build layout):**
- `spawn` → new pane in a new tab or window
- `split-pane` → split an existing pane into two

**MANAGE (control panes):**
- `activate-pane` → focus a pane
- `send-text` → send text/keystrokes to a pane
- `set-tab-title` → rename a tab
- `move-pane-to-new-tab` → move pane to different tab

**DELETE (cleanup):**
- `kill-pane` → close a pane

**Workflow lifecycle:** spawn → send-text (connect) → get-text (check status) → send-text (commands) → list (find panes) → kill-pane (cleanup)

---

## Discovery & Inspection

```bash
wezterm cli list                          # table format
wezterm cli list --format json            # JSON (one object per pane)
wezterm cli --prefer-mux list             # headless mux mode

wezterm cli list-clients                  # connected sessions
wezterm cli list-clients --format json

wezterm cli get-pane-direction Left       # Left/Right/Up/Down/Next/Prev
wezterm cli get-pane-direction Right --pane-id 5  # from a specific pane
```

### list-clients — When to Use

Shows all clients currently connected to the WezTerm mux server.

Use to:
- Check if mux server is responsive (no clients = possible mux crash)
- Verify an SSH session is still alive
- See if someone else connected to the same mux
- Audit active sessions before a redeploy or restart

Output columns: `USER`, `HOST`, `PID`, `CONNECTED`, `IDLE`, `WORKSPACE`, `FOCUS`, `SSH_AUTH_SOCK`.

JSON output fields: `username`, `hostname`, `pid`, `connection_elapsed` (Duration: secs+nanos), `idle_time` (Duration: secs+nanos), `workspace`, `focused_pane_id`, `ssh_auth_sock`.

## Reading Pane Content

```bash
wezterm cli get-text                      # current pane, viewport only
wezterm cli get-text --pane-id <ID>       # specific pane
wezterm cli get-text --pane-id <ID> --escapes          # include ANSI escapes
wezterm cli get-text --pane-id <ID> --start-line -100  # last 100 lines of scrollback
wezterm cli get-text --pane-id <ID> --start-line 0 --end-line 24  # lines 0-24
wezterm cli get-text --pane-id "$RIGHT" > /tmp/snapshot.txt
```

Line numbering: `0` = top of visible screen, negative = scrollback. Default = viewport only.

`get-text` is the foundation of observation — the manager reads pane content to understand worker status. Combine with `--start-line -N` to capture recent output, or use without flags for the visible viewport only.

## Sending Text & Keystrokes

```bash
wezterm cli send-text --pane-id <ID> "hello world"          # paste (bracketed paste aware)
wezterm cli send-text --pane-id <ID> --no-paste "ls -la"    # raw text
echo "cmd" | wezterm cli send-text --pane-id <ID>           # from stdin
```

## Pane Lifecycle

```bash
# Split (outputs new pane ID)
wezterm cli split-pane --right                   # horizontal split, new pane right
wezterm cli split-pane --horizontal              # same as --right
wezterm cli split-pane --left                    # new pane left
wezterm cli split-pane --bottom                  # vertical split, new pane below (default)
wezterm cli split-pane --top                     # new pane above
wezterm cli split-pane --right --percent 30      # 30% width
wezterm cli split-pane --right --cells 80        # 80 cells wide
wezterm cli split-pane --right -- bash -c "npm test"  # run command
wezterm cli split-pane --pane-id <ID> --right    # split a specific pane
wezterm cli split-pane --top-level               # split entire window
wezterm cli split-pane --cwd /path               # set working directory
wezterm cli split-pane --move-pane-id <ID> --right  # move existing pane into new split

# Spawn (new tab or window, outputs new pane ID)
wezterm cli spawn                               # new tab, default shell
wezterm cli spawn -- top                        # new tab running `top`
wezterm cli spawn --new-window                  # new window
wezterm cli spawn --new-window --workspace dev  # new window in workspace
wezterm cli spawn --window-id 1                 # new tab in specific window
wezterm cli spawn --cwd /path                   # set working directory
wezterm cli spawn --domain-name SSHMUX:my.server  # spawn into remote mux domain

# Kill
wezterm cli kill-pane                           # current pane
wezterm cli kill-pane --pane-id <ID>

# Zoom / unzoom
wezterm cli zoom-pane --pane-id <ID> --zoom
wezterm cli zoom-pane --pane-id <ID> --unzoom
wezterm cli zoom-pane --pane-id <ID> --toggle

# Resize
wezterm cli adjust-pane-size Right --amount 5    # grow right by 5 cells

# Move
wezterm cli move-pane-to-new-tab                         # same window
wezterm cli move-pane-to-new-tab --new-window             # new window
wezterm cli move-pane-to-new-tab --new-window --workspace dev
```

## Navigation & Focus

```bash
wezterm cli activate-pane --pane-id <ID>         # focus specific pane
wezterm cli activate-pane-direction Left         # focus adjacent
```

Use `activate-pane` before `send-text` in automation scripts to ensure the target pane has focus. See `references/HOWTO-observer-loops.md` for the broadcast-to-multiple-panes pattern.

## Tab Management

```bash
wezterm cli activate-tab --tab-id 1              # by tab ID
wezterm cli activate-tab --tab-index 0           # by index (0 = leftmost)
wezterm cli activate-tab --tab-index -1          # by index (-1 = rightmost)
wezterm cli activate-tab --tab-relative 1        # move right 1 tab (wraps)
wezterm cli activate-tab --tab-relative -1       # move left 1 tab (wraps)
wezterm cli activate-tab --tab-relative 1 --no-wrap
wezterm cli set-tab-title "New Title"            # rename current tab
wezterm cli set-tab-title --tab-id 1 "Build"     # rename specific tab
```

## Window & Workspace

```bash
wezterm cli set-window-title "Project: API"      # rename window
wezterm cli set-window-title --window-id 0 "Dev"
wezterm cli rename-workspace "dev"               # rename current workspace
wezterm cli rename-workspace --workspace old "new"
```

## Global Options

```bash
wezterm cli --no-auto-start <COMMAND>   # don't auto-start mux server
wezterm cli --prefer-mux <COMMAND>      # prefer mux server over gui instance
wezterm cli --class <CLASS> <COMMAND>   # match a gui started with --class
```

## Non-CLI WezTerm Commands

These are top-level `wezterm` subcommands (not under `wezterm cli`):

```bash
wezterm ssh user@host                  # ad-hoc SSH connection (non-persistent)
wezterm ssh user@host -- top           # SSH with specific command
wezterm ssh -oIdentityFile=/path host  # SSH with config override

wezterm connect <domain-name>          # connect to configured mux domain
wezterm connect SSHMUX:my.server       # connect to auto-populated SSHMUX domain
```

## Advanced (rarely needed)

```bash
wezterm cli proxy                               # RPC proxy pipe for mux forwarding
wezterm cli tlscreds                            # TLS credentials (--pem for PEM)
```
