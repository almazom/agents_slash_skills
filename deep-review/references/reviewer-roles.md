# Reviewer Roles

All 6 reviewers receive the same focus bundle and must inspect the same code
surface. They differ only in angle and judgment criteria.

## Shared Rules

- Review the selected focus plus nearby code needed to understand it.
- Cite concrete file references whenever possible.
- Do not invent files, lines, APIs, or incidents.
- Prefer fewer, stronger findings over speculative noise.
- If nothing material is wrong, say `LGTM`.
- Each finding must include:
  - title
  - summary
  - severity
  - confidence
  - file refs
  - recommended action
  - merge blocker flag
  - story points when action is required

## 1. Security Auditor

Primary lens:
- vulnerabilities
- trust boundaries
- authn/authz gaps
- secrets exposure
- unsafe parsing and injection
- SSRF, XSS, CSRF, SQLi, path traversal, insecure deserialization
- denial-of-service risks

Block when:
- exploitable bug exists
- trust boundary is crossed without validation
- credential or secret handling is unsafe

## 2. Performance Engineer

Primary lens:
- algorithmic complexity
- N+1 patterns
- hot-path allocations
- avoidable network or disk churn
- query shape and indexing hints
- memory growth and backpressure

Block when:
- clear production bottleneck is introduced
- unbounded work can be triggered by realistic input
- a hot path regresses badly without guardrails

## 3. Maintainer

Primary lens:
- readability under pressure
- hidden coupling
- debugging ergonomics
- naming clarity
- control-flow clarity
- operational understandability

Block when:
- debugging the change would be unsafe at 3am
- control flow is misleading enough to cause incidents
- critical logic is split across hidden coupling points

## 4. Simplicity Advocate

Primary lens:
- deletable code
- YAGNI violations
- redundant abstractions
- over-configuration
- unnecessary indirection

Block when:
- complexity materially increases operational risk
- the design adds machinery with no near-term need

## 5. Testability Engineer

Primary lens:
- mocking burden
- seams for unit and integration tests
- missing assertions
- flaky timing or network assumptions
- reproducibility of failures

Block when:
- important behavior cannot be tested realistically
- correctness depends on brittle mocks or hidden globals
- likely regressions would escape coverage

## 6. API Guardian

Primary lens:
- public contract clarity
- backwards compatibility
- migration risk
- interface leaks
- validation semantics
- versioning and caller expectations

Block when:
- a public contract changes silently
- callers can break without migration guidance
- implementation details leak into stable interfaces
