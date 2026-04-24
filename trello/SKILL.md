---
name: trello
description: >-
  Trello board management skill for Shehroz. Create, read, update, and organize
  Trello boards, lists, cards, labels, and checklists via the `trello` CLI.
  Use when the operator asks to plan epics, create cards, assess board readiness,
  manage sprint workflow, or keep Trello in sync with project memory.
triggers: trello, $trello, board, epic, card, checklist, trello board, sprint, kanban, move card, create card, update card, label, board readiness, epic planning, story points, definition of done
---

# Trello Skill

Trello board management via the `trello` CLI at `~/bin/trello` (wraps
`~/TOOLS/Trello/scripts/trello_manager.sh`).

Use this skill when:
- Creating or restructuring Trello boards, epics, cards
- Assessing board readiness for development
- Writing detailed card descriptions with DoD
- Managing labels, checklists, card workflow
- Keeping Trello in sync with project memory

## CLI Root

```
TRELLO_CLI = ~/bin/trello
TRELLO_SCRIPT = ~/TOOLS/Trello/scripts/trello_manager.sh
TRELLO_ENV = ~/TOOLS/Trello/.env
```

Auth is handled automatically by the CLI via `~/TOOLS/Trello/.env`.

## TRELLO.md Project-Root Guard

On first `$trello` invocation in any project:
- check whether `TRELLO.md` exists at the project root before doing live board
  work
- if it is missing, copy the canonical template from
  `~/.agents/skills/trello/templates/TRELLO.md.template`
- replace template placeholders with live board truth where available:
  `{{BOARD_ID}}`, `{{BOARD_URL}}`, `{{LIST_IDS_TABLE}}`, and
  `{{EPIC_LABELS_TABLE}}`
- if the template is missing or live board metadata is incomplete, generate a
  minimal truthful `TRELLO.md` from current CLI output instead of skipping the
  file entirely
- after creating or refreshing the file, read the project-root `TRELLO.md`
  before proceeding with Trello moves, comments, or epic-runner setup

## Board Commands

| Command | Usage |
|---------|-------|
| `trello list-boards` | List all boards |
| `trello board-info <board_id>` | Board metadata |
| `trello list-lists <board_id>` | All columns |
| `trello create-list <name> <board_id> <pos>` | New column (pos: number or `top`/`bottom`) |
| `trello archive-list <list_id>` | Remove column |

## Card Commands

| Command | Usage |
|---------|-------|
| `trello list-cards <list_id>` | Cards in a column |
| `trello card-info <card_id>` | Full card details (name, desc, labels, checklists) |
| `trello create-card <list_id> "<name>"` | New card |
| `trello update-card <card_id> --name "..."` | Rename |
| `trello update-card <card_id> --desc "..."` | Set description (use heredoc for long text) |
| `trello move-card <card_id> <list_id>` | Move between columns |
| `trello archive-card <card_id>` | Archive |
| `trello reopen-card <card_id>` | Unarchive |

**IMPORTANT:** `create-card` description via `--desc` flag is unreliable — the flag text can be consumed as the description content. Always create the card first, then set the description separately with `update-card`:
```bash
# Step 1: create card (name only)
CARD_ID=$(trello create-card $LIST_ID "Card Name" --format json | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")

# Step 2: set description via heredoc
trello update-card "$CARD_ID" --desc "$(cat <<'EOF'
Full description here...
EOF
)"
```

## Label Commands

| Command | Usage |
|---------|-------|
| `trello list-labels <board_id>` | All board labels |
| `trello create-label "<name>" <color> <board_id>` | New label |
| `trello add-label <card_id> <label_id>` | Attach label |
| `trello remove-label <card_id> <label_id>` | Remove label |
| `trello list-card-labels <card_id>` | Card's labels |

**IMPORTANT:** `add-label` requires label **ID**, not name. Always run `list-labels` first to get IDs.

## Checklist Commands

| Command | Usage |
|---------|-------|
| `trello create-checklist <card_id> "<name>"` | New checklist |
| `trello add-checklist-item <card_id> "<item>"` | Add item (to first checklist) |
| `trello complete-checklist <card_id> "<item>"` | Mark item done (fuzzy match) |
| `trello uncomplete-checklist <card_id> "<item>"` | Mark item pending |
| `trello toggle-checklist <card_id> "<item>"` | Toggle item |
| `trello list-checklists <card_id>` | All checklists on card |
| `trello list-unchecked <card_id>` | Remaining work |
| `trello progress <card_id>` | Progress snapshot |

## Comment Commands

| Command | Usage |
|---------|-------|
| `trello add-comment <card_id> "<text>"` | Add comment |
| `trello list-comments [--json\|--raw] <card_id>` | Read comments (default: formatted JSON) |

## Output Format

Most commands support `--format json` for machine-readable output:
```bash
trello list-lists $BOARD_ID --format json
trello list-cards $LIST_ID --format json
trello card-info $CARD_ID --format json
```

**NOTE:** `list-cards` does NOT include descriptions or labels in output.
Use `card-info` for full details.

## Position System

Lists and cards use numeric positions. Trello sorts by position ascending:
- `1` = leftmost
- `65536` = second position
- `131072` = third position
- `top` / `bottom` = relative positioning

## Card Lifecycle Workflow

Every execution card MUST pass through ALL workflow lanes in order. No lane may be skipped.

### Mandatory 5-step process

1. **Backlog → In Progress**: Move card when worker starts implementing. Add Trello comment: "started implementation".
2. **In Progress → Review**: Run `codex_wp review` on the changes. Fix all P0/P1 suggestions. Move card to Review list. Add Trello comment with review verdict (pass/fail, what was fixed).
3. **Review → Simplification**: Run `/code-simplification` skill on the changes. Move card to Simplification list. Add Trello comment with simplification result (what was simplified or why no safe simplification was needed).
4. **Simplification → Auto-commit**: Run `/auto-commit` skill. Move card to Auto-commit list. Add Trello comment with commit hash and subject.
5. **Auto-commit → Done**: Move card to Done list. Add Trello comment: "done".

## Lane Semantics

Each workflow lane carries a mandatory action:

| Lane | Movement semantic |
|------|-------------------|
| `Info → Backlog` | Card is scoped and ready for implementation. |
| `Backlog → In Progress` | Manager assigns work to a worker; no review automation yet. |
| `In Progress → Review` | Manager MUST run `codex_wp review` before the move. |
| `Review → Simplification` | Manager MUST run `$code-simplification` or record a truthful no-change verdict. |
| `Simplification → Auto-commit` | Manager MUST run `$auto-commit` and capture commit evidence. |
| `Auto-commit → Done` | Manager performs final verification and sends `$notify-me`. |
| `Review → Blocked` | Use when 3 review cycles still return P0/P1 issues or a real blocker prevents progress. |

### Lane-by-lane transition protocol

Each transition below is atomic: Trello move + Trello comment happen in the same
action chain. The manager does NOT advance until the lane-specific action is real.

#### Transition 1: Backlog → In Progress

| Step | Who | Action | Tool |
|------|-----|--------|------|
| 1a | Manager | Check Trello board state for card location and dependencies | `curl` / `trello card-info` |
| 1b | Manager | Build task prompt from card description + technical details | manual text assembly |
| 1c | Manager | Dispatch task to worker pane | `p2p --pane-id WORKER --submit "<prompt>"` |
| 1d | Manager | Move card to `In Progress` list | `trello move-card` or `curl PUT` |
| 1e | Manager | Add Trello comment with dispatch evidence | `trello add-comment` or `curl POST` |

Comment template:
```
🚀 Начата реализация
Воркер: kimi (pane 29)
Диспетчер: Shehroz (pane 28)
```

#### Transition 2: In Progress → Review

**Trigger:** worker sends `TAHIR_DONE_<task-id>` via p2p.

| Step | Who | Action | Tool |
|------|-----|--------|------|
| 2a | Manager | Receive `TAHIR_DONE_<task-id>` signal | p2p inbox |
| 2b | Manager | Verify implementation files exist in repo | `git status` / `ls` |
| 2c | Manager | Run code review on changed files | `codex_wp review <files>` or `kimi` review prompt |
| 2d | Manager | If review finds P0/P1 issues → send fixes to worker | `p2p --pane-id WORKER --submit "<fix prompt>"` |
| 2e | Manager | When review passes → move card to `Review` list | `trello move-card` or `curl PUT` |
| 2f | Manager | Save review report to file | `Write` to `/tmp/review-<task-id>.md` or project path |
| 2g | Manager | Add Trello comment with review verdict + report reference | `trello add-comment` or `curl POST` |

#### Review Back-and-Forth Escape Hatch (Blocked Lane)

- keep a per-card review cycle count while the card is bouncing between worker
  fixes and manager review
- if 3 review cycles still produce P0/P1 findings, stop the loop and move the
  card to `Blocked`
- add a Trello comment explaining the blocker in simplified Russian with short
  bullets
- record the blocker in `.MEMORY/`
- if the board has no `Blocked` list, keep the card in `Review` and leave the
  truthful blocker comment instead of inventing a silent fallback
- after operator resolution, restart from `Backlog` rather than pretending the
  failed review loop was already resolved

Comment template:
```
📋 Ревью завершено
Вердикт: PASS
Файлы проверены: <count>
Проблем найдено: <count>
Исправлено: <count>
Отчёт: <file path or summary>
```

#### Transition 3: Review → Simplification

| Step | Who | Action | Tool |
|------|-----|--------|------|
| 3a | Manager | Load `$code-simplification` skill | skill activation |
| 3b | Manager | Run simplification analysis on reviewed files | skill-guided pass |
| 3c | Manager | If simplification found → apply changes | `Edit` / `Write` |
| 3d | Manager | Move card to `Simplification` list | `trello move-card` or `curl PUT` |
| 3e | Manager | Add Trello comment with simplification result | `trello add-comment` or `curl POST` |

Comment template:
```
♻️ Упрощение
Изменения: <what was simplified>
или
Изменения не требуются — код уже минимален
```

#### Transition 4: Simplification → Auto-commit

| Step | Who | Action | Tool |
|------|-----|--------|------|
| 4a | Manager | Stage all changed/new files for the task | `git add <files>` |
| 4b | Manager | Create commit with descriptive message | `git commit` |
| 4c | Manager | Record commit hash | `git log --oneline -1` |
| 4d | Manager | Move card to `Auto-commit` list | `trello move-card` or `curl PUT` |
| 4e | Manager | Add Trello comment with commit hash + subject | `trello add-command` or `curl POST` |

Comment template:
```
✅ Коммит
Хеш: <short hash>
Сообщение: <commit subject>
Файлы: <count> changed
```

#### Transition 5: Auto-commit → Done

| Step | Who | Action | Tool |
|------|-----|--------|------|
| 5a | Manager | Verify card has passed through all 4 previous lanes | check Trello comments |
| 5b | Manager | Move card to `Done` list | `trello move-card` or `curl PUT` |
| 5c | Manager | Add final Trello comment | `trello add-comment` or `curl POST` |
| 5d | Manager | Send Mattermost notification via `$notify-me` | `$notify-me` skill |
| 5e | Manager | Advance to next task in epic or next epic | re-enter at Transition 1 |

Comment template:
```
🏁 Готово — <epic name>
Все этапы пройдены.
Коммит: <hash>
Следующая задача: <next task or 'эпик завершён'>
```

### Transition rules

- **MANAGER (Shehroz) owns the ENTIRE card lifecycle.** Worker (Tahir/kimi) only implements code and sends p2p completion signals. Manager moves cards between lists, writes comments, runs review/simplification/commit.
- Each lane transition = one Trello card move + one Trello comment with evidence.
- NEVER skip a lane. NEVER batch transitions.
- NEVER mark a card done without completing all 5 steps.
- Lane actions must be mirrored in real-time, not deferred.
- Manager MUST check Trello board state before every decision.
- Review reports must be saved as files AND referenced in Trello comments.
- Worker must NEVER move Trello cards — that is exclusively manager responsibility.
- When worker finishes implementation, it sends `p2p --pane-id MANAGER --submit TAHIR_DONE_TASKID`. Then manager takes over the full lifecycle.
- `codex_wp review` or `kimi` review prompt is mandatory before moving to Review lane — the review must be a real code review, not a rubber stamp.
- `$code-simplification` skill pass is mandatory before moving to Simplification lane — either changes are applied, or an explicit "no safe simplification" verdict is documented.
- `$auto-commit` via `git commit` is mandatory before moving to Auto-commit lane — the commit hash is the evidence.
- `$notify-me` Mattermost notification is mandatory when moving to Done — sent immediately after the Done move and final comment.
- The epic runner script from `automation/headless/` is the mandatory
  execution path for epic work. Direct p2p task dispatch without the runner is
  a protocol violation unless Shehroz documents an explicit manual takeover.

### Board list IDs for this project

- Backlog: 69e70b8a3d58ebf2052a6aa1
- In Progress: 69e70b8bf6b03ead07e708df
- Review: 69e70b8c1b45007e6d9a3be4
- Simplification: 69e714d2041f32835af78d44
- Auto-commit: 69e714df6db0784cd9fe7d14
- Done: 69e70b8c2edd6aba31dd18f7

## Card Description Standards

Every card that represents implementation work MUST include:

### 1. User Story (top)
```
## User Story
As [operator persona], I want [capability], so that [benefit].
```

### 2. Story Points (below user story)
```
## Story Points: N
```
Fibonacci scale: 1, 2, 3, 5, 8, 13, 21

### 3. Operator Verification (manual test scenario)
```
## Operator Verification (how [operator] tests this manually)
1. [step with expected observation]
2. [step with expected observation]
...
```
Written for the operator, not the developer. What to click, what to see, what to hear.

### 4. What you will see / feel (visual description)
ASCII mockup or description of the expected visual result.

### 5. Definition of Done
```
## Definition of Done
- [experiential criterion the operator can verify]
```
1-3 sentences in operator language, not developer language.

### 6. Technical details (for the developer)
What to build, code patterns, API references, architecture notes.

### 7. Technical acceptance criteria (checklist)
```
## Technical acceptance criteria
- [ ] [specific verifiable criterion]
```

### 8. Dependencies
Which cards must be done before this one.

### 9. Research references
Links to `.MEMORY/` files for context.

### 10. What this is NOT
Explicit scope boundary to prevent scope creep.

### 11. Workflow lane evidence
Every execution card that will move through workflow lanes should state the
evidence expected at each boundary:
```
## Workflow lane evidence
- Review: manager runs `codex_wp review ...` and posts the review verdict/report in Trello comments
- Simplification: manager runs `$code-simplification` and comments what changed or why no safe simplification change was needed
- Auto-commit: manager runs `$auto-commit` and comments commit hash + subject
```

## Board Readiness Assessment

When asked "is the board ready for development?", evaluate:

| Dimension | Weight | What to check |
|-----------|--------|---------------|
| Card descriptions | 25% | Does every card have goal, steps, DoD? |
| Acceptance criteria | 20% | Does every card have a verifiable checklist? |
| Dependencies | 15% | Are card dependencies explicit? |
| Ordering | 15% | Can a developer pick the first card and know what to do? |
| Scope boundaries | 10% | Does every card say what it is NOT? |
| Labels | 10% | Are cards labeled for filtering? |
| Operator verification | 5% | Can the operator manually test the result? |

Report as percentage. Below 80% = not ready. 80-90% = ready with gaps. 90%+ = ready.

## Epic Planning Pattern

When the operator wants to create a new epic:

1. **Create list**: `trello create-list "EPIC #N Name" $BOARD_ID <pos>`
2. **Define cards**: identify minimal set of cards for the epic
3. **Write descriptions**: use the Card Description Standards above
4. **Set dependencies**: explicitly state card ordering
5. **Assign labels**: only real execution cards get the epic label; the top
   info card and the runner anchor card do not
6. **Generate the epic media pack immediately**: every new `Al feel / all see`
   info card must receive its image pack plus mp3 summary before the epic is
   considered normalized
7. **Mirror aggregate galleries when they exist**: if the board already has
   dedicated mockups and voice-summary archive cards, copy the new epic media
   there in the same action chain
8. **Verify completeness**: run Board Readiness Assessment on the epic only
   after the media pack and aggregate mirrors are present

## Epic Info Cards

Use this board model for the first human-facing epic card:

- keep the info card as the first card in the epic execution list
- make the title include the epic number; prefer:
  `<emoji> EPIC #N — Al feel / all see: ...`
- keep the info card informational only
- do not attach the epic label to the info card
- every new epic info card must receive a generated media pack directly on the
  info card; this is mandatory, not optional:
  - required pack size by default: `3` images + `1` mp3 summary
  - allowed visual range: `3-5` images when the operator explicitly asks for
    more
  - purpose: when Al listens to the audio and looks at the mockups, he should
    understand what the epic will bring without reading all execution cards
  - style: concrete UI illustration first; prefer realistic AppKit/product
    mockups that show screens, controls, panels, overlays, state changes, and
    the operator-visible result of the epic
  - avoid vague atmosphere images, abstract moodboards, or generic concept art
    when the epic is fundamentally about UI/UX behavior
  - store the source files in the repo under stable paths such as
    `assets/epic_visuals/<epic-slug>/` and `assets/epic_audio/<epic-slug>/`
  - prefer generating visuals with OpenAI image generation (`gpt-image-2`) when
    the operator asked for OpenAI-generated visuals
  - after generating, attach the image files to the Trello info card and add a
    short `## Visual References` section in the card description that explains
    what each image communicates
  - generate a matching TTS pack for the same info card:
    - write the narration source text to a stable repo path such as
      `assets/epic_audio/<epic-slug>/<epic-slug>-summary.txt`
    - generate an audio file such as
      `assets/epic_audio/<epic-slug>/<epic-slug>-summary.mp3`
    - prefer OpenAI text-to-speech when the operator asked for OpenAI-generated
      audio; current default target is `gpt-4o-mini-tts`
    - keep the TTS script operator-facing: describe what the epic will do, what
      Al will feel, and what will become visible once the epic is complete
    - attach the mp3 to the Trello info card and add a short
      `## Audio References` section in the card description
    - explicitly disclose in that section that the voice file is AI-generated
  - when the board has dedicated aggregate gallery cards, mirroring is also
    mandatory:
    - copy all epic mockup images to the shared mockups card
    - copy all epic mp3 summaries to the shared voice-descriptions card
    - keep the aggregate cards as central archives; do not remove the original
      attachments from the per-epic info cards
    - prefer a stable repo manifest for these aggregate targets, for example
      `automation/trello/aggregate_media_targets.json`
    - after mirroring, update the aggregate card description with a short
      inventory section such as `## Aggregate Mockups` or
      `## Aggregate Audio`
  - these media packs belong on the `Al feel / all see` info card, not on the
    runner anchor and not on every execution card by default
  - if a new epic exists without its media pack, treat the board as not yet
    normalized and fix the media gap before calling the epic bootstrap complete

## Epic Runner Cards

Use this board model for epic runner cards:

- keep all runner cards in the dedicated Trello list `Epics Runners`
- treat runner cards as informational control anchors, not execution tasks
- when selecting or verifying the runner for an epic, read `Epics Runners`
  first; do not look for the runner in the execution epic list or workflow
  lanes
- do not move runner cards through `In Progress`, `Review`, `Simplification`,
  `Auto-commit`, or `Done`
- do not attach the epic label to runner cards
- do not count runner cards as the next actionable implementation card
- if a runner card was moved into a workflow lane, normalize the board instead
  of continuing as if it were normal task work
- keep execution work on the real epic execution cards only
- make runner titles explicit enough that the epic is obvious at a glance;
  prefer:
  `🏃 Epic Runner Anchor — EPIC #N <Epic Name>`
- treat the runner title as the lookup key that connects the anchor card to
  the execution epic; match the shared `EPIC #N <Epic Name>` segment between
  the runner title and the execution list title
- keep launcher filenames, dry-run commands, and runbook details in the card
  description, not in the title
- every runner description should mention the `.jsonl` audit path and the
  compliance verifier so operators know the run is measurable
- example launcher disclosure in a runner card description:
  ```
  Launch: HOOK_TIMES=80 DRY_RUN=0 ./automation/headless/run-shehroz-epic-4-security-perf-v2.sh
  Audit:  automation/logs/run-shehroz-epic-4-security-perf-v2.jsonl
  Verify: python3 automation/verify/verify-epic-compliance.py --epic-label "EPIC 4 Security" --jsonl <audit>
  ```

## Info Column Structure

Use the `Info` list as an archive and reference surface for cross-epic assets:
- keep one aggregate mockups card such as `<emoji> Mockups Gallery`
- keep one aggregate audio card such as `<emoji> Voice Summaries Archive`
- those cards mirror links and evidence from per-epic info cards; they do not
  replace the epic-local originals
- do not add epic labels to these aggregate cards
- never move these aggregate cards through workflow lanes

## North Pole Golden Standard — Complete Board Bootstrap

This is the exact board pattern observed on the CloudE Screenshot Swift Native
Build and Manager Window reference boards and successfully implemented for
VoiceBar. Use it as a reproducible recipe when bootstrapping or normalizing any
epic-runner board.

### Required lists (in visual order)

| Order | List | Purpose |
|-------|------|---------|
| 1 | Info (optional) | Legacy epic info cards or project notes |
| 2 | Epics Runners | Runner anchor cards only |
| 3…N | EPIC #N — <Epic Name> | One dedicated list per active epic |
| N+1 | Blocked (optional) | Stopped work with blocker reason |
| N+2 | In Progress | Cards currently being implemented |
| N+3 | Review | Cards awaiting codex_wp review |
| N+4 | Simplification | Cards awaiting $code-simplification |
| N+5 | Auto-commit | Cards awaiting $auto-commit |
| N+6 | Done | Completed execution cards |

### Bootstrap checklist

1. **Create epic labels** — one per epic. Pattern: `EPIC N <short-name>`
   (e.g. `EPIC 3 Stability`). Do not attach these labels to runner or info cards.
2. **Create the `Epics Runners` list** — position it immediately after `Info`
   (or leftmost if there is no `Info`).
3. **Create one execution list per epic** — name pattern:
   `EPIC #N — <Epic Name>`. Position all epic lists before the workflow lanes.
4. **Create runner anchor cards** inside `Epics Runners` (one per epic):
   - Title: `🏃 Epic Runner Anchor — EPIC #N <Epic Name>`
   - Description: Purpose, Runbook (epic list, label, launcher path, done gate), Notes
   - No epic label
5. **Create epic info cards** as the first card in each epic execution list:
   - Title: `<emoji> EPIC #N — Al feel / all see: <outcome description>`
   - Description: What Al will see/feel when done, scope, total story points
   - No epic label
6. **Create execution cards** inside each epic list:
   - Title: `<card-id>: <descriptive name>` (e.g. `P1-001: Fix fallback HTTPS validation`)
   - Description must include: Story Points, Priority, Evidence, Acceptance Criteria, Epic reference
   - Attach the matching epic label
   - Add an `Acceptance Criteria` checklist with verifiable items
7. **Normalize workflow lane positions** — place after all epic lists so cards
   flow left-to-right through the board.

### Mapping kanban / SDD findings into epics

When a deep review or SDD package produces a flat card list (e.g. `kanban.json`):

1. Group cards into 3–5 thematic epics of roughly equal size (4–8 cards each).
2. Prefer these epic themes:
   - **Critical Fixes** — all P1 findings + immediate stability patches
   - **Security & Performance** — privacy, hardening, resource leaks, responsiveness
   - **Architecture Refactor** — god-object decomposition, DI, testability
   - **Polish & Cleanup** — dead code, constants, naming, minor fixes
3. Create the epic lists and info cards first, then distribute the cards.
4. Preserve the original card IDs (P1-001, P2-003, etc.) in execution card
   titles for traceability.

### Done gate

An epic is **complete** only when every execution card that carries the epic
label is in `Done`. Info cards, runner cards, and any non-labeled cards do not
count toward the gate.

## Trello ↔ Memory Sync Rule

The Trello board is the SSOT for project progress. Memory must reflect the board.

When this skill says `.MEMORY`, it means the canonical manager memory tree on
`pets` at `/home/pets/TOOLS/manager_wezterm_cli/.MEMORY/`, even if the board is
being driven from another host. A local mirror is not the SSOT.

- **Before starting work** → create or move card to appropriate column
- **When blocked** → move to "Blocked" column with blocker description
- **When ready for review** → move to "Review"
- **At end of session** → verify `.MEMORY/NOW.md` matches board state
- **On every stage boundary** → add a Trello comment in the same action chain
- **On meaningful milestones** → comment is optional but encouraged
- **On final completion** → final verdict comment is mandatory
- **Never change board state silently** → list move and human-facing comment must
  stay paired

## Workflow Lane Execution Rule

When this skill is used to drive execution cards through workflow lanes,
including runs coordinated by harness-spawned subagents:

- `Review` is not just a list name; run `codex_wp review ...` first
- every `Review` move must have a same-chain Trello comment with the review
  verdict and the relevant `codex_wp review` report summary
- `Simplification` is not just a list name; run `$code-simplification` first
- every `Simplification` move must have a same-chain Trello comment that says
  what was simplified or why no safe simplification change was needed
- `Auto-commit` is not just a list name; run `$auto-commit` first
- every `Auto-commit` move must have a same-chain Trello comment with commit
  evidence: short hash plus commit subject, or a truthful blocked verdict
- if a lane-specific action has not happened yet, do not move the card into or
  out of that lane early
- workers may do repo work in parallel, but the manager should centralize the
  final move/comment step so Trello truth stays coherent
- **objective proof lives in the runner's `.jsonl` audit stream:**
  `automation/verify/verify-epic-compliance.py` cross-references every Trello
  list move against the actual `command_execution` events in the JSONL. A
  transition counts as verified only when the matching CLI command appears in
  the audit trace. Target: ≥95 % of transitions verified per epic run.

## Native Harness Observation Rule

When the operator wants live epic-runner progress with a smoother manager
experience:

- prefer spawning a native harness subagent in parallel as a dedicated
  observer/proof surface while the manager continues orchestration
- keep Trello truth centralized: the manager owns list moves, review/simplify/
  auto-commit lane decisions, and final comments unless the delegation is
  explicitly widened
- the observer should report progress with one compact visual line, for
  example:
  `Current EPIC #0 snapshot: █████████████████░░░  ~83%`
- derive that bar from live Trello counts for real execution cards only:
  `Done | In Progress | Remaining`
- exclude the top info card and the runner anchor card from the counts and the
  percentage
- refresh the bar on meaningful lane transitions and whenever the operator asks
  to observe the run
- the bar is a presentation layer only; Trello state and linked execution
  evidence remain the proof surface

## Common Pitfalls

1. `create-card --desc` is broken — use `update-card --desc` instead
2. `add-label` needs label ID, not name — run `list-labels` first
3. `list-cards` output is sparse — use `card-info` for full details
4. Position is numeric, not "1st"/"2nd" — use powers of 2 for insertion
5. `create-list` args: `<name> <board_id> <pos>` — pos is third positional arg, not a flag
6. Board must exist before cards; list must exist before cards
7. Labels are board-scoped — label IDs don't transfer between boards
8. Runner cards are not normal task cards — keep them in `Epics Runners`, keep
   them free of epic labels, and do not run them through workflow lanes
