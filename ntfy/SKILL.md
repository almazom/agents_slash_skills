---
name: ntfy
description: Use when the user wants to render or send an AI-agent notification to the self-hosted ntfy server through the notification-cli template system. Triggers on ntfy, $ntfy, send to ntfy, ntfy notification, publish to ntfy, agent ntfy update, self-hosted ntfy message, or explicit requests to route a JSON event payload to an ntfy topic.
triggers: ntfy, $ntfy, send to ntfy, ntfy notification, publish to ntfy, agent ntfy update, self-hosted ntfy notification, self-hosted ntfy message, send agent update to ntfy, route to ntfy
---

# ntfy

Use this skill for template-based sends to the self-hosted `ntfy` server.

This skill is intentionally narrow:
- transport: `ntfy` only
- normal input: JSON payload file
- normal routing: explicit topic
- normal runtime: the existing `notification-cli` sender

Do not use this skill for:
- Mattermost or Telegram delivery
- Android receive troubleshooting
- Tailscale debugging
- server deploy or Docker operations

Use the existing runtime instead of inventing ad-hoc curl commands.

## Runtime Root

Prefer this repo as the canonical runtime root:

```bash
/home/pets/TOOLS/notification-cli
```

If that path is unavailable on the current machine, check:

```bash
/home/almaz/TOOLS/notification-cli
```

The canonical command surface lives at:
- `scripts/send-agent-notification.py`
- `scripts/render-agent-notification.py`
- `scripts/publish-self-hosted-ntfy.sh`

## Source Of Truth

When you need the current transport contract or examples, read only the needed file:
- `deploy/ntfy/notification-templates/README.md`
- `deploy/ntfy/publish-contract.md`
- `deploy/ntfy/notification-templates/sample-live-template-test.json`
- `deploy/ntfy/notification-templates/sample-epic-done.json`
- `deploy/ntfy/notification-templates/sample-blocked.json`

## Skill Trace

- Follow the governing `AGENTS.md` skill-trace contract when one exists.
- Fallback examples: `🚀⬜ [skill:ntfy] ON ...`, `🛠️⬜ [skill:ntfy] STEP ...`, and `✅⬜ [skill:ntfy] DONE ...`.

## Workflow

1. Resolve the runtime root.
2. Confirm or prepare the JSON payload file.
3. Choose the smallest truthful template.
4. Require an explicit `--topic` unless the operator clearly asked for the runtime default topic.
5. Dry-run first when the wording, topic, or payload is new.
6. Send through `--transport ntfy`.
7. If the message is turning into a wall of text, switch to `artifact-first`.

## Template Rules

- `compact`
  - default for most operator-facing updates
- `micro`
  - only for heartbeat, cron, or frequent repeating pings
- `rich`
  - for `Done`, `Blocked`, milestone, or incident notifications
- `artifact-first`
  - when the full detail belongs in an artifact path instead of inline text

Never dump a full transcript inline by default.

## Command Patterns

Render only:

```bash
cd /home/pets/TOOLS/notification-cli
python3 scripts/render-agent-notification.py \
  --template compact \
  --input deploy/ntfy/notification-templates/sample-live-template-test.json
```

Dry-run send to an explicit topic:

```bash
cd /home/pets/TOOLS/notification-cli
python3 scripts/send-agent-notification.py \
  --transport ntfy \
  --topic notification-cli-smoke \
  --template compact \
  --input deploy/ntfy/notification-templates/sample-live-template-test.json \
  --dry-run
```

Live send to an explicit topic:

```bash
cd /home/pets/TOOLS/notification-cli
python3 scripts/send-agent-notification.py \
  --transport ntfy \
  --topic notification-cli-smoke \
  --template compact \
  --input deploy/ntfy/notification-templates/sample-live-template-test.json
```

Artifact-first send:

```bash
cd /home/pets/TOOLS/notification-cli
python3 scripts/send-agent-notification.py \
  --transport ntfy \
  --topic notification-cli-smoke \
  --template artifact-first \
  --input deploy/ntfy/notification-templates/sample-blocked.json
```

## Decision Rules

- Prefer explicit `--topic` in almost every send.
- Prefer file-backed payloads over hand-written inline text.
- If the user asks for a quick preview, use render-only or `--dry-run`.
- If the request is really about delivery to other transports, use a different skill.
- If send fails, inspect the runtime contract and publish helper before changing template wording.
- If the runtime root is missing, say so explicitly instead of fabricating a fallback sender.
