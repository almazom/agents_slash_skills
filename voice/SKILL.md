---
name: voice
description: Generate a spoken-style answer, mp3, or optional Telegram-delivered audio through the standalone Voice runtime in /home/pets/TOOLS/voice_skill_cli.
triggers: voice, $voice, TTS, text-to-speech, audio generation, mp3, voice skill, spoken answer, voice_skill_cli, voice explain, voice speak, voice run, Telegram audio
---

## Skill trace

- Follow the governing `AGENTS.md` trace contract when one exists.
- Fallback examples: `🚀🎧 [skill:Voice] ON ...`, `🛠️🎧 [skill:Voice] STEP ...`, `✅🎧 [skill:Voice] DONE ...`.

## Runtime

- Repo: `/home/pets/TOOLS/voice_skill_cli`
- CLI: `voice`
- Safe fallback: `cd /home/pets/TOOLS/voice_skill_cli && ./run ...`

## Default path

1. Determine whether the operator needs `explain`, `speak`, or `run`.
2. Prefer inline `--text` when the content was produced in the same turn.
3. Produce a real `.mp3` for explicit Voice requests unless the operator asked for dry-run only.
4. For bot-triggered requests, prefer same-chat file return over direct Telegram delivery.
5. When using shell or Bash tools for real synthesis, give `voice` or `./run` at least `600000` ms timeout so slow TTS and packaging can finish.
6. When using `--text`, pass the actual spoken text inline, not a filesystem path string.
7. For poems, stories, jokes, or any request to read the source text exactly as written, add `--content-mode verbatim`.

## Command shapes

```bash
cd /home/pets/TOOLS/voice_skill_cli && ./run explain --ask "Объясни это как голосом" --file README.md
```

```bash
cd /home/pets/TOOLS/voice_skill_cli && ./run speak --ask "Сделай голосом" --text "def demo(): return True" --out /absolute/path/answer.mp3
```

```bash
cd /home/pets/TOOLS/voice_skill_cli && ./run speak --ask "Прочитай текст как есть" --text "Сервер гудит тихо" --content-mode verbatim --out /absolute/path/answer.mp3
```

```bash
cd /home/pets/TOOLS/voice_skill_cli && ./run speak --ask "Прочитай текст как есть" --text "Сервер гудит тихо" --content-mode verbatim --provider minimax --profile default_male --out /absolute/path/answer.mp3
```

```bash
cd /home/pets/TOOLS/voice_skill_cli && ./run speak \
  --ask "Отправь голосом" \
  --text "def demo(): return True" \
  --out /absolute/path/answer.mp3 \
  --deliver \
  --delivery-dry-run \
  --target "${VOICE_SKILL_TELEGRAM_TARGET:-}"
```

## Runtime patience

- Default patience targets in the runtime are `VOICE_SKILL_LLM_TIMEOUT_SECONDS=600` and provider TTS timeouts `420` seconds unless the environment overrides them.
