# Feedback: sdd-qa-wall flow polish (2026-02-07)

## What failed in prior run
- Implementation started too early after package generation.
- Trello cards were structurally valid but cognitively shallow.
- Cards lacked expanded context from raw requirements.
- Cards lacked consistent references/linked-card cohesion/checklist depth.

## What is now enforced
- Mandatory `HOLD_FOR_USER_REVIEW` after package generation.
- Mandatory `Trello Guardian Review` before user review handoff.
- Mandatory `SDD PACKAGE REVIEW HOLD` checkpoint.
- Mandatory simplified user snapshot with visualization before HOLD:
  - `### SDD Package Snapshot (Simple)`
  - `### SDD Package Visual Status`
- No implementation in same turn as SDD/Trello package generation.
- Canonical card template lock:
  - `references/_flows/feature_2_trello/TRELLO_TEMPLATES/card-XX-template.md`
- Task orchestration tags per `TASK-*`:
  - `Execution Mode: PARALLEL|SEQUENTIAL`
  - `Parallel Blockers: TASK-...|none`
  - intended for future spawned-agent parallel execution planning

## Card quality standard uplift
- Required sections now include:
  - `Description`
  - `Raw Requirement Context`
  - `Must Have`
  - `Acceptance Criteria`
  - `Checklist`
  - `References`
  - `Linked Cards`
- Required card content now includes:
  - requirement traceability
  - actionable implementation checklist
  - concrete touchpoints
  - contract/code snippet evidence

## Validator updates
- `validate-sdd.sh` now checks for:
  - description + raw requirement context
  - checklist depth (`>=4` checkbox items)
  - references + linked cards sections
  - fenced code/contract snippet evidence
  - stronger cognitive pass threshold
  - per-task orchestration markers (`Execution Mode` + `Parallel Blockers`)

## External references used
- Atlassian: user stories in Agile software development.
  - https://www.atlassian.com/agile/project-management/user-stories
- Atlassian: acceptance criteria explained and examples.
  - https://www.atlassian.com/agile/project-management/acceptance-criteria
- Atlassian: Definition of Done and quality accountability.
  - https://www.atlassian.com/agile/project-management/definition-of-done
- Trello support: card details and execution artifacts.
  - https://support.atlassian.com/trello/docs/adding-attachments-to-cards/
  - https://support.atlassian.com/trello/docs/adding-checklists-to-cards/
