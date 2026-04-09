---
name: implementation-skill
description: Execute the current actionable Trello package card from /home/almaz/TOOLS/split_to_tasks_skill_cli, using implementation-start, implementation-stage, and implementation-status while keeping kanban.json as the only writable execution SSOT.
---

# implementation-skill

Use this skill as a thin wrapper over `/home/almaz/TOOLS/split_to_tasks_skill_cli`.

The local CLI is the source of truth for:

- package-aware implementation run startup,
- active card selection from `kanban.json`,
- run artifact creation under `implementation-runs/`,
- stage tracking through `in_progress -> simplify -> commit -> codex-review -> done`,
- derived `state.json`, `progress.md`, and `BOARD.md` refresh,
- runtime status inspection.

This skill is the guided orchestrator for normal execution.
The runtime owns SSOT-safe transitions and evidence.
The skill owns the ordered invocation of implementation, simplification, commit, and review steps.
For the review stage, prefer `codex_wp review` so the run stays on the proxy-aware Codex path.
If the user explicitly asks for non-stop, autonomous, or no-human-in-the-loop execution, switch to autonomous mode and keep chaining cards until no actionable card remains or a real blocker appears.
If the user asks for floating-pane observation, treat that as a default autonomous execution preference when `zellij` is available.

## Default workflow

1. Read `AGENTS.md`, `trello-cards/KICKOFF.md`, the current card markdown, and the live `kanban.json`.
2. Run `implementation-start` for the package.
3. Implement the current card and complete its verification steps.
4. Move the card to `simplify`.
5. Run `code-simplifier`.
6. Move the card to `commit`.
7. Run the commit workflow if the repo supports it.
8. Move the card to `codex-review`.
9. Run `codex_wp review` with the right scope for the stage, usually `--commit <sha>` after commit or `--uncommitted` when no commit exists yet.
10. Move the card to `done` only when the review loop is resolved.

## Operating rules

- Treat `kanban.json` as the only writable execution SSOT.
- Treat `implementation-runs/<run-id>/` as append-only evidence, not a second state source.
- Use `implementation-status` when there is any doubt about the active run or next action.
- Prefer `python3 -m split_to_tasks_skill_cli ...` for runtime commands when `python` is not guaranteed on `PATH`.
- Trust `next_skill`, `next_command`, `next_action`, `interactive_prompt`, `interactive_options`, `handoff_required`, `resume_target`, `resume_command`, and `handoff_intent` from the runtime payloads when deciding the next operator step.
- In interactive mode, emit and honor a harness-neutral `handoff_intent` at each implementation handoff using `Resume now` and `Pause here`.
- In autonomous mode, treat the handoff fields as audit metadata only; do not pause at `ready`, `simplify`, `commit`, `codex-review`, or between cards when a real `next_command` exists.
- In autonomous mode, prefer one active floating `zellij` pane for the current card or bounded stage when `zellij` is available; use the pane as an observation and control surface, not as state storage.
- Prefer pane names that include the card and stage, and prefer `zellij run -f --close-on-exit --block-until-exit --name <card-stage>` for bounded verification, review, and helper commands.
- Treat pane exit or close as a signal to inspect `implementation-status` and continue the loop immediately; do not wait for the user between panes when autonomous mode was requested.
- If `zellij` is unavailable, not attached, or pane launch/subscription fails, continue the same workflow directly in the harness instead of blocking execution.
- In autonomous mode, after a card reaches `done`, run `implementation-status`; if another card is `ready`, immediately run `implementation-start` for that card and continue the loop.
- If the active harness cannot present the required question, use a plain-text fallback in interactive mode instead of inventing a blocker. Do not stop for missing interactivity when autonomous mode was explicitly requested.
- If work is blocked, move the card to `blocked` with a real note and evidence.
- For review, prefer `codex_wp review` over raw `codex review` and over the `codex-review` wrapper unless the user explicitly asks for that wrapper.
- Treat `codex_wp review` as the proxy-safe default because it preserves the local `cdx` routing/auth path.
- If `code-simplifier`, commit, or `codex_wp review` cannot run, do not pretend success; stop with an honest note and leave the package in the real current stage.

## When to read extra references

- Read [references/examples.md](references/examples.md) first for command patterns.
