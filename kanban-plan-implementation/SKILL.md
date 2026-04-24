---
name: kanban-plan-implementation
description: Start or inspect implementation flow from a kanban JSON plan using /home/pets/TOOLS/kanban_plan_implementation_skill_cli, while keeping the kanban JSON as the execution entrypoint and target SSOT.
triggers: kanban-plan-implementation, $kanban-plan-implementation, kanban implementation, implement kanban plan, kanban manage, kanban-plan-implementation manage, kanban-plan-implementation status
---

# kanban-plan-implementation

Use this skill as a thin wrapper over `/home/pets/TOOLS/kanban_plan_implementation_skill_cli`.

The runtime is the source of truth for:

- accepting a kanban JSON plan as the implementation entrypoint
- reconstructing truthful implementation status from that plan
- running the manager-owned sequential worker loop over direct kanban JSON SSOT

## Operating rules

- Treat the kanban JSON as the only writable execution SSOT.
- Run the implementation flow on the same host as the target repository, or stage the runtime onto that host first.
- Do not trust `resume_command` or auto-resume blindly when it still points to another host path such as `/home/pets/...` while the real repo lives on `almaz`.
- Start with `./run status --plan-file ...` when you need the truthful current execution picture before deciding whether to use `run`, `manage`, or a transport fallback.
- If the repo or its `AGENTS.md` requires TDD-first, strongest realistic E2E, live verification, or Playwright/browser-proof, carry that requirement into the worker handoff instead of downgrading to unit-only verification.
- If `./run manage ...` is healthy, prefer it for full non-stop completion.
- If `./run manage ...` is blocked by zellij session discovery, floating geometry, or other transport-only issues, do not abandon the kanban flow. Fall back to manager-owned execution through `wezterm` while keeping the same kanban JSON as SSOT.
- When the runtime returns `status_frame_ru`, surface those lines directly instead of paraphrasing them away.
- If the operator wants a more compact progress view, prepend one extra line such as `📊 0/6 done • 6 left • ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0%`, then print `status_frame_ru`.

## Default workflow

1. Read [references/runtime-map.md](references/runtime-map.md).
2. Read [references/end-to-end-flow.md](references/end-to-end-flow.md) when the request is about plan handoff or start-of-implementation behavior.
3. Verify runtime locality:
   - the implementation runtime can execute on the same host as the repo
   - any auto-resume path does not point to the wrong machine
4. Run `./run status --plan-file /abs/path/to/kanban.json` when you need the current implementation-oriented view.
5. If the user intent is full completion, non-stop execution, or `100%`, prefer `./run manage --plan-file ... --repo-root ...`.
6. If `manage` is blocked by zellij transport problems, switch to a `wezterm`-driven fallback instead of forcing more zellij retries:
   - keep the same kanban JSON as SSOT
   - keep manager-owned next-task selection
   - launch and observe the worker through `wezterm`
7. Use `./run run --plan-file ... --repo-root ...` only for inspect-or-start-one-task behavior.
8. Carry repo verification rules into the actual execution packet:
   - TDD-first when required
   - strongest realistic E2E/live verification
   - Playwright/browser-proof when browser truth matters

## Commands

```bash
cd /home/pets/TOOLS/kanban_plan_implementation_skill_cli
./run status --plan-file /abs/path/to/kanban.json
```

```bash
cd /home/pets/TOOLS/kanban_plan_implementation_skill_cli
./run run --plan-file /abs/path/to/kanban.json --repo-root /abs/path/to/repo
```

```bash
cd /home/pets/TOOLS/kanban_plan_implementation_skill_cli
./run manage --plan-file /abs/path/to/kanban.json --repo-root /abs/path/to/repo
```

## WezTerm fallback

Use this fallback when:

- the repo is remote and the execution truth lives on that remote host
- `manage` is blocked by zellij session routing or floating geometry
- the operator explicitly says to use `wezterm`

Fallback shape:

1. keep the kanban JSON as the only writable execution SSOT
2. use `./run status --plan-file ...` to read the next truthful task
3. move execution through a manager-owned `wezterm` worker
4. observe via `wezterm cli get-text` snapshots or heartbeat loops
5. reflect task completion or blocker back into the kanban JSON through the runtime, not through ad hoc side ledgers

This fallback changes the terminal transport, not the SSOT.
