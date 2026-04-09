# Examples

Full pipeline against the current repo:

```bash
cd /home/almaz/TOOLS/plan_skill_cli_v2
./run --repo /home/almaz/TOOLS/plan_skill_cli_v2 "Add a regression test for the quality gate"
```

Typical handoff after planning:

```bash
cd /home/almaz/TOOLS/split_to_tasks_skill_cli
PYTHONPATH=src python -m split_to_tasks_skill_cli build \
  --plan /abs/path/IMPLEMENTATION_PLAN.md \
  --output-root /abs/path/generated \
  --templates-root /home/almaz/TOOLS/split_to_tasks_skill_cli/templates/trello \
  --notify-mode dry-run
```

When that split package is generated, the developer onboarding entry should be:

- `trello-cards/KICKOFF.md` as the single entry point
- `START_HERE.md` only as a redirect if present
- `trello-cards/README.md` only as a local helper

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

The question above is emitted only after:

- `confidence >= 95`
- `satisfaction >= 95`
- internal `split-to-tasks build` dry-run passes with `quality_score >= 95`

If the split dry-run fails, the run stays blocked and no interactive handoff is emitted.

Retry only Layer 3 on an existing run:

```bash
cd /home/almaz/TOOLS/plan_skill_cli_v2
./ps-quality-loop --run-dir /home/almaz/TOOLS/plan_skill_cli_v2/runs/2026-03-27/example-run
```

Inspect reviewer availability and then rerun synthesis:

```bash
cd /home/almaz/TOOLS/plan_skill_cli_v2
./ps-preflight --run-dir /home/almaz/TOOLS/plan_skill_cli_v2/runs/2026-03-27/example-run
./ps-parallel-review --run-dir /home/almaz/TOOLS/plan_skill_cli_v2/runs/2026-03-27/example-run
./ps-synthesize --run-dir /home/almaz/TOOLS/plan_skill_cli_v2/runs/2026-03-27/example-run
```

Install the shared skill:

```bash
cd /home/almaz/TOOLS/plan_skill_cli_v2
python3 scripts/install_skill.py --agents-root /home/almaz/.agents/skills --codex-root /home/almaz/.codex/skills
```

Run a live reviewer smoke test with a longer review budget:

```bash
cd /home/almaz/TOOLS/plan_skill_cli_v2
PLAN_SKILL_REVIEW_TIMEOUT_SECONDS=60 ./run --repo /home/almaz/TOOLS/plan_skill_cli_v2 "Smoke-test live reviewer synthesis"
```
