# SDD Flow: Input and Interview

Goal: transform raw requirements into a complete, unambiguous requirements set.

## Step 1: Get Raw Requirements
Ask for the initial requirement dump if not already provided. Encourage messy, unstructured input.

Prompt source:
- `./prompts/interview.yaml` -> `raw_requirements_prompt`

## Step 2: Capture Interview Preferences
Before questioning, ask for interview preferences:
- One question at a time vs batch
- Auto-accept mode: none / up2u (this question) / up2u all (remaining)

Use Russian by default; do not ask for language preference.
Do not mention "format" in the preferences text; the answer format is fixed (1-6 options).
Tool-first: if AskUserQuestionTool or sdd-interview-harness is available, use it for these preferences.
Do not fall back to plain text unless the user explicitly allows it.
If `force_tool` is set and the requested tool is unavailable, stop and ask to proceed without the tool.

Prompt source:
- `./prompts/interview.yaml` -> `interview_preferences_prompt`

## Step 3: Establish Baseline Facts (Ask Only Missing)
Extract baseline facts from raw requirements. Ask only what is missing or conflicting:
- Problem statement
- Target users and roles
- Desired outcomes (top 3)
- Deadline or timeline
- Known constraints (tech, budget, compliance)

## Step 4: Gap-Filling Interview (Minimal)
Ask only critical gaps not already answered. Use a lightweight, single-question format unless the user opted into batches.
If `force_interview: true` is present, run the gap interview even if requirements seem complete.
Each question should include:
- Context line (what we are solving)
- Goal line (why it matters)
- Reason line (why this question)
- Progress indicator (e.g., 3/9)
- Full question + simplified version
- 3 options + "Other" (numeric answers)
- A clearly marked suggested option at the start of the option text
- Option 4: free-form input (Other)
- Option 5: up2u (accept suggested for this question)
- Option 6: up2u all (accept suggested for all remaining questions; include brief rationale without chain-of-thought)
- No tables in interview output; use plain numbered lines only
- Tool-first: if AskUserQuestionTool or sdd-interview-harness is available, use it for each gap question.
- Do not fall back to plain text unless the user explicitly allows it.

Question bank source (pick only what is missing):
- `./prompts/interview.yaml` -> `gap_question_bank`

## Required Data to Proceed
All items below must be present and unambiguous. Critical items require explicit user input; optional items can be auto-filled and confirmed:
- Problem statement
- Goals and success criteria
- Scope and non-goals
- User roles/personas
- Core flows
- Data and integrations
- Non-functional requirements
- Constraints and dependencies
- Risks and mitigations
- Milestones (or "single-phase delivery")

## Interview Output Format
Maintain an "Open Questions" list until empty. Record answers in plain statements.
Assign gap IDs (GAP-001, GAP-002, ...) and track them for `gaps.md`.
Format sources:
- `./prompts/interview.yaml` -> `open_questions_example`
- `./prompts/interview.yaml` -> `gap_tracking_example`

## Completion Gate
Only move to the next phase when all required data is captured and validated.
