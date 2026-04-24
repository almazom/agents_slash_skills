# Codex CLI Hooks Reference

Use this when the operator asks how to create, review, or troubleshoot a
Codex CLI hook.

Verified against the official OpenAI Codex Hooks docs on 2026-04-11.

Primary sources:
- https://developers.openai.com/codex/hooks
- https://developers.openai.com/codex/config-reference

## What this reference covers

- feature flag and file locations
- event and matcher rules
- hook script input and output shapes
- safe pathing and test workflow
- Shehroz-skill guidance for when to use hooks vs hook-loop continuation

## Quick decision

Use a Codex CLI hook when you need deterministic behavior at a Codex lifecycle
event, for example:
- inject extra context at session start
- block risky Bash commands before they run
- review Bash output after it runs
- add policy or memory checks when a user submits a prompt
- continue or stop work at turn end through a `Stop` hook

Do not use hooks when the real need is:
- a one-off worker task packet
- a long background implementation run that should continue through repeated
  turn stops
- shell-only orchestration without Codex in the loop

If the goal is a long continuation worker, read
`references/long-run-hook-loop.md` after this file.

## Required preflight

1. Enable the feature flag in `config.toml`:

```toml
[features]
codex_hooks = true
```

2. Decide scope:
- global user scope -> `~/.codex/hooks.json`
- repo scope -> `<repo>/.codex/hooks.json`

3. If you are using repo-local scripts, resolve them from git root:

```bash
$(git rev-parse --show-toplevel)/.codex/hooks/my_hook.py
```

Do not rely on `.codex/hooks/...` relative paths. Codex may start from a
subdirectory.

## Core runtime rules

- Hooks are experimental.
- Hooks are currently disabled on Windows.
- Matching hooks from multiple `hooks.json` files all run.
- Matching command hooks for the same event run concurrently.
- Higher-precedence config does not replace lower-precedence hooks.
- Commands run with the session `cwd` as their working directory.
- `timeout` is in seconds.
- `timeoutSec` is accepted as an alias.
- If timeout is omitted, Codex uses `600` seconds.
- `statusMessage` is optional.

## Where to put files

Typical repo-local shape:

```text
<repo>/
  .codex/
    hooks.json
    hooks/
      session_start.py
      pre_tool_use.py
      post_tool_use.py
      stop.py
```

You can also keep scripts in `~/.codex/hooks/` for global usage.

## Event cheat sheet

| Event | Trigger | Matcher support | Current practical note |
|------|---------|-----------------|------------------------|
| `SessionStart` | session startup or resume | `startup|resume` | good for adding developer context |
| `UserPromptSubmit` | before user prompt is sent | no practical matcher support | can add context or block |
| `PreToolUse` | before a tool runs | tool name regex | current runtime only emits `Bash` |
| `PostToolUse` | after a tool runs | tool name regex | current runtime only emits `Bash` |
| `Stop` | when Codex stops generating | no practical matcher support | can continue the run with `decision: "block"` |

Important current limitation:
- `PreToolUse` and `PostToolUse` are useful guardrails, not a full security
  boundary. The official docs explicitly note the model can still work around
  them by writing and running scripts through Bash, and non-shell tools are not
  fully intercepted.

## Matcher rules

- Use `"*"` or `""`, or omit `matcher`, to match all supported occurrences.
- `SessionStart` matches on `source`, currently `startup` or `resume`.
- `PreToolUse` and `PostToolUse` match on `tool_name`, currently `Bash`.
- `UserPromptSubmit` ignores `matcher`.
- `Stop` ignores `matcher`.

## Canonical `hooks.json` shape

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.codex/hooks/session_start.py",
            "statusMessage": "Loading session notes"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/usr/bin/python3 \"$(git rev-parse --show-toplevel)/.codex/hooks/pre_tool_use.py\"",
            "statusMessage": "Checking Bash command"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/usr/bin/python3 \"$(git rev-parse --show-toplevel)/.codex/hooks/post_tool_use.py\"",
            "statusMessage": "Reviewing Bash output"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/usr/bin/python3 \"$(git rev-parse --show-toplevel)/.codex/hooks/user_prompt_submit.py\""
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/usr/bin/python3 \"$(git rev-parse --show-toplevel)/.codex/hooks/stop.py\"",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

## Complete JSON Schema Reference

### Schema Hierarchy

The `hooks.json` file follows this structure:

```
HooksFile
└── hooks: HookEvents
    ├── PreToolUse: MatcherGroup[]
    ├── PostToolUse: MatcherGroup[]
    ├── SessionStart: MatcherGroup[]
    ├── UserPromptSubmit: MatcherGroup[]
    └── Stop: MatcherGroup[]
        └── MatcherGroup
            ├── matcher: string (optional regex)
            └── hooks: HookHandlerConfig[]
                └── HookHandlerConfig (tagged union by "type")
```

### Handler Types and Support Status

| Type | Status | Fields | Notes |
|------|--------|--------|-------|
| `command` | **Supported** | `command`, `timeout`/`timeoutSec`, `async`, `statusMessage` | Primary working handler type |
| `prompt` | **Not implemented** | (none) | Defined in schema but skipped with warning |
| `agent` | **Not implemented** | (none) | Defined in schema but skipped with warning |

### Command Handler Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | required | Must be `"command"` |
| `command` | string | required | Shell command to execute |
| `timeout` / `timeoutSec` | number | 600 | Timeout in seconds (minimum: 1) |
| `async` | boolean | false | **Not supported** - setting to `true` skips the hook |
| `statusMessage` | string | null | Optional message shown during execution |

**Important:** The `async: true` option is parsed but not supported. If set, the hook will be skipped with a warning.

### Complete Stop Hook Input Schema

The `Stop` hook receives this exact JSON structure on stdin:

```json
{
  "cwd": "/absolute/path/to/project",
  "hook_event_name": "Stop",
  "last_assistant_message": "The final assistant message or null",
  "model": "gpt-5.2-codex",
  "permission_mode": "default",
  "session_id": "sess_xxx",
  "stop_hook_active": true,
  "transcript_path": "/path/to/transcript.jsonl or null",
  "turn_id": "turn_xxx"
}
```

**Field descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `cwd` | string | Current working directory |
| `hook_event_name` | string | Always `"Stop"` |
| `last_assistant_message` | string \| null | Final message from assistant |
| `model` | string | Model identifier (e.g., `gpt-5.2-codex`) |
| `permission_mode` | string | One of: `default`, `acceptEdits`, `plan`, `dontAsk`, `bypassPermissions` |
| `session_id` | string | Unique session identifier |
| `stop_hook_active` | boolean | Always `true` for Stop events |
| `transcript_path` | string \| null | Path to session transcript file |
| `turn_id` | string | Unique turn identifier |

### Permission Mode Values

| Value | Meaning |
|-------|---------|
| `default` | Standard permission policy |
| `acceptEdits` | Auto-accept edit operations |
| `plan` | Plan mode - no execution |
| `dontAsk` | Reduced approval prompts |
| `bypassPermissions` | Skip permission checks (dangerous) |

## Common input fields on `stdin`

Every command hook receives one JSON object on `stdin`.

Shared fields:

```json
{
  "session_id": "string",
  "transcript_path": "string|null",
  "cwd": "string",
  "hook_event_name": "string",
  "model": "string"
}
```

Use the current official snake_case field names above. If you see older notes
using camelCase, treat the official docs as the source of truth.

Event-specific fields:

### `SessionStart`

```json
{
  "source": "startup|resume"
}
```

### `UserPromptSubmit`

```json
{
  "turn_id": "string",
  "prompt": "string"
}
```

### `PreToolUse`

```json
{
  "turn_id": "string",
  "tool_name": "Bash",
  "tool_use_id": "string",
  "tool_input": {
    "command": "string"
  }
}
```

### `PostToolUse`

```json
{
  "turn_id": "string",
  "tool_name": "Bash",
  "tool_use_id": "string",
  "tool_input": {
    "command": "string"
  },
  "tool_response": "JSON value"
}
```

### `Stop`

```json
{
  "cwd": "string",
  "hook_event_name": "Stop",
  "last_assistant_message": "string|null",
  "model": "string",
  "permission_mode": "default|acceptEdits|plan|dontAsk|bypassPermissions",
  "session_id": "string",
  "stop_hook_active": true,
  "transcript_path": "string|null",
  "turn_id": "string"
}
```

## Common output patterns on `stdout`

For `SessionStart`, `UserPromptSubmit`, and `Stop`, this common JSON shape is
supported:

```json
{
  "continue": true,
  "stopReason": "optional",
  "systemMessage": "optional",
  "suppressOutput": false
}
```

Common meanings:
- `continue: false` -> marks that hook run as stopped
- `stopReason` -> recorded stop reason
- `systemMessage` -> warning in UI or event stream
- `suppressOutput` -> parsed but not yet implemented

Practical rule:
- exit `0` with no output -> success and Codex continues

## Minimal hook scripts

### 1. `SessionStart` context hook

```python
#!/usr/bin/env python3
import json

payload = {
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": "Read local project instructions before editing."
    }
}

print(json.dumps(payload))
```

### 2. `PreToolUse` Bash guardrail

```python
#!/usr/bin/env python3
import json
import sys

data = json.load(sys.stdin)
command = data.get("tool_input", {}).get("command", "")

dangerous = ["rm -rf", "sudo rm", "dd if="]

for pattern in dangerous:
    if pattern in command:
        print(
            json.dumps(
                {
                    "hookSpecificOutput": {
                        "hookEventName": "PreToolUse",
                        "permissionDecision": "deny",
                        "permissionDecisionReason": (
                            f"Blocked dangerous pattern: {pattern}"
                        ),
                    }
                }
            )
        )
        sys.exit(0)

sys.exit(0)
```

Alternative block path:
- exit code `2`
- write the reason to `stderr`

### 3. `PostToolUse` review hook

```python
#!/usr/bin/env python3
import json
import sys

data = json.load(sys.stdin)
command = data.get("tool_input", {}).get("command", "")

if "npm install" in command:
    print(
        json.dumps(
            {
                "decision": "block",
                "reason": "Review dependency changes before continuing.",
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "additionalContext": "The command may have changed lockfiles."
                }
            }
        )
    )
    sys.exit(0)

sys.exit(0)
```

Important:
- `PostToolUse` cannot undo side effects from the command that already ran.
- `decision: "block"` replaces the tool result with feedback and continues the
  model from there.

### 4. `Stop` continuation hook

```python
#!/usr/bin/env python3
import json
import sys

data = json.load(sys.stdin)
last_message = (data.get("last_assistant_message") or "").lower()

if "todo" in last_message or "remaining" in last_message:
    print(
        json.dumps(
            {
                "decision": "block",
                "reason": "Re-read the plan, then continue only the next unfinished step."
            }
        )
    )
    sys.exit(0)

print(json.dumps({"continue": false, "stopReason": "No follow-up needed"}))
sys.exit(0)
```

Critical `Stop` rule:
- plain text on `stdout` is invalid for `Stop`
- to continue the run, return JSON with `decision: "block"` and a `reason`
- if any matching `Stop` hook returns `continue: false`, that takes precedence
  over continuation decisions from other matching `Stop` hooks

## Step-by-step creation workflow

1. Decide whether the hook is global or repo-local.
2. Enable `codex_hooks = true` in the relevant `config.toml`.
3. Create the hook script under `~/.codex/hooks/` or `<repo>/.codex/hooks/`.
4. Make the script executable if needed.
5. Add the event entry to `hooks.json`.
6. Use git-root-based paths for repo-local scripts.
7. Start with a harmless script that logs or returns additional context.
8. Test with safe commands before adding blocking behavior.
9. Only then add denial or continuation logic.

## Testing checklist

- confirm the feature flag is enabled
- confirm the correct `hooks.json` exists
- confirm the hook script path resolves from the intended repo root
- confirm the script can read JSON from `stdin`
- confirm the script returns valid JSON when required
- confirm timeout is reasonable for the event
- test with safe prompts and safe Bash commands first
- if using both global and repo-local hooks, remember both layers will run

## Manager-worker notes

- Use hooks for deterministic lifecycle behavior, not as a substitute for a
  full worker task contract.
- For long-running continuation workers, pair this reference with
  `references/long-run-hook-loop.md`.
- Keep secrets out of hook code and hook packets the same way you would for any
  other worker runtime.
- When reporting status, be explicit whether the hook is:
  `installed | enabled | firing | blocking | continuing | timing out`.
