# Data Contracts

Use this reference for message shape and storage layout.

## Per-Source Snapshot Layout

```text
/home/pets/TOOLS/aiclub_skill/fetched/
  YYYY-MM-DD/
    deksden_notes/
      messages.json
    kiselev_chat/
      messages.json
```

Each `messages.json` file is a JSON list.

## Per-Message Shape

Each message may contain:

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
- `source_alias`
- `source_type`
- `source_label`

## Combined Dataset Layout

```text
/home/pets/TOOLS/aiclub_skill/fetched/combined/
  kiselev-read/
    YYYY-MM-DD/
      messages.json
      meta.json
    YYYY-MM-DD__YYYY-MM-DD/
      messages.json
      meta.json
```

## Combined Dataset Rules

- `messages.json` is the deduped combined list
- `meta.json` includes:
  - date range
  - per-source counts
  - missing dates
  - mirrored duplicates removed

## Mirror Dedupe Rule

By default remove chat messages that:

- come from sender `deksden_notes`
- match a channel post text exactly after normalization
- land within 10 minutes of the channel version

This rule exists because fetch evidence shows exact 1:1 mirroring from channel into chat.
