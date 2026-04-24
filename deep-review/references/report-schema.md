# Report Schema

All review artifacts exist in two forms:

- JSON for machine processing
- Markdown for human reading

JSON is the source of truth.

## Run Cohort Rule

Every artifact for one review run must share the same `run_id`.

That includes:

- `run.json`
- all 6 reviewer JSON files
- all 6 reviewer Markdown files
- combined JSON
- combined Markdown
- `kanban.json`

Do not mix files from different timestamps in the same `reports/` directory.

## Individual Reviewer JSON

```json
{
  "meta": {
    "schema_version": "deep-review-reviewer/v1",
    "run_id": "20260421T101530Z"
  },
  "reviewer_role": "Security Auditor",
  "reviewer_slug": "security_auditor",
  "focus": {
    "type": "pull_request",
    "label": "PR #42",
    "source_ref": "#42"
  },
  "verdict": "BLOCKED",
  "confidence": 92,
  "recommended_action": "Replace the unsafe parser.",
  "findings": [
    {
      "id": "security_auditor_001",
      "title": "Unsafe input parser allows path traversal",
      "summary": "User-controlled path segments reach filesystem access without normalization.",
      "severity": "critical",
      "priority": "P0",
      "confidence": 91,
      "file_refs": ["src/server/upload.ts:48", "src/fs/open.ts:12"],
      "recommended_action": "Normalize and restrict paths before filesystem access.",
      "merge_blocker": true,
      "story_points": 3,
      "dedupe_keys": ["path-traversal-upload"],
      "simplification_win": false,
      "lines_saved_estimate": null
    }
  ]
}
```

Minimum required fields:

- `meta.run_id`
- `reviewer_role`
- `reviewer_slug`
- `focus.type`
- `focus.label`
- `verdict`
- `confidence`
- `recommended_action`
- `findings[]`

## Individual Reviewer Markdown

Required sections:

1. `# <Reviewer Role> Report - <run_id>`
2. `## Verdict`
3. `## Findings`
4. `## Confidence`
5. `## Recommended Action`
6. `## Story Points Estimate`

Markdown may be concise, but it must not contradict the JSON.

## Combined JSON

The combined JSON must contain:

- `meta.run_id`
- source focus
- source reviewer report files
- reviewer summaries
- deduplicated findings
- totals by priority
- overall verdict
- simplification wins

Each deduplicated finding must contain:

- stable `id`
- `title`
- `summary`
- `severity`
- `priority`
- `story_points`
- `experts`
- `source_report_files`
- `source_finding_ids`
- `file_refs`
- `dedupe_keys`
- `recommended_action`
- `merge_blocker`
- `estimate_spread`
  - `consensus_method`
  - `min`
  - `max`
  - `values`

## kanban.json

After package generation, `kanban.json` becomes the package SSOT.

Minimum required fields:

- `meta.run_id`
- `meta.source_combined_report`
- `workflow_rules`
- 7 workflow columns:
  - `backlog`
  - `in_progress`
  - `blocked`
  - `review`
  - `simplification`
  - `auto_commit`
  - `done`
- `cards`

Each card must contain:

- canonical `status`
- matching `column`
- `trello_list_name`
- `depends_on`
- `ownership_keys`
- `conflict_keys`
- `parallel_safe`
- `testing_strategy`
- `main_risks`
- `estimate_spread`
- `slice_scope` and `slice_boundary` when slicing is used
- `lane_evidence`

`lane_evidence` must stay machine-readable and status-aware:

- `review`
  - `required`
  - `command`
  - `selector`
  - `verdict`
  - `summary`
  - `completed_at`
- `simplification`
  - `required`
  - `command`
  - `outcome`
  - `summary`
  - `completed_at`
- `auto_commit`
  - `required`
  - `command`
  - `commit_sha` and `commit_subject`, or `blocked_reason`
  - `completed_at`
- `blocked`
  - `reason`
  - `recorded_at`
- `done`
  - `summary`
  - `completed_at`
- `comments[]`
  - `at`
  - `status`
  - `text`

## File Naming

Use these exact role slugs:

- `security_auditor`
- `performance_engineer`
- `maintainer`
- `simplicity_advocate`
- `testability_engineer`
- `api_guardian`

Patterns:

- `<role>_report_<run_id>.json`
- `<role>_report_<run_id>.md`
- `combined_report_<run_id>.json`
- `combined_report_<run_id>.md`

## moves.jsonl

When Trello sync is active, `trello/moves.jsonl` is a move journal.

Each line must include at least:

- `move_id`
- `phase`
- `at`
- `package_card_id`

Expected phases:

- `pending`
- `remote_move`
- `remote_comment`
- `committed`
- `rolled_back`
- `reconciled_committed`
- `reconciled_abandoned`
- `remote_inconsistent`
