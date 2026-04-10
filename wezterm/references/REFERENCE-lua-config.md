# REFERENCE — Lua Config

Lua observer examples for WezTerm configuration. Load only when modifying `wezterm.lua` config.

**Scope note:** This file covers GUI-event Lua callbacks (`update-status`, keybindings). For mux object APIs (MuxPane, MuxTab, MuxWindow, MuxDomain), see `REFERENCE-sshmux-architecture.md`.

## Read Adjacent Pane in Status Bar

```lua
wezterm.on("update-status", function(window, pane)
  local tab = window:active_tab()
  local right = tab:get_pane_direction("Right")
  if right then
    local text = right:get_lines_as_text()  -- returns a single string, not a table
  end
end)
```

## Keybinding: Capture Right Pane to Clipboard

```lua
local wezterm = require 'wezterm'
return {
  keys = {
    { key = 'y', mods = 'CTRL|SHIFT', action = wezterm.action_callback(function(win, pane)
      local tab = pane:tab()
      local right = tab:get_pane_direction("Right")
      if right then
        local text = right:get_lines_as_text()  -- single string, already newline-joined
        win:copy_to_clipboard(text)
      end
    end)},
  },
}
```
