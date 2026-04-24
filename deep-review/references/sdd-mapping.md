# SDD Mapping

The combined JSON drives SDD package creation.

## Package Shape

```text
sdd_package_<run_id>/
├── START.md
├── kanban.json
├── 00_backlog/
├── 01_in_progress/
├── 02_blocked/
├── 03_review/
├── 04_simplification/
├── 05_auto_commit/
├── 06_done/
├── trello/
└── reports/
```

## Mapping Rules

- one deduplicated combined finding becomes one implementation scope
- if a finding is larger than `4` story points, split it only on real seams:
  - files
  - modules
  - ownership areas
  - explicit subdomains
- prefer one truthful seam per generated card
- target `2-4` story points per card when the seam is truthful
- if no truthful split exists, keep one larger card and mark the size exception
- `P0` findings stay merge blockers in the package
- all new cards start in `00_backlog`
- cards are ordered by:
  1. priority
  2. story points ascending
  3. stable title sort

## Parallelization Rules

- prefer cards that can run on disjoint files, layers, or seams
- every card must carry:
  - `parallel_safe`
  - `parallel_group`
  - `depends_on`
  - `ownership_keys`
  - `conflict_keys`
- prefer `ownership_keys` for coarse seam ownership and `conflict_keys` for the
  exact files or resources that would make parallel execution unsafe
- `parallel_safe` means the card may run with other ready cards if
  `conflict_keys` do not overlap
- default `parallel_safe` to `false`
- only set `parallel_safe: true` when the split was seam-first and the
  `conflict_keys` are explicitly disjoint
- do not mark cards safe in parallel only because they were mathematically
  split; the seam has to be real
- later implementation harnesses should spawn subagents only for cards that are:
  - ready
  - dependency-free
  - disjoint on `conflict_keys`

## Lane Evidence Rules

Each card must persist machine-readable evidence for workflow gates:

- `review`
  - selector
  - verdict
  - summary
  - completed timestamp
- `simplification`
  - outcome
  - summary
  - completed timestamp
- `auto_commit`
  - short SHA and subject, or blocked reason
  - completed timestamp
- `blocked`
  - blocker reason
- `done`
  - final summary

## Commit Prefixes

- `P0` -> `fix:`
- `P1` -> `refactor:`
- `P2` -> `chore:`
- simplification-first work -> `simplify:`

## Card Content Minimum

Each generated card must include:

- problem statement
- why it matters
- source experts
- source reports
- acceptance criteria
- testing strategy
- main risks

Do not fabricate low-level implementation steps that were never evidenced by
the review.

## kanban.json Minimum

Keep:

- package metadata
- source report list
- workflow rules
- 7 column definitions
- card definitions
- Trello sync metadata:
  - board id
  - list names
  - per-card Trello IDs when exported

`kanban.json` is the package SSOT after generation.
