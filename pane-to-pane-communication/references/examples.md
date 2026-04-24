# Pane-to-Pane Examples

Use this file as the running operational appendix for the skill.

Keep it biased toward:

- exact commands
- what was proven
- what degraded
- what to run next

## Current Helper CLI

The current local helper CLI lives at:

- repo path: `/Users/al/TOOLS/pane-to-pane-communication/p2p`
- global command: `p2p`

The CLI is meant to standardize the current submit contract:

1. send text
2. send the correct submit sequence for the target pane

It is transport-only:

- the sender may be a shell pane or a Codex pane
- the target pane program decides how submitted text is interpreted
- `--submit 'hello'` in `zsh` means "run command `hello`"
- `--submit 'Reply with exactly one line: hello.'` in `codex_wp` means "send a Codex prompt"
- shell panes use `'\r'` for submit
- visible Codex panes in WezTerm use `ESC [ 13 u` for true submit

Important commands:

```bash
p2p --help
p2p --ids
p2p --ids --retitle-tab
p2p --where
p2p --pane-id 34 --submit 'echo TEST_P34'
p2p --direction right --submit 'pwd'
p2p --direction right --enter
p2p resolve --direction right
p2p resolve --direction right --context
p2p --direction right --send 'echo staged text'
p2p --direction right --enter
p2p tail --direction right --lines 30
p2p split-right --percent 45
p2p split-right-codex --percent 45
p2p pair-shell --percent 45
p2p ping-pong-shell --left 41 --right 42 --tag demo1
```

`p2p resolve --direction right --context` is the current short inspection form
when you want one command to tell you:

- current pane id
- resolved target pane id
- target tab id
- all pane ids in that target tab

`p2p --ids` is the shortest current-tab inspection form when you want only:

- current pane id
- current tab id
- all pane ids in the current tab
- one compact layout string such as `T14,p:tl-26,p:tr-34,p:bl-49`
- one project-prefixed label such as `pane-to-pane-communication|T14,p:tl-26,p:tr-34,p:bl-49`

If you want the current tab renamed to that label as part of the same command:

```bash
p2p --ids --retitle-tab
```

`p2p --where` is the current human-readable inspection form when you want to
understand which pane is where:

- current pane marker
- location such as `left`, `right`, `top`, `bottom`, or `top-right`
- raw `top_row` and `left_col`
- current pane title
- current pane cwd

## Example: Shell Submit Proof

Open or choose a shell pane, then run:

```bash
p2p --pane-id "$TARGET_PANE" --submit 'printf P2P_FILE_OK >/tmp/p2p-proof.txt'
cat /tmp/p2p-proof.txt
```

What this proves:

- the target pane accepted text
- the target pane accepted Enter
- a shell side effect happened in the target pane

## Example: Start Codex In The Right Pane

```bash
RIGHT_PANE_ID="$(p2p split-right --percent 45)"
p2p --pane-id "$RIGHT_PANE_ID" --submit 'codex_wp --no-alt-screen'
```

Then wait until the real Codex prompt is visible before sending the next task.

## Example: Tiny Codex Prompt

```bash
p2p --pane-id "$RIGHT_PANE_ID" --submit 'Reply with exactly one line: P2P_READY.'
sleep 30
p2p tail --pane-id "$RIGHT_PANE_ID" --lines 60
```

Healthy result:

- transcript shows `• P2P_READY`
- pane returns to idle prompt

## Example: Observed Interstitial-Absorbed First Enter

Observed on `2026-04-22` in the current environment:

1. `codex_wp --no-alt-screen` started correctly in a right pane.
2. The prompt `Reply with exactly one line: P2P_READY.` became transcript-visible.
3. No answer appeared within the first observation window.
4. One more explicit `p2p enter --pane-id <id>` produced:
   - warning surface cleared
   - `• P2P_READY`
   - return to idle prompt

Interpretation:

- prompt delivery was already proven after the first submit
- full answer completion was only proven after the extra Enter
- this is a reminder that an interstitial can still own the first Enter boundary

## Example: Codex Pane Needs Keyboard-Style Enter In WezTerm

Observed on `2026-04-22` in a fresh temporary Codex pane:

1. `p2p --pane-id 62 --submit 'Reply with exactly one line: P2P_FRESH.'`
   using plain `'\r'` semantics left the prompt visible in the composer with a
   new empty line below it.
2. Sending `ESC [ 13 u` into the same pane triggered a true submit.
3. The pane then answered with exactly:
   - `P2P_FRESH`

Truth to preserve:

- plain carriage return is not a universal submit for visible Codex panes in
  WezTerm
- keyboard-style Enter escape `ESC [ 13 u` is the proven submit sequence for
  this Codex TUI surface
- `p2p` should auto-detect this surface and use that sequence for `--enter` and
  `--submit`

## Example: Dedicated Shell Ping-Pong Baseline

Create a dedicated pair:

```bash
PAIR="$(p2p pair-shell --percent 45)"
echo "$PAIR"
```

Typical shape:

```bash
LEFT=41 RIGHT=42
```

Run the bounce:

```bash
p2p ping-pong-shell --left 41 --right 42 --tag demo1
```

Expected proof:

- `left_sent=PING_demo1`
- `right_got=GOT_demo1`
- `left_pong=PONG_demo1`
- `STATUS=ok`

The current implementation also prints pane tails so the visible shells prove:

- left seed script ran
- right bounce script ran
- the relay came back to the left pane

## Example: Cross-Host Relay Through The Owner Host

If the pane lives on `al` but the current sender logic runs on `pets`:

```bash
ssh al "p2p --pane-id '$TARGET_PANE' --submit 'echo cross-host test'"
ssh al "p2p tail --pane-id '$TARGET_PANE' --lines 20"
```

Truth to preserve:

- `pane_id` still belongs to `al`
- `pets` is only the relay initiator
- the actual `wezterm cli` execution must happen on `al`

## Example: Right Codex Pane Bounces Back Into The Current Pane

Use this only when the operator explicitly wants the right live Codex pane to
send a submitted prompt back into the current active pane.

Current observed same-tab shape on `2026-04-22`:

- current pane: `26`
- right pane: `34`

Prompt shape for the right pane:

```text
You are the right-pane Codex worker in the same visible WezTerm tab.

Current facts:
- your pane is the right pane
- the peer target pane is 26
- use the local helper CLI `p2p`

Task:
1. First, reply in this pane with exactly one line and nothing else:
PING_TAB1
2. Then use shell commands only.
3. Submit exactly one prompt into peer pane 26 with:
p2p --pane-id 26 --submit 'Reply with exactly one line: PONG_TAB1.'

Rules:
- do not use `send-key`
- do not use newline-submit tricks
- do not target any pane except 26
- do not explain what you are doing
- do not add any extra text before or after the one-line `PING_TAB1`
```

Why this is special:

- pane `26` is the operator's active current Codex pane
- that makes bare `Working` weaker as proof
- stronger proof is:
  - right pane transcript shows `PING_TAB1`
  - current pane later shows the returned submitted prompt
  - ideally the current pane then answers `PONG_TAB1`

Operational caution:

- do not auto-fire this bounce unless the operator explicitly wants the current
  active pane to be interrupted by the returned submitted prompt

Observed success on `2026-04-22`:

1. right pane `34` received a minimal bounce prompt
2. right pane visibly replied `PING_TAB2`
3. right pane then ran:
   `p2p --pane-id 26 --submit 'Reply with exactly one line: PONG_TAB2.'`
4. the current pane `26` received that submitted prompt

Truthful classification:

- `PROVEN: right-pane prompt delivery`
- `PROVEN: right-pane shell relay back into current pane`
- `PROVEN: submitted prompt reached the current pane`
- `NEXT PROOF SURFACE: current pane answers with exactly one line PONG_TAB2`

## Example: Shell Pane -> Right Codex Pane -> Current Pane Relay

Observed on `2026-04-22` in current tab layout:

- `pane 49`: source shell pane
- `pane 34`: right live Codex pane
- `pane 26`: current active operator Codex pane

Exact observed source-shell command:

```bash
p2p --pane-id 34 --submit 'write oly message PING and the use shel tool for run cli [p2p --pane-id 26 --submit ] to submit when u end mesage to pane 26 with text : send me back to me relevant PING PONG message and submit'
```

Observed result:

1. pane `49` proved the shell command was really launched there
2. pane `34` accepted the submitted prompt and stayed in live Codex mode
3. pane `34` checked local CLI usage with `p2p --help`
4. pane `34` then ran:
   `p2p --pane-id 26 --submit 'send me back to me relevant PING PONG message and submit'`
5. pane `34` visibly replied with exactly `PING`
6. pane `26` later showed the relayed submitted prompt text

Truthful classification:

- `PROVEN: shell -> Codex submitted prompt delivery into pane 34`
- `PROVEN: right Codex pane executed a shell relay into pane 26`
- `PROVEN: submitted prompt reached pane 26`
- `NOT CLEANLY PROVEN: autonomous final PONG back from pane 26`

Why the last line stays weaker:

- `pane 26` was the operator's active current Codex pane
- its transcript was already mixed with the live conversation
- for this pattern, treat it as a strong relay example, not yet as a clean
  isolated full ping-pong acceptance proof

Canonical cleaned form of the same lesson:

```bash
p2p --pane-id 34 --submit 'Write exactly one line in this pane: PING. Then use shell commands only. Run: p2p --pane-id 26 --submit '"'"'send me back to me relevant PING PONG message and submit'"'"''
```

Use this when:

- the source is a normal shell pane
- the target is a live right-side Codex pane
- the Codex pane should first emit `PING` locally
- then the Codex pane should relay one submitted prompt into the current pane

Expected truthful outcome:

- the source shell proves the first submit into pane `34`
- pane `34` visibly prints `PING`
- pane `34` proves its own relay command into pane `26`
- pane `26` receives the submitted prompt text

Keep the same caution:

- if pane `26` is the operator's active current Codex pane, the final returned
  answer there is a weaker proof surface than the relay itself
