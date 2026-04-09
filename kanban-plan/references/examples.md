# Examples

## Normal plan run

```bash
cd /home/pets/TOOLS/kanban_plan_skill_cli
./run plan \
  --repo /abs/path/to/repo \
  --request-file /abs/path/to/plan-request.json
```

Expected user-facing output shape after the command succeeds:

- say whether the active plan was reused or a fresh one was created
- show the absolute `final_plan_file_path` or `plan_path` as the first visible file-path line
- show all `summary_ru_short` bullets
- show `next_skill` when present
- show `interactive_prompt` when present
- show the exact `resume_command` when present
- do not replace the file path with a repo-relative `KANBAN-...json`
- expect the default handoff command to use `./run manage ...`
- for Codex, expect the handoff metadata to prefer `ask_user_question` and keep `request_user_input` as the Plan-mode fallback

## Force a fresh timestamped plan

```bash
cd /home/pets/TOOLS/kanban_plan_skill_cli
./run plan \
  --repo /abs/path/to/repo \
  --request-file /abs/path/to/plan-request.json \
  --force-new
```

## Route only

```bash
cd /home/pets/TOOLS/kanban_plan_skill_cli
./run route --request-file /abs/path/to/plan-request.json
```

## Validate an existing request or plan

```bash
cd /home/pets/TOOLS/kanban_plan_skill_cli
./run validate-request --request-file /abs/path/to/plan-request.json
./run validate-plan --plan-file /abs/path/to/repo/.planning/kanban/KANBAN-2026-04-07-103015.json
```
