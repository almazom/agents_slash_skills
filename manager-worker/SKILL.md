---
name: manager-worker
description: Orchestrate multiple Codex workers via WezTerm panes with heartbeat observation, manager-first intake, routing policy, and reusable DONE templates
triggers: manager, worker, heartbeat, watchdog, mw-heartbeat, mw-send, mw-spawn, observe worker, worker pane, spawn worker, spawn 2 workers, spawn 3 workers, spawn workers, spawn codex workers, Shehroz, shehroz
---

# Manager-Worker Skill

Orchestrate Codex workers through WezTerm panes with manager-first intake,
explicit transport choice, and observable execution.

Treat this skill as the manager's routing and delegation layer, not only pane
control.

Operator alias trigger:
- if the operator addresses the manager as `Shehroz` or `shehroz` in a worker,
  pane, heartbeat, or orchestration context, treat that as a direct trigger

## Read This For

| Need | Read |
|------|------|
| Spawn a visible worker or diagnose placement | `references/worker-lifecycle.md` |
| Prepare a longer or remote run safely | `references/runtime-preflight.md` |
| Run a hook-loop continuation worker | `references/long-run-hook-loop.md` |
| Draft or review a worker task packet | `references/task-contract.md` |
| Answer task or card status truthfully | `references/status-reporting.md` |
| Keep secrets out of normal agent context | `references/security-boundaries.md` |
| Diagnose wrong-tab, dead-launcher, or send-text issues | `references/troubleshooting.md` |

## Non-Negotiables

1. Workers stack vertically in the right column. Do not keep splitting right.
2. If the operator expects to see the worker, spawn it in a new pane in the
   same tab as the current manager pane.
3. Do manager-first intake before delegation. Do not pass a raw request to a
   worker when scope, routing, or verification is still unclear.
4. Choose transport explicitly before launch:
   `visible-local | same-tab-visible | headless-mux | remote-ssh`.
5. Spawn is incomplete until diagnostics pass and the first snapshot confirms
   the launcher or contract actually started.
6. Every assigned worker task must use the 6-field contract:
   `WORKDIR`, `CONTEXT`, `PROBLEM`, `TASK`, `DONE`, `REFERENCES`.
7. Secrets and auth are not normal agent context. Keep raw `.env` values out
   of normal task packets.
8. `non-stop observation` defaults to `60s` cadence and `100` cycles minimum
   unless the operator explicitly overrides it.

## Quick Routing

Read only what you need next:

- Worker spawn, diagnostics, health states, and observability:
  `references/worker-lifecycle.md`
- Longer or remote runs, transport-specific preflight:
  `references/runtime-preflight.md`
- Long continuation runs with hooks, remote launcher shape, and operator-care
  handoff:
  `references/long-run-hook-loop.md`
- Task-packet construction and reusable `DONE` templates:
  `references/task-contract.md`
- Task-status replies with SSOT + git + artifact + live-log evidence:
  `references/status-reporting.md`
- Secret-safe packet shaping and launcher boundaries:
  `references/security-boundaries.md`
- Wrong-tab, dead-launcher, false-error, and send-text failures:
  `references/troubleshooting.md`

## Manager Intake

Before spawning, messaging, or routing any worker:

1. Interpret the operator request.
2. Gather local context from files, memory, board state, and repo truth.
3. Detect missing intent, acceptance criteria, or constraints.
4. Choose the execution path:
   `direct | one-worker | staged-multi-worker | blocked`.
5. Define verification before the worker starts.

Before delegation, the manager should be able to state:

```text
INTENT: <what success means>
PATH: direct | one-worker | staged-multi-worker | blocked
WHY THIS PATH: <brief reasoning>
DONE SHAPE: <which verification template applies>
```

When the work belongs to one concrete project board, also state:

```text
BOARD: <project board path or name>
CARD: <active card or workstream>
LANE: 00-info | 01-icebox | 02-backlog | 03-in-progress | 04-review | 05-blocked | 06-done
```

If those lines are vague, the task is not ready for worker delegation.

## Core Contracts

### Transport Contract

State transport explicitly before launch:

```text
TRANSPORT: visible-local | same-tab-visible | headless-mux | remote-ssh
WHY: visibility | persistence | remote runtime locality
OBSERVE VIA: <exact method after spawn>
```

### Observability Contract

State the observation lifecycle before the run starts:

```text
FIRST SNAPSHOT: immediately after spawn
NEXT SNAPSHOT: <N seconds>
HEARTBEAT CADENCE: <interval or manual cadence>
STOP CONDITIONS: healthy | blocked | done | failed startup | operator stop
```

### Task-Packet Contract

Every worker assignment must use this order exactly:

```text
WORKDIR:
CONTEXT:
PROBLEM:
TASK:
DONE:
REFERENCES:

STOP after completing this task. Do NOT continue to other work.
```

For field definitions, `DONE` template variants, and the interview protocol,
read `references/task-contract.md`.

## Minimal Examples

### Visible local spawn

```bash
MANAGER_PANE="${WEZTERM_PANE:?current pane required}"
WORKER_ID="$(wezterm cli split-pane --pane-id "$MANAGER_PANE" --right --percent 50 -- bash -lc 'printf "WORKER READY pane=%s\n" "$WEZTERM_PANE"; exec bash')"
wezterm cli get-text --pane-id "$WORKER_ID" --start-line -40 | tail -20
```

If the worker must stay visible in the current tab or additional workers must
stack in the same right column, follow `references/worker-lifecycle.md`.

### Worker task packet

```text
WORKDIR: /tmp/worker-task
CONTEXT: bounded task in the target repo
PROBLEM: the manager needs one concrete change or review result
TASK: complete one specific action only
DONE:
  - verification is explicit
  - unrelated changes are not touched
REFERENCES:
  - /abs/path/to/repo-or-file
  - /abs/path/to/plan-or-card

STOP after completing this task. Do NOT continue to other work.
```

## Helper Scripts

Prefer skill-local helpers when they fit the task:

- `bin/mw-heartbeat` - human-facing heartbeat output
- `bin/mw-send` - send text to a worker pane
- `bin/mw-start` - start `codex_wp` in a worker pane
- `bin/mw-trust` - confirm the trust prompt
- `bin/mw-spawn` - quick first visible worker helper anchored to the current pane

Important:
- `bin/mw-spawn` is only for the first visible worker from the current manager
  pane; it does not handle stacked follow-on workers and it does not replace
  post-spawn diagnostics
- if the operator requires strict same-tab visibility, multiple stacked
  workers, or post-spawn diagnostics, follow `references/worker-lifecycle.md`
  even if a helper exists

## Routing Bias

- Bias toward fewer workers when uncertainty is high.
- Bias toward clearer `DONE` over maximum parallelism.
- Bias toward staged fan-out over large all-at-once fan-out.
- Bias toward artifact-backed launchers for long or stoppable runs.
- Bias toward manager-local synthesis when the real work is still task shaping.

## Notes

- Keep examples short in `SKILL.md`; deep examples live in `references/`.
- Keep all references one hop away from `SKILL.md`.
- If a rule appears in both `SKILL.md` and a reference, the shorter
  `SKILL.md` rule is the summary and the reference is the detailed canonical
  procedure.
