# Card Description Template

Use this template when creating any implementation card on a Trello board.

Copy the structure below and fill in every section. A card is NOT complete until
all sections are filled.

---

```
## User Story
As [operator persona], I want [capability], so that [benefit].

## Story Points: N

## Operator Verification (how [operator] tests this manually)
1. [concrete step: what to click/press/say]
2. [what to observe: visual, audio, behavior]
3. [next step...]
...
N. [final verification: the "it works" moment]

## What you will see
[ASCII mockup or visual description of the expected result]

## What you will feel
[Emotional/experiential description: "it should feel responsive",
"you'll know it's working when..."]

## Definition of Done
- [experiential criterion the operator can verify]
- [another criterion]

## What to build

### Step 1: [first implementation step]
[Technical details, code patterns, configuration]

### Step 2: [second step]
[...]

### Step N: [last step]

## Technical acceptance criteria
- [ ] [specific verifiable criterion]
- [ ] [another criterion]
...

## Workflow lane evidence
- Review: manager runs `codex_wp review ...` and posts the review verdict/report in Trello comments
- Simplification: manager runs `$code-simplification` and comments what changed or why no safe simplification change was needed
- Auto-commit: manager runs `$auto-commit` and comments commit hash + subject

## Dependencies
- Card X (name): [why it's needed]

## Research references
- [path to memory file or doc]: [what it provides]

## What this is NOT
- [scope exclusion 1]
- [scope exclusion 2]
```

---

## Story Points Guide

| Points | Meaning | Typical scope |
|--------|---------|---------------|
| 1 | Trivial | Config change, rename, one-liner fix |
| 2 | Small | Boilerplate setup, simple UI component, basic integration |
| 3 | Medium | Full UI feature, moderate logic, standard integration |
| 5 | Large | Complex component with multiple states, non-trivial integration |
| 8 | Very Large | Critical path with unknowns, new technology, complex bridge |
| 13 | Epic | Should be broken down further |

## Operator Verification Rules

1. Written for the **operator**, not the developer
2. Uses **operator's language** (Russian if that's the operator's preference)
3. Every step has a **concrete action** (click, press, say) + **expected observation** (see, hear, feel)
4. Steps are **sequential** and **numbered**
5. Final step is the **"it works" moment** — the proof that the card is done
6. Include **edge cases**: rapid clicks, interruptions, empty states
7. Total steps: 5-15 per card (fewer for trivial cards, more for complex ones)

## Definition of Done Rules

1. Written in **operator language** (not "API returns 200" but "Operator can have a conversation")
2. **1-3 sentences** maximum
3. Focus on **outcome**, not output
4. Must be **verifiable by the operator** without reading code or opening Xcode
5. Include **latency/quality expectations** where relevant ("under 2 seconds", "no crackling")

## Common Mistakes

- Writing acceptance criteria only for the developer (missing operator perspective)
- Forgetting "What this is NOT" (leads to scope creep)
- Missing dependencies (developer doesn't know ordering)
- Missing workflow lane evidence (board moves become ungrounded)
- Story points that are too optimistic (if unsure, round up)
- Operator verification that requires developer tools (terminal, Xcode, logs)
