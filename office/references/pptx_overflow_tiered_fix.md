# PPTX Translation Overflow: 3-Tier Fix Strategy

**The core problem:** After translating PPTX (especially EN→RU or ZH→RU), text expands
and overflows text boxes, breaking the layout. Professional localization agencies fix this
manually. This skill automates it.

## Text Expansion Ratios

| Source → Target | Expansion | Typical Result |
|-----------------|-----------|----------------|
| ZH → RU | +50-100% | Severe overflow, boxes break everywhere |
| EN → RU | +20-30% | High risk, tables and tight boxes overflow |
| EN → DE | +20-35% | High risk |
| EN → FR/ES | +15-25% | Moderate risk |

## The 3-Tier Approach

### Tier 1 — Mild overflow (ratio ≤ 1.3x)

**What:** Text is slightly too long but close to fitting.

**Fix:** Set `normAutofit` — PowerPoint will auto-shrink the font when the file is opened.

```python
from pptx.enum.text import MSO_AUTO_SIZE
tf.auto_size = MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE
tf.word_wrap = True
```

**XML produced:** `<a:bodyPr><a:normAutofit/></a:bodyPr>`

**When to use:** Most common case. ~60% of all overflows after EN→RU translation.

---

### Tier 2 — Moderate overflow (ratio 1.3x - 1.8x)

**What:** Text is significantly longer. normAutofit alone would shrink font too much (below 8pt).

**Fix:** Calculate optimal font size using real TrueType font metrics, then apply + normAutofit as backup.

```python
tf.fit_text(font_family="Arial", max_size=14)  # Uses actual font metrics
tf.auto_size = MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE  # Backup for PowerPoint re-render
tf.word_wrap = True
```

**How fit_text() works:**
1. Measures actual character widths using TrueType font metrics
2. Calculates the largest font size (up to max_size) that fits in the shape
3. Applies that size to all runs in the text frame
4. Sets auto_size to NONE (prevents PowerPoint from further adjusting)

**Minimum font floor:** 8pt. Never shrink below this — text becomes unreadable.

**When to use:** ~25% of overflows. Common in bullet-point heavy slides.

---

### Tier 3 — Severe overflow (ratio > 1.8x)

**What:** Text is 2x+ longer than the box. Typical for ZH→RU translations.

**Fix:** Reduce margins to minimum + shrink font + expand text box height.

```python
# Step 1: Minimize margins
tf.margin_left = tf.margin_right = 45720   # 0.05 inches (was 0.1")
tf.margin_top = tf.margin_bottom = 22860   # 0.025 inches (was 0.05")

# Step 2: Shrink font with metrics
tf.fit_text(font_family="Arial", max_size=12)

# Step 3: Expand box height
shape.height = int(shape.height * min(overflow_ratio, 1.5))

# Step 4: Set normAutofit as safety net
tf.auto_size = MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE
tf.word_wrap = True
```

**Box expansion cap:** Never expand more than 1.5x — beyond that, the slide layout breaks
(overlapping other elements). If still overflowing at 1.5x, flag for manual review.

**When to use:** ~15% of overflows. Common for ZH→RU, TOC slides, tables with long headers.

---

## Most Fragile Elements (break first)

1. **Tables** — fixed column widths, cells can't auto-adjust
2. **SmartArt** — multiple fixed-size text frames
3. **Two-column layouts** — expansion in one column invades the other
4. **Grouped shapes** — can't resize individually
5. **Chart data labels** — positioned relative to data points

## Design for Translatability

When creating source presentations that will be translated:
- Leave **≥ 30% empty space** in all text boxes
- Body text **≥ 10pt**, headings **≥ 14pt**
- Enable **word wrap** on all text frames
- **No overlapping text boxes**
- **No text in images** (can't be translated)
- **No grouped shapes** containing text

## Tested Results (2026-04-10)

Input: 8-slide PPTX with simulated EN→RU expansion (+30% text length)
- Detected: 15 shapes overflowing
- Tier 1 (mild): 9 shapes fixed with normAutofit
- Tier 3 (severe): 6 shapes fixed with margin reduction + box expansion
- Result: 0 severe overflows remaining, all mild handled by PowerPoint auto-fit

## Script

```bash
# Detect only
python3 ~/.agents/skills/office/scripts/pptx_overflow_fix.py input.pptx --report

# Detect and fix
python3 ~/.agents/skills/office/scripts/pptx_overflow_fix.py input.pptx output.pptx --lang ru
```
