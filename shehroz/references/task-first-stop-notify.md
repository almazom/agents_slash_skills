# Task-First Stop-Notify Workflow

**Memory Root:** All `.MEMORY/` and run-root paths resolve against
`MANAGER_MEMORY_ROOT = /home/pets/TOOLS/manager_wezterm_cli/.MEMORY/`, not
CWD. This root is canonical on `pets`; if the manager is running on another
host, use `ssh` / `scp` / `rsync` so the final run-root artifacts still land
there.

Use this when the operator wants:
- the task packet created first as a durable artifact
- a spawned interactive worker to receive that exact packet
- a temporary project-local Stop hook that wakes Shehroz up to review the run

This is the default pattern for one bounded interactive worker task spawned by
the manager into another pane. It is not the long-run auto-continue hook-loop
pattern.

Use this only for:
- interactive `codex_wp` in a visible pane
- temporary repo-local Stop wakeup for Shehroz

Do not use this for:
- headless `codex_wp exec --json --hook ...` runs
- remote or local wrapper-loop continuation sessions that use `--hook-times`
  and related wrapper flags

Tiny inline-prompt note:
- for a micro smoke/probe where the operator already supplied the exact prompt,
  Shehroz may use `codex_wp "<prompt>"` instead of starting empty Codex and
  then pasting a 6-field task file
- when that shortcut still needs Stop-hook review, install the temporary
  repo-local hook before launching the worker, because the initial prompt is
  submitted as soon as the process starts
- preserve that literal prompt in the run root so the stop review still has a
  truthful artifact to inspect

## Canonical flow

1. Create a dedicated run root and task file.
2. Validate the task packet before spawn.
3. Spawn a visible worker in the right pane.
4. Start `codex_wp`.
5. Install a temporary repo-local Stop hook for this run before task
   submission.
6. Submit the task file to the worker.
7. Observe the worker for `30s` after Enter.
8. When the worker stops, use the stop-hook artifact plus pane/log evidence to
   review the result.
9. Clean the temporary repo-local hook immediately after the wakeup review so
   the next run starts clean.
10. If the affected live Codex session may have loaded the old hook before
    cleanup, replace or restart that session before trusting future stop
    wakeups.

## Preferred helper sequence

```bash
mw-task-init \
  --project-root /abs/project \
  --workdir /abs/project \
  --board-slug <trello-project-slug> \
  --card-id 0011 \
  --lane 03-in-progress \
  --task-id task-001 \
  --reference /abs/project/AGENTS.md

mw-check-contract $MANAGER_MEMORY_ROOT/TRELLO/projects/<slug>/03-in-progress/0011-.../tasks/shehroz-.../prompts/task.txt
mw-spawn
mw-start <worker-pane-id>

mw-install-stop-hook \
  --project-root /abs/project \
  --run-root $MANAGER_MEMORY_ROOT/TRELLO/projects/<slug>/03-in-progress/0011-.../tasks/shehroz-... \
  --task-id task-001 \
  --task-file $MANAGER_MEMORY_ROOT/TRELLO/projects/<slug>/03-in-progress/0011-.../tasks/shehroz-.../prompts/task.txt \
  --worker-pane <worker-pane-id> \
  --manager-pane <manager-pane-id>

mw-submit-task <worker-pane-id> $MANAGER_MEMORY_ROOT/TRELLO/projects/<slug>/03-in-progress/0011-.../tasks/shehroz-.../prompts/task.txt
mw-review-stop --run-root $MANAGER_MEMORY_ROOT/TRELLO/projects/<slug>/03-in-progress/0011-.../tasks/shehroz-... --pane-id <worker-pane-id>
```

## Inline-prompt variant for tiny visible runs

Use this only when all of these are true:
- the operator already gave the exact literal prompt
- the run is a minimal smoke/probe or tiny one-turn answer
- the work does not justify a full 6-field task packet

Suggested shape:

```bash
RUN_ROOT="$MANAGER_MEMORY_ROOT/TRELLO/projects/<slug>/00-info/active-tasks/shehroz-$(date -u +%Y%m%d-%H%M%S)"
mkdir -p "$RUN_ROOT/prompts" "$RUN_ROOT/results"
printf '%s\n' 'Reply with only the number 3.' > "$RUN_ROOT/prompts/initial-prompt.txt"

mw-install-stop-hook \
  --project-root /abs/project \
  --run-root "$RUN_ROOT" \
  --task-id task-001 \
  --task-file "$RUN_ROOT/prompts/initial-prompt.txt" \
  --worker-pane <worker-pane-id> \
  --manager-pane <manager-pane-id>

wezterm cli split-pane --pane-id "$MANAGER_PANE" --right --percent 50 -- \
  bash -lc 'exec codex_wp "Reply with only the number 3."'
```

Observation rule:
- because the prompt was supplied at launch, the `30s` startup watch starts
  immediately after spawn
- do not send a second Enter unless the pane text proves the runtime is idle
  and waiting for more input

## Run-root shape

Preferred shape (with card):

```text
$MANAGER_MEMORY_ROOT/TRELLO/projects/<slug>/<lane>/<card-id>-<card-slug>/tasks/shehroz-<timestamp>/
  metadata.json
  prompts/
    task.txt
  results/
    post-submit-immediate.txt
    post-submit-30s.txt
    stop-hook-event.json
    stop-hook-events.jsonl
  hooks/
    install-state.json
    original-hooks.json   # only if the project already had hooks.json
```

Fallback (no card yet):

```text
$MANAGER_MEMORY_ROOT/TRELLO/projects/<slug>/00-info/active-tasks/shehroz-<timestamp>/
```

## Stop-hook behavior

The temporary repo-local hook:
- lives in `<project>/.codex/hooks.json`
- points to `/Users/al/TOOLS/manager_wezterm_cli/bin/manager-worker-stop-notify.py`
- does not continue the run
- writes `results/stop-hook-event.json`
- should always send a short wakeup message into the manager pane so Shehroz
  sees the stop immediately in the active terminal surface
- returns a visible stop reason telling Shehroz to review the run root

Rule:
- keep this hook repo-local, not global
- for the temporary run, replace the repo-local `Stop` entry instead of trying
  to merge multiple `Stop` behaviors
- include both wakeup paths when possible:
  manager-pane message + run-root artifact
- record the wakeup-send result in the run-root artifact so a missed manager
  message is diagnosable
- restore or remove it immediately after the stop wakeup review
- if the repo already had `.codex/hooks.json`, restore the original file from
  the run-root backup instead of trying to hand-edit the merged JSON
- if repeated identical wakeup lines continue after file cleanup, treat that as
  stale loaded hook runtime inside an already-running Codex session; replace or
  restart that session instead of blaming the file cleanup alone

### Wakeup text writing rule

When writing the manager-facing stop message:
- make it action-first, not status-only
- preferred shape:
  `Tahir pane 164 stopped. Inspect SSOT, decide next, do not stay idle.`
- include worker identity (`Tahir`, `Saad`, or other label) and pane id
- optionally include a short run/task id when that helps disambiguate multiple
  active workers
- do not use weak wakeups such as `Inspect now`, `done`, `idle`, or `FYI`
- the message should tell Shehroz what to do next:
  inspect SSOT/run root, classify the stop, and choose the next bounded action

### Delivery truth rule

The stop hook must report delivery truthfully:
- message text appearing in the pane is not enough by itself
- distinguish `message_rendered`, `submit_attempted`, and `submitted`
- if manager transport returns `prompt_not_ready`, classify the wakeup path as
  degraded or failed, not successful
- if the message was pasted without a real submit boundary, do not report the
  manager as truly awakened
- preserve the run-root artifact even when pane delivery fails, because the
  artifact becomes the fallback wakeup evidence

## Review protocol

When the worker stops:

0. notice the manager-pane wakeup message and inspect that worker pane
1. read `results/stop-hook-event.json`
2. read `prompts/task.txt`
3. read `results/` artifacts and worker logs
4. capture a final pane snapshot when needed
5. compare the observed evidence against `DONE`
6. restore or remove the temporary repo-local Stop hook before leaving the run
7. if the same live Codex session loaded the old hook before cleanup, replace
   or restart that session before trusting the next stop wakeup

The stop hook is only the wakeup signal. It is not the final verdict.
