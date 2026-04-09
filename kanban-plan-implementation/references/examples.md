# Examples

## Show status from a kanban JSON plan

```bash
cd /home/pets/TOOLS/kanban_plan_implementation_skill_cli
./run status --plan-file /abs/path/to/kanban.json
```

## Start the implementation runtime

```bash
cd /home/pets/TOOLS/kanban_plan_implementation_skill_cli
./run run --plan-file /abs/path/to/kanban.json --repo-root /abs/path/to/repo
```

Use this only when the operator explicitly wants to inspect or initialize one current task.

## Run the non-stop manager loop

```bash
cd /home/pets/TOOLS/kanban_plan_implementation_skill_cli
./run manage --plan-file /abs/path/to/kanban.json --repo-root /abs/path/to/repo
```

Use this as the default when the user asks to continue to `100%`, keep going non-stop, or finish all remaining tasks.

When the runtime returns `status_frame_ru`, print those lines directly so the operator always sees:

- progress bar
- current mode
- current task
- done count
- remaining count
- active or blocked state
