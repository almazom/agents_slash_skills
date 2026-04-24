# HOWTO — Theme Customization

Theme system for the `sshmux_theme` module at `~/.config/wezterm/sshmux_theme.lua`.

## Architecture

```
sshmux_theme.lua
├── M.schemes          — named color schemes (Watch Moss, Watch Brass, …)
├── M.profiles         — per-server profile (pets, almaz) → maps to a scheme
└── M.apply_local()    — sets default scheme for local panes
```

- **Local panes:** `apply_local()` sets `config.color_scheme` to the default theme.
- **Remote panes:** `update-status` event detects domain and switches to the profile's scheme.
- **Force override:** `WEZTERM_FORCE_THEME_PROFILE=pets` env var forces a specific profile.
- Config auto-reloads (`automatically_reload_config = true`).

## Current Schemes

| Scheme | Background | Mood | Cursor | Foreground |
|--------|-----------|------|--------|------------|
| Watch Moss | `#1d241e` dark olive-green | Forest floor, lush moss | `#d2b678` gold | `#e6dcc4` warm cream |
| Watch Brass | `#241c18` dark warm brown | Polished brass, amber workshop | `#c99756` amber | `#eadbc2` cream |
| Watch Olive | `#1e1b16` dark warm earth | Olive grove, sun-baked soil | `#a8894e` ochre | `#bfb599` muted cream |
| Watch Slate | `#1a1a1e` dark charcoal-cool | Wet slate, overcast twilight | `#a08860` tan | `#bdb2a0` warm gray |
| Watch Ember | `#1e1714` dark reddish-brown | Cooling embers, copper coals | `#c47a48` copper | `#c0b09a` smoky cream |
| Watch Umber | `#1c1912` dark yellow-brown | Raw umber, leather, old wood | `#b09058` raw sienna | `#c2b89e` warm tan |
| Watch Lichen | `#171c1a` dark sage-green | Moss on stone, misty morning | `#8a9a6e` sage | `#b8b6a2` gray-cream |

## Taste Operator

When the user asks for a new theme or to change the current one, use this taste guide to pick direction.

### Color Directions

| Direction | Background family | Key shift | Best for |
|-----------|------------------|-----------|----------|
| **Warmer** | Brown → amber → copper | Add red/yellow channel | Cozy, evening, workshop feel |
| **Cooler** | Green → blue-gray → slate | Add blue channel | Calm, professional, muted |
| **Greener** | Shift toward olive/emerald | Raise green channel, lower red | Nature, forest, organic |
| **Earthier** | Yellow-brown, umber, clay | Equal warm channels, low saturation | Rustic, grounded, muted |
| **Darker** | Lower all values toward black | Reduce brightness 10-20% | Night mode, high contrast |
| **Lighter** | Raise values toward dark gray | Increase brightness 10-20% | Softer, less contrast |

### Foreground/Contrast Rules

| Preference | Foreground target | How |
|-----------|------------------|-----|
| **Shiny/bright** | `#e6dcc4` – `#f0e4cc` | High-value cream, near white |
| **Normal** | `#cdc2a4` – `#d4c8ac` | Warm cream, readable |
| **Muted/soft** | `#b8ad92` – `#bfb599` | Low-contrast, gentle on eyes |
| **Less shiny** | `#b0a690` – `#bdb2a0` | Flat, no glare, matte feel |

### Cursor Accent Families

| Accent | Cursor color | Pairs with |
|--------|-------------|-----------|
| Gold | `#d2b678` | Green/brown backgrounds |
| Amber | `#c99756` | Brown/warm backgrounds |
| Copper | `#c47a48` | Red-brown/ember backgrounds |
| Ochre | `#a8894e` | Earth/olive backgrounds |
| Sage | `#8a9a6e` | Cool green backgrounds |
| Tan | `#a08860` | Neutral/slate backgrounds |
| Sienna | `#b09058` | umber/yellow-brown backgrounds |

## How to Switch Default Theme

In `sshmux_theme.lua`, change the line in `apply_local()`:

```lua
config.color_scheme = 'Watch Ember'   -- change this string
```

WezTerm auto-reloads. No restart needed.

## How to Create a New Scheme

1. Pick a direction from the taste operator above.
2. Start from an existing scheme as base.
3. Adjust these key fields:

| Field | Rule of thumb |
|-------|--------------|
| `background` | Dark, `#14`–`#24` range. Sets the entire mood. |
| `foreground` | 60-80% brighter than background. Warm cream/tan family. |
| `cursor_bg` | Accent pop. Brighter than everything else. |
| `ansi[0]` (black) | 10-20% lighter than background. |
| `ansi[1]` (red) | Terracotta/copper range `#a06050`–`#b86850`. |
| `ansi[2]` (green) | Olive/sage range `#6e8a56`–`#87986a`. |
| `ansi[3]` (yellow) | Gold/amber range `#9a8a48`–`#ba9d67`. |
| `ansi[4]` (blue) | Muted teal range `#587888`–`#7d8b92`. |
| `ansi[5]` (magenta) | Dusty mauve range `#7a6a80`–`#a48598`. |
| `ansi[6]` (cyan) | Sage/teal range `#4e8878`–`#719486`. |
| `ansi[7]` (white) | Slightly dimmer than foreground. |
| `brights[*]` | 10-15% brighter than corresponding ansi. |
| `tab_bar.background` | Darker than main background. |
| `active_tab.bg_color` | Accent color, distinct from background. |
| `active_tab.fg_color` | Same family as foreground. |

4. Add the scheme to `M.schemes` table.
5. Set `config.color_scheme` in `apply_local()` to the new name.

## How to Add a Remote Profile Theme

Add to `M.profiles`:

```lua
myserver = {
  label = 'MYSRV',
  scheme = 'Watch Ember',
  status_bg = '#6a4830',
  status_fg = '#ccbc9e',
  window_frame = {
    active_titlebar_bg = '#15110e',
    inactive_titlebar_bg = '#100c0a',
    active_titlebar_fg = '#ccbc9e',
    inactive_titlebar_fg = '#9a8a76',
    button_fg = '#b0a088',
    button_bg = '#15110e',
    button_hover_fg = '#15110e',
    button_hover_bg = '#d4a85a',
  },
},
```

Then add domain detection in `map_profile_from_text()` if needed.

## Validation Checklist

After creating/editing a scheme:

- [ ] Background is dark enough (not mid-gray)
- [ ] Foreground readable against background (contrast ratio > 5:1)
- [ ] Cursor visible but not jarring
- [ ] Selection highlight distinguishable from background
- [ ] Tab bar active/inactive states clearly different
- [ ] ANSI colors (red, green, yellow, blue) distinguishable from each other
- [ ] Brights noticeably brighter than corresponding ANSI
- [ ] Split line visible against background
- [ ] No pure black (#000000) or pure white (#ffffff) anywhere
- [ ] No neon/saturated colors — all channels below #d0 for ANSI, #e0 for brights

## Naming Convention

`Watch <Material>` — where Material is a natural/earthy substance:
- Moss, Brass, Olive, Slate, Ember, Umber, Lichen
- Potential future: Clay, Iron, Bark, Fog, Sand, Bone, Ash, Patina
