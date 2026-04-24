---
name: epic-runner-script
description: Create, update, review, sync, or explain Trello-SSOT epic launcher scripts, dedicated runner cards, and the epic-label completion contract. Use when the operator mentions epic-runner-script, epic-runner-scipt, epic runner script, run-shehroz-epic, headless epic runner, epic launcher, or wants `$shehroz epic-runner-script`.
triggers: epic-runner-script, epic runner script, epic-runner-scipt, epic runner scipt, epic launcher, epic bash launcher, headless epic runner, Trello SSOT runner, run-shehroz-epic, run-shehroz-headless, epic runner card, shehroz epic-runner-script
---

# Epic Runner Script Skill

Use this skill when the work is specifically about the epic launcher contract,
not for generic Trello editing.

Load `$shehroz` too when the operator wants manager-led execution, routing, or
worker orchestration around the runner.

When the runner will be launched visibly in the same tab on the right worker
pane, load `$observer` too. Visible epic-runner launch is not complete until
the observer side is armed.

## What this skill owns

- the top human-facing epic info card that explains what Al will see and feel
  when the epic is done
- the dedicated human-facing technical runner card that lives in the Trello
  list `Epics Runners` and clearly points to the bash non-stop all-epic runner
- the canonical epic-specific launcher script under `automation/headless/`,
  usually `automation/headless/run-shehroz-epic-<n>-<epic-slug>-v<version>.sh`
- the Trello-SSOT stop-hook loop contract
- the epic-label completion gate
- the visible right-pane runner plus observer contract
- the per-card `Done` Mattermost notification rule via `$notify-me`
- the runner-to-manager communication contract for major events and final idle
  handoff
- the runner-card launcher disclosure rule, including explicit `HOOK_TIMES=<n>`
  budget in the Trello card
- the **JSONL audit stream** produced by `codex_wp exec --json`
- the **compliance verifier** that cross-references Trello moves against CLI
  commands to prove each stage was actually executed
- the **Epic UID** — stable unique identifier assigned at creation time,
  format `ep-{N}-{slug}-{YYYYMMDD}`, persisted in runner card description,
  info card, and consumed by the **epics-bot** Mattermost visualization
- the **Mattermost epics live progress bar** — PATCH-in-place DM post per epic,
  rendered by `bridge/epics_dm/` on almaz, keyed by Epic UID
- the dual-home skill sync rule: update local and `pets` in the same turn

## Read This For

| Need | Read |
|------|------|
| Current manager_window epic-runner paths, rules, and sync checklist | `references/manager-window-epic-runner-contract.md` |
| Visible right-pane runner plus observer example | `references/visible-right-pane-runner-with-observer.md` |
| Runner-to-manager communication, `p2p`, and manager-pane localization | `references/runner-manager-communication.md` |
| The broader Shehroz long-run Trello-SSOT loop template | `../shehroz/references/long-run-trello-ssot-template.md` |
| Board/card editing or list moves | `$trello` |
| Per-card `Done` operator delivery | `$notify-me` |

## Core contract

- execution epic lists are for execution work; do not use runner cards as the
  next actionable task inside workflow lanes
- the top emoji info card is informational only and must not carry the
  execution label used for epic completion
- that top info card must be human-facing and clearly describe what Al will
  see and feel when the epic is done
- that top info card title must include the epic number; prefer:
  `<emoji> EPIC #N — Al feel / all see: ...`
- keep dedicated runner cards in the board list `Epics Runners`
- a runner card is an informational control anchor, not an execution task
- when selecting, verifying, or linking a runner to an epic, read
  `Epics Runners` first; do not look for the runner in the execution epic list
  or workflow lanes
- do not move runner cards through `In Progress`, `Review`, `Simplification`,
  `Auto-commit`, or `Done`
- do not attach the epic label to runner cards; that label belongs only to
  real execution cards
- if a runner card was moved into a workflow lane, normalize the board instead
  of executing that card as if it were normal work
- runner titles must identify the epic clearly; prefer:
  `🏃 Epic Runner Anchor — EPIC #N <Epic Name>`
- treat the runner title as the lookup key that connects the anchor card to
  the execution epic; match the shared `EPIC #N <Epic Name>` segment between
  the runner title and the execution list title before launching, reviewing,
  or updating a runner
- every new epic **MUST receive a stable Epic UID** at creation time;
  format: `ep-{epic_number}-{slug}-{YYYYMMDD}`
  - `{epic_number}` = integer from the epic sequence (3, 4, 5, …)
  - `{slug}` = short kebab-case derived from epic name (`secperf`, `critstab`, `archref`)
  - `{YYYYMMDD}` = date of epic creation
  - examples: `ep-4-secperf-20260422`, `ep-5-archref-20260423`
- the Epic UID **must** be written into:
  1. runner card description — explicit `UID: ep-N-slug-YYYYMMDD` line
  2. epic info card title — parenthetical: `(uid: ep-N-slug-YYYYMMDD)`
  3. kanban.json `uid` field per epic group (if kanban exists)
  4. launcher script `_RUNNER_EPIC_UID` variable (if script has header vars)
- the Epic UID **never changes** after assignment — it survives board re-normalization,
  bot restarts, and post re-creation in Mattermost
- treat the runner title as the human-readable lookup key; treat the **Epic UID** as
  the machine-readable key for epics-bot and any external consumer; match the shared
  `EPIC #N <Epic Name>` segment between runner title and execution list title
- keep launcher filenames and operator commands in the description, not the
  title
- every runner card description must include the exact launch command with an
  explicit hook budget, for example:
  `HOOK_TIMES=80 /Users/al/zoo_apps/manager_window/run-shehroz-headless.sh`
- prefer an explicit `HOOK_TIMES=<n>` in the runner card even when the
  launcher also has its own defaults; for long epic runs, `80` is the current
  default starting budget unless the runbook says otherwise
- always write the canonical launcher script into `automation/headless/`, not
  repo root
- keep the generic fallback as `automation/headless/run-shehroz-epic-v2.sh`
- prefer one stable versioned dedicated launcher per epic with a short epic
  slug in the filename, for example
  `automation/headless/run-shehroz-epic-<n>-<epic-slug>-v<version>.sh`
- when a board already has a clear north-pole runner anchor, prefer syncing
  later epic launchers from that anchor instead of letting hand-copied runner
  forks drift
- the headless runner stops by epic-label gate only:
  every execution card with that epic label must be in `Done`, or a real
  blocker must remain after evidence-backed attempts
- when the epic runner is launched visibly in the right worker pane, pair it
  with `$observer`; a bare runner pane is not a complete start
- the default visible layout is:
  `left manager -> right runner worker -> mini observer under worker`
- in that standard visible same-tab layout, the manager pane is expected to be
  both:
  - the left pane
  - the lowest `pane_id` in the current tab
- if the runner sees a different layout, treat that as topology drift and
  report it instead of silently guessing
- for that visible path, manager wakeup proof still requires
  `submit -> 30s watch`; prefer the strict observer helpers over raw send-text
- for visible runner contracts, tell the runner to use
  `$pane-to-pane-communication` and the local `p2p` CLI for manager-pane
  communication rather than ad hoc `send-text` guesses
- the runner must know how to resolve the manager pane in the current tab; the
  standard same-tab rule is:
  `manager pane id = min(current-tab pane ids)`
- major runner events that should reach the manager pane are:
  - blocker or decision-needed state
  - major contract/scope change
  - final epic completion / idle boundary
- every Trello card moved to `Done` inside that run must send one
  Mattermost-only `$notify-me` notification immediately after the final Trello
  comment and before the runner continues
- the `Done` notification stays short, human-facing, and in Russian
- the runner must produce a **separate `.jsonl` audit file** alongside the
  `.log` file; `codex_wp exec --json` stdout goes to `.jsonl`, runner status
  and stderr go to `.log`
- each `.jsonl` session starts with a `_runner_meta` marker so the verifier
  can correlate Trello move timestamps with CLI command evidence
- after every live session, the runner must run
  `automation/verify/verify-epic-compliance.py` against the epic label and the
  current `.jsonl` stream
- if the verifier reports **confidence < 95 %**, the runner must pause for
  operator inspection instead of continuing blindly
- a transition is verified only when the matching CLI command appears in the
  JSONL within the same or adjacent session as the Trello move
- for a visible runner, the final epic-complete boundary must do both:
  - Mattermost-only `$notify-me`
  - a manager-pane wakeup through `p2p`
- when the epic-label gate itself closes, send one additional loud explicit
  Mattermost-only epic-runner-complete notification before leaving the run
- that final epic-runner-complete note must include `EPIC #N DONE` and the
  simplified `Done | In Progress | Remaining` bar so the operator can spot the
  result instantly
- the final manager-pane wakeup should explicitly ask Shehroz to:
  - inspect SSOT/results
  - notify the operator
  - decide the next step independently
  - start the next epic runner without waiting when the current epic verdict is
    good enough
- when the operator wants ongoing runner visibility, prefer spawning a native
  harness subagent in parallel as the observation surface instead of relying on
  sporadic manual checks
- keep Trello truth centralized with the manager path: observer subagents may
  read the board, logs, and process state, but they should not silently own
  lane moves or final comments unless scope is explicitly widened
- the default progress surface should be a single-line bar, for example:
  `Current EPIC #0 snapshot: █████████████████░░░  ~83%`
- compute that bar from live Trello counts for real execution cards only:
  `Done | In Progress | Remaining`
- exclude the top info card and the runner anchor card from the counts and the
  percentage
- when this skill or its paired Shehroz routing changes, sync the update on
  both servers in the same turn:
  pets `~/.agents/skills/` and Mac `~/.agents/skills/`
- runner scripts should mention the project-root `TRELLO.md` in their header
  comments as the authority for lane semantics, transition rules, and card
  lifecycle behavior
- on startup, verify that `TRELLO.md` exists in the project root and warn
  truthfully if it does not
- creating or refreshing `TRELLO.md` stays the `$trello` skill's job; the
  runner only verifies and references it

## Default workflow

1. Confirm the epic list, epic label, and current runner ownership by reading
   `Epics Runners` first and matching the shared `EPIC #N <Epic Name>` title
   segment.
2. Confirm the dedicated runner card lives in `Epics Runners`, not in workflow
   lanes.
3. **Generate or confirm the Epic UID** for this epic. If no UID exists yet:
   - read the next available epic number from existing UIDs on the board
   - derive slug from epic name (lowercase, spaces→hyphens, max 12 chars)
   - compose: `ep-{N}-{slug}-{YYYYMMDD}`
   - verify uniqueness against all existing UIDs on the board
4. Create or update the top human-facing info card so it clearly explains what
   Al will see and feel when the epic is done, make sure its title includes
   `EPIC #N` and the **Epic UID** in parentheses, and keep it free of
   the epic label.
5. Create or update the dedicated runner card in `Epics Runners` before
   changing deeper execution cards, and make sure the card clearly points to
   the bash non-stop all-epic runner without being phrased as a normal task or
   carrying the epic label.
   The card must expose:
   - the exact launch command with explicit `HOOK_TIMES=<n>`
   - the **Epic UID** on an explicit `UID:` line in the description
6. Create or update the stable versioned launcher under
   `automation/headless/`.
6. Ensure that launcher and the prompt/template pack under
   `automation/headless/` still match the launcher contract.
7. If the runner is being launched visibly in the right pane, teach the runner
   the manager-pane rule for the current tab, the `p2p` path, and the major
   event wakeup contract before leaving the run unattended.
8. If the runner is being launched visibly in the right pane, arm `$observer`
   immediately and prove the wakeup path before leaving the run unattended.
9. If the operator wants continuous progress updates, spawn the native harness
   observation subagent in parallel and make it report the compact visual
   `Current EPIC #N snapshot` bar from live Trello counts.
10. Verify the stop condition is the full epic-label gate, not wrapper name or
   one clean-looking list.
11. If execution cards move to `Done`, pair each move with its Trello comment
    and one `$notify-me` Mattermost notification.
12. When the epic-label gate reaches all-done, send the loud explicit
    epic-runner-complete notification before calling the runner finished.
13. Require the visible runner to send one final manager-pane wakeup that asks
    Shehroz to review the results and keep momentum into the next epic when the
    verdict allows it.
14. **Run compliance verification after every live session.** The runner
    automatically calls `automation/verify/verify-epic-compliance.py` against the
    current `.jsonl` audit stream. If confidence is below 95 %, the runner pauses
    for operator inspection. Do not continue blindly.
15. Sync any stable skill update to pets and Mac, then verify both copies.

## Reference Implementation — VoiceBar Board

This pattern was bootstrapped on 2026-04-22 for the VoiceBar macOS project.
It serves as a concrete worked example of the north-pole epic-runner contract.

### Board before normalization

- Lists: Info, Backlog, In Progress, Review, Simplification, Auto-commit, Done
- 14 completed cards in Done (from previous sprint)
- 2 epic info cards in Info list
- No Epics Runners list, no epic labels, no dedicated epic lists

### Board after normalization

- Added `Epics Runners` list
- Added dedicated epic execution lists through EPIC #7
- Added runner anchor cards through EPIC #7
- Added human-facing info cards for active execution epics
- Added epic labels through EPIC #7
- Created 19 execution cards from `kanban.json` with labels and checklists
- Repositioned workflow lanes after epic lists

### Epic grouping from flat kanban

| Epic | Theme | Cards | Points |
|------|-------|-------|--------|
| EPIC #3 | Critical Stability Fixes | P1-001, P1-002, P1-003, P2-006, P2-007 | 9 |
| EPIC #4 | Security & Performance Hardening | P2-002, P2-003, P2-004, P2-005, P2-009, P2-010 | 18 |
| EPIC #5 | Architecture Refactor | P2-001, P2-008 | 13 |
| EPIC #6 | Polish & Cleanup | P3-001…P3-006 | 8 |

### Launcher paths referenced in runner descriptions

- `./automation/headless/run-shehroz-epic-3-critical-stability-v2.sh`
- `./automation/headless/run-shehroz-epic-4-security-perf-v3.sh`
- `./automation/headless/run-shehroz-epic-5-architecture-v3.sh`
- `./automation/headless/run-shehroz-epic-6-polish-v3.sh`
- `./automation/headless/run-shehroz-epic-7-next-scope-v3.sh`

These launchers iterate over cards with the matching epic label until the
epic-label gate closes.

### Verified north-pole descendants

- EPIC #5 Architecture Refactor is a verified north-pole descendant:
  `./run-shehroz-epic-5.sh` ->
  `./automation/headless/run-shehroz-epic-5-architecture-v3.sh`
  with runner anchor `OB1ubcpT`
- EPIC #6 Polish & Cleanup is a verified north-pole descendant:
  `./run-shehroz-epic-6.sh` ->
  `./automation/headless/run-shehroz-epic-6-polish-v3.sh`
  with runner anchor `myyZREqk`

### North-pole sync example — EPIC #5 Architecture Refactor

Use this as the concrete reference when the operator wants a later epic runner
aligned to the EPIC #4 north-pole golden standard.

- board: VoiceBar macOS
- stable launcher: `./run-shehroz-epic-5.sh`
- exact launch: `DRY_RUN=0 HOOK_TIMES=80 ./run-shehroz-epic-5.sh`
- canonical launcher:
  `./automation/headless/run-shehroz-epic-5-architecture-v3.sh`
- contract version: `v3`
- sync tool: `python3 automation/headless/sync-epic-4-north-pole.py`
- sync source:
  `./automation/headless/run-shehroz-epic-4-security-perf-v2.sh`
- runner anchor card: `OB1ubcpT`
- runbook lines that must stay aligned:
  exact launch command, canonical launcher path, north-pole contract version,
  sync tool, sync source, epic-label done gate, and visible `p2p` wakeup rules

### Bootstrap placeholder — EPIC #7 Next Scope Placeholder

Use this when the operator wants the next epic slot versioned and normalized
before the real scope is known.

- board: VoiceBar macOS
- stable launcher: `./run-shehroz-epic-7.sh`
- exact launch: `DRY_RUN=0 HOOK_TIMES=80 ./run-shehroz-epic-7.sh`
- canonical launcher:
  `./automation/headless/run-shehroz-epic-7-next-scope-v3.sh`
- contract version: `v3`
- sync tool: `python3 automation/headless/sync-epic-4-north-pole.py`
- sync source:
  `./automation/headless/run-shehroz-epic-4-security-perf-v2.sh`
- runner anchor card: `3YF7s1ML`
- scope note:
  keep the placeholder explicit and replace the title, scope, and execution
  cards before the first live EPIC #7 run

## JSONL Audit Stream & Compliance Verifier

Every headless runner must separate its output into two files:

| File | Content |
|------|---------|
| `.log` | Runner banners, status, errors |
| `.jsonl` | Raw `codex_wp exec --json` stdout |

### Why this matters

The `.jsonl` is the **objective execution trace**. It records every
`command_execution` event that `codex_wp` actually ran. We cross-reference this
against Trello card moves to prove that:

- `Review` was backed by a real `codex_wp review ...` command
- `Simplification` was backed by a real `$code-simplification` command
- `Auto-commit` was backed by a real `$auto-commit` command
- `Done` was backed by a real `$notify-me` command

### Verifier usage

```bash
python3 automation/verify/verify-epic-compliance.py \
  --epic-label "EPIC 4 Security" \
  --jsonl automation/logs/run-shehroz-epic-4-security-perf-v3.jsonl \
  --log automation/logs/run-shehroz-epic-4-security-perf-v3.log \
  --trello-env /path/to/.env \
  --output-json automation/logs/verify-epic-4-session-1.json
```

### Baseline from Epic #3

Epic #3 live run scored **25 %** compliance. Only `codex_wp review` was
actually executed as a CLI command. `$code-simplification`, `$auto-commit`, and
`$notify-me` were skipped or replaced by manual actions (direct `git commit`,
missing notifications). Future epic runs must invoke the actual skills to reach
≥95 %.

## Done criteria for a docs or skill update

- the runner contract is placed in the canonical section, not scattered
- the top info card and dedicated `Epics Runners` rules are explicit
- the launcher ownership and epic-label gate are explicit
- the visible right-pane observer rule is explicit
- the per-card `Done` notification rule is explicit
- the runner-card `HOOK_TIMES=<n>` disclosure rule is explicit
- the manager-pane localization and `p2p` wakeup rule are explicit
- the reference example for visible runner plus observer exists
- the reference example for north-pole sync from one epic to a later epic
  exists
- the JSONL audit stream separation and `_runner_meta` session markers are explicit
- the compliance verifier path and 95 % threshold are explicit
- the Epic #3 baseline (25 %) and the gap it revealed are documented
- the pets and Mac skill copies are both updated and verified
- every new epic has a stable **Epic UID** written into runner card, info card,
  and available for epics-bot consumption
- the Epic UID format `ep-{N}-{slug}-{YYYYMMDD}` is enforced consistently
  across all epic artifacts (Trello cards, kanban.json, launcher scripts)
