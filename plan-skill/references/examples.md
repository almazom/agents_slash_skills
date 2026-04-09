# Examples

Full pipeline against the current repo:

```bash
cd /home/pets/TOOLS/plan_skill_cli_v2
./run --repo /home/pets/TOOLS/plan_skill_cli_v2 "Add a regression test for the quality gate"
```

Typical handoff after planning:

```bash
cd /home/pets/TOOLS/split_to_tasks_skill_cli
PYTHONPATH=src python -m split_to_tasks_skill_cli build \
  --plan /abs/path/IMPLEMENTATION_PLAN.md \
  --output-root /abs/path/generated \
  --templates-root /home/pets/TOOLS/split_to_tasks_skill_cli/templates/trello \
  --notify-mode dry-run
```

Planning completion payload now includes:

- `phase=planning`
- `current_artifact=/abs/path/to/IMPLEMENTATION_PLAN.md`
- `next_skill=split-to-tasks`
- `next_command=<absolute split-to-tasks build command>`
- `interactive_prompt=Planning is complete. Start split-to-tasks now?`
- `interactive_options=[resume_now,pause_here]`
- `handoff_required=true`
- `resume_target=split-to-tasks`
- `resume_command=<same as next_command>`
- `handoff_intent.kind=ask_user_question`
- `handoff_intent.failure_policy.on_question_unavailable=block`
- `question_tool=ask_user_question`
- `question_tool_variants.codex.tool=request_user_input`
- `question_tool_variants.codex.mode_requirement=plan`
- `question_tool_variants.qwen.tool=ask_user_question`
- `question_tool_variants.claude.tool=ask_user_question`
- `question_tool_variants.opencode.tool=ask_user_question`
- `question_tool_fallback=block`

Retry only Layer 3 on an existing run:

```bash
cd /home/pets/TOOLS/plan_skill_cli_v2
./ps-quality-loop --run-dir /home/pets/TOOLS/plan_skill_cli_v2/runs/2026-03-27/example-run
```

Inspect reviewer availability and then rerun synthesis:

```bash
cd /home/pets/TOOLS/plan_skill_cli_v2
./ps-preflight --run-dir /home/pets/TOOLS/plan_skill_cli_v2/runs/2026-03-27/example-run
./ps-parallel-review --run-dir /home/pets/TOOLS/plan_skill_cli_v2/runs/2026-03-27/example-run
./ps-synthesize --run-dir /home/pets/TOOLS/plan_skill_cli_v2/runs/2026-03-27/example-run
```

Install the shared skill:

```bash
cd /home/pets/TOOLS/plan_skill_cli_v2
python3 scripts/install_skill.py
```

Run a live reviewer smoke test with a longer review budget:

```bash
cd /home/pets/TOOLS/plan_skill_cli_v2
PLAN_SKILL_REVIEW_TIMEOUT_SECONDS=60 ./run --repo /home/pets/TOOLS/plan_skill_cli_v2 "Smoke-test live reviewer synthesis"
```
