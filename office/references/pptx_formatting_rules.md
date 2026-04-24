# PPTX Formatting Fix: Rules & Lessons

## The 5 Rules (from real client task)

1. **All text boxes fit within slide boundaries** — move or shrink font
2. **Text boxes don't overlap** — move or shrink font
3. **All text fits into text boxes** — expand box or shrink font
4. **Original color scheme preserved**
5. **Original layout preserved** (slight moves OK)

## Fix Priority Order

When a text box violates multiple rules, fix in this order:
1. First fix boundary violations (Rule 1) — move shapes inside slide
2. Then fix overlaps (Rule 2) — spread shapes apart
3. Then fix text fitting (Rule 3) — expand boxes, then shrink font as last resort
4. Never touch colors (Rule 4)
5. Minimize position changes (Rule 5)

## Two Approaches Compared (tested 2026-04-10)

### Approach A: Shrink Fonts (ChatGPT method)
- Reduce font sizes until text fits in original boxes
- Pros: preserves original layout positions
- Cons: text becomes small/hard to read, may STILL overflow
- Result: 6 text overflows remaining, 2/10 on text fitting

### Approach B: Expand Boxes + normAutofit (ZAI method)
- Expand text boxes to fit content, keep original fonts
- Enable `normAutofit` as safety net
- Rearrange overlapping boxes into even grid layout
- Pros: preserves readability, robust against future edits
- Cons: layout positions shift more
- Result: 1-2 borderline overflows, 8/10 on text fitting

### Verdict: Expand Boxes > Shrink Fonts
- ZAI scored 46/60 vs ChatGPT 31/60 across 6 evaluation dimensions
- ZAI won 5/6 categories (boundaries, overlaps, text fitting, typography, layout)
- ChatGPT only won preservation (kept original positions better)

## Key Technique: Grid Relayout

For comparison slides with 3-4 text boxes at the same Y position:
```
1. Calculate available width = slide_width - 2*margin - (n-1)*gap
2. Each box gets width = available_width / n
3. Space evenly with consistent gap (0.10" works well)
4. This eliminates horizontal overlaps completely
```

## Shape Position Checking Algorithm

```python
def rects_overlap(a, b):
    return (a.x < b.x + b.w and a.x + a.w > b.x and
            a.y < b.y + b.h and a.y + a.h > b.y)

def within_slide(shape, slide_w, slide_h):
    return (shape.left >= 0 and shape.top >= 0 and
            shape.left + shape.width <= slide_w and
            shape.top + shape.height <= slide_h)
```

## Non-Text Shape Fixes

- Shapes at negative x: push to x=0, trim width if needed
- Page numbers: move to standard bottom-right position
- Image overlaps with text: move text, never move images
