# Worker Memory Records

Use this when the active project already has a Trello-style board under
`$MANAGER_MEMORY_ROOT/TRELLO/projects/<project>/` and Shehroz needs durable
board-local md records for manager/worker communication.

**Memory Root:** All `.MEMORY/` paths below resolve against
`MANAGER_MEMORY_ROOT = /home/pets/TOOLS/manager_wezterm_cli/.MEMORY/`, not
CWD. This root is canonical on `pets`; if the active manager loop is running
from another host, sync the durable record back to `pets` before treating it
as recorded truth.

This pattern is especially useful for:
- named recurring workers such as developer `Talha`
- QA/testing workers such as `Saad`
- read-only consultations whose result still changes Shehroz's next decision
- long project runs where worker context should survive beyond the terminal pane

## Purpose

These records are not raw transcripts.

They exist to preserve the durable manager-facing communication layer:
- who this worker is in the project
- what role the worker owns
- which card/workstream the worker is serving
- what task contract or verdict matters now
- what Shehroz should remember on re-entry

## Preferred location

Store board-local worker communication records under:

`$MANAGER_MEMORY_ROOT/TRELLO/projects/<project>/00-info/worker-comms/`

Why there:
- `00-info` is the steering/artifact lane
- worker communication is project-local steering, not global preference or ops policy
- the board remains readable without turning every lane into a conversation dump

## Naming pattern

Prefer one stable md file per named worker/role:

- `developer-talha.md`
- `qa-saad.md`
- `reviewer-<name>.md`
- `explorer-<name>.md`

Keep the file stable and update it over time instead of creating a new note for
every small message.

## What to record

Record only durable communication facts such as:
- current role and responsibility
- current assigned card/workstream
- latest bounded task contract summary
- latest verified result or blocker
- active run root / pane / artifact pointers when they still matter for re-entry
- next expected handoff between Shehroz and that worker

Do not store:
- full terminal transcript dumps
- every heartbeat line
- repeated low-signal chatter that already exists in run logs

## Minimal template

```md
# <role> — <name>

Created:
Status:
Scope:
Update trigger:

## Current role

- role:
- project:
- board card:
- current lane:

## Current contract

- intent:
- bounded task:
- done shape:
- references:

## Latest manager -> worker note

- summary:
- run root:
- pane:

## Latest worker -> manager result

- verdict:
- evidence:
- blocker or next step:
```

## Update moments

Update the record when:
- Shehroz assigns a new bounded task to a named recurring worker
- Shehroz asks a named role for a bounded read-only consultation that changes
  the next manager move
- the worker returns a durable QA/developer verdict
- the worker becomes blocked in a way that affects the project board
- ownership changes between developer and QA roles

## Relationship to canonical cards

These worker records do not replace:
- canonical project cards under `$MANAGER_MEMORY_ROOT/projects/<project>/`
- package SSOT such as remote `kanban.json`
- run-root artifacts

They are the board-local bridge between:
- Shehroz’s decisions
- named worker roles
- project re-entry

## Default role examples

- `Talha` -> developer / implementation worker
- `Saad` -> QA / acceptance worker

Use those names only when the operator has actually adopted them for the active
project. Otherwise keep the same role-based pattern with the real worker name.
