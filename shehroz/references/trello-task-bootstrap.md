# Trello Task Bootstrap

Use this when the operator starts a task that does not fit the currently active
project board cleanly.

This reference is about project/task memory bootstrapping before worker
delegation, not about implementation details.

**Memory Root:** All `.MEMORY/` paths below resolve against
`MANAGER_MEMORY_ROOT = /home/pets/TOOLS/manager_wezterm_cli/.MEMORY/`, not
CWD. This root is canonical on `pets`; if Shehroz is operating from another
host, write the durable files back to `pets` instead of treating a local mirror
as the SSOT.

## Why this exists

If Shehroz treats a truly new task as just another chat turn, the task starts
without:
- a project memory home
- a board-local steering surface
- a stable card id
- a truthful lane/status

That makes later delegation and re-entry weaker.

## Default decision rule

Before deeper execution work, ask:

1. Does an existing Trello project already fit this task by scope and product intent?
2. Would reusing that board mix unrelated repository truth or task semantics?
3. Does the task need its own project/card vocabulary for future re-entry?

If the answer points away from reuse, create a new project board by default.

## Minimum bootstrap shape

For a new task/project:

1. Create `$MANAGER_MEMORY_ROOT/projects/<slug>/`
2. Create `$MANAGER_MEMORY_ROOT/TRELLO/projects/<slug>/`
3. Seed:
   - `BOARD.md`
   - `board-state.json`
   - `00-info/0000-now/card.md`
   - `00-info/0001-focus/card.md`
   - lane folders `01-icebox` .. `06-done`
4. Create one canonical project card under `$MANAGER_MEMORY_ROOT/projects/<slug>/`
5. Create the first task card in the correct Trello lane
6. Update `$MANAGER_MEMORY_ROOT/00-index.md`
7. Update `$MANAGER_MEMORY_ROOT/NOW.md` only as steering, not as the main storage surface

## Lane choice

Use:
- `02-backlog` if the task is shaped but not yet started
- `03-in-progress` if the task is active in the current turn
- `05-blocked` only when a concrete blocker already exists

## Minimal operator-facing truth

After bootstrap, Shehroz should be able to say:

```text
BOARD: <path>
CARD: <id>
LANE: <lane>
WHY NEW PROJECT: <one sentence>
```

## Anti-patterns

Avoid:
- stuffing a new task into the wrong existing board just because it mentions
  a similar product name
- leaving a new task only in `NOW.md`
- creating a project card without a Trello board when the operator is clearly
  steering task-by-task
