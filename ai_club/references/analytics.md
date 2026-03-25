# Analytics

Use this reference for day, week, and month analytics and for high-level reports about `ИИшница`.

## Period Rules

### Day

- Main source: `./sync --target iishnitsa --period day`
- Output basis: the resulting `fetched/YYYY-MM-DD/iishnitsa/messages.json`

### Week

- Main source: `./sync --target iishnitsa --period week`
- Output basis: all day folders for the requested week under `fetched/`

### Month

- Build from daily snapshots only.
- Do not invent `calendar_month`.
- Collect all matching `fetched/YYYY-MM-DD/iishnitsa/messages.json` files whose date is inside the requested month.
- If some days are missing and the user wants a fuller month report, fetch the missing days first through repeated daily or weekly organize steps.

## Report Types

### Operational Analytics

Use when the user asks for quick facts:

- message count
- top participants
- top themes
- links count
- domains count
- GitHub references
- activity bursts

Prefer concise bullet output.

### High-Level Report

Use when the user asks for a smart report, digest, or overview.

Default report structure:

1. Executive summary
2. Main themes
3. Participants and roles
4. Thread heat and activity flow
5. Links and external resources
6. Key insights
7. Open questions or action points

## Analysis Inputs

Use `/home/pets/TOOLS/aiclub_skill/docs/guides/channel_analysis_prompt.yaml` as the source of the recurring five-task analysis structure:

1. theme extraction
2. persona analysis
3. opinion extraction
4. insight generation
5. timeline analysis

Apply those tasks to the period dataset, then compress the result into the user-facing report.

## Presentation Rules For Multi-User Conversation

- Focus on clusters, not isolated lines.
- Separate high-signal themes from chat noise.
- Highlight who moved the conversation forward.
- Treat links as first-class artifacts when they drive the discussion.
- Surface disagreements or divergence only when they materially change the reading of the conversation.
- Mention uncertainty when a theme is weak or supported by too few messages.

## Default Commands

Day:

```bash
cd /home/pets/TOOLS/aiclub_skill
./sync --target iishnitsa --period day
```

Week:

```bash
cd /home/pets/TOOLS/aiclub_skill
./sync --target iishnitsa --period week
```

Fresh 24-hour analysis:

```bash
cd /home/pets/TOOLS/aiclub_skill
./telega_v2 fetch-border "https://t.me/+6vi39KaavkU2M2Yy" rolling_24h --profile almazom
./telega_v2 read "https://t.me/+6vi39KaavkU2M2Yy" last:1 --json --profile almazom
```
