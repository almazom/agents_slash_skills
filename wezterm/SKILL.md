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

# WezTerm

Observe, read, and control WezTerm terminal panes via `wezterm cli`.

## When to Use

- WezTerm pane/tab/workspace operations
- `wezterm cli` commands
- Same-tab visible worker spawning
- Headless `--prefer-mux` sessions
- Reading pane text or sending keystrokes
- Replacing zellij transport with WezTerm

## Do Not Use For

- Generic shell operations (no WezTerm involvement)
- tmux or zellij management (unless explicitly migrating away from them)
- Abstract orchestration advice without WezTerm execution

## Choose a Mode

| Situation | Mode |
|---|---|
| Operator expects to see worker locally | **Mode A — GUI** (`split-pane`, same tab) |
| No GUI, SSH, long-running workers | **Mode B — Headless** (`--prefer-mux`) |
| Remote machine via SSH | **Mode B — Headless** on remote |
| Unsure | Default to **Mode A** |

Do not mix modes. Pick one explicitly.

## Hard Rules

These apply on every activation regardless of mode.

1. **Never hardcode pane IDs.** Resolve dynamically with `get-pane-direction` or `list --format json`. IDs change on split/close/restart.

2. **Spawn success ≠ pane exists.** Verify: correct pane, correct tab, launcher started, first snapshot confirms activity. Respawn if any check fails.

3. **Keep observing after spawn.** Snapshot immediately, then poll or heartbeat until healthy/blocked/done. Do not stop at pane creation.

4. **Do not silently switch modes.** If you started in GUI mode, stay in GUI mode. If headless, stay headless.

5. **Prefer repo-native launchers.** If the repo has a launcher script, use it. Only fall back to raw `wezterm cli` when none exists.

## Observer + Worker Model

```
┌──────────────────┬──────────────────┐
│   OBSERVER       │    WORKER        │
│   (this pane)    │   (work pane)    │
│  1. Read content │  2. Runs cmd     │
│  3. Detect state │     produces out │
│  4. React        │                  │
└──────────────────┴──────────────────┘
```

## Skill Trace

Follow the governing `AGENTS.md` skill-trace contract when one exists.
Fallback examples: `🚀🟦 [skill:wezterm] ON ...`, `🛠️🟦 [skill:wezterm] STEP ...`, `✅🟦 [skill:wezterm] DONE ...`.

## Fast Paths

### Split pane right (visible worker)

```bash
WORKER_ID=$(wezterm cli split-pane --pane-id "${WEZTERM_PANE:?}" --right --percent 50 -- bash -lc 'exec bash')
```

### Read adjacent pane

```bash
WORKER=$(wezterm cli get-pane-direction Right)
wezterm cli get-text --pane-id "$WORKER" --start-line -40 | tail -20
```

### Send command to pane

```bash
# Execute a command (note the $'\x0d' for Enter)
wezterm cli send-text --pane-id "$WORKER" --no-paste "ls -la"$'\x0d'

# Send Ctrl+C
wezterm cli send-text --pane-id "$WORKER" --no-paste $'\x03'
```

### List all panes

```bash
wezterm cli list --format json
wezterm cli --prefer-mux list          # headless
```

### Kill pane

```bash
wezterm cli kill-pane --pane-id "$WORKER_ID"
```

## Load-on-Demand Map

Read these files **only when the fast paths are not enough**.

| Need | File |
|---|---|
| Visible worker spawn, diagnose, manage | `references/HOWTO-visible-worker.md` |
| Headless mux spawn, naming, Codex headless | `references/HOWTO-headless-mux.md` |
| Dynamic pane ID resolution, non-adjacent lookup | `references/HOWTO-pane-discovery.md` |
| Poll/react, heartbeat, stuck detection loops | `references/HOWTO-observer-loops.md` |
| Codex skill trace, fallback questions | `references/HOWTO-codex-worker-observation.md` |
| SSH connections, SSHMUX, domain config, `wezterm connect` | `references/HOWTO-ssh-and-mux-domains.md` |
| Exhaustive command syntax lookup | `references/REFERENCE-cli-commands.md` |
| Pane JSON object fields and queries | `references/REFERENCE-pane-json.md` |
| Control characters, escape sequences | `references/REFERENCE-key-sequences.md` |
| Lua config observer examples | `references/REFERENCE-lua-config.md` |
| Why mode separation matters, tradeoffs | `references/EXPLANATION-transport-selection.md` |
| Why spawn diagnostics + ongoing observation | `references/EXPLANATION-observability-lifecycle.md` |
| Domain types, SSHMUX architecture, config structs | `references/REFERENCE-sshmux-architecture.md` |
| Shell integration, user vars, OSC 7, cwd tracking | `references/REFERENCE-shell-integration.md` |
| Verify environment works | `references/TUTORIAL-smoke-test.md` |

Resolve paths relative to the skill directory.

## Limitations

| Limitation | Workaround |
|---|---|
| `get-text` default = viewport only | Use `--start-line -N` for scrollback |
| No scrollback end marker | Read enough lines to cover expected output |
| `send-text` has no "key combo" mode | Use hex escapes with `--no-paste` |
| No event/streaming API from CLI | Poll with `sleep` in a loop |
| Pane IDs change on close/reopen | Always use `get-pane-direction` to resolve |
| `get-pane-direction` returns empty if no pane | Always check `[ -n "$PANE" ]` before using |

## Troubleshooting

| Problem | Fix |
|---|---|
| `get-pane-direction` prints nothing | No pane in that direction — check layout with `wezterm cli list` |
| `get-text` returns empty | Wrong pane ID or pane gone — re-resolve |
| `send-text` seems ignored | Use `--no-paste` for raw keystrokes |
| Ctrl+C doesn't interrupt | Use `--no-paste $'\x03'` |
| Observer reads stale content | Add `sleep 0.5` before reading |
| `WEZTERM_PANE` unset | Not running inside WezTerm |
| `kill-pane` says "no such pane" | Pane already exited — expected, not an error |

## Decision Rules

- If the user wants to **observe a running headless process**, do not force interactive attach first — use `get-text`.
- If `wezterm cli get-text` is enough, use it — don't over-engineer.
- If **semantic names** are missing, add titles instead of asking the operator to memorize pane IDs.
- If a pane already exited, treat "no such pane" as expected post-exit, not a mux failure.
- If **multiple panes** exist, identify the target by workspace and title before killing anything.
- If the user wants **copy-paste-ready commands**, include the full `wezterm cli --prefer-mux ...` form.
- If a **repo-native launcher** exists, prefer it over raw `wezterm cli` construction.
- If **no "wait for prompt" detection** exists, parse content for `$`, `#`, `>` patterns.
- If **target pane is not adjacent**, use `list --format json` and resolve by window/tab/cwd/title.

## Official Docs

- CLI index: https://wezfurlong.org/wezterm/cli/cli/index.html
- `list`: https://wezfurlong.org/wezterm/cli/cli/list.html
- `get-text`: https://wezfurlong.org/wezterm/cli/cli/get-text.html
- `send-text`: https://wezfurlong.org/wezterm/cli/cli/send-text.html
- `split-pane`: https://wezfurlong.org/wezterm/cli/cli/split-pane.html
- `spawn`: https://wezfurlong.org/wezterm/cli/cli/spawn.html
- `kill-pane`: https://wezfurlong.org/wezterm/cli/cli/kill-pane.html
- `get-pane-direction`: https://wezfurlong.org/wezterm/cli/cli/get-pane-direction.html
- `activate-pane`: https://wezfurlong.org/wezterm/cli/cli/activate-pane.html
- `activate-tab`: https://wezfurlong.org/wezterm/cli/cli/activate-tab.html
- `set-tab-title`: https://wezfurlong.org/wezterm/cli/cli/set-tab-title.html
- `set-window-title`: https://wezfurlong.org/wezterm/cli/cli/set-window-title.html
- `rename-workspace`: https://wezfurlong.org/wezterm/cli/cli/rename-workspace.html
- Pane Lua API: https://wezfurlong.org/wezterm/config/lua/Pane/index.html
