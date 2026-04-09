---
name: implementation-manager-skill
description: Run a managed observed implementation session over a Trello-style package by launching card-scoped `codex_wp` workers in floating Zellij panes while the manager keeps lifecycle control.
---

# implementation-manager-skill

Use this skill as a thin orchestration layer over `/home/pets/TOOLS/implementation_manager_skill_cli`.

The manager owns the long-running session.
The worker `codex_wp` owns one card implementation at a time.

## Default workflow

1. Read the package `AGENTS.md`, `trello-cards/KICKOFF.md`, and live `kanban.json`.
2. Run manager `status` first so you know the real `current_card`, `current_stage`, `repo_root`, `next_command`, and `resume_command`.
3. Use a clean isolated runtime worktree and absolute `--package`, `--repo-root`, and `--config` paths.
4. Start the manager from a real `zellij` terminal, then let it launch one worker in a floating `zellij` pane.
5. Observe the session through manager `status`, summaries, pane title updates, and append-only observer logs.
6. Let the manager move the card through runtime stages without interactive pause prompts.
7. Continue until no actionable card remains or a real blocker appears.

## Operating rules

- Treat `kanban.json` as the only writable execution SSOT.
- Keep the current interactive `implementation-skill` flow intact; use this skill for long managed sessions.
- Treat manager `status` as the live truth source before start, after failure, and whenever the active stage is unclear.
- When launching a worker, always mention `$implementation-skill` in the worker prompt. Treat that as mandatory, not optional.
- The worker prompt must stay card-scoped. Do not let the worker own git, stage movement, or next-card selection.
- Use `$implementation-skill` for the active card implementation contract, while the manager keeps ownership of `implementation-stage`, simplify, commit, `codex-review`, and next-card selection.
- Use `implementation-start`, `implementation-stage`, and `implementation-status` in `autonomous_managed` mode so the runtime keeps the same SSOT contract without handoff pauses.
- Keep the manager summaries short: progress bar plus 3 Russian bullets.
- Keep operator-facing launch and resume commands as one-line absolute shell commands or wrapper scripts.
- If `status` reports `in_progress`, `simplify`, `commit`, or `codex-review`, resume from that real stage instead of forcing the package back to `ready`.
- Do not start the manager from a dirty runtime worktree. The manager commit step may stage broad repo changes.
- Prefer a direct Zellij launch path for the manager itself. Do not treat an outer tmux wrapper as the verified harness when floating-pane geometry is unstable.
- If the manager shell starts but worker launch fails, inspect `status` first and keep `kanban.json` untouched by hand.
- If the primary review path times out or hits quota, record the failure honestly. Use a locally supported fallback backend only when it produces a real review artifact.
- If worker output or repo state looks blocked, stop honestly and move the card to `blocked`.

## When to read extra references

- Read [references/examples.md](references/examples.md) first for the basic command shape.
- Read the package-specific runtime config and current `status` payload before launching or resuming a real session.
