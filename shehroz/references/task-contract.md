# Task Contract Reference

Use this when assigning work to a worker or reviewing an existing task packet.

## Contents

- Canonical packet
- Field meanings
- `DONE` template library
- Interview protocol
- Pre-flight packet checklist
- Short examples

## Canonical Packet

Use this order exactly:

```text
WORKDIR:
CONTEXT:
PROBLEM:
TASK:
DONE:
REFERENCES:

STOP after completing this task. Do NOT continue to other work.
```

## Tiny Literal-Prompt Exception

The 6-field packet is still the default for real worker assignments.

Exception:
- if the operator already supplied the exact literal prompt
- and the run is only a tiny visible smoke/probe or one-turn minimal answer
- and no code-changing or ambiguous multi-step work is expected

Then Shehroz may launch:

```bash
codex_wp "<prompt>"
```

Rules for that exception:
- use it only for tiny self-contained interactive runs
- do not use `codex_wp exec "<prompt>"` when the goal is a visible interactive
  worker; `exec` is the headless path
- if Stop-hook review is required, install the hook before launching the
  worker process
- preserve the literal prompt in the run root when later review matters

## Field Meanings

### `WORKDIR`

Absolute path where the worker runs.

Rules:
- isolated tasks should get their own workdir; run-root artifacts must go
  under `$MANAGER_MEMORY_ROOT/TRELLO/projects/<slug>/runs/` (never `/tmp/`)
  per SKILL.md rule 27; the workdir itself may be the project repo or a
  dedicated subdirectory
- do not send different tasks into the same workdir unless shared ownership is
  explicit
- do not rely on ambient cwd

### `CONTEXT`

The local truth the worker needs before acting:
- what project or system this is
- what exists now
- what current state matters

### `PROBLEM`

Why the task exists:
- what is broken, missing, risky, or blocked
- why the task matters now

### `TASK`

One specific action.

Rules:
- keep it singular
- if the sentence drifts into "and also", split the work
- do not use `TASK` to hide acceptance criteria or extra phases

### `DONE`

Observable success criteria.

Rules:
- name commands, files, logs, or artifacts whenever possible
- keep it flat and verifiable
- distinguish proof from summary language
- if the task has multiple phases, split the task or define stage-specific
  `DONE`

### `REFERENCES`

Concrete context the worker should read instead of rediscovering:
- absolute paths
- cards, plans, or docs
- diff ranges or target files
- commands or logs when behavior proof matters

### `STOP` Directive

Always include:

```text
STOP after completing this task. Do NOT continue to other work.
```

Use it for isolated tasks so the worker does not drift into unrelated `.MEMORY`
or kanban work.

## `DONE` Template Library

### Implementation change

```text
DONE:
  - target files are updated
  - the relevant lint/type/test command passes
  - no unrelated files were modified
  - `git diff --stat` matches the intended scope
```

### Review or audit

```text
DONE:
  - findings are written with file references
  - severity or risk is explicit
  - no code changes were made unless requested
  - assumptions and open questions are listed separately
```

### Docs or skill update

```text
DONE:
  - the target docs or skill files are updated
  - terminology is consistent with governing instructions
  - the new rule or workflow is placed in the canonical section
  - duplicated or conflicting guidance is removed or called out
```

### Git publish or release step

```text
DONE:
  - relevant changes are committed with the intended message shape
  - secrets scan is clean
  - the remote state is explicit
  - push result is reported with the exact branch
```

### Investigation or reproduce

```text
DONE:
  - the reproduce or probe steps are listed exactly
  - observed result is captured
  - conclusion states reproduced | not reproduced | inconclusive
  - artifacts or logs are saved when relevant
```

## Visible Talha Packet Add-On

When the packet is for Talha as a visible interactive worker under
`$shehroz`, shape the 6 fields with the stop-hook review in mind before the
worker starts.

What the packet should already imply:

- Shehroz will install the temporary repo-local Stop hook before submit
- the hook must wake the manager pane with a short visible message
- the run must leave a reviewable run root for post-stop inspection

Where to carry that context:

- `CONTEXT` should mention that this is a visible Talha run under Shehroz with
  temporary Stop-hook wakeup back to the manager pane
- `DONE` should require the proof artifacts or result files that Shehroz must
  inspect after the stop
- `REFERENCES` should include the board card, worker-comm record, and any
  target files or artifacts Shehroz will review after the wakeup

Practical rule:
- do not write a Talha packet that answers only "what to do"
- also shape it so the stop-hook wakeup answers "what Shehroz should inspect
  the moment Talha stops"

## Prompt Preservation Protocol

Every manager-to-worker prompt must be durable inside the run root, not only
visible in chat or pane history.

Minimum shape:
- `prompt.md` mirrors the latest exact submitted prompt
- `prompt-history.jsonl` records every submitted prompt with timestamp,
  destination pane, and source artifact path
- `prompts/task.txt` is the canonical initial assignment
- later follow-ups should be materialized first as
  `prompts/followup-001.txt`, `prompts/followup-002.txt`, and so on

Rules:
- do not send a real worker follow-up that exists only as ephemeral typed text
- if the next step is a one-off corrective message, save it under `prompts/`
  before submission and record it in `prompt-history.jsonl`
- chat transcript, pane scrollback, or cron-fire context do not replace the
  run-root prompt ledger

## Interview Protocol

If the manager cannot fill all six fields:

1. Block delegation.
2. Gather what can be learned independently from files, memory, docs, and
   board truth.
3. Ask the operator only for what cannot be discovered locally:
   - business intent
   - acceptance criteria
   - priority or constraints
4. Rewrite the packet only after those gaps are resolved.

An incomplete task costs more than a delayed task.

## Pre-Flight Packet Checklist

- `WORKDIR` is explicit
- `CONTEXT` reflects current local truth
- `PROBLEM` explains why the task matters
- `TASK` is singular
- `DONE` is concrete and self-verifiable
- `REFERENCES` are specific and useful
- the `STOP` directive is present when the task is isolated

## Short Examples

### Good review packet

```text
WORKDIR: /abs/repo-or-workdir
CONTEXT: bounded review over the target diff
PROBLEM: the manager needs findings without mixing review with implementation
TASK: review the target scope and report findings first
DONE:
  - findings are written with file references
  - severity is explicit
  - no code changes were made
REFERENCES:
  - /abs/path/to/repo
  - /abs/path/to/diff-or-target-files

STOP after completing this task. Do NOT continue to other work.
```

### Bad packet

```text
Create a wrapper script.
```

Missing:
- `WORKDIR`
- `CONTEXT`
- `PROBLEM`
- `DONE`
- `REFERENCES`
- `STOP`
