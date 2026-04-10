# Long-Run Hook-Loop Reference

Use this when one worker should continue through repeated stop events instead
of relying on one uninterrupted session.

## Contents

- Help probe before raw launch
- Canonical rules
- Preferred local shape
- Preferred remote artifact-backed shape
- Remote launch rule
- Observability defaults
- Dirty-repo rule
- Operator-care handoff

## Help Probe Before Raw Launch

If you are about to:
- type raw `codex_wp ... exec ...` text through `send-text`
- compose a launcher script around `codex_wp exec`
- launch through a remote shell where quoting can drift

first run:

```bash
codex_wp exec --help
```

Run that probe in the same runtime context that will launch the worker.

## Canonical Rules

- use `codex_wp exec --json` for headless continuation runs
- `--hook-times <n>` is a resume budget, not proof of progress
- use `--hook-prompt-mode hybrid` when you need a fixed fallback resume prompt
- do not combine `--hook-prompt` with `--hook-prompt-mode auto`
- use `--hook-auto-stop-on-complete` only with `auto` or `hybrid`
- make the resume prompt force SSOT, diff, and artifact rereads
- allow finalization steps such as `$code-simplifier` or `$auto-commit` only
  after the full parent plan is complete

Bad shape:

```bash
codex_wp --hook stop --hook-prompt "continue" --hook-times 3
```

Why it is bad:
- vague recovery prompt
- no explicit `exec --json`
- does not force SSOT reread
- can loop without truthful progress

## Preferred Local Shape

```bash
codex_wp exec --json \
  -C /abs/repo \
  -f /abs/plan-or-context-file \
  "Implement the next unfinished task truthfully. Re-read the SSOT, current git diff, and latest task artifacts before each step. Do not claim completion early." \
  --hook stop \
  --hook-times 30 \
  --hook-prompt-mode hybrid \
  --hook-prompt "Re-read the SSOT, current git diff, and latest artifacts. Continue only the next unfinished task. If and only if the full plan is complete, run \$code-simplifier, then \$auto-commit, then stop." \
  --hook-auto-stop-on-complete
```

## Preferred Remote Artifact-Backed Shape

1. Create a run root such as `/tmp/<run-id>`.
2. Write `prompts/initial_prompt.txt` with the 6-field task packet.
3. Write `prompts/hook_prompt.txt` with the strict resume prompt.
4. Launch through a small `run.sh` script that:
   - changes into the target repo
   - runs `/bin/bash /home/almaz/.local/bin/codex_wp exec --json ...`
   - tees output into `results/worker-terminal.log`

Recommended packet shape inside `initial_prompt.txt`:

```text
WORKDIR: /abs/repo
CONTEXT: remote repo plus active SSOT package or plan
PROBLEM: the operator wants truthful non-stop implementation on the remote host
TASK: continue only the next unfinished task
DONE:
  - SSOT reflects the real next stage
  - verification artifacts are saved
  - unrelated user changes are preserved
REFERENCES:
  - /abs/ssot-file
  - /abs/card-or-plan
  - /abs/extra-context
```

## Remote Launch Rule

When starting the remote launcher through SSH, prefer:

```bash
ssh -n <host> 'bash /tmp/<run-id>/run.sh'
```

Leaving stdin open can make `codex_wp exec` wait for EOF and stall.

## Observability Defaults

For this pattern:
- `FIRST SNAPSHOT`: immediately after spawn
- `NEXT SNAPSHOT`: `60s`
- `HEARTBEAT CADENCE`: every `60s`
- `STOP CONDITIONS`: healthy progress | blocked | done | failed startup |
  operator stop

Heartbeat reports should stay short:
- current card or task
- movement vs no-change
- next manager interpretation

## Dirty-Repo Rule

A dirty repo is not an automatic blocker for this pattern.

Rules:
- preserve unrelated user changes
- keep the active task scope truthful
- if commit hygiene is the truthful next step, `$auto-commit` may be allowed
- do not blindly commit unrelated unknown changes

## Operator-Care Handoff

For very long background runs:

1. save a durable re-entry checkpoint first
2. say plainly that the run may take a while
3. tell the operator it is safe to close the notebook or switch context
4. mention a real notification path only if it is actually verified
5. remind the operator how to re-enter: pane, log, and SSOT path

Preferred tone:
- calm
- practical
- low-pressure
