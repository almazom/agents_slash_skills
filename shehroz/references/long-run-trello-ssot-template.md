# Long-Run Trello-SSOT Template Reference

Use this when the operator asks for:
- long non-stop run
- bash runner
- stop hook
- Trello as SSOT
- Shehroz-managed epic execution

This reference extends:
- `references/runtime-preflight.md`
- `references/long-run-hook-loop.md`

## North-pole paths

- pets standard:
  `/home/pets/TOOLS/manager_wezterm_cli/automation/headless/templates/shehroz-long-run-trello-ssot/`
- manager_window local mirror:
  `/Users/al/zoo_apps/manager_window/automation/headless/templates/shehroz-long-run-trello-ssot/`

## Pack contents

- `README.md`
- `shehroz-long-run-trello-ssot.sh`
- `prompts/initial-prompt.template.md`
- `prompts/resume-prompt.template.md`
- `memory/session-note.template.md`
- `trello/comment-3-bullets.template.md`

## Required behavior

- use `codex_wp` only, never raw `codex`
- Trello board is the SSOT for work state
- every real list move needs a matching Trello comment
- Trello move/comment must happen in the same action chain
- `Review` means `codex_wp review ...`
- `Simplification` means `$code-simplification`
- `Auto-commit` means `$auto-commit`
- when harness-spawned subagents are used, workers may prepare the repo state
  but the manager still owns the Trello move contract
- every `Review` move/comment must include the `codex_wp review` verdict and a
  concise review report in Trello comments
- every `Simplification` move/comment must state what was simplified or why no
  safe simplification change was needed
- every `Auto-commit` move/comment must include commit evidence:
  short hash plus commit subject, or a truthful blocked verdict
- every card moved to `Done` must send one Mattermost-only completion
  notification through `$notify-me`
- outside those per-card `Done` notifications, use `$notify-me` only for major
  steps
- every meaningful turn must land in pets `.MEMORY/`
- after `NOW.md`, ask:
  `Where should this turn live after NOW.md?`

## Epic-centric organization contract

- for every execution epic list, keep one emoji info card at the top
- that emoji info card explains what Al will feel and see, is informational
  only, and must not carry the execution label used for epic completion
- keep the dedicated runner card in the Trello list `Epics Runners`, not as
  the second visible card inside the execution epic list
- treat the runner card as an informational control anchor, not as the first
  real implementation card for the epic
- that runner card owns the epic-specific bash launcher for the long run
- every runner card description must expose the exact launch command with an
  explicit hook budget, for example:
  `HOOK_TIMES=80 /Users/al/zoo_apps/manager_window/run-shehroz-headless.sh`
- keep the canonical launcher inside the project-local `automation/headless/`
  folder, not in repo root
- prefer one stable versioned launcher per epic, for example
  `automation/headless/run-shehroz-epic-<n>-v2.sh`
- the run stays alive until every execution card carrying the epic label is in
  `Done`, or a real blocker remains
- the wrapper name and one list glance are never enough to call the epic done
- each execution card moved to `Done` must send one short human-facing Russian
  Mattermost notification with card title, epic/list context, verdict, and next
  step or epic status when already clear
- when the epic runner is visible in the same tab, the runner must know the
  manager pane rule for that tab:
  `manager pane id = min(current-tab pane ids)` in the default
  `left manager -> right worker -> observer under worker` layout
- for manager communication in that visible layout, prefer local `p2p`
  commands over ad hoc send-text guesses
- major visible-runner events that should wake the manager are:
  - blocker or decision-needed state
  - major scope or contract change
  - final epic completion or idle boundary
- the final epic-complete wakeup should ask Shehroz to review SSOT/results,
  notify the operator, decide the next step independently, and start the next
  epic runner without waiting when the current result is acceptable

## How Shehroz should use it

1. Run transport/runtime preflight first.
2. If the epic layout is being created or normalized, enforce:
   `info card at top of execution list -> runner card in Epics Runners`
   before deeper execution.
3. Use the template pack as the launcher baseline.
4. Render prompt templates into a run root under manager memory.
5. Launch `codex_wp exec --json` with `--hook stop --hook-times <n>`.
6. If the runner is visible in the same tab, teach the runner the manager-pane
   rule and `p2p` wakeup path before leaving the run unattended.
7. Keep going until the epic is truly done or a real blocker remains.
8. Decide epic completion by full label gate, not by one list glance.

## Routing note

If the operator says words like:
- `long non-stop run`
- `stop hook`
- `Trello SSOT`
- `headless epic run`

load this reference before shaping the launcher.
