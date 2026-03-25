# SDD Flow

> Transform raw requirements into production-ready specifications with executable Trello cards.

## Quick Start

```bash
# Generate SDD from requirements
./generate-sdd.sh --requirements <file.md>

# Preview without creating files
./generate-sdd.sh --requirements <file.md> --dry-run

# With validation
./generate-sdd.sh --requirements <file.md> --validate
```

## Flow Overview

```
INPUT → CONTEXT → GAPS → OUTPUT
  │        │        │       │
  v        v        v       v
 raw    project   filled   SDD +
 reqs   patterns  gaps    Cards
```

## Phases

| Phase | Description | Details |
|-------|-------------|---------|
| 1 | Input | Collect raw requirements |
| 2 | Context | Analyze project patterns |
| 3 | Gaps | Fill gaps via interview |
| 4 | Output | Generate SDD + cards |

See `FLOW/` for detailed phase documentation.

## Interview UX (Low Cognitive Burden)

- Ask interview preferences once (pacing, up2u mode); use Russian by default
- Ask only critical gaps that are missing or conflicting
- One question at a time by default; optional batch mode
- Each question includes context, goal, why, and progress
- Provide 3 options + "Other"; mark a suggested option at the start
- Offer up2u for this question and up2u all for remaining gaps
- Auto-fill optional gaps only at 95%+ confidence; confirm in one summary step

## Context Gathering Hint

Start project context gathering from `.qoder/repowiki/en/content` if present (may be outdated; verify with repo files).

## Force Interview Flag

If raw requirements include `force_interview: true`, run the gap interview even if requirements look complete.

## Force Tool Flag

If raw requirements include `force_tool: AskUserQuestionTool` or `force_tool: sdd-interview-harness`, use that tool for interview questions. If it is unavailable, stop and ask whether to continue without the tool.

## Tool-First Rule

If the tool is available, always use it for interview questions. Do not fall back to plain text unless the user explicitly allows it.

## Structure

```
sdd_flow/
├── README.md              # This file
├── 00_START_HERE.md       # Entry point
├── FLOW/                  # Phase documentation
│   ├── 01_INPUT.md
│   ├── 02_CONTEXT.md
│   ├── 03_GAPS.md
│   └── 04_OUTPUT.md
├── TEMPLATES/             # SDD document templates
├── TRELLO_TEMPLATES/      # Card templates
├── SYSTEM/                # System documentation
├── prompts/               # Interview prompts
├── examples/              # Sample requirements
└── scripts (*.sh)         # Automation
```

## Output

Generated SDD package (task name slug):

```
<task-name>-sdd/
├── README.md              # Entry point
├── requirements.md        # Functional requirements
├── ui-flow.md            # User journey
├── gaps.md               # Decisions
├── domain-spec.md        # Optional domain spec
├── manual-e2e-test.md    # Test checklist
└── trello-cards/
    ├── KICKOFF.md        # Agent entry point
    ├── BOARD.md          # Card index
    ├── state.json        # Progress tracking
    ├── progress.md       # Visual progress
    └── 01-*.md ... NN-*.md  # Executable cards
```

## Output Location Defaults

- If `--output` is provided, it is always used.
- Else, if `SDD_OUTPUT_ROOT` is set, output goes to `$SDD_OUTPUT_ROOT/<task-name>-sdd`.
- Else, if the requirements file is inside a git repo, output defaults to `<repo>/docs/sdd/<task-name>-sdd`.
- Else, output defaults to the current directory.

## Scope (Planning Only)

- Do not implement or modify project code during this flow.
- Final deliverable is the SDD package and Trello cards inside `docs/sdd/<task-name>-sdd`.
- **Guardian Gate:** implementation is forbidden until the user explicitly approves the SDD and requests code changes.

## Card Count

**Agent decides automatically.** Fight complexity - fewer cards is better.

| Score | Cards | Approach |
|-------|-------|----------|
| < 5 | 1-4 | Minimal, focused |
| 5-10 | 5-8 | Standard |
| 11-20 | 9-14 | Detailed |
| > 20 | Split into phases |

See `CARD_COUNT_GUIDELINES.md` for scoring formula.

## Scripts

| Script | Purpose |
|--------|---------|
| `generate-sdd.sh` | Main SDD generator |
| `validate-sdd.sh` | Quality validation |
| `validate-requirements.sh` | Input validation |
| `code-review.sh` | AI consultation (optional) |
| `gap-interview-tui.sh` | Interactive gap filling |

## Principles

1. **No placeholders** in final outputs
2. **No hidden assumptions** - auto-fill optional items only if documented and confirmed
3. **KISS** - max 4 SP per card
4. **Linear execution** - cards run in order
5. **Self-contained** - each card has full context

## For AI Agents

**Entry point:** `START.md`

```
Read START.md and follow the execution protocol.
```

Or execute generated SDD:
```
Read <feature>-sdd/trello-cards/KICKOFF.md
```
