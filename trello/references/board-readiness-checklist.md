# Board Readiness Assessment Framework

Use this when the operator asks "is the board ready?" or "can we start development?".

## Assessment Process

1. Pull the full board state (all lists, all cards)
2. Read each card's description
3. Score each dimension
4. Report overall percentage with specific gaps

## Dimensions

### 1. Card Descriptions (25%)
- Every card has a Goal/User Story at the top
- Technical steps are specific enough for a mid-level developer
- Code patterns or API references included where relevant
- Description length: minimum 500 chars for non-trivial cards

### 2. Acceptance Criteria (20%)
- Every card has a verifiable checklist (technical)
- Every card has operator-facing DoD
- Criteria are specific, not vague ("works" → "operator can have 5-minute conversation without disconnect")

### 3. Dependencies (15%)
- Cards explicitly state what they depend on
- No circular dependencies
- First card has zero dependencies (can start immediately)
- Dependency chain is clear and linear where possible

### 4. Ordering (15%)
- Developer knows which card to pick first
- Cards within an epic are logically sequenced
- No ambiguity about "what should I work on next?"

### 5. Scope Boundaries (10%)
- Every card has a "What this is NOT" section
- Phase separation is clear (MVP vs Phase 2)
- No card tries to do too much

### 6. Labels (10%)
- Every card has at least one label
- Epic labels allow filtering
- Thematic labels (ui, architecture, audio) are applied

### 7. Operator Verification (5%)
- Every card has a manual test scenario
- Steps are written for the operator (not developer)
- Includes edge cases and "it works" moment

## Scoring

| Score | Meaning | Action |
|-------|---------|--------|
| 0-50% | Not ready | Major gaps — needs significant work before development |
| 50-70% | Partially ready | Some cards are good, others need filling |
| 70-80% | Almost ready | Gaps identified but not blocking — can start with caveats |
| 80-90% | Ready with gaps | Development can start, fix gaps in parallel |
| 90-95% | Ready | Minor polish items only |
| 95%+ | Fully ready | Go |

## Quick Assessment Commands

```bash
# Get board overview
trello list-lists $BOARD_ID --format json

# Count cards per list
for list in $(trello list-lists $BOARD_ID --format json | python3 -c "import json,sys; [print(l['id']) for l in json.load(sys.stdin)]"); do
  count=$(trello list-cards $list --format json | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
  name=$(trello list-cards $list --format json | python3 -c "import json,sys; d=json.load(sys.stdin); print(json.load(sys.stdin)[0]['name'])" 2>/dev/null || echo "(empty)")
  echo "$name: $count cards"
done

# Check individual card quality
trello card-info $CARD_ID --format json | python3 -c "
import json,sys
d=json.load(sys.stdin)
desc=d.get('desc','') or ''
labels=[l['name'] for l in d.get('labels',[])]
checks=len(d.get('checkLists',[]) or [])
print(f'Description: {len(desc)} chars')
print(f'Labels: {labels}')
print(f'Checklists: {checks}')
print(f'Has User Story: {\"User Story\" in desc}')
print(f'Has DoD: {\"Definition of Done\" in desc}')
print(f'Has Story Points: {\"Story Points\" in desc}')
print(f'Has Operator Test: {\"Operator Verification\" in desc}')
print(f'Has What This Is Not: {\"What this is NOT\" in desc}')
"
```
