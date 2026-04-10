# Key Sequences Reference

For `send-text --no-paste` — sends raw bytes, so special keys need escape sequences.

## Full Table

| Key | Escape Seq | Hex | Bash syntax |
|-----|-----------|-----|-------------|
| Ctrl+A | SOH | `\x01` | `$'\x01'` |
| Ctrl+B | STX | `\x02` | `$'\x02'` |
| Ctrl+C | ETX | `\x03` | `$'\x03'` |
| Ctrl+D | EOT | `\x04` | `$'\x04'` |
| Ctrl+E | ENQ | `\x05` | `$'\x05'` |
| Ctrl+L | FF | `\x0c` | `$'\x0c'` |
| Ctrl+U | NAK | `\x15` | `$'\x15'` |
| Ctrl+Z | SUB | `\x1a` | `$'\x1a'` |
| Ctrl+\ | FS | `\x1c` | `$'\x1c'` |
| Enter | CR | `\x0d` | `$'\x0d'` |
| Escape | ESC | `\x1b` | `$'\x1b'` |
| Tab | TAB | `\x09` | `$'\x09'` |
| Backspace | DEL | `\x7f` | `$'\x7f'` |
| Up Arrow | ESC[A | `\x1b[A` | `$'\x1b[A'` |
| Down Arrow | ESC[B | `\x1b[B` | `$'\x1b[B'` |
| Right Arrow | ESC[C | `\x1b[C` | `$'\x1b[C'` |
| Left Arrow | ESC[D | `\x1b[D` | `$'\x1b[D'` |

## Common Combos

```bash
# Interrupt
wezterm cli send-text --pane-id "$P" --no-paste $'\x03'

# Clear line / clear screen / EOF
wezterm cli send-text --pane-id "$P" --no-paste $'\x15'    # Ctrl+U
wezterm cli send-text --pane-id "$P" --no-paste $'\x0c'    # Ctrl+L
wezterm cli send-text --pane-id "$P" --no-paste $'\x04'    # Ctrl+D

# Type full command and execute
wezterm cli send-text --pane-id "$P" --no-paste "npm test"$'\x0d'

# Interrupt, wait, then retry
wezterm cli send-text --pane-id "$P" --no-paste $'\x03'
sleep 0.2
wezterm cli send-text --pane-id "$P" --no-paste "cargo build"$'\x0d'
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `send-text` seems ignored | Use `--no-paste` for raw keystrokes |
| Ctrl+C doesn't interrupt | Use `--no-paste $'\x03'` |
| Can't send arrow keys | `$'\x1b[A'` for Up, `$'\x1b[B'` for Down, etc. |
| Escape key not working | Use `$'\x1b'` — not the literal string "Escape" |
