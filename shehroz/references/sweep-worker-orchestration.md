# Sweep Worker Orchestration — Multi-Target Systematic Execution

Run a worker task across multiple targets (repos, folders, projects) with
`state.json` tracking, bounded parallelism, and cron-backed monitoring.

## When to Use

- "Run X across all projects in folder Y"
- "Systematically process each repo in ~/TOOLS/"
- "Sweep auto-commit / lint / test across all targets"
- Any task that applies the same worker action to N independent targets

## Run Directory Convention

```
$MANAGER_MEMORY_ROOT/runs/<task-slug>/
  state.json     ← SSOT for the entire sweep run
  report.md      ← final summary (written on completion)
```

- `<task-slug>`: kebab-case, descriptive (e.g., `auto-commit-zoo`, `lint-sweep-tools`)
- The run directory is created under `.MEMORY/runs/`, never under `/tmp/`
- `state.json` is the single source of truth — cron, manager, and operator all read it

## State.json Schema

```json
{
  "task": "<descriptive-name>",
  "started_at": "<ISO8601 UTC>",
  "finished_at": null,
  "status": "running|complete|partial|failed",
  "max_parallel": 3,
  "total_targets": N,
  "completed": 0,
  "failed": 0,
  "skipped": 0,
  "summary": {},
  "targets": {
    "<target-id>": {
      "path": "<absolute-path>",
      "status": "pending|running|done|error|skipped",
      "result": null,
      "error": null
    }
  }
}
```

### Target status lifecycle

```
pending → running → done
                  → error
skipped (never enters running)
```

### Summary field

Task-specific metrics. Examples:
- `"total_commits": 26` for auto-commit sweeps
- `"total_files_linted": 150` for lint sweeps
- `"total_tests_run": 45` for test sweeps

## Workflow Phases

### Phase 1: INVENTORY

1. Scan the target folder (e.g., `~/TOOLS/*/`, `~/zoo/*/`)
2. Classify each target:
   - `dirty` — has uncommitted changes / needs action
   - `clean` — no changes needed, skip
   - `no_git` — not a git repo, skip (or flag if relevant)
3. Count totals: `total_targets`, `dirty_repos`, `clean_repos`
4. Present the inventory to the operator before proceeding

```bash
# Example inventory scan for git repos
for d in ~/TOOLS/*/; do
  if [ -d "$d/.git" ]; then
    st=$(git -C "$d" status --porcelain 2>/dev/null | wc -l)
    echo "GIT:$st $d"
  else
    echo "NOGIT $d"
  fi
done | sort -t: -k2 -rn
```

### Phase 2: PREPARE

1. Create run directory: `mkdir -p $MANAGER_MEMORY_ROOT/runs/<task-slug>/`
2. Write initial `state.json` with all targets in `pending` status
3. Mark clean/no-git targets as `skipped` immediately
4. Set up CronCreate for periodic monitoring (every 5 min default):

```
prompt: "Read state.json at <path> and report progress. If all done, suggest cancel."
cron: "*/5 * * * *"
recurring: true
durable: true
```

### Phase 3: EXECUTE

1. Sort dirty targets by size (most changes first — biggest tasks get most time)
2. Launch workers in waves of `max_parallel` (default 3):
   - Use Agent subagents for Claude Code harness
   - Use `codex_wp` panes for visible Codex workers
   - Each worker gets ONE target
3. After each worker completes:
   - Update `state.json`: set target status to `done` or `error`
   - Update `summary` metrics
   - Update `completed`/`failed` counters
   - Launch next target(s) to fill the parallel slot
4. Wave progression:

```
Wave 1: targets[0..2]  (3 workers parallel)
Wave 2: targets[3..5]  (next 3 after wave 1 completes)
...
Last wave: remaining targets (may be < max_parallel)
```

### Phase 4: FINALIZE

1. Set `state.json.status` to `complete` (all done) or `partial` (some errors)
2. Set `state.json.finished_at` to current timestamp
3. Cancel the monitoring cron: `CronDelete <cron-id>`
4. Write `report.md` with final summary table
5. Report to operator:
   - Total targets processed
   - Total actions taken (commits, fixes, etc.)
   - Any errors or skipped targets with reasons
   - Location of state.json and report.md

## Worker Prompt Template

Each worker in a sweep run gets a scoped task. Generic template:

```
You are Tahir, a sweep worker. Your task is to perform <action> in <target>.

Workflow:
1. <step 1 — e.g., git status, scan files>
2. <step 2 — e.g., analyze changes>
3. <step 3 — e.g., create commits / run tests / apply fixes>
4. Report back: what was done, what was skipped, final state

IMPORTANT RULES:
- <task-specific rules>
- Do NOT push to remote
- Do NOT commit secrets
- Report: actions taken, files skipped, final status
```

## Error Handling

- If a worker fails: mark target as `error`, record error message, continue to next
- If a worker hangs: the cron monitor will detect stale `running` status
- Partial completion is acceptable — mark as `partial` not `failed`
- Re-run individual targets by resetting their status to `pending` in state.json

## Re-entrancy

The state.json design supports re-entry:
1. Read existing state.json
2. Find targets still in `pending` or `error` status
3. Resume from where the previous run left off
4. This works across Claude Code sessions — the file persists

## Quick Reference

| Phase | Action | Artifact |
|-------|--------|----------|
| Inventory | Scan + classify targets | Console output |
| Prepare | Create state.json + cron | `state.json` |
| Execute | Launch waves, update state | `state.json` (mutated) |
| Finalize | Report + cancel cron | `report.md`, final `state.json` |

## Connection to Existing Patterns

- This pattern extends `worker-lifecycle.md` from single-worker to multi-target sweep
- Uses the same `CronCreate` surface from `16a` in SKILL.md for monitoring
- Follows the same secret-safety rules from `security-boundaries.md`
- `state.json` replaces ad-hoc progress tracking with a persistent SSOT
