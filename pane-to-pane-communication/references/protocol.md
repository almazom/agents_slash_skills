# Pane-to-Pane Protocol

Use this reference when the question is not "can WezTerm control panes at all?"
but "what exactly can we prove about delivery into the other pane?"

## Proven Delivery Model

### What is real

- `wezterm cli send-text --pane-id <id> --no-paste ...` injects bytes into the
  PTY of the target pane
- this is strong enough to drive a shell in another pane
- this is also strong enough to drive an interactive Codex session when Codex
  is visibly idle at its prompt
- in this observed environment, the reliable submit primitive depends on the
  target pane program:
  - shell panes use `printf '\r' | wezterm cli send-text --pane-id <id> --no-paste`
  - visible Codex panes in WezTerm use
    `printf '\033[13u' | wezterm cli send-text --pane-id <id> --no-paste`
- `pane_id` is local to the host that owns the WezTerm mux; a remote node must
  relay onto that owner host before using the same `pane_id`
- the current helper CLI `p2p` encodes the same current truth in a reusable
  form: `p2p --pane-id <id> --submit '...'` means text first, then the
  target-matched submit sequence

### What is not real

- there is no separate CLI primitive that targets "the Codex input field"
- focus change is not the routing mechanism for `send-text`
- UI appearance alone is not a reliable acknowledgement
- do not assume `wezterm cli send-key` exists in the current build
- do not assume `newline appended to send-text payload` is equivalent to a
  clean Enter submit for live Codex panes
- do not assume plain `'\r'` is a universal submit for visible Codex panes in
  WezTerm; it can create a new line in the composer without starting the run
- do not assume a remote host such as `pets` can directly target a pane that
  actually lives on `al`; SSH relay to the owner host is required first

## Routing Truth

Primary selector:
- `--pane-id <id>`

Secondary ritual:
- `activate-pane --pane-id <id>`

Interpretation:
- `activate-pane` can make the visible behavior easier to reason about
- `send-text` still routes by `pane_id`, not by current focus

## Proof Surfaces

### Shell pane

Strongest proof:
1. pane tail shows the command echo or output
2. file artifact or other side effect matches

### Interactive Codex pane

Strongest proof for a tiny prompt:
1. actual Codex prompt was visible before submit
2. pane tail shows the prompt and the answer
3. a `30s` watch shows return to idle or stable next state

Strongest proof for a real manager-owned handoff:
1. actual Codex prompt was visible before submit
2. sender injected the text
3. sender injected Enter as part of the same handoff
4. a `30s` watch shows real runtime movement, answer, or a truthful degraded
   state such as `submitted-but-no-answer`

Default strict rule:
- if text was inserted into a live `codex_wp` prompt for real work and the run
  was not explicitly framed as a no-Enter probe, Enter should follow
  immediately in the same action chain
- do not leave task text sitting unsent while still describing the pane as an
  active worker handoff

If Enter was not sent:
- report only `unsent input visible`
- do not describe the worker as started or the handoff as complete

Strongest proof for a no-Enter live-pane relay:
1. the target Codex pane was intentionally left without Enter
2. a recent pane-tail snapshot shows the exact unsent line
3. the claim stays PTY-level: visible unsent input, not widget-specific delivery
4. if the next relay step must stay separable, prove that the previous unsent
   line was cleared before injecting the next one

### Worker stop wakeup

Strongest proof:
1. stop artifact such as `stop-hook-event.json`
2. transcript or final pane state
3. manager-pane wakeup line delivery status

## Recommended Sequences

### Manager -> shell pane

1. Spawn shell pane.
2. Confirm pane id and location.
3. Send command text with `--pane-id`.
4. Send Enter separately.
5. Verify pane output and side effect.

Helper-CLI shape:

```bash
RIGHT="$(p2p split-right --percent 45)"
p2p --pane-id "$RIGHT" --submit 'printf PTP_OK >/tmp/ptp-ok.txt'
```

### Manager -> interactive Codex pane

1. Spawn shell pane.
2. Launch `codex_wp --no-alt-screen`.
3. Read until the real Codex prompt is visible.
4. Send prompt text with `--pane-id`.
5. Send the target-correct submit boundary as part of the same manager-owned
   handoff.
6. Watch for `30s`.
7. Verify answer and steady end state.
8. If a rate-limit or model-switch reminder appears after the answer, clear it
   and re-check the real prompt before sending the next relay.

Visible Codex raw form:

```bash
printf '%s' "$PROMPT_TEXT" | wezterm cli send-text --pane-id "$TARGET_PANE" --no-paste
printf '\033[13u' | wezterm cli send-text --pane-id "$TARGET_PANE" --no-paste
```

Rule:
- if the manager stops after step 4 and leaves Enter to the operator, the
  truthful result is only `prompt text injected`, not `interactive handoff
  completed`
- if Enter was sent but the `30s` watch still shows no runtime movement, the
  truthful result is `submitted but not proven active`, not `worker started`

Observed practical variant:
- a startup warning/interstitial can still absorb the first Enter boundary
- on visible Codex panes, plain `'\r'` can also degrade into a new line in the
  composer instead of a true submit
- if the prompt is transcript-visible but the answer does not start, an extra
  explicit `Enter` may convert `submitted prompt delivered` into a completed
  tiny answer
- report that as degraded startup discipline, not as nonexistent delivery

### Remote host -> owner host -> target pane

Use this when the sender logic is on `pets` but the target pane lives on `al`.

1. Confirm from SSH mesh that `pets` can reach `al`, directly or through the
   currently approved return-path pattern.
2. SSH onto the owner host of the pane.
3. Run the exact local submit there, matching the target pane program:
   - text: `printf '%s' "$PROMPT" | wezterm cli send-text --pane-id <peer> --no-paste`
   - shell target: `printf '\r' | wezterm cli send-text --pane-id <peer> --no-paste`
   - visible Codex target: `printf '\033[13u' | wezterm cli send-text --pane-id <peer> --no-paste`
4. Verify from the owner host pane that the line was actually submitted.

Rule:
- cross-host delivery is a relay problem first and a pane problem second
- the truthful executor of `wezterm cli` is the host that owns the pane

### Worker -> worker interactive Codex pane

1. Keep both workers on clean prompt-ready Codex panes.
2. In the sender worker prompt, explicitly forbid `send-key`.
3. In the sender worker prompt, explicitly forbid newline-submit.
4. Name the exact relay commands the sender must run:
   - preferred helper form: `p2p --pane-id <peer> --submit "$PROMPT"`
   - raw visible-Codex form:
     `printf '%s' "$PROMPT" | wezterm cli send-text --pane-id <peer> --no-paste`
     then
     `printf '\033[13u' | wezterm cli send-text --pane-id <peer> --no-paste`
5. Verify from the sender transcript that both commands really ran.
6. Verify from the target pane that the prompt left `unsent input visible` and
   reached `Working`, answer, or another truthful submitted state.

If the sender improvises into `send-key`:
- classify the relay as failed on submit primitive, even if text routing worked

If the sender improvises into newline-submit:
- classify the relay as degraded until the target pane proves a real started
  run; visible pasted or duplicated input is not enough

If the sender improvises into plain `'\r'` on a visible Codex pane:
- classify the relay as degraded until the target proves a real started run;
  a new editable line in the composer is not yet a submit

If the operator explicitly requires a fixed pair:
- do not swap the investigation onto fresh panes just because fresh panes are
  easier to reason about
- keep the proof loop on that named pair and classify what broke there:
  routing, submit, active runtime, or reply completion

### Dedicated-pair baseline acceptance

Use this before any `10+` round repeatability claim on a newly chosen pair.

1. Verify both panes are real idle Codex prompts.
2. Run one minimal rebound only:
   target should emit `PING_X`, peer should receive `PONG_X`.
3. Re-read both panes.
4. Accept the pair as series-ready only if:
   - `PING_X` is visible on the target
   - `PONG_X` is visible on the peer
   - both panes are back at real idle Codex prompts

If any of those fail:
- classify the pair as not yet series-ready
- do not promote it into a longer ping-pong drill
- either re-baseline the same pair or replace it deliberately

Shell-first companion baseline:

```bash
PAIR="$(p2p pair-shell --percent 45)"
echo "$PAIR"
p2p ping-pong-shell --left <left> --right <right> --tag baseline1
```

Use this before Codex bounce drills when the main uncertainty is still raw
transport rather than assistant behavior.

### Worker -> live manager Codex pane without Enter

1. Keep the manager pane as a protected live Codex surface.
2. Send the relay text with `--pane-id <manager>` and no Enter.
3. Read a recent viewport-tail snapshot such as `--start-line -40 | tail -20`.
4. Treat a visible unsent line as PTY-level proof only.
5. If only deep scrollback grep is available and it misses the line, do not
   over-claim widget delivery.

### Fresh-pane safe Enter submission

1. Spawn or pick a truly clean controlled pane.
2. Re-check that the pane still exists immediately before the send.
3. Send a tiny prompt with `--pane-id <fresh>` plus Enter.
4. Verify the answer from that pane.
5. If a reminder/interstitial appears after the answer, clear it before reuse.

Possible degraded outcome:
- the prompt becomes transcript-visible in the target pane
- the target later returns to an idle prompt
- no assistant answer line appears

Report this as:
- `PROVEN: interactive Codex prompt delivery`
- `NOT PROVEN: completed assistant answer`

If Enter was never sent, report instead:
- `PROVEN: unsent input visible in target pane`
- `NOT PROVEN: prompt submission`

### Short batched reused-pane relay

1. Reuse the existing named panes only if both still exist and the target
   role/prompt surface still matches the next probe.
2. Keep the exchange in batches of `2-3` messages.
3. Before each new no-Enter injection into the same live target pane, perform
   an explicit line-clear step when message separation matters.
4. Verify that clear step from a fresh pane-tail read before sending the next
   payload.
5. Record per step:
   - send attempted
   - execution proven
   - reply proven
6. Extend the lesson only if the batch still preserves transport truth.
7. If `Ctrl+U`, backspace, or similar clear bytes fail to change the visible
   Codex input line, mark `clear not proven` and stop or reinitialize the pane
   before the next no-Enter turn.
8. Treat repeated `Ctrl+C` as a destructive branch: it may first step back the
   live input state and then kill the pane on the next send.

### Sustained human conversation mode

Use this only after short-batch mode is stable enough.

Goal:
- the pane-to-pane exchange should feel like a believable human conversation
  lasting `5+` minutes, not a string of isolated transport probes

Required gate before entering:
1. at least two short batches completed without pane loss
2. no unresolved `clear not proven` blocker on the active pair
3. no active reminder/interstitial that would make the next turn ambiguous
4. recent turns still show reply linkage rather than transcript-only drift

How to run it:
1. keep the same named panes if they remain truthful
2. shift prompts from command wording to natural dialogue wording
3. allow short real-time pauses between turns so the rhythm feels human
4. keep the topic continuous across multiple turns instead of resetting every
   message into a new probe
5. checkpoint every `2-3` turns:
   - transport still healthy?
   - continuity still healthy?
   - reply still linked to prior turn?
6. after each visible no-Enter human turn, restore the target pane to a known
   prompt-ready state before continuing

When to degrade back down:
- input separation stops being provable
- replies stop referencing the previous turn
- the pane drops into `submitted-but-no-answer`
- the session needs a reinit boundary

Report this mode with both layers:
- `PROVEN: transport still healthy`
- `PROVEN: conversation continuity still healthy`

### Post-reply cleanup on a clean pair

Use this when a natural no-Enter line is visibly sitting in the Codex input
field and the pane is otherwise prompt-ready.

1. Confirm the pane is not in a running/thinking state.
2. Activate the pane.
3. Send a burst of backspaces sized generously for the visible line.
4. Read a fresh pane snapshot.
5. Accept cleanup only if the default Codex placeholder is back.

Current proven example:
- clean pair `145 <-> 144` on `2026-04-11`
- backspace bursts restored:
  - pane `145` from `Hello Shehroz... [hc1]` and later `... [hc3]`
  - pane `144` from `Good. Let us keep the rhythm calm and natural. [hc4]`

Report this as:
- `PROVEN: post-reply cleanup restored prompt-ready state`

### Worker -> manager wakeup

1. Install temporary stop hook with both pane ids.
2. On stop, write run-root artifact first or in the same hook execution.
3. Send short manager wakeup line with `--pane-id <manager>`.
4. Record whether wakeup send succeeded.
5. Manager reviews artifact plus pane state before deciding next step.

## ACK Patterns

If delivery must be more reliable than "I saw text in the pane," add one of
these:

### File ACK

- target pane writes an ack file to a known location
- sender or manager verifies file contents

### Transcript ACK

- for interactive Codex, verify the session transcript contains the expected
  user message and assistant response

### Run-root ACK

- hook writes structured JSON containing `attempted`, `sent`, pane ids, and
  the delivery text

## Failure Modes

### Wrong pane

- stale pane id
- pane closed and id no longer exists

Fix:
- re-resolve with `wezterm cli list --format json`

### Dirty prompt surface

- leftover typed input, failed-relay transcript, or reminder screen makes a
  safe Enter-submitted follow-up untrustworthy

Fix:
- classify that pane as dirty/non-reusable for the next safe Enter probe
- prefer a fresh pane or clear and re-validate the pane first

### Concatenated unsent line

- repeated no-Enter injections into the same live pane merge into one visible
  current input line, so message-by-message proof is lost

Fix:
- clear the target input line between injections when separation matters
- verify the cleared state from a recent pane-tail snapshot before continuing

### Unsupported send-key assumption

- a worker may discover or assume `wezterm cli send-key`, then build its relay
  plan around a command the local WezTerm CLI does not actually provide

Fix:
- forbid `send-key` in the sender prompt up front
- require an explicit `send-text --no-paste` submit boundary that matches the
  target pane program
- prove both relay commands in the sender transcript before trusting the relay

### Newline-submit illusion

- a worker may try to submit by appending newline inside the `send-text`
  payload; the target pane can then show pasted or duplicated visible input
  without a clean started turn

Fix:
- treat newline-submit as unproven for live Codex panes in this environment
- prefer a separate keyboard-style Enter `ESC [ 13 u` as the submit boundary
- if the target pane shows duplicated or still-editable input, reinitialize or
  clear the pane before the next relay

### Fixed-pair conversational overload

- on a long-lived fixed Codex pair, a submitted prompt can correctly enter
  `Working` yet still fail to produce a timely assistant line because the
  session surface is overloaded by prior transcript, instructions, or context

Fix:
- classify this as `submitted and active` plus `answer not timely`, not as a
  transport failure
- keep the pair fixed if the operator asked for that constraint
- reduce prompt size, reduce dialogue baggage, or deliberately re-baseline the
  same pair before the next ping-pong attempt

### Active-operator pane contamination

- if one pane in the fixed pair is the operator's currently active Codex pane,
  the pane can show `Working` because of the operator's own live turn rather
  than because of the injected peer prompt

Fix:
- do not use bare `Working` on that pane as the primary proof of peer-submit
- prefer proof that the exact injected prompt became transcript-visible
- prefer returned markers arriving on the non-operator peer pane
- when possible, give the active operator pane a quiet window before expecting
  it to complete the bounce back

### Multi-action bounce collapse on fixed active pane

- an exact bounce prompt can become transcript-visible on the fixed active pane
  and the pane can stay in `Working` for a long quiet window, yet still never
  emit the returned marker on the peer pane

Fix:
- classify this as `submit proved, follow-through failed`
- do not count it as a successful bounce
- reduce the task on the same fixed pair into smaller phases:
  one-line reply first, shell relay second, recombined bounce later

### Dedicated-pair rebound success

- on a dedicated fixed pair that is not hosting the operator's live chat, a
  smaller rebound prompt can complete cleanly:
  target pane emits `PING_X`, then shell-relays `PONG_X` back to the peer

Proof surface:
- target pane transcript contains `• PING_X`
- peer pane transcript contains `• PONG_X`

Operational implication:
- if active-pane contamination blocks repeatability, move the lesson to a
  dedicated fixed pair rather than broadening the prompt complexity

### Dedicated-pair intermittent rebound

- even on a dedicated pair, a longer series can degrade intermittently:
  in one observed run on `166 <-> 167`, `PONG_G1`, `PONG_G2`, `PONG_G3`,
  `PONG_G5`, `PONG_G6`, and `PONG_G8` returned visibly, while `G4` and `G7`
  became visible on the target pane without a visible returned `PONG`

Fix:
- classify this as `transport works, series discipline insufficient`
- add prompt-ready checks on both panes between rounds
- re-baseline the same fixed pair before retrying a longer series

### Dedicated-pair Ctrl+C kill boundary

- on one observed dedicated pair reset attempt, sending `Ctrl+C` to both panes
  caused both panes to disappear instead of returning them to prompt-ready idle

Fix:
- do not assume `Ctrl+C` is a safe soft reset on dedicated Codex pairs
- prefer prompt-ready waiting, explicit shell-level cleanup, or controlled pair
  replacement over blind `Ctrl+C` resets

### Clear bytes ignored by Codex TUI

- `Ctrl+U` and backspace sent through `wezterm cli send-text` may fail to
  clear the visible Codex input line even though normal text injection works

Fix:
- treat `clear not proven` as a real blocker for the next no-Enter step
- freeze the current batch or reinitialize the target pane before continuing

### Ctrl+C as reinit boundary

- in a live Codex pane, `Ctrl+C` may not behave like a simple clear key
- one send can cancel the current unsent line or expose an earlier one
- a repeated send can terminate the pane entirely

Fix:
- use `Ctrl+C` only when you are willing to cross into pane reinitialization
- after a pane dies, repair the same-tab worker slot explicitly and do not
  pretend the original pane remained reusable

### Leftover-pane illusion

- a user-visible pile of extra panes can look like a still-running background
  pane opener even after the spawning script has already died

Fix:
- inspect the process table before claiming a live runaway loop
- distinguish `live loop still opening panes` from `dead loop left panes
  behind`
- if no loop process exists, clean up leftover panes without over-reporting an
  active automation fault

### Dirty dedicated-pair misclassification

- a pair can live in its own tab and still be unusable for proof because one
  pane contains an old foreign Codex transcript, a shell, or a half-started
  worker rather than a real idle prompt

Fix:
- verify both panes from fresh reads before calling the pair dedicated/clean
- require actual idle Codex prompts on both sides, not merely pane existence
- if one pane fails that check, re-baseline or replace the pair before the
  next repeatability claim

### Minimal dedicated-pair half-bounce failure

- a fresh dedicated pair can still fail its first minimal rebound
- on observed pair `177 <-> 178`, the target produced `PING_H1`, but the peer
  reported `ROUND_H1_FAIL` instead of a visible `PONG_H1`

Fix:
- treat this as `target-side turn happened, return relay not proven`
- do not generalize success from a prior pair onto the new pair
- require one passing baseline round on the exact current pair before any
  longer series or reliability percentage claim

### Shell instead of Codex

- prompt sent before Codex launched

Fix:
- wait for actual Codex prompt before sending the real task prompt

### Codex interstitial

- update screen or another startup interstitial absorbs the first Enter

Fix:
- clear the interstitial first
- prefer `codex_wp --no-alt-screen` for readable startup diagnosis

### Post-answer reminder screen

- rate-limit/model-switch reminder appears after a valid answer and before the
  next prompt

Fix:
- clear or answer the reminder first
- re-check the real idle Codex prompt before the next `send-text`

### Fast-exit pane

- `exec codex_wp` can make the shell disappear with the child process

Fix:
- prefer `codex_wp --no-alt-screen` without `exec` during transport testing

## Decision Rule

When reporting status, use one of these statements exactly:

- `PROVEN: pane-targeted shell delivery`
- `PROVEN: interactive Codex prompt delivery`
- `PROVEN: worker-to-manager wakeup delivery`
- `PROVEN: PTY-level unsent input visible in target Codex pane`
- `PROVEN: prompt became transcript-visible in target Codex pane`
- `NOT PROVEN: Codex-specific widget delivery`

That keeps the claims honest.
