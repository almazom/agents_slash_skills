# REFERENCE — Shell Integration and User Vars

How WezTerm tracks pane state (cwd, command, user) via escape sequences.

## Why This Matters for CLI Observation

When `wezterm cli list --format json` reports `cwd: "file://hostname/home/user"`, that primarily comes from **OSC 7**. However, `LocalPane` also falls back to process introspection (reading `/proc/<pid>/cwd` on Linux) when no OSC 7 cwd has been set. So the `cwd` field is usable even without shell integration, but OSC 7 makes it more reliable.

## Shell Integration

WezTerm shell integration enables:
- **OSC 7**: advises terminal of current working directory → new tabs/panes inherit the same cwd
- **OSC 133**: defines semantic zones (Prompt, Input, Output) with subcommands for prompt kinds, command status, and fresh-line handling
- **OSC 1337**: sets arbitrary user vars per pane (base64-encoded UTF-8 values)

Shell integration is auto-enabled on Fedora, Debian, and Arch packages for Bash/Zsh.
On other systems, source the integration script from the wezterm repo.

## OSC 7 — Working Directory

Format: `printf "\033]7;file://HOSTNAME/CURRENT/DIR\033\\"`

The value is parsed as a URL (`url::Url::parse`). If parsing fails, the cwd silently becomes `None`. When set, spawning a new tab inherits the current working directory.

## OSC 133 — Semantic Prompt Zones (source: `wezterm-escape-parser/src/osc.rs`)

The parser handles these subcommands:

| Subcommand | Semantic Type | Behavior |
|---|---|---|
| `133;A[;aid=...][;cl=...]` | Prompt | FreshLine + start prompt |
| `133;P[;k=i\|r\|c\|s]` | Prompt | Start prompt (kind: initial/right/continuation/secondary) |
| `133;B` | Input | End prompt, start input until next marker |
| `133;I` | Input | End prompt, start input until end of line (resets on next newline) |
| `133;C[;aid=...]` | Output | End input, start output |
| `133;D;<status>[;err=...][;aid=...]` | — | Command exit status (parsed but no semantic state change in current runtime) |
| `133;L` | — | FreshLine (no-op if already at left margin) |
| `133;N[;aid=...][;cl=line\|m\|v\|w]` | Prompt | End command + FreshLine + start new prompt |

The three runtime semantic types are: `Output` (default), `Input`, and `Prompt`. Zone computation trims trailing blank `Output` cells and merges adjacent same-type runs across physical lines.

## OSC 1337 — User Vars

Format: `\033]1337;SetUserVar=<name>=<base64-utf8-value>\033\\`

The parser accepts **arbitrary** variable names (not only `WEZTERM_*`). The name is everything before the first `=`. The value is base64-decoded (with `allow_trailing_bits`) and must be valid UTF-8. Setting the same name again overwrites the prior value.

Common shell-script conventions (not enforced by parser):

| Var | Value |
|---|---|
| `WEZTERM_PROG` | Command line being executed |
| `WEZTERM_USER` | Output of `id -un` (username) |
| `WEZTERM_HOST` | Output of `hostname` |
| `WEZTERM_IN_TMUX` | `1` if inside tmux, `0` otherwise |

Access via Lua: `pane:get_user_vars()` or the `user_vars` field in `PaneInformation`.

The parser also recognizes iTerm2 `OSC 1337 CurrentDir=...`, but the runtime does **not** use it to set pane cwd — only `OSC 7` does that.
