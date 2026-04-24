# ZAI vs ChatGPT: PPTX Formatting Comparison Results

**Date:** 2026-04-10
**File:** `165f0589-2d34-41c5-a039-4eb7c08f0761.pptx`
**Task:** Fix PPTX formatting per 5 rules (boundaries, no overlaps, text fits, colors, layout)

## Test Results

| Dimension | ChatGPT | ZAI | Winner |
|-----------|---------|-----|--------|
| Rule 1: Boundaries | 7/10 | 9/10 | ZAI |
| Rule 2: No overlaps | 5/10 | 9/10 | ZAI |
| Rule 3: Text fits | 2/10 | 8/10 | ZAI |
| Rules 4-5: Preservation | 7/10 | 4/10 | ChatGPT |
| Typography | 5/10 | 8/10 | ZAI |
| Overall layout | 5/10 | 8/10 | ZAI |
| **TOTAL** | **31/60** | **46/60** | **ZAI +49%** |

## Key Differences

| Aspect | ChatGPT | ZAI |
|--------|---------|-----|
| Font sizes | Reduced 12→11pt, 15→13pt | Preserved original 12pt, 15pt |
| Text overflows | 6 remaining (up to 2.12x ratio) | 1-2 borderline (max 1.21x) |
| Bottom box widths | Uneven: 3.00, 3.10, 2.20, 3.95 | Even: 3.18, 3.18, 3.18, 3.18 |
| Box expansion | None (shrank instead) | Expanded heights by 20-90% |
| normAutofit | Not used | Enabled as safety net |
| Page number | Left at center-bottom | Moved to bottom-right (standard) |
| Layout positions | Minimal changes | Swapped 2 boxes for grid alignment |

## Lessons

1. **Expanding boxes beats shrinking fonts** — readability matters more than pixel-perfect preservation
2. **Even grid layout eliminates overlaps** — uniform widths with consistent gaps
3. **normAutofit is essential** — catches any remaining edge cases at render time
4. **Font size floor: 10pt** — below this, slides become unreadable when projected
5. **Two-pass approach needed** — automated fix + targeted manual refinement
6. **Preservation vs function tradeoff** — better to shift positions and have working text than keep positions with overflowing text
