---
name: notify-me
description: Use when the user wants to send a message or file through the `t2me` Telegram wrapper, verify the current route with `t2me status` or `t2me me`, dry-run a notification, or send `multy_cli` run artifacts such as `provider_responses/*.md`, `model_responses/*.md`, articles, summaries, or logs.
---

# Notify Me

Use this skill for the local `t2me` CLI wrapper.

Source of truth for the command surface:

- `t2me --help`
- `t2me send --help`
- `t2me status --help`
- `t2me me --help`

Current wrapper contract:

- `t2me status`
  Check whether the session is authorized.
- `t2me me`
  Show the currently authorized account.
- `t2me send [message]`
  Send text or a file to the locked Telegram target.

Current `send` flags:

- `--file`, `-f`
  Path to the file to send.
- `--caption`, `-c`
  Caption for a file send.
- `--markdown`, `-m`
  Enable Markdown parse mode.
- `--dry-run`
  Validate the payload and sender without sending.

## Workflow

1. If route health matters, run `t2me status` first.
2. If the user wants account confirmation, run `t2me me`.
3. For plain text, use `t2me send "..."` or `t2me send --markdown "..."`.
4. For files, use `t2me send --file /abs/path --caption "..."`.
5. If the caption needs Markdown formatting, add `--markdown`.
6. If the user wants a safe check first, add `--dry-run`.

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
