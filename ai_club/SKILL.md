---
name: ai-club
description: Operate the shared ai_club skill only for the Telegram channel and chat "ИИшница" using /home/pets/TOOLS/aiclub_skill as the only runtime core. Use when the task explicitly refers to ai_club, ИИшница, or iishnitsa and needs fetch, explanation, analytics, extraction, or publication for that specific source. Do not use this skill for DEKSDEN, Denis Kiselev, deksden_notes, DEKSDEN chat, or kiselev-read requests.
---

# ai_club

Use this skill as the orchestration layer for `ИИшница`.

Treat `/home/pets/TOOLS/aiclub_skill` as the only backend. Reuse its commands, prompts, fetched snapshots, and publishing patterns. Do not duplicate Telegram runtime logic inside this skill.

## Default Identity

- Default channel alias: `iishnitsa`
- Default human name: `ИИшница`
- Default invite URL: `https://t.me/+6vi39KaavkU2M2Yy`
- Default profile: `almazom`
- Default organize storage: `/home/pets/TOOLS/aiclub_skill/fetched/`
- Default fresh analysis window: `rolling_24h`
- Default publish mode: HTML landing via `publish_me --direct`

Read [references/runtime-map.md](references/runtime-map.md) first when you need the exact paths, aliases, or source-of-truth files.
Read [references/examples.md](references/examples.md) when the user writes in short mixed Russian-English command style and you need to map wording to the intended `ai_club` workflow.

## Choose The Workflow

1. For low-level operational requests such as "force fetch today", "refetch week", or "show fetched data", use [references/low-level-ops.md](references/low-level-ops.md).
2. For requests to explain one message or the latest message in simple Russian, use [references/explain-message.md](references/explain-message.md).
3. For day, week, or month analytics and high-level reports, use [references/analytics.md](references/analytics.md).
4. For theme focus, links collection, GitHub extraction, or "analyze all links from fetched", use [references/extract-artifacts.md](references/extract-artifacts.md).
5. For `explorer template` requests, use [references/explorer-template.md](references/explorer-template.md).
6. For HTML landing generation and direct publish, use [references/publishing.md](references/publishing.md).
7. For message fields, snapshot layout, and cache-vs-fetched rules, use [references/data-contracts.md](references/data-contracts.md).
8. For real request phrasing, shorthand aliases, and expected output shapes, use [references/examples.md](references/examples.md).

## Required Operating Rules

- Prefer existing fetched snapshots before making a new Telegram fetch.
- Use fresh Telegram reads only when the user explicitly wants the latest state or the needed snapshot is missing.
- Treat `sync` as the main organize command for day and week datasets.
- Treat month analytics as an aggregation of daily snapshots, not as a new Telegram border type.
- Treat `explorer template` as the canonical dark communication-explorer layout already present in the core project, not as a generic dashboard.
- Learn the user's command style from `references/examples.md` and normalize short phrases like `publish yesterday ai_club explorer template` into explicit fetch, analyze, build, and publish steps.
- Explain messages with `thread first` logic:
  if the message is part of a reply chain, explain it inside that chain; otherwise inspect nearby messages and fall back to standalone interpretation only when the message is clearly self-contained.
- Keep answers in simplified Russian unless the user explicitly wants another language.
- Do not send or post to Telegram in this skill. This version is fetch, analysis, extraction, and publish only.

## Example-First Routing

- If the user names `ai_club`, `ИИшница`, or `iishnitsa`, assume this skill unless the request clearly belongs elsewhere.
- Prefer interpreting user wording through concrete examples before inventing a new workflow.
- When the user asks to `send link only`, return the published URL without extra report text.
- When the user asks for `timeline`, treat that as a period analytics artifact and decide whether they want text, HTML landing, or `explorer template` from nearby words.
- When the user asks for `publish in explorer template`, keep the exact explorer layout and return a public link after `publish_me --direct`.

## Copy-Paste Entry Patterns

Check session health:

```bash
cd /home/pets/TOOLS/aiclub_skill
./telega_v2 session status --profile almazom
```

Fetch or re-fetch today for `ИИшница`:

```bash
cd /home/pets/TOOLS/aiclub_skill
./sync --target iishnitsa --period day
```

Fetch week for `ИИшница`:

```bash
cd /home/pets/TOOLS/aiclub_skill
./sync --target iishnitsa --period week
```

Get a fresh 24-hour analysis window:

```bash
cd /home/pets/TOOLS/aiclub_skill
./telega_v2 fetch-border "https://t.me/+6vi39KaavkU2M2Yy" rolling_24h --profile almazom
./telega_v2 read "https://t.me/+6vi39KaavkU2M2Yy" last:1 --json --profile almazom
```

Direct-publish an HTML landing:

```bash
publish_me --direct --slug ai-club-example /absolute/path/to/index.html
```

## Notes

- The core project already includes reusable prompts in `docs/guides/channel_analysis_prompt.yaml`.
- The core project already includes a proven direct HTML publish pattern under `docs/project_gathering/visualizations/comm-network-global-v3-6/`.
- The core project already includes the canonical explorer-template implementation under `docs/project_gathering/visualizations/comm-network-global-v3-8/`.
- If the user explicitly says `ai_club`, treat that as a direct skill trigger.
