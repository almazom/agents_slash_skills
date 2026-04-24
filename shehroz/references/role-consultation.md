# Role Consultation Reference

Use this when the operator wants Shehroz to consult, communicate with, or
route through named roles such as `Talha` and `Saad` before the next step is
chosen.

Sibling standalone skills:

- `$talha` for developer-side role guidance
- `$saad` for QA-side role guidance

When the operator asks to use those skills directly, keep Shehroz as the final
decision owner unless the operator explicitly removes the manager layer.

## Purpose

This mode exists so the skill can support three distinct actions without
blurring them together:

- manager synthesis by `Shehroz`
- developer consultation or execution through `Talha`
- QA consultation or execution through `Saad`

The goal is not free-form role-play. The goal is bounded role-specific help
that ends in one truthful Shehroz decision.

## Role Defaults

| Role | Use for | Typical output |
|------|---------|----------------|
| `Shehroz` | intake, routing, synthesis, escalation | one next-step decision |
| `Talha` | developer debugging, implementation planning, bounded patch work | one developer recommendation or patch result |
| `Saad` | QA acceptance, reproduce checks, proof review | one QA verdict or reproduce result |

## Consultation Modes

### `shehroz-only`

Use when:
- the manager already has enough local evidence
- spawning a worker would be premature
- the operator wants Shehroz to decide now

Expected result:
- one manager decision
- no worker spawn

### `talha-dev`

Use when:
- the next question is technical and developer-shaped
- Shehroz needs one bounded debugging or implementation recommendation
- the operator explicitly asks to communicate with Talha

Expected result:
- one developer verdict such as `NEXT DEV STEP: ...`
- one bounded patch surface if implementation is justified

### `saad-qa`

Use when:
- the next question is proof, QA, acceptance, or reproduce truth
- Shehroz needs one bounded QA verdict
- the operator explicitly asks to communicate with Saad

Expected result:
- one QA verdict such as `QA VERDICT: ACCEPTED|REJECTED|INCONCLUSIVE`
- one minimal reproduce sequence when not accepted

### `talha+saad`

Use when:
- the next step depends on both engineering and QA views
- the questions are independent enough to run in parallel
- Shehroz still owns the final decision afterward

Expected result:
- one Talha result
- one Saad result
- one Shehroz synthesis and next-step decision

### `team-zoom`

Trigger phrases: "zoom with the team", "ask the team", "team call", "consult
team", "zoom team", "with the team $shehroz $talha $saad", or equivalent wording
that asks Shehroz to convene a multi-role consultation for a concrete decision.

Use when:
- the operator wants all three roles (Shehroz, Talha, Saad) to weigh in on a
  specific decision with multiple options
- the options are already enumerated (e.g. 2-4 concrete alternatives)
- the operator wants the team to pick one option, not just advise

This is a structured decision protocol, not free-form discussion.

Flow:
1. **Shehroz frames the question** — restate the options clearly with context
2. **Parallel subagent consult** — spawn Talha (dev) and Saad (QA) as parallel
   subagent calls with the same options list
3. **Each role returns** a bounded recommendation (under 200 words) ending with
   `RECOMMENDATION: option N`
4. **Shehroz synthesizes** — read both recommendations, check for convergence or
   conflict, and make the final decision
5. **Shehroz reports** the table of recommendations plus the final decision to
   the operator

Subagent prompt template for each role:
```text
You are <Talha|Saad>, a <senior developer|QA engineer>. Give ONE bounded
recommendation (under 200 words) for this technical decision.

## Context
<shared context about the bug/situation>

## Options
<enumerate the options>

## Your task
Pick ONE option. Explain why from a <developer|QA> perspective.
Consider: <effort, risk, correctness, user impact>.
Be concise. End with: RECOMMENDATION: option N
```

Synthesis rules:
- if both Talha and Saad converge on the same option, Shehroz decides
  independently and proceeds to execution (spawn Talha for implementation)
- if they conflict materially, Shehroz names the conflict, picks the
  higher-truth path, and explains why — or asks the operator if the tradeoff
  is genuinely ambiguous
- the operator may override the team recommendation at any point

Expected result:
- one framed question
- two parallel bounded recommendations
- one Shehroz final decision table
- immediate follow-up action (spawn worker, fix, or escalate)

## Communication Contract

When communicating with a named role, keep the ask concrete:

```text
WORKDIR:
CONTEXT:
PROBLEM:
TASK:
DONE:
REFERENCES:

STOP after completing this task. Do NOT continue to other work.
```

Add these manager lines before delegation when relevant:

```text
CONSULT MODE: shehroz-only | talha-dev | saad-qa | talha+saad
COMM GOAL: consult | assign | review | escalate
WORKER ROLE:
WORKER NAME:
COMM RECORD:
```

For a visible Talha run, also make the packet stop-hook-ready before submit:

- Shehroz pane is the wakeup target
- Talha pane is the review target after stop
- run root is the artifact root Shehroz will inspect
- `DONE` names the exact proof/result files Shehroz should read after the
  wakeup message arrives

## Board-Local Communication Rule

When the active project uses `.MEMORY/TRELLO/` and the role is a named durable
worker such as Talha or Saad:

- update the matching `00-info/worker-comms/*.md` file when the new contract,
  verdict, blocker, or next handoff matters for re-entry
- do this even for read-only consultations if the result changes the truthful
  next manager move

## Relationship To Sibling Skills

- use `$shehroz` when the main need is routing, synthesis, orchestration, or
  deciding the next step
- use `$talha` when the main need is developer-side reasoning or implementation
  guidance
- use `$saad` when the main need is QA-side reasoning, acceptance truth, or
  reproduce guidance
- if a repeated lesson changes how Talha or Saad should work in future runs,
  Shehroz may enrich the corresponding sibling skill in the same turn

## Minimal Patterns

### Ask Talha for a developer read

Use when Shehroz needs:
- one smallest patch recommendation
- one bounded implementation surface
- a statement that no patch should start yet

### Ask Saad for a QA read

Use when Shehroz needs:
- one verdict on acceptance truth
- one minimal reproduce/check sequence
- a clear `ACCEPTED`, `REJECTED`, or `INCONCLUSIVE`

### Ask both, then decide

Use when:
- Talha can answer the developer side
- Saad can answer the QA side
- Shehroz should merge both into one decision

Default synthesis rule:
- if both converge, Shehroz should decide independently
- if they conflict materially, Shehroz should name the conflict and either
  choose the higher-truth path or ask the operator
