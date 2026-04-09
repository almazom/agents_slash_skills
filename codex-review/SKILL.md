---
name: codex-review
description: Use only when the user explicitly asks to run the local `codex-review` wrapper or names `$codex-review`. This skill wraps raw Codex review (primary) or falls back to glm_wp with identical review prompts when codex is unavailable. No extra prompt layer, supports `--uncommitted`, `--base <branch>`, or `--commit <sha>`, and writes repo-local artifacts under `.codex-review/runs`.
---

# codex-review

Use this skill as a thin wrapper over `/home/pets/TOOLS/codex-review-skill_cli`.
Trigger it only on explicit user intent for the wrapper itself, not for generic code review requests.

## Skill trace

- Follow the governing `AGENTS.md` skill-trace contract when one exists.
- Fallback examples: `🚀🔍 [skill:codex-review] ON ...`, `🛠️🔍 [skill:codex-review] STEP ...`, and `✅🔍 [skill:codex-review] DONE ...`.

The local runtime is the source of truth for the review workflow.
Do not add a positional prompt or stdin prompt.

## Backend selection

The wrapper supports two backends (via `--backend`):

| Backend   | Binary              | How it works                               |
|-----------|---------------------|---------------------------------------------|
| `codex`   | `codex` or `codex_wp` | `codex exec ... review` — native codex review |
| `glm_wp`  | `glm_wp`            | `glm_wp --system-prompt ... -p ...` with identical review prompts from codex source |

Default: `auto` — tries codex/codex_wp first, falls back to glm_wp on **any** codex failure (auth errors, timeouts, segfaults, API errors, binary missing, etc.).

The glm_wp backend uses the **exact same** review system prompt (`review_prompt.md` from OpenAI codex-rs) and the same user-facing prompt templates (`review_prompts.rs`) as codex. It runs pi/glm-5.1 in non-interactive mode.

### Fallback timeout

When the wrapper falls back to glm_wp, it automatically uses a longer timeout (480s vs default 300s) because the pi-based backend needs more time for review than native codex.

### Fallback guarantee

With `--backend auto` (default), fallback triggers on:

| codex failure                  | rc  | Fallback? |
|--------------------------------|-----|-----------|
| Binary not found               | 127 | ✅         |
| Auth / API key error           | 1   | ✅         |
| Network / rate limit           | 1   | ✅         |
| Timeout                        | 124 | ✅         |
| Segfault                       | 139 | ✅         |
| OOM killed                     | 137 | ✅         |
| Any other non-zero exit        | ≠0  | ✅         |
| codex succeeds                 | 0   | ❌ (not needed) |

The only case where fallback does **not** happen: both codex/codex_wp AND glm_wp are unavailable.

## Default workflow

1. Read [references/runtime-map.md](references/runtime-map.md) for the runtime contract.
2. Resolve the target repo and choose exactly one selector:
   - `--uncommitted`
   - `--base <branch>`
   - `--commit <sha>`
3. Run the local wrapper with an absolute target path.
4. Inspect the saved report under `.codex-review/runs/latest/`.

## Operating rules

- Preserve upstream review behavior. Do not invent extra reviewer prompts.
- Use exactly one selector flag.
- Use `--output /abs/path/report.md` only when the user wants a copied report artifact outside the repo-local run folder.
- Use `--backend glm_wp` to force the glm_wp backend (or `--backend codex` to force codex only, no fallback).
- Treat `report.md` as the public review artifact and `run.json` as execution metadata.

### Timeout and session inspection

- Default timeout: 300s. Fallback timeout: 480s.
- When **any** backend times out (exit code 124), the wrapper automatically inspects the most recent codex session JSONL (`~/.codex/sessions/`) to extract the last assistant outputs and understand what actually happened.
- This session direction is written into `stderr.log` — always check `stderr.log` for session inspection notes, not just the return code.
- This applies to both codex and glm_wp timeouts.

## When to read extra references

- Read [references/runtime-map.md](references/runtime-map.md) first for CLI shape and artifact locations.
- Read [references/examples.md](references/examples.md) for copy-paste commands.
