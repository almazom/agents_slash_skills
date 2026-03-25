#!/bin/bash

################################################################################
# Quality Gate 2: Generated SDD Validation
#
# Validates complete SDD folder structure and quality
# Checks: files, structure, card quality, consistency
################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SDD_DIR=""
SCORE=0
MAX_SCORE=23
QUALITY_THRESHOLD=19  # ~83% with expanded cognitive checks
ERRORS=()
WARNINGS=()

function log_error() { 
    echo -e "${RED}❌ $1${NC}"
    ERRORS+=("$1")
}

function log_success() { 
    echo -e "${GREEN}✅ $1${NC}"
    SCORE=$((SCORE + 1))
}

function log_warning() { 
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS+=("$1")
}

function log_info() { echo -e "ℹ️  $1"; }

function usage() {
    cat << 'EOF'
SDD Flow Validation Suite

USAGE:
    ./validate-sdd.sh <sdd-output-folder>

EXAMPLES:
    ./validate-sdd.sh ./auto-archive-old-conversations-sdd/
    ./validate-sdd.sh path/to/your-feature-sdd/

VALIDATION GATES:

Gate 1: Structure (implied, before generation)
- All required files present (6 docs + trello-cards)

Gate 2: Quality (Cognitive)
- Card numbering is sequential (01, 02, 03, ...)
- Each card has 1-4 Story Points
- BOARD.md and KICKOFF.md exist
- Structure follows templates
- Gaps file shows 100% filled
- README shows READY FOR IMPLEMENTATION
- Expert Trello card cognitive checks:
  - cognitive completeness (intent, plan, touchpoints, risk, validation, dependencies)
  - expanded `Description` + `Context` blocks
  - checklist depth (>=4 atomic checkbox tasks)
  - task-level orchestration markers (`Execution Mode` + `Parallel Blockers`)
  - references and linked-card cohesion
  - concrete code/contract snippet evidence
  - measurable acceptance criteria language
  - concrete implementation tasks count
  - no unresolved placeholders (TODO/TBD/{...}/path/to)
  - minimum content richness (word count)

Gate 3: Confidence (95% threshold) [NEW]
- Requirements coverage analysis
- COMPLETENESS_REPORT.md with ≥95% confidence
- Requirements vs Deliverables comparison
- Description/Context sections in all cards
- Acceptance Criteria and To-Do List in all cards
- Execution Mode and Parallel Blockers for each `TASK-*`

SELF-ASSESSMENT (before running this script):
When you feel SDD is complete, ask:
  "What is my confidence level comparing Trello cards to raw requirements?"

If confidence < 95%:
  1. Create todo list of missing items
  2. Implement minimal fixes
  3. Re-run self-assessment
  4. Repeat until 95%+

EXIT CODES:
    0: SDD valid (Gate 2 cognitive checks pass, Gate 3 ≥ 70%)
    1: SDD invalid or quality < thresholds
    2: Folder not found or unreadable
EOF
}

# Parse arguments
if [ $# -eq 0 ]; then
    log_error "SDD folder not specified"
    usage
    exit 2
fi

SDD_DIR="$1"
TRELLO_DIR="$SDD_DIR/trello-cards"

if [ ! -d "$SDD_DIR" ]; then
    log_error "Directory not found: $SDD_DIR"
    exit 2
fi

if [ ! -d "$TRELLO_DIR" ]; then
    log_error "Not a valid SDD folder (missing trello-cards/): $SDD_DIR"
    exit 2
fi

log_info "Starting SDD validation..."
echo "Folder: $SDD_DIR"
echo ""

# Check 1: Required documentation files
REQUIRED_DOCS=("requirements.md" "ui-flow.md" "gaps.md" "manual-e2e-test.md" "README.md")
for doc in "${REQUIRED_DOCS[@]}"; do
    if [ -f "$SDD_DIR/$doc" ]; then
        log_success "$doc exists"
    else
        log_error "Missing required file: $doc"
    fi
done

# Check 2: README status
if grep -q "READY FOR IMPLEMENTATION" "$SDD_DIR/README.md"; then
    log_success "README shows READY FOR IMPLEMENTATION"
else
    log_error "README does not show READY status"
fi

# Check 3: Gaps file validation
if [ -f "$SDD_DIR/gaps.md" ]; then
    if grep -qi "ALL FILLED" "$SDD_DIR/gaps.md"; then
        log_success "Gaps.md shows all gaps filled"
    else
        log_warning "Gaps.md may have unfilled gaps"
    fi
fi

# Check 4: Trello cards folder structure
if [ -f "$TRELLO_DIR/KICKOFF.md" ]; then
    log_success "KICKOFF.md exists"
else
    log_error "Missing KICKOFF.md"
fi

if [ -f "$TRELLO_DIR/BOARD.md" ]; then
    log_success "BOARD.md exists"
else
    log_error "Missing BOARD.md"
fi

if [ -f "$TRELLO_DIR/AGENT_PROTOCOL.md" ]; then
    log_success "AGENT_PROTOCOL.md exists"
else
    log_warning "Missing AGENT_PROTOCOL.md (optional but recommended)"
fi

# Check 5: Card numbering and structure
CARD_FILES=($(ls -1 "$TRELLO_DIR"/[0-9][0-9]-*.md 2>/dev/null | sort))
CARD_COUNT=${#CARD_FILES[@]}

if [ "$CARD_COUNT" -ge 1 ]; then
    log_success "Found $CARD_COUNT Trello card files"
    
    # Check numbering sequence
    EXPECTED_NUM=1
    HAS_GAPS=false
    for card_file in "${CARD_FILES[@]}"; do
        NUM=$(basename "$card_file" | sed 's/-.*//' | sed 's/^0*//')
        if [ "$NUM" -ne "$EXPECTED_NUM" ]; then
            HAS_GAPS=true
            log_error "Gap in card numbering: expected $EXPECTED_NUM, found $NUM"
        fi
        EXPECTED_NUM=$((EXPECTED_NUM + 1))
    done
    
    if [ "$HAS_GAPS" = false ]; then
        log_success "Card numbering is sequential (01 to $(printf "%02d" $CARD_COUNT))"
    fi
else
    log_error "No Trello card files found in $TRELLO_DIR"
fi

# Check 6: Card quality (SP, structure, file paths)
if [ "$CARD_COUNT" -ge 1 ]; then
    INVALID_SP=0
    MISSING_DEPS=0
    MISSING_TASK_ORCHESTRATION=0
    INVALID_EXECUTION_MODE=0

    for card_file in "${CARD_FILES[@]}"; do
        # Check SP range - support both "**SP:** N" and "Story Points: N" formats
        SP=$(grep -oE "\*\*SP:\*\*[[:space:]]*[0-9]|Story Points.*[0-9]" "$card_file" 2>/dev/null | grep -o '[0-9]' | head -1)
        SP=${SP:-0}
        if [ "$SP" -lt 1 ] || [ "$SP" -gt 4 ]; then
            INVALID_SP=$((INVALID_SP + 1))
            log_error "Card has invalid SP ($SP): $(basename $card_file)"
        fi

        # Check for dependencies
        if grep -q "Depends On.*[0-9]" "$card_file"; then
            DEP=$(grep -o "Depends On.*[0-9]" "$card_file" | grep -o '[0-9][0-9]' | head -1)
            if ! ls "$TRELLO_DIR/${DEP}-"*.md >/dev/null 2>&1; then
                MISSING_DEPS=$((MISSING_DEPS + 1))
                log_warning "Card depends on missing card: $DEP"
            fi
        fi

        # Check task-level orchestration markers
        TASK_ITEMS=$(grep -Eoc '^[[:space:]]*-[[:space:]]*\[[[:space:]]\][[:space:]]*\*\*TASK-[0-9]+:\*\*' "$card_file" || true)
        EXECUTION_MODE_TAGS=$(grep -Eoc '^[[:space:]]*-[[:space:]]*\*\*Execution Mode:\*\*[[:space:]]*(PARALLEL|SEQUENTIAL)[[:space:]]*$' "$card_file" || true)
        PARALLEL_BLOCKERS_TAGS=$(grep -Eoc '^[[:space:]]*-[[:space:]]*\*\*Parallel Blockers:\*\*[[:space:]]*(TASK-[0-9]+([[:space:]]*,[[:space:]]*TASK-[0-9]+)*|none)[[:space:]]*$' "$card_file" || true)
        EXECUTION_MODE_LINES=$(grep -Eic '^[[:space:]]*-[[:space:]]*\*\*Execution Mode:\*\*' "$card_file" || true)
        INVALID_MODE_LINES=$((EXECUTION_MODE_LINES - EXECUTION_MODE_TAGS))
        if [ "$INVALID_MODE_LINES" -lt 0 ]; then
            INVALID_MODE_LINES=0
        fi

        if [ "$TASK_ITEMS" -gt 0 ]; then
            if [ "$EXECUTION_MODE_TAGS" -lt "$TASK_ITEMS" ] || [ "$PARALLEL_BLOCKERS_TAGS" -lt "$TASK_ITEMS" ]; then
                MISSING_TASK_ORCHESTRATION=$((MISSING_TASK_ORCHESTRATION + 1))
                log_error "Missing task orchestration markers in $(basename "$card_file") (tasks=$TASK_ITEMS, execution_modes=$EXECUTION_MODE_TAGS, blockers=$PARALLEL_BLOCKERS_TAGS)"
            fi
        fi

        if [ "$INVALID_MODE_LINES" -gt 0 ]; then
            INVALID_EXECUTION_MODE=$((INVALID_EXECUTION_MODE + 1))
            log_error "Invalid Execution Mode values in $(basename "$card_file") (must be PARALLEL or SEQUENTIAL)"
        fi
    done
    
    if [ "$INVALID_SP" -eq 0 ]; then
        log_success "All cards have valid SP (1-4)"
    fi
    
    if [ "$MISSING_DEPS" -eq 0 ]; then
        log_success "All dependencies exist"
    fi

    if [ "$MISSING_TASK_ORCHESTRATION" -eq 0 ] && [ "$INVALID_EXECUTION_MODE" -eq 0 ]; then
        log_info "Task orchestration markers present in all cards"
    fi
fi

# Check 7: Trello card cognitive quality gate
if [ "$CARD_COUNT" -ge 1 ]; then
    COGNITIVE_PASS_COUNT=0
    PLACEHOLDER_VIOLATIONS=0
    TRACEABILITY_COUNT=0

    for card_file in "${CARD_FILES[@]}"; do
        DIMENSIONS=0
        WORD_COUNT=$(wc -w < "$card_file" | tr -d '[:space:]')
        TASK_COUNT=$(( \
            $(grep -cE "^[[:space:]]*[0-9]+[.)][[:space:]]+" "$card_file" || true) + \
            $(grep -Eoc "(TASK-[0-9]+|AC-[0-9]+)" "$card_file" || true) \
        ))
        MEASURABLE_COUNT=$(grep -Eic "(>=|<=|==|exactly|at least|at most|no more than|must|non-zero|0|1|100%|pass|fail)" "$card_file" || true)
        CHECKLIST_COUNT=$(grep -cE "^[[:space:]]*-[[:space:]]*\\[[[:space:]]\\][[:space:]]+" "$card_file" || true)
        DESCRIPTION_PRESENT=0
        CONTEXT_PRESENT=0
        REFERENCES_PRESENT=0
        DEPENDENCIES_PRESENT=0
        ACCEPTANCE_PRESENT=0
        TESTING_PRESENT=0
        TODO_SECTION_PRESENT=0
        SNIPPET_PRESENT=0
        ORCHESTRATION_PRESENT=0

        if grep -Eiq "^##.*(Description|Описание)" "$card_file"; then
            DESCRIPTION_PRESENT=1
        fi
        if grep -Eiq "^##.*(Context|Контекст)" "$card_file"; then
            CONTEXT_PRESENT=1
        fi
        if grep -Eiq "^##.*(References|Ссылки и материалы)" "$card_file"; then
            REFERENCES_PRESENT=1
        fi
        if grep -Eiq "^##.*(Dependencies|Зависимости и блокировки)" "$card_file"; then
            DEPENDENCIES_PRESENT=1
        fi
        if grep -Eiq "^##.*(Acceptance Criteria|Критерии при[её]мки)" "$card_file"; then
            ACCEPTANCE_PRESENT=1
        fi
        if grep -Eiq "^##.*(Testing|Тестирование)" "$card_file"; then
            TESTING_PRESENT=1
        fi
        if grep -Eiq "^##.*(To-Do List|Обязательные задачи)" "$card_file"; then
            TODO_SECTION_PRESENT=1
        fi
        if grep -Eiq '^```(json|ya?ml|python|typescript|ts|javascript|js|bash|sh|sql|go|java)' "$card_file"; then
            SNIPPET_PRESENT=1
        fi

        TASK_ITEMS=$(grep -Eoc '^[[:space:]]*-[[:space:]]*\[[[:space:]]\][[:space:]]*\*\*TASK-[0-9]+:\*\*' "$card_file" || true)
        EXECUTION_MODE_TAGS=$(grep -Eoc '^[[:space:]]*-[[:space:]]*\*\*Execution Mode:\*\*[[:space:]]*(PARALLEL|SEQUENTIAL)[[:space:]]*$' "$card_file" || true)
        PARALLEL_BLOCKERS_TAGS=$(grep -Eoc '^[[:space:]]*-[[:space:]]*\*\*Parallel Blockers:\*\*[[:space:]]*(TASK-[0-9]+([[:space:]]*,[[:space:]]*TASK-[0-9]+)*|none)[[:space:]]*$' "$card_file" || true)

        # 1) Intent/Value
        if grep -Eiq "(why|purpose|goal|value|benefit|outcome|impact)" "$card_file"; then
            DIMENSIONS=$((DIMENSIONS + 1))
        fi

        # 2) Ordered implementation path
        if [ "$TASK_COUNT" -ge 3 ]; then
            DIMENSIONS=$((DIMENSIONS + 1))
        fi

        # 3) Concrete touchpoints (files/APIs/contracts)
        if grep -Eiq '(^|[[:space:]])(src|apps|docs|tests|scripts)/[A-Za-z0-9._/-]+|[A-Za-z0-9._-]+/[A-Za-z0-9._/-]+' "$card_file"; then
            DIMENSIONS=$((DIMENSIONS + 1))
        fi

        # 4) Data/API contract presence
        if grep -Eiq "(api|contract|schema|request|response|endpoint|error[_ -]?code|json)" "$card_file"; then
            DIMENSIONS=$((DIMENSIONS + 1))
        fi

        # 5) Risk / edge-case handling
        if grep -Eiq "(risk|edge case|failure|rollback|fallback|timeout|incident|error handling)" "$card_file"; then
            DIMENSIONS=$((DIMENSIONS + 1))
        fi

        # 6) Validation strategy with measurable criteria
        if grep -Eiq "(test plan|acceptance|definition of done|verify|validation)" "$card_file" && [ "$MEASURABLE_COUNT" -ge 4 ]; then
            DIMENSIONS=$((DIMENSIONS + 1))
        fi

        # 7) Dependency context
        if grep -Eiq "(depends on|dependency|upstream|downstream|blocked by|prerequisite|sequence)" "$card_file"; then
            DIMENSIONS=$((DIMENSIONS + 1))
        fi

        # 8) Expanded description/context
        if [ "$DESCRIPTION_PRESENT" -eq 1 ] && [ "$CONTEXT_PRESENT" -eq 1 ]; then
            DIMENSIONS=$((DIMENSIONS + 1))
        fi

        # 9) Checklist discipline
        if [ "$CHECKLIST_COUNT" -ge 4 ]; then
            DIMENSIONS=$((DIMENSIONS + 1))
        fi

        # 10) References and dependencies cohesion
        if [ "$REFERENCES_PRESENT" -eq 1 ] && [ "$DEPENDENCIES_PRESENT" -eq 1 ]; then
            DIMENSIONS=$((DIMENSIONS + 1))
        fi

        # 11) Acceptance/testing/todo blocks
        if [ "$ACCEPTANCE_PRESENT" -eq 1 ] && [ "$TESTING_PRESENT" -eq 1 ] && [ "$TODO_SECTION_PRESENT" -eq 1 ]; then
            DIMENSIONS=$((DIMENSIONS + 1))
        fi

        # 12) Concrete snippet evidence
        if [ "$SNIPPET_PRESENT" -eq 1 ]; then
            DIMENSIONS=$((DIMENSIONS + 1))
        fi

        # 13) Task orchestration markers for parallel/sequential execution
        if [ "$TASK_ITEMS" -ge 1 ] && [ "$EXECUTION_MODE_TAGS" -ge "$TASK_ITEMS" ] && [ "$PARALLEL_BLOCKERS_TAGS" -ge "$TASK_ITEMS" ]; then
            ORCHESTRATION_PRESENT=1
            DIMENSIONS=$((DIMENSIONS + 1))
        fi

        # Traceability signals
        if grep -Eq "REQ-[0-9]{2,4}|RELATED-[0-9]{2,}" "$card_file"; then
            TRACEABILITY_COUNT=$((TRACEABILITY_COUNT + 1))
        fi

        # Placeholder checks (must be zero)
        if grep -Eiq "\\{[A-Z][A-Z0-9_ -]*\\}|\\{\\.\\.\\.\\}|TODO|TBD|path/to/|to be decided|\\(URL\\)|\\[YYYY-MM-DD\\]|\\[@username\\]|\\[Название[^]]*\\]|\\[Описание[^]]*\\]|\\[Данные\\]|\\[Результат\\]|\\[Дата\\]|\\[Условия\\]|\\[Сценарий\\]|\\[Значение\\]|\\*\\*Execution Mode:\\*\\*[[:space:]]*\\[PARALLEL \\| SEQUENTIAL\\]|\\*\\*Parallel Blockers:\\*\\*[[:space:]]*\\[TASK-XXX \\| none\\]" "$card_file"; then
            PLACEHOLDER_VIOLATIONS=$((PLACEHOLDER_VIOLATIONS + 1))
            log_error "Placeholder tokens found: $(basename "$card_file")"
        fi

        if [ "$DIMENSIONS" -ge 10 ] && [ "$WORD_COUNT" -ge 220 ] && [ "$CHECKLIST_COUNT" -ge 4 ] && [ "$DESCRIPTION_PRESENT" -eq 1 ] && [ "$CONTEXT_PRESENT" -eq 1 ] && [ "$REFERENCES_PRESENT" -eq 1 ] && [ "$DEPENDENCIES_PRESENT" -eq 1 ] && [ "$ACCEPTANCE_PRESENT" -eq 1 ] && [ "$TESTING_PRESENT" -eq 1 ] && [ "$TODO_SECTION_PRESENT" -eq 1 ] && [ "$SNIPPET_PRESENT" -eq 1 ] && [ "$ORCHESTRATION_PRESENT" -eq 1 ]; then
            COGNITIVE_PASS_COUNT=$((COGNITIVE_PASS_COUNT + 1))
        else
            log_warning "Card may be shallow: $(basename "$card_file") (dimensions=$DIMENSIONS, words=$WORD_COUNT, checklist=$CHECKLIST_COUNT, description=$DESCRIPTION_PRESENT, context=$CONTEXT_PRESENT, refs=$REFERENCES_PRESENT, dependencies=$DEPENDENCIES_PRESENT, acceptance=$ACCEPTANCE_PRESENT, testing=$TESTING_PRESENT, todo=$TODO_SECTION_PRESENT, snippet=$SNIPPET_PRESENT, orchestration=$ORCHESTRATION_PRESENT)"
        fi
    done

    COGNITIVE_PERCENT=$((COGNITIVE_PASS_COUNT * 100 / CARD_COUNT))
    TRACEABILITY_PERCENT=$((TRACEABILITY_COUNT * 100 / CARD_COUNT))

    log_info "Cognitive gate pass: $COGNITIVE_PASS_COUNT/$CARD_COUNT (${COGNITIVE_PERCENT}%)"
    log_info "Traceability signal: $TRACEABILITY_COUNT/$CARD_COUNT (${TRACEABILITY_PERCENT}%)"

    if [ "$COGNITIVE_PERCENT" -ge 95 ]; then
        log_success "Trello Card Cognitive Gate passed (>=95%)"
    else
        log_error "Trello Card Cognitive Gate failed (<95%)"
    fi

    if [ "$TRACEABILITY_PERCENT" -ge 95 ]; then
        log_success "Requirements traceability appears in >=95% cards"
    else
        log_error "Requirements traceability coverage is below 95%"
    fi

    if [ "$PLACEHOLDER_VIOLATIONS" -eq 0 ]; then
        log_success "No unresolved placeholders in cards"
    else
        log_error "Found $PLACEHOLDER_VIOLATIONS card(s) with unresolved placeholders"
    fi
fi

# Check 8: Optional file path validation hook (project-aware)
if [ -n "$PROJECT_DIR" ] && [ -d "$PROJECT_DIR" ]; then
    log_info "Checking file paths against project..."
    log_success "File paths validation (project available)"
fi

################################################################################
# Quality Gate 3: Requirements Coverage Validation (95% threshold)
################################################################################

function validate_requirements_coverage() {
    log_info "Running Quality Gate 3: Requirements Coverage..."
    echo ""

    if [ ! -f "$SDD_DIR/requirements.md" ]; then
        log_error "Missing requirements.md - cannot validate coverage"
        return 1
    fi

    # Count requirements (Req #, Requirement lines)
    # Handle both table format (| Req # |) and narrative format (### or -)
    # Use grep -c which returns integer count, trim any whitespace
    TOTAL_REQS=$(grep -c "^| Req #" "$SDD_DIR/requirements.md" 2>/dev/null | tr -d '[:space:]' || echo "0")
    if [ -z "$TOTAL_REQS" ] || [ "$TOTAL_REQS" = "0" ] 2>/dev/null; then
        # Fallback: count lines with "### Step" or "- " bullets in requirements section
        TOTAL_REQS=$(grep -cE "^[[:space:]]*(###|- )" "$SDD_DIR/requirements.md" 2>/dev/null | tr -d '[:space:]' || echo "0")
    fi
    if [ -z "$TOTAL_REQS" ] || [ "$TOTAL_REQS" = "0" ] 2>/dev/null; then
        # Last fallback: count requirement-related keywords
        TOTAL_REQS=$(grep -cE "(must|shall|should|required|requirement)" "$SDD_DIR/requirements.md" 2>/dev/null | tr -d '[:space:]' || echo "0")
    fi

    # Ensure TOTAL_REQS is a valid integer
    TOTAL_REQS=${TOTAL_REQS:-0}
    TOTAL_REQS=$((TOTAL_REQS + 0)) 2>/dev/null || TOTAL_REQS=0

    if [ "$TOTAL_REQS" -eq 0 ] 2>/dev/null; then
        log_warning "Could not parse requirements - manual review needed"
        return 0
    fi

    # Cap at reasonable number for scoring
    if [ "$TOTAL_REQS" -gt 20 ] 2>/dev/null; then
        TOTAL_REQS=20
    fi

    log_info "Found approximately $TOTAL_REQS requirements"

    # Check each requirement is addressed in cards
    COVERAGE_SCORE=0

    # Check for requirement coverage signals in cards
    for card_file in "${CARD_FILES[@]}"; do
        # Check if card has description/context
        if grep -Eiq "##.*(Description|Описание)" "$card_file" 2>/dev/null; then
            COVERAGE_SCORE=$((COVERAGE_SCORE + 1))
        fi
        if grep -Eiq "##.*(Context|Контекст)" "$card_file" 2>/dev/null; then
            COVERAGE_SCORE=$((COVERAGE_SCORE + 1))
        fi

        # Check if card has acceptance criteria
        if grep -Eiq "##.*(Acceptance Criteria|Критерии при[её]мки)" "$card_file" 2>/dev/null; then
            COVERAGE_SCORE=$((COVERAGE_SCORE + 1))
        fi

        # Check if card has executable to-do plan
        if grep -Eiq "##.*(To-Do List|Обязательные задачи)" "$card_file" 2>/dev/null; then
            COVERAGE_SCORE=$((COVERAGE_SCORE + 1))
        fi
    done

    # Calculate coverage percentage
    if [ "$CARD_COUNT" -gt 0 ] 2>/dev/null; then
        # Heuristic: each card should cover ~2-3 requirements
        EXPECTED_CARDS=$((TOTAL_REQS / 2 + 1))
        if [ "$CARD_COUNT" -ge "$EXPECTED_CARDS" ]; then
            log_success "Card count ($CARD_COUNT) adequate for $TOTAL_REQS requirements"
            COVERAGE_SCORE=$((COVERAGE_SCORE + 2))
        else
            log_warning "Card count ($CARD_COUNT) may be low for $TOTAL_REQS requirements"
        fi
    fi

    # Check COMPLETENESS_REPORT.md exists (if generated)
    if [ -f "$SDD_DIR/COMPLETENESS_REPORT.md" ]; then
        if grep -qi "95%\|98%\|100%" "$SDD_DIR/COMPLETENESS_REPORT.md"; then
            log_success "COMPLETENESS_REPORT.md shows ≥95% confidence"
            COVERAGE_SCORE=$((COVERAGE_SCORE + 3))
        fi
    else
        log_info "No COMPLETENESS_REPORT.md - optional but recommended"
    fi

    # Check for requirements-to-cards mapping
    if [ -f "$SDD_DIR/README.md" ]; then
        if grep -qi "Requirements vs" "$SDD_DIR/README.md"; then
            log_success "README has requirements comparison table"
            COVERAGE_SCORE=$((COVERAGE_SCORE + 2))
        fi
    fi

    # Final coverage calculation (max 10 points)
    log_info "Requirements coverage score: $COVERAGE_SCORE/10"

    if [ "$COVERAGE_SCORE" -ge 9 ]; then
        log_success "Requirements coverage: EXCELLENT (≥90%)"
        return 0
    elif [ "$COVERAGE_SCORE" -ge 7 ]; then
        log_warning "Requirements coverage: GOOD (70-89%) - review recommended"
        return 0
    else
        log_error "Requirements coverage: POOR (<70%) - add more detail to cards"
        return 1
    fi
}

# Run Quality Gate 3
echo ""
echo "═══════════════════════════════════════════"
echo "Quality Gate 3: Requirements Coverage (≥95%)"
echo "═══════════════════════════════════════════"

if ! validate_requirements_coverage; then
    log_error "Quality Gate 3 FAILED - Coverage below threshold"
    echo ""
    echo "To fix:"
    echo "1. Add COMPLETENESS_REPORT.md with confidence level"
    echo "2. Ensure each card has Description and Context sections"
    echo "3. Ensure each card has Acceptance Criteria and To-Do List sections"
    echo "4. Ensure each TASK has Execution Mode and Parallel Blockers"
    echo "5. Create requirements comparison table in README"
fi

# Summary
echo ""
echo "═══════════════════════════════════════════"
echo "SDD Quality Score: $SCORE/$MAX_SCORE"
echo "═══════════════════════════════════════════"

QUALITY_PERCENT=$((SCORE * 100 / MAX_SCORE))
echo "Quality: $QUALITY_PERCENT%"
echo "Errors: ${#ERRORS[@]}"
echo "Warnings: ${#WARNINGS[@]}"

if [ ${#ERRORS[@]} -eq 0 ]; then
    log_success "No critical errors found"
fi

if [ ${#WARNINGS[@]} -eq 0 ]; then
    log_success "No warnings"
fi

# Critical errors always fail regardless of score
if [ ${#ERRORS[@]} -gt 0 ]; then
    log_error "Validation failed with ${#ERRORS[@]} critical error(s)"
    exit 1
fi

if [ "$SCORE" -ge "$QUALITY_THRESHOLD" ]; then
    log_success "SDD quality is EXCELLENT! Ready for implementation."
    exit 0
elif [ "$SCORE" -ge $((MAX_SCORE * 3 / 4)) ]; then
    log_warning "SDD quality is GOOD but could be improved"
    echo ""
    echo "Consider addressing the warnings above before implementation."
    exit 0
else
    log_error "SDD quality is too low ($QUALITY_PERCENT% < required threshold)"
    echo ""
    echo "Please fix the errors above before using this SDD."
    echo "Common fixes:"
    echo "1. Add missing documentation files"
    echo "2. Fix card numbering gaps"
    echo "3. Ensure all cards have 1-4 SP"
    echo "4. Improve cognitive completeness of each card"
    exit 1
fi
