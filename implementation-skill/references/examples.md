# Examples

Start the current implementation run:

```bash
cd /home/almaz/TOOLS/split_to_tasks_skill_cli
PYTHONPATH=src python3 -m split_to_tasks_skill_cli implementation-start \
  --package /abs/path/generated/<plan-slug> \
  --repo-root /abs/path/to/repo
```

Implementation start/status payloads now also include:

- `interactive_prompt=<stage-specific resume question>`
- `interactive_options=[resume_now,pause_here]`
- `handoff_required=true` when a real next step exists
- `resume_target=<next skill for the current stage>`
- `resume_command=<same as next_command>`
- `handoff_intent.kind=ask_user_question`
- `handoff_intent.failure_policy.on_question_unavailable=block`
- `question_tool=ask_user_question`
- `question_tool_fallback=block`

When the user explicitly asks for non-stop or no-human-in-the-loop execution:

- treat the handoff payload as informational, not a pause point
- keep following `next_command` through `simplify`, `commit`, `codex_wp review`, and `done`
- after `done`, run `implementation-status`; if a new card is `ready`, start it immediately
- stop only when no actionable card remains or a real blocker appears

Run the review stage through the proxy-aware wrapper:

```bash
cd /abs/path/to/repo
codex_wp review --commit <sha>
```

If the stage is intentionally reviewing dirty worktree changes:

```bash
cd /abs/path/to/repo
codex_wp review --uncommitted
```

Advance the active card to simplify:

```bash
cd /home/almaz/TOOLS/split_to_tasks_skill_cli
PYTHONPATH=src python3 -m split_to_tasks_skill_cli implementation-stage \
  --package /abs/path/generated/<plan-slug> \
  --card 0001 \
  --to simplify \
  --note "Implementation complete; run code-simplifier"
```

Check the current implementation runtime status:

```bash
cd /home/almaz/TOOLS/split_to_tasks_skill_cli
PYTHONPATH=src python3 -m split_to_tasks_skill_cli implementation-status \
  --package /abs/path/generated/<plan-slug>
```

Run a bounded stage inside a floating `zellij` pane when autonomous mode should stay observable:

```bash
zellij run -f --close-on-exit --block-until-exit \
  --name card-0002-verify \
  --cwd /abs/path/to/repo \
  -- bash -lc 'python3 -m compileall bridge/telegram_dm_mirror/main.py'
```
