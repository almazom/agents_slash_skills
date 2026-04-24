---
name: codex-orchestra
description: Use when the operator wants implementation, review, or second-opinion work routed through local Codex CLI tooling, especially via `codex_wp` plus `cdx` proxy commands for health, rotation, limits, trace, and recovery.
triggers: codex-orchestra, $codex-orchestra, codex_wp, cdx proxy, ask Codex, Codex-only, implement with Codex, cdx status, cdx doctor, cdx rotate, cdx health, codex exec, пусть Codex сделает
---

# codex-orchestra

Use this skill when the user explicitly wants Codex to do the work, asks about
`codex_wp`, asks how to run Codex through the local proxy stack, or needs help
debugging `cdx` health, limits, rotation, or stalled Codex sessions.

## Skill trace

- Follow the governing `AGENTS.md` skill-trace contract when one exists.
- Fallback examples: `🚀⬜ [skill:codex-orchestra] ON ...`,
  `🛠️⬜ [skill:codex-orchestra] STEP ...`, and
  `✅⬜ [skill:codex-orchestra] DONE ...`.

## Runtime map

- `codex_wp` is the execution wrapper. It adds file injection, hook loops,
  Zellij launch modes, and fixed shortcut flows.
- `cdx` is the proxy/auth/rotation/limits/recovery layer underneath Codex.
- `codex exec` is the base non-interactive engine.

Read [references/codex-wp-cli.md](references/codex-wp-cli.md) for wrapper
shape and [references/cdx-proxy-cli.md](references/cdx-proxy-cli.md) for exact
proxy lifecycle and recovery commands.
For iterative Telegram bot validation, prompt packs, and a 35-step improvement
loop, read [references/bot-testing-playbook.md](references/bot-testing-playbook.md).

## Trigger phrases

Treat this skill as active when the operator says or strongly implies:

- `codex-orchestra`
- `ask Codex`
- `Codex-only`
- `implement with Codex`
- `codex_wp`
- `cdx proxy`
- `пусть Codex сделает`

## Default workflow

1. If the exact CLI shape is uncertain, start with `codex_wp --help`,
   `codex exec --help`, or `cdx --help`.
2. Prefer `codex_wp` when available for implementation, refactors, reviews, or
   second-opinion runs that should be executed by Codex CLI.
3. Use raw `codex exec` only when the wrapper is unavailable or the user
   explicitly wants base Codex.
4. Before blaming Codex, check proxy health with `cdx status --json`. If the
   proxy is unhealthy or missing a base URL, run
   `eval "$(cdx proxy --print-env-only)"` or let `codex_wp` auto-boot it.
5. For prompt-driven work, use `codex_wp exec "..."`. Treat `-p/--profile` as
   profile selection, never as a prompt slot.
6. If a run stalls or auth looks bad, inspect `cdx doctor`, `cdx all`,
   `cdx trace`, `cdx logs`, and `cdx limits`. Rotate or reset keys before
   declaring the runtime broken.
7. Fall back to direct local editing only when `codex_wp`/`codex` is
   unavailable or repeated proxy/auth failures block execution. State that
   fallback explicitly.

## Operating rules

- For headless work, prefer `codex_wp exec` over interactive Codex.
- Use `-f /absolute/path` to prepend file references into `exec` prompts.
- Use `--json` when another agent or script needs machine-readable progress.
- Use hook-loop mode only with `exec --json`; see
  [references/codex-wp-cli.md](references/codex-wp-cli.md).
- When validating the skill through a Telegram bot, capture both operator-side
  evidence (`fetch --json`, service logs, local chat history) and proxy-side
  evidence (`cdx status`, `cdx doctor`, `cdx all`, `cdx trace`, `cdx logs`).
- Keep the skill body lean. Load references only when the task needs exact
  flags, examples, or recovery logic.

## Copy-paste patterns

Basic implementation run:

```bash
codex_wp exec "Implement the approved change in this repository"
```

File-scoped run:

```bash
codex_wp -f /absolute/path/to/file.ts exec "Refactor this file without changing behavior"
```

Headless hook loop:

```bash
codex_wp exec --json --hook stop --hook-prompt "Continue from the current repo state" --hook-times 3 "Implement the requested change"
```

Proxy health check:

```bash
cdx status --json
cdx doctor --probe
cdx all
```

Bot prompt examples:

```text
Спроси Codex мнение по этой реализации и перечисли риски.
Пусть Codex реализует эту фичу в указанной папке и коротко отчитается.
Codex-only: сначала проверь cdx health, потом продолжай реализацию.
```
