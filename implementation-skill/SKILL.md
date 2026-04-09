---
name: implementation-skill
description: Execute the current actionable Trello package card from /home/pets/TOOLS/split_to_tasks_skill_cli, using implementation-start, implementation-stage, and implementation-status while keeping kanban.json as the only writable execution SSOT.
---

# implementation-skill

Use this skill as a thin wrapper over `/home/pets/TOOLS/split_to_tasks_skill_cli`.

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
If the user explicitly asks for non-stop, autonomous, or no-human-in-the-loop execution, switch to autonomous mode and keep chaining cards until no actionable card remains or a real blocker appears.
If the user wants a long manager-owned observed session with floating `zellij` workers, prefer the separate `implementation-manager-skill` instead of stretching this skill into a manager/worker hybrid.

## Default workflow

1. Read `AGENTS.md`, `trello-cards/KICKOFF.md`, the current card markdown, and the live `kanban.json`.
2. Run `implementation-status` first when there is any doubt about the active card or stage.
3. Run `implementation-start` only when there is no active run or when the runtime says the next card is `ready`.
4. Implement the current card and complete its verification steps.
5. Move the card to `simplify`.
6. Run `code-simplifier`.
7. Move the card to `commit`.
8. Run the commit workflow if the repo supports it.
9. Move the card to `codex-review`.
10. Run `codex-review` or a real locally supported fallback when the primary review path fails.
11. Move the card to `done` only when the review loop is resolved.

## Operating rules

- Treat `kanban.json` as the only writable execution SSOT.
- Treat `implementation-runs/<run-id>/` as append-only evidence, not a second state source.
- Use `implementation-status` when there is any doubt about the active run or next action.
- Trust `next_skill`, `next_command`, `next_action`, `interactive_prompt`, `interactive_options`, `handoff_required`, `resume_target`, `resume_command`, and `handoff_intent` from the runtime payloads when deciding the next operator step.
- Keep operator-facing launch and resume commands as one-line absolute shell commands or wrapper scripts.
- If the runtime already reports `in_progress`, `simplify`, `commit`, or `codex-review`, resume from `next_command` or `resume_command` instead of forcing a fresh `implementation-start`.
- In interactive mode, emit and honor a harness-neutral `handoff_intent` at each implementation handoff using `Resume now` and `Pause here`.
- In autonomous mode, treat the handoff fields as audit metadata only; do not pause at `ready`, `simplify`, `commit`, `codex-review`, or between cards when a real `next_command` exists.
- In autonomous mode, after a card reaches `done`, run `implementation-status`; if another card is `ready`, immediately run `implementation-start` for that card and continue the loop.
- If the active harness cannot present the required question, use a plain-text fallback in interactive mode instead of inventing a blocker. Do not stop for missing interactivity when autonomous mode was explicitly requested.
- When this skill is used inside a manager-owned run, stay card-scoped. Do not take ownership of next-card selection, git stage movement, or package lifecycle.
- If work is blocked, move the card to `blocked` with a real note and evidence.
- If `code-simplifier`, commit, or `codex-review` cannot run, do not pretend success; stop with an honest note and leave the package in the real current stage.
- If the primary review path fails and a locally supported fallback backend is available, use it only when it produces a real review artifact. Otherwise leave the card in the honest review stage.

## When to read extra references

- Read [references/examples.md](references/examples.md) first for command patterns.
- Re-check the live `implementation-status` payload before any resume, review, or between-card transition.
