---
name: auto-commit
description: "Follow a literal auto-commit workflow for git worktrees: start with `git status`, read all changes, organize them into atomic commits, run fitting linters, scan diffs for secrets, think about `.gitignore`, generate short imperative commit messages, and push with `gh` or create a remote if none exists. Use when Codex is asked to commit everything shown in git status and the user wants the workflow kept close to a provided source text, with simplified Russian, emoji, and very short numbered reasoning bullets."
---

# Auto Commit

Treat the source text below as the canonical workflow. Keep it word-for-word and letter-for-letter in intent. Add only the minimum needed to resolve command syntax, safety, or higher-priority instruction conflicts.

## Skill trace

- Follow the governing `AGENTS.md` skill-trace contract when one exists.
- Use the examples in this section only as fallback when no governing `AGENTS.md` defines skill-trace formatting.
- Fallback examples: `🚀🟠 [skill:auto-commit] ON ...`, `🛠️🟠 [skill:auto-commit] STEP ...`, `⛔🟥 [skill:auto-commit] BLOCKED ...`, and `✅🟠 [skill:auto-commit] DONE ...`.

## Non-Stop Continuation Rule

- If an SSOT kanban, explicit task plan, or ordered backlog is active and still has open in-scope tasks, `DONE` means only that the commit substep is finished.
- Never treat commit completion as permission to pause, summarize the whole session, or wait for the user when the broader loop is still active.
- After commit and push, immediately return to the parent implementation loop and continue with the next open task unless a real blocker exists.
- If you send a notification after commit, send it quickly and then continue; notification is not a stopping point.
- Use this skill to preserve momentum, not to end momentum.

## Next-Step Handoff Rule

- Before treating the skill as complete, look for the next concrete task in the active flow.
- Prefer naming the most likely next step explicitly, such as verification, reproduce, deploy, cleanup, follow-up test work, or the next backlog item.
- If several tasks remain, suggest the nearest unblocked task rather than ending with a generic summary.
- Only stop completely when the broader flow is actually finished or a real blocker prevents further progress.

## Canonical source text

`start with git status via bash shell to see what to commit. Read all changes to think how to organize changes to groups, commits. commits all, use simplified language. Use simplified language, organize thoughts in short numbered bullet points with 2-5 words in one bullet point item max. Run linters.For reasoning use bullet points with emoji for numbered bullet points from this list: ①②③. Commit all we have in git status, use atomic commits, keep thinking what to add to gitignore, use emoji, think how to organize commits, use best practices, Generate messages: Match the inferred style, imperative mood, ≤72 chars. Security check: Scan diffs for secrets; abort if found. Finalize: Push with use 'gh --help' to push or create remote if the was not one. Communicate in simplified russian with emoji and visualization. run all linters that fits our tech stack`

## Apply the source text

- Start with `git status` in a bash shell.
- Read all changes before deciding commit groups.
- Commit everything currently relevant in `git status`.
- Use atomic commits.
- Keep thinking about `.gitignore`.
- Run all linters that fit the stack.
- Scan diffs for secrets and abort if found.
- Match commit message style to repository history.
- Use imperative mood and keep commit subjects within 72 characters.
- Push with GitHub CLI and inspect `gh --help` if the remote flow is unclear or missing.
- If no remote exists and the user did not ask to publish the repository, finish the local commit workflow, report that push was not applicable, and do not fabricate a remote-creation flow.

## Communication rules

- Communicate in simplified Russian.
- Use emoji and light visual structure.
- Write reasoning bullets with `①`, `②`, and `③`.
- Keep each reasoning bullet to 2-5 words when possible.
- Keep user-facing text simple and compact.

## Conflict rule

- Follow the canonical source text unless it conflicts with higher-priority instructions, repository safety, or an explicit user correction in the current turn.
- For local-only pilot repositories or unpublished scratch worktrees, treat "push" as optional follow-up rather than a hard requirement unless the user explicitly asks to publish.
