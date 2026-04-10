# HOWTO — Headless Mux (`--prefer-mux`)

Spawn and manage detached workers when no GUI is available or persistence matters.

## Core Principle

Do not default to GUI-first instructions. Do not mix headless mode with same-tab GUI assumptions.

## CLI Map

```bash
wezterm cli --prefer-mux spawn                    # new pane in mux server
wezterm cli --prefer-mux list                     # WINID TABID PANEID WORKSPACE TITLE CWD
wezterm cli get-text --pane-id <id>               # read without attach
wezterm cli set-tab-title --tab-id <id> "..."     # rename tab
wezterm cli set-window-title --window-id <id> "..."  # rename window
wezterm cli kill-pane --pane-id <id>              # stop pane cleanly
```

## Spawn Pattern

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

## Semantic Naming Hierarchy

| Level | Set with | Purpose |
|---|---|---|
| Workspace | `--workspace` on spawn | Long-lived run or session family |
| Window title | `set-window-title` | Operator-visible session name |
| Tab title | `set-tab-title` | Concrete project or loop name |
| Pane title | `printf '\033]2;%s\007' "name"` | Worker role |

Run the pane title `printf` **before** the long-lived command so the title appears in `wezterm cli list`.

## Repo-Native Launcher Rule

If the repository already contains a launcher, **prefer it** over inventing ad-hoc commands.

Only fall back to raw `wezterm cli` when the launcher does not exist, is broken, or the user explicitly wants raw commands.

For Codex-specific headless observation patterns, see HOWTO-codex-worker-observation.md.
