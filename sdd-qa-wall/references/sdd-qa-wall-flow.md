# SDD QA Wall Flow

## Goal

Build a strict wall between raw user requirements and implementation.
No coding is allowed until requirements are clarified, an SDD is saved, and approval is explicit.

Use dual-output topology:
- `SINGLE_SDD` for compact planning.
- `KANBAN_PACKAGE` for Trello cards emulation and executable task decomposition.

Canonical Trello flow snapshot is bundled at:
- `references/_flows/feature_2_trello/START.md`

## Step 0: Plan-mode gate

Before interview questions:

- `request_user_input` must be available.
- If unavailable:
  - HOLD
  - Ask user to switch mode:
    - Codex CLI/TUI: `/plan`
    - Codex App: `/plan-mode`
  - Resume only after user confirms.

## Step 1: Friendly kickoff + mandatory route choice

1. Greet user.
2. Ask interview language (default Russian) via `request_user_input`.
3. Ask task type via `request_user_input`:
   - New feature
   - Bugfix
   - Debug investigation
   - Improvement
   - Integration
4. Ask delivery route via `request_user_input` (always ask, no exceptions):
   - `KANBAN_PACKAGE` (kanban trello cards emulation)
   - `SINGLE_SDD`
   - `AUTO_ROUTE` (agent chooses by defaults)
5. Ask for raw requirements and invite voice/text input.
6. Wait; do not ask extra questions in this sub-step.

Route selection policy:
- If user selects `KANBAN_PACKAGE` explicitly, lock route to `KANBAN_PACKAGE` for any task type.
- If user selects `SINGLE_SDD` explicitly, lock route to `SINGLE_SDD`.
- If user selects `AUTO_ROUTE`, apply defaults from Step 6.

## Step 2: Project understanding

Run either:

- Full analysis (default):
  - project structure
  - README/docs
  - architecture/entry points
  - relevant modules by keywords
  - stack and dependencies
  - similar existing implementations
- Smart skip only when all are true:
  - context already verified in this session
  - no changes that invalidate understanding
  - relevant modules/stack already confirmed

## Step 3: Understanding recap + gap register

Output:

- concise recap ("This is how I understood your request")
- explicit gap register with per-gap fields:
  - `gap_id`
  - `severity` (`Blocker|High|Medium|Low`)
  - `description`
  - `question_to_close`
  - `status` (`open|closed`)

## Step 4: Confidence gate

Compute and output scorecard before clarifying questions:

```markdown
### Confidence Scorecard
- ProjectUnderstandingScore: [0-50]
- GapDetectionScore: [0-50]
- OverallConfidence: [0-100]

### Evidence
- [fact from repo/docs] -> [path/source]
- [fact from raw requirements] -> [quote/fragment]
```

Rules:

- `OverallConfidence >= 95` required.
- open `Blocker` gaps must be `0`.
- open `High` gaps must be `0`.

If any rule fails:

- HOLD
- no clarifying questions yet
- gather more context first

## Step 5: Clarifying interview via request_user_input only

Ask only material questions that close gaps.
Never ask plain-text questions.
Do not repeat task type or route choice unless conflicts appear.

Recommended dimensions:

- scope size
- MVP vs staged delivery
- quality vs speed priorities
- performance expectations
- technology approach
- integration mode
- testing level
- documentation level

## Step 6: Decide and lock output topology

Set internal fields:

- `output_mode: SINGLE_SDD | KANBAN_PACKAGE`
- `delivery_route: SINGLE_SDD | KANBAN_PACKAGE`
- `route_selected_by_user: true | false`

Resolution rules (strict order):

1. If explicit route was selected in Step 1, it wins.
2. If `AUTO_ROUTE` was selected:
   - task type `New feature` -> `KANBAN_PACKAGE`.
   - otherwise `SINGLE_SDD`.
   - for non-feature scopes, if raw requirements include explicit card-splitting signals (`kanban`, `agile`, `trello`, `cards splitting`, `kanban emulation`), allow `KANBAN_PACKAGE`.

Print decision audit:

```markdown
### Output Topology Decision
- task_type_initial: [...]
- user_route_choice: KANBAN_PACKAGE | SINGLE_SDD | AUTO_ROUTE
- route_selected_by_user: true | false
- scope_size: [...]
- keyword_signals: [...]
- recommended_route: SINGLE_SDD | KANBAN_PACKAGE
- delivery_route: SINGLE_SDD | KANBAN_PACKAGE
- reason: [...]
```

## Step 6.5: Route lock markers

If `delivery_route = KANBAN_PACKAGE`, print:

```markdown
### Route Lock: KANBAN_PACKAGE
### KANBAN MODE ACTIVATED
```

If `delivery_route = SINGLE_SDD`, print:

```markdown
### Route Lock: SINGLE_SDD
```

## Step 6.55: START.md source declaration (only for `KANBAN_PACKAGE`)

Print:

```markdown
### START.md Source
```

Resolver priority (portable):

1. `user_provided_start_md_path` (if explicitly provided in current turn)
2. `references/_flows/feature_2_trello/START.md` (bundled portable default)

## Step 6.6: START.md preflight (only for `KANBAN_PACKAGE`)

Print:

```markdown
### START.md Preflight
```

Required checks before bridge launch:

- Resolve and print selected path using resolver priority from Step 6.55.
- Verify the file exists and is readable.
- Set metadata fields:
  - `start_md_preflight: PASS | HOLD_START_MD_MISSING`
  - `start_md_source: USER_PROVIDED | BUNDLED_SNAPSHOT`
  - `start_md_resolution_candidates`
  - `start_md_path_used`

If preflight fails:

- set `kanban_gate_status = HOLD_START_MD_MISSING`
- HOLD and stop (do not continue to bridge launch, integrity, or implementation)

## Step 7: Trigger KANBAN bridge (only for `KANBAN_PACKAGE`)

If `delivery_route = KANBAN_PACKAGE`, print:

```markdown
### START.md Bridge Launch
```

Then trigger canonical flow bridge using smart prompt envelope:

```text
Here is raw requirements:
<raw requirements + gap closures + context summary>
force_interview: true
force_tool: AskUserQuestionTool
Start SDD flow by: <resolved_start_md_path>
output_root: docs/sdd_qa_plans/<YYYY-MM-DD>_<short_slug>
```

Then follow bundled canonical flow as-is:
- `<resolved_start_md_path>`
- `references/_flows/feature_2_trello/FLOW/*`

Print and append runtime markers into metadata list `kanban_execution_transcript` in order:

1. `Route Lock: KANBAN_PACKAGE`
2. `KANBAN MODE ACTIVATED`
3. `START.md Source`
4. `START.md Preflight`
5. `START.md Bridge Launch`

## Step 7.3: Smart Cognitive Layer (only for `KANBAN_PACKAGE`)

Print:

```markdown
### Smart Cognitive Layer
```

Run structured requirement cognition before generating Trello cards:

1. Requirement atomization:
   - convert raw requirements into atomic normalized units `REQ-001..REQ-N`
   - each atom must be independently testable and non-overlapping
2. Delivery slicing:
   - group atoms into executable slices `SLICE-01..SLICE-N`
   - each slice must have clear boundary and owner outcome
3. Dependency graph:
   - define directed dependencies among slices (`SLICE-A -> SLICE-B`)
   - detect cycles and break into valid execution order
4. Complexity and risk profiling:
   - complexity: `low|medium|high`
   - risk: `low|medium|high`
   - justify high-risk slices with mitigation note
5. Pre-card mapping:
   - map each slice to one or more future `NN-card` files
   - every `REQ` must be mapped at least once

Store metadata:

- `smart_cognitive_layer.requirements_atoms`
- `smart_cognitive_layer.delivery_slices`
- `smart_cognitive_layer.dependency_graph`
- `smart_cognitive_layer.slice_complexity_profile`
- `smart_cognitive_layer.slice_risk_profile`
- `smart_cognitive_layer.unmapped_requirements_count`
- append marker `Smart Cognitive Layer` to `kanban_execution_transcript`

If `unmapped_requirements_count > 0`:

- set `kanban_gate_status = HOLD_REGENERATE`
- continue to Step 7.4

## Step 7.4: Planned card manifest (only for `KANBAN_PACKAGE`)

Print:

```markdown
### Planned Trello Cards
```

Before artifact integrity checks, produce a full planned card manifest derived from START.md-driven flow output:

- Ordered list of planned card files: `01-*.md ... NN-*.md`
- One-line purpose per card
- Requirement coverage hint per card (which requirement IDs this card is expected to implement)
- Slice coverage hint per card (which `SLICE-*` items are expected to implement)
- Store metadata:
  - `planned_trello_cards_manifest`
  - `planned_trello_cards_count`
- Append marker `Planned Trello Cards` to `kanban_execution_transcript`

Hard rule:

- For `KANBAN_PACKAGE`, this section is mandatory in user-visible plan output.

## Step 7.42: Card template lock (only for `KANBAN_PACKAGE`)

Print:

```markdown
### Card Template Lock
```

Before generating numbered cards, lock canonical template path:

- `references/_flows/feature_2_trello/TRELLO_TEMPLATES/card-XX-template.md`

Rules:

- every `NN-card` must be generated from this template structure
- removing or compressing sections is forbidden
- if user supplies a new preferred template, replace file at this path and keep lock to this path
- append marker `Card Template Lock` to `kanban_execution_transcript`

## Step 7.45: Requirements-to-cards traceability (only for `KANBAN_PACKAGE`)

Print:

```markdown
### Requirements to Cards Traceability
```

Create and print explicit mapping:

- each requirement ID from `requirements.md` -> one or more `NN-card` files
- each `NN-card` -> one or more requirement IDs
- no orphan requirements and no orphan cards

Store metadata:

- `requirements_to_cards_traceability`
- `traceability_orphan_requirements_count`
- `traceability_orphan_cards_count`
- append marker `Requirements to Cards Traceability` to `kanban_execution_transcript`

If any orphan exists:

- set `kanban_gate_status = HOLD_REGENERATE`
- continue to Step 7.5

## Step 7.5: Trello artifact integrity gate (only for `KANBAN_PACKAGE`)

Print:

```markdown
### Trello Artifact Integrity Check
```

Validate required package artifacts exist and are non-empty:

- `README.md`
- `requirements.md`
- `ui-flow.md`
- `gaps.md`
- `manual-e2e-test.md`
- `trello-cards/KICKOFF.md`
- `trello-cards/BOARD.md`
- `trello-cards/AGENT_PROTOCOL.md`
- `trello-cards/progress.md`
- `trello-cards/state.json`
- `trello-cards/01-*.md ... NN-*.md` (at least one numbered card)

Produce metadata object:

- `kanban_required_artifacts_check`
- `kanban_cards_count`
- `all_required_non_empty`
- `planned_vs_generated_cards_match`
- append marker `Trello Artifact Integrity Check` to `kanban_execution_transcript`

Card parity checks (mandatory):

- `planned_trello_cards_count >= 1`
- every planned card file exists in generated `trello-cards/`
- every generated numbered card exists in planned manifest
- set `planned_vs_generated_cards_match = true` only when exact 1:1 match

If any check fails:
- set `kanban_gate_status = HOLD_REGENERATE`
- continue to Step 7.55

## Step 7.55: Trello card cognitive gate (only for `KANBAN_PACKAGE`)

Print:

```markdown
### Trello Card Cognitive Gate
```

Evaluate each numbered card (`01..NN`) against `Expert Trello Card Cognitive Standard`:

- no fixed heading names are required
- each card must cover cognitive dimensions:
  - expanded description/context anchored to raw requirements
  - intent/value of the slice
  - concrete implementation path (ordered execution)
  - implementation checklist with atomic tasks
  - task-level orchestration markers (`Execution Mode: PARALLEL|SEQUENTIAL` + `Parallel Blockers`)
  - concrete touchpoints (files/APIs/data contracts)
  - concrete snippet (`json` contract, pseudocode, or code fragment where relevant)
  - edge cases/failure handling
  - validation strategy with measurable done conditions
  - references and linked-card context
  - dependency context (upstream/downstream or sequence assumptions)
- content checks:
  - implementation guidance is concrete (not generic filler)
  - card contains project-specific paths/interfaces/contracts
  - done/acceptance language is measurable and testable
- placeholder checks (must be zero):
  - unresolved template tokens (`{...}`)
  - `TODO`, `TBD`, `path/to/...`, `to be decided`

Store metadata:

- `trello_card_quality_standard_version`
- `trello_card_cognitive_check` (per-card pass/fail with reasons)
- `trello_card_placeholder_check` (per-card unresolved placeholders)
- `trello_card_cognitive_gate_percent`
- `task_parallelization_map` (per-card `TASK-* -> Execution Mode + Parallel Blockers`)
- append marker `Trello Card Cognitive Gate` to `kanban_execution_transcript`

Pass condition:

- `trello_card_cognitive_gate_percent >= 95`
- placeholder violations = 0

If gate fails:

- set `kanban_gate_status = HOLD_REGENERATE`
- continue to Step 7.6

## Step 7.6: Confidence 95% gate (only for `KANBAN_PACKAGE`)

Print:

```markdown
### Confidence 95% Gate
```

Compute and store:

- `confidence_requirements_coverage_percent`
- `confidence_artifact_quality_percent`
- append marker `Confidence 95% Gate` to `kanban_execution_transcript`

Pass condition:
- coverage >= 95
- artifact quality >= 95

If the canonical validation scripts are available, run them and use results:
- `references/_flows/feature_2_trello/validate-requirements.sh`
- `references/_flows/feature_2_trello/validate-sdd.sh`

Before running scripts, enforce a minimal validator-compatible shape:
- `requirements.md` contains:
  - `# Feature: ...`
  - `## Description`
  - `## Requirements` with `-` bullet lines
- each numbered `NN-card` contains:
  - `**SP:** <1..4>`
  - `**Depends On:** ...`
  - `## 📋 Описание (Description)`
  - `## 🌍 Контекст (Context)`
  - `## 📎 Ссылки и материалы (References)`
  - `## 🔗 Зависимости и блокировки (Dependencies)`
  - `## ✅ Критерии приёмки (Acceptance Criteria)`
  - `## 🧪 Тестирование (Testing)`
  - `## ✅ To-Do List (Обязательные задачи)`
  - for every `TASK-*` item:
    - `**Execution Mode:** PARALLEL | SEQUENTIAL`
    - `**Parallel Blockers:** TASK-... | none`

If shape is missing:
- set `kanban_gate_status = HOLD_REGENERATE`
- apply formatting-only fixes first (no scope expansion), then re-run gate

If gate fails:
- set `kanban_gate_status = HOLD_REGENERATE`
- continue to Step 7.7

## Step 7.65: Cognitive readiness review (only for `KANBAN_PACKAGE`)

Print:

```markdown
### Cognitive Readiness Review
```

Run post-generation review that compares user raw requirements and expectations against generated Trello cards:

1. Build requirement coverage matrix:
   - each raw requirement fragment -> one or more `NN-card` files
   - each mapped card must include concrete implementation path + measurable acceptance criteria
2. Classify each requirement:
   - `covered`
   - `partially_covered`
   - `missing`
3. Compute readiness metrics:
   - `raw_requirements_coverage_percent`
   - `trello_alignment_percent`
   - `implementation_readiness_percent`
   - `user_expectations_alignment_percent`
4. Compute critical miss counters:
   - `missing_critical_requirements_count`
   - `missing_requirements`
   - `partially_covered_requirements`
5. Set recommendation:
   - `READY_TO_IMPLEMENT` when all readiness metrics `>= 95` and missing criticals `= 0`
   - otherwise `NEEDS_REWORK`

Store metadata:

- `cognitive_readiness_review.raw_requirements_count`
- `cognitive_readiness_review.raw_requirements_coverage_percent`
- `cognitive_readiness_review.trello_alignment_percent`
- `cognitive_readiness_review.implementation_readiness_percent`
- `cognitive_readiness_review.user_expectations_alignment_percent`
- `cognitive_readiness_review.missing_critical_requirements_count`
- `cognitive_readiness_review.missing_requirements`
- `cognitive_readiness_review.partially_covered_requirements`
- `cognitive_readiness_review.requirement_to_cards_matrix`
- `cognitive_readiness_review.readiness_recommendation`
- append marker `Cognitive Readiness Review` to `kanban_execution_transcript`

If readiness review fails:

- set `kanban_gate_status = HOLD_REGENERATE`
- continue to Step 7.7

## Step 7.66: Trello Guardian Review (only for `KANBAN_PACKAGE`)

Print:

```markdown
### Trello Guardian Review
```

Run mandatory expert-style audit of Trello card quality before final hold/approval handoff:

1. Simulate `Agile/Trello guardian (30+ years)` review lens.
2. Evaluate every `NN-card` for:
   - depth of `Description` and `Context`
   - explicit traceability to raw requirements (`REQ-*` mapping clarity)
   - actionability (can assignee execute without guessing)
   - explicit per-task parallelization markers (`Execution Mode` + `Parallel Blockers`)
   - quality of checklist, references, and linked-card context
   - quality of contract/code snippets when required
3. Produce findings:
   - `critical` (must fix before user review)
   - `major`
   - `minor`
4. Set recommendation:
   - `REWORK_REQUIRED` if any `critical` finding exists
   - otherwise `ACCEPT_FOR_REVIEW`

Store metadata:

- `trello_guardian_review.expert_profile`
- `trello_guardian_review.coverage`
- `trello_guardian_review.depth`
- `trello_guardian_review.clarity`
- `trello_guardian_review.traceability`
- `trello_guardian_review.actionability`
- `trello_guardian_review.findings`
- `trello_guardian_review.recommendation`
- append marker `Trello Guardian Review` to `kanban_execution_transcript`

If recommendation is `REWORK_REQUIRED`:

- set `kanban_gate_status = HOLD_REGENERATE`
- continue to Step 7.7

## Step 7.7: Auto-diagnose and regenerate loop (only for `KANBAN_PACKAGE`)

If `kanban_gate_status = HOLD_REGENERATE`, print:

```markdown
### Regeneration Loop
```

Also append marker `Regeneration Loop` to `kanban_execution_transcript`.

Loop protocol:

1. Diagnose missing/incomplete artifacts and weak coverage areas.
2. Apply formatting-only compatibility fixes first (requirements/card headings expected by validators).
3. Regenerate missing or weak package sections using canonical templates.
4. Re-apply Step 7.42 card template lock.
5. Regenerate shallow/template-like cards to satisfy Expert Trello Card Cognitive Standard.
6. Re-run Step 7.45 traceability checks.
7. Re-run Step 7.5 integrity checks.
8. Re-run Step 7.55 cognitive checks.
9. Re-run Step 7.6 confidence checks.
10. Re-run Step 7.65 cognitive readiness review.
11. Re-run Step 7.66 Trello Guardian Review.
12. Repeat until `kanban_gate_status = PASS`.
13. If blocked by missing user input, set `kanban_gate_status = HOLD_USER_BLOCKED` and pause.

Stop condition for `KANBAN_PACKAGE` branch:
- `kanban_gate_status = PASS`
- `kanban_cards_count >= 1`
- `planned_trello_cards_count >= 1`
- `planned_vs_generated_cards_match = true`
- `traceability_orphan_requirements_count = 0`
- `traceability_orphan_cards_count = 0`
- all required artifacts non-empty
- all numbered cards follow canonical template lock (Step 7.42)
- all `TASK-*` items include `Execution Mode` and `Parallel Blockers`
- `trello_card_cognitive_gate_percent >= 95`
- card placeholder violations = 0
- both confidence metrics >= 95
- `cognitive_readiness_review.raw_requirements_coverage_percent >= 95`
- `cognitive_readiness_review.trello_alignment_percent >= 95`
- `cognitive_readiness_review.implementation_readiness_percent >= 95`
- `cognitive_readiness_review.user_expectations_alignment_percent >= 95`
- `cognitive_readiness_review.missing_critical_requirements_count = 0`
- `cognitive_readiness_review.readiness_recommendation = READY_TO_IMPLEMENT`
- `trello_guardian_review.recommendation = ACCEPT_FOR_REVIEW`

Print when done:

```markdown
### KANBAN PACKAGE READY
```

Append marker `KANBAN PACKAGE READY` to `kanban_execution_transcript`.

## Step 8: Produce proposed SDD

Output final plan in `<proposed_plan>` block.
Include at minimum:

- title and summary
- functional and non-functional requirements
- architecture and interfaces
- test strategy and acceptance criteria
- assumptions/tradeoffs
- implementation phases
- metadata:
  - interview language
  - SDD language
  - status (`DRAFT`)
  - version
  - timestamp
- gap closure report:
  - open blocker/high/medium/low counts

If `delivery_route = KANBAN_PACKAGE`, include `Kanban Completion Report` with:

- `delivery_route`
- `kanban_mode_activated`
- `kanban_activation_reason`
- `start_md_preflight`
- `start_md_source`
- `start_md_resolution_candidates`
- `start_md_path_used`
- `planned_trello_cards_manifest`
- `planned_trello_cards_count`
- `smart_cognitive_layer`
- `requirements_to_cards_traceability`
- `kanban_required_artifacts_check`
- `kanban_cards_count`
- `planned_vs_generated_cards_match`
- `trello_card_quality_standard_version`
- `trello_card_cognitive_check`
- `trello_card_placeholder_check`
- `trello_card_cognitive_gate_percent`
- `task_parallelization_map`
- `confidence_requirements_coverage_percent`
- `confidence_artifact_quality_percent`
- `cognitive_readiness_review`
- `trello_guardian_review`
- `sdd_package_user_report_simple`
- `user_report_present`
- `kanban_gate_status`
- `kanban_execution_transcript`

`Open Questions` section must contain only low/medium items.

## Step 9: Persist artifacts

Always persist master SDD file:

1. Ensure folder exists: `docs/sdd_qa_plans`.
2. Save file:
   - `docs/sdd_qa_plans/<YYYY-MM-DD>_<short_slug>.md`
3. Verify file exists and is non-empty.
4. Update status in file to `SDD_SAVED_PENDING_APPROVAL`.

If persistence fails:

- HOLD
- implementation remains blocked

If `delivery_route = KANBAN_PACKAGE`, also persist package in:

- `docs/sdd_qa_plans/<YYYY-MM-DD>_<short_slug>/`

Metadata for KANBAN must include:

- `delivery_route: KANBAN_PACKAGE`
- `kanban_mode_activated: true`
- `kanban_activation_reason`
- `start_md_preflight`
- `start_md_source`
- `start_md_resolution_candidates`
- `start_md_path_used`
- `planned_trello_cards_manifest`
- `planned_trello_cards_count`
- `smart_cognitive_layer`
- `requirements_to_cards_traceability`
- `kanban_required_artifacts_check`
- `kanban_cards_count`
- `planned_vs_generated_cards_match`
- `trello_card_quality_standard_version`
- `trello_card_cognitive_check`
- `trello_card_placeholder_check`
- `trello_card_cognitive_gate_percent`
- `task_parallelization_map`
- `confidence_requirements_coverage_percent`
- `confidence_artifact_quality_percent`
- `cognitive_readiness_review`
- `trello_guardian_review`
- `sdd_package_user_report_simple`
- `user_report_present: true`
- `kanban_gate_status: PASS | HOLD_REGENERATE | HOLD_USER_BLOCKED | HOLD_START_MD_MISSING`
- `review_hold_status: HOLD_FOR_USER_REVIEW | REVIEW_CONFIRMED`
- `sdd_package_review_summary`
- `hold_after_package_generation: true`
- `kanban_execution_transcript`

## Step 9.5: Mandatory package review hold (before approval)

Print:

```markdown
### SDD Package Review Summary
### SDD Package Snapshot (Simple)
### SDD Package Visual Status
### SDD PACKAGE REVIEW HOLD
```

Mandatory behavior:

1. Summarize package quality and Trello Guardian findings in simplified user language (default: Russian).
2. Print simple visual status:
   - pipeline progress bar (for example: `[##########] 100%`)
   - artifacts status snapshot (`SDD`, `required docs`, `kanban cards`, `quality gates`, `hold state`)
   - card totals (`planned`, `generated`, `ready`, `rework`)
3. Save metadata:
   - `sdd_package_user_report_simple` (language + summary points + visual status + counts)
   - `user_report_present = true`
4. Append markers to `kanban_execution_transcript`:
   - `SDD Package Snapshot (Simple)`
   - `SDD Package Visual Status`
5. Set `review_hold_status = HOLD_FOR_USER_REVIEW`.
6. Do not start implementation in this turn.
7. Ask user via `request_user_input` to review cards and choose:
   - `Approve package for implementation gate`
   - `Request card rework`

If user requests rework:

- set `kanban_gate_status = HOLD_REGENERATE`
- return to Step 7.7

If user approves package for gate:

- set `review_hold_status = REVIEW_CONFIRMED`
- continue to Step 10.

## Step 10: Approval gate

Ask via `request_user_input`:

- `Yes, APPROVED_FOR_IMPLEMENTATION`
- `No, rework SDD`

Before asking, verify:

- open blocker gaps = 0
- open high gaps = 0
- `review_hold_status = REVIEW_CONFIRMED`

Outcomes:

- If `No`:
  - status `HOLD_NEEDS_SDD_REWORK`
  - return to clarifications
- If `Yes`:
  - set status `APPROVED_FOR_IMPLEMENTATION`
  - update file metadata:
    - approved at
    - approved by
    - baseline version/frozen timestamp

## Step 11: Change control after approval

Any new requirement after approval is a Change Request:

- set status `HOLD_SCOPE_CHANGED`
- append CR record (`CR-ID`, reason, impact, author, date)
- create next version (for example `_v2`)
- rerun gate path (steps 3 to 10)

## Mandatory stop after package generation

After `### KANBAN PACKAGE READY`, `### SDD Package Snapshot (Simple)`, `### SDD Package Visual Status`, and `### SDD PACKAGE REVIEW HOLD`:

- always stop in planning/reporting mode
- never auto-start implementation in the same turn
- wait for explicit follow-up user request in a new turn

## Hard prohibition

Never start implementation unless all are true:

1. SDD file exists in `docs/sdd_qa_plans/...`
2. Status is `APPROVED_FOR_IMPLEMENTATION`
3. If `delivery_route = KANBAN_PACKAGE`, `kanban_gate_status = PASS`
4. If `delivery_route = KANBAN_PACKAGE`, `start_md_preflight = PASS`
5. If `delivery_route = KANBAN_PACKAGE`, required Trello package artifacts and numbered cards are present and non-empty
6. If `delivery_route = KANBAN_PACKAGE`, `### Planned Trello Cards` was printed and includes full manifest
7. If `delivery_route = KANBAN_PACKAGE`, `planned_vs_generated_cards_match = true`
8. If `delivery_route = KANBAN_PACKAGE`, `kanban_execution_transcript` contains:
   - `START.md Source`
   - `START.md Preflight`
   - `START.md Bridge Launch`
   - `Planned Trello Cards`
   - `Card Template Lock`
   - `Smart Cognitive Layer`
   - `Requirements to Cards Traceability`
   - `Trello Artifact Integrity Check`
   - `Trello Card Cognitive Gate`
   - `Confidence 95% Gate`
   - `Cognitive Readiness Review`
   - `Trello Guardian Review`
   - `SDD Package Snapshot (Simple)`
   - `SDD Package Visual Status`
   - `KANBAN PACKAGE READY`
9. `review_hold_status = REVIEW_CONFIRMED`
10. `user_report_present = true`
11. SDD package generation and implementation are separated by turn boundary
12. Do not stop after template-only or partial card generation
