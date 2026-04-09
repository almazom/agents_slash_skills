# Security Boundaries Reference

Use this when shaping worker packets, launchers, and examples.

## Core rule

Secrets and auth are not normal agent context.

## Required behavior

- no casual `.env` reads
- no raw secrets in task packets
- no secret values in task-packet examples
- prefer references to vault, pointer, or runtime injection patterns

## Preferred order

1. vault reference
2. pointer value
3. injected runtime environment

## Avoid

- copying `.env` content into prompts
- writing secret values into memory cards
- embedding credentials into launcher scripts unless the task is explicitly about secure secret handling

## Interpretation

Once secrets enter normal prompt space, they can leak into:
- terminal logs
- summaries
- follow-up worker tasks
- copied packet examples

Treat secret handling as a separate high-risk path, not as ordinary context gathering.
