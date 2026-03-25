# Gap Interview Protocol

## 🎯 Objective

Conduct systematic interviews to fill ALL gaps in raw requirements, achieving 95%+ confidence on each decision through structured questioning and AI consultation.

---

## 📋 Interview Preparation

### Prerequisites

- [ ] Raw requirements documented in `raw-requirements.md`
- [ ] Project analysis completed in `project-analysis.md`
- [ ] Initial gaps identified (at least 5-10 major gaps)
- [ ] code-review.sh script is executable
- [ ] Kimi and Claude CLIs installed and configured
- [ ] Use Russian for all interview questions and SDD docs; do not ask language preference

### Gap Categories

Always check these categories:

1. **User Input Scope**
   - What input modalities? (text/voice/image/file)
   - Language support: assume Russian unless requirements explicitly say otherwise
   - Any size limits?
   - Required vs optional fields?

2. **Detection & Triggering**
   - Exact keywords/patterns?
   - Case sensitivity?
   - Partial vs full match?
   - Detection scope (all users/allowed only)?

3. **Processing & Execution**
   - CLI or API?
   - Command format?
   - Timeout settings?
   - Retry mechanisms?
   - Dry-run mode?

4. **Response & Delivery**
   - Message templates?
   - Button text/layout?
   - Channel (Telegram/Discord/both)?
   - Result format?

5. **Error Handling**
   - What errors to catch?
   - Retry button needed?
   - Max retry attempts?
   - Error message format?

6. **Configuration**
   - Config file location?
   - Env variable overrides?
   - Default values?
   - Validation needed?

7. **Performance & Scaling**
   - SLA requirements?
   - Rate limits?
   - Concurrency?
   - Resource constraints?

8. **Security & Privacy**
   - Authentication needed?
   - Data retention?
   - Access controls?
   - Audit logging?

---

## 🎬 Interview Process

### Phase 1: Gap Identification (15 minutes)

```
ACTION: Read raw requirements
ACTION: Analyze project patterns
ACTION: Identify unknowns/conflicts

OUTPUT: gaps-draft.md with structured list (no tables):

| Gap ID | Category | Question | Priority | Status |
|--------|----------|----------|----------|--------|
| GAP-01 | Detection | Exact keywords? | HIGH | pending |
| GAP-02 | Execution | CLI path? | HIGH | pending |
| GAP-03 | Delivery | Message template? | MEDIUM | pending |
```

### Phase 2: Question Formulation (10 minutes)

For EACH gap, create a structured question:

```markdown
### GAP-001: Keyword Detection Scope

**Category:** Detection & Triggering
**Priority:** HIGH
**Impact:** Blocks implementation

**Question Template:**
- What is the EXACT question?
- Why does this matter?
- What are the options?
- What is the recommendation based on project patterns?
- What are the trade-offs?

**Context to Provide:**
- Relevant code snippets
- Existing patterns found
- Similar features in project
- User's stated preferences
```

### Phase 3: AI Consultation (per gap, 5-10 minutes)

For each gap question, run:

```bash
./code-review.sh \
  --question "Should detection be case-insensitive?" \
  --context "Telegram bot mentions case-insensitive at src/telegram/bot.ts:42" \
  --project-context "./project-analysis.md" \
  --confidence-threshold 95
```

**Expected Output:**
- Kimi decision + confidence %
- Claude decision + confidence %
- Agreement level
- Average confidence
- Detailed reasoning from both AIs

### Phase 4: User Interview (per gap, 3-5 minutes)

Tool-first: if the harness provides `AskUserQuestionTool` or `sdd-interview-harness`, use it to present each interview question (including preferences) and capture the user's answer.
Do not fall back to plain text unless the user explicitly allows it.
If `force_tool` is set and the tool is unavailable, stop and ask whether to continue without the tool.
Always include options 1-3 (suggestions), 4 (free-form), 5 (up2u for this question), and 6 (up2u all remaining with brief rationale; no chain-of-thought).

If AI consultation reaches ≥95% confidence:

```
ASK USER:

Gap-001: Keyword detection case-sensitivity
═══════════════════════════════════════════

Question: Should deep research keyword detection be case-insensitive?

Context:
- Telegram bot mentions are case-insensitive (src/telegram/bot.ts:42)
- Consistency with existing patterns is important
- No performance impact expected

AI Recommendation (96% confidence):
- Kimi: YES, case-insensitive
- Claude: YES, case-insensitive
- Both agree with high confidence

Recommendation: Use case-insensitive matching

Options:
1) SUGGESTED: Accept case-insensitive matching
2) Use case-sensitive matching
3) Make it configurable (default: case-insensitive)
4) Other (type your own)
5) up2u: accept suggested for this question
6) up2u all: accept suggested for all remaining (brief rationale)

Reply with the number (1-6). If you choose 4, add your custom text.
```

If AI consultation <95% confidence:

```
ASK USER:

Gap-002: Execution timeout duration
═══════════════════════════════════

Question: What should be the maximum execution timeout for deep research?

Context:
- Deep research typically takes 10-15 minutes
- Telegram has 60-second webhook timeout
- Need async processing with status updates

AI Analysis:
- Kimi: 15 minutes (confidence: 89%)
  Reasoning: Matches typical research duration
  Concern: Webhook timeout needs handling
  
- Claude: 20 minutes (confidence: 92%)
  Reasoning: Buffer for edge cases
  Concern: User might wait too long

Trade-offs:
- Shorter (15 min): Faster feedback, might timeout on complex queries
- Longer (20 min): Handles edge cases, longer user wait

Options:
1) SUGGESTED: 20 minutes
2) 15 minutes
3) 25 minutes
4) Other (type your own)
5) up2u: accept suggested for this question
6) up2u all: accept suggested for all remaining (brief rationale)

Reply with the number (1-6). If you choose 4, add your custom text.
```

### Phase 5: Decision Documentation

Document EVERY gap decision in gaps.md:

```markdown
## Interview Results

### GAP-001: Detection Case-Sensitivity

**Question:** Should detection be case-insensitive?

**Decision:** Case-insensitive (substring match)

**Source:** user

**Confidence:** 97% (Kimi: 96%, Claude: 98%)

**Short Reason:** Consistent with Telegram bot mention handling; aligns with existing pattern at src/telegram/bot.ts:42.

**AI Recommendations:**
- Kimi: "Use case-insensitive for consistency" (96%)
- Claude: "Case-insensitive improves UX" (98%)

**User Approval:** Yes (2026-01-02 10:30:00)

**Implementation:** Use `toLowerCase()` before pattern matching
```

---

## 🎯 Question Templates by Category

### Template 1: Boolean Decision

```
Gap-{N}: {Short description}

Question: Should we {do X}?

Context: {Existing patterns, code snippets}

Options:
- 1) SUGGESTED: {preferred yes/no}
- 2) {alternative 1}
- 3) {alternative 2}
- 4) Other (type your own)
- 5) up2u: accept suggested for this question
- 6) up2u all: accept suggested for all remaining (brief rationale)

AI Analysis: {Consult code-review.sh}

Recommendation: {Based on AI + patterns}

User Decision: {Option number or custom text}
```

### Template 2: Options Selection

```
Gap-{N}: {Short description}

Question: Which {option} should we use?

Context: {Requirements, constraints}

Options:
- 1) SUGGESTED: {option A}
- 2) {option B}
- 3) {option C}
- 4) Other (type your own)
- 5) up2u: accept suggested for this question
- 6) up2u all: accept suggested for all remaining (brief rationale)

AI Analysis: {Consult code-review.sh}

Recommendation: {Based on analysis}

User Decision: {Option number or custom text}
```

### Template 3: Value Specification

```
Gap-{N}: {Short description}

Question: What should be the {value/measurement}?

Context: {Requirements, constraints, similar features}

Considerations:
- Minimum viable: {value}
- Industry standard: {value}
- Project pattern: {value from similar feature}

Options:
- 1) SUGGESTED: {recommended value}
- 2) {value option 2}
- 3) {value option 3}
- 4) Other (type your own)
- 5) up2u: accept suggested for this question
- 6) up2u all: accept suggested for all remaining (brief rationale)

AI Analysis: {Consult code-review.sh}

Recommendation: {Specific value + rationale}

User Decision: {Option number or custom text}
```

### Template 4: Process Definition

```
Gap-{N}: {Short description}

Question: How should {process flow} work?

Context: {User journey, technical constraints}

Options:
- 1) SUGGESTED: {flow A}
- 2) {flow B}
- 3) {flow C}
- 4) Other (type your own)
- 5) up2u: accept suggested for this question
- 6) up2u all: accept suggested for all remaining (brief rationale)

AI Analysis: {Consult code-review.sh}

Recommendation: {Specific flow + rationale}

User Decision: {Option number or custom text}
```

---

## 🔍 Confidence Assessment Criteria

### Factors Increasing Confidence

- ✅ Both Kimi and Claude agree
- ✅ AI confidence ≥95%
- ✅ Consistent with existing project patterns
- ✅ User has clear preference
- ✅ Similar feature exists in codebase
- ✅ No major trade-offs or conflicts

### Factors Decreasing Confidence

- ❌ AIs disagree significantly
- ❌ AI confidence <90%
- ❌ No similar patterns in project
- ❌ User is uncertain
- ❌ Major trade-offs present
- ❌ Technical constraints unclear

### Actions by Confidence Level

| Avg Confidence | Action | Rationale |
|----------------|--------|-----------|
| 95-100% | ✅ Proceed | High certainty, low risk |
| 90-94% | 🔄 Ask follow-up | Clarify ambiguous points |
| 85-89% | 🔄 Gather more context | Need project-specific info |
| <85% | ⚠️ Escalate to user | Decision too uncertain |

---

## 🛠️ Using code-review.sh Effectively

### Scenario 1: Simple Boolean Decision

```bash
./code-review.sh \
  --question "Should detection be case-insensitive?" \
  --context "Line 42: telegram mentions case-insensitive" \
  --project-context "./project-analysis.md" \
  --confidence-threshold 95
```

**Expected:** Both AIs agree at 95%+

**If not:** Add more context, ask more specific question

### Scenario 2: Options with Trade-offs

```bash
./code-review.sh \
  --question "Timeout: 15min vs 20min?" \
  --context "Telegram webhook 60s, typical research 10-15min" \
  --project-context "./project-analysis.md" \
  --confidence-threshold 95
```

**Expected:** AIs provide pros/cons, may differ

**Action:** Use analysis to inform user question

### Scenario 3: Technical Architecture

```bash
./code-review.sh \
  --question "Async processing: queue vs direct?" \
  --context "Research takes 10-15 min, need status updates" \
  --project-context "./project-analysis.md" \
  --confidence-threshold 95
```

**Expected:** Detailed architectural recommendations

**Action:** Use recommendation, ask user for approval

### Scenario 4: Edge Case Handling

```bash
./code-review.sh \
  --question "Handle CLI missing: fail fast or fallback?" \
  --context "gdr.sh may not exist at configured path" \
  --project-context "./project-analysis.md" \
  --confidence-threshold 95
```

**Expected:** Error handling patterns

**Action:** Align with existing error handling patterns

---

## 📊 Gap Tracking

### Gap Lifecycle

```
pending → in_interview → ai_consultation → user_interview → filled
```

### Gap Statuses

- ⏳ **pending**: Identified but not yet addressed
- 🔄 **in_interview**: Currently asking questions
- 🤖 **ai_consultation**: Consulting Kimi/Claude
- 👤 **user_interview**: Waiting for user input
- ✅ **filled**: Decision documented
- ❌ **blocked**: Need escalation

### Gap Priorities

- 🔴 **HIGH**: Blocks implementation (keyword detection, execution path)
- 🟡 **MEDIUM**: Important for UX (message templates, button text)
- 🟢 **LOW**: Nice to have (performance optimization, logging level)

**Rule:** Address HIGH first, then MEDIUM, then LOW

---

## 📝 Documentation Standards

### gaps.md Structure

```markdown
# Feature Name - Open Gaps & Questions

> Status: [x/x FILLED] | Last updated: YYYY-MM-DD

## Summary

Total gaps: X
Filled: Y
Remaining: Z

## Interview Results (By Gap)

### GAP-001: [Title]

**Question:** [Exact question]

**Decision:** [Final decision]

**Confidence:** X% (Kimi: X%, Claude: X%)

**Rationale:** [Why this decision]

**AI Analysis:**
- Kimi: [Summary + confidence]
- Claude: [Summary + confidence]

**User Approval:** [Yes/No + timestamp]

**Implementation Notes:** [Technical details]

---

### GAP-002: [Title]

...
```

### raw-requirements.md Structure

```markdown
# Raw Requirements - [Feature Name]

**Source:** [User, ticket #123, Slack thread, etc.]
**Date:** YYYY-MM-DD

## Requirements

- User can [action] via [channel]
- System should [automatic action]
- Results should be [format] (Russian by default)
- Should handle [volume] per [timeframe]

## Open Questions (Will become GAPs)

- How to detect trigger? Exact keywords?
- What CLI to use? Command format?
- Message templates?
- Error handling?
```

### project-analysis.md Structure

```markdown
# Project Analysis - [Feature Name]

## Codebase Structure

```
src/
├── config/config.ts          # Config patterns
├── telegram/bot.ts           # Message handling
├── discord/bot.ts            # Discord patterns
└── skills/                   # Skill system
    └── *.ts
```

## Pattern Findings

### Configuration (src/config/config.ts)

- Zod schemas for validation
- Env variable overrides
- Default values
- Structure: { feature: { enabled: boolean, ... } }

### Message Handling (src/telegram/bot.ts)

- Case-insensitive matching for mentions
- Retry with exponential backoff (429 errors)
- Markdown fallback for errors
- Inline button patterns

### Error Handling

- Try/catch with specific error types
- Retry button for recoverable errors
- Log with context
- User-friendly error messages

## Similar Features

### Telegram Integration

- Detection: routing.allowFrom patterns
- Acknowledgment: "Контекст обновлён" message
- Buttons: InlineKeyboard for confirmation

### Skills System

- SKILL.md manifest files
- Script execution patterns
- Env variable passing
- Result delivery

## Recommendations

- Follow Telegram integration patterns
- Reuse config structure
- Use existing error handling
- Align with skill system for execution
```

---

## 🎯 Interview Completion Criteria

### Must Have

- [ ] All HIGH priority gaps filled
- [ ] All MEDIUM priority gaps filled
- [ ] Every gap has ≥95% confidence OR user explicit decision
- [ ] All AI consultations documented
- [ ] All user decisions documented with timestamps
- [ ] gaps.md shows "ALL FILLED" status
- [ ] Decisions align with project patterns

### Should Have

- [ ] All LOW priority gaps filled
- [ ] Alternative approaches documented
- [ ] Risk assessment for each decision
- [ ] Implementation notes added

### Ready for Next Phase

When ALL "Must Have" items complete, proceed to SDD Generation.

---

## 🔄 Iterative Refinement

### First Pass: Broad Strokes

1. Identify 5-10 major gaps
2. Get high-level decisions
3. Document quickly
4. Achieve 70% confidence

### Second Pass: Details

1. Review each gap
2. Add missing details
3. Consult AIs for confirmation
4. Achieve 95% confidence

### Third Pass: Verification

1. Review all decisions
2. Check consistency
3. Fill any remaining gaps
4. Final approval

**Rule:** Don't aim for perfection in first pass. Iterate.

---

## 📈 Success Metrics

### Quantitative

- Number of gaps identified: 5-15
- Average confidence: ≥95%
- AI consultations: 1-2 per gap
- User interview time: 20-45 minutes
- Documentation coverage: 100%

### Qualitative

- All gaps filled with clear decisions
- Decisions align with project patterns
- No blocking questions remaining
- AI agent can execute without external input
- User comfortable with all decisions

---

## ⚠️ Warning Signs

- ⚠️ More than 20 gaps (feature too complex)
- ⚠️ Average confidence <90% (need more research)
- ⚠️ AIs consistently disagree (ambiguous requirements)
- ⚠️ User unsure about >3 gaps (needs more definition)
- ⚠️ Can't find similar patterns (risky, needs validation)

**Action:** Stop, reassess, possibly break feature into smaller pieces.

---

**Protocol Version:** 1.0
**Last Updated:** 2026-01-02
