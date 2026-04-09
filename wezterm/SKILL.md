---
name: wezterm
description: >-
  WezTerm terminal multiplexer — observe, read, and control panes via CLI.
  Covers both local GUI (split-pane, observer+worker) and headless mux
  (--prefer-mux, SSHMUX, spawn). Use when: monitoring another pane,
  reading left/right pane content, sending text/keystrokes to a pane,
  splitting panes, activating panes, killing panes, spawning headless
  sessions, semantic workspace/window/tab naming, or orchestrating a
  work pane with an observer pane.
  Triggers: wezterm, sshmux, wezterm cli, wezterm mux, observe via
  wezterm, replace zellij with wezterm, left pane, right pane,
  observe pane, read pane, send text to pane, split pane, activate pane,
  wezterm cli, pane monitor, pane observer, WEZTERM_PANE, terminal
  multiplexer, cross-pane control, headless session, prefer-mux.
allowed-tools: Bash
---

# WezTerm CLI Skill

Observe, read, and control WezTerm terminal panes via `wezterm cli`.

Two modes of operation:

| | **Mode A — Local / GUI** | **Mode B — Headless / Mux** |
|---|---|---|
| Primary use | Split pane, observe+worker in same tab | Spawn detached panes, inspect without attach |
| Control surface | `wezterm cli` (default) | `wezterm cli --prefer-mux` |
| Discovery | `get-pane-direction`, `split-pane` | `spawn`, `list`, semantic titles |
| Observer style | Poll adjacent pane via direction | `get-text` on known pane ID |

---

## Skill trace

- Follow the governing `AGENTS.md` skill-trace contract when one exists.
- Fallback examples: `🚀🟦 [skill:wezterm] ON ...`, `🛠️🟦 [skill:wezterm] STEP ...`, `✅🟦 [skill:wezterm] DONE ...`.

---

## Core Concept: Observer + Worker

```
┌──────────────────┬──────────────────┐
│                  │                  │
│   OBSERVER       │    WORKER        │
│   (this pane)    │   (work pane)    │
│                  │                  │
│  1. Read worker  │  2. Runs cmd,    │
│     content      │     produces     │
│  3. Detect:      │     output       │
│     done/error/  │                  │
│     idle/prompt  │                  │
│  4. React:       │                  │
│     send cmd,    │                  │
│     press key,   │                  │
│     kill, etc.   │                  │
│                  │                  │
└──────────────────┴──────────────────┘
```

## Visible Local Worker Rule

If the operator expects to **see** the worker in WezTerm:
- spawn it in a **new pane in the same tab** as the current pane
- prefer `split-pane --pane-id "$WEZTERM_PANE" --right ...` for the first visible worker
- use `split-pane --bottom --pane-id <right_pane>` for additional workers in that same tab
- do **not** use another tab, another window, or headless mux as the default for that request

The existence of a worker somewhere else is not enough if the request was for a
visible right-side pane.

## Mandatory Post-Spawn Diagnostics

After any visible worker spawn:
1. capture the returned `pane_id`
2. confirm the `tab_id` matches the current tab
3. confirm the pane position is where you intended
4. inspect the pane text immediately to verify startup

Minimal pattern:

```bash
WORKER_ID=$(wezterm cli split-pane --pane-id "${WEZTERM_PANE:?}" --right --percent 50 -- bash -lc 'exec bash')
wezterm cli list --format json | python3 - "$WORKER_ID" <<'PY'
import json, sys
worker_id = int(sys.argv[1])
for pane in json.load(sys.stdin):
    if pane["pane_id"] == worker_id:
        print(f"pane={pane['pane_id']} tab={pane['tab_id']} left={pane['left_col']} top={pane['top_row']} title={pane['title']}")
        break
PY
wezterm cli get-text --pane-id "$WORKER_ID" --start-line -30 | tail -20
```

If the worker landed in the wrong tab or the launcher did not start, respawn or
repair it instead of calling the spawn successful.

## Periodic Observability Rule

After diagnostics, keep observing:
- immediate startup snapshot
- then heartbeat or repeated `get-text` polling
- continue until healthy, blocked, or done

Do not stop at pane creation.

**Basic observer loop:**
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

---

## ⚠️ THE RULE — Always Resolve Pane IDs Dynamically

**Never hardcode pane IDs.** They change on split/close/restart.

```bash
# ✅ CORRECT — resolve dynamically
RIGHT=$(wezterm cli get-pane-direction Right)

# ✅ CORRECT — check it exists before using
if [ -n "$RIGHT" ]; then
  CONTENT=$(wezterm cli get-text --pane-id "$RIGHT")
fi

# ❌ WRONG — hardcoded pane ID (breaks on restart, split, close)
CONTENT=$(wezterm cli get-text --pane-id 3)
```

### Resolution hierarchy

1. **First choice:** `wezterm cli get-pane-direction <DIR>` for adjacent panes.
2. **Fallback:** `wezterm cli list --format json` — resolve by `window_id`, `tab_id`, `left_col`, `cwd`, or `title`.
3. **Headless mux:** `wezterm cli --prefer-mux list` then match by workspace/title.

### Right Pane Discovery (non-adjacent fallback)

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

---

## Mode B — Headless Mux (`--prefer-mux`)

When operating headless (SSH, no GUI, long-running workers), use `--prefer-mux` as the primary control surface.

### Core rule

Do not default to GUI-first instructions when the operator only needs: spawn, list, get-text, rename, kill.

### CLI map for headless

```bash
wezterm cli --prefer-mux spawn                    # new pane in mux server
wezterm cli --prefer-mux list                     # WINID TABID PANEID WORKSPACE TITLE CWD
wezterm cli get-text --pane-id <id>               # read without attach
wezterm cli set-tab-title --tab-id <id> "..."     # rename tab
wezterm cli set-window-title --window-id <id> "..."  # rename window
wezterm cli kill-pane --pane-id <id>              # stop pane cleanly
```

### Headless spawn pattern

```bash
wezterm cli --prefer-mux spawn \
  --new-window \
  --workspace my-workspace \
  --cwd /abs/path \
  bash -lc 'printf '\''\033]2;%s\007'\'' "worker-name"; exec my-command'
```

After spawn, capture pane ID and inspect:

```bash
wezterm cli --prefer-mux list
wezterm cli get-text --pane-id <pane_id> | tail -n 60
```

### Semantic naming

Use stable naming hierarchy:

| Level | Set with | Purpose |
|---|---|---|
| Workspace | `--workspace` on spawn | Long-lived run or session family |
| Window title | `set-window-title` | Operator-visible session name |
| Tab title | `set-tab-title` | Concrete project or loop name |
| Pane title | `printf '\033]2;%s\007' "name"` | Worker role |

For pane title, the practical trick:

```bash
printf '\033]2;%s\007' "codex-headless-impl"
```

Run that **before** the long-lived command so the title appears in `wezterm cli list`.

### Repo-native launcher rule

If the repository already contains a launcher (e.g. `scripts/codex_headless/run-wezterm-implementation-loop.sh`), **prefer it** over inventing ad-hoc commands.

Only fall back to raw `wezterm cli` when the launcher does not exist, is broken, or the user explicitly wants raw commands.

---

## CLI Reference — Complete

### Discovery & Inspection

```bash
# List ALL windows, tabs, panes
wezterm cli list                          # table format
wezterm cli list --format json            # JSON (one object per pane)
wezterm cli --prefer-mux list             # headless mux mode

# List connected client sessions
wezterm cli list-clients
wezterm cli list-clients --format json

# Find adjacent pane (prints pane ID or nothing)
wezterm cli get-pane-direction Left       # Left/Right/Up/Down/Next/Prev
wezterm cli get-pane-direction Right --pane-id 5  # from a specific pane
```

### Reading Pane Content

```bash
wezterm cli get-text                      # current pane, viewport only
wezterm cli get-text --pane-id <ID>       # specific pane
wezterm cli get-text --pane-id <ID> --escapes          # include ANSI escapes
wezterm cli get-text --pane-id <ID> --start-line -100  # last 100 lines of scrollback
wezterm cli get-text --pane-id <ID> --start-line 0 --end-line 24  # lines 0-24
wezterm cli get-text --pane-id "$RIGHT" > /tmp/snapshot.txt
```

Line numbering: `0` = top of visible screen, negative = scrollback. Default = viewport only.

### Sending Text & Keystrokes

```bash
wezterm cli send-text --pane-id <ID> "hello world"          # paste (bracketed paste aware)
wezterm cli send-text --pane-id <ID> --no-paste "ls -la"    # raw text
echo "cmd" | wezterm cli send-text --pane-id <ID>           # from stdin
```

### Pane Lifecycle

```bash
# Split (outputs new pane ID)
wezterm cli split-pane --right                   # horizontal split, new pane right
wezterm cli split-pane --left                    # new pane left
wezterm cli split-pane --bottom                  # vertical split, new pane below (default)
wezterm cli split-pane --top                     # new pane above
wezterm cli split-pane --right --percent 30      # 30% width
wezterm cli split-pane --right --cells 80        # 80 cells wide
wezterm cli split-pane --right -- bash -c "npm test"  # run command
wezterm cli split-pane --pane-id <ID> --right    # split a specific pane
wezterm cli split-pane --top-level               # split entire window
wezterm cli split-pane --cwd /path               # set working directory

# Spawn (new tab or window, outputs new pane ID)
wezterm cli spawn                               # new tab, default shell
wezterm cli spawn -- top                        # new tab running `top`
wezterm cli spawn --new-window                  # new window
wezterm cli spawn --new-window --workspace dev  # new window in workspace
wezterm cli spawn --window-id 1                 # new tab in specific window
wezterm cli spawn --cwd /path                   # set working directory

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

### Navigation & Focus

```bash
wezterm cli activate-pane --pane-id <ID>         # focus specific pane
wezterm cli activate-pane-direction Left         # focus adjacent
```

### Tab Management

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

### Window & Workspace

```bash
wezterm cli set-window-title "Project: API"      # rename window
wezterm cli set-window-title --window-id 0 "Dev"
wezterm cli rename-workspace "dev"               # rename current workspace
wezterm cli rename-workspace --workspace old "new"
```

### Advanced (rarely needed)

```bash
wezterm cli proxy                               # RPC proxy pipe for mux forwarding
wezterm cli tlscreds                            # TLS credentials (--pem for PEM)
```

### Global Options

```bash
wezterm cli --no-auto-start <COMMAND>   # don't auto-start mux server
wezterm cli --prefer-mux <COMMAND>      # prefer mux server over gui instance
wezterm cli --class <CLASS> <COMMAND>   # match a gui started with --class
```

---

## Key Sequences Reference

Since `send-text --no-paste` sends raw bytes, use these for special keys:

| Key | Escape Seq | Hex | Bash syntax |
|-----|-----------|-----|-------------|
| Ctrl+A | SOH | `\x01` | `$'\x01'` |
| Ctrl+B | STX | `\x02` | `$'\x02'` |
| Ctrl+C | ETX | `\x03` | `$'\x03'` |
| Ctrl+D | EOT | `\x04` | `$'\x04'` |
| Ctrl+E | ENQ | `\x05` | `$'\x05'` |
| Ctrl+L | FF | `\x0c` | `$'\x0c'` |
| Ctrl+U | NAK | `\x15` | `$'\x15'` |
| Ctrl+Z | SUB | `\x1a` | `$'\x1a'` |
| Ctrl+\ | FS | `\x1c` | `$'\x1c'` |
| Enter | CR | `\x0d` | `$'\x0d'` |
| Escape | ESC | `\x1b` | `$'\x1b'` |
| Tab | TAB | `\x09` | `$'\x09'` |
| Backspace | DEL | `\x7f` | `$'\x7f'` |
| Up Arrow | ESC[A | `\x1b[A` | `$'\x1b[A'` |
| Down Arrow | ESC[B | `\x1b[B` | `$'\x1b[B'` |
| Right Arrow | ESC[C | `\x1b[C` | `$'\x1b[C'` |
| Left Arrow | ESC[D | `\x1b[D` | `$'\x1b[D'` |

### Common combos as one-liners

```bash
# Interrupt
wezterm cli send-text --pane-id "$P" --no-paste $'\x03'

# Clear line / clear screen / EOF
wezterm cli send-text --pane-id "$P" --no-paste $'\x15'    # Ctrl+U
wezterm cli send-text --pane-id "$P" --no-paste $'\x0c'    # Ctrl+L
wezterm cli send-text --pane-id "$P" --no-paste $'\x04'    # Ctrl+D

# Type full command and execute
wezterm cli send-text --pane-id "$P" --no-paste "npm test"$'\x0d'

# Interrupt, wait, then retry
wezterm cli send-text --pane-id "$P" --no-paste $'\x03'
sleep 0.2
wezterm cli send-text --pane-id "$P" --no-paste "cargo build"$'\x0d'
```

---

## Observer Patterns

### Pattern 1: Poll-and-React

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

### Pattern 2: Snapshot and Parse

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

### Pattern 3: Send-and-Verify

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

### Pattern 4: Monitor Two Panes

```bash
LEFT=$(wezterm cli get-pane-direction Left)
RIGHT=$(wezterm cli get-pane-direction Right)

echo "Left pane:  $(wezterm cli get-text --pane-id "$LEFT" | tail -1)"
echo "Right pane: $(wezterm cli get-text --pane-id "$RIGHT" | tail -1)"
```

### Pattern 5: Interrupt and Recover

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

### Pattern 6: Heartbeat Until Logical Stop

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

### Pattern 7: Detect Fallback Question and Resume

```bash
WORKER=$(wezterm cli get-pane-direction Right)
SNAPSHOT=$(wezterm cli get-text --pane-id "$WORKER" --start-line -80)

if printf '%s\n' "$SNAPSHOT" | grep -q "Start implementation now, or pause here?"; then
  wezterm cli send-text --pane-id "$WORKER" --no-paste "Yes. Start implementation."$'\x0d'
fi
```

Then switch to a heartbeat loop. Always verify the answer was accepted by observing the pane after sending.

### Pattern 8: Setup Observer/Worker Split

```bash
# Create worker pane on the right
WORKER_ID=$(wezterm cli split-pane --right --percent 50 -- bash -c 'exec bash')
WORKER=$(wezterm cli get-pane-direction Right)

# Send work to worker
wezterm cli send-text --pane-id "$WORKER" --no-paste "cd /my/project"$'\x0d'
wezterm cli send-text --pane-id "$WORKER" --no-paste "npm run build"$'\x0d'
```

### Pattern 9: Codex Headless Observer

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

---

## Lua Config — Advanced Observer

```lua
-- Read adjacent pane content in status bar
wezterm.on("update-status", function(window, pane)
  local tab = window:active_tab()
  local right = tab:get_pane_direction("Right")
  if right then
    local lines = right:get_lines_as_text()
  end
end)

-- Keybinding: capture right pane to clipboard
local wezterm = require 'wezterm'
return {
  keys = {
    { key = 'y', mods = 'CTRL|SHIFT', action = wezterm.action_callback(function(win, pane)
      local tab = pane:tab()
      local right = tab:get_pane_direction("Right")
      if right then
        local text = table.concat(right:get_lines_as_text(), "\n")
        win:copy_to_clipboard(text)
      end
    end)},
  },
}
```

---

## Pane State from `list --format json`

Each pane object:

```json
{
  "window_id": 0,
  "tab_id": 0,
  "pane_id": 0,
  "workspace": "default",
  "size": { "rows": 24, "cols": 80 },
  "title": "~",
  "cwd": "file://hostname/home/user",
  "cursor_x": 5,
  "cursor_y": 10,
  "is_active": true,
  "is_zoomed": false,
  "tty_name": "/dev/pts/44"
}
```

Useful fields: `pane_id` (for all CLI commands), `title` (unreliable for interactive shells), `cwd` (working directory), `is_active` (focused pane?), `cursor_y` (detect if at prompt).

---

## Limitations

| Limitation | Workaround |
|---|---|
| `get-text` default = viewport only | Use `--start-line -N` for scrollback |
| No scrollback end marker | Read enough lines to cover expected output |
| `send-text` has no "key combo" mode | Use hex escape sequences with `--no-paste` |
| No event/streaming API from CLI | Poll with `sleep` in a loop |
| Pane IDs change on close/reopen | Always use `get-pane-direction` to resolve |
| Target pane not adjacent | Use `list --format json` and resolve by window/tab/cwd/title |
| No "wait for prompt" detection | Parse content for `$`, `#`, `>` patterns |
| `get-pane-direction` returns empty if no pane | Always check `[ -n "$PANE" ]` before using |

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `get-pane-direction` prints nothing | No pane in that direction | Check layout with `wezterm cli list` |
| `get-text` returns empty | Wrong pane ID or pane gone | Re-resolve with `get-pane-direction` |
| `send-text` seems ignored | Bracketed paste mode issue | Use `--no-paste` |
| Ctrl+C doesn't interrupt | Sent as text, not signal | Use `--no-paste $'\x03'` |
| Can't send arrow keys | Need escape sequences | `$'\x1b[A'` for Up, etc. |
| Observer reads stale content | Output not flushed yet | Add `sleep 0.5` before reading |
| Pane ID changed after split | Split creates new pane, shifts IDs | Always re-resolve with `get-pane-direction` |
| `WEZTERM_PANE` unset | Not running inside WezTerm | Command must run in a WezTerm pane |
| Sending answer does nothing | Worker didn't parse it | Keep observing; fix belongs in worker flow |
| `kill-pane` says "no such pane" | Pane already exited | Expected post-exit, not a mux failure |

---

## Decision Rules

- If the user wants to **observe a running headless process**, do not force interactive attach first — use `get-text`.
- If `wezterm cli get-text` is enough, use it — don't over-engineer.
- If **semantic names** are missing, add titles instead of asking the operator to memorize pane IDs.
- If a pane already exited, treat "no such pane" as expected post-exit, not a mux failure.
- If **multiple panes** exist, identify the target by workspace and title before killing anything.
- If the user wants **copy-paste-ready commands**, include the full `wezterm cli --prefer-mux ...` form.
- If a **repo-native launcher** exists, prefer it over raw `wezterm cli` construction.

---

## Files

```
~/.agents/skills/wezterm/
└── SKILL.md              # This file
```

## Official Docs

- CLI index: https://wezfurlong.org/wezterm/cli/cli/index.html
- `list`: https://wezfurlong.org/wezterm/cli/cli/list.html
- `list-clients`: https://wezfurlong.org/wezterm/cli/cli/list-clients.html
- `get-text`: https://wezfurlong.org/wezterm/cli/cli/get-text.html
- `send-text`: https://wezfurlong.org/wezterm/cli/cli/send-text.html
- `split-pane`: https://wezfurlong.org/wezterm/cli/cli/split-pane.html
- `spawn`: https://wezfurlong.org/wezterm/cli/cli/spawn.html
- `kill-pane`: https://wezfurlong.org/wezterm/cli/cli/kill-pane.html
- `zoom-pane`: https://wezfurlong.org/wezterm/cli/cli/zoom-pane.html
- `activate-pane`: https://wezfurlong.org/wezterm/cli/cli/activate-pane.html
- `activate-pane-direction`: https://wezfurlong.org/wezterm/cli/cli/activate-pane-direction.html
- `get-pane-direction`: https://wezfurlong.org/wezterm/cli/cli/get-pane-direction.html
- `move-pane-to-new-tab`: https://wezfurlong.org/wezterm/cli/cli/move-pane-to-new-tab.html
- `adjust-pane-size`: https://wezfurlong.org/wezterm/cli/cli/adjust-pane-size.html
- `activate-tab`: https://wezfurlong.org/wezterm/cli/cli/activate-tab.html
- `set-tab-title`: https://wezfurlong.org/wezterm/cli/cli/set-tab-title.html
- `set-window-title`: https://wezfurlong.org/wezterm/cli/cli/set-window-title.html
- `rename-workspace`: https://wezfurlong.org/wezterm/cli/cli/rename-workspace.html
- Pane Lua API: https://wezfurlong.org/wezterm/config/lua/Pane/index.html
