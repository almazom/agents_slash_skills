# Three-Server Collection

Use this file before collecting from all 3 servers.

## Host map

- `al` - Mac operator node, home `/Users/al`
- `pets` - RackNerd node, home `/home/pets`
- `almaz` - Contabo node, home `/home/almaz`

## Preferred collection from `pets`

This matches the observed working path from the current environment.

- local `pets`: run exporter directly
- remote `almaz`: `ssh -o BatchMode=yes almaz ...`
- remote `al`: `ssh -o BatchMode=yes -o ConnectTimeout=10 al@100.112.49.58 ...`

## Export sequence

1. Pick a target date such as `2026-04-19`.
2. Create a staging directory like `/tmp/jsonl-digest-2026-04-19`.
3. On each reachable host, run:

```bash
python3 /path/to/export_jsonl_host_today.py --date 2026-04-19 --host-label <host> --output /tmp/<host>-2026-04-19.json
```

4. Copy remote outputs back to the active node with `scp`.
5. Aggregate:

```bash
python3 /path/to/aggregate_jsonl_today.py \
  /tmp/al-2026-04-19.json \
  /tmp/pets-2026-04-19.json \
  /tmp/almaz-2026-04-19.json
```

## Important truth rules

- If `~/.codex/sessions` does not exist on a host, record zero files.
- If SSH fails, report the host as unreachable instead of silently skipping it.
- If temp worktrees dominate the raw export, normalize them back to real projects before answering.
- Keep both project truth and host truth. Do not collapse host activity away.

## Common current commands from `pets`

```bash
ssh -o BatchMode=yes almaz 'find ~/.codex/sessions -type f -name "*.jsonl"'
ssh -o BatchMode=yes -o ConnectTimeout=10 al@100.112.49.58 'find ~/.codex/sessions -type f -name "*.jsonl"'
```
