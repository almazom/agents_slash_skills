---
name: telega
description: Use when the task is to send, fetch, inspect, or route Telegram messages through the local ./TOOLS/telega wrapper, especially when choosing between verified sender profiles and validating the latest outbound or inbound exchange.
triggers: telega, $telega, Telegram, telegram send, telegram fetch, telega wrapper, Telegram message, almazom, verified sender, telegram profile
---

# Telega

Use this skill for the local wrapper at `/home/pets/zoo/cc_chanels_telegram/TOOLS/telega`.

## Skill trace

- Follow the governing `AGENTS.md` skill-trace contract when one exists.
- Fallback examples: `🚀🟦 [skill:telega] ON ...`, `🛠️🟦 [skill:telega] STEP ...`, and `✅🟦 [skill:telega] DONE ...`.

Read `references/cli-surface.md` when you need the exact help text, command shape, or verified profile identities.

## Default Workflow

1. Start with `./TOOLS/telega --help` if the exact command shape is uncertain.
2. Unless the user explicitly asks for another sender, use profile `default` so sends come from `@almazom`.
3. Use `./TOOLS/telega session status --profile <name>` before live sends.
4. Use `./TOOLS/telega me --profile <name>` when the sender identity matters.
5. If `default` is unavailable and the user has explicitly allowed fallback, use `almazomkz`.
6. Use explicit `@target` on both `send` and `fetch`.
7. When inline buttons matter, inspect them with `fetch --json` and press them with `click`.
8. After sending a trigger message, wait for the paired `fetch` result before sending again.
9. Prefer `--dry-run` first unless the user clearly wants a live send now.

## Verified Profiles

- `default` resolves to sender `@almazom`
- `almazomkz` resolves to sender `@almazomkz`
- Prefer `default` for routine Telega work unless the user requests `almazomkz`

## Guardrails

- Do not send to any target other than the user-requested one.
- Treat `fetch --json` as message-window evidence first; attachment typing may still be incomplete in the payload.
- When validating a live Telegram flow, match replies only after the latest outbound trigger message.

## Copy-Paste Patterns

Check profile health:

```bash
./TOOLS/telega session status --profile default
./TOOLS/telega me --profile default
```

Dry-run a send:

```bash
./TOOLS/telega send --profile almazomkz --dry-run @target "probe"
```

Send and fetch the latest exchange:

```bash
./TOOLS/telega send --profile default @target "hello"
./TOOLS/telega fetch --profile default --json --wait 10 --limit 10 @target
```

Press the latest matching inline button:

```bash
./TOOLS/telega click --profile default @target --text "Задать вопрос по изображению"
```
