# Examples

Build a package from a Markdown implementation plan:

```bash
cd /home/pets/TOOLS/split_to_tasks_skill_cli
PYTHONPATH=src python -m split_to_tasks_skill_cli build \
  --plan /abs/path/IMPLEMENTATION_PLAN.md \
  --output-root /abs/path/generated \
  --templates-root /home/pets/TOOLS/split_to_tasks_skill_cli/templates/trello \
  --notify-mode dry-run
```

Start implementation from the generated package:

```bash
cd /home/pets/TOOLS/split_to_tasks_skill_cli
PYTHONPATH=src python -m split_to_tasks_skill_cli implementation-start \
  --package /abs/path/generated/<plan-slug> \
  --repo-root /abs/path/to/repo
```

Build completion payload now also includes:

- `interactive_prompt=Task splitting is complete. Start implementation now?`
- `interactive_options=[resume_now,pause_here]`
- `handoff_required=true`
- `resume_target=implementation-skill`
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

Print the current handoff summary:

```bash
cd /home/pets/TOOLS/split_to_tasks_skill_cli
PYTHONPATH=src python -m split_to_tasks_skill_cli summary \
  --package /abs/path/generated/<plan-slug>
```

Advance the active card to simplify:

```bash
cd /home/pets/TOOLS/split_to_tasks_skill_cli
PYTHONPATH=src python -m split_to_tasks_skill_cli implementation-stage \
  --package /abs/path/generated/<plan-slug> \
  --card 0001 \
  --to simplify \
  --note "Implementation complete; run code-simplifier"
```

Refresh derived views and capability progress for an existing package:

```bash
cd /home/pets/TOOLS/split_to_tasks_skill_cli
PYTHONPATH=src python -m split_to_tasks_skill_cli refresh \
  --package /abs/path/generated/<plan-slug>
```

Render the live terminal board:

```bash
cd /home/pets/TOOLS/split_to_tasks_skill_cli
PYTHONPATH=src python -m split_to_tasks_skill_cli board \
  --package /abs/path/generated/<plan-slug>
```
