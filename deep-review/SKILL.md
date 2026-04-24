---
name: deep-review
description: Heavy 6-reviewer code review for when the operator explicitly wants evidence-backed findings, a combined report, and follow-up implementation handoff artifacts.
triggers: deep-review, $deep-review, 6 reviewers, six reviewers, review and sdd, deep-review skill
---

# deep-review

Use this skill for an explicit heavy review pass.
It always runs 6 reviewer roles in parallel, writes machine-readable artifacts,
and can project the resulting package into a real Trello board.

## Hard Invariants

1. Always run exactly these 6 reviewer roles in parallel:
   - Security Auditor
   - Performance Engineer
   - Maintainer
   - Simplicity Advocate
   - Testability Engineer
   - API Guardian
2. Keep chat output short. Put detail into artifacts, not into chat.
3. JSON is the artifact SSOT:
   - reviewer JSON + Markdown
   - combined JSON + Markdown
   - `kanban.json` after package build
   - Trello only mirrors `kanban.json`
4. Do not implement target-repo fixes inside this skill.
5. Task slicing must be truthful:
   - prefer `2-4` story points
   - split only on real seams
   - keep larger cards only as explicit truthful exceptions
6. Trello moves must never be silent:
   - every move gets machine-readable lane evidence
   - the move script generates the short Russian comment from that evidence

## Phase Map

1. Focus selection
   - run `scripts/detect_focus.sh`
   - if ambiguous, resolve explicitly with `scripts/resolve_focus.js`
2. Context collection
   - run `scripts/collect_review_context.sh`
3. Reviewer batch
   - spawn 6 parallel reviewers
   - save reviewer JSON + Markdown
4. Validation and synthesis
   - run `scripts/validate_artifacts.sh --reports-dir ...`
   - run `scripts/build_combined_report.js`
5. Package build
   - run `scripts/build_sdd_package.js`
6. Trello projection
   - run `scripts/create_trello_board.js`
   - run `scripts/export_package_to_trello.js`
   - validate again with `--package-dir` and `--trello-dir`

## Read This When

- Focus choice or ambiguity:
  [references/focus-selection.md](references/focus-selection.md)
- Reviewer and combined artifact contract:
  [references/report-schema.md](references/report-schema.md)
- Priority and story points:
  [references/severity-and-points.md](references/severity-and-points.md)
- Package slicing and parallelism:
  [references/sdd-mapping.md](references/sdd-mapping.md)
- Reviewer role prompts:
  [references/reviewer-roles.md](references/reviewer-roles.md)
- Trello board, lane rules, move behavior:
  [references/trello-workflow.md](references/trello-workflow.md)
- Trello card description block order:
  [references/trello-card-template-reference.md](references/trello-card-template-reference.md)
- Mattermost notifications and Russian message catalog:
  [references/notifications.md](references/notifications.md)

## Default Command Skeleton

```text
docs/deep-review/<run_id>/
├── run.json
├── context/
├── reports/
└── sdd_package_<run_id>/
```

Use the scripts in `scripts/` as the only deterministic workflow surface.
Use templates in `templates/` for the generated Markdown artifacts.
