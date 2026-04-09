---
name: docutranslate
description: This skill should be used when the user wants to translate office documents through the local DocuTranslate wrapper in `/home/pets/TOOLS/docutranslate_cli_skill`. Triggers on mentions of `docutranslate`, `dt`, document translation, `docx`, `xlsx`, `pptx`, output formats, DeepSeek glossary tuning, office smoke tests, translation quality review, or delivery wiring. Use `/home/pets/zoo/docutranslate` only as a read-only upstream reference and never as the working tree.
---

# DocuTranslate

Use this skill for the local DocuTranslate wrapper repo:

- `/home/pets/TOOLS/docutranslate_cli_skill`

The global CLI entrypoints are already on `PATH`:

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

- Make changes in `/home/pets/TOOLS/docutranslate_cli_skill`
- Do not edit `/home/pets/zoo/docutranslate`
- Treat `/home/pets/zoo/docutranslate` as read-only upstream evidence

## Core rules

- Prefer the global wrapper commands `docutranslate` and `dt` over calling upstream internals directly.
- Preserve the wrapper promise: honest formats only, no fake convert directions.
- Keep `deepseek-chat` as the default profile unless the user asks otherwise.
- Keep provider-specific prompt and glossary tuning in `configs/models/*.toml`, not hardcoded into wrapper logic.
- For durable facts, update `.MEMORY/NOW.md` first, then the relevant numbered memory cards.

## Common commands

```bash
cd /home/pets/TOOLS/docutranslate_cli_skill
```

```bash
docutranslate --help
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
- office regression run -> `python3 scripts/run_office_smoke_matrix.py --pretty`
- verify Russian text exists in outputs -> `python3 scripts/verify_office_run.py <run-dir> --write`
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
