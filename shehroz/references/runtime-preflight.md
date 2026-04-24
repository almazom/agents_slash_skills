# Runtime Preflight Reference

Use this before longer worker runs, especially for `headless-mux` and
`remote-ssh`.

## Contents

- Checklist
- Item meanings
- Observability contract
- Transport-specific focus

## Checklist

1. `auth`
2. `env`
3. `cwd`
4. `git`
5. `launcher`
6. `execution kind`
7. `vision input`
8. `observability plan`

## Item Meanings

### Auth

- confirm login or token state before starting the run
- do not wait for a long worker run to discover an expired auth path
- when the local Codex proxy stack is part of the path and the exact command
  surface is unclear, start with `cdx --help`, then inspect `cdx status`,
  `cdx doctor`, `cdx trace`, `cdx logs`, and `cdx limits` through
  `$codex-orchestra` before declaring the runtime broken

### Env

- verify required variables exist
- do not paste raw secret values into prompts or logs
- prefer runtime injection or vault-backed pointers

### Cwd

- confirm the real repo root or isolated run root
- do not trust only the visible shell prompt

### Git

- confirm `user.name` and `user.email` if commit or push may happen
- confirm the intended remote or branch when publish behavior matters

### Launcher

- verify the command exists
- verify the script path exists and is executable when using a launcher file
- treat missing command vs broken worker as different diagnoses

### Execution Kind

- decide whether the target tab or pane is a plain `shell` run or a `codex`
  run
- shell work may use direct terminal commands
- Codex work must never use raw `codex`; route through `codex_wp`
- headless Codex work must use `codex_wp exec`
- if a launcher, prompt file, or remote script still references raw `codex`,
  treat that as a preflight failure and repair it before launch

### Vision Input

- inspect the prompt text for remote screenshot / image URLs before launch
- raw HTTP(S) image URLs are not valid direct vision attachments
- when a supported image URL is present, fetch it into the run root and attach
  the local file with `codex_wp exec --image <path>`
- validate the fetched file as a real supported image before launch
- if fetch or MIME validation fails, stop before launch and report that exact
  failure instead of pretending vision is available

### Observability Plan

State explicitly:

```text
FIRST SNAPSHOT: immediately after spawn
NEXT SNAPSHOT: <N seconds>
HEARTBEAT CADENCE: <interval or manual cadence>
STOP CONDITIONS: healthy | blocked | done | failed startup | operator stop
```

## Transport-specific focus

### visible-local

- pane placement
- startup text
- first local snapshot

### same-tab-visible

- exact `tab_id` match
- right-column placement
- immediate startup verification

### headless-mux

- workspace and title naming
- mux list path
- snapshot command

### remote-ssh

- remote cwd
- remote auth and env
- git identity on remote host
- remote launcher health
- remote observability path

## Checks

- the chosen transport has a matching preflight
- auth and env are verified without copying raw secrets into prompts
- launcher health is checked before blaming the worker
- execution kind is explicit and any Codex path uses `codex_wp`
- the observation lifecycle is explicit before the run starts
