# SDD Flow - AI Agent Entry Point

> Read this file and execute the phases below to generate SDD documentation.

## Core Principle

```
┌─────────────────────────────────────────────────────────┐
│  FIGHT COMPLEXITY. MAINTAINABILITY IS THE GOAL.        │
│                                                         │
│  • Fewer cards = less overhead = easier to maintain    │
│  • Simple solutions > clever solutions                 │
│  • Each card must justify its existence                │
│  • If in doubt, simplify                               │
└─────────────────────────────────────────────────────────┘
```

## Mission

Transform raw requirements into production-ready SDD with executable Trello cards.
Planning only: never implement or modify project code. Final output is the SDD package and Trello cards in `<repo>/docs/sdd/<task-name>-sdd`.

## AI-First Start (Default)

Use this flow via START.md, not via scripts. When the user provides raw requirements, begin the interview and run all phases end-to-end.

**User trigger format (example):**
```
Here is raw requirements:
<paste requirements>
force_interview: true
force_tool: AskUserQuestionTool
Start SDD flow by: /home/almaz/zoo_flow/clawdis/.flows/sdd_flow_by_codex/START.md
```

**Agent behavior (must):**
- Start the low-cognitive-burden interview (preferences + critical gaps).
- Tool-first: if the harness provides `AskUserQuestionTool` or `sdd-interview-harness`, use it for interview questions (including preferences).
- Do not fall back to plain text unless the user explicitly allows it.
- If `force_tool` is set and the tool is unavailable, stop and ask whether to proceed without the tool.
- If `force_interview: true` is present, run the gap interview even if requirements seem complete.
- Continue through Context → Gaps → Output without stopping.
- Generate the full SDD package and Trello cards in: `<repo>/docs/sdd/<task-name>-sdd`.
- Do not implement or change project code during this flow.
- Do not require `generate-sdd.sh` unless the user explicitly requests CLI mode.

## Execution Protocol

```
PHASE 1 → PHASE 2 → PHASE 3 → PHASE 4
   │         │         │         │
 INPUT    CONTEXT    GAPS     OUTPUT
```

### Phase 1: Input
**Read:** `FLOW/01_INPUT.md`

1. Get raw requirements from user
2. Ask for interview preferences (pacing, up2u mode). Use Russian by default. Do not mention "format".
3. Validate required information exists (ask only missing criticals)
4. Document in `raw-requirements.md`

### Phase 2: Context
**Read:** `FLOW/02_CONTEXT.md`

1. Analyze project structure (README, src/, docs/)
   - Start with `.qoder/repowiki/en/content` if present (may be outdated; verify against repo)
2. Identify existing patterns and conventions
3. Document in `project-context.md`

### Phase 3: Gaps
**Read:** `FLOW/03_GAPS.md`

1. Identify unknowns and ambiguities
2. Ask user only critical gap questions
3. Auto-fill optional gaps when confidence is high; mark as assumptions
4. Document decisions in `gaps.md`
5. **DO NOT PROCEED until all gaps filled**

### Phase 4: Output
**Read:** `FLOW/04_OUTPUT.md`

Generate SDD package (task name slug):
```
<task-name>-sdd/
├── README.md
├── requirements.md
├── ui-flow.md
├── gaps.md
├── manual-e2e-test.md
└── trello-cards/
    ├── KICKOFF.md
    ├── BOARD.md
    ├── state.json
    ├── progress.md
    └── 01-*.md ... NN-*.md
```

**Output location defaults:**
- `--output` wins if provided
- else `SDD_OUTPUT_ROOT/<task-name>-sdd` if set
- else `<repo>/docs/sdd/<task-name>-sdd` if requirements file is in a git repo
- else current directory (blocked if running inside the flow folder)

## Complexity Assessment (Agent Decides)

**You (the agent) determine complexity and card count.** Do not ask user.

### Assessment Formula

Count these factors from requirements:

| Factor | Points |
|--------|--------|
| New database table | +2 each |
| New API endpoint | +1 each |
| External integration | +4 each |
| New UI component | +2 each |
| Real-time features | +3 |
| Uses existing patterns only | -3 |
| Config-only change | -4 |
| Single file change | -3 |

### Score → Cards

| Score | Cards | SP Total |
|-------|-------|----------|
| < 5 | 1-4 | 4-10 |
| 5-10 | 5-8 | 10-20 |
| 11-20 | 9-14 | 20-35 |
| 21-30 | 15-22 | 35-50 |
| > 30 | Split into phases |

### Card Rules

- **Max 4 SP per card** (if bigger, split it)
- **Prefer fewer cards** with clear scope
- **Each card must be independently testable**
- **Fight the urge to over-engineer**
- **Template lock (mandatory):** every numbered card must use `TRELLO_TEMPLATES/card-XX-template.md` without section removal
- **Task orchestration markers (mandatory):** each `TASK-*` in To-Do must include `Execution Mode: PARALLEL|SEQUENTIAL` and `Parallel Blockers`

## Templates

| Type | Location |
|------|----------|
| SDD docs | `TEMPLATES/*.template.md` |
| Trello cards | `TRELLO_TEMPLATES/*.template.md` |

## Rules

1. **Stop only** for gap-filling questions
2. **No placeholders** in final outputs
3. **No hidden assumptions** - optional defaults allowed only if documented and confirmed
4. **Agent decides** card count (not user)
5. **Max 4 SP** per card
6. **Fight complexity** - simpler is better
7. **Interview format**: no tables; use numbered options only
8. **No implementation**: do not modify project code; produce only SDD docs + Trello cards
9. **Guardian Gate**: never start implementation without explicit user approval (see `FLOW/04_OUTPUT.md`)

## Start Now

1. Ask user for raw requirements
2. Ask for interview preferences (pace, up2u mode). Use Russian by default.
3. Read `FLOW/01_INPUT.md`
4. Execute phases in order
5. Assess complexity yourself in Phase 4
6. **Pass Phase 5: Confidence Gate before marking complete**

---

## Phase 5: Confidence Gate (MANDATORY)

**When you feel SDD is complete, STOP and ask:**

> *"What is my confidence level comparing Trello cards to raw requirements following instruction flow?"*

### Self-Assessment Checklist

| # | Question | Target |
|---|----------|--------|
| 1 | All 12 requirements addressed? | 100% |
| 2 | Trello cards map 1:1 to requirements? | Yes |
| 3 | No unapproved critical assumptions? | Yes |
| 4 | Implementation details clear (code snippets, formats)? | Yes |
| 5 | Logging format defined (exact messages)? | Yes |
| 6 | Error handling covered (all cases)? | Yes |
| 7 | Testing strategy defined (unit, integration, E2E)? | Yes |
| 8 | All acceptance criteria present per card? | Yes |
| 9 | Russian/text localization covered? | If required |
| 10 | All configuration from .env (no hardcoded)? | Yes |

### Confidence Formula

```
Confidence = (Requirements Covered / Total Requirements) × 100%
Min Target: 95%
```

### If Confidence < 95%

1. **Create todo list** of missing items
2. **Implement fixes** (minimal changes only, respect existing structure)
3. **Re-run self-assessment**
4. **Repeat** until 95%+

### Validation Tools

```bash
# Run confidence validation
./validate-sdd.sh <sdd-folder>

# Check requirements coverage
./validate-requirements.sh <sdd-folder>
```

### Gate Rule

> **DO NOT mark SDD as "READY FOR IMPLEMENTATION" until confidence ≥ 95%**

Quality Gate 3 (`validate-sdd.sh`) will validate requirements coverage. If coverage < 95%, it will fail.
