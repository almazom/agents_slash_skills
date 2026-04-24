---
name: sdd-qa-wall
description: Run a strict SDD QA wall interview before implementation with confidence/approval gates and dual outputs (single SDD or Kanban/Trello card package). Use when requirements are raw, volatile, fragmented, incomplete, or when user invokes $sdd-qa-wall.
triggers: sdd-qa-wall, $sdd-qa-wall, SDD, QA wall, requirements gate, requirements interview, SDD QA, confidence gate, approval gate, pre-implementation requirements, SDD plan
---

# SDD QA Wall

## Skill trace

- Follow the governing `AGENTS.md` skill-trace contract when one exists.
- Fallback examples: `🚀🛡️ [skill:sdd-qa-wall] ON ...`, `🛠️🛡️ [skill:sdd-qa-wall] STEP ...`, and `✅🛡️ [skill:sdd-qa-wall] DONE ...`.

## Overview

Create a hard requirements gate between user request and implementation.
Gather requirements, close critical gaps, generate SDD artifacts, and block implementation until explicit approval.

## Non-negotiable gates

- No implementation before SDD is saved to `docs/sdd_qa_plans/...`.
- No implementation before explicit `APPROVED_FOR_IMPLEMENTATION`.
- No implementation in the same turn where SDD/Trello package artifacts are generated.
- After package generation, mandatory state is `HOLD_FOR_USER_REVIEW` until user explicitly confirms card quality.
- Before entering `HOLD_FOR_USER_REVIEW`, mandatory user-facing simplified report with visual status of generated SDD/Trello package must be printed.
- `request_user_input` must be used for interview questions.
- If `request_user_input` is unavailable, enter HOLD and ask user to switch to Plan mode.
- Route-choice gate is mandatory after task type:
  - always present both options:
    - `SINGLE_SDD`
    - `KANBAN_PACKAGE` (Trello cards emulation)
  - user can select `KANBAN_PACKAGE` for any task type (`Feature`, `Fix`, `Debug`, `Improvement`, `Integration`).
  - explicit user route choice has priority over automatic defaults.
- Confidence gate required before clarifying questions:
  - `OverallConfidence >= 95`
  - open `Blocker` gaps = 0
  - open `High` gaps = 0
- If `delivery_route = KANBAN_PACKAGE`, all checks below are mandatory:
  - Print route markers in UI output:
    - `### Route Lock: KANBAN_PACKAGE`
    - `### KANBAN MODE ACTIVATED`
    - `### START.md Source`
    - `### START.md Bridge Launch`
    - `### START.md Preflight`
    - `### KANBAN Execution Transcript`
  - Resolve canonical START.md by strict priority and launch only via resolved path:
    - `user_provided_start_md_path` (if explicitly provided by user in current turn)
    - `references/_flows/feature_2_trello/START.md` (bundled portable default)
  - Build and print a full pre-generation Trello card manifest derived from START.md flow:
    - mandatory header: `### Planned Trello Cards`
    - include every planned card filename as numbered list (`01-*.md ... NN-*.md`)
    - include one-line purpose for each card
    - this section must appear in user-visible plan output
  - Template lock for all numbered cards:
    - always generate numbered cards from:
      - `references/_flows/feature_2_trello/TRELLO_TEMPLATES/card-XX-template.md`
    - shrinking/simplifying/removing sections from this template is not allowed
    - if user provides a richer template, replace this file and keep template lock to the same path
  - Run `Smart Cognitive Layer` before Trello card generation:
    - atomize requirements into normalized units (`REQ-001..REQ-N`)
    - cluster units into delivery slices (`SLICE-01..SLICE-N`)
    - build dependency graph (`REQ/SLICE -> REQ/SLICE`)
    - compute complexity and risk signals per slice (`low|medium|high`)
    - map slices to proposed `NN-card` set before writing cards
    - block if any requirement is unmapped
  - Run START.md preflight before bridge launch:
    - print resolver candidates in priority order
    - verify file exists and is readable
    - print exact path used
    - set metadata:
      - `start_md_source: USER_PROVIDED | BUNDLED_SNAPSHOT`
      - `start_md_resolution_candidates`
    - if preflight fails, set `kanban_gate_status = HOLD_START_MD_MISSING` and stop
  - Deliver both artifacts:
    - master SDD file in `docs/sdd_qa_plans/<YYYY-MM-DD>_<short_slug>.md`
    - full Trello package in `docs/sdd_qa_plans/<YYYY-MM-DD>_<short_slug>/`
  - Run artifact integrity checks (all required files exist and are non-empty).
  - Ensure numbered cards exist: `kanban_cards_count >= 1`.
  - Ensure planned-vs-generated card parity:
    - `planned_trello_cards_count >= 1`
    - every planned `NN-card` has a generated file
    - no generated `NN-card` is missing from planned manifest
  - Enforce `Expert Trello Card Cognitive Standard` for every numbered card (`01..NN`):
    - no strict heading names required; semantic completeness is required
    - each card must cognitively cover these dimensions:
      - expanded description/context anchored to raw requirements (why/what/from where)
      - intent/value (why this slice matters)
      - implementation path (ordered execution plan)
      - implementation checklist with atomic TODO items
      - task execution-mode markers for orchestration (`Execution Mode: PARALLEL|SEQUENTIAL` + `Parallel Blockers`)
      - concrete touchpoints (files/APIs/data contracts)
      - concrete example snippet (`json` contract, pseudocode, or code fragment when relevant)
      - risk and edge-case handling
      - validation strategy (tests + measurable done conditions)
      - references and linked-card context (cross-card cohesion)
      - dependency context (what must be done before/after)
    - prohibited in final cards:
      - unresolved placeholders (`{...}`, `TODO`, `TBD`, `path/to/...`)
      - template-only wording without project-specific details
  - Keep validator-compatible minimum format (to reduce false negatives):
    - `requirements.md` must include:
      - `# Feature: ...`
      - `## Description`
      - `## Requirements` with `-` bullet list
    - every numbered `NN-card` must include:
      - `**SP:** <1..4>`
      - `**Depends On:** ...`
      - `## 📋 Описание (Description)`
      - `## 🌍 Контекст (Context)`
      - `## 📎 Ссылки и материалы (References)`
      - `## 🔗 Зависимости и блокировки (Dependencies)`
      - `## ✅ Критерии приёмки (Acceptance Criteria)`
      - `## 🧪 Тестирование (Testing)`
      - `## ✅ To-Do List (Обязательные задачи)`
      - for every `TASK-*` item in To-Do:
        - `**Execution Mode:** PARALLEL | SEQUENTIAL`
        - `**Parallel Blockers:** TASK-... | none`
  - Pass quality gate:
    - `confidence_requirements_coverage_percent >= 95`
    - `confidence_artifact_quality_percent >= 95`
    - `trello_card_cognitive_gate_percent >= 95`
  - Run post-generation readiness review before approval:
    - mandatory header: `### Cognitive Readiness Review`
    - compare `raw_requirements` vs generated `NN-card` set
    - score and print:
      - `raw_requirements_coverage_percent`
      - `trello_alignment_percent`
      - `implementation_readiness_percent`
      - `user_expectations_alignment_percent`
    - pass rule:
      - all four metrics `>= 95`
      - `missing_critical_requirements_count = 0`
      - `readiness_recommendation = READY_TO_IMPLEMENT`
    - on fail: set `kanban_gate_status = HOLD_REGENERATE` and continue regeneration
  - If any check fails: set `kanban_gate_status = HOLD_REGENERATE` and continue regeneration loop until `PASS`.
  - Never switch to implementation in the same turn as package generation, even when `kanban_gate_status = PASS`.

## Mode behavior

- Prefer Plan mode for this workflow.
- If Plan mode is not active and `request_user_input` cannot run:
  - HOLD
  - Ask user to switch mode:
    - Codex CLI/TUI: `/plan`
    - Codex App: `/plan-mode`
  - Resume only after user confirms.

## Workflow

1. Load and follow `references/sdd-qa-wall-flow.md`.
2. Run the interview and gates exactly as written.
3. Ask route choice and then lock output topology (`delivery_route`).
4. If route is `KANBAN_PACKAGE`, print activation markers and trigger canonical `START.md` bridge.
5. Run Trello artifact integrity checks, confidence gates, and cognitive readiness review.
6. If needed, run auto-diagnose/regenerate loop until all KANBAN checks pass.
7. Produce `<proposed_plan>` with explicit Kanban completion report.
8. Persist artifacts under `docs/sdd_qa_plans` and write metadata.
9. Run `Trello Guardian Review` (expert audit of card quality/completeness), regenerate if needed.
10. Print simplified package report with visualization, then enter `HOLD_FOR_USER_REVIEW` before any implementation.
11. Run approval gate and set status in file.
12. Enforce change control after approval (CR -> re-open gate).

## KANBAN delivery contract

When `delivery_route = KANBAN_PACKAGE`, the agent must stay fully on card-splitting flow until completion.
Stopping after template-only output or partial cards is forbidden.
Starting project implementation files before `### KANBAN PACKAGE READY` is forbidden.
Starting implementation in the same turn after `### KANBAN PACKAGE READY` is also forbidden.

Mandatory report headers:

- `### Route Lock: KANBAN_PACKAGE`
- `### KANBAN MODE ACTIVATED`
- `### START.md Source`
- `### START.md Preflight`
- `### START.md Bridge Launch`
- `### KANBAN Execution Transcript`
- `### Planned Trello Cards`
- `### Card Template Lock`
- `### Smart Cognitive Layer`
- `### Requirements to Cards Traceability`
- `### Trello Artifact Integrity Check`
- `### Trello Card Cognitive Gate`
- `### Confidence 95% Gate`
- `### Cognitive Readiness Review`
- `### Trello Guardian Review`
- `### SDD Package Review Summary`
- `### SDD Package Snapshot (Simple)`
- `### SDD Package Visual Status`
- `### SDD PACKAGE REVIEW HOLD`
- `### Regeneration Loop` (when applied)
- `### KANBAN PACKAGE READY`

## Auto-diagnose and regenerate loop

If any KANBAN check fails:

1. Set `kanban_gate_status = HOLD_REGENERATE`.
2. Output a diagnosis with failed checks and missing/weak artifacts.
3. Regenerate only missing/incomplete Trello package artifacts via canonical flow/templates.
4. Re-run integrity checks and confidence calculations.
5. If artifacts exist but cards are shallow/template-like, regenerate card content to satisfy Expert Trello Card Cognitive Standard.
6. Re-run cognitive gate, readiness review, and parity/traceability checks.
7. Repeat until gate reaches `PASS` or the process is blocked by missing user input.
8. If blocked by missing user decision/input, set `kanban_gate_status = HOLD_USER_BLOCKED` and pause.

## Canonical flow snapshot

START.md source priority for `KANBAN_PACKAGE`:

1. User-provided absolute path in current prompt (if present)
2. Bundled snapshot default:
   - `references/_flows/feature_2_trello/START.md`

Bundled snapshot is the portable canonical source inside this skill:
- `references/_flows/feature_2_trello/`

Portable publishing rules:
- Do not hardcode machine-specific absolute paths in skill instructions.
- Any external path may be used only as explicit user-provided override.
- Default execution path must remain inside the skill bundle.

Optional sync command (manual refresh from any external source):

```bash
rsync -a --delete <external_flow_source>/ \
  <skill_root>/references/_flows/feature_2_trello/
```

## Output contract

- Master SDD markdown artifact must exist on disk:
  - `docs/sdd_qa_plans/<YYYY-MM-DD>_<short_slug>.md`
- If output mode is `KANBAN_PACKAGE`, create package:
  - `docs/sdd_qa_plans/<YYYY-MM-DD>_<short_slug>/`
  - `README.md`, `requirements.md`, `ui-flow.md`, `gaps.md`, `manual-e2e-test.md`
  - `trello-cards/KICKOFF.md`, `trello-cards/BOARD.md`, `trello-cards/AGENT_PROTOCOL.md`
  - `trello-cards/progress.md`, `trello-cards/state.json`, `trello-cards/NN-card files`
- If output mode is `KANBAN_PACKAGE`, metadata must include:
  - `delivery_route: KANBAN_PACKAGE`
  - `kanban_mode_activated: true`
  - `kanban_activation_reason`
  - `start_md_preflight: PASS | HOLD_START_MD_MISSING`
  - `start_md_source`
  - `start_md_resolution_candidates`
  - `start_md_path_used`
  - `planned_trello_cards_manifest` (ordered list of `NN-card` filenames + short purpose)
  - `planned_trello_cards_count`
  - `smart_cognitive_layer`:
    - `requirements_atoms`
    - `delivery_slices`
    - `dependency_graph`
    - `slice_complexity_profile`
    - `slice_risk_profile`
  - `requirements_to_cards_traceability` (requirement id -> card ids)
  - `kanban_required_artifacts_check` (per-file booleans + `all_required_non_empty`)
  - `kanban_cards_count`
  - `planned_vs_generated_cards_match: true | false`
  - `trello_card_quality_standard_version`
  - `trello_card_cognitive_check` (per-card cognitive-dimension result + aggregate percent)
  - `trello_card_placeholder_check` (per-card unresolved template tokens)
  - `trello_card_cognitive_gate_percent`
  - `task_parallelization_map` (per card: `TASK-* -> Execution Mode + Parallel Blockers`)
  - `trello_guardian_review`:
    - `expert_profile`
    - `coverage`
    - `depth`
    - `clarity`
    - `traceability`
    - `actionability`
    - `findings`
    - `recommendation: ACCEPT_FOR_REVIEW | REWORK_REQUIRED`
  - `confidence_requirements_coverage_percent`
  - `confidence_artifact_quality_percent`
  - `cognitive_readiness_review`:
    - `raw_requirements_count`
    - `raw_requirements_coverage_percent`
    - `trello_alignment_percent`
    - `implementation_readiness_percent`
    - `user_expectations_alignment_percent`
    - `missing_critical_requirements_count`
    - `missing_requirements`
    - `partially_covered_requirements`
    - `requirement_to_cards_matrix`
    - `readiness_recommendation: READY_TO_IMPLEMENT | NEEDS_REWORK`
  - `kanban_gate_status: PASS | HOLD_REGENERATE | HOLD_USER_BLOCKED | HOLD_START_MD_MISSING`
  - `review_hold_status: HOLD_FOR_USER_REVIEW | REVIEW_CONFIRMED`
  - `sdd_package_review_summary`
  - `sdd_package_user_report_simple`:
    - `language`
    - `summary_points`
    - `visual_status`
    - `package_counts`
  - `user_report_present: true`
  - `hold_after_package_generation: true`
  - `kanban_execution_transcript` (ordered list of phase markers reached in this run)
- File metadata must include status transitions:
  - `DRAFT`
  - `SDD_SAVED_PENDING_APPROVAL`
  - `HOLD_FOR_USER_REVIEW`
  - `APPROVED_FOR_IMPLEMENTATION` (only after explicit user approval)

## KANBAN phase completion checklist

When `delivery_route = KANBAN_PACKAGE`, completion is valid only if all are true:

- `START.md` preflight is `PASS`
- bridge launch used resolver-selected canonical START.md path
- required Trello artifacts are present and non-empty
- `### Planned Trello Cards` section is present in plan output
- planned card manifest contains at least one `NN-card`
- planned and generated card lists match 1:1
- smart cognitive layer output exists and is internally consistent
- every generated card passes Expert Trello Card Cognitive Standard
- every generated card has task-level parallelization markers (`Execution Mode` + `Parallel Blockers`) for all `TASK-*`
- requirements-to-cards traceability matrix is present and complete
- at least one numbered card file exists (`01-*.md` or higher)
- confidence gates are both `>= 95`
- `trello_card_cognitive_gate_percent >= 95`
- `cognitive_readiness_review.raw_requirements_coverage_percent >= 95`
- `cognitive_readiness_review.trello_alignment_percent >= 95`
- `cognitive_readiness_review.implementation_readiness_percent >= 95`
- `cognitive_readiness_review.user_expectations_alignment_percent >= 95`
- `cognitive_readiness_review.missing_critical_requirements_count = 0`
- `cognitive_readiness_review.readiness_recommendation = READY_TO_IMPLEMENT`
- `kanban_gate_status = PASS`
- `### KANBAN PACKAGE READY` was printed
- `### Trello Guardian Review` was printed
- `### SDD Package Review Summary` was printed
- `### SDD Package Snapshot (Simple)` was printed
- `### SDD Package Visual Status` was printed
- `### SDD PACKAGE REVIEW HOLD` was printed
- `user_report_present = true`
- implementation was not started in the same turn
- all numbered cards were generated from canonical template path:
  - `references/_flows/feature_2_trello/TRELLO_TEMPLATES/card-XX-template.md`

## Language default

- Default interview and SDD language is Russian unless user selects otherwise.
