# codex_wp CLI

Verified: 2026-03-29
Binary: `/home/pets/.local/bin/codex_wp`
Source: `/home/pets/TOOLS/cdx_proxy_cli_v2/bin/codex_wp`

`codex_wp` is the local Codex wrapper. It auto-boots the `cdx` proxy, injects
the resolved proxy base URL into Codex, adds file-scoped prompts, supports
hook-loop resumption, and exposes Zellij launch modes plus shortcut workflows.

## Non-negotiable prompt rule

- Use `codex_wp exec "prompt"` for prompt-driven headless work.
- `-p/--profile` is the Codex profile flag. It is not a prompt slot.
- `codex_wp -p "implement X"` is the wrong shape and can lead to
  `failed to parse session_id from codex JSON output`.

## Runtime behavior

At runtime the wrapper:

1. resolves `cdx`
2. runs `cdx proxy --print-env-only`
3. `eval`s the proxy exports
4. reads `CLIPROXY_BASE_URL`
5. launches `codex` with `-c "openai_base_url=..."`
6. always adds `--dangerously-bypass-approvals-and-sandbox`

That means `codex_wp` is already proxy-aware; you usually do not need a manual
`eval "$(cdx proxy --print-env-only)"` before using it.

## Wrapper flags

General wrapper flags from `codex_wp --help`:

- `-f, --file <path>`: prepend `@/absolute/path` references to `exec` prompts
- `-S`: run built-in `code-simplifier` in a floating Zellij pane
- `-A`: run built-in `auto-commit` in a floating Zellij pane
- `-SA`: run `code-simplifier`, then `auto-commit`, in one floating pane
- `--zellij-new-tab [name]`
- `--zellij-template <key>`
- `--zellij-cwd <path>`
- `--zellij-dry-run`

Floating pane flags:

- `-F, --zellij-floating`
- `--zellij-top <value>`
- `--zellij-right <value>`
- `--zellij-width <value>`
- `--zellij-height <value>`
- `--zellij-close-on-exit`

Floating pair flags:

- `--zellij-floating-pair`
- `--pair-layout <key>`
- `--a-prompt <text>`
- `--a-file <path>`
- `--b-prompt <text>`
- `--b-file <path>`
- `--zellij-pair-json`

## Hook mode

Wrapper help exposes:

- `--hook stop`
- `--hook-prompt <text>`
- `--hook-times <n>`
- `--hook-time <n>` as a legacy alias
- `--hook-target <target>`
- `--hook-extract-intent`

Important guardrails from the implementation:

- hook mode supports only `stop`
- headless hook mode requires `exec --json`
- headless hook mode does not support `--ephemeral`
- manual `exec resume` is not supported under `--hook stop`
- hook mode is not supported with Zellij launch modes
- notifications default to `t2me send`; `--hook-target` overrides the target

## Correct command shapes

Basic headless run:

```bash
codex_wp exec "Review the current repository"
```

File-scoped run:

```bash
codex_wp -f /absolute/path/to/file.ts exec "Refactor this file without changing behavior"
```

Headless hook loop:

```bash
codex_wp exec --json --hook stop --hook-prompt "Continue from the current repo state" --hook-times 3 "Implement the approved change"
```

Hook loop with intent extraction:

```bash
codex_wp exec --json --hook stop --hook-prompt "Continue" --hook-times 2 --hook-extract-intent "Finish the task"
```

Floating Zellij dry run:

```bash
codex_wp --zellij-new-tab --zellij-dry-run exec "Inspect the repo"
```

Floating pair mode:

```bash
codex_wp --zellij-floating-pair --pair-layout stacked -- --model gpt-5.4 "Compare two approaches"
```

## More guardrails

- Help mode is side-effect free; wrapper help prints first, then upstream Codex
  help.
- Pair mode requires `--` before shared inner args.
- Pair mode adds `exec` automatically; do not add it yourself in shared args.
- `--file` only prepends references for `exec` prompts.
- When hook-loop mode fails before session metadata appears, suspect wrong
  command shape or proxy/auth issues first.
