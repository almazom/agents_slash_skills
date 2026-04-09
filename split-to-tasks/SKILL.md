---
name: split-to-tasks
description: Generate a Trello-style execution package from a Markdown IMPLEMENTATION_PLAN using /home/pets/TOOLS/split_to_tasks_skill_cli. Use when the user wants to split a plan into self-contained task cards, enforce a max size of 4 story points and about 4 hours per card, create kanban.json as the execution SSOT with derived state.json and progress.md, render a live board view, emit cards_catalog.md and trello_quality_gate.json, or produce a notify-me handoff after package generation.
---

# split-to-tasks

Use this skill as a thin wrapper over `/home/pets/TOOLS/split_to_tasks_skill_cli`.

The local CLI is the source of truth for:

- Markdown plan intake,
- Trello-style card generation,
- `kanban.json` SSOT initialization,
- derived `state.json`,
- `progress.md` rendering,
- live terminal board rendering,
- `cards_catalog.md`,
- `trello_quality_gate.json`,
- generated `AGENTS.md` plus `CLAUDE.md` and `GEMINI.md` aliases,
- simplification-first card shaping,
- fresh-view multi-lens package review,
- notify-me dry-run or send.

## Default workflow

1. Read [references/examples.md](references/examples.md) for command patterns.
2. Confirm the input file is named `IMPLEMENTATION_PLAN.md`.
3. Run the local CLI `build` command with absolute paths.
4. Inspect the generated package folder and key outputs:
   - `AGENTS.md`
   - `capability_progress.json`
   - `cards_catalog.md`
   - `trello_quality_gate.json`
   - `trello-cards/KICKOFF.md`
   - `trello-cards/BOARD.md`
   - `trello-cards/kanban.json`
   - `trello-cards/state.json`
   - `trello-cards/progress.md`
5. Keep `notify-me` in dry-run mode unless the user explicitly asks to send.
6. If the user wants to execute work, hand off to `implementation-skill` or start with `implementation-start`.
7. Emit one harness-neutral `handoff_intent` plus `question_tool_variants` that ask whether to resume with `implementation-skill`.
8. Let the active harness map that intent to its own question tool variant; treat Codex as `request_user_input` in Plan mode and keep `ask_user_question` as the generic default for Qwen, Gemini, Pi, Pi Mono, Claude Code, and OpenCode.
9. If the harness cannot present the required question, stop as blocked instead of degrading to plain text.

## Operating rules

- Treat `kanban.json` as the only writable execution SSOT.
- Treat `state.json` as derived output only.
- Treat `progress.md` and `BOARD.md` as derived views, not writable state.
- Do not allow cards above `4 story points` or about `4 hours`.
- Prefer the minimum safe card set; micro-cards and serial-by-convenience packages are quality defects.
- Prefer absolute paths in commands and summaries.
- Prefer the `implementation-start` and `implementation-stage` runtime commands for normal execution.
- Keep `transition` only as a low-level recovery path when package state must be repaired manually.
- Legacy `review` should be understood as `codex-review`.
- Trust the runtime handoff contract fields: `interactive_prompt`, `interactive_options`, `handoff_required`, `resume_target`, `resume_command`, `handoff_intent`, and `question_tool_variants`.

## When to read extra references

- Read [references/examples.md](references/examples.md) first for build, implementation, refresh, and summary commands.
