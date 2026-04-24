---
name: cron-skill
description: Use when the user wants to create, inspect, update, cancel, remove, or debug scheduled Cron pilot jobs for Codex CLI through the shared `codex-cron` runtime in `/home/pets/TOOLS/manager_wezterm_cli`. Triggers on `cron-skill`, `CronCreate`, scheduled Codex jobs, cron pilot, `codex-cron`, `cron_create`, `cron_list`, `cron_update`, `cron_cancel`, `cron_nuke`, recurring follow-up worker runs, or requests to make a scheduled Codex task visible through MCP and `crontab`.
triggers: cron-skill, $cron-skill, CronCreate, codex-cron, cron pilot, scheduled Codex, cron_create, cron_list, cron_update, cron_cancel, cron_nuke, cron_fire_now, cron_doctor, scheduled task, recurring Codex worker, crontab codex
---

# Cron Skill

Use this skill for the shared temp-folder CronCreate pilot runtime on `pets`.

Source of truth:

- repo: `/home/pets/TOOLS/manager_wezterm_cli`
- CLI: `/home/pets/TOOLS/manager_wezterm_cli/bin/codex-cron`
- MCP server: `/home/pets/TOOLS/manager_wezterm_cli/bin/codex-cron-mcp`
- runtime card: `/home/pets/TOOLS/manager_wezterm_cli/.MEMORY/ops/0033-codex-cron-pilot-runtime-and-interfaces.md`

## Claude Code

- Claude Code discovers personal skills from `~/.claude/skills/`.
- Mirror this shared skill into Claude Code with a symlink at `~/.claude/skills/cron-skill -> ~/.agents/skills/cron-skill`.
- In Claude Code prefer `/cron-skill` or a natural-language request that mentions scheduled Codex jobs, CronCreate, `codex-cron`, cron CRUD, or MCP-backed cron scheduling.
- Do not expect `$cron-skill` syntax to work in Claude Code.

## Skill Trace

- Follow the governing `AGENTS.md` skill-trace contract when one exists.
- Fallback examples: `🚀⬜ [skill:cron-skill] ON ...`, `🛠️⬜ [skill:cron-skill] STEP ...`, `✅⬜ [skill:cron-skill] DONE ...`.

## Read Before Substantial Work

1. `/home/pets/TOOLS/manager_wezterm_cli/AURA.md`
2. `/home/pets/TOOLS/manager_wezterm_cli/.MEMORY/ops/0033-codex-cron-pilot-runtime-and-interfaces.md`
3. only the relevant files under `/home/pets/TOOLS/manager_wezterm_cli/tests/` when behavior or regressions matter

## Core Rules

- Prefer `codex-cron` over hand-editing `crontab` for pilot jobs.
- Treat `.claude/scheduled_tasks.json` as the scheduler registry for this pilot.
- Treat `tmp/cron-pilot-project/` as project/task truth and `/tmp/codex-cron-pilot/` as disposable fire-time truth.
- Use `cancel` when the job should stop firing but history should remain.
- Use `nuke` when the job, its temp task files, and its runtime artifacts should all be removed.
- Do not claim wakeup is healthy unless the fire artifact shows `manager_wakeup.proved=true`.
- For real cron fires, remember that `crontab` does not inherit the full interactive shell environment; prefer the stored job paths and artifact truth over assumptions.

## Common Commands

Create a pilot job:

```bash
cd /home/pets/TOOLS/manager_wezterm_cli && bin/codex-cron create --manager-pane 212 --schedule '*/2 * * * *' --json
```

List jobs:

```bash
cd /home/pets/TOOLS/manager_wezterm_cli && bin/codex-cron list --json
```

Get one job:

```bash
cd /home/pets/TOOLS/manager_wezterm_cli && bin/codex-cron get --job-id <job-id> --json
```

Update a job:

```bash
cd /home/pets/TOOLS/manager_wezterm_cli && bin/codex-cron update --job-id <job-id> --schedule '*/5 * * * *' --json
```

Cancel a job:

```bash
cd /home/pets/TOOLS/manager_wezterm_cli && bin/codex-cron cancel --job-id <job-id> --json
```

Nuke a job:

```bash
cd /home/pets/TOOLS/manager_wezterm_cli && bin/codex-cron nuke --job-id <job-id> --json
```

Run one job immediately:

```bash
cd /home/pets/TOOLS/manager_wezterm_cli && bin/codex-cron fire-now --job-id <job-id> --json
```

Inspect runtime health:

```bash
cd /home/pets/TOOLS/manager_wezterm_cli && bin/codex-cron doctor --json
```

Register the MCP server in Codex:

```bash
codex mcp add cronpilot -- /home/pets/TOOLS/manager_wezterm_cli/bin/codex-cron-mcp
```

## MCP Tools

Current pilot tools:

- `cron_create`
- `cron_get`
- `cron_list`
- `cron_update`
- `cron_cancel`
- `cron_nuke`
- `cron_fire_now`
- `cron_doctor`

## Decision Rules

- user wants a scheduled Codex follow-up run -> `create`
- user wants all jobs or current state -> `list`
- user wants one job's exact state -> `get`
- user wants to change schedule/prompt/panes -> `update`
- user wants to stop future fires but keep history -> `cancel`
- user wants to fully remove the job and temp artifacts -> `nuke`
- user wants a quick smoke without waiting for cron -> `fire-now`
- user wants to connect the pilot to Codex CLI -> `codex mcp add ... codex-cron-mcp`

## Current Known Truth

- The pilot backend is currently `crontab`.
- The current CLI supports full CRUD plus `fire-now` and `doctor`.
- The current CLI supports `30s` and `60s` cadence. `30s` is implemented as two `crontab` slots: immediate plus `sleep 30`.
- The current MCP server exposes the same lifecycle through stdio MCP.
- The follow-up worker path is currently headless `codex_wp exec`, not a visible worker pane by default.
- Live cron firing has already been proven; the remaining live edge is WezTerm wakeup transport health under cron if the mux env is incomplete.
- Fire-time prompts can now consume pane context via `{{WORKER_PANE_SNAPSHOT}}`, `{{WORKER_PANE_SNAPSHOT_PATH}}`, `{{WORKER_PANE_RESOLUTION}}`, `{{FIRE_SLOT_SECONDS}}`, `{{FIRE_ID}}`, `{{RUN_ROOT}}`, or `{{AUTO_FIRE_CONTEXT}}`.
