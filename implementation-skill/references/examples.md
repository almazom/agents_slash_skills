# Examples

Start the current implementation run:

```bash
cd /home/pets/TOOLS/split_to_tasks_skill_cli && PYTHONPATH=src python -m split_to_tasks_skill_cli implementation-start --package /abs/path/generated/<plan-slug> --repo-root /abs/path/to/repo
```

Check the live runtime status before any resume:

```bash
cd /home/pets/TOOLS/split_to_tasks_skill_cli && PYTHONPATH=src python -m split_to_tasks_skill_cli implementation-status --package /abs/path/generated/<plan-slug>
```

Implementation start/status payloads now also include:

- `current_card=<active card id>`
- `current_stage=<real runtime stage>`
- `next_command=<canonical next shell command>`
- `resume_command=<same as next_command when a real resume exists>`
- `interactive_prompt=<stage-specific resume question>`
- `interactive_options=[resume_now,pause_here]`
- `handoff_required=true` when a real next step exists
- `resume_target=<next skill for the current stage>`
- `handoff_intent.kind=ask_user_question`
- `handoff_intent.failure_policy.on_question_unavailable=block`
- `question_tool=ask_user_question`
- `question_tool_fallback=block`

If the payload already reports `in_progress`, `simplify`, `commit`, or `codex-review`:

- follow `next_command` or `resume_command`
- do not restart with a fresh `implementation-start`
- keep the package in its honest current stage

When the user explicitly asks for non-stop or no-human-in-the-loop execution:

- treat the handoff payload as informational, not a pause point
- keep following `next_command` through `simplify`, `commit`, `codex-review`, and `done`
- after `done`, run `implementation-status`; if a new card is `ready`, start it immediately
- stop only when no actionable card remains or a real blocker appears
- if the primary review path fails, use a real local fallback only when it produces a review artifact; otherwise stop honestly at the review stage

Start the runtime in manager-owned autonomous mode:

```bash
cd /home/pets/TOOLS/split_to_tasks_skill_cli && PYTHONPATH=src python -m split_to_tasks_skill_cli implementation-start --package /abs/path/generated/<plan-slug> --repo-root /abs/path/to/repo --execution-mode autonomous_managed
```

Advance the active card to simplify:

```bash
cd /home/pets/TOOLS/split_to_tasks_skill_cli && PYTHONPATH=src python -m split_to_tasks_skill_cli implementation-stage --package /abs/path/generated/<plan-slug> --card 0001 --to simplify --note "Implementation complete; run code-simplifier"
```

When this skill is used inside a manager-owned run:

- stay card-scoped
- do not take ownership of next-card selection
- do not own package lifecycle or git stage movement
