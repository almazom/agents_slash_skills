# Runtime Map

`/home/pets/TOOLS/kanban_plan_skill_cli` is the runtime source of truth.

## Key paths

- `run`: main entrypoint
- `contracts/plan-request.schema.json`: input request contract
- `contracts/kanban.schema.json`: canonical generated plan contract
- `kit/`: portable docs, templates, examples, and prompts
- `scripts/install_skill.py`: installs the skill into `.agents` and `.codex`
- `scripts/pilot_feedback_loop.py`: repeated multi-project smoke loop

## Runtime outputs inside the target repo

The `plan` command writes or refreshes:

- `<planning_root>/kanban/<KANBAN-...>.json`
- `<planning_root>/kanban/latest`
- `<planning_root>/kanban-kit/`
- `<planning_root>/repository-mapping.json`

## Important behavior

- request JSON is validated before routing
- `minimal`, `standard`, or `complex` is selected deterministically
- the generated plan is validated against the materialized repo-local schema
- the active plan is reused when the request still matches unless `--force-new` is used
- timestamps use second precision and collision-safe suffixes for rapid repeated runs
- `plan` returns a user-facing summary payload, not just file creation side effects
- that summary payload may include `plan_path`, `summary_ru_short`, `next_skill`, `interactive_prompt`, and `resume_command`
- when those fields exist, they are the preferred operator-facing output contract
- for Codex, the handoff contract prefers `ask_user_question` and keeps `request_user_input` as the fallback when the session is in Plan mode
