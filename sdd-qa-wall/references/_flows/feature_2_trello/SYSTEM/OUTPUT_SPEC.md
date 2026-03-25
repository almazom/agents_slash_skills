# SDD Output Specification

## 🎯 Purpose

Define exact structure, content, and quality standards for all SDD-generated files to ensure consistency and executability.
Planning only: do not implement or modify project code as part of this flow.

---

## 📁 Output Structure

```
sdd/[feature-name]/
├── README.md                      # Entry point - MUST READ FIRST
├── requirements.md                # Functional requirements - COMPREHENSIVE
├── ui-flow.md                     # User journey - VISUAL + SPECIFIC
├── keyword-detection.md           # If applicable - EXACT PATTERNS
├── gaps.md                        # Gap analysis - ALL FILLED
├── manual-e2e-test.md             # Test checklist - STEP-BY-STEP
└── trello-cards/
    ├── BOARD.md                   # Pipeline visualization
    ├── KICKOFF.md                 # AI agent kickoff - SELF-CONTAINED
    ├── AGENT_PROTOCOL.md          # State management
    ├── 01-[feature]-xxx.md        # Card 01 - EXACT INSTRUCTIONS
    ├── 02-[feature]-xxx.md        # Card 02 - CODE SNIPPETS
    ├── ... (variable number)      # Max 4 SP each
    └── NN-[feature]-e2e-test.md   # Final verification (last card)
```

---

## 📄 File Specifications

### 1. README.md

**Purpose:** Entry point with pipeline overview and quick reference

**Status Badge:** `✅ READY FOR IMPLEMENTATION` or `🚧 IN PROGRESS`

**Required Sections:**

```markdown
# [Feature Name] - SDD Requirements

> Status: ✅ READY FOR IMPLEMENTATION | All gaps filled

## Overview

One paragraph describing what this feature does.

## Documents

| File | Description | Status |
|------|-------------|--------|
| [requirements.md](./requirements.md) | Functional requirements | ✅ COMPLETE |
| [ui-flow.md](./ui-flow.md) | User interaction flow | ✅ COMPLETE |
| [keyword-detection.md](./keyword-detection.md) | If applicable | ✅ COMPLETE |
| [gaps.md](./gaps.md) | Open questions & gaps | ✅ ALL FILLED |

## Pipeline Summary

```
User Input → Detection → Acknowledgment → Confirmation → Execute → Delivery
     ↓           ↓            ↓              ↓            ↓          ↓
  [Channel] [Patterns] [Message] [Button] [CLI/API] [Format]
```

## Quick Reference

| Aspect | Decision |
|--------|----------|
| **Input Channel** | Telegram only / Discord / Web |
| **Detection** | Keywords / Patterns / Commands |
| **Required Fields** | Topic / Scope / Language |
| **Execution** | CLI command format |
| **Delivery** | Message template |
| **Config** | Config file section |

## Development Notes

- [ ] Any special notes for implementer
- [ ] Follow existing patterns from [similar feature]
- [ ] Run with DRY_RUN=true during development

## Implementation

See [trello-cards/BOARD.md](./trello-cards/BOARD.md) for:
- N executable cards (X SP total)
- Linear execution order
- Machine-friendly instructions
- Max 4 SP per card
```

**Quality Standards:**
- ✅ Pipeline diagram uses ASCII or Mermaid
- ✅ Quick reference has 6-10 key decisions
- ✅ Links to all documentation files
- ✅ Mentions similar features for pattern reference
- ✅ Includes development tips

---

### 2. requirements.md

**Purpose:** Comprehensive functional and non-functional requirements

**Structure:**

```markdown
# [Feature Name] - Functional Requirements

> Status: [IN PROGRESS|COMPLETE] | Last updated: YYYY-MM-DD

## 1. [Requirement Area 1]

### 1.1 [Specific Requirement]

- System MUST do X
- System SHOULD do Y
- System MAY do Z

> **GAP-001**: [Question about this requirement]

### 1.2 [Another Requirement]

...

---

## 2. [Requirement Area 2]

...

---

## 3. Non-Functional Requirements

### 3.1 Performance

- Detection SLA: <100ms
- Execution timeout: 15 minutes
- Memory usage: <1GB

### 3.2 Error Handling

- Retry with exponential backoff
- Max 3 retry attempts
- User-friendly error messages

### 3.3 Logging

- Log level: info for user actions, debug for details
- Include run_id in all logs
- Log to: ~/.clawdis/logs/

---

## 4. Configuration

### 4.1 Config File Section

```json5
{
  featureName: {
    enabled: true,
    dryRun: false,
    setting: "value",
  }
}
```

### 4.2 Environment Variables

| Env Variable | Config Path | Default |
|--------------|-------------|---------|
| `FEATURE_ENABLED` | `featureName.enabled` | `true` |

---

## References

- Related to: [Other features]
- Files: [Key implementation files]
```

**Quality Standards:**
- ✅ Use MUST/SHOULD/MAY (RFC 2119)
- ✅ Every gap referenced as **GAP-NNN**
- ✅ Code examples in triple backticks
- ✅ Tables for structured data
- ✅ Cross-references to similar features
- ✅ 150-300 lines total
- ✅ 5-8 major requirement sections

---

### 3. ui-flow.md

**Purpose:** Visual representation of user interaction + message templates

**Structure:**

```markdown
# [Feature] - UI Flow

> Status: DRAFT | Last updated: YYYY-MM-DD

## User Journey

```
┌─────────────────────────────────────┐
│           USER INPUT                │
│  "Do action with parameters"        │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│         SYSTEM DETECTION            │
│  Pattern match against keywords     │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│      ACKNOWLEDGMENT MESSAGE         │
│  ┌───────────────────────────────┐  │
│  │ ✅ Detected request            │  │
│  │ Params: extracted values       │  │
│  └───────────────────────────────┘  │
└───────────────┬─────────────────────┘
                │
                ▼
[Continue flow...]
```

## Message Templates

### Acknowledgment Message

```
✅ Request detected

Parameters:
- Param1: value1
- Param2: value2

Analyzing...
```

### Confirmation Message

```
✅ All requirements filled

Final prompt:
──────────────────────
{formatted_prompt}

[🚀 Execute Action] ← inline button
```

### Result Delivery Message

```
✅ Action completed

Result:
{formatted_result}

[🔗 View Details] {url}
```

## Open Questions

- [ ] **GAP-UI-001**: Button styling
- [ ] **GAP-UI-002**: Progress indicator needed?
```

**Quality Standards:**
- ✅ ASCII art or Mermaid diagram showing full flow
- ✅ Shows ALL states (input → detection → ack → process → result)
- ✅ Exact message templates (copy-paste ready)
- ✅ Button text and layout specified
- ✅ Edge cases shown (errors, timeouts)
- ✅ 100-200 lines

---

### 4. keyword-detection.md (if applicable)

**Purpose:** Exact patterns and matching rules

**Structure:**

```markdown
# [Feature] - Keyword Detection Spec

> Status: DRAFT | Last updated: YYYY-MM-DD

## Purpose

Define exact patterns that trigger this feature.

## Detection Strategy

**Approach:** Hardcoded patterns / Regex / ML model

## Patterns (FINAL LIST)

**Total: N patterns** - Case-[in]sensitive [substring/exact] match

### Group 1: Russian

| # | Pattern | Example |
|---|---------|---------|
| 1 | `pattern` | "Example message" |
| 2 | `pattern` | "Example message" |

### Group 2: English

...

## Matching Rules (CONFIRMED)

- [x] Case-insensitive: `toLowerCase()` before matching
- [x] Substring match: pattern anywhere in message
- [x] Word boundaries: \b or no boundaries

## Implementation Code

```typescript
// File: src/feature/detect.ts

const PATTERNS = [
  'pattern1',
  'pattern2',
];

export function detect(message: string): boolean {
  const normalized = message.toLowerCase();
  return PATTERNS.some(p => normalized.includes(p));
}
```

## Edge Cases

| Input | Expected | Reason |
|-------|----------|--------|
| "PATTERN" | ✓ match | case insensitive |
| "prefixpattern" | ✓ match | substring match |
| "patternxyz" | ✗ no match | not in list |

## Performance

- Detection SLA: <100ms
- Runs on every message
- No regex/ML in v1
```

**Quality Standards:**
- ✅ Complete list of ALL patterns (no "etc.")
- ✅ Grouped by language/category
- ✅ Code snippet ready to copy-paste
- ✅ Edge cases table (5-10 scenarios)
- ✅ Performance specifications
- ✅ 80-150 lines

---

### 5. gaps.md

**Purpose:** Document ALL gaps and interview results

**Structure:**

```markdown
# [Feature] - Open Gaps & Questions

> Status: ✅ ALL FILLED | Last updated: YYYY-MM-DD

## Summary

Total gaps: X
Filled: X
Remaining: 0

## Interview Results

### GAP-001: Detection Case-Sensitivity

**Question:** Should detection be case-insensitive?

**Decision:** Case-insensitive (substring match)

**Source:** user

**Confidence:** 97% (Kimi: 96%, Claude: 98%)

**Short Reason:** Consistent with Telegram pattern; better UX; no performance impact.

**AI Recommendations:**
- Kimi: "Use case-insensitive" (96%)
- Claude: "Case-insensitive" (98%)

**User Approval:** Yes (2026-01-02 10:30:00)

**Implementation:** Use `toLowerCase()` before matching

---

### GAP-002: Execution Timeout

**Question:** Maximum execution timeout?

**Decision:** 15 minutes

**Source:** user

**Confidence:** 92% (insufficient, asked follow-up)

**Short Reason:** Typical research duration is 10-15 min; Telegram needs async status updates.

**Follow-up:** Implement webhook-based status updates

**User Decision:** 15 min with webhook updates (2026-01-02 10:35:00)

---

## Decisions Based on Project Analysis

Analyzed patterns from:
- File A: lines X-Y
- File B: lines X-Y

Key pattern alignments:
1. **Pattern name:** Description
2. **Pattern name:** Description
```

**Quality Standards:**
- ✅ Status shows "✅ ALL FILLED"
- ✅ EVERY gap has:
  - Question
  - Decision
  - Confidence % (Kimi, Claude, average)
  - Rationale
  - AI recommendations
  - User approval + timestamp
- ✅ Confidence ≥95% for all decisions
- ✅ References to project analysis
- ✅ 50-100 lines

---

### 6. manual-e2e-test.md

**Purpose:** Step-by-step manual test checklist

**Structure:**

```markdown
# Manual E2E Test Checklist

**Prerequisites:**
- [ ] Gateway running: `pnpm dev`
- [ ] Config set: `FEATURE_ENABLED=true`
- [ ] Test channel available

**Test Environment:**
- Dry-run mode: ENABLED
- Test data: Available

## Test Cases

### Test 1: Basic Flow

Steps:
1. [ ] Send: "Trigger message with params"
2. [ ] Verify: Acknowledgment received
3. [ ] Verify: "Param: value" shown
4. [ ] Click: Execute button
5. [ ] Verify: "Processing..." message
6. [ ] Wait: 30-60 seconds
7. [ ] Verify: Result message received
8. [ ] Verify: Result contains X, Y, Z
9. [ ] Verify: Link clickable

Expected result: ✅ Full flow successful

### Test 2: Error Handling

Steps:
1. [ ] Send: "Invalid trigger"
2. [ ] Verify: Error message received
3. [ ] Verify: Retry button visible
4. [ ] Click: Retry button
5. [ ] Verify: Flow restarts

Expected result: ✅ Error handling works

## Regression Tests

- [ ] Existing feature A still works
- [ ] Existing feature B still works
```

**Quality Standards:**
- ✅ Prerequisites checklist (5-10 items)
- ✅ Step-by-step instructions (click-by-click)
- ✅ Expected results for each test
- ✅ Error scenario tests
- ✅ Regression tests
- ✅ 30-60 lines

---

## 🎯 Trello Cards Specifications

### trello-cards/BOARD.md

**Purpose:** Pipeline visualization and card index

**Structure:**

```markdown
# [Feature] - Trello Board

> Scrum Master: AI Agent | Sprint: Linear
> Story Point Cap: 4 SP/card | Principle: KISS

## Execution Order

```
┌─────────────────────────────────────────┐
│        EXECUTION PIPELINE               │
├─────────────────────────────────────────┤
│                                         │
│  SPRINT 1: Foundation                   │
│  ┌─────┐   ┌─────┐   ┌─────┐          │
│  │ 01  │ → │ 02  │ → │ 03  │          │
│  │ XSP │   │ XSP │   │ XSP │          │
│  └─────┘   └─────┘   └─────┘          │
│  Card 1    Card 2    Card 3           │
│                                         │
│  SPRINT 2: Integration                  │
│  ┌─────┐   ┌─────┐   ┌─────┐          │
│  │ 04  │ → │ 05  │ → │ 06  │          │
│  │ XSP │   │ XSP │   │ XSP │          │
│  └─────┘   └─────┘   └─────┘          │
│  Card 4    Card 5    Card 6           │
│                                         │
└─────────────────────────────────────────┘
```

## Card Index

| Card | Title | SP | Depends On | Status |
|------|-------|----|-----------:|--------|
| [01](./01-name.md) | Config schema | 2 | - | TODO |
| [02](./02-name.md) | Detection module | 3 | 01 | TODO |
| ... | ... | ... | ... | ... |

## Sprint Summary

- **Sprint 1:** Foundation (X SP)
- **Sprint 2:** Integration (X SP)
- **Total:** X SP
```

**Quality Standards:**
- ✅ Visual pipeline diagram
- ✅ Card index table (with links)
- ✅ Dependencies correctly listed
- ✅ SP totals by sprint
- ✅ 50-80 lines

---

### trello-cards/KICKOFF.md

**Purpose:** AI agent self-contained kickoff instructions

**Structure:**

```markdown
# [Feature] Implementation - AI Agent Kickoff

```
╔════════════════════════════════════════════════════════╗
║  🤖 AI AGENT INSTRUCTION                               ║
║                                                        ║
║  Execute ALL N cards below in LINEAR order.           ║
║  Update state.json after EACH card.                   ║
║  Do NOT stop until all cards are "completed".         ║
║                                                        ║
║  START NOW. First action: Read state.json.            ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

## Mission

Implement [Feature] by executing N Trello cards.
Track progress in `state.json`.

## Protocol

```
┌─────────────────────────────────────────┐
│  AGENT EXECUTION LOOP                   │
├─────────────────────────────────────────┤
│                                         │
│  1. READ state.json → Find current card │
│  2. UPDATE state.json → Set "in_progress"│
│  3. READ card file → Execute all steps  │
│  4. VERIFY → Check acceptance criteria  │
│  5. UPDATE state.json → Set "completed" │
│  6. LOOP → Go to step 1 until done      │
│                                         │
│  ON ERROR: Stop, log, get help          │
│  ON COMPLETE: Celebrate! 🎉             │
│                                         │
└─────────────────────────────────────────┘
```

## Files

| File | Purpose | Agent Action |
|------|---------|--------------|
| BOARD.md | Card overview | Read once |
| state.json | Progress tracking | Read+write each card |
| 01-*.md | First card | Execute |
| ... | ... | ... |
| N-*.md | Last card | Execute |

## Getting Started

```bash
cd trello-cards
ls -la
```

First action: Read BOARD.md to understand execution order.

## Completion Criteria

- [ ] All cards in state.json show "completed"
- [ ] No errors in execution log
- [ ] Manual E2E test passes
- [ ] Ready for production DRY_RUN=false
```

**Quality Standards:**
- ✅ ASCII art banner for AI visibility
- ✅ Clear step-by-step protocol
- ✅ File manifest table
- ✅ Getting started commands
- ✅ Completion checklist
- ✅ No external links (self-contained)
- ✅ 80-120 lines

---

### Individual Card Template (01-XX-*.md, 02-XX-*.md, etc.)

**Purpose:** Executable work unit with all context

**Structure:**

```markdown
# Card NN: [Feature] - Card Title

| Field | Value |
|-------|-------|
| **ID** | [PROJ-NN] |
| **Story Points** | [1-4] |
| **Depends On** | Card M (or None) |
| **Sprint** | [N] - [Name] |

## User Story

> As a [role], I want [action] so that [benefit].

## Context

Read before starting:
- [requirements.md#section](../requirements.md) - Specific requirement
- [ui-flow.md#section](../ui-flow.md) - UI context
- [Existing pattern](./path/to/similar/feature)

## Instructions

### Step 1: [Action]

```bash
# Exact commands to run
cat src/config/config.ts | head -50
```

### Step 2: Modify File

```bash
# Edit file: src/config/config.ts
```

```typescript
// Add after line 42:
const featureSchema = z.object({
  enabled: z.boolean().default(true),
});

// In ClawdisConfigSchema, add:
feature: featureSchema,
```

### Step 3: Verification

```bash
# Verify changes
grep -A 5 "feature:" src/config/config.ts
```

## Acceptance Criteria

- [ ] Config schema added
- [ ] Type checking passes: `pnpm type-check`
- [ ] No lint errors: `pnpm lint`

## Next

After completing:
1. Update state.json: set card NN to "completed"
2. Read next card: [Card NN+1](./NN+1-name.md)
```

**Quality Standards:**
- ✅ ID, SP, Dependencies, Sprint in table
- ✅ Clear user story (who/what/why)
- ✅ Context links to specific sections
- ✅ Step-by-step instructions
- ✅ Exact file paths (verified)
- ✅ Code snippets (copy-paste ready)
- ✅ Verifications commands
- ✅ Acceptance criteria (testable)
- ✅ 40-80 lines per card
- ✅ Max 4 SP per card

---

## 🎯 Content Quality Rules

### 1. Completeness

**Every spec decision must be documented**

❌ Bad: "Use appropriate timeout"
✅ Good: "Timeout: 15 minutes (based on typical execution time of 10-15 min)"

### 2. Specificity

**Use exact values, not approximations**

❌ Bad: "Many keyword patterns"
✅ Good: "20 keyword patterns (8 Russian, 5 English, 7 mixed)"

### 3. Verifiability

**Include acceptance criteria that can be tested**

❌ Bad: "Works correctly"
✅ Good: "Returns true for 'trigger keyword' and false for 'invalid'"

### 4. Consistency

**Follow existing project patterns**

❌ Bad: "Invent new config structure"
✅ Good: "Follows z.object pattern from src/config/config.ts:42"

### 5. Executability

**Provide commands and code that work**

❌ Bad: "Update config file"
✅ Good: "```bash\nsed -i '42a\\n  feature: featureSchema,' src/config/config.ts\n```"

---

## 📊 Quality Metrics

### Document Size

| File | Target Size | Min | Max |
|------|-------------|-----:|-----:|
| README.md | 50-80 lines | 40 | 100 |
| requirements.md | 150-300 | 100 | 400 |
| ui-flow.md | 100-200 | 80 | 250 |
| keyword-detection.md | 80-150 | 60 | 200 |
| gaps.md | 50-100 | 30 | 150 |
| manual-e2e-test.md | 30-60 | 20 | 80 |
| BOARD.md | 50-80 | 40 | 100 |
| KICKOFF.md | 80-120 | 60 | 150 |
| Individual cards | 40-80 | 30 | 100 |

**Total SDD:** 800-1500 lines across all files

### Confidence Requirements

- ❌ <90%: Not acceptable, need more analysis
- ⚠️ 90-94%: Acceptable with risk documentation
- ✅ 95-100%: Target confidence level

**Rule:** All gap decisions must have ≥95% confidence

### Card Requirements

- Number of cards: 8-20 (based on complexity)
- SP per card: 1-4 (max: 4)
- Total SP: 20-40 (typical: 30)
- Dependencies: Linear (01→02→03...)

---

## ✅ Verification Checklist

### Before Marking "READY FOR IMPLEMENTATION"

- [ ] All gaps filled with ≥95% confidence
- [ ] All 6 main documents created
- [ ] trello-cards/ folder with 10-15 cards
- [ ] BOARD.md has pipeline diagram
- [ ] KICKOFF.md is self-contained
- [ ] Each card has ID, SP, dependencies
- [ ] Each card has exact file paths
- [ ] Each card has copy-paste code
- [ ] README.md shows pipeline
- [ ] All documents cross-reference each other
- [ ] Gaps.md has user approval timestamps
- [ ] Requirements.md has MUST/SHOULD/MAY
- [ ] UI flow has ALL message templates
- [ ] Manual test has step-by-step instructions

---

## 🎓 Example Reference

**Gold Standard:** `docs/sdd/deep-research/ (example reference)`

All new SDDs should match this:
- Structure
- Detail level
- Confidence standards
- Card executability
- Documentation quality

---

**Specification Version:** 1.0
**Last Updated:** 2026-01-02
