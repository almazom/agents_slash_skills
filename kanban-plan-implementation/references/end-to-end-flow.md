# End-to-End Flow

This flow starts when `kanban-plan` finishes and ends when `kanban-plan-implementation` takes control of execution.

## 1. Plan completion output

`kanban-plan` finishes by returning:

- a short Russian summary in `summary_ru_short`
- an absolute path in `plan_path`
- a `next_skill` value of `kanban-plan-implementation`
- a `next_command` and `resume_command`
- a `recommended_start_mode` value of `manage`
- a handoff contract in `handoff_intent`

The short Russian summary is the user-facing handoff surface.
It includes:

- the selected template family
- the goal
- a visual progress bar
- TODO / DOING / DONE counts
- acceptance criteria count
- the absolute active JSON path
- a note that `latest` was updated
- the next suggested step

## 2. Interactive question

When `kanban-plan` runs with `--handoff-mode ask`, it emits:

- `interactive_prompt`
- `interactive_options`
- `question_tool_variants`

The intended question is:

`План готов. Запустить реализацию через kanban-plan-implementation?`

The harness may map this to its native ask-user tool.
If the question tool is unavailable, the neutral fallback is to pause instead of inventing hidden state.

## 3. Implementation start

There are two valid start modes.
The default after a normal planning handoff is `manage`.

### Single-task startup

```bash
cd /home/pets/TOOLS/kanban_plan_implementation_skill_cli
./run run --plan-file /abs/path/to/kanban.json --repo-root /abs/path/to/repo
```

Use this when you want to initialize execution around the next actionable task and inspect the payload.
This is not the default for requests like "доведи до 100%" or "continue non-stop".

### Non-stop manager mode

```bash
cd /home/pets/TOOLS/kanban_plan_implementation_skill_cli
./run manage --plan-file /abs/path/to/kanban.json --repo-root /abs/path/to/repo
```

Use this when the manager should continue task-by-task without stopping between tasks unless a real blocker appears.
This is the preferred default for normal implementation handoff from `kanban-plan`.

## 4. SSOT discipline

`kanban.json` is the only writable execution source of truth.

That means:

- task movement across `TODO`, `DOING`, and `DONE` happens only in `kanban.json`
- task execution fields such as `execution_status`, `assigned_worker`, `started_at`, `updated_at`, and `completed_at` live only in `kanban.json`
- manager lifecycle state lives in `execution`
- manager observations and blocker/completion history live in `execution.history`

No separate package state file, shadow board, or external progress ledger is allowed to become authoritative.

## 5. Manager and worker roles

The manager owns:

- next-task selection
- worker launch
- observation
- blocker detection
- task close / block transitions
- progression to the next task

The worker owns:

- implementation of one assigned task
- repo changes needed for that task
- task-scoped verification work

The worker must not choose the next task or edit kanban state by itself.

## 6. User-facing status

`./run status` must always show:

- a visual progress bar
- the active mode (`status`, `run`, or `manage`)
- implemented task count
- a preview of completed task ids
- the current active task
- the remaining task count

When present, `status_frame_ru` is the canonical user-facing status surface and should be printed directly instead of rephrased away.

This keeps the visible status aligned with the same `kanban.json` that the manager is updating.
