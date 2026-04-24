---
name: gdrive-cli
description: Use this skill when the user wants to upload, download, sync, list, create, remove, verify, or monitor Google Drive transfers through the `gdrive-cli` wrapper on `pets` at `/home/pets/TOOLS/gdrive_cli`. Triggers on mentions of `gdrive`, `gdrive-cli`, Google Drive sync, Drive upload/download, `rclone`-backed Drive jobs, transfer monitoring, or Drive healthchecks on the current server.
triggers: gdrive-cli, $gdrive-cli, gdrive, Google Drive, gdrive-cli upload, gdrive-cli download, gdrive-cli sync, rclone, Drive transfer, gdrive-cli check, gdrive-cli progress, gdrive-cli diag
---

# gdrive-cli

Use this skill for the Google Drive transfer wrapper installed on `pets`:

- repo: `/home/pets/TOOLS/gdrive_cli`
- binary: `/home/pets/.local/bin/gdrive-cli`
- install root: `/home/pets/.local/share/gdrive_cli`
- config env: `/home/pets/.config/gdrive_cli/.env`

## Claude Code

- Claude Code discovers personal skills from `~/.claude/skills/`.
- Mirror this shared skill into Claude Code with a symlink at `~/.claude/skills/gdrive-cli -> ~/.agents/skills/gdrive-cli`.
- In Claude Code prefer `/gdrive-cli` or a natural-language request that mentions `gdrive`, `gdrive-cli`, Google Drive upload/download, sync, or `rclone`-backed Drive transfer.
- Do not expect `$gdrive-cli` syntax to work in Claude Code.

## Skill trace

- Follow the governing `AGENTS.md` skill-trace contract when one exists.
- Fallback examples: `🚀⬜ [skill:gdrive-cli] ON ...`, `🛠️⬜ [skill:gdrive-cli] STEP ...`, `✅⬜ [skill:gdrive-cli] DONE ...`.

## Bootstrap

Before substantial work, read:

1. `/home/pets/TOOLS/gdrive_cli/AGENTS.md`
2. `/home/pets/TOOLS/gdrive_cli/README.md`
3. only the relevant files under `/home/pets/TOOLS/gdrive_cli/tests/` or `lib/` if the task touches behavior or failures

## Core rules

- Work from `/home/pets/TOOLS/gdrive_cli` on `pets`.
- Prefer the wrapper commands over raw `rclone` for normal operator work.
- Treat `gdrive-cli check` as the first healthcheck before long transfers.
- Keep OAuth tokens, service-account JSON, and raw `rclone.conf` contents out of chat.
- Do not overwrite a working local `rclone.conf` just to match another host byte-for-byte.

## Common commands

```bash
cd /home/pets/TOOLS/gdrive_cli && /home/pets/.local/bin/gdrive-cli check
```

```bash
/home/pets/.local/bin/gdrive-cli upload /absolute/path/to/file backups/
```

```bash
/home/pets/.local/bin/gdrive-cli download remote/file.bin /absolute/path/to/downloads/
```

```bash
/home/pets/.local/bin/gdrive-cli ls
```

```bash
/home/pets/.local/bin/gdrive-cli jobs
```

```bash
/home/pets/.local/bin/gdrive-cli diag <JOB>
```

```bash
cd /home/pets/TOOLS/gdrive_cli && bash tests/run.sh
```

## If user wants X -> use Y

- upload one file -> `gdrive-cli upload /abs/path/file [remote-subdir/]`
- upload a folder -> `gdrive-cli upload /abs/path/folder/ [remote-subdir/]`
- mirror/sync a folder -> `gdrive-cli sync --force /abs/path/folder/ remote/subdir/`
- download a file -> `gdrive-cli download remote/file /abs/path/dest/`
- view remote contents -> `gdrive-cli ls [remote-subdir/]`
- create remote folder -> `gdrive-cli mkdir remote/path`
- delete one remote file -> `gdrive-cli rm remote/path`
- delete remote folder tree -> `gdrive-cli purge remote/path/`
- check long job status -> `gdrive-cli jobs`, `gdrive-cli progress [JOB]`, `gdrive-cli diag <JOB>`
- verify runtime health -> `gdrive-cli check`
- run repo regression tests -> `cd /home/pets/TOOLS/gdrive_cli && bash tests/run.sh`

## Current known truths

- The current server-side repo on `pets` is `/home/pets/TOOLS/gdrive_cli`.
- The installed binary on `pets` is `~/.local/bin/gdrive-cli`.
- The default configured remote root currently resolves to `mydrive_oauth:VPS_moved`.
- The repo test suite passed on `pets` on `2026-04-13`.
- A live Drive roundtrip test also passed on `pets` on `2026-04-13`.
