# State Contract

`session_state.json` is the durable orchestration ledger for the whole long-run family.

## Required intent

- record where the run is right now
- record why the current phase is open
- record the next truthful action
- record manager/worker pane continuity
- record gate outcomes and copied artifacts
- make `resume` possible without reconstructing context from chat

## Authority split

- `session_state.json`: family orchestration SSOT
- `kanban.json`: package execution SSOT
- `state.json`, `progress.md`, `BOARD.md`: derived package views

## Expected shape

- `run_id`
- `run_root`
- `repo_root`
- `goal`
- `status`
- `current_phase`
- `current_step`
- `phase_gate_status`
- `quality_gates`
- `manager`
- `worker`
- `pane_contract`
- `artifacts`
- `cron_jobs`
- `next_action`
- `resume_command`
- `blockers`
- `history`

## Resume rule

If a run stops unexpectedly:

1. Read `session_state.json`.
2. Trust the current phase and step over memory.
3. Reuse the same visible `Tahir` pane when it is still real and prompt-ready.
4. Only branch to replacement pane recovery after recording that branch in state.

`pane_contract` should distinguish:

- `manager_pane_id`: the main manager control surface
- `manager_wakeup_pane_id`: the pane that cron is allowed to wake
- `worker_pane_id`: the visible worker pane

In long runs, the wakeup pane should be prompt-ready and may be distinct from
the outer operator-facing control pane.
