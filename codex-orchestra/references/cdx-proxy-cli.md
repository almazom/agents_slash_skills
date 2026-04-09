# cdx proxy CLI

Verified: 2026-03-29
Binary: `/home/pets/bin/cdx`
Version: `cdx 0.1.0`

`cdx` is the proxy-side control plane for Codex CLI. It starts or reuses the
local proxy, surfaces auth-pool health, shows limit pressure, rotates keys, and
provides recovery tools when Codex runs stall or start failing.

`codex_wp` already boots `cdx proxy` internally. Use these commands when you
need to inspect or repair that runtime.

## Command map

- `cdx proxy`: start or reuse proxy service, print shell exports, or force a
  restart.
- `cdx status`: show proxy PID, base URL, auth count, and health.
- `cdx doctor`: classify key health; `--probe` actively tests keys.
- `cdx stop`: stop the proxy service.
- `cdx trace`: tail recent routing events.
- `cdx logs`: tail proxy logs.
- `cdx limits`: show persisted limits snapshot and recent history.
- `cdx migrate`: migrate auth state from v1 to v2.
- `cdx reset`: clear `blacklist`, `cooldown`, or `probation` state.
- `cdx rotate`: move Codex to the next healthy auth key.
- `cdx all`: show the per-key dashboard for 5h and weekly windows.

`run-server` is present in help but hidden from normal operator use.

## Proxy bootstrap

Preferred shell bootstrap:

```bash
eval "$(cdx proxy --print-env-only)"
```

Observed `--print-env-only` behavior:

- exports `CLIPROXY_AUTH_DIR`
- exports `CLIPROXY_BASE_URL`
- exports `CLIPROXY_ENV_FILE`
- exports `CLIPROXY_HOST`
- exports `CLIPROXY_PORT`
- exports `OPENAI_API_BASE`
- defines a shell `codex()` helper that injects `-c "openai_base_url=..."`

Example output shape:

```bash
export CLIPROXY_AUTH_DIR='/home/pets/.codex/_auths'
export CLIPROXY_BASE_URL='http://127.0.0.1:50787'
export CLIPROXY_ENV_FILE='/home/pets/.codex/_auths/.env'
export CLIPROXY_HOST='127.0.0.1'
export CLIPROXY_PORT='50787'
export OPENAI_API_BASE='http://127.0.0.1:50787'
codex() {
  env -u OPENAI_BASE_URL -u OPENAI_API_BASE command codex \
    -c "openai_base_url=\"http://127.0.0.1:50787\"" "$@"
}
```

Useful variants:

```bash
cdx proxy --print-env
cdx proxy --force
cdx proxy --auth-dir ~/.codex/_auths
```

## Health and diagnostics

Machine-readable service check:

```bash
cdx status --json
```

Active auth probing:

```bash
cdx doctor --probe
```

Observed states from the doctor/dashboard output:

- `OK`: key is healthy
- `WARN`: key is usable but limit pressure is rising
- `COOLDOWN`: key hit rate or quota pressure; wait or rotate
- `BLACKLIST`: auth is rejected or invalid; fix auth, then reset

Per-key usage dashboard:

```bash
cdx all
cdx all --json
cdx all --only weekly
```

Persisted history and routing view:

```bash
cdx trace --limit 20
cdx trace --replace
cdx logs --lines 50
cdx limits --tail 10
cdx limits --json
```

## Recovery commands

Preview or perform rotation:

```bash
cdx rotate --dry-run
cdx rotate
cdx rotate --json
```

Reset state after auth repair or cooldown decisions:

```bash
cdx reset --state blacklist
cdx reset --state cooldown
cdx reset --name auth_001.json
cdx reset --json
```

Service lifecycle:

```bash
cdx stop
cdx proxy --force
```

Migration:

```bash
cdx migrate --dry-run
cdx migrate
```

## Fast stalled-run playbook

1. `cdx status --json`
2. `cdx doctor --probe`
3. `cdx all`
4. `cdx trace --limit 20`
5. `cdx logs --lines 50`
6. `cdx rotate --dry-run`
7. `cdx rotate`
8. `cdx reset --state blacklist` only after the broken auth is fixed

Use this sequence when Codex shows long inactivity, repeated 401s, or obvious
limit exhaustion.
