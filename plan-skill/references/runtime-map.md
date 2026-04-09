# Runtime Map

Runtime root resolution order:

1. `/home/pets/TOOLS/plan_skill_cli_v2`
2. `/home/almaz/TOOLS/plan_skill_cli_v2`

Current installed runtime on this machine: `/home/almaz/TOOLS/plan_skill_cli_v2`

Bootstrap order:

1. `AGENTS.md`
2. `PROTOCOL.json`
3. `.MEMORY/00-index.md`
4. `flow.md`

Main command:

```bash
cd /home/almaz/TOOLS/plan_skill_cli_v2
./run --repo /absolute/path/to/target "Goal text"
```

Stage commands:

```bash
./ps-intake --repo /absolute/path/to/target "Goal text"
./ps-preflight --run-dir /absolute/path/to/run
./ps-plan --run-dir /absolute/path/to/run
./ps-self-qa --run-dir /absolute/path/to/run
./ps-parallel-review --run-dir /absolute/path/to/run
./ps-synthesize --run-dir /absolute/path/to/run
./ps-quality-loop --run-dir /absolute/path/to/run
./ps-export --run-dir /absolute/path/to/run --output /tmp/IMPLEMENTATION_PLAN.md
```

Artifact layout per run:

- `artifacts/plan-request.json`
- `artifacts/bootstrap-context.json`
- `artifacts/reviewer-preflight.json`
- `artifacts/plan-context.json`
- `artifacts/IMPLEMENTATION_PLAN.md`
- `artifacts/history/IMPLEMENTATION_PLAN.v1.md`
- `artifacts/history/IMPLEMENTATION_PLAN.v2.md`
- `artifacts/reviews/index.json`
- `artifacts/review-synthesis.json`
- `artifacts/gap-ledger.json`
- `artifacts/quality-ledger.json`
- `artifacts/split-check/iteration-01/*`
- `summary.json`

Split gate artifacts:

- each quality-loop iteration may write a run-local `split-check/iteration-XX/` dry-run package
- this is only for readiness validation and must not replace the real operator-facing split output under the target repo

Downstream package onboarding expectation:

- treat `trello-cards/KICKOFF.md` as the single onboarding file for the generated package
- keep `START_HERE.md` only as a short redirect when it exists
- keep `trello-cards/README.md` as a local helper, not the primary entry point

Install targets:

- default install script targets current user's home, for example:
- `/home/almaz/.agents/skills/plan-skill`
- `/home/almaz/.codex/skills/plan-skill`

Reviewer timeout envs:

- `PLAN_SKILL_PREFLIGHT_TIMEOUT_SECONDS` for the fast availability check.
- `PLAN_SKILL_REVIEW_TIMEOUT_SECONDS` for the full parallel review stage.
- `PLAN_SKILL_REVIEWER_TIMEOUT_SECONDS` remains as the legacy fallback.
