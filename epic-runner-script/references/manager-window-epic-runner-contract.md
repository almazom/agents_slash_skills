# Manager Window Epic Runner Contract

Use this reference when the task is specifically about the `manager_window`
epic launcher pattern.

## North-pole paths

- local repo root:
  `/Users/al/zoo_apps/manager_window/`
- local headless docs:
  `/Users/al/zoo_apps/manager_window/automation/headless/README.md`
- local template pack:
  `/Users/al/zoo_apps/manager_window/automation/headless/templates/shehroz-long-run-trello-ssot/`
- local generic launcher:
  `/Users/al/zoo_apps/manager_window/automation/headless/run-shehroz-epic-v2.sh`
- local epic launcher example:
  `/Users/al/zoo_apps/manager_window/automation/headless/run-shehroz-epic-1-one-live-codex-session-v2.sh`
- local epic launcher example 2:
  `/Users/al/zoo_apps/manager_window/automation/headless/run-shehroz-epic-2-no-password-dev-test-e2e-v2.sh`
- local skill root:
  `/Users/al/.agents/skills/`
- pets skill root:
  `/home/pets/.agents/skills/`
- pets headless north pole:
  `/home/pets/TOOLS/manager_wezterm_cli/automation/headless/`

## Card order contract

- each execution epic list keeps one emoji info card at the top
- that card explains what Al will feel and see when the epic is done
- that card is informational only
- that card must not carry the execution label used for epic completion
- the dedicated runner card lives in the Trello list `Epics Runners`, not as
  the second visible card inside the execution epic list
- treat that runner card as an informational control anchor, not as the first
  real implementation card for the epic
- the runner card owns the epic-specific launcher and should clearly point to
  the bash non-stop all-epic runner
- every runner card description must expose the exact launch command with an
  explicit hook budget, for example:
  `HOOK_TIMES=80 /Users/al/zoo_apps/manager_window/run-shehroz-headless.sh`
- keep the generic fallback as `run-shehroz-epic-v2.sh`
- every dedicated epic launcher must include a short epic slug in the filename,
  for example `run-shehroz-epic-1-one-live-codex-session-v2.sh`

## Completion contract

- the real stop boundary is the epic label, not the launcher name
- do not call the epic done from one list glance alone
- an epic is done only when every execution card carrying that epic label is in
  `Done`
- every execution card moved to `Done` must get:
  one Trello move, one Trello comment in the same action chain, and one
  Mattermost-only `$notify-me` message right after that final Trello comment

## Visible runner communication contract

- standard same-tab visible topology stays:
  `left manager -> right runner worker -> mini observer under worker`
- in that standard topology, the manager pane is expected to be both:
  - the left pane
  - the lowest `pane_id` in the current tab
- if those facts disagree, treat the run as topology drift and re-resolve with
  live pane inspection instead of guessing
- prefer the local `p2p` CLI for runner-to-manager delivery:
  - `p2p --ids`
  - `p2p --pane-id "$MANAGER_PANE_ID" --submit '...'`
  - `p2p tail --pane-id "$MANAGER_PANE_ID" --lines 40`
- major runner events that should wake the manager pane are:
  - blocker or decision-needed state
  - major scope or contract change
  - final epic completion or idle boundary
- the final visible runner wakeup must explicitly ask Shehroz to:
  - inspect SSOT and run results
  - notify the operator
  - decide the next step independently
  - start the next epic runner without waiting if the current epic result is
    acceptable
- preferred final wakeup shape:
  `Shehroz, runner pane <id> idle. EPIC #N finished. Review SSOT/results, notify Almaz, and if the result is acceptable, decide the next step yourself and start the next epic runner without waiting.`

## Dual-home sync contract

When the stable epic-runner skill contract changes:

1. update the local skill files under `/Users/al/.agents/skills/`
2. update the local repo docs/templates if the contract lives there too
3. sync the skill update to `pets` under `/home/pets/.agents/skills/`
4. sync any matching north-pole docs/template changes to
   `/home/pets/TOOLS/manager_wezterm_cli/automation/headless/` when relevant
5. verify the new rule exists on both sides before ending the turn
