---
name: notify-me
description: Use when the user wants to send a message or file through the dual `mattermost_to_me` wrapper, verify Telegram + Mattermost delivery, dry-run a notification, or send `multy_cli` run artifacts such as `provider_responses/*.md`, `model_responses/*.md`, articles, summaries, or logs.
---

# Notify Me

Use this skill for the local dual-delivery wrapper:

- `/home/almaz/TOOLS/mattermost_to_me_cli/mattermost_to_me`

Default behavior:

- sends the same payload to Telegram and Mattermost;
- Telegram still goes through `t2me` under the hood;
- Mattermost goes to the configured `DM` target through Mattermost API.

## Skill trace

- Follow the governing `AGENTS.md` skill-trace contract when one exists.
- Fallback examples: `🚀💬 [skill:notify-me] ON ...`, `🛠️💬 [skill:notify-me] STEP ...`, and `✅💬 [skill:notify-me] DONE ...`.

Source of truth for the command surface:

- `/home/almaz/TOOLS/mattermost_to_me_cli/mattermost_to_me --help`

Current wrapper contract:

- `mattermost_to_me --status`
  Check both routes.
- `mattermost_to_me --me`
  Show the current Telegram sender and Mattermost identity.
- `mattermost_to_me [message]`
  Send text or a file to both transports by default.

Current `send` flags:

- `--file`, `-f`
  Path to the file to send.
- `--caption`, `-c`
  Caption for a file send.
- `--markdown`, `-m`
  Enable Markdown parse mode for Telegram.
- `--dry-run`
  Validate the payload and routes without sending.
- `--only telegram|mattermost`
  Force one transport.
- `--skip telegram|mattermost`
  Remove one transport from the default dual send.

## Workflow

1. If route health matters, run `mattermost_to_me --status` first.
2. If the user wants account confirmation, run `mattermost_to_me --me`.
3. For plain text, use `mattermost_to_me "..."` or `mattermost_to_me --markdown "..."`.
4. For files, use `mattermost_to_me --file /abs/path --caption "..."`.
5. If the user wants a safe check first, add `--dry-run`.
6. If the user explicitly wants Telegram-only delivery, add `--only telegram`.
7. If the user explicitly wants Mattermost-only delivery, add `--only mattermost`.

## Copy-Paste Patterns

```bash
/home/almaz/TOOLS/mattermost_to_me_cli/mattermost_to_me --status
```

```bash
/home/almaz/TOOLS/mattermost_to_me_cli/mattermost_to_me --me
```

```bash
/home/almaz/TOOLS/mattermost_to_me_cli/mattermost_to_me --markdown "Pipeline finished. Raw provider files are ready."
```

```bash
printf '%s\n' 'Longer message from stdin' | /home/almaz/TOOLS/mattermost_to_me_cli/mattermost_to_me --markdown
```

```bash
/home/almaz/TOOLS/mattermost_to_me_cli/mattermost_to_me --file /abs/path/report.md --caption "Run report"
```

```bash
/home/almaz/TOOLS/mattermost_to_me_cli/mattermost_to_me --file /abs/path/report.md --caption "*Run report*" --markdown
```

```bash
/home/almaz/TOOLS/mattermost_to_me_cli/mattermost_to_me --file /abs/path/report.md --caption "Validate only" --dry-run
```

```bash
/home/almaz/TOOLS/mattermost_to_me_cli/mattermost_to_me --only telegram "Telegram only"
```

```bash
/home/almaz/TOOLS/mattermost_to_me_cli/mattermost_to_me --only mattermost "Mattermost only"
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
- Default to dual delivery. Narrow to one transport only when the user explicitly asks or when one route is clearly unhealthy.
- If Mattermost delivery fails but Telegram succeeds, report the partial failure explicitly instead of silently falling back to Telegram-only.
