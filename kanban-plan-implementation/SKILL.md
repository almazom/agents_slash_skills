---
name: kanban-plan-implementation
description: Start or inspect implementation flow from a kanban JSON plan using /home/pets/TOOLS/kanban_plan_implementation_skill_cli, while keeping the kanban JSON as the execution entrypoint and target SSOT.
---

# kanban-plan-implementation

Use this skill as a thin wrapper over `/home/pets/TOOLS/kanban_plan_implementation_skill_cli`.

The runtime is the source of truth for:

- accepting a kanban JSON plan as the implementation entrypoint
- reconstructing truthful implementation status from that plan
- running the manager-owned sequential worker loop over direct kanban JSON SSOT

## Default workflow

1. Read [references/runtime-map.md](references/runtime-map.md).
2. Read [references/end-to-end-flow.md](references/end-to-end-flow.md) when the request is about plan handoff or start-of-implementation behavior.
3. Run `./run status --plan-file /abs/path/to/kanban.json` when you need the current implementation-oriented view.
4. If the user intent is full completion, non-stop execution, or `100%`, prefer `./run manage --plan-file ... --repo-root ...`.
5. Use `./run run --plan-file ... --repo-root ...` only for inspect-or-start-one-task behavior.
6. Treat the kanban JSON as the only writable execution SSOT.
7. Whenever the runtime returns `status_frame_ru`, surface those lines directly instead of paraphrasing them away.

## Commands

```bash
cd /home/pets/TOOLS/kanban_plan_implementation_skill_cli
./run status --plan-file /abs/path/to/kanban.json
```

```bash
cd /home/pets/TOOLS/kanban_plan_implementation_skill_cli
./run run --plan-file /abs/path/to/kanban.json --repo-root /abs/path/to/repo
```

```bash
cd /home/pets/TOOLS/kanban_plan_implementation_skill_cli
./run manage --plan-file /abs/path/to/kanban.json --repo-root /abs/path/to/repo
```
