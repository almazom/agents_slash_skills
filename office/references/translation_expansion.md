# Translation Text Expansion Ratios

Source: Microsoft, SDL/Trados, LISA, IBM, SAP localization guidelines.

## By Language Pair

| Source → Target | Avg Expansion | Risk Level | Notes |
|-----------------|---------------|------------|-------|
| EN → Russian | +20-30% | HIGH | Cyrillic wider, longer words |
| ZH → Russian | +50-100% | SEVERE | Most extreme expansion pair |
| EN → German | +20-35% | HIGH | Compound words |
| EN → French | +15-25% | MODERATE | Articles, prepositions |
| EN → Spanish | +15-25% | MODERATE | |
| EN → Portuguese | +20-30% | HIGH | |
| EN → Italian | +15-25% | MODERATE | |
| EN → Dutch | +20-35% | HIGH | Compound words |
| EN → Finnish | +25-40% | HIGH | Agglutinative |
| EN → Hungarian | +25-40% | HIGH | Agglutinative |
| EN → Polish | +25-40% | HIGH | Complex inflection |
| EN → Czech | +20-35% | HIGH | |
| EN → Arabic | +20-35% | HIGH | RTL compounds issue |
| EN → Japanese | -10-20% | LOW | Contraction — characters denser |
| EN → Korean | -10-15% | LOW | Hangul syllable blocks |
| EN → Chinese | -20-30% | LOW | Logographic characters |

## PPTX-Specific Impact

### Most Fragile Elements (break first)
1. **Tables** — fixed column widths, cells can't auto-adjust
2. **Chart data labels** — positioned relative to data points
3. **SmartArt** — multiple fixed-size text frames
4. **Grouped shapes** — can't resize individually
5. **Two-column layouts** — expansion in one column invades the other
6. **Headers/footers** — fixed-height zones

### Least Fragile Elements
1. Full-width text boxes with generous margins
2. Single-column body text
3. Images without text overlays

## Design for Translatability Checklist

- [ ] Text boxes ≥ 30% empty space
- [ ] No overlapping text boxes
- [ ] Body text ≥ 10pt, headings ≥ 14pt
- [ ] No text in images
- [ ] No absolute positioning dependent on text length
- [ ] Word wrap enabled on all frames
- [ ] Auto-size set to NONE in source template
- [ ] Margins ≥ 0.15 inches
- [ ] No grouped shapes with text
