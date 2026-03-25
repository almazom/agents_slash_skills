# Low-Level Operations

Use this reference for direct operational requests such as "force fetch today", "refetch week", "show me what is already fetched", or "read the latest JSON".

## Session Health

Check session health before a live fetch when the current auth state is uncertain:

```bash
cd /home/pets/TOOLS/aiclub_skill
./telega_v2 session status --profile almazom
```

## Day Fetch

Use `sync` for organized daily snapshots:

```bash
cd /home/pets/TOOLS/aiclub_skill
./sync --target iishnitsa --period day
```

Important: in the current core implementation, `day` already behaves like a clean re-fetch. Treat "fetch today" and "force fetch today" as the same operational path.

## Week Fetch

Use `sync` for organized week snapshots:

```bash
cd /home/pets/TOOLS/aiclub_skill
./sync --target iishnitsa --period week
```

Use `--force` when the user explicitly asks to re-fetch the whole week:

```bash
cd /home/pets/TOOLS/aiclub_skill
./sync --target iishnitsa --period week --force
```

## Fresh 24-Hour Window

Use a direct border fetch only when the user wants the latest moving window instead of the organized day or week snapshot:

```bash
cd /home/pets/TOOLS/aiclub_skill
./telega_v2 fetch-border "https://t.me/+6vi39KaavkU2M2Yy" rolling_24h --profile almazom
./telega_v2 read "https://t.me/+6vi39KaavkU2M2Yy" last:1 --json --profile almazom
```

## Inspect Local Datasets

Prefer local files after a fetch:

```bash
cd /home/pets/TOOLS/aiclub_skill
find fetched -maxdepth 3 -name messages.json | sort
```

For today only:

```bash
cd /home/pets/TOOLS/aiclub_skill
find "fetched/$(date +%F)" -maxdepth 2 -name messages.json | sort
```

To inspect the stored state:

```bash
cd /home/pets/TOOLS/aiclub_skill
cat fetched/fetch_state.json
```

Do not rely on `./sync --state` until the core script is fixed; the current implementation references `target` before assignment in the `--state` path.

## Dataset-First Rule

After a successful fetch:

1. Work from `fetched/.../messages.json`.
2. Reuse that dataset for explain, themes, links, and reports.
3. Do not hit Telegram again unless the user asks for fresher data or the needed snapshot is missing.
