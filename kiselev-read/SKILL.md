---
name: kiselev-read
description: Read-only observability and analytics skill only for Denis Kiselev's DEKSDEN channel and paired chat. Use when the task refers to `kiselev-read`, `kiselev-week`, Denis Kiselev, DEKSDEN, deksden_notes, or DEKSDEN chat and needs fetch, inspection, explanation, analytics, comparison, timeline, or the fixed weekly report format for `@deksden_notes` and `DEKSDEN (chat)` together. Inside this skill, `оба источника`, `две ленты`, `канал + чат`, or `вместе` always mean DEKSDEN channel plus DEKSDEN chat, never ИИшница.
triggers: kiselev-read, kiselev-week, Denis Kiselev, DEKSDEN, deksden_notes, DEKSDEN chat, kiselev analytics, kiselev timeline, weekly report kiselev
---

# kiselev-read

Use this skill for DEKSDEN observability.

## Skill trace

- Follow the governing `AGENTS.md` skill-trace contract when one exists.
- Fallback examples: `🚀📖 [skill:kiselev-read] ON ...`, `🛠️📖 [skill:kiselev-read] STEP ...`, and `✅📖 [skill:kiselev-read] DONE ...`.

This skill is strictly read-only.

- Never send Telegram messages.
- Never click Telegram buttons.
- Never publish anything to web.
- Never use write-actions in Telegram.

## Default Identity

- Channel: `@deksden_notes`
- Chat: `DEKSDEN (chat)` with dialog id `2771751570`
- Default session: `default` from `/home/pets/zoo/cc_chanels_telegram/state/telega/sessions/default.json`
- Default mode: combined view of channel + chat
- Default language: simplified Russian

Read [references/runtime-map.md](references/runtime-map.md) first for exact fetch paths and source names.
Read [references/examples.md](references/examples.md) when the user writes in short mixed Russian-English style.
Read [references/kiselev-week.md](references/kiselev-week.md) when the user says `kiselev-week` or asks for the saved weekly DEKSDEN report format.

## Choose The Workflow

1. For quick latest-message or live probe requests, use [references/low-level-ops.md](references/low-level-ops.md).
2. For explaining one message or one person's latest message, use [references/explain-message.md](references/explain-message.md).
3. For day, week, or month analytics and timelines, use [references/analytics.md](references/analytics.md).
4. For links, GitHub, themes, people, or focused extraction, use [references/extract-artifacts.md](references/extract-artifacts.md).
5. For message schema, daily snapshot layout, and combined dataset rules, use [references/data-contracts.md](references/data-contracts.md).
6. For short real phrasing and command normalization, use [references/examples.md](references/examples.md).
7. For the fixed weekly DEKSDEN report layout triggered by `kiselev-week`, use [references/kiselev-week.md](references/kiselev-week.md).

## Required Operating Rules

- If the user explicitly says `kiselev-read` or `kiselev-week`, never substitute `ИИшница` or `ai_club`.
- Treat `kiselev-week` as a weekly-report alias inside this skill.
- When the user says `kiselev-week`, use the saved weekly report template from `references/kiselev-week.md`.
- Inside this skill, `оба источника`, `две ленты`, `вместе`, or `канал + чат` always mean:
  `@deksden_notes` + `DEKSDEN (chat)`.
- Use only the `default` telega session profile for live fetch work.
- Keep the skill read-only end to end.
- Prefer live fetch evidence before abstract organization when the user asks for latest state.
- Treat channel and chat as one analytical space by default, but keep source labels visible.
- Deduplicate mirrored channel posts inside the chat by default when building combined datasets.
- Use thread-first logic for explanation:
  if a message is a reply, reconstruct the local thread first; otherwise inspect nearby messages and only then fall back to standalone reading.
- Keep answers in simplified Russian unless the user asks otherwise.

## Core Commands

Quick live fetch from the public channel:

```bash
cd /home/pets/zoo/cc_chanels_telegram
./TOOLS/telega fetch --profile default @deksden_notes --limit 5 --json
```

Organize day or week snapshots with the working default session:

```bash
cd /home/pets/TOOLS/aiclub_skill
python3 scripts/analyze/fetch_kiselev_read.py --scope combined --period day
python3 scripts/analyze/fetch_kiselev_read.py --scope combined --period week
```

Build a deduped combined dataset from fetched snapshots:

```bash
cd /home/pets/TOOLS/aiclub_skill
python3 scripts/reporting/build_combined_snapshot.py --from 2026-03-19 --to 2026-03-25
```

## Example User Messages

Use phrasing like this:

```text
kiselev-read: забери сегодня и чат и канал
kiselev-read: покажи последние сообщения из чата и канала
kiselev-read: сначала забери потом проанализируй оба источника за сегодня простым русским
kiselev-read: забери неделю по каналу и чату
kiselev-read: сделай недельный отчёт по чату и каналу вместе
kiselev-week: сделай недельный отчёт
kiselev-week: сначала забери неделю и собери отчёт
kiselev-read: хочу таймлайн за 1 неделю по двум источникам
kiselev-read: собери ссылки за неделю из чата и канала
kiselev-read: github за неделю по чату и каналу вместе
```

## Notes

- Fetch evidence shows that channel posts are mirrored into the chat nearly 1:1, so raw combined analysis must dedupe those mirrored posts by default.
- Use the public channel as the source of truth for original posts.
- Use the chat as the source of discussion, replies, and follow-up signals.
- If the user asks for `оба источника`, use DEKSDEN sources by default:
  `@deksden_notes` and `DEKSDEN (chat)`.
