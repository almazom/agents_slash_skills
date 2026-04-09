# Runtime Preflight Reference

Use this before longer worker runs, especially for `headless-mux` and
`remote-ssh`.

## Checklist

1. `auth`
2. `env`
3. `cwd`
4. `git`
5. `launcher`
6. `observability plan`

## What each item means

### Auth

- confirm login or token state before starting the run
- do not wait for a long worker run to discover an expired auth path

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

### Observability plan

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
