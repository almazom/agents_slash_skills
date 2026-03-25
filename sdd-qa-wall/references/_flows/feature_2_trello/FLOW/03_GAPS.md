# SDD Flow: Requirements Normalization and Gap Closure

Goal: transform interview output and context notes into a consistent, complete requirements set.

## Build the Requirements Matrix
Normalize all inputs into these buckets:
- Goals and success criteria
- Scope and non-goals
- Users and roles
- Core flows and edge cases
- Data model and integrations
- Non-functional requirements
- Constraints and dependencies
- Risks and mitigations
- Milestones and sequencing

## Critical vs Optional Gaps
Ask the user only for critical gaps. Auto-fill optional gaps only at 95%+ confidence.

### Critical (must ask if missing)
- Problem statement and goals
- Scope and non-goals
- Users/roles and access levels
- Core flows (entry -> success)
- Data model changes and retention
- Integrations/auth requirements
- Non-functional priority (reliability, security, latency)
- Constraints and dependencies that block delivery

### Optional (can auto-fill at 95%+ confidence)
- Timeline (default: no deadline)
- Logging format (use existing project patterns)
- Test levels (follow existing test strategy)
- Config naming (follow existing env conventions)
- Default error handling patterns (reuse existing utilities)
- Risks/mitigations (use standard project risk patterns)
- Milestones (assume single-phase delivery)

## Interview UX (when asking)
One question at a time unless the user opted for batches. Each question should include:
- Context line
- Goal line
- Why this question
- Progress indicator
- Full question + simplified version
- 3 options + "Other" (numeric answers)
- Suggested option clearly marked at the start of the option text
- Option 4: free-form input (Other)
- Option 5: up2u (accept suggested for this question)
- Option 6: up2u all (accept suggested for all remaining; include brief rationale, no chain-of-thought)

## Conflict Resolution
If any statements conflict:
- Highlight the conflict clearly
- Ask the user for a decision
- Do not infer or guess for critical behavior

## Assumptions Policy
- Mark assumptions explicitly in gaps.md
- Critical assumptions must be confirmed before output generation
- Optional assumptions can be auto-filled only at 95%+ confidence and the user confirms in a single summary step

## Auto-Fill Confirmation Step
Before output generation, present a short summary of auto-filled items and ask for a single approval or edits.
If the user edits any item, treat it as a new gap and confirm again.

## Completion Gate
Proceed only when:
- No open questions remain
- No unresolved conflicts remain
- All required buckets are filled

## Gaps Status
Update `gaps.md` to mark every gap as filled and include the final answers.
Record the answer source (user / auto / up2u all) and a short reason for the decision.
Set the document status to "ALL GAPS FILLED" once complete.

## Output Artifact
A finalized requirements brief that will populate the output docs.
