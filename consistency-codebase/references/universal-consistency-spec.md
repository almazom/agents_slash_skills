# Universal Consistency Spec

## Purpose

This file defines universal writing, structure, and maintainability rules for agent task and reference markdown files.

Its goal is to make these files portable across repositories, easy to review, and consistent in tone, terminology, structure, precedence handling, and output contracts.

This file defines editorial rules only. Repository-specific behavior, workflow policy, implementation constraints, and coding preferences belong in project-local files such as `AGENTS.md`, `PROFILE.md`, and `AURA.md`.

## Scope

These rules apply to:

- agent task specifications
- reference workflows
- review instructions
- reusable prompt-library markdown files

These rules do not replace project policy. They standardize how policy is expressed.

## Universality Principles

### 1. Keep core rules separate from project rules

- Put universal writing, formatting, structure, precedence, and output-contract rules in this file or another universal consistency document.
- Put repository-specific constraints, implementation preferences, coding standards, and workflow exceptions in project-local instruction files.
- Do not hardcode repository-specific tools, file names, or team habits into a universal consistency file unless they are explicitly marked as optional examples.

### 2. Use a strict, repeatable document skeleton

Every task or reference markdown file should use the same high-level section order unless the document type has a clear reason to omit a section.

Recommended section order:

1. Purpose
2. Inputs
3. Pre-checks or Preconditions
4. Required steps
5. Validation or Filtering rules
6. Output format
7. Exceptions or Fallback behavior
8. Notes

### 3. Define precedence and fallback behavior explicitly

When multiple instruction sources exist, the document should state which rules win.

Default precedence:

1. The most specific directory-local instruction file
2. The repository-root instruction file
3. This universal consistency file
4. Generic defaults in the task file itself

If instructions conflict:

- State the conflict briefly.
- Follow the most specific applicable instruction.
- If scope is unclear, prefer the rule attached to the files or directories being modified.

If an expected instruction file does not exist:

- Continue with the remaining applicable files.
- Fall back to this universal consistency file.
- Do not fail solely because an optional instruction file is absent.

### 4. Treat maintainability as a writing requirement

Each file should be easy to update without reinterpreting its intent.

Maintainability checks:

- avoid duplicated rules that can drift apart
- keep one decision or action per instruction when practical
- define ambiguous terms before reusing them
- keep thresholds, precedence rules, and output contracts in stable dedicated sections
- isolate examples from normative instructions

## Project Instruction Files

Task and reference files should defer project-specific behavior to project-local instruction files when they exist.

Supported filenames:

- `AGENTS.md`
- `PROFILE.md`
- `AURA.md`
- `HIGH_LEVEL_EXPECTATIONS.md`

When a task or reference file depends on project-local policy:

- use exact filenames
- state the precedence relationship clearly
- avoid copying large project-specific policy into a universal file
- if the repository uses `docs/**/HIGH_LEVEL_EXPECTATIONS.md`, treat the nearest relevant file as a product-expectation overlay rather than as a replacement for root instruction files

## Terminology

Use one canonical term for each concept throughout a file.

Required terminology rules:

- Use `subagent` consistently. Do not alternate between `agent`, `spawned agent`, and `spawned subagent` unless the distinction is intentional and defined.
- Use `pull request` on first mention, then `PR` if abbreviation improves readability.
- Use `confidence score` for numeric issue evaluation.
- Use exact filenames when referring to governing files such as `AGENTS.md`, `PROFILE.md`, `AURA.md`, or `CLAUDE.md`.
- Do not invent filename variants.

## Writing Rules

- Use imperative voice for instructions.
- Use direct, formal prose.
- Avoid slang, shorthand, and conversational spelling.
- Avoid duplicated words and repeated instructions unless repetition is safety-critical.
- Prefer short paragraphs and ordered lists for procedures.
- Keep each instruction focused on one action or decision.
- Define ambiguous terms before using them repeatedly.

## Style Guardrails

Revise wording that contains:

- typos in operational instructions
- chat-style shortcuts such as `u`, `pls`, or `w/`
- inconsistent naming for the same concept
- vague modifiers without criteria, such as `simple`, `obvious`, or `important`
- duplicated or contradictory procedural steps
- maintainability debt caused by repeated rules or mixed-purpose paragraphs

## Structure Rules

Each task or reference file should include the following in order when the section is relevant to the document type:

### Purpose

Explain what the workflow is for.

### Inputs

State what the workflow expects to receive.

### Pre-checks or Preconditions

State conditions that must be checked before main execution begins.

### Required steps

List the ordered workflow steps. If parallelism is required, state that explicitly.

### Validation or Filtering rules

Define score cutoffs, decision rules, or conditions for discarding findings when such rules exist.

### Output format

Specify the required output structure. If formatting must be exact, state that explicitly.

### Exceptions or Fallback behavior

Describe what to do when inputs are missing, no issues are found, or conditions change during execution.

### Notes

Include secondary guidance that does not fit the main procedural flow.

## Output Contract Rules

- Every task file should include a dedicated `Output format` section or `Example output` section.
- Exact templates should be placed in fenced code blocks.
- If the format is strict, state `Follow this format precisely.`
- If multiple valid outputs are possible, define each case separately.
- Keep examples separate from normative instructions.

## Thresholds And Scoring Rules

When a workflow uses numeric thresholds or score cutoffs:

- define the scale explicitly
- define what each threshold means
- state what happens above and below the threshold
- keep scoring rules in one section rather than scattering them across the file

## Behavioral Versus Editorial Separation

Use this split consistently:

- Put behavioral rules in the task file. These rules state what the agent must do.
- Put editorial rules in a universal consistency file. These rules state how the task file should be written.

Do not mix the two unless the behavior depends on exact wording.

## Reuse Rules

To keep the file portable across projects:

- prefer generic labels such as `project instruction files` over repository-specific jargon
- describe tools by role unless the tool name is essential
- isolate examples that depend on a specific repository or platform
- do not assume GitHub, a specific CLI, or a specific agent framework unless the task file itself requires it

## Review Checklist

Before finalizing a task or reference markdown file, check that:

- the section order is complete and consistent
- all terminology is canonical
- all filenames are exact
- all major decisions have explicit precedence rules
- all thresholds are defined when applicable
- the output format is isolated in its own section
- the file contains no slang, typos, duplicated words, or contradictory steps
- project-specific policy has not leaked into universal guidance
- the file is easier to maintain after the revision than before it

## Minimal Starter Template

````md
# <title>

## Purpose
...

## Inputs
...

## Pre-checks
...

## Required steps
1. ...
2. ...

## Validation rules
...

## Output format
Follow this format precisely.

```text
...
```

## Exceptions
...

## Notes
...
````

## Quality Gate

A file should be revised before use if it:

- mixes project-specific policy with universal editorial rules
- uses inconsistent terminology for the same concept
- omits precedence or fallback behavior where multiple instruction sources may exist
- lacks a dedicated output contract when one is needed
- contains obvious grammar, spelling, or formatting issues
- contains duplicated guidance or vague wording that will make future edits inconsistent
