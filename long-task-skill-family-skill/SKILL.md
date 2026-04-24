---
name: long-task-skill-family-skill
description: Run a durable manager-owned long session across `plan-skill`, `split-to-tasks`, and manager-owned implementation with `session_state.json`, reuse-first pane policy, and 95% phase gates.
triggers: long-task-skill-family-skill, $long-task-skill-family-skill, long task family, three-stage family, plan split implement, long session, skill family, plan-skill split-to-tasks implementation, durable long session
---

# long-task-skill-family-skill

Use this skill as the canonical single entry point for the long three-stage family.

## Skill Trace

- Follow the governing `AGENTS.md` skill-trace contract when one exists.
- Fallback examples: `🚀⬜ [skill:long-task-skill-family-skill] ON ...`, `🛠️⬜ [skill:long-task-skill-family-skill] STEP ...`, `✅⬜ [skill:long-task-skill-family-skill] DONE ...`.

## Runtime Root

- `/home/pets/TOOLS/long-task-skill-family-skill`

## What This Skill Owns

- one durable `runs/<timestamp>-<slug>/` root per request
- `session_state.json` as orchestration SSOT across all three phases
- `HIGH_LEVEL_EXPECTATION.md`, prompt ledger, observer summaries, and notify payloads
- readiness gates between:
  - planning -> split
  - split -> implementation
- reuse-first policy for one visible `Tahir` worker pane under `Shehroz`

## What This Skill Does Not Replace

- `plan-skill` still owns planning runtime logic
- `split-to-tasks` still owns package generation logic
- `implementation-manager-skill` still owns manager-run implementation execution
- `cron-skill` still owns scheduled observation job CRUD

This skill coordinates those runtimes through one durable state model.

## Core Rules

- `session_state.json` is the orchestration SSOT.
- `kanban.json` remains the execution SSOT inside the package.
- `state.json`, `progress.md`, and `BOARD.md` remain derived views.
- Each phase must pass readiness at `>=95` before the next phase can start.
- Reuse the same visible `Tahir` pane when truthful.
- Do not create new panes or new worker contexts by habit.
- When the next bounded task, phase, or recovery rung is already clear from the
  run state, the manager must take that next step instead of asking the
  operator whether to continue.
- Asking "move to the next task/card/phase?" is not a valid default for this
  skill while the workstream is still open and the next bounded action is
  already shaped.
- Cron wakeups must target a prompt-ready dedicated manager wakeup pane. Do
  not point scheduled wakeups at a busy outer control pane and then treat
  `prompt_not_ready` as acceptable.
- Keep minute local summaries available.
- Keep 15-minute Mattermost-ready status payloads available.

## Default Workflow

1. Create a run root with `start`.
2. Run planning through the existing `plan-skill` runtime.
3. Register and gate-check the produced `IMPLEMENTATION_PLAN.md`.
4. Run package generation through `split-to-tasks`.
5. Register and gate-check the generated package.
6. Start or resume the manager-owned implementation flow.
7. Chain into the next bounded step automatically whenever run truth already
   identifies it.
8. Use `schedule`, `observe`, `notify`, `status`, and `resume` as the durable
   re-entry surface.

## Commands

Read [references/examples.md](references/examples.md) first for copy-paste command shapes.

Main CLI:

```bash
cd /home/pets/TOOLS/long-task-skill-family-skill
PYTHONPATH=src python -m long_task_skill_family_skill --help
```

## State Authority Split

- `session_state.json`: long-run family orchestration truth
- `phase-artifacts/plan/IMPLEMENTATION_PLAN.md`: copied planning artifact
- `phase-artifacts/split/package/`: copied package artifact
- `kanban.json`: execution truth for package implementation

## When To Read Extra References

- Read [references/examples.md](references/examples.md) for exact commands.
- Read [references/state-contract.md](references/state-contract.md) when you need the durable run and resume rules.
