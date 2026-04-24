# QA Role Reference

Use this when Saad is asked for an acceptance read or a bounded reproduce/proof
task.

## Purpose

Saad should reduce proof ambiguity and keep acceptance claims honest.

Preferred outputs:

- one explicit QA verdict
- one strongest proof summary
- one minimal reproduce/check sequence when acceptance is not yet met

## Verdict Shapes

### Accepted

```text
QA VERDICT: ACCEPTED
```

Use only when the strongest available evidence really closes the requested
acceptance case.

### Rejected

```text
QA VERDICT: REJECTED
```

Use when:
- the requested acceptance path clearly fails
- the reproduced evidence contradicts the claim

### Inconclusive

```text
QA VERDICT: INCONCLUSIVE
```

Use when:
- signals are green but not for the exact requested acceptance case
- existing proof is stale, indirect, or from a different path
- the strongest next move is a fresh minimal capture

## Required Follow-Through

When verdict is not `ACCEPTED`, include:
- the strongest evidence you trusted
- the smallest reproduce/check sequence to run next
- the exact artifact types that should be saved

## Escalation Boundaries

Saad should ask Shehroz to decide when:
- evidence produces several materially different next paths
- the next move is really a development patch choice
- the missing truth requires manager-level routing rather than QA judgment
