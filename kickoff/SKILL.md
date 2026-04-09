---
name: kickoff
description: Use only when the user explicitly asks to use the local kickoff long-running session wrapper or names `$kickoff`. This skill runs or resumes managed Codex sessions through `/home/pets/TOOLS/kickoff_slash/kickoff-sdk`, keeps the JSON stop-contract and auto-continue loop in place, supports optional `--goal`, `--thread-id`, and `--mattermost`, and falls back to `kickoff-slash` only for project-local interactive hook mode.
---

# Kickoff

Use this skill as a thin wrapper over the local kickoff runtime:

- `/home/pets/TOOLS/kickoff_slash/kickoff-sdk`

Trigger it only on explicit user intent for the wrapper itself, not for generic planning or generic "continue" requests.

## Skill trace

- Follow the governing `AGENTS.md` skill-trace contract when one exists.
- Fallback examples: `🚀🧭 [skill:kickoff] ON ...`, `🛠️🧭 [skill:kickoff] STEP ...`, `✅🧭 [skill:kickoff] DONE ...`.

## Primary mode

`kickoff-sdk` is the primary runtime for managed long-running Codex sessions.

Use it when the user wants any of the following:

- start a managed run that auto-continues for `N` turns
- resume a managed run by `thread-id`
- keep the JSON stop-contract and 3 recommended next prompts between turns
- optionally send Mattermost notifications

## Secondary mode

`kickoff-slash` is only for project-local interactive hook mode inside an already running Codex CLI session.

Use it only when the user explicitly wants:

- a project-local Stop hook
- interactive Codex CLI auto-continue via `.codex/hooks.json`
- `kickoff-slash on|off|status`

Do not use `kickoff-slash` when `kickoff-sdk` can satisfy the request.

## Default workflow

1. Resolve the target repo path for `--cwd`.
2. Resolve `--max-turns`. Treat it as required unless the user already supplied a clear number.
3. Use `--goal` only when the user gave one explicitly.
4. Use `--thread-id` only for resume.
5. Add `--mattermost` only on explicit user request.
6. Run the wrapper.
7. Read the JSON stdout and report the important fields back to the user.

## Command shapes

Start a new managed run:

```bash
/home/pets/TOOLS/kickoff_slash/kickoff-sdk --max-turns 5 --cwd /abs/path/to/repo
```

Start with an explicit goal:

```bash
/home/pets/TOOLS/kickoff_slash/kickoff-sdk --goal "Finish the next meaningful chunk" --max-turns 5 --cwd /abs/path/to/repo
```

Resume an existing thread:

```bash
/home/pets/TOOLS/kickoff_slash/kickoff-sdk --max-turns 3 --cwd /abs/path/to/repo --thread-id <thread-id>
```

Resume with Mattermost notifications:

```bash
/home/pets/TOOLS/kickoff_slash/kickoff-sdk --max-turns 3 --cwd /abs/path/to/repo --thread-id <thread-id> --mattermost
```

Interactive hook mode:

```bash
kickoff-slash on --project /abs/path/to/repo --turns 3 --goal "Finish the next concrete chunk"
```

## Output contract

The wrapper prints JSON to stdout. Surface these fields to the user in a concise summary:

- `threadId`
- `finalStatus`
- `turnsCompleted`
- `manifestPath`
- `runDir`

If the wrapper fails, report the error message directly and do not pretend the run started successfully.

## Operating rules

- Prefer the wrapper over reimplementing the orchestration logic.
- Do not invent a native `/kickoff` slash command.
- Do not promise implicit global hooks across every repo.
- Treat `/home/pets/TOOLS/kickoff_slash/README.md` and `/home/pets/TOOLS/kickoff_slash/PROFILE.md` as the source of truth when the workflow needs clarification.
- Tell the user that restarting Codex is required before a newly installed skill becomes discoverable in a fresh session.
