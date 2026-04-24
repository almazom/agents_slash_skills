---
name: pane-to-pane-communication
description: Design, validate, and operate pane-targeted message delivery between WezTerm panes, especially manager-worker wakeups, shell proof probes, and interactive Codex prompt delivery boundaries
triggers: pane-to-pane communication, panel-to-panel communication, pen-to-pen communication, inter-pane communication, cross-pane communication, pane communication, worker wakeup, manager wakeup, pane-to-pane, panel to panel, cross pane, send text to manager pane, send text to worker pane, codex input delivery, codex prompt delivery between panes
---

# Pane-to-Pane Communication

Use this skill when the task is specifically about getting information from one
WezTerm pane into another pane and proving what really happened.

This skill is about transport truth, not general worker orchestration.

## Use This For

- manager -> worker prompt delivery in another pane
- worker -> manager wakeup lines on stop
- shell-level proof that `wezterm cli send-text` hit the intended pane
- interactive Codex delivery tests where the main question is whether the pane
  accepted the prompt
- deciding whether focus change helps, hurts, or is irrelevant
- shaping a delivery/ack protocol for pane-targeted communication

## Do Not Use This For

- general WezTerm pane management with no transport/debugging question
- long-run worker orchestration by itself
- headless `codex_wp exec` continuation design
- pretending WezTerm has a semantic API for the Codex input widget

## Core Rules

1. The truthful target is the pane PTY, not a Codex-specific input widget.
2. `wezterm cli send-text --pane-id <id>` is the primary routing primitive.
3. `activate-pane` may help the visible ritual, but it is not the routing key
   for `send-text`.
4. For interactive Codex, do not send the real prompt until the actual Codex
   prompt is visible.
4a. When the goal is a real interactive Codex handoff rather than an unsent
    PTY-level probe, the sender owns the full submit sequence:
    send text, send Enter, then prove startup from a post-submit watch.
    Do not leave the Enter to the operator and still call the delivery
    complete.
4b. Default strict rule: if text was inserted into a visible `codex_wp`
    prompt and the run is not explicitly labeled a no-Enter transport probe,
    submit it immediately and run the `30s` post-submit observation in the
    same action chain. Do not leave real task text sitting unsent in the pane.
5. Prefer `codex_wp --no-alt-screen` for readable proof when validating prompt
   delivery into an interactive pane.
6. After any Codex answer, warning, or model-switch reminder, re-check that the
   real idle Codex prompt is back before sending the next prompt; an
   interstitial screen is a different state and can absorb the next Enter.
7. For shell delivery tests, require both pane output and a side-effect such as
   a file artifact.
8. For worker-stop wakeups, require both a run-root artifact and a manager-pane
   wakeup line when possible.
9. When reliability matters, design an ACK protocol; do not claim certainty
   from UI guesswork alone.
10. For visible manager-worker runs, prefer same-tab pane targets; do not
   silently switch the worker to another tab just because the current tab is
   busy or contains protected panes.
10a. For repeated transport lessons in the same session, prefer reusing the
    existing named panes if they are still prompt-ready and semantically match
    the next probe; do not spawn a fresh pane merely because a prior lesson
    already happened there.
11. For visible interactive Codex workers, do not assume that a bounded task
    ends when the `codex_wp` process exits; many runs end by returning to an
    idle Codex prompt while the process stays alive.
12. If manager wakeup must happen when a visible worker finishes its bounded
    turn, prefer detecting the worker-pane transition `ACTIVE -> IDLE` over
    waiting for wrapper or process exit.
13. For no-Enter injections into a live Codex pane, prove the result from a
    recent viewport-tail read first; deep scrollback search can miss the
    current unsent input line even when the pane visibly holds it.
14. For safe Enter-submitted probes, treat a pane with leftover typed input,
    failed-relay transcript, or reminder/interstitial state as dirty; prefer a
    fresh pane or re-validated prompt-ready pane instead of reusing it blindly.
14a. Treat the delivery ledger as three different truths:
    `unsent input visible`, `submitted prompt delivered`, and
    `assistant answer completed`.
    Do not collapse them into one generic "sent" claim.
14b. After Enter, require a real `30s` observation window before claiming that
    the pane is active now. If the pane still shows only typed text or no
    runtime movement, classify the handoff as incomplete or degraded, not
    healthy.
15. Treat `prompt became transcript-visible in the target pane` as stronger
    proof than unsent input, but still weaker than a completed answer; if the
    target returns to an idle prompt with no assistant line, classify that as
    `submitted-but-no-answer`, not as full success.
16. In long reused-pane loops, separate `command execution happened` from
    `assistant dialogue happened`; a pane may keep executing command-oriented
    prompts while mostly stopping its natural-language reply surface.
17. If repeated no-Enter injections hit the same live target pane, expect the
    visible payloads to concatenate into one current input line unless that
    line is cleared or submitted between messages.
18. If the same short wakeup line repeats after the repo-local hook file was
    already cleaned, treat that as stale loaded hook runtime inside a live
    Codex session; remove or restore the file, then replace or restart the
    affected session before calling transport clean.
19. When a manager or named worker assignment depends on pane-to-pane delivery,
    this skill is mandatory context, not an optional follow-up.
20. For repeated relay lessons, prefer short batches of `2-3` messages, then
    re-check prompt-ready state and transport truth before extending the loop.
21. If per-message separation matters, clear the current target input line and
    prove that clear step before the next no-Enter injection into the same
    live pane.
22. Keep a per-step transport ledger with at least:
    `send attempted`, `execution proven`, and `reply proven`.
23. Do not assume control-byte cleanup is available in a Codex pane:
    `Ctrl+U` or backspace sent through `wezterm cli send-text` may fail to
    clear the visible input line. If clear is not proven from a fresh pane-tail
    snapshot, stop the batch or reinitialize the pane instead of pretending the
    line is clean.
24. Treat `Ctrl+C` in a live Codex pane as a reinitialization boundary, not as
    a routine line-clear key: one send may cancel or step back the current
    input state, while repeated sends can terminate the pane entirely.
25. Use staged escalation for long conversational drills:
    `proof drill -> short batches -> sustained human conversation mode`.
    Do not claim human-like continuity until the lower stage is stable enough
    to support it.
26. On a clean prompt-ready Codex pane, a burst of backspaces may be the
    truthful post-reply cleanup method: if a fresh snapshot shows the default
    placeholder restored afterward, that pane is ready for the next natural
    turn.
27. For wrapped Codex input lines, do not rely on one exact full-line grep as
    the execution proof surface; prefer a short unique suffix marker or a
    time-window pane monitor, otherwise the ledger can undercount turns that
    were visibly present in the pane.
28. For worker-owned relay steps, do not assume this `wezterm cli` build has
    `send-key`; some builds expose `send-text` only. If `send-key` is missing,
    treat any plan that depends on it as invalid and fall back to an explicit
    proven submit boundary. Prefer `p2p --pane-id <id> --submit '...'` when it
    is available. Raw manual fallback depends on the target pane program:
    shell panes use
    `printf '%s' ... | wezterm cli send-text --pane-id <id> --no-paste`
    then
    `printf '\r' | wezterm cli send-text --pane-id <id> --no-paste`,
    while visible `codex_wp` panes in WezTerm use the same text send followed
    by
    `printf '\033[13u' | wezterm cli send-text --pane-id <id> --no-paste`.
29. In this environment, `newline appended to send-text payload` is weaker
    than a real separate submit boundary. On visible Codex panes, plain `'\r'`
    can also degrade into "new line in the composer" instead of a true submit.
    For reliable interactive Codex submission, prefer literal text injection
    first and a separate keyboard-style Enter `ESC [ 13 u` second. Keep `'\r'`
    for shell panes.
29a. `pane_id` is host-local to the WezTerm mux that owns it. A pane on `al`
    cannot be targeted directly from `pets` by reusing the same `pane_id`
    there. Cross-host delivery must relay onto the owner host first, then run
    the local `wezterm cli send-text` commands on that owner host.
29b. When cross-host pane delivery matters, keep the pane skill version synced
    across the participating hosts. After local updates on `al`, sync this
    skill to `pets` before calling the workflow stable.
29c. When the local helper CLI `p2p` is available, prefer it over ad hoc shell
    one-liners for repeatable lessons. The canonical public form is
    `p2p --pane-id <id> --submit '...'` or
    `p2p --direction <dir> --submit '...'`. Its `submit` contract is
    target-aware: shell panes use `'\r'`; visible Codex panes in WezTerm use
    `ESC [ 13 u`.
30. When asking one live Codex worker to message another live Codex worker,
    the sender prompt should explicitly forbid `send-key` and newline-submit
    and should name the exact two relay commands. Otherwise the worker may
    improvise into an unproven transport path even when plain `pane_id`
    routing itself is healthy.
31. If the operator explicitly constrains the lesson to two fixed panes, do
    not create additional panes or tabs for transport experiments unless the
    operator explicitly relaxes that constraint. Keep the write/read loop on
    the fixed pair and classify any degradation from within that pair instead
    of silently switching to fresh-pane research mode.
32. On a transcript-heavy fixed Codex pair, `submitted and active` may still
    degrade into a long `Working` state with no timely assistant line. Treat
    that as session-surface degradation, not as a routing or submit failure:
    the transport can already be proven while the conversational surface is no
    longer healthy enough for fast ping-pong.
33. If one member of the fixed pair is also the operator's currently active
    Codex pane, its visible `Working` state is contaminated by the operator's
    own live turn. Do not treat that `Working` badge alone as proof that the
    injected remote prompt is what is executing. In this case, rely on tighter
    proof surfaces such as the exact injected prompt becoming transcript-
    visible, the peer pane proving its relay commands, and any returned marker
    arriving back on the non-operator pane.
34. A multi-action bounce prompt can still fail on a fixed active operator
    pane even after the exact prompt becomes transcript-visible and a long
    `Working` state begins. If no returned marker arrives on the peer pane
    after a quiet window of about `90s`, classify that as `submit proved,
    conversational follow-through failed`.
35. When a fixed pair fails on a multi-action bounce prompt, the next truthful
    training step is to split the bounce into smaller phases on the same pair:
    first prove a one-line assistant reply, then prove a one-step shell relay,
    then recombine them. Do not jump straight from that failure back into a
    larger loop and pretend the pair is already stable.
36. A dedicated non-operator fixed pair can recover the missing repeatability.
    On a clean pair that is not hosting the operator's live chat, a minimal
    bounce prompt of the form `PING_X -> shell relay -> PONG_X` has now been
    proven end-to-end: pane `166` produced `PING_G1`, and pane `167` received
    `PONG_G1`.
37. Dedicated-pair repeatability is still not automatic. In a longer rebound
    run on pair `166 <-> 167`, visible returns succeeded for `G1, G2, G3, G5,
    G6, G8`, while `G4` and `G7` became transcript-visible on the target but
    did not return a visible `PONG`. Treat this as intermittent
    conversational-surface instability on an otherwise working transport.
38. For repeatable multi-round drills, require an explicit prompt-ready check
    between rounds on both panes, not just "got the previous PONG". A returned
    marker alone is weaker than `returned marker + both panes back at idle
    prompt`.
39. On a dedicated Codex pair, `Ctrl+C` is not a safe generic re-baseline.
    One observed attempt to reset panes `166` and `167` with `Ctrl+C` removed
    both panes entirely. Treat `Ctrl+C` as a possible pane-kill boundary even
    on non-operator pairs unless that exact pair has already proven softer
    behavior.
40. Distinguish a live runaway automation loop from leftover panes. One lesson
    looked like a still-running infinite pane opener, but `ps` showed no live
    `wezterm cli spawn/split/send-text` loop anymore; only the panes remained.
    Do not claim a background opener is still active until process inspection
    proves it.
41. A "dedicated pair" is not automatically clean just because it lives in a
    separate tab. Before using a pair for repeatability claims, verify both
    panes are real idle Codex prompts, not an old foreign transcript, a shell,
    or a half-started pane.
42. Even on a freshly rebuilt dedicated pair, a first minimal rebound can fail.
    On pair `177 <-> 178`, the target pane produced `PING_H1`, but the peer
    pane returned `ROUND_H1_FAIL` instead of a visible `PONG_H1`. Treat this
    as a stricter baseline: minimal rebound still needs explicit validation on
    each new pair before starting any longer series.
43. A new dedicated pair earns "series-ready" status only after one explicit
    baseline round passes on that exact pair:
    `PING_X visible on target`, `PONG_X visible on peer`, and both panes back
    at real idle Codex prompts. Same-tab placement or fresh spawn alone is not
    enough.

## Read This For

| Need | Read |
|------|------|
| Delivery model, limits, proof surfaces, and ACK patterns | `references/protocol.md` |
| Current helper CLI usage and live command examples | `references/examples.md` |

## Minimal Working Patterns

### Shell proof

```bash
wezterm cli send-text --pane-id "$TARGET_PANE" --no-paste "printf 'ok\\n' | tee /tmp/pane-ack.txt"
sleep 0.3
wezterm cli send-text --pane-id "$TARGET_PANE" --no-paste $'\r'
```

Verify:
- pane tail shows `ok`
- `/tmp/pane-ack.txt` contains `ok`

Helper-CLI equivalent:

```bash
p2p --pane-id "$TARGET_PANE" --submit "printf 'ok\\n' | tee /tmp/pane-ack.txt"
```

### Interactive Codex proof

```bash
wezterm cli send-text --pane-id "$TARGET_PANE" --no-paste "codex_wp --no-alt-screen"
sleep 0.3
wezterm cli send-text --pane-id "$TARGET_PANE" --no-paste $'\r'
```

Then wait for the real Codex prompt before sending the task prompt.

Helper-CLI equivalent:

```bash
p2p --pane-id "$TARGET_PANE" --submit 'codex_wp --no-alt-screen'
```

Note:
- this launch step still targets a shell pane, so the submit boundary here is
  shell-style `'\r'`
- only after Codex is visibly idle at its prompt should you switch to the
  visible-Codex submit contract below

### Submitted interactive Codex handoff

```bash
wezterm cli send-text --pane-id "$TARGET_PANE" --no-paste "$PROMPT_TEXT"
sleep 0.3
printf '\033[13u' | wezterm cli send-text --pane-id "$TARGET_PANE" --no-paste
sleep 30
wezterm cli get-text --pane-id "$TARGET_PANE" --start-line -80 | tail -40
```

Verify:
- the target Codex prompt was visible before the send
- Enter was sent by the same sender who claims the handoff
- the `30s` watch shows real runtime movement or a truthful degraded state
- if Enter was not sent, report only `unsent input visible`, not a started run
- if Enter was sent but the `30s` watch shows no movement, report the pane as
  `submitted but not proven active`, not as a clean start

Helper-CLI equivalent:

```bash
p2p --pane-id "$TARGET_PANE" --submit "$PROMPT_TEXT"
sleep 30
p2p tail --pane-id "$TARGET_PANE" --lines 40
```

### Worker-to-worker Codex relay

```bash
# sender worker prompt should name these exact commands for the target pane
printf '%s' "$PROMPT_TEXT" | wezterm cli send-text --pane-id "$TARGET_PANE" --no-paste
printf '\033[13u' | wezterm cli send-text --pane-id "$TARGET_PANE" --no-paste
```

Verify:
- the sending worker transcript proves both relay commands, not just the text send
- the target pane leaves `unsent input visible` and enters `Working` or another
  truthful submitted state
- if the sending worker used `send-key`, plain `'\r'`, or newline-submit
  instead, classify the relay as degraded until the target pane proves a real
  start
- on a fixed pair, if the target enters `Working` but does not emit the expected
  assistant line in a timely window, record `submitted and active` separately
  from `assistant answer completed`; do not collapse that back into `unsent`
- if the target is the operator's active pane, down-rank bare `Working` as a
  proof surface and prefer returned markers on the peer pane

Minimal proven dedicated-pair bounce:

```text
target prompt:
Reply with exactly one line: PING_X.
Then use shell commands only.
Create a temp file containing exactly: Reply with exactly one line: PONG_X.
Send that file to peer pane with:
p2p --pane-id <peer> --submit "$(cat FILE)"
```

Proof:
- target pane shows `• PING_X`
- peer pane later shows `• PONG_X`
- if the peer instead emits an explicit round verdict like `ROUND_X_FAIL`,
  count that as a clean failure signal rather than an ambiguous missing reply

### Dedicated shell ping-pong baseline

Prefer this before moving into live Codex bounce drills.

```bash
PAIR="$(p2p pair-shell --percent 45)"
echo "$PAIR"   # LEFT=41 RIGHT=42
p2p ping-pong-shell --left 41 --right 42 --tag demo1
```

Verify:
- the command prints `left_sent=PING_demo1`
- the command prints `right_got=GOT_demo1`
- the command prints `left_pong=PONG_demo1`
- the command ends with `STATUS=ok`
- pane tails show the left seed script and right bounce script actually ran

### Cross-host relay onto the owner host

If the sender logic runs on `pets` but the target pane lives on `al`, do not
pretend `pane_id` is global.

Truthful operational form:

```bash
ssh <owner-host> "printf '%s' '$PROMPT_TEXT' | wezterm cli send-text --pane-id '$TARGET_PANE' --no-paste"
ssh <owner-host> "printf '\033[13u' | wezterm cli send-text --pane-id '$TARGET_PANE' --no-paste"
```

Verify:
- the SSH hop reached the owner host of the pane
- the owner host ran the target-correct submit locally
- the target pane on the owner host shows submitted movement, not just routed text

If the target pane on the owner host is a shell rather than visible Codex:
- keep the same text send
- use `'\r'` instead of `ESC [ 13 u`

### Right live Codex pane -> current active pane

Use this only when the operator explicitly wants the right live Codex pane to
send a submitted prompt back into the current active pane in the same tab.

Prompt shape:

```text
You are the right-pane Codex worker in the same visible WezTerm tab.

Current facts:
- your pane is the right pane
- the peer target pane is CURRENT_PANE_ID
- use the local helper CLI `p2p`

Task:
1. First, reply in this pane with exactly one line and nothing else:
PING_TAG
2. Then use shell commands only.
3. Submit exactly one prompt into peer pane CURRENT_PANE_ID with:
p2p --pane-id CURRENT_PANE_ID --submit 'Reply with exactly one line: PONG_TAG.'
```

Verify:
- the right pane visibly shows `PING_TAG`
- the current pane later receives the submitted prompt
- if the current pane is the operator's active live Codex pane, do not use bare
  `Working` alone as the proof surface

### Live Codex no-Enter probe

```bash
wezterm cli send-text --pane-id "$TARGET_PANE" --no-paste "relay text without enter [probe-1]"
sleep 0.3
wezterm cli get-text --pane-id "$TARGET_PANE" --start-line -40 | tail -20
```

Verify:
- the recent pane tail shows the exact unsent relay text
- report this as PTY-level unsent-input proof, not as a Codex-widget API proof

### Short batched relay discipline

For repeated lessons on reused live panes:
1. keep each batch to `2-3` messages
2. before a new no-Enter injection into the same target pane, clear the
   current unsent input line if separation matters
3. verify that clear step from a recent pane-tail snapshot
4. after each step, record `execution proven` separately from `reply proven`
5. extend the loop only after the current batch still looks transport-truthful
6. if `Ctrl+U`, backspace, or similar clear attempts do not change the visible
   line, treat clear as `not proven` and freeze the batch instead of stacking
   another no-Enter message on top
7. do not escalate from failed clear straight into repeated `Ctrl+C` unless
   you are intentionally willing to reinitialize that pane

### Sustained Human Conversation Mode

This is the target mode once transport stops being the main uncertainty.

Entry gate:
1. the current pane pair survives at least two short batches without losing
   message separation or collapsing the target pane
2. prompt-ready rechecks are still truthful after each submitted turn
3. the current session is not actively degrading into
   `submitted-but-no-answer`

Conversation shape:
1. switch from transport probes to natural replies that explicitly reference
   the previous turn
2. keep each message short enough to stay observable, but meaningful enough to
   sound human
3. let the exchange run for `5+` minutes with natural pauses rather than
   machine-gun sends
4. track continuity at the dialogue level:
   - did the next line respond to the previous line?
   - did the topic persist across several turns?
   - did the rhythm still feel like turn-taking rather than queued bytes?

Observation contract:
1. keep the transport ledger in the background
2. add a conversation ledger in parallel:
   `continuity preserved | tone preserved | reply linked to previous turn`
3. if transport truth weakens, drop back to short-batch mode instead of
   pretending the human-conversation mode still holds
4. after each no-Enter human turn, restore the pane to a known prompt-ready
   state before the next turn; on the current clean pair this is done with a
   backspace burst proved by a fresh snapshot
5. if the human turn wraps across lines, prove execution with a marker or a
   side monitor instead of assuming one exact-line match will survive wrapping

### Fresh-pane safe Enter probe

```bash
FRESH="$(wezterm cli split-pane --pane-id "$RIGHT_COLUMN_PANE" --bottom --percent 50 -- bash -lc 'cd /path/to/repo && exec codex_wp --no-alt-screen')"
sleep 8
wezterm cli get-text --pane-id "$FRESH" --start-line -60 | tail -30
wezterm cli send-text --pane-id "$FRESH" --no-paste "Reply with exactly one line and nothing else: SAFE ACK."
sleep 0.3
printf '\033[13u' | wezterm cli send-text --pane-id "$FRESH" --no-paste
```

Verify:
- the fresh pane was alive immediately before the send
- the pane answered the tiny prompt
- any reminder/interstitial is cleared before the pane is reused

If instead the prompt becomes transcript-visible and the pane drops back to an
idle prompt with no assistant answer, record that as `submitted-but-no-answer`
rather than success.

Observed degraded variant:
- the prompt becomes transcript-visible
- an interstitial warning or reminder still owns the first Enter boundary
- a second explicit `Enter` later produces the tiny answer and returns to idle

Classify this as:
- `PROVEN: submitted prompt delivered`
- `PROVEN: answer completed after explicit second Enter`
- `NOT IDEAL: first submit boundary was absorbed by interstitial state`

### Visible interactive wakeup proof

For a visible interactive worker, the truthful completion boundary is often:

```text
worker was active -> worker returned to idle Codex prompt -> manager wakeup sent
```

Verify:
- pane history shows active work happened first
- pane later shows an idle Codex prompt
- a run-root artifact and manager-pane wakeup line were both emitted for that
  transition when wakeup reliability matters

## Notes

- Keep the protocol honest: prove pane delivery, not imaginary widget access.
- Keep the stop boundary honest too: prove `ACTIVE -> IDLE` when that is the
  real completion signal, not only process exit.
- For a live Codex target, "answer finished" and "prompt-ready for the next
  relay" are different truths; clear reminder/interstitial states first.
- For interactive task delivery, "text appeared in the pane" and
  "the prompt was actually submitted" are also different truths; if the goal
  was a real handoff, the sender must own both text injection and Enter.
- The same strict default applies to manager-worker task starts: unless the
  turn is explicitly an unsent-input probe, inserted text should be submitted
  immediately and checked again after about `30s`.
- Reusing an old pane is not a bug by itself; if the pane is still truthful for
  the next probe, continuity is preferable to pane sprawl.
- Pane reuse and answer completion are separate axes: an old pane may be the
  correct reusable target even when the current session still degrades to
  `submitted-but-no-answer`.
- For repeated reused-pane drills, shorter batches are usually more truthful
  than long uninterrupted exchanges because they force prompt-ready and clear
  checks back into the loop.
- If the operator says "only these two panes", that constraint outranks
  fresh-pane convenience experiments; keep the investigation inside that pair
  and record degradation honestly there.
- Those short batches are a training discipline, not the final UX target: once
  transport is stable, the operator wants the exchange to accumulate into a
  believable multi-minute human conversation rather than stay mechanical.
- The right escalation path is staged, not abrupt:
  first prove transport, then prove clean short batches, then stretch into
  multi-minute human continuity.
- For sustained mode, `post-reply cleanup` is part of the transport contract,
  not a cosmetic extra.
- The current practical entrypoint for sustained mode is a dedicated clean
  same-tab pair, not the protected live manager chat pane.
- In long loops, reply loss does not automatically mean command loss; keep
  separate counters for executed injections vs assistant-visible replies.
- If message-by-message proof in the target pane matters, do not keep stacking
  no-Enter injections into the same live input line forever.
- If clear-by-control-bytes does not work in the current Codex pane, that is a
  transport limitation to record, not something to hand-wave away.
- `Ctrl+C` may function as a state-reset or pane-kill boundary rather than a
  clean input-line eraser, so use it deliberately.
- For safe Enter probes, a fresh pane is often cheaper and more truthful than
  reusing a pane with dirty prompt state from a failed or partial relay.
- But if the task is specifically about proving a fixed pane pair, fresh-pane
  convenience is the wrong optimization; keep the same pair and separate
  `transport proved` from `session remained conversationally healthy`.
- If a remote node such as `pets` needs to affect panes that live on `al`,
  route through SSH to `al`; do not describe that as direct remote `pane_id`
  control.
- Keep adding newly proven command sequences and degraded observations to
  `references/examples.md` so the skill stays operational rather than purely
  theoretical.
- `transcript-visible after Enter` is a real boundary, but it is still not the
  same as `assistant answer completed`.
- Keep this skill checksum-synced across participating hosts when the workflow
  crosses SSH boundaries; otherwise one host can still teach an outdated submit
  contract.
- When the problem expands into manager-worker policy, pair this skill with
  `$shehroz`.
- When the problem is mostly pane mechanics, pair this skill with `$wezterm`.
