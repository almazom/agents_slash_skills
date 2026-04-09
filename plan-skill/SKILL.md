---
name: plan-skill
description: Create or harden a decision-complete implementation plan using /home/pets/TOOLS/plan_skill_cli_v2. Use when the user wants a planning-first workflow, wants an implementation-ready markdown plan before coding, or wants the plan plus self-QA and quality-loop gates to produce one canonical IMPLEMENTATION_PLAN.md artifact.
---

# plan-skill

Use this skill as a thin orchestration layer over `/home/pets/TOOLS/plan_skill_cli_v2`.

The runtime is the source of truth for the planning workflow.
Do not duplicate the runtime planning logic inside this skill.

## Default workflow

1. Read [references/runtime-map.md](references/runtime-map.md) for the runtime contract and file layout.
2. Use `./run --repo /target/path "goal"` for the full pipeline.
3. Use stage CLIs only when you need to inspect or retry one layer:
   `./ps-intake`, `./ps-preflight`, `./ps-plan`, `./ps-self-qa`, `./ps-parallel-review`, `./ps-synthesize`, `./ps-quality-loop`, `./ps-export`.
4. Hand off the exported `IMPLEMENTATION_PLAN.md` as the only public artifact.
5. End with a next-step invitation:
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
- Prefer the full pipeline unless you are debugging one layer.
- If preflight leaves zero live reviewers, or any later gate returns a blocked outcome, surface the blocker instead of pretending the plan is ready.
- The completion summary should make the next split step obvious enough that the operator can continue without rereading the full chat.
- The completion payload should carry `phase`, `current_artifact`, `next_skill`, `next_command`, `interactive_prompt`, `interactive_options`, `handoff_required`, `resume_target`, `resume_command`, `handoff_intent`, `question_tool_variants`, and `notify_summary`.
- The skill should emit a harness-neutral question intent plus harness-specific tool variants so the same resume pattern works across Codex, Qwen, Gemini, Pi, or another harness.

## When to read extra references

- Read [references/runtime-map.md](references/runtime-map.md) first when you need the stage order, artifact locations, or install targets.
- Read [references/examples.md](references/examples.md) when you want copy-paste command patterns for common planning requests.
