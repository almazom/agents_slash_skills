---
name: zellij
description: >-
  Use when the task involves Zellij terminal multiplexer — spawning floating
  or tiled panes, running commands in panes, detecting pane exit, capturing
  output, sending commands to existing panes, orchestrating sequential or
  parallel task chains via the `zj` CLI wrapper. Triggers: zellij, floating
  pane, pane exit, tiled pane, vertical panes, horizontal panes, split pane,
  zj run, zj send, zj keys, zj close, zj chain, zj parallel, zj wait, zj
  tiled, zj floats, terminal multiplexer, pane management.
triggers: zellij, $zellij, Zellij, zj, zj run, zj send, zj chain, zj parallel, floating pane, tiled pane, split pane, pane exit, terminal multiplexer, pane management, zj floats, zj tiled, zj close
---

# Zellij Skill

Operate Zellij terminal multiplexer via `zj` CLI wrapper and raw Zellij commands.
Spawn floating/tiled panes, send commands to panes, detect exit, capture output,
orchestrate sequential/parallel tasks.

**Version:** zellij 0.44.0 | zj 2.0
**CLI tool:** `zj` (symlinked to `~/.local/bin/zj` from this skill's `tools/`)
**State dir:** `~/.local/state/zj/`

---

## ⚠️ THE RULE — Always Subscribe on Spawn

**Every floating pane that runs a task WILL close when the task finishes.**
**You MUST subscribe to the close event AT THE MOMENT OF SPAWN — not after.**

This is not optional. This is the fundamental contract of this skill.

```
SPAWN TASK IN FLOATING PANE
         │
         ▼
  IMMEDIATELY SUBSCRIBE TO CLOSE EVENT
         │
         ▼
  (task runs...)
         │
         ▼
  PANE CLOSES → EVENT FIRES → YOU TAKE ACTION
```

### Why it matters
- Floating panes auto-close when the command exits
- The close event is your ONLY signal that the task finished
- If you don't subscribe on spawn, the pane closes silently and you miss it
- There is no "subscribe later" — the pane may already be gone

### How (always)
```bash
# ✅ CORRECT — subscribe immediately on spawn
P=$(zj run --detach --quiet --name "task" -- "some-command")
zj wait "$P"                    # subscribed right away

# ✅ CORRECT — sequential: spawn → subscribe → next
for TASK in "build" "test" "deploy"; do
  P=$(zj run --detach --quiet --name "$TASK" -- "./$TASK.sh")
  zj wait "$P"                # subscribed before task even starts
  echo "$TASK done"
done

# ✅ CORRECT — parallel: spawn all → subscribe all
P1=$(zj run --detach --quiet --name "w1" -- "worker 1")
P2=$(zj run --detach --quiet --name "w2" -- "worker 2")
P3=$(zj run --detach --quiet --name "w3" -- "worker 3")
zj wait "$P1" & zj wait "$P2" & zj wait "$P3" & wait

# ❌ WRONG — spawn without subscribing (task ends, you never know)
P=$(zj run --detach --quiet --name "task" -- "some-command")
# ... do other stuff ...
zj wait "$P"   # pane may already be gone, exit code lost

# ❌ WRONG — spawn, forget to wait at all
zj run --detach --quiet --name "task" -- "some-command"
# task finishes, pane closes, nobody noticed
```

### tl;dr
> **Spawn → Subscribe. Always. No exceptions.**
> If you spawn a floating pane with a task, the VERY NEXT LINE must be `zj wait`.

---

## `zj` CLI — Full API

```
# ── Spawn & Run ──────────────────────────────────────────────
zj run "cmd"                      Floating pane, block until exit
zj run "cmd" --detach             Floating pane, return pane_id immediately
zj run "cmd" --tiled              Tiled pane (split), block until exit
zj tiled "cmd"                    Alias for zj run --tiled
zj tiled "cmd" --direction down   Tiled pane stacked vertically

# ── Send to Existing Panes ───────────────────────────────────
zj send <id> "text"               Send text to a pane
zj send <id> "cmd" --enter        Send text + press Enter
zj keys <id> "Ctrl c"             Send key combo(s)

# ── Lifecycle ────────────────────────────────────────────────
zj wait <id>                      Block until pane exits
zj watch <id>                     Watch pane, return exit code
zj close <id> [id2] [id3]         Close pane(s) by ID
zj floats [show|hide|toggle]      Manage floating pane visibility

# ── Orchestration ────────────────────────────────────────────
zj chain "a" "b" "c"              Sequential, stop on first failure
zj parallel "a" "b" "c"           All at once, wait for all

# ── Inspect ──────────────────────────────────────────────────
zj list                           Show tracked panes
zj capture <id>                   Dump pane output to stdout
zj cleanup                        Remove stale tracked entries
```

### `zj run` — The Primitive

```bash
# Floating pane, block until done, propagate exit code
zj run "make test"
echo $?    # 0 if passed, non-zero otherwise

# With a name
zj run --name "build" -- "cargo build --release"

# Capture output after exit
zj run --dump-output -- "ls -la /tmp"

# Custom size & position
zj run --width 80% --height 50% --x 10% --y 5% -- "long-task"

# Detach — spawn and return pane_id for later wait
PANE=$(zj run --detach --name "deploy" -- ./deploy.sh)
zj wait "$PANE"    # block until deploy finishes

# Tiled pane (split instead of floating)
zj run --tiled --direction down --name "log" -- "tail -f /var/log/syslog"
zj run --tiled --direction right --name "edit" -- "vim file.txt"

# Working directory
zj run --cwd /home/pets/project -- "npm test"
```

**How it works internally:**
1. Spawns `zellij run --floating --name X -- <cmd>` (NO `--close-on-exit`)
2. Polls `zellij action list-panes --json` at 250ms intervals
3. When `exited=True` → captures `exit_status` + dumps pane output
4. Closes the pane via `close-pane --pane-id`, returns exit code

> **Why no `--close-on-exit`:** With that flag the pane vanishes instantly and exit_status is lost.

### `zj send` / `zj keys` — Remote Control

Send text and key combos to existing panes without focusing them.

```bash
# Type a command and execute it
zj send terminal_42 "ls -la" --enter

# Type text without executing
zj send 42 "some text being typed"

# Send key combos
zj keys 42 "Ctrl c"           # interrupt
zj keys 42 "Ctrl u"           # clear line
zj keys 42 "Ctrl l"           # clear screen
zj keys 42 "Enter"            # just press Enter
zj keys 42 "Alt ."            # insert last argument

# Clear line, type new command, execute
zj keys 42 "Ctrl u"
zj send 42 "make test" --enter
```

> **Tip:** Combine `zj run --detach` + `zj send` to create a persistent pane, send commands to it over time, then `zj close` when done.

### `zj close` — Close by ID

```bash
zj close 42                  # close single pane
zj close 42 43 44            # close multiple panes at once
zj close terminal_42         # accepts full format too
```

No need to focus the pane first. Uses `zellij action close-pane --pane-id`.

### `zj floats` — Floating Pane Visibility

```bash
zj floats                    # toggle (show ↔ hide)
zj floats show               # show all floating panes
zj floats hide               # hide all floating panes
```

Zellij auto-hides floating panes when you click on a tiled pane. Use `zj floats show` to bring them back.
Keyboard: `Ctrl+p` → `w` (Pane mode → toggle floating).

### `zj tiled` — Tiled Splits

```bash
# Side by side (new pane to the right)
zj tiled "cmd" --direction right

# Stacked (new pane below)
zj tiled "cmd" --direction down
```

**CRITICAL — Direction naming is counter-intuitive:**

| What you want | Zellij flag | What you see |
|---|---|---|
| Side by side `[A] \| [B]` | `--direction right` | Vertical split line |
| Stacked `[A] / [B]` | `--direction down` | Horizontal split line |

The direction = where the **new pane** appears, not the split line.

### `zj chain` — Sequential Pipeline

```bash
# Build → Test → Deploy — each in its own floating pane
zj chain "make build" "make test" "./deploy.sh"
# Stops on first non-zero exit
# All pass → "CHAIN OK — 3/3 completed"
# Step 2 fails → "CHAIN FAILED at step 2/3"
```

### `zj parallel` — Concurrent Workers

```bash
# Run 3 tasks, wait for all
zj parallel "worker.sh us" "worker.sh eu" "worker.sh asia"

# Manual parallel with detach:
P1=$(zj run --detach --name "w1" -- worker.sh us)
P2=$(zj run --detach --name "w2" -- worker.sh eu)
P3=$(zj run --detach --name "w3" -- worker.sh asia)
zj wait "$P1"; zj wait "$P2"; zj wait "$P3"
```

### Exit Codes

| Code | Meaning |
|---|---|
| 0 | Command succeeded |
| 1 | Command failed (non-zero exit) or pane gone |
| 2 | Timeout |
| 10+ | CLI usage error |

---

## Proven Patterns

### Sequential Tasks (run → wait → next)

Each task gets its own floating pane, closes when done, next starts:

```bash
for i in 1 2 3; do
  P=$(zj run --detach --quiet --name "task-$i" \
    --width 40% --height 30% --x 30% --y 1% \
    -- bash -c "codex_wp -q 'do task $i' 2>&1; exit 0")
  zj wait "$P"
  echo "Task $i done"
done
```

### Codex_wp in Floating Panes

```bash
# Single task
zj run --name "codex" --width 50% --height 60% -- \
  bash -c 'codex_wp -q "implement feature X" 2>&1; exit 0'

# Sequential codex tasks
for TASK in "task A" "task B" "task C"; do
  P=$(zj run --detach --quiet --name "cw" \
    -- bash -c "codex_wp -q '$TASK' 2>&1; exit 0")
  zj wait "$P"
done

# Parallel codex tasks (3 floating panes)
zj parallel \
  "codex_wp -q 'task A' 2>&1; exit 0" \
  "codex_wp -q 'task B' 2>&1; exit 0" \
  "codex_wp -q 'task C' 2>&1; exit 0"
```

### Persistent Pane + Remote Commands

```bash
# Create a long-lived pane
P=$(zj run --detach --quiet --name "server" -- bash -c 'exec bash')

# Send commands to it over time
zj send "$P" "cd /tmp && python -m http.server 8080" --enter
sleep 2
zj send "$P" "echo server is running" --enter

# Clean up when done
zj close "$P"
```

### Tiled Layout Recipes

```bash
# 3 panes stacked (top to bottom)
for i in 1 2 3; do
  zellij run --direction down --name "v$i" -- bash -c 'exec bash'
done

# 3 panes side by side (left to right)
for i in 1 2 3; do
  zellij run --direction right --name "h$i" -- bash -c 'exec bash'
done

# 3 floating panes in a row
zellij run --floating --width 30% --height 30% --x 1% --y 1% --name "f1" -- bash -c 'exec bash'
zellij run --floating --width 30% --height 30% --x 34% --y 1% --name "f2" -- bash -c 'exec bash'
zellij run --floating --width 30% --height 30% --x 67% --y 1% --name "f3" -- bash -c 'exec bash'

# Close all by ID
zj close 29 30 31
```

> **Tip:** `exec bash` keeps the pane alive for interactive use. Without it, the pane closes when the command finishes.

---

## Raw Zellij Reference

When `zj` doesn't cover a case, use Zellij directly:

### Session Management
```bash
zellij list-sessions
zellij attach <name>
zellij run --session <other> -- <cmd>
zellij kill-session <name>
```

### Spawning Panes
```bash
zellij run --floating --name "x" -- <cmd>
zellij run --direction right|down|left|up --name "x" -- <cmd>
zellij run --floating --width 80% --height 60% --x 10% --y 10% -- <cmd>
zellij edit /path/to/file                # opens in $EDITOR
zellij plugin <plugin_url>
```

Key flags: `--floating`, `--close-on-exit` (exit_status lost!), `--name`, `--direction`, `--width`, `--height`, `--x`, `--y`, `--cwd`, `--borderless`, `--start-suspended`, `--block-until-exit`, `--near-current-pane`

### Actions
```bash
zellij action close-pane --pane-id <id>   # close specific pane
zellij action close-pane                  # close focused
zellij action list-panes --json --all --state --tab
zellij action dump-screen --pane-id <id> --full --path /tmp/out.txt
zellij action show-floating-panes
zellij action hide-floating-panes
zellij action toggle-floating-panes
zellij action dump-layout
zellij action current-tab-info
zellij action send-keys --pane-id <id> "Ctrl c"
zellij action write-chars --pane-id <id> "some text"
```

### Pane ID Format
- `zellij run` returns: `terminal_<N>` (e.g., `terminal_11`)
- `zellij plugin` returns: `plugin_<N>`
- Built-in: `tab-bar` (id 0), `status-bar` (id 1)
- In `list-panes --json`: `id` field is **numeric only**
- `close-pane --pane-id` accepts both `29` and `terminal_29`

### Keybindings (config.kdl)
```
Ctrl+p          → Pane mode
  w             → Toggle floating panes
  e             → Embed/float pane
  d             → New pane down
  r             → New pane right
  n             → New pane
  f             → Fullscreen toggle
  i             → Pin floating pane
  h/j/k/l       → Move focus
  Ctrl+p        → Back to Normal mode
```

### Cross-Session / Plugin Communication
```bash
zellij pipe --name <pipe_name> -- <payload>
zellij pipe --plugin file:/path.wasm --name <pipe_name> -- <data>
```

---

## Empirical Findings (zellij 0.44.0)

### Exit Detection
- **`--close-on-exit`**: pane goes directly from running → removed (no intermediate state, exit_status lost)
- **Without `--close-on-exit`**: pane stays `held=True`, `exited=True` — exit_status readable
- **`zellij subscribe`**: only viewport/scrollback events, NO close/exit events
- **Only reliable method**: poll `list-panes --json` and check `exited` + `exit_status`

### Polling Race Condition
With `--close-on-exit` and 100ms polling, the intermediate `exited=True` state was never caught. The removal is atomic from the CLI perspective.

### Direction Naming Confusion
`--direction right` = vertical split (side by side). `--direction down` = horizontal split (stacked). Direction = where the **new pane** goes.

### Pane Titles Reset
`bash -c '... ; exec bash'` may overwrite `--name` with shell prompt. Find panes by ID via `list-panes --json` when titles are unreliable.

### close-pane --pane-id
Works without focusing. Accepts both `29` and `terminal_29`. Preferred way to close programmatically.

### send-keys / write-chars
Works on specific panes without focus. `send-keys` for key combos ("Ctrl c"), `write-chars` for text input.

### Floating Pane Auto-Hide
Clicking on tiled area hides floating panes. Use `toggle-floating-panes` or `show-floating-panes` to bring back.

### Tiled Split Size Control
CLI `zellij run --direction` splits the **focused pane in half**. No CLI flag for custom proportions. For precise layouts, use KDL layout files.

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `Pane terminal_X not found` | Wrong ID or already closed | `zj list` or `zellij action list-panes --json` |
| Exit code always 0 | Using `--close-on-exit` | Use `zj run` (no flag) instead |
| `held=True` pane lingers | Normal without close-on-exit | `zj` handles cleanup automatically |
| Subscribe only shows text | That's all it does | Use `zj run`/`zj wait` for exit detection |
| Timeout after 300s | Default timeout | `zj run -t 600 "cmd"` |
| Panes open wrong direction | `right` = side-by-side, `down` = stacked | See Direction Cheat Sheet |
| Pane title changed | Interactive bash overwrites it | Find by ID via `list-panes --json` |
| Floating panes disappeared | Clicked on tiled area | `zj floats show` or `Ctrl+p w` |
| Can't close specific pane | Trying to close focused? | `zj close <id>` works by ID |
| `zj send` doesn't work | Pane might not have a shell | Ensure pane runs `bash`/`sh` |
| Tiled splits wrong size | CLI always splits 50/50 | Use KDL layout files for precision |

---

## Files

```
~/.agents/skills/zellij/
├── SKILL.md              # This file
├── tools/
│   ├── zj                # Main CLI (Python 3.12+, no deps)
│   └── watch-pane.sh     # Standalone bash watcher (legacy)
└── references/           # Additional docs

~/.local/bin/zj → tools/zj  (symlink)
~/.local/state/zj/
└── tracked.json           # Detached pane state
```
