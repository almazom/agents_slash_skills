# Examples

## Auto backend (codex → glm_wp fallback)

Review uncommitted changes:

```bash
/home/pets/TOOLS/codex-review-skill_cli/codex-review --target /abs/path/to/repo --uncommitted
```

Review against a base branch:

```bash
/home/pets/TOOLS/codex-review-skill_cli/codex-review --target /abs/path/to/repo --base main
```

Review one commit:

```bash
/home/pets/TOOLS/codex-review-skill_cli/codex-review --target /abs/path/to/repo --commit abc1234
```

Copy the report outside the repo-local run folder:

```bash
/home/pets/TOOLS/codex-review-skill_cli/codex-review \
  --target /abs/path/to/repo \
  --uncommitted \
  --output /abs/path/review.md
```

## Force glm_wp backend

```bash
/home/pets/TOOLS/codex-review-skill_cli/codex-review --target /abs/path/to/repo --uncommitted --backend glm_wp
```

## Force codex only (no fallback)

```bash
/home/pets/TOOLS/codex-review-skill_cli/codex-review --target /abs/path/to/repo --uncommitted --backend codex
```

## Machine-readable output

```bash
/home/pets/TOOLS/codex-review-skill_cli/codex-review --target /abs/path/to/repo --uncommitted --json
```

## Custom timeout

```bash
# 600s for both codex and glm_wp fallback
/home/pets/TOOLS/codex-review-skill_cli/codex-review --target /abs/path/to/repo --commit abc1234 --timeout 600

# Default: 300s codex, 480s glm_wp (automatic when fallback triggers)
```

## Investigating a failed review

Always check `stderr.log` first — it contains session inspection notes on timeout:

```bash
cat .codex-review/runs/latest/stderr.log
cat .codex-review/runs/latest/run.json
```
