# Severity And Story Points

Use one severity scale across all reviewers:

- `critical`
- `high`
- `medium`
- `low`
- `info`

## Priority Mapping

- `P0`
  - any finding marked `merge_blocker: true`
  - any `critical` finding
- `P1`
  - `high` findings that are not merge blockers
- `P2`
  - `medium`, `low`, and `info` findings

If a reviewer explicitly provides `priority`, keep it only when it does not
conflict with blocker status.

## Story Points

Use the smallest honest estimate for the corrective task:

- `1` trivial
- `2` small
- `3` medium
- `5` large
- `8` complex
- `13` epic

## Default Fallback When Missing

If a finding is valid but has no point estimate:

- critical -> `5`
- high -> `3`
- medium -> `2`
- low/info -> `1`

## Dedupe Rule

If multiple reviewers report the same issue, dedupe into one combined item.
Keep the strongest severity, the union of experts, and one shared point value.
Do not sum duplicate points across experts.
