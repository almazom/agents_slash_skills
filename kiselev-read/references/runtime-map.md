# Runtime Map

Use these as the canonical paths and identities for `kiselev-read`.

## Sources

- Channel alias: `deksden_notes`
- Channel target: `@deksden_notes`
- Chat alias: `kiselev_chat`
- Chat title: `DEKSDEN (chat)`
- Chat dialog id: `2771751570`

## Default Meaning Of "Both Sources"

Inside `kiselev-read`, these phrases all mean the same pair:

- `оба источника`
- `две ленты`
- `канал + чат`
- `вместе`

The pair is always:

- `@deksden_notes`
- `DEKSDEN (chat)`

Never substitute `ИИшница` inside this skill.

## Session Source

- Session profile file:
  `/home/pets/zoo/cc_chanels_telegram/state/telega/sessions/default.json`
- API credentials:
  `/home/pets/zoo/cc_chanels_telegram/state/telega/.env`
- Quick live fetch wrapper:
  `/home/pets/zoo/cc_chanels_telegram/TOOLS/telega`

## Organized Snapshot Paths

- Daily per-source snapshots:
  `/home/pets/TOOLS/aiclub_skill/fetched/YYYY-MM-DD/deksden_notes/messages.json`
  `/home/pets/TOOLS/aiclub_skill/fetched/YYYY-MM-DD/kiselev_chat/messages.json`
- Combined datasets:
  `/home/pets/TOOLS/aiclub_skill/fetched/combined/kiselev-read/...`

## Working Scripts

- Read-only fetch organizer:
  `/home/pets/TOOLS/aiclub_skill/scripts/analyze/fetch_kiselev_read.py`
- Combined dedupe builder:
  `/home/pets/TOOLS/aiclub_skill/scripts/reporting/build_combined_snapshot.py`

## Source-Of-Truth Rules

- For the latest few messages, prefer `./TOOLS/telega fetch --profile default`.
- For day/week/month analytics, prefer organized snapshots under `fetched/`.
- For combined analysis, first build a deduped combined snapshot.
- Treat channel as the source of original posts.
- Treat chat as the source of discussion around those posts.
