---
name: notify-me
description: Use when the user wants to send a message or file through the `t2me` Telegram wrapper, verify the current route with `t2me status` or `t2me me`, dry-run a notification, or send `multy_cli` run artifacts such as `provider_responses/*.md`, `model_responses/*.md`, articles, summaries, or logs. For dual/ Mattermost delivery, use the local `mattermost_to_me` CLI.
---

# Notify Me

Use this skill for the local `t2me` CLI wrapper.

## Skill trace

- Follow the governing `AGENTS.md` skill-trace contract when one exists.
- Fallback examples: `🚀💬 [skill:notify-me] ON ...`, `🛠️💬 [skill:notify-me] STEP ...`, and `✅💬 [skill:notify-me] DONE ...`.

Source of truth for the command surface:

- `t2me --help`
- `t2me send --help`
- `t2me status --help`
- `t2me me --help`
- `/home/pets/TOOLS/mattermost_to_me_cli/mattermost_to_me --help`

Current wrapper contract (Telegram only):

- `t2me status`
  Check whether the session is authorized.
- `t2me me`
  Show the currently authorized account.
- `t2me send [message]`
  Send text or a file to the locked Telegram target.

Current `t2me send` flags:

- `--file`, `-f`
  Path to the file to send.
- `--caption`, `-c`
  Caption for a file send.
- `--markdown`, `-m`
  Enable Markdown parse mode.
- `--dry-run`
  Validate the payload and sender without sending.

Dual delivery / Mattermost CLI (copied locally to `/home/pets/TOOLS/mattermost_to_me_cli/mattermost_to_me`):

- `--status`
  Check Telegram + Mattermost routes.
- `--me`
  Show authorized accounts.
- `--only {both,telegram,mattermost}` / `--skip {telegram,mattermost}`
  Choose transports.
- `--file/-f`, `--caption/-c`, `--markdown`, `--dry-run`, `--json`, `--env-file <path>`
  Same semantics as README; `--markdown` affects Telegram only.

Config: use env vars or an env file with `MATTERMOST_API_BASE_URL`, `MATTERMOST_ACCESS_TOKEN` (or login+password), `MATTERMOST_TARGET_USERNAME`; optionally `MATTERMOST_DM_CHANNEL_ID`. Default config path: `/home/pets/TOOLS/mattermost_to_me_cli/config/credentials.env` (chmod 600). Override cache path if needed with `MATTERMOST_TO_ME_CACHE_PATH`.

Codex hooks: `codex_wp` stop hooks can deliver via `--hook-delivery telegram|mattermost|both|manager`. Mattermost/both use `mattermost_to_me` (override via `MATTERMOST_TO_ME_BIN`). `--hook-target` applies only when Telegram is included. Headless `exec --json` only; headed hooks remain Telegram-only.

## Workflow

1. If route health matters, run `t2me status` (Telegram) or `mattermost_to_me --status` (both) first.
2. If the user wants account confirmation, run `t2me me` or `mattermost_to_me --me`.
3. For plain text:
   - Telegram only: `t2me send "..."` or `t2me send --markdown "..."`.
   - Both/Mattermost: `mattermost_to_me "..."`, or restrict with `--only mattermost` / `--only telegram`.
4. For files, use `... --file /abs/path --caption "..."` (add `--markdown` if caption needs it).
5. If the user wants a safe check first, add `--dry-run`.
6. If using a non-default Mattermost env file, add `--env-file /abs/path.env`.

## Copy-Paste Patterns

```bash
t2me status
```

```bash
t2me me
```

```bash
t2me send --markdown "Pipeline finished. Raw provider files are ready."
```

```bash
printf '%s\n' 'Longer message from stdin' | t2me send --markdown
```

```bash
t2me send --file /abs/path/report.md --caption "Run report"
```

```bash
t2me send --file /abs/path/report.md --caption "*Run report*" --markdown
```

```bash
t2me send --file /abs/path/report.md --caption "Validate only" --dry-run
```

```bash
/home/pets/TOOLS/mattermost_to_me_cli/mattermost_to_me --status
```

```bash
/home/pets/TOOLS/mattermost_to_me_cli/mattermost_to_me --only mattermost "MM-only ping"
```

```bash
/home/pets/TOOLS/mattermost_to_me_cli/mattermost_to_me --only both --dry-run "Dual delivery smoke"
```

## multy_cli Artifact Rules

Prefer these artifact levels:

- Provider-wide raw output: `runs/.../artifacts/provider_responses/<provider>.md`
- Single model raw output: `runs/.../artifacts/model_responses/<provider-model>.md`
- Final merged raw output: `runs/.../artifacts/all_responses.md`
- Final article: `runs/.../artifacts/article_en.md` or `article_ready.md`
- Run summary: `runs/.../summary.json`

When the user says they want what the model answered, prefer:

- `model_responses/*.md` for one exact model
- `provider_responses/*.md` for one provider

Do not default to prompt-planning artifacts like:

- `prompt-request.json`
- `topic-angles.md`
- `topic-enrichment.md`

unless the user explicitly asks for the prompt chain or pipeline planning inputs.

## Decision Rules

- If the user asks to "notify me", clarify the payload locally by checking whether text, file, or both are needed.
- If the request is about a completed `multy_cli` run, inspect the latest run directory and choose the most user-facing artifact first.
- If the user wants proof without sending, use `--dry-run`.
- If a file path is relative, resolve it to an absolute path before sending.
- If Markdown formatting is not needed, omit `--markdown` to reduce rendering surprises.
