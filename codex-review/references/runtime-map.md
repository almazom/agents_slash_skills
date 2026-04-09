# Runtime Map

Runtime root: `/home/pets/TOOLS/codex-review-skill_cli`

Source of truth:

1. `/home/pets/TOOLS/codex-review-skill_cli/SKILL.md`
2. `/home/pets/TOOLS/codex-review-skill_cli/codex-review --help`
3. `/home/pets/TOOLS/codex-review-skill_cli/src/codex_review_skill_cli/cli.py`

Main command (auto backend — codex with glm_wp fallback on ANY failure):

```bash
/home/pets/TOOLS/codex-review-skill_cli/codex-review --target /absolute/path/to/repo --uncommitted
```

Force glm_wp backend:

```bash
/home/pets/TOOLS/codex-review-skill_cli/codex-review --target /absolute/path/to/repo --uncommitted --backend glm_wp
```

Force codex backend (no fallback):

```bash
/home/pets/TOOLS/codex-review-skill_cli/codex-review --target /absolute/path/to/repo --uncommitted --backend codex
```

Other selectors:

```bash
/home/pets/TOOLS/codex-review-skill_cli/codex-review --target /absolute/path/to/repo --base main
/home/pets/TOOLS/codex-review-skill_cli/codex-review --target /absolute/path/to/repo --commit abc1234
```

## Backend selection (`--backend`)

| Value    | Behavior                                                        |
|----------|-----------------------------------------------------------------|
| `auto`   | Try codex/codex_wp; on **any** non-zero exit, fall back to glm_wp. **Default.** |
| `codex`  | Only use codex/codex_wp. No fallback on failure.            |
| `glm_wp` | Only use glm_wp. Error if unavailable.                         |

## Fallback triggers (`--backend auto`)

| codex failure            | rc  | Fallback to glm_wp? |
|--------------------------|-----|----------------------|
| Binary not found         | 127 | ✅                    |
| Auth / API key error     | 1   | ✅                    |
| Network / rate limit     | 1   | ✅                    |
| Timeout                  | 124 | ✅                    |
| Segfault                 | 139 | ✅                    |
| OOM killed               | 137 | ✅                    |
| Any non-zero exit        | ≠0  | ✅                    |
| Success                  | 0   | ❌ (not needed)       |

Fallback only fails if glm_wp is also unavailable on PATH.

## Timeouts

| Context              | Default | Fallback (glm_wp) |
|----------------------|---------|-------------------|
| `--timeout` not set  | 300s    | 480s              |
| `--timeout 600`      | 600s    | 600s (max of user value, 480) |

The fallback backend gets `max(user_timeout, 480)` automatically.

## Binary resolution

- codex backend: looks for `codex` first, then `codex_wp`
- glm_wp backend: looks for `glm_wp` first, then `kimi_wp` (legacy last resort)

Important rule:

- no custom prompt layer
- no stdin prompt
- raw upstream `codex review` behavior (codex backend)
- identical review prompts from codex source (glm_wp backend)

## Session inspection on timeout

When **any** backend times out (exit 124), the wrapper automatically:

1. Finds the most recent codex session JSONL in `~/.codex/sessions/` (last hour)
2. Extracts the last 3 assistant output messages
3. Writes the extracted direction into `stderr.log` under "Codex session inspection" header

This means `stderr.log` always contains more information than just the timeout message.
When investigating a failed review, read `stderr.log` first.

Artifact layout per run:

- `.codex-review/runs/<run-id>/request.json` — includes `"backend"` field; on fallback, contains both codex and glm_wp sections
- `.codex-review/runs/<run-id>/run.json` — includes `"backend"`, `"is_fallback"`, `"fallback_reason"` fields
- `.codex-review/runs/<run-id>/report.md`
- `.codex-review/runs/<run-id>/stderr.log` — on fallback, contains both codex and glm_wp stderr + session inspection notes
- `.codex-review/runs/<run-id>/review_system_prompt.md` — (glm_wp backend only) the system prompt used
- `.codex-review/runs/latest` → symlink to latest run

Install target:

- `/home/pets/.agents/skills/codex-review`
