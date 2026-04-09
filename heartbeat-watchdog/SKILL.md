---
name: heartbeat-watchdog
description: Use when the task is to run or inspect the global `heartbeat-watchdog` observer on WezTerm panes, files, JSONL session logs, or glob patterns with periodic heartbeats, runtime logs, status, tail, and stop control.
---

# Heartbeat Watchdog

Use this skill for the global observer CLI:

- `/home/almaz/.local/bin/heartbeat-watchdog`
- tool repo: `/home/almaz/TOOLS/heartbeat_watchdog`

This skill is thin by design:

- the CLI is the runtime source of truth;
- the skill chooses the right source adapter and command shape;
- notifications are optional and can be handed to `notify-me` after the run.

## Use it for

- WezTerm pane observation
- generic file change polling
- JSONL session observation for Codex / Claude / Pi
- glob-based file-set observation
- heartbeat logging with fixed count and interval

## Default source mapping

- WezTerm pane -> `--source wezterm-pane --pane-id <id>`
- one file -> `--source file --path /abs/path`
- session JSONL -> `--source jsonl-file --profile codex-jsonl|claude-jsonl|pi-jsonl --path /abs/path`
- file set -> `--source glob --pattern '.../**/...`

## Core commands

List capabilities:

```bash
/home/almaz/.local/bin/heartbeat-watchdog list-sources
```

Watch a pane:

```bash
/home/almaz/.local/bin/heartbeat-watchdog run --source wezterm-pane --pane-id 36 --every 30s --count 100
```

Watch a file:

```bash
/home/almaz/.local/bin/heartbeat-watchdog run --source file --path /abs/path/app.log --every 5m --count 100
```

Watch a Codex JSONL session:

```bash
/home/almaz/.local/bin/heartbeat-watchdog run --source jsonl-file --profile codex-jsonl --path /abs/path/rollout.jsonl --every 30s --count 20
```

Watch a glob:

```bash
/home/almaz/.local/bin/heartbeat-watchdog run --source glob --pattern '/abs/path/**/*.jsonl' --every 5m --count 100
```

Inspect latest run:

```bash
/home/almaz/.local/bin/heartbeat-watchdog status --latest
/home/almaz/.local/bin/heartbeat-watchdog tail --latest
```

Stop a run:

```bash
/home/almaz/.local/bin/heartbeat-watchdog stop --run-id <run-id>
```

## Decision rules

- Prefer `wezterm-pane` when the user points to a live pane id.
- Prefer `jsonl-file` when the user points to a session log and names Codex, Claude, or Pi.
- Prefer `glob` when the user wants to observe file creation or a changing set of files.
- Prefer `file` when the user points to one concrete log or text file.
- If the user wants the resulting heartbeat log sent out, use `notify-me` after the run instead of pushing transport logic into the observer core.
