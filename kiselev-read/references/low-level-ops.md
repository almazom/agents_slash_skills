# Low-Level Operations

Use this reference for direct read-only operations.

## Live Probe

Channel:

```bash
cd /home/pets/zoo/cc_chanels_telegram
./TOOLS/telega fetch --profile default @deksden_notes --limit 10 --json
```

Use this for:

- latest message
- latest few posts
- quick live verification

## Organized Day Fetch

```bash
cd /home/pets/TOOLS/aiclub_skill
python3 scripts/analyze/fetch_kiselev_read.py --scope combined --period day
```

Only channel:

```bash
cd /home/pets/TOOLS/aiclub_skill
python3 scripts/analyze/fetch_kiselev_read.py --scope channel --period day
```

Only chat:

```bash
cd /home/pets/TOOLS/aiclub_skill
python3 scripts/analyze/fetch_kiselev_read.py --scope chat --period day
```

## Organized Week Fetch

```bash
cd /home/pets/TOOLS/aiclub_skill
python3 scripts/analyze/fetch_kiselev_read.py --scope combined --period week
```

## Historical Day Fetch

```bash
cd /home/pets/TOOLS/aiclub_skill
python3 scripts/analyze/fetch_kiselev_read.py --scope combined --period day --date 2026-03-24
```

## Build Combined Dataset

```bash
cd /home/pets/TOOLS/aiclub_skill
python3 scripts/reporting/build_combined_snapshot.py --from 2026-03-24 --to 2026-03-24
```

By default this removes mirrored channel posts from the chat side.

## Read-Only Guardrail

If a command path would require:

- `send`
- `click`
- publish
- any Telegram write action

stop and do not use it in this skill.
