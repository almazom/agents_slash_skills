---
name: manager-worker
description: Orchestrate multiple Codex workers via WezTerm panes with heartbeat observation, manager-first intake, routing policy, and reusable DONE templates
triggers: manager, worker, heartbeat, watchdog, mw-heartbeat, mw-send, mw-spawn, observe worker, worker pane, spawn worker, spawn 2 workers, spawn 3 workers, spawn workers, spawn codex workers
---

# Manager-Worker Skill

Orchestrate multiple Codex workers via WezTerm panes with heartbeat observation.

This skill is not only about pane control. It is also the manager's intake,
routing, and delegation-quality layer.

## Core Concept

**CRITICAL LAYOUT RULE**: Workers stack VERTICALLY in the right column. Never split right.
**CRITICAL VISIBILITY RULE**: If the operator expects to see the worker, spawn it
in a **new pane in the same tab** as the current manager pane.

```
┌──────────────────┬──────────────┐
│                  │  Worker 1    │
│                  ├──────────────┤
│     MANAGER      │  Worker 2    │
│    (left pane)   ├──────────────┤
│                  │  Worker N    │
└──────────────────┴──────────────┘
```

**Why vertical stack?**
- Splitting right creates narrower and narrower panes → unusable
- Vertical stack keeps all workers at readable width
- Each new worker: `wezterm cli split-pane --bottom --pane-id <right_pane>`
- A worker in another tab does **not** satisfy a "new right pane" request

```
┌─────────────────────────────────────────────────────────────┐
│                    MANAGER (left pane)                       │
│  - Observes all workers via heartbeat                        │
│  - Shapes raw requests into task contracts                   │
│  - Chooses the right execution path                          │
│  - Sends tasks to workers                                    │
│  - Collects results                                          │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   WORKER 1   │   │   WORKER 2   │   │   WORKER N   │
│  codex_wp    │   │  codex_wp    │   │  codex_wp    │
│  (pane 5)    │   │  (pane 6)    │   │  (pane N)    │
└──────────────┘   └──────────────┘   └──────────────┘
```

## Mandatory Manager Intake Protocol

Before spawning, messaging, or routing any worker, the manager must shape the
operator request first.

### Goal

Convert:

`raw request -> manager understanding -> execution path -> worker contract`

Do not pass a raw request directly to a worker when the manager still needs to
decide scope, constraints, verification, or routing.

### Intake Steps

1. **Interpret the request**
   - what does the operator actually want changed, decided, reviewed, or delivered?
2. **Gather local context**
   - read the relevant files, memory, board state, and current repo state first
3. **Detect missing pieces**
   - identify what is still unknown: intent, acceptance criteria, constraints, or priority
4. **Choose execution path**
   - direct manager work, one worker, staged multi-worker, or block pending clarification
5. **Write the task packet**
   - produce the exact contract or direct action plan before execution begins
6. **Define verification**
   - make `DONE` concrete before the worker starts

### Intake Output

Before delegation, the manager should be able to state:

```text
INTENT: <what success means>
PATH: direct | one-worker | staged-multi-worker | blocked
WHY THIS PATH: <brief reasoning>
DONE SHAPE: <which verification template applies>
```

If the manager cannot state all four lines clearly, the task is not ready for delegation.

## Quick Start

### 1. Spawn a Worker

```bash
# Manager pane must stay the spawn anchor for a visible local worker
MANAGER_PANE="${WEZTERM_PANE:?current pane required}"

# For first worker, split the current manager pane to create the right column
FIRST_WORKER=$(wezterm cli split-pane --pane-id "$MANAGER_PANE" --right --percent 50 -- bash -c 'echo "WORKER READY pane=$WEZTERM_PANE"; exec bash')

# For additional workers, split BOTTOM from the right column pane:
NEXT_WORKER=$(wezterm cli split-pane --bottom --pane-id <right_column_pane_id> --percent 40 -- bash -c 'echo "WORKER READY pane=$WEZTERM_PANE"; exec bash')

# Start codex_wp in worker (headless task mode)
wezterm cli send-text --pane-id "$WORKER_ID" "codex_wp -C /tmp/isolated-task exec \"\$(cat /tmp/task-prompt.txt)\""
sleep 0.3
wezterm cli send-text --pane-id "$WORKER_ID" $'\x0d'
```

### 1a. Mandatory Post-Spawn Diagnostics

Spawn is not complete until diagnostics pass.

Immediately after `split-pane`:
1. capture the returned `pane_id`
2. confirm the pane is in the same `tab_id` when local visibility was expected
3. confirm the pane is positioned in the right-side worker area
4. inspect the pane text to verify the launcher or contract actually started

Minimal diagnostic pattern:

```bash
WORKER_ID="$FIRST_WORKER"

wezterm cli list --format json | python3 - "$WORKER_ID" <<'PY'
import json, subprocess, sys
worker_id = int(sys.argv[1])
panes = json.load(sys.stdin)
for pane in panes:
    if pane["pane_id"] == worker_id:
        print(f"pane={pane['pane_id']} tab={pane['tab_id']} left={pane['left_col']} top={pane['top_row']} title={pane['title']}")
        break
PY

wezterm cli get-text --pane-id "$WORKER_ID" --start-line -40 | tail -20
```

If the pane landed in another tab, or the startup text is missing, respawn or
repair it instead of reporting success.

### 1b. Preferred launch pattern for long headless tasks

If the task is longer than one short prompt, do NOT type the whole contract
through `send-text`.

Preferred pattern:
1. Create a run root: `/tmp/<run-id>/worker-N`, `/tmp/<run-id>/prompts`, `/tmp/<run-id>/results`
2. Write the full task contract to `prompts/worker-N.txt`
3. Start the pane with a small launcher script that runs:
   `codex_wp exec ... - < prompt.txt |& tee worker-N-terminal.log`
4. Treat `worker-N-terminal.log` as the postmortem log and partial-result SSOT

Use this pattern for multi-worker reviews, long read-only audits, and any run
where the operator may stop early but still needs reliable artifacts.

### 2. Send Task to Worker

```bash
WORKER_ID=5

# Clear input
wezterm cli send-text --pane-id "$WORKER_ID" --no-paste $'\x03'
sleep 0.2

# Send prompt
wezterm cli send-text --pane-id "$WORKER_ID" --no-paste "your task here"
sleep 0.3

# Submit (Enter)
wezterm cli send-text --pane-id "$WORKER_ID" --no-paste $'\x0d'
```

### 3. Heartbeat Observation

```bash
# Quick manual check — just read last 10 lines (status area only)
wezterm cli get-text --pane-id 5 | tail -10

# Structured heartbeat with mw-heartbeat script
mw-heartbeat 5 30 100
```

### 3a. Periodic Observability Rule

After every worker spawn:
1. do an immediate diagnostic snapshot
2. do an initial short read within the first few seconds
3. continue periodic observation until the worker is clearly healthy, blocked, or done

Preferred order:
- `wezterm cli get-text --pane-id <id> --start-line -40`
- then `mw-heartbeat <id> <interval> <beats>` or repeated `get-text`

Do not treat "pane exists" as enough evidence. Observability must confirm both
visibility and startup.

## Worker States

| State | Pattern (in last 10 lines) | Action |
|-------|---------|--------|
| Working | `• Working (Xs)` | Wait, continue observation |
| Done | `completed`, `finished` | Collect results, spawn next |
| Error | `ERROR`, `FATAL` (standalone, not in code) | Restart or escalate |
| Idle | `› ` prompt visible, no Working | Send next task |
| Stuck | Same content 3+ checks | Ctrl+C and retry |

## Heartbeat Observer

**Design principle**: Output is read by a HUMAN (operator/owner), not a machine.
Every line must answer: "What is my worker doing?"
Token counts are NOT shown — they are internal metrics, not business info.

**Script**: `mw-heartbeat [WORKER_ID] [INTERVAL] [MAX_BEATS]`

```bash
# Observe worker 5, every 30s, up to 100 beats
mw-heartbeat 5 30 100

# Quick 3-beat check
mw-heartbeat 5 10 3
```

### Output Format (Human-Facing)

```
--- #1/100 [07:57:49] Worker 5 ---
  WORKING: The next edit is in scripts/live-e2e-bdd.ts. I'm removing the all-fixtures-or-die
  Task: card 0011
  Progress:  101 tests passed  commit a6b28fd5  elapsed 4m
  Project: ~/TOOLS/manager_wezterm_cli
----------------------------
```

Each line answers a human question:
- **State line**: "What is it doing right now?" (WORKING/IDLE/DONE/ERROR + action description)
- **Task line**: "Which card/task?" (kanban card number or task name)
- **Progress line**: "How far along?" (tests passed, commit hash, elapsed time)
- **Project line**: "Which project?" (working directory)

### Parsing Rules (Critical)

**State detection** (WORKING/DONE/ERROR/IDLE) — only check LAST 10 lines:
- Codex code scrollback contains words like `failed`, `error`, `execution_failed`
- These are code identifiers, not worker status — checking them causes false ERROR
- The actual status lives in the bottom 6 lines: `Working (Xs)`, prompt line, model bar

**Action description** — extracted from last bullet line in scrollback (skip "Working (Xs)")

**Progress info** (card, tests, commit) — safe to parse from full scrollback

### Auto-detection

| Condition | Exit Code | Meaning |
|-----------|-----------|---------|
| Pane gone | 1 | Worker pane killed/closed |
| `completed` in status area | 0 (after message) | Worker finished task |
| `ERROR` in status area | 1 (after message) | Worker hit real error |
| Same snapshot 3x | Warn inline | Worker may be stuck |

### Heartbeat in Background

```bash
# Run in background, log to file
nohup mw-heartbeat 5 30 100 > /tmp/heartbeat_w5.log 2>&1 &

# Check latest report
tail -20 /tmp/heartbeat_w5.log
```

## Routing Policy

The manager should choose the execution path deliberately. Delegation is not
the default; it is a decision.

### Path Selection Matrix

| Situation | Preferred path | Why |
|-----------|----------------|-----|
| Request is ambiguous, tightly coupled, or needs framing first | direct manager work | shape the task before delegation |
| One bounded task with a single write scope | one worker | fastest clean delegation |
| Several independent tasks with disjoint write scopes | staged multi-worker | parallelism without chaos |
| Shared write scope, unclear ownership, or missing `DONE` | block or keep local | delegation would create rework |
| High-risk review run with likely nested fan-out | staged batches | reduce stall and postmortem ambiguity |

### Routing Rules

1. Prefer **direct manager work** when:
   - the task still needs framing
   - the operator's intent is more important than raw speed
   - the work is tightly coupled across files or decisions
2. Prefer **one worker** when:
   - the task is concrete
   - the write scope is clear
   - the manager can define `DONE` in one pass
3. Prefer **staged multi-worker** when:
   - work can be split into independent slices
   - each slice has its own `WORKDIR`, `TASK`, and `DONE`
   - partial success is acceptable and explicitly defined
4. **Block delegation** when:
   - the manager lacks enough context for a complete contract
   - the work would send two workers into the same write scope without coordination
   - the operator expectation is still being translated into an actionable task

### Routing Bias

- Bias toward fewer workers when uncertainty is high
- Bias toward clearer `DONE` over maximum parallelism
- Bias toward staged fan-out over large all-at-once fan-out
- Bias toward manager-local synthesis when the real work is still task shaping

### Operator Routing Defaults

Use these defaults unless the operator explicitly overrides them.

1. **Manager-first by default**
   - if the request is high-level, the manager shapes it first instead of delegating raw text
2. **One worker before many**
   - if one good worker can finish the task cleanly, do not fan out yet
3. **Staged fan-out before maximum fan-out**
   - parallelism is allowed only after ownership, `DONE`, and partial-success criteria are clear
4. **Human-facing reporting**
   - report current action, task, progress, and next step
   - do not optimize for token metrics or machine-oriented status text
5. **Preference capture is part of the work**
   - if the operator reveals a stable preference, record it in docs or memory instead of leaving it only in chat
6. **Next-step bias**
   - after finishing a subtask, name the nearest unblocked next step instead of stopping at a generic summary

### Preferred Routing Outcomes

| Task shape | Default path |
|------------|--------------|
| vague, strategic, or preference-heavy request | direct manager synthesis |
| concrete bounded implementation or repo operation | one worker |
| several independent bounded slices | staged multi-worker |
| unclear ownership or acceptance criteria | block and refine contract |

## Multi-Worker Orchestration

**Layout**: All workers in right column, stacked vertically.

```bash
# First worker creates the right column in the SAME TAB as manager
WORKER1=$(wezterm cli split-pane --pane-id "${WEZTERM_PANE:?}" --right --percent 50 -- bash -c 'exec bash')

# Additional workers split BOTTOM from right column (NOT right again!)
WORKER2=$(wezterm cli split-pane --bottom --pane-id "$WORKER1" --percent 50 -- bash -c 'exec bash')
WORKER3=$(wezterm cli split-pane --bottom --pane-id "$WORKER2" --percent 50 -- bash -c 'exec bash')

# Start codex_wp in each
for W in "$WORKER1" "$WORKER2"; do
    wezterm cli send-text --pane-id "$W" "codex_wp"$'\x0d'
done

# Send different tasks (use -C to set isolated workdir)
wezterm cli send-text --pane-id "$WORKER1" "codex_wp -C /tmp/task-a exec 'task A'"
sleep 0.3
wezterm cli send-text --pane-id "$WORKER1" $'\x0d'

wezterm cli send-text --pane-id "$WORKER2" "codex_wp -C /tmp/task-b exec 'task B'"
sleep 0.3
wezterm cli send-text --pane-id "$WORKER2" $'\x0d'
```

### Nested Fan-Out Guardrail

`manager -> worker` fan-out is usually stable.
`worker -> subagent` fan-out is more fragile.

Rules:
1. Treat layouts like `3 workers x 6 subagents` as experimental high-risk runs
2. Prefer staged batches:
   - `1 worker + 6 subagents`
   - or `3 workers + 1-2 subagents each`
   - then a second wave if needed
3. If the operator explicitly wants large all-at-once fan-out:
   - isolate every worker in its own copied repo under `/tmp/<run-id>/worker-N`
   - capture `worker-N-terminal.log` for every worker
   - define partial-success criteria before launch
4. If logs stall on repeated `collab: Wait`, `write_stdin failed`, or
   router/resource errors, stop the run, preserve logs, and summarize verified
   findings instead of pretending the run completed cleanly
5. After each spawn, confirm visibility and startup before moving on to the next worker

## MANDATORY: Manager-Worker Task Assignment Contract

> **Every task assigned to a worker MUST follow this contract.**
> If any field is missing or unclear, the manager MUST block task assignment
> and resolve the gap before proceeding (see Interview Protocol below).

### The 6-Field Task Contract

Every task prompt sent to a worker must contain ALL 6 fields:

```
WORKDIR:     Where the worker runs (absolute path)
CONTEXT:     Situation — what exists, what we are working on
PROBLEM:     Why this needs to be done — what is broken or missing
TASK:        Specific action required from the worker
DONE:        Definition of Done — how we verify success
REFERENCES:  Links to files, docs, cards — maximum context for understanding
```

### Field Details

#### 1. WORKDIR (mandatory, first field)

**Why this exists**: Workers launched in the same directory will conflict.
They read the same `.MEMORY/NOW.md`, pick up kanban context, and duplicate tasks.
This was the root cause of Worker 7 starting kanban cards instead of its isolated task.

**Rules**:
- Every worker for an **isolated task** gets its own directory: `/tmp/worker-N-task`
- Workers sharing a project must be explicitly coordinated
- If WORKDIR is not set, the worker defaults to cwd — this is DANGEROUS
- Never spawn 2 workers in the same directory for different tasks

#### 2. CONTEXT (mandatory)

Brief description of the project, system, or codebase the worker operates in.
What exists now, what is the current state.

#### 3. PROBLEM (mandatory)

Why this task exists. What is broken, missing, or needs improvement.
The worker must understand WHY before it can make good decisions.

#### 4. TASK (mandatory)

Clear, specific, single action. One task per assignment.
If you catch yourself writing "and also..." — split into two tasks.

#### 5. DONE — Definition of Done (mandatory)

Concrete, verifiable criteria. Examples:
- `test command X passes with 0 failures`
- `file /path/to/script exists and is executable`
- `grep -c "pattern" file returns N`
- `git log --oneline -1 contains "message fragment"`

The worker should be able to self-verify against these criteria.

### DONE Template Library

Do not invent `DONE` from scratch every time. Start from the nearest template
and then specialize it.

#### Template: implementation change

Use when the worker edits code or scripts.

```text
DONE:
  - target files are updated
  - the relevant lint/type/test command passes
  - no unrelated files were modified
  - `git diff --stat` matches the intended scope
```

#### Template: review or audit

Use when the worker should inspect and report rather than edit.

```text
DONE:
  - findings are written with file references
  - severity or risk is explicit
  - no code changes were made unless requested
  - open questions and assumptions are listed separately
```

#### Template: docs or skill update

Use when the worker edits markdown guidance, prompts, or reusable skills.

```text
DONE:
  - the target docs or skill files are updated
  - terminology is consistent with governing instructions
  - the new rule or workflow is placed in the canonical section
  - duplicated or conflicting guidance is removed or called out
```

#### Template: git publish or release step

Use when the worker must commit, create a remote, or push.

```text
DONE:
  - relevant changes are committed with the intended message shape
  - secrets scan is clean
  - the remote state is explicit (`origin` updated, created, or not applicable)
  - push result is reported with the exact branch
```

#### Template: investigation or reproduce

Use when the worker must prove or disprove behavior.

```text
DONE:
  - the reproduce or probe steps are listed exactly
  - observed result is captured
  - conclusion states reproduced | not reproduced | inconclusive
  - artifacts or logs are saved when relevant
```

### DONE Quality Rules

- `DONE` must be observable, not aspirational
- `DONE` should name commands, files, or artifacts whenever possible
- `DONE` should distinguish success evidence from summary language
- If the task has multiple phases, either split the task or define stage-specific `DONE`

## Task-Packet Examples

Use these examples as defaults when the task shape matches. Keep the shape,
then replace the specifics.

### Example 1: Skill update in operator-preferred format

Use when the manager updates a reusable skill and the operator cares about
stable policy, not only the immediate edit.

```text
WORKDIR: /tmp/worker-skill-update
CONTEXT: We maintain a reusable manager skill. High-level expectations require
manager-first intake, stable routing rules, and reusable task shapes instead of
ad hoc delegation.
PROBLEM: The skill has policy, but it does not yet encode the operator's
preferred packet format and routing defaults strongly enough.
TASK: Update the target skill file so it includes concrete packet examples and
default routing behavior that match the current operator expectations.
DONE:
  - the target skill file is updated
  - the new examples sit in the canonical section of the skill
  - terminology matches the governing docs and memory
  - duplicated or conflicting guidance is removed or called out
REFERENCES:
  - target SKILL.md
  - HIGHLEVELEXPECTATIONS.md
  - relevant operator-expectation memory card

STOP after completing this task. Do NOT continue to other work.
```

### Example 2: Repo publish worker

Use when the operator wants a worker to own a repo bootstrap, commit, remote,
and push flow.

```text
WORKDIR: /tmp/worker-repo-publish
CONTEXT: The target directory contains the publishable source of a reusable
skill or tool. The operator wants this handled through a worker, not inline.
PROBLEM: The target path is not yet fully published as a clean repo state with
explicit commit history and pushed remote branch.
TASK: Initialize or verify git in the target directory, inspect all changes,
organize atomic commits, create or verify the remote, and push the branch.
DONE:
  - git status is clean after the worker finishes
  - the intended commits exist locally
  - remote state is explicit (`origin` created, reused, or updated)
  - push result names the exact branch and remote URL
REFERENCES:
  - target repo path
  - auto-commit skill instructions if they govern the flow
  - any operator note about message style or visibility

STOP after completing this task. Do NOT continue to other work.
```

### Example 3: Read-only review worker

Use when the operator wants findings, not edits.

```text
WORKDIR: /tmp/worker-review
CONTEXT: The manager needs an independent review pass over a bounded scope.
PROBLEM: We need validated findings with severity and evidence, without mixing
them with implementation work.
TASK: Review the target scope and produce findings-first output with file
references, risks, and open questions. Do not modify code unless explicitly requested.
DONE:
  - findings are written with file references
  - severity or risk is explicit for each finding
  - no code changes were made unless requested
  - assumptions and open questions are listed separately
REFERENCES:
  - target files or diff range
  - governing review instructions
  - relevant memory cards if prior incidents matter

STOP after completing this task. Do NOT continue to other work.
```

### Example 4: Reproduce or investigation worker

Use when the manager needs proof before deciding the next action.

```text
WORKDIR: /tmp/worker-reproduce
CONTEXT: The manager has a suspected bug, regression, or workflow failure.
PROBLEM: Routing or implementation would be premature without reproduce evidence.
TASK: Run the exact probe or reproduction steps, capture the observed behavior,
and conclude whether the issue is reproduced, not reproduced, or inconclusive.
DONE:
  - reproduce steps are listed exactly
  - observed result is captured
  - conclusion states reproduced | not reproduced | inconclusive
  - relevant logs or artifacts are saved
REFERENCES:
  - suspect files, commands, or logs
  - previous lessons if similar failures already happened
  - target environment details

STOP after completing this task. Do NOT continue to other work.
```

## Task-Packet Formatting Defaults

When the operator does not ask for a custom format, use this order exactly:

```text
WORKDIR:
CONTEXT:
PROBLEM:
TASK:
DONE:
REFERENCES:

STOP after completing this task. Do NOT continue to other work.
```

Formatting defaults:
- keep `TASK` singular
- keep `DONE` flat and verifiable
- keep `REFERENCES` concrete, not generic
- prefer absolute paths
- keep the packet readable enough to paste directly into a worker session

#### 6. REFERENCES (mandatory)

Paths, URLs, card numbers, documentation links. Maximum context.
The more references, the less the worker needs to explore and guess.

**Also include**: `STOP after completing this task. Do NOT continue to other work.`
This prevents workers from reading .MEMORY and picking up unrelated kanban tasks.

### Example — BAD (incomplete)

```
Create a wrapper script codex_wp_review
```

Missing: WORKDIR, CONTEXT, PROBLEM, DONE, REFERENCES, STOP directive.

### Example — GOOD (complete)

```
WORKDIR: /tmp/worker7-codex-review
CONTEXT: We have a manager-worker system using codex_wp in WezTerm panes.
The implementation-skill uses 'codex-review' which calls raw 'codex' binary.
codex_wp is installed at /home/pets/.local/bin/codex_wp.
PROBLEM: Raw 'codex review' requires MCP auth token which is expired,
causing "token_expired" errors and breaking automated review in workers.
codex_wp review does NOT proxy to codex review — it only shows wrapper flags.
TASK: Create a wrapper script /home/pets/.local/bin/codex_wp_review that:
  1. Proxies ALL arguments to 'codex review'
  2. Logs each call with timestamp and exit code to /tmp/codex_wp_review.log
  3. Preserves the upstream exit code
DONE:
  - Script exists at /home/pets/.local/bin/codex_wp_review and is executable
  - Running 'codex_wp_review --help' shows codex review help (not wrapper help)
  - Log file is created on first call
REFERENCES:
  - /home/pets/.local/bin/codex_wp (existing wrapper, for reference)
  - /home/pets/TOOLS/manager_wezterm_cli/.MEMORY/0006-lessons-learned.md (Lesson 8)
  - codex_wp review --help vs codex review --help (different output — see lesson)

STOP after completing this task. Do NOT continue to other work.
```

### Interview Protocol — When Manager Lacks Information

If the manager cannot fill ALL 6 fields of the contract, the manager MUST:

1. **BLOCK** task assignment. Do NOT send incomplete tasks to workers.
2. **GATHER** — Before interviewing the operator, the manager must independently collect as much context as possible:
   - Read relevant files, check existing code, search for documentation
   - Check `.MEMORY/` for related lessons or prior work
   - Look at the kanban board, previous implementation runs
3. **INTERVIEW** — Ask the operator only for what could NOT be independently gathered:
   - Business intent (WHY)
   - Acceptance criteria (what "done" looks like from business perspective)
   - Priority and constraints
4. **FORMULATE** — After the interview, fill the complete contract and confirm with the operator before sending to the worker.

**Rule**: An incomplete task sent to a worker wastes more time than a delayed task.

### Pre-Flight Checklist

Before sending any task to a worker, verify:

- [ ] WORKDIR is set and different from other active workers
- [ ] CONTEXT explains the situation
- [ ] PROBLEM explains why this matters
- [ ] TASK is specific and singular
- [ ] DONE has concrete verification criteria
- [ ] REFERENCES include maximum useful context
- [ ] STOP directive is included (for isolated tasks)
- [ ] Worker pane exists and is ready (check with `wezterm cli list`)
- [ ] If the worker is expected to be visible, it is spawned in the same tab as the manager pane
- [ ] Immediate post-spawn diagnostics are run (`pane_id`, `tab_id`, position, startup text)
- [ ] Periodic observability is planned (`mw-heartbeat` or repeated `get-text`)
- [ ] For long/headless tasks, a prompt file + launcher script + log path are prepared
- [ ] If workers will spawn subagents, the total fan-out is justified and partial-success criteria are defined

## Key Sequences

| Key | Hex | Usage |
|-----|-----|-------|
| Enter | `$'\x0d'` | Submit prompt |
| Ctrl+C | `$'\x03'` | Interrupt/clear |
| Ctrl+D | `$'\x04'` | EOF |

## Common Issues

### Issue: Heartbeat shows false ERROR
**Cause**: Code scrollback contains words like `failed`, `error`, `execution_failed`
**Fix**: Only check last 10 lines for state detection (status area, not scrollback)

### Issue: Text appears but not submitted
**Cause**: Enter sent too fast after text
**Fix**: Add `sleep 0.3` between text and Enter

### Issue: Worker not responding
**Cause**: codex_wp waiting for trust confirmation
**Fix**: Send "1" + Enter on first start

### Issue: Can't find worker pane
**Cause**: Pane ID changed after split
**Fix**: Always capture split-pane output

### Issue: Long multi-line prompt is brittle via send-text
**Cause**: `send-text` is fine for short prompts, but long contracts and quoting
are fragile
**Fix**: Put the prompt in a file and start the worker through a launcher script
that runs `codex_wp exec ... - < prompt.txt |& tee log`

### Issue: Large nested review run stalls on delegated waits
**Cause**: worker->subagent fan-out can wedge even while the top-level worker
process stays alive
**Signals**: repeated `collab: Wait`, `write_stdin failed`,
`resources/read failed`, and no final artifact
**Fix**: Stop panes, preserve `worker-N-terminal.log`, extract verified
findings, and rerun in staged batches or with fewer subagents

## Files

```
~/.agents/skills/manager-worker/
├── SKILL.md              # This file
└── bin/
    ├── mw-heartbeat      # Heartbeat observer (human-friendly)
    ├── mw-send           # Send prompt to worker
    ├── mw-spawn          # Create worker pane
    ├── mw-start          # Start codex_wp in pane
    └── mw-trust          # Accept trust prompt
```

## Requires

- WezTerm with `wezterm cli`
- codex_wp installed
- Workers run in separate panes

## Related

- `$wezterm` — pane management primitives
- `.MEMORY/0007-lesson-1-basic-communication.md` — detailed findings
