---
name: office
description: >
  Meta-skill for office document workflows: creation, translation, DTP fixing, and format conversion.
  Use when the user wants to CREATE, TRANSLATE, FIX LAYOUT, or CONVERT any office document (PDF, DOCX, XLSX, PPTX).
  Routes to the correct sub-skill and adds translation review, overflow fixing, and quality assurance.
  Triggers: "office document", "translate presentation", "fix PPTX layout", "translate PDF", "create report",
  "fix overflow after translation", "DTP fix", "localize slides", "translate to Russian".
triggers: office, office document, translate PDF, translate PPTX, translate DOCX, DTP fix, fix layout, create report, localize slides, translate presentation, translate to Russian, PDF, DOCX, XLSX, PPTX, office workflow
---

# Office Meta-Skill

One entry point. Five sub-skills. Full pipeline.

## Available Sub-Skills

| Skill | Location | Use for |
|-------|----------|---------|
| **minimax-pdf** | `~/.claude/skills/minimax-pdf` | Generate beautiful PDFs (CREATE, FILL, REFORMAT) |
| **minimax-docx** | `~/.claude/skills/minimax-docx` | Create/edit DOCX files |
| **minimax-xlsx** | `~/.claude/skills/minimax-xlsx` | Excel spreadsheets |
| **pptx-generator** | `~/.claude/skills/pptx-generator` | PowerPoint presentations (CREATE, READ, EDIT) |
| **docutranslate** | `~/.claude/skills/docutranslate` | Translate DOCX/XLSX/PPTX (NOT PDF — see workaround) |

## Other Tools Used

| Tool | Role |
|------|------|
| **zai -p** (Claude Code headless) | Translation engine: `zai -p "Translate..." --allowedTools ""` |
| **python-pptx** | PPTX XML manipulation, fit_text(), overflow detection |
| **markitdown** | Text extraction from PPTX/PDF for QA |
| **pypdf** | PDF reading, merging, form field detection |

---

## Route Table

| User wants | Route | Steps |
|------------|-------|-------|
| Create a new document | **CREATE** | Choose skill → build content → generate file |
| Translate a document | **TRANSLATE** | See Translation Pipeline below |
| Fix layout after translation | **DTP-FIX** | See PPTX Overflow Fix below |
| Read/extract from document | **READ** | markitdown or pypdf or python-pptx |

---

## Translation Pipeline

**Priority direction: EN→RU and ZH→RU (expert quality required)**

### Step 1: Translate

For **PDF**: Source text → `zai -p "Translate to Russian. Output ONLY translation." --allowedTools ""` → translated content.json → minimax-pdf CREATE

For **DOCX/XLSX/PPTX**: Use `docutranslate` (dt) directly:
```bash
dt /path/to/file.docx --to-lang Russian --pretty
dt /path/to/file.pptx --to-lang Russian --output-format pptx --pretty
```

**Text expansion ratios (CRITICAL for layout):**

| Source → Target | Expansion | Layout Risk |
|-----------------|-----------|-------------|
| ZH → RU | +50% to +100% | SEVERE — almost always breaks |
| EN → RU | +20% to +30% | HIGH — tables and tight boxes break |
| EN → DE | +20% to +35% | HIGH |
| EN → FR/ES | +15% to +25% | MODERATE |
| EN → ZH/JA/KO | -10% to -30% | LOW (contraction, extra space appears) |

### Step 2: Review (ALWAYS spawn parallel subagent)

After every translation, spawn a review subagent in parallel:

```
Agent prompt: "You are a bilingual editorial reviewer ([LANG1]-[LANG2]).
Compare source and translation. Check: accuracy, grammar, calques, terminology consistency, natural flow.
Output: VERDICT (PASS/FAIL), ISSUES FOUND, DETAILS, QUALITY SCORE (1-10)"
```

### Step 3: Apply fixes

If reviewer found issues → fix content → regenerate file.

### Step 4: DTP Fix (for PPTX — see below)

---

## PPTX Translation Overflow Fix

**The Problem:** After translating PPTX (especially EN→RU or ZH→RU), text expands and overflows text boxes, breaking the layout.

### Detection (python-pptx)

```python
from pptx import Presentation
from pptx.enum.text import MSO_AUTO_SIZE

def detect_overflow(prs):
    """Detect text frames where text exceeds shape bounds."""
    overflows = []
    for slide_num, slide in enumerate(prs.slides, 1):
        for shape in slide.shapes:
            if not shape.has_text_frame:
                continue
            tf = shape.text_frame
            text = tf.text
            if not text.strip():
                continue
            width = shape.width   # EMU
            height = shape.height # EMU
            margins = (tf.margin_left or 91440, tf.margin_right or 91440,
                       tf.margin_top or 45720, tf.margin_bottom or 45720)
            effective_w = width - margins[0] - margins[1]
            effective_h = height - margins[2] - margins[3]
            font_size = None
            for para in tf.paragraphs:
                for run in para.runs:
                    if run.font.size:
                        font_size = run.font.size
                        break
                if font_size:
                    break
            if font_size is None:
                font_size = 183000  # Default 14.4pt in EMU
            avg_char_width = font_size * 0.6
            chars_per_line = effective_w / avg_char_width if avg_char_width > 0 else 80
            num_lines = max(1, len(text) / chars_per_line) + text.count('\n')
            line_height = font_size * 1.2
            total_height = num_lines * line_height
            if total_height > effective_h:
                overflows.append({'slide': slide_num, 'shape': shape.shape_id,
                    'text': text[:50], 'size_pt': font_size / 12700})
    return overflows
```

### Fix Strategies (by severity)

**Tier 1 — Mild overflow (ratio ≤ 1.3): Set normAutofit**
```python
tf.auto_size = MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE
tf.word_wrap = True
```
XML produced: `<a:normAutofit/>` — PowerPoint auto-shrinks font at render time.

**Tier 2 — Moderate overflow (ratio ≤ 1.8): Shrink font + normAutofit**
```python
tf.fit_text(font_family="Calibri", max_size=14)  # Uses real TrueType metrics
tf.auto_size = MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE
tf.word_wrap = True
```
`fit_text()` calculates optimal font size using actual font metrics. Floor: **8pt minimum**.

**Tier 3 — Severe overflow (ratio > 1.8): Expand box + shrink font**
```python
# Reduce margins to minimum
tf.margin_left = tf.margin_right = 45720   # 0.05 inches
tf.margin_top = tf.margin_bottom = 22860   # 0.025 inches
# Shrink font
tf.fit_text(font_family="Calibri", max_size=12)
# If still overflows, expand shape height
shape.height = int(shape.height * 1.4)
```

### XML-Level Reference

Text fitting is controlled in `<a:bodyPr>` children:

| Element | Effect |
|---------|--------|
| `<a:normAutofit fontScale="80000"/>` | Shrink text to 80% of original |
| `<a:spAutoFit/>` | Grow shape to fit text |
| `<a:noAutofit/>` | No adjustment (text clips) |

Units: `fontScale` in thousandths of percent, `sz` in hundredths of a point, dimensions in EMU (914400 = 1 inch).

---

## Expert EN→RU / ZH→RU Glossary

**Common calques to AVOID in Russian translation:**

| English | WRONG (calque) | CORRECT Russian |
|---------|----------------|-----------------|
| carbon-aware | углеродно-осведомлённый | с учётом углеродного следа |
| human judgment | человеческое суждение | человеческая оценка |
| agent-based | на базе агентов | агентный |
| at scale | масштабируемый | в промышленных масштабах |
| sustainable (tech) | устойчивый | экологичный |
| production (env) | продакшен | промышленная эксплуатация |
| zero-trust | zero trust (untranslated) | нулевого доверия |
| workload | нагрузка на работу | рабочая нагрузка |

**ZH→RU specifics:**
- Chinese 「」 → Russian «»
- Chinese 。→ Russian .
- Restructure Chinese topic-comment sentences to Russian SVO
- Chinese technical terms have established Russian equivalents — use them, don't calque

---

## PDF Workflow (tested 2026-04-10)

### Generation
```bash
cd ~/.claude/skills/minimax-pdf && bash scripts/make.sh run \
  --title "Title" --type report --author "Author" --date "Date" \
  --accent "#2D5F8A" --content content.json --out output.pdf
```

Doc types: `report proposal resume portfolio academic general minimal stripe diagonal frame editorial magazine darkroom terminal poster`

### PDF Translation (docutranslate can't do PDF — use this instead):
1. Extract/create source text
2. `zai -p "Translate to Russian..." --allowedTools ""`
3. Build translated content.json
4. Generate new PDF via minimax-pdf

---

## PPTX Creation (tested 2026-04-10)

### Structure
```
slides/
  slide-01.js  # exports createSlide(pres, theme)
  slide-02.js
  compile.js   # imports all, writes PPTX
```

### Critical Rules
- **NO "#" in hex colors** — use `"E07A5F"`, not `"#E07A5F"` (corrupts file)
- **NO async/await** in createSlide functions
- **NO object reuse** across PptxGenJS calls
- Page badges mandatory on all slides except cover (x: 9.3, y: 5.1)
- Theme keys: `primary`, `secondary`, `accent`, `light`, `bg` only
- First render always has problems — fix-and-verify cycle mandatory

### 5 Slide Types
1. Cover (no page badge)
2. Table of Contents
3. Section Divider
4. Content Page (6 subtypes: text, mixed media, data viz, comparison, timeline, image showcase)
5. Summary/Closing

---

## Quality Checklist

For every office document produced:
- [ ] File opens without errors
- [ ] No placeholder text remains (grep for "lorem", "ipsum", "xxxx", "placeholder")
- [ ] Page numbers present and correct
- [ ] No text overflow (PPTX: run overflow detection script)
- [ ] Translation reviewed by subagent (score ≥ 8/10)
- [ ] If Russian: no calques from the avoid-list above
- [ ] If PPTX: all slides have page badges except cover
- [ ] Font sizes above 8pt floor

---

## Fixture Locations

### PDF Fixtures (`/home/pets/temp/office_fixtures/pdf_workflow/`)

| File | Pages | Size | Edge Case Type |
|------|-------|------|----------------|
| `report_2026.pdf` | 4 | 94 KB | Clean English baseline |
| `report_2026_ru.pdf` | 4 | 102 KB | Russian translation (v1, pre-review) |
| `report_2026_ru_v2.pdf` | 4 | 102 KB | Russian translation (v2, post-review fixes) |
| `report_2026_fr.pdf` | 4 | 93 KB | French translation |
| `report_2026_es.pdf` | 4 | 96 KB | Spanish translation |

### PDF Edge Cases (`/home/pets/temp/office_fixtures/pdf_workflow/fixtures/`)

| File | Pages | Edge Case |
|------|-------|-----------|
| `academic_paper_attention_is_all_you_need.pdf` | 15 | Academic paper, formulas, tables (2164 KB) |
| `complex_layout_multicolumn.pdf` | 126 | IRS 1040 instructions, multi-column (4332 KB) |
| `encrypted_receipt.pdf` | 1 | Password-protected PDF |
| `gov_form_i9.pdf` | 5 | Fillable form fields |
| `multicolumn_newsletter.pdf` | 1 | Two-column newspaper layout |
| `simulated_scanned.pdf` | 1 | Simulated scanned document |
| `single_page_receipt.pdf` | 1 | Simple single-page baseline |

### PPTX Fixtures (`/home/pets/temp/office_fixtures/pptx_workflow/fixtures/`)

**Generated complexity levels:**

| File | Slides | Size | Level | Features |
|------|--------|------|-------|----------|
| `L1_minimal_1slide.pptx` | 1 | 48 KB | Minimal | Cover only |
| `L2_basic_5slides.pptx` | 5 | 104 KB | Basic | Cover + TOC + 2 content + summary, bar chart |
| `L3_medium_8slides.pptx` | 8 | 192 KB | Medium | Stats callouts, comparison, bar+pie charts, table |
| `L4_complex_15slides.pptx` | 15 | 412 KB | Complex | 4 section dividers, 3 chart types, timeline, KPI cards |

**Real-world simulation:**

| File | Slides | Size | Type |
|------|--------|------|------|
| `corporate_test.pptx` | 7 | 176 KB | Business: revenue, market, roadmap |
| `academic_test.pptx` | 14 | 308 KB | Academic: NLP survey, references |
| `technical_test.pptx` | 11 | 404 KB | Engineering: architecture, data flow, security |

**Translation test artifacts:**

| File | Purpose |
|------|---------|
| `L3_translated_ru_expanded.pptx` | Simulated EN→RU with expanded text (15 overflow detected) |
| `L3_translated_ru_fixed.pptx` | After overflow fixer: 6 severe + 9 mild fixed, 0 severe remaining |

### Memory (`/home/pets/temp/.MEMORY_OFFICE/`)

Memento-style tattoo cards (TATTOO_00 through TATTOO_10+).
Each card: WHAT WORKED / WHAT BROKE / THE RULE.
Read any card independently — chronological order doesn't matter.

---

## Tested Results Summary (2026-04-10)

### PDF: 4 languages generated
- English: 94 KB, 4 pages — baseline
- Russian v1: 8/10 review score, 5 calques found → v2: calques fixed
- French: 9/10, 3 minor anglicisms
- Spanish: 9/10, 2 word-order issues

### PPTX: Overflow fixer tested
- Input: L3 with simulated EN→RU expansion (30% text length increase)
- Detected: 15 shapes overflowing (6 severe at 2.33x ratio, 9 mild)
- After fix: 0 severe remaining, 9 mild with normAutofit (PowerPoint auto-handles)
- Script: `scripts/pptx_overflow_fix.py --report` (detect) or with output path (fix)

### Translation review pattern
- 3 parallel subagents reviewed RU/FR/ES translations
- Average review score: 8.7/10
- Russian consistently scores lowest (most calque risk from English)
- Every fix applied improved score by 1-2 points

---

## PPTX Formatting Rules (Real-World Tested)

See `references/pptx_formatting_rules.md` for full details.

### The 5 Rules (from client task)
1. Text boxes fit within slide boundaries → move or shrink
2. Text boxes don't overlap → move or shrink
3. All text fits in text boxes → expand box or shrink font
4. Original colors preserved
5. Original layout preserved (slight moves OK)

### Best Strategy: Expand Boxes > Shrink Fonts
Tested against ChatGPT's "shrink fonts" approach on a real ZH→RU translated file:
- ZAI (expand boxes + normAutofit): 46/60 total score, 5/6 categories won
- ChatGPT (shrink fonts): 31/60 total score, 6 text overflows remained

Key technique: for comparison slides, rearrange boxes into even grid (uniform widths, consistent gaps).

See `references/zai_vs_chatgpt_comparison.md` for full benchmark results.

---

## Reference Files

| File | Content |
|------|---------|
| `references/pptx_overflow_tiered_fix.md` | 3-tier overflow strategy deep dive |
| `references/pptx_formatting_rules.md` | Formatting fix rules, priority order, algorithms |
| `references/translation_expansion.md` | 15+ language expansion ratios |
| `references/zai_vs_chatgpt_comparison.md` | Head-to-head benchmark results |
| `scripts/pptx_overflow_fix.py` | CLI tool: detect + fix PPTX overflow |

---

## Memory System

Experience is tracked in `/home/pets/temp/.MEMORY_OFFICE/` — Memento-style tattoo cards.
Each card is self-contained: WHAT WORKED / WHAT BROKE / THE RULE.
Check this folder for latest learnings before starting any office workflow.
