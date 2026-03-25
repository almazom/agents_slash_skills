# Runtime Map

Use `/home/pets/TOOLS/aiclub_skill` as the only runtime core for `ai_club`.

## Canonical Paths

- Project root: `/home/pets/TOOLS/aiclub_skill`
- Telegram CLI: `/home/pets/TOOLS/aiclub_skill/telega_v2`
- Organize CLI: `/home/pets/TOOLS/aiclub_skill/sync`
- Contacts aliases: `/home/pets/TOOLS/aiclub_skill/contacts.json`
- Organized snapshots: `/home/pets/TOOLS/aiclub_skill/fetched/`
- Telegram cache: `/home/pets/TOOLS/aiclub_skill/data/cache/`
- Analysis prompts: `/home/pets/TOOLS/aiclub_skill/docs/guides/channel_analysis_prompt.yaml`
- Direct HTML publish reference: `/home/pets/TOOLS/aiclub_skill/docs/project_gathering/visualizations/comm-network-global-v3-6/`

## Default Channel Identity

`contacts.json` already maps all of these to the same target:

- `iishnitsa`
- `ИИшница`
- `aieggclub`
- `https://t.me/+6vi39KaavkU2M2Yy`

Prefer `iishnitsa` for commands and `ИИшница` for user-facing text.

## Source Of Truth Rules

- Use `fetched/` as the source of truth for organized day or week datasets.
- Use `data/cache/` only as the runtime cache behind `telega_v2`.
- Use `contacts.json` for alias resolution instead of inventing new aliases in the skill.
- Use the prompt YAML for recurring channel-analysis structure instead of rewriting the analysis tasks each time.

## Workflow Selection

- User asks to "fetch", "re-fetch", "organize", or "work on fetched messages":
  prefer `sync` and local `fetched/` data.
- User asks for the latest 24 hours or a brand-new analytical window:
  prefer `telega_v2 fetch-border` plus `telega_v2 read --json`.
- User asks for a landing or web page:
  reuse the direct HTML publish pattern and `publish_me --direct`.
