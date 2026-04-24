---
name: docutranslate
description: This skill should be used when the user wants to translate office documents through the canonical DocuTranslate wrapper on `almaz` at `/home/almaz/TOOLS/docutranslate_cli_skill`. Triggers on mentions of `docutranslate`, `dt`, document translation, `docx`, `xlsx`, `pptx`, output formats, DeepSeek glossary tuning, office smoke tests, translation quality review, or delivery wiring. The old pets-side repo is deprecated and should not be used as the working tree.
triggers: docutranslate, dt, document translation, translate document, docx translation, xlsx translation, pptx translation, office translation, DeepSeek glossary, translate office, translate pdf, translate docx
---

# DocuTranslate

Use this skill for the canonical DocuTranslate wrapper repo on `almaz`:

- `/home/almaz/TOOLS/docutranslate_cli_skill`

The global CLI entrypoints on `pets` should route to `almaz`:

- `docutranslate`
- `dt`

## Claude Code

- Claude Code discovers personal skills from `~/.claude/skills/`.
- Mirror this shared skill into Claude Code with a symlink at `~/.claude/skills/docutranslate -> ~/.agents/skills/docutranslate`.
- In Claude Code prefer `/docutranslate` or a natural-language request that mentions `docutranslate`, `dt`, or office translation.
- Do not expect `$docutranslate` syntax to work in Claude Code.

## Skill trace

- Follow the governing `AGENTS.md` skill-trace contract when one exists.
- Fallback examples: `🚀📘 [skill:docutranslate] ON ...`, `🛠️📘 [skill:docutranslate] STEP ...`, `✅📘 [skill:docutranslate] DONE ...`.

## Bootstrap

Before substantial work in that repo, read:

1. `PROFILE.md`
2. `SKILL.md`
3. `AGENTS.md`
4. `.MEMORY/AGENTS.md`
5. `.MEMORY/NOW.md`
6. `.MEMORY/INDEX.md`
7. only the relevant memory cards

## Hard boundary

- Make changes in `/home/almaz/TOOLS/docutranslate_cli_skill`
- Do not revive the deprecated pets-side wrapper repo as the working tree
- Treat the old pets-side copy as `_to_remove` evidence only if it still exists

## Core rules

- Prefer the global wrapper commands `docutranslate` and `dt` over calling upstream internals directly.
- Preserve the wrapper promise: honest formats only, no fake convert directions.
- Keep `deepseek-chat` as the default profile unless the user asks otherwise.
- Keep provider-specific prompt and glossary tuning in `configs/models/*.toml`, not hardcoded into wrapper logic.
- For durable facts, update `.MEMORY/NOW.md` first, then the relevant numbered memory cards.

## Common commands

```bash
ssh almaz 'cd /home/almaz/TOOLS/docutranslate_cli_skill && pwd'
```

```bash
ssh almaz 'cd /home/almaz/TOOLS/docutranslate_cli_skill && ./docutranslate --help'
```

```bash
dt /absolute/path/to/file.docx --pretty
```

```bash
dt --list-output-formats /absolute/path/to/file.xlsx --pretty
```

```bash
python3 scripts/run_office_smoke_matrix.py --pretty
```

```bash
python3 scripts/verify_office_run.py runs/manual/<run-dir> --write
```

## If user wants X -> use Y

- direct file translation -> `dt /abs/path/to/file`
- JSON result path plus progress -> `dt /abs/path/to/file --pretty`
- supported output formats -> `dt --list-output-formats /abs/path/to/file --pretty`
- office regression run -> `ssh almaz 'cd /home/almaz/TOOLS/docutranslate_cli_skill && python3 scripts/run_office_smoke_matrix.py --pretty'`
- verify Russian text exists in outputs -> `ssh almaz 'cd /home/almaz/TOOLS/docutranslate_cli_skill && python3 scripts/verify_office_run.py <run-dir> --write'`
- tune DeepSeek defaults -> `configs/models/deepseek-chat.toml`
- tune profile glossary or prompt -> `configs/models/*.toml`
- review translation quality -> compare source fixtures or source files against outputs in `runs/manual/...`
- send result to Telegram or Mattermost -> `dt /abs/path/to/file --deliver telegram` or `--deliver mattermost`

## Current known truths

- If `--to-lang` is omitted, the default `deepseek-chat` profile targets `Russian`.
- The public output-format matrix is local and intentionally narrow.
- HTML is intentionally disabled in the public wrapper surface.
- Office smoke fixtures exist for English and Chinese `docx`, `xlsx`, and `pptx`.
- A profile-driven DeepSeek glossary path exists and is already wired into direct runs.

## Useful artifacts

- `configs/defaults.toml`
- `configs/models/deepseek-chat.toml`
- `scripts/direct_translate_runner.py`
- `scripts/run_office_smoke_matrix.py`
- `scripts/verify_office_run.py`
- `.MEMORY/011-live-office-smoke-2026-04-06.md`
- `.MEMORY/012-deepseek-profile-glossary.md`
