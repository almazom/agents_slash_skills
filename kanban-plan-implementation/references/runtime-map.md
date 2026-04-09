# Runtime Map

`/home/pets/TOOLS/kanban_plan_implementation_skill_cli` is the runtime source of truth.

## Current scope

- accept a kanban JSON path as the implementation entrypoint
- expose stable `run` and `status` commands
- expose stable `manage` for the non-stop manager-owned loop
- keep kanban JSON as the intended execution SSOT

## Key paths

- `run`: main entrypoint
- `src/kanban_plan_implementation_skill_cli/cli.py`: CLI surface
- `src/kanban_plan_implementation_skill_cli/runtime.py`: status and startup payload helpers
- `src/kanban_plan_implementation_skill_cli/manager.py`: sequential observed manager loop
- `skill_package/kanban-plan-implementation/references/end-to-end-flow.md`: plan-completion to implementation-start contract
- `scripts/install_skill.py`: install the global skill package
