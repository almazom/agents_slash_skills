# Long Three-Stage Skill Family Flow

Use this when the operator wants Shehroz to run a large or multi-hour family
across:

1. `plan-skill`
2. `split-to-tasks`
3. `implementation-skill`

Typical operator language:
- `skill family`
- `big task`
- `long task`
- `planning`
- `split`
- `implementation`
- `plan -> split -> implementation`
- `run all 3 stages`

This is a manager-owned flow. Shehroz does not dump one vague prompt into a
worker and hope for the best. He drives each phase, applies the quality gates,
and keeps the run observable.

## Core rule

Each phase must be good enough for the next phase at about `95%+`.

Do not advance just because an artifact exists.
Do not trust one flattering runtime summary if the visible artifact disagrees.

Truthful sequence:

1. run `plan-skill`
2. inspect the exported `IMPLEMENTATION_PLAN.md`
3. if the plan is not really split-ready, improve planning and rerun
4. only then run `split-to-tasks`
5. inspect the generated package and `trello_quality_gate.json`
6. if the cards are not really implementation-ready, improve split and rerun
7. only then run `implementation-skill`
8. after implementation, spawn `Saad` for bounded QA / E2E closure

## Default transport and observation

For operator-visible local runs, default to:

- transport: `same-tab-visible`
- execution kind: interactive `codex_wp`
- worker delivery: task-file path, not inline contract text
- wakeup path: temporary repo-local Stop hook + manager-pane wakeup
- scheduled observation in Codex CLI: `$cron-skill`

Do not leave a long family unobserved.

## Cron policy for long family runs

In Codex CLI:
- create the cron observer immediately after startup proof for the current
  worker/pane pair
- default cadence: every `5` minutes for long active phases
- operator-facing silence should not exceed about `15` minutes
- send those `15`-minute or milestone updates through Mattermost with
  `$notify-me` when available, not only in the local pane
- if the active worker, pane, or card changes, refresh the cron job so the
  observer still points at the real truth surface
- cancel the old cron when the watched phase ends or a new phase replaces it

What cron is for:
- periodic state checks
- pane snapshots
- manager wakeup
- liveness/progress evidence

What cron is not for:
- phase quality judgment by itself
- automatic permission to advance phases
- guaranteed Mattermost delivery by itself

If Mattermost milestone notes are required, send them explicitly through
`$notify-me`.

Prompt-collection rule for the whole family:
- every Shehroz-to-worker prompt must be preserved under the active run root
- initial assignment lives in `prompt.md` plus `prompts/task.txt`
- every later follow-up must be saved as `prompts/followup-*.txt` before send
- `prompt-history.jsonl` is the append-only ledger for all submitted prompts
- do not treat live pane scrollback as sufficient prompt storage

Hook/cadence safety rule:
- if the visible worker uses a temporary repo-local Stop hook in the target
  repo, cron observer jobs must not run their own `codex_wp exec` from that
  same repo workdir
- use a neutral manager runtime workdir instead and pass the worker-pane
  snapshot plus run-root artifacts as references
- otherwise the observer can inherit the same repo-local hook and generate a
  false worker-stop wakeup

## Phase 1 — Planning

Goal:
- produce one canonical `IMPLEMENTATION_PLAN.md`
- keep it specific enough that split-to-tasks can derive bounded cards without
  hidden assumptions

Rules:
- use the real `plan-skill` runtime
- older plans may be references, not automatic completion
- inspect the exported plan yourself before handing off
- if the runtime says `pass` but the plan targets the wrong files or wrong
  scope, reject it and correct the phase

## Phase 2 — Split To Tasks

Goal:
- generate a Trello-style package with `kanban.json` as the execution SSOT

Rules:
- use the real `split-to-tasks` runtime
- inspect the actual package output, not only a summary line
- the package is not ready just because `build` returned success
- the cards must be readable enough that another worker can execute one card
  without replaying chat

Minimum surfaces to inspect:
- `trello_quality_gate.json`
- `cards_catalog.md`
- `trello-cards/KICKOFF.md`
- `trello-cards/kanban.json`

## Phase 3 — Implementation

Goal:
- execute the approved package through the real implementation flow

Rules:
- start from the approved package, not from fresh generic prompting
- reuse the same visible worker pane across consecutive cards when truthful
- refresh the cron observer when the active card or worker changes
- after any stop or idle wakeup, review evidence and choose the next bounded
  action; do not freeze at artifact relay

If an implementation worker returns to idle and the next bounded move is clear:
- send the targeted next task immediately in the same pane
- keep the proof surface explicit
- keep observation active
- do not ask the operator for permission to move to that next bounded action
  when the workstream is still open and the next step is already shaped

If any phase returns below the `95%+` gate:
- keep the family open
- choose the next recovery rung immediately:
  `repair in place -> rerun same phase -> escalate concrete blocker`
- do not stop at the summary file when the evidence already points to the next
  bounded correction
- only escalate when the correction is unclear, unsafe, or has already failed
  through repeated evidence-backed attempts

## Completion and operator updates

Required operator-care pattern:
- say plainly that this may take hours
- point to a durable re-entry path early
- send milestone updates on major steps
- if no major step happens, still update at least every `15` minutes

Recommended milestones:
- Phase 1 started
- planning accepted / planning reopened
- Phase 2 started
- split accepted / split reopened
- Phase 3 started
- implementation materially advanced / blocked
- QA started
- QA accepted / rejected

Completion is truthful only when:
- `Saad` accepts with evidence, or
- a concrete blocker is recorded and escalated, or
- the operator explicitly stops the flow

## Known failure patterns

- runtime summary says `pass`, but exported artifact is obviously wrong
- cron fire reports success, but its `operator-summary.md` path is missing
- worker returns to idle prompt while the manager is still passively waiting
- phase fails the gate, the next fix is obvious, but the manager stops anyway
- stop-hook or human-summary says `worker stopped`, but the visible pane is
  still active and the required phase artifact is not written yet
- phase summary file was required but not written
- the plan or package drifted onto generic repo surfaces instead of the real
  target files

Correct response:
- trust the artifact and live pane over flattering summaries
- keep the phase open
- send a targeted corrective follow-up in the same pane when the next fix is
  already clear
- if one phase or pilot step ends cleanly and the next bounded step is already
  defined, chain into it immediately instead of stopping at "ready for the next
  task?"
- only restart the whole phase when the current run cannot be repaired
- if no worker is active after the stop, either start the next bounded action
  immediately or escalate a concrete blocker; do not leave the family silently
  idle
- if the pane is still active, treat the stop as partial or false, keep the
  family open, and continue observation until the real completion boundary is
  proven
