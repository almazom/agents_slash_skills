# Data Contracts

Use this reference when you need the message schema or snapshot layout for `ai_club`.

## Organized Snapshot Layout

Snapshots live under:

```text
/home/pets/TOOLS/aiclub_skill/fetched/
  YYYY-MM-DD/
    iishnitsa/
      messages.json
```

State file:

```text
/home/pets/TOOLS/aiclub_skill/fetched/fetch_state.json
```

## Message Shape

Each message record may contain:

- `id`
- `date_msk`
- `date_utc`
- `text`
- `sender`
- `views`
- `forwards`
- `reply_to_id`
- `reactions`
- `media_info`

`reply_to_id` is the key field for thread-first explanation.

## Cache vs Snapshot

- `data/cache/`:
  telega runtime cache, not the primary analysis surface
- `fetched/.../messages.json`:
  organized analysis surface for day, week, and month work

## Analysis Contract

When the user asks for period analytics:

- day and week reports should read from organized snapshots when available
- month reports must aggregate daily snapshots
- fresh rolling 24-hour analysis may read from `telega_v2` JSON output when the user wants the newest moving window
