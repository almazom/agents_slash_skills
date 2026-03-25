---
name: voice-answer
description: "Generate a spoken voice answer from technical content or questions using the voice2me_cli pipeline. Use when the user wants to convert text, questions, or explanations into speech with optional TTS synthesis and Telegram delivery. Supports multiple modes: explain (technical answer only), speak (speech script), full (complete with TTS and delivery)."
---

You are a voice answer specialist that converts technical content into natural spoken explanations using the voice2me_cli pipeline.

## Skill trace

When this skill is active, make that visible in the user-facing trace:

- Follow the governing `AGENTS.md` skill-trace contract when one exists.
- Use the examples in this section only as fallback when no governing `AGENTS.md` defines skill-trace formatting.
- Fallback examples: `🚀🔊 [skill:voice-answer] ON ...`, `🛠️🔊 [skill:voice-answer] STEP ...`, and `✅🔊 [skill:voice-answer] DONE ...`.

## Invocation

The user invokes this skill with `$voice-answer` followed by optional parameters.

### Parameters (parsed from user message or defaults)

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `--mode` | `explain`, `speak`, `full` | `full` | Pipeline depth |
| `--ask` | free text | context-based | The question or request for the pipeline |
| `--file` | path | - | Input file path |
| `--text` | string | - | Inline input text |
| `--length` | `short`, `medium`, `long` | `medium` | Target speech length |
| `--detail-mode` | `simple`, `technical`, `detailed` | `technical` | Explanation depth |
| `--gender` | `man`, `woman` | - | Voice gender override |
| `--speed` | float | - | Voice speed multiplier |
| `--send` / `--no-send` | flag | `--send` in full mode | Telegram delivery |
| `--dry` | flag | - | Dry run with fake providers |
| `--caption` | text | - | Telegram caption |
| `--target` | `@username` or chat id | env/workspace-based | Telegram destination override |

### Default behavior

If the user just says `$voice-answer` without parameters:
1. Use `--mode full` (complete pipeline with TTS and delivery)
2. Use `--length medium`
3. Use `--detail-mode technical`
4. Generate an `--ask` based on the current conversation context
5. Enable Telegram delivery unless `--no-send` is specified

## Workflow

1. **Parse intent**: Extract `--ask`, `--file`, `--mode`, and other flags from user message
2. **Prepare input**: If no `--file` or `--text`, synthesize input from conversation context
3. **Resolve delivery target**: Prefer `VOICE_ANSWER_TELEGRAM_TARGET`; if it is absent, you may extract `<chat_id>` from `.../state/agent-workspaces/<chat_id>/` in the current working directory
4. **Build command**: Construct the `./run` command with resolved parameters, adding `--target <value>` for live delivery when a target is known
5. **Execute**: Run the voice2me pipeline
6. **Report**: Summarize the result (audio path, duration, delivery status)

## Command templates

```bash
# Full voice answer from file
cd /home/pets/TOOLS/voice2me_cli && ./run --file PATH --mode full --ask "QUESTION"

# Full voice answer from inline text
cd /home/pets/TOOLS/voice2me_cli && ./run --text "CONTENT" --mode full --ask "Explain this as a voice message"

# Explain only (no TTS)
cd /home/pets/TOOLS/voice2me_cli && ./run --file PATH --mode explain --ask "QUESTION"

# Custom voice settings
cd /home/pets/TOOLS/voice2me_cli && ./run --file PATH --mode full --gender woman --speed 1.1 --length long

# Dry run (no actual synthesis/delivery)
cd /home/pets/TOOLS/voice2me_cli && ./run --text "CONTENT" --dry
```

## Examples

### User: `$voice-answer --ask "Why was the system slow?"`

Generate a voice answer explaining the diagnostics we just ran:
- Swap pressure
- Orphaned processes
- Singleton fix applied

### User: `$voice-answer --file README.md --mode speak`

Generate a speech script from README.md without TTS synthesis.

### User: `$voice-answer --text "Your content here" --length short --no-send`

Generate a short voice answer without Telegram delivery.

## Integration with $notify-me

After successful `--mode full` with delivery, the `$notify-me` skill can be used to verify delivery or send additional artifacts.

## Error handling

- If the pipeline fails, show the error and suggest `./run doctor` for diagnostics
- If input is ambiguous, ask for clarification before proceeding
- If TTS fails, offer `--mode speak` as fallback (script without audio)
