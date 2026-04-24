# Observer Modes

## Default Layout

For a visible same-tab worker:

- manager pane on the left
- worker pane on the top-right
- observer pane on the bottom-right under the worker

This keeps all three surfaces visible at once:

1. manager pane
2. worker pane
3. heartbeat pane

Do not default to a separate new tab when the operator wants close visual supervision.

## What the Observer Must Track

Per heartbeat, prefer these signals:

1. worker pane tail
2. worker tty process table
3. last non-empty line in the worker pane
4. optional session or wrapper log growth when available

Classify truthfully:

- `PROGRESS` when content, process truth, tee path, or JSONL size changed
- `IDLE` when the last line is an idle Codex or shell prompt
- `QUIET` when there was no new proof but idle is still not proven
- `PROBABLE_STUCK` when unchanged windows hit the threshold
- `GONE` when the pane disappears

## Tee Rotation Lesson

Validated lesson from the April 19, 2026 tab observer run:

- one heartbeat may show `tee=none` and `jsonl_size=0`
- the next heartbeat may attach to a new wrapper log such as `iter-2.jsonl`
- that rollover is not by itself `IDLE`

Treat `iter-1 -> none -> iter-2` as normal wrapper rotation if the same worker
pane and tty remain alive and later heartbeats resume growth.

Do not mark the worker idle or stuck from one missing tee heartbeat alone.

## Wakeup Contract

When the observer wakes the manager:

1. inject the note into the manager pane
2. submit it with `CR`
3. watch the manager pane for `30s`
4. record one of:
   `startup_proved | submitted_without_startup_proof | prompt_not_ready`

Do not say `Shehroz is awake` only because the text became visible.

## Default Message Shape

Use an action command, not a passive update.

Preferred shape:

`Tahir pane 31 idle. Inspect SSOT, decide next, do not stay idle.`

Good properties:

- names the worker
- names the pane
- says why the manager is being interrupted
- says the required next step

## Cron Surface

Use cron when the operator wants periodic checks but not a dedicated visible observer pane.

Cron jobs should:

- read the same truth surfaces as the mini-pane observer
- stay neutral about delivery unless wakeup proof happened
- avoid repo-local Stop-hook collisions by using a neutral workdir when needed

## Preferred Visible Layout

For same-tab visible work, the canonical observer surface is now:

- left: manager pane
- top-right: worker pane
- bottom-right: small observer pane

Use a separate observer tab only as a fallback when the current tab cannot
support the third pane cleanly.
