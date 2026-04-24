---
name: kanban-plan
description: Create kanban-first repository plans by routing work into minimal, standard, or complex; materializing the portable kit into the repo planning root; validating the request; and writing a timestamped kanban JSON plus active pointer through /home/pets/TOOLS/kanban_plan_skill_cli.
triggers: kanban-plan, $kanban-plan, kanban plan, create kanban, kanban JSON, kanban_plan_skill_cli, kanban planning, kanban-first plan
---

# kanban-plan

Use this skill as a thin wrapper over `/home/pets/TOOLS/kanban_plan_skill_cli`.

The runtime is the source of truth for:

- routing the request into `minimal`, `standard`, or `complex`
- request validation
- active-plan reuse when the scope already matches
- timestamped kanban creation
- `latest` pointer updates
- repository mapping capture
- materialized portable-kit support files inside the target repo
- schema validation for generated plans

## Default workflow

1. Read [references/runtime-map.md](references/runtime-map.md).
2. Validate or inspect the request JSON when needed.
3. Run `./run plan --repo /abs/path/to/repo --request-file /abs/path/to/request.json`.
4. Inspect the returned summary JSON, especially:
   - `selected_template_family`
   - `output_path`
   - `plan_path`
   - `final_plan_file_path`
   - `latest_path`
   - `repository_mapping_path`
   - `materialized_kit_root`
   - `summary_ru_short`
   - `next_skill`
   - `interactive_prompt`
   - `resume_command`
   - `validation_ok`
5. Re-run with `--force-new` only when a new timestamped plan is explicitly required even though the active plan still matches.
6. Use `./run validate-plan --plan-file ...` when you need an explicit schema gate.

## Commands

```bash
cd /home/pets/TOOLS/kanban_plan_skill_cli
./run plan --repo /abs/path/to/repo --request-file /abs/path/to/request.json
```

```bash
cd /home/pets/TOOLS/kanban_plan_skill_cli
./run route --request-file /abs/path/to/request.json
```

```bash
cd /home/pets/TOOLS/kanban_plan_skill_cli
./run validate-request --request-file /abs/path/to/request.json
./run validate-plan --plan-file /abs/path/to/repo/.planning/kanban/KANBAN-....json
```

## Operating rules

- Treat the runtime repo as the planning logic SSOT.
- Treat the generated kanban JSON as the session plan SSOT inside the target repository.
- Keep the request contract explicit; do not improvise hidden routing inputs.
- Prefer reusing the active plan when the request still matches the current scope.
- Prefer `--force-new` only for explicit re-planning sessions.
- The materialized kit inside the target repo should stay aligned with the runtime kit.
- Prefer absolute paths in user-facing output. When `plan_path` exists, surface that value instead of a relative path.
- Prefer `final_plan_file_path` or `plan_path` for the first visible file-path line. Do not invent a repo-relative replacement.
- After a successful `plan` run, do not replace the runtime payload with a free-form summary. Surface the payload fields directly.
- When `summary_ru_short` is present, show those Russian bullets to the user instead of paraphrasing them away.
- When `interactive_prompt` and `resume_command` are present, show both so the implementation handoff is visible.
- The planning handoff now defaults to `./run manage ...` because the standard next step is full non-stop implementation, not single-task inspection.
- For Codex, prefer the native `ask_user_question` handoff when available and treat `request_user_input` in Plan mode as the fallback path.
- If the runtime reused the active plan, say that explicitly, but still show the same final payload fields.

## Output contract after `plan`

After `./run plan ...` succeeds, the user-facing result should contain, in this order:

1. One explicit line saying whether the plan was reused or newly created.
2. The absolute final plan file path from `plan_path`.
3. The `summary_ru_short` bullets.
4. The next skill name from `next_skill` when present.
5. The interactive question from `interactive_prompt` when present.
6. The exact `resume_command` when present.

Do not stop at a relative `KANBAN-....json` path.
Do not print a relative `Final plan file path` line when `final_plan_file_path` or `plan_path` is available.
Do not hide `summary_ru_short`.
Do not omit the handoff fields when they exist in the runtime payload.

## References

- [references/runtime-map.md](references/runtime-map.md)
- [references/examples.md](references/examples.md)
