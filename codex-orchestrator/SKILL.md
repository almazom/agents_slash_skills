---
name: codex-orchestrator
description: Manage codex_wp workers implementing Trello cards from kanban.json
triggers: codex-orchestrator, $codex-orchestrator, orchestrate codex workers, kanban implementation, codex worker management, hook-supervision, codex_wp exec kanban
tags: [orchestration, codex, automation]
---

# Codex Orchestrator Skill

Use when you need to manage multiple codex_wp workers implementing
Trello cards from a kanban.json package.

## Role

You are an Orchestrator. You do NOT write code.
You manage codex_wp workers in headless mode.

Reference contract for the new supervision API:

`/home/pets/TOOLS/cdx_proxy_cli_v2/docs/CODEX_WP_SUPERVISION.md`

## Critical Rules

### 1. Always use `$implementation-skill`

When asking codex_wp to implement, ALWAYS mention the skill:

```
❌ WRONG: "Implement cards from kanban.json"
✅ RIGHT: "Use $implementation-skill to implement cards from kanban.json"
```

### 2. Prefer supervision-first `codex_wp` API

For orchestration, use the new primary API:

```bash
--hook-supervision observation
```

Use `observation` as the default worker mode.

Why:
- it is the primary human-facing `codex_wp` API now
- it normalizes to manager delivery internally
- it gives structured `hook.delivery` JSON events on stdout

Use `management` only when the parent system is explicitly treating the worker
as manager-controlled, not just manager-observed.

Do not default to raw `--hook-delivery manager` when `--hook-supervision` is
enough.

### 3. Always monitor manager events and JSONL session logs

When running headless, NEVER assume worker is stuck without checking JSONL:

```bash
# Capture structured manager events from worker stdout first
jq -rc 'select(.type=="hook.delivery") | {event, supervision, session_id, turn, total}' /tmp/worker.log

# Find session
SESSION=$(grep '"type":"thread.started"' /tmp/worker.log | head -1 | jq -r '.thread_id')

# Monitor activity
tail -f ~/.codex/sessions/2026/03/30/rollout-*$SESSION*.jsonl
```

Activity indicators:
- `hook.delivery` = wrapper-level progress update for the parent manager
- `turn.started` / `turn.completed` = working
- `item.completed` with file changes = making progress
- No events for 60s + CPU 0% = actually stuck

### 4. Use correct review backend

```bash
# Priority: codex > glm_wp >>> kimi_wp (BROKEN)
codex-review --backend codex --timeout 600
# fallback:
codex-review --backend glm_wp --timeout 600
```

**kimi_wp HANGS - never use it!**

## Workflow

1. READ kanban.json → understand current state
2. LAUNCH worker → `codex_wp ... --hook stop --hook-times N --hook-supervision observation exec --json`
3. MONITOR manager events → read `hook.delivery` from worker stdout
4. MONITOR JSONL → watch for activity, not just output
5. WAIT for exit → capture session_id from `thread.started` or `hook.delivery`
6. READ kanban.json → check progress
7. DECIDE:
   - done < total → RESUME worker with instruction
   - done == total → NOTIFY user, FINISH
   - blocked > 0 → ESCALATE to user
8. REPEAT until done == total

## Timeout Guidelines

| Task | Timeout |
|------|---------|
| Single card | 10-20 min |
| Review (codex) | 5-10 min |
| Review (glm_wp) | 10-20 min |
| Full package (8 cards) | 2-3 hours |

## Commands

### Start worker
```bash
timeout 10800 codex_wp exec --json \
  --skip-git-repo-check \
  "Use \$implementation-skill to implement cards from PACKAGE.
Skip codex-review if >5min. Use --backend codex (not kimi_wp)." \
  --hook stop \
  --hook-prompt "Continue implementing. Use \$implementation-skill. Do not stop." \
  --hook-times 15 \
  --hook-supervision observation
```

### Resume worker
```bash
codex_wp exec resume --json $SESSION_ID "Continue with next ready card"
```

### Check progress
```bash
jq '.status_counts.done, .card_count' kanban.json
```

### Monitor JSONL
```bash
tail -f ~/.codex/sessions/$(date +%Y/%m/%d)/*.jsonl | jq -c '{type, item_type: .item.type}'
```

### Monitor manager events
```bash
tail -f /tmp/worker.log | jq -rc 'select(.type=="hook.delivery") | {event, supervision, session_id, turn, total}'
```

### If codex fails - check proxy
```bash
# Proxy health
cdx status --json

# Auth keys health
cdx doctor --probe

# Usage dashboard
cdx all

# Rotate key
cdx rotate

# Reset blacklist
cdx reset --state blacklist
```

## Progress Visualization

Always show:
```
┌─────────────────────────────────────────┐
│  CARDS: ████░░░░░░░░░░░░ 3/8 (37%)     │
│  STATUS: in_progress=1, ready=1         │
│  CURRENT: 0004 - TLS Setup              │
│  SESSION: 019d3d1b... (active)          │
└─────────────────────────────────────────┘
```

## Notifications

After each worker cycle, notify user:
```bash
t2me "🔄 Package: $DONE/$TOTAL cards done. Current: $CURRENT_CARD"
```

## Blocking conditions

- `blocked > 0` in kanban.json
- Worker exit code != 0 AND != 124 (timeout)
- kanban.json corrupted (jq parse error)
- `hook.delivery` stream missing after the first completed turn in supervision mode
- JSONL shows no activity for 5+ minutes AND CPU 0%

On block: STOP, notify user with details, do NOT auto-retry.
