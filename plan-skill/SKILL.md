---
name: plan-skill
description: Create or harden a decision-complete implementation plan using the installed `plan_skill_cli_v2` runtime. Resolve the runtime root by preferring `/home/pets/TOOLS/plan_skill_cli_v2` and falling back to `/home/almaz/TOOLS/plan_skill_cli_v2` when needed. Use when the user wants a planning-first workflow, wants an implementation-ready markdown plan before coding, or wants the plan plus self-QA and quality-loop gates to produce one canonical IMPLEMENTATION_PLAN.md artifact.
---

# plan-skill

Use this skill as a thin orchestration layer over the installed `plan_skill_cli_v2` runtime.

Runtime root resolution order:

1. `/home/pets/TOOLS/plan_skill_cli_v2`
2. `/home/almaz/TOOLS/plan_skill_cli_v2`

If neither path exists, stop as blocked and say the runtime is unavailable.

The runtime is the source of truth for the planning workflow.
Do not duplicate the runtime planning logic inside this skill.
The runtime requires `python >= 3.11`; prefer launchers that already resolve to `python3.11`.

## Default workflow

1. Read [references/runtime-map.md](references/runtime-map.md) for the runtime contract and file layout.
2. Use `./run --repo /target/path "goal"` for the full pipeline.
3. Use stage CLIs only when you need to inspect or retry one layer:
   `./ps-intake`, `./ps-preflight`, `./ps-plan`, `./ps-self-qa`, `./ps-parallel-review`, `./ps-synthesize`, `./ps-quality-loop`, `./ps-export`.
4. Hand off the exported `IMPLEMENTATION_PLAN.md` as the only public artifact.
5. End with a next-step invitation:
   - ask the split handoff question only after both gates pass: plan quality `95+` and split package quality `95+`,
   - point to the exported `IMPLEMENTATION_PLAN.md`,
   - show the `split-to-tasks` command with absolute paths,
   - expose the same next-step data in the completion payload,
   - emit one harness-neutral `handoff_intent` plus `question_tool_variants`,
   - let the active harness map that intent to its own question tool variant,
   - treat Codex as `request_user_input` in Plan mode and keep `ask_user_question` as the generic default for Qwen, Gemini, Pi, Pi Mono, Claude Code, and OpenCode,
   - and if the harness cannot present the required question, stop as blocked instead of degrading to plain text.

## Operating rules

- Keep the final user-facing artifact to one canonical `IMPLEMENTATION_PLAN.md`.
- Treat `PROTOCOL.json` in the runtime repo as the stage and contract SSOT.
- Treat `<runtime_root>/skill_package/plan-skill/` as the canonical skill source.
- Installed copies under `.agents` and `.codex` should be synced from the runtime repo, not edited by hand unless you are explicitly repairing the installed copy after updating the source.
- Prefer the full pipeline unless you are debugging one layer.
- If preflight leaves zero live reviewers, or any later gate returns a blocked outcome, surface the blocker instead of pretending the plan is ready.
- `ps-quality-loop` must run the real `split-to-tasks build` dry-run and keep improving the plan until combined readiness reaches `95+` or the bounded iteration budget is exhausted.
- When planning for a downstream `split-to-tasks` package, assume the package onboarding must center on one file: `trello-cards/KICKOFF.md`.
- In that downstream package model, `KICKOFF.md` should explain the package purpose, the high-level goal, folder reading order, the meanings of `BOARD.md`, `kanban.json`, and card files, and the recommended developer execution order.
- In that downstream package model, `START_HERE.md` may exist only as a short redirect to `trello-cards/KICKOFF.md`, and `trello-cards/README.md` should stay a local helper instead of a competing entry point.
- The completion summary should make the next split step obvious enough that the operator can continue without rereading the full chat.
- The completion payload should carry `phase`, `current_artifact`, `next_skill`, `next_command`, `interactive_prompt`, `interactive_options`, `handoff_required`, `resume_target`, `resume_command`, `handoff_intent`, `question_tool_variants`, and `notify_summary`.
- The skill should emit a harness-neutral question intent plus harness-specific tool variants so the same resume pattern works across Codex, Qwen, Gemini, Pi, or another harness.

## When to read extra references

- Read [references/runtime-map.md](references/runtime-map.md) first when you need the stage order, artifact locations, or install targets.
- Read [references/examples.md](references/examples.md) when you want copy-paste command patterns for common planning requests.
