#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  assert,
  ensureDir,
  ensureRunManifest,
  loadRunManifest,
  parseArgs,
  readJson,
  runRootFromReportsDir,
  slugify,
  writeJson,
  writeText,
} = require("./cli_helpers");
const {
  COMMIT_PREFIX,
  ROLE_SPECS,
  STATUS_TO_COLUMN,
  STATUS_TO_TRELLO_LIST,
  defaultTrelloSync,
  emptyLaneEvidence,
  expectedCombinedFile,
  expectedReportFile,
  focusFingerprint,
  normalizeFocus,
  validateCombinedReport,
  validateRunManifest,
  workflowColumnsObject,
} = require("./contracts");

const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2 };
const MOVE_TRELLO_CARD_SCRIPT = path.join(__dirname, "move_trello_card.js");

function renderTemplate(template, values) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : ""
  );
}

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function cleanFilePath(fileRef) {
  return String(fileRef || "").split(":")[0];
}

function ownerKeyFromRef(fileRef) {
  const cleaned = cleanFilePath(fileRef);
  const parts = cleaned.split("/").filter(Boolean);
  if (!parts.length) {
    return "unknown";
  }
  return parts.slice(0, Math.min(parts.length, 2)).join("/");
}

function conflictKeyFromRef(fileRef) {
  const cleaned = cleanFilePath(fileRef);
  return cleaned || null;
}

function toChecklist(items) {
  return items.map((item) => `- [ ] ${item}`).join("\n");
}

function toBulletList(items, fallback = "- none") {
  if (!items.length) {
    return fallback;
  }
  return items.map((item) => `- ${item}`).join("\n");
}

function toNumberedList(items, fallback = "1. Review the generated artifacts.") {
  if (!items.length) {
    return fallback;
  }
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function describePriority(priority) {
  if (priority === "P0") {
    return "P0 - Merge blocker";
  }
  if (priority === "P1") {
    return "P1 - High priority";
  }
  return "P2 - Backlog";
}

function loadTemplates(templatesDir) {
  return {
    start: fs.readFileSync(path.join(templatesDir, "START.md.tmpl"), "utf8"),
    card: fs.readFileSync(path.join(templatesDir, "card.md.tmpl"), "utf8"),
  };
}

function buildAcceptanceCriteria(card) {
  const criteria = [
    "Implement the scoped fix without widening the card boundary.",
    "Add or update tests that prove the reported issue is resolved.",
    `Verify the concern raised by ${card.experts.join(", ")} no longer reproduces.`,
  ];
  if (card.experts.includes("API Guardian")) {
    criteria.push("Preserve contract compatibility or document the migration clearly.");
  }
  if (card.experts.includes("Security Auditor")) {
    criteria.push("Confirm malicious or malformed input no longer crosses the trust boundary.");
  }
  if (card.experts.includes("Simplicity Advocate")) {
    criteria.push("Prefer deletion or flattening over new indirection where safe.");
  }
  return criteria;
}

function buildTestingStrategy(card) {
  const items = [
    "Run the closest focused automated tests for the touched seam.",
    "Add one regression test that failed before the fix and passes after it.",
  ];
  if (card.experts.includes("Performance Engineer")) {
    items.push("Check the hot path or resource profile did not regress.");
  }
  if (card.experts.includes("Testability Engineer")) {
    items.push("Avoid brittle mocks when a realistic integration seam exists.");
  }
  if (card.experts.includes("API Guardian")) {
    items.push("Verify existing callers keep working against the updated contract.");
  }
  return items;
}

function buildRisks(card) {
  const items = [];
  if (card.blocker) {
    items.push("This item remains a merge blocker until the evidence is closed.");
  }
  if (card.size_exception) {
    items.push(card.size_exception_reason);
  }
  if (card.file_refs.length > 1) {
    items.push("The card spans multiple references; hidden coupling may still exist.");
  }
  items.push("Check adjacent callers and neighboring workflows before marking it done.");
  return items;
}

function buildOperatorVerification(card) {
  return [
    "Open the affected flow or output tied to this card.",
    "Verify the reported issue no longer reproduces.",
    "Verify the nearest neighboring behavior still works as expected.",
    card.blocker ? "Re-check the blocker condition before moving to Done." : "Record the result in a short Russian comment.",
  ];
}

function groupRefsByOwner(fileRefs) {
  const grouped = new Map();
  unique(fileRefs).forEach((fileRef) => {
    const ownerKey = ownerKeyFromRef(fileRef);
    if (!grouped.has(ownerKey)) {
      grouped.set(ownerKey, []);
    }
    grouped.get(ownerKey).push(fileRef);
  });

  return Array.from(grouped.entries())
    .map(([ownerKey, refs]) => ({
      ownerKey,
      refs: refs.sort(),
    }))
    .sort((left, right) => left.ownerKey.localeCompare(right.ownerKey));
}

function allocatePoints(totalPoints, slotCount) {
  const parts = Array.from({ length: slotCount }, () => Math.floor(totalPoints / slotCount));
  let remainder = totalPoints % slotCount;
  let index = slotCount - 1;
  while (remainder > 0) {
    parts[index] += 1;
    index = index === 0 ? slotCount - 1 : index - 1;
    remainder -= 1;
  }
  return parts;
}

function buildSliceLabel(baseTitle, slotGroups, index, total) {
  const seamHint = unique(slotGroups.map((group) => group.ownerKey)).slice(0, 2).join(" + ");
  if (total === 1) {
    return baseTitle;
  }
  return seamHint
    ? `${baseTitle} - ${seamHint} (${index}/${total})`
    : `${baseTitle} - part ${index}/${total}`;
}

function verifyRunCohort(runRoot, reportsDir, combinedJsonPath, combinedJson) {
  const runManifest = validateRunManifest(loadRunManifest(runRoot), {
    runId: combinedJson.meta.run_id,
  });
  const runId = combinedJson.meta.run_id;
  const expectedCombined = expectedCombinedFile(runId, path.extname(combinedJsonPath).slice(1) || "json");
  assert(
    path.basename(combinedJsonPath) === expectedCombined,
    `combined report filename does not match run id ${runId}`
  );

  for (const reportFile of fs.readdirSync(reportsDir)) {
    if (reportFile.endsWith(".json") || reportFile.endsWith(".md")) {
      if (reportFile.startsWith("combined_report_")) {
        continue;
      }
      const expected = ROLE_SPECS.some(([slug]) => {
        return (
          reportFile === expectedReportFile(slug, runId, "json") ||
          reportFile === expectedReportFile(slug, runId, "md")
        );
      });
      if (!expected) {
        throw new Error(`reports dir contains file outside run cohort ${runId}: ${reportFile}`);
      }
    }
  }

  assert(
    focusFingerprint(runManifest.focus) === focusFingerprint(combinedJson.source.focus),
    "combined report focus does not match run manifest focus"
  );
  return runManifest;
}

function shouldSplitFinding(finding, seamGroups) {
  if (finding.story_points <= 4) {
    return false;
  }
  if (seamGroups.length <= 1) {
    return false;
  }
  if (seamGroups.length > Math.floor(finding.story_points / 2)) {
    return false;
  }
  return true;
}

function deriveCardSlices(findings) {
  const counters = { P0: 0, P1: 0, P2: 0 };
  const cards = [];

  const sortedFindings = [...findings].sort((left, right) => {
    const priorityDelta = PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority];
    if (priorityDelta !== 0) {
      return priorityDelta;
    }
    if (left.story_points !== right.story_points) {
      return left.story_points - right.story_points;
    }
    return left.title.localeCompare(right.title);
  });

  for (const finding of sortedFindings) {
    const seamGroups = groupRefsByOwner(finding.file_refs);
    const splitOnSeams = shouldSplitFinding(finding, seamGroups);
    const slotCount = splitOnSeams ? seamGroups.length : 1;
    const allocatedPoints = allocatePoints(finding.story_points, slotCount);
    const slotGroups = splitOnSeams
      ? seamGroups.map((group) => [group])
      : [seamGroups.length ? seamGroups : [{ ownerKey: "unknown", refs: [] }]];
    const sizeException =
      finding.story_points > 4 && (
        !splitOnSeams ||
        allocatedPoints.some((value) => value < 2 || value > 4)
      );
    const sizeExceptionReason = sizeException
      ? "Карточка осталась больше 4 SP, потому что честный разрез по независимым швам не дал меньшие независимые задачи."
      : null;
    const parallelGroup = slotCount > 1 ? slugify(finding.id, "_") : null;
    const slotConflictSets = slotGroups.map((groups) =>
      unique(groups.flatMap((group) => group.refs.map(conflictKeyFromRef).filter(Boolean)))
    );
    const disjointSlots =
      slotCount === 1
        ? slotConflictSets[0].length > 0
        : slotConflictSets.every(
            (set, setIndex) =>
              set.length > 0 &&
              slotConflictSets.every(
                (otherSet, otherIndex) =>
                  otherIndex === setIndex || otherSet.every((item) => !set.includes(item))
              )
          );

    slotGroups.forEach((groups, index) => {
      counters[finding.priority] += 1;
      const cardId = `${finding.priority}_${String(counters[finding.priority]).padStart(3, "0")}`;
      const fileRefs = unique(groups.flatMap((group) => group.refs));
      const ownershipKeys = unique(groups.map((group) => group.ownerKey));
      const conflictKeys = unique(fileRefs.map(conflictKeyFromRef).filter(Boolean));
      const parallelSafe =
        splitOnSeams &&
        !sizeException &&
        conflictKeys.length > 0 &&
        !conflictKeys.includes("unknown") &&
        disjointSlots;
      const sliceBoundary = ownershipKeys.length
        ? `Owns changes under: ${ownershipKeys.join(", ")}`
        : "Owns a single unresolved scope with no explicit seam evidence.";
      const sliceScope =
        slotCount > 1
          ? `This slice owns ${ownershipKeys.join(", ")} and must not expand into sibling slices of ${finding.id}.`
          : `This card owns the full finding scope for ${finding.id}.`;
      const parallelRationale = parallelSafe
        ? "Marked parallel-safe because conflict_keys are explicit and disjoint from sibling slices."
        : "Not parallel-safe unless an operator verifies conflict-free execution.";
      const card = {
        card_id: cardId,
        source_finding_id: finding.id,
        title: buildSliceLabel(finding.title, groups, index + 1, slotCount),
        priority: finding.priority,
        priority_label: describePriority(finding.priority),
        story_points: allocatedPoints[index],
        size_exception: sizeException,
        size_exception_reason: sizeException ? sizeExceptionReason : null,
        split_strategy: slotCount > 1 ? "ownership-seams" : "single-scope",
        split_required: finding.story_points > 4,
        experts: finding.experts,
        source_report_files: finding.source_report_files,
        blocker: finding.merge_blocker,
        file_refs: fileRefs,
        ownership_keys: ownershipKeys,
        conflict_keys: conflictKeys,
        summary: finding.summary,
        recommended_action: finding.recommended_action,
        depends_on: [],
        parallel_safe: parallelSafe,
        parallel_group: parallelGroup,
        slice_boundary: sliceBoundary,
        slice_scope: sliceScope,
        parallel_rationale: parallelRationale,
        simplification_win: Boolean(finding.simplification_win),
        estimate_spread: finding.estimate_spread,
      };
      cards.push(card);
    });
  }

  return cards;
}

function buildKanbanJson(combinedJson, combinedJsonPath, cards, packageId, runId) {
  const columns = workflowColumnsObject();
  const cardMap = {};

  cards.forEach((card) => {
    columns.backlog.cards.push(card.card_id);
    cardMap[card.card_id] = {
      title: card.title,
      priority: card.priority,
      story_points: card.story_points,
      status: "backlog",
      column: STATUS_TO_COLUMN.backlog,
      file: `${card.card_id}_${slugify(card.title)}.md`,
      experts: card.experts,
      source_finding_id: card.source_finding_id,
      source_report_files: card.source_report_files,
      blocker: card.blocker,
      summary: card.summary,
      recommended_action: card.recommended_action,
      acceptance_criteria: buildAcceptanceCriteria(card),
      testing_strategy: buildTestingStrategy(card),
      main_risks: buildRisks(card),
      depends_on: card.depends_on,
      parallel_safe: card.parallel_safe,
      parallel_group: card.parallel_group,
      ownership_keys: card.ownership_keys,
      conflict_keys: card.conflict_keys,
      file_refs: card.file_refs,
      split_strategy: card.split_strategy,
      split_required: card.split_required,
      size_exception: card.size_exception,
      size_exception_reason: card.size_exception_reason,
      estimate_spread: card.estimate_spread,
      slice_boundary: card.slice_boundary,
      slice_scope: card.slice_scope,
      parallel_rationale: card.parallel_rationale,
      trello_card_id: null,
      trello_list_id: null,
      trello_list_name: STATUS_TO_TRELLO_LIST.backlog,
      git_branch: null,
      commits: [],
      started_at: null,
      completed_at: null,
      lane_evidence: emptyLaneEvidence(),
    };
  });

  columns.in_progress.rule = "Run together only when depends_on is empty and conflict_keys do not overlap.";
  columns.blocked.rule = "Blocked cards need a short Russian blocker comment plus machine-readable blocker reason.";
  columns.review.rule = "Before Review, run codex_wp review and store selector, verdict, and summary.";
  columns.simplification.rule = "Before Simplification, run $code-simplification and store outcome evidence.";
  columns.auto_commit.rule = "Before Auto-commit, run $auto-commit and store commit evidence or blocked reason.";
  columns.done.rule = "Done requires truthful lane evidence and synced Trello state.";

  return {
    meta: {
      package_id: packageId,
      run_id: runId,
      created_at: new Date().toISOString(),
      source_focus: combinedJson.source.focus.label || combinedJson.source.focus.type || "unknown",
      source_combined_report: path.basename(combinedJsonPath),
      total_story_points: cards.reduce((sum, card) => sum + card.story_points, 0),
      status: "ready_for_implementation",
    },
    source_reports: combinedJson.source.reports,
    workflow_rules: {
      wip_limit: 4,
      require_review: true,
      atomic_commits: true,
      task_size_story_points: {
        target_min: 2,
        target_max: 4,
        allow_truthful_exception: true,
      },
      max_parallel_subagents: 4,
      parallel_policy: "Only ready cards with disjoint conflict_keys and no unmet depends_on may run together.",
      commit_prefix: COMMIT_PREFIX,
      trello_sync: defaultTrelloSync(),
    },
    columns,
    cards: cardMap,
  };
}

function copyReports(reportsDir, packageReportsDir, runId) {
  ensureDir(packageReportsDir);
  const expectedFiles = [
    ...ROLE_SPECS.flatMap(([slug]) => [
      expectedReportFile(slug, runId, "json"),
      expectedReportFile(slug, runId, "md"),
    ]),
    expectedCombinedFile(runId, "json"),
    expectedCombinedFile(runId, "md"),
  ];
  expectedFiles.forEach((entry) => {
    const sourcePath = path.join(reportsDir, entry);
    const targetPath = path.join(packageReportsDir, entry);
    assert(fs.statSync(sourcePath).isFile(), `Missing expected report artifact: ${sourcePath}`);
    fs.copyFileSync(sourcePath, targetPath);
  });
}

function buildLaneRequirements(card, packageDir) {
  const base = `node "${MOVE_TRELLO_CARD_SCRIPT}" --package-dir "${packageDir}" --package-card-id ${card.card_id}`;
  return [
    "### Next legal moves",
    "",
    "```bash",
    `${base} --to-list "In progress"`,
    `${base} --to-list "Blocked" --blocked-reason "..."`,
    `${base} --to-list "Review" --review-selector="--base main" --review-verdict LGTM --review-summary "Ключевой итог ревью."`,
    `${base} --to-list "Simplification" --simplification-outcome "Упростил без смены поведения." --simplification-summary "Что именно стало проще."`,
    `${base} --to-list "Auto-commit" --commit-sha abc123 --commit-subject "fix: short subject"`,
    `${base} --to-list "Done" --done-summary "Итог по карточке."`,
    "```",
    "",
    "### Gate conditions",
    "",
    `- Review: нужен реальный \`codex_wp review\` и сохранённые selector/verdict/summary.`,
    `- Simplification: нужен запуск \`$code-simplification\` и краткий итог.`,
    `- Auto-commit: нужен \`$auto-commit\` и commit evidence или blocked reason.`,
    `- Done: нужны закрытые Review, Simplification и Auto-commit evidence.`,
    "",
    "### Russian comment shape",
    "",
    "- In progress: `Взял в работу.`",
    "- Blocked: `Есть блокер: ...`",
    "- Review: `Ревью: LGTM - ...` или `Ревью: BLOCKED - ...`",
    "- Simplification: `Упростил: ...`",
    "- Auto-commit: `Коммит: abc123 ...` или `Коммит блокирован: ...`",
    "- Done: `Готово: ...`",
  ].join("\n");
}

function renderCardMarkdown(cardTemplate, cardId, card) {
  const branchPrefix = card.simplification_win
    ? COMMIT_PREFIX.simplification
    : COMMIT_PREFIX[card.priority] || "chore:";
  const branchName = `${branchPrefix.replace(":", "")}/${slugify(cardId)}-${slugify(card.title).slice(0, 48)}`;

  return renderTemplate(cardTemplate, {
    card_id: cardId,
    title: card.title,
    priority: card.priority,
    priority_label: describePriority(card.priority),
    story_points: String(card.story_points),
    user_story: `As the implementation engineer, I want to resolve ${card.title.toLowerCase()}, so that the reviewed issue is closed without dragging unrelated scope.`,
    operator_verification: toNumberedList(buildOperatorVerification(card)),
    what_you_will_see: `A focused change with clear boundaries. Status starts in ${card.status}. Parallel safe: ${card.parallel_safe ? "yes" : "no"}.`,
    definition_of_done: toBulletList([
      "The reviewed issue is resolved inside this card boundary.",
      "Tests and manual verification cover the reported risk.",
      "The Trello card and kanban state move with truthful evidence.",
    ]),
    technical_details: toBulletList([
      card.summary,
      `Recommended action: ${card.recommended_action}`,
      `Experts: ${card.experts.join(", ")}`,
      `Source finding: ${card.source_finding_id}`,
      `File refs: ${card.file_refs.join(", ") || "none"}`,
      `Ownership keys: ${card.ownership_keys.join(", ") || "unknown"}`,
      `Conflict keys: ${card.conflict_keys.join(", ") || "unknown"}`,
      `Split strategy: ${card.split_strategy}`,
      `Estimate spread: ${card.estimate_spread ? `${card.estimate_spread.min}-${card.estimate_spread.max} (${card.estimate_spread.consensus_method})` : "unknown"}`,
      `Slice boundary: ${card.slice_boundary || "none"}`,
      `Slice scope: ${card.slice_scope || "none"}`,
      `Parallel rationale: ${card.parallel_rationale || "none"}`,
      `Suggested branch: ${branchName}`,
      `Commit prefix: ${branchPrefix}`,
      card.size_exception_reason || "Target size stays within 2-4 story points or has no truthful exception.",
    ]),
    technical_acceptance_criteria: toChecklist(card.acceptance_criteria),
    dependencies: toBulletList(card.depends_on, "- none"),
    research_references: toBulletList(card.source_report_files.map((file) => `reports/${file}`), "- none"),
    what_this_is_not: toBulletList([
      "Not permission to widen scope beyond the reviewed issue.",
      "Not a request for unrelated cleanup in nearby code.",
      "Not a substitute for Review, Simplification, or Auto-commit evidence.",
    ]),
    lane_requirements: buildLaneRequirements(card, "<PACKAGE_DIR>"),
    testing_strategy: toBulletList(card.testing_strategy),
    main_risks: toBulletList(card.main_risks),
    git_branch: branchName,
    commit_prefix: branchPrefix,
  });
}

function buildStartMarkdown(startTemplate, packageDir, packageId, combinedJson, kanbanJson) {
  const counts = Object.fromEntries(
    Object.entries(kanbanJson.columns).map(([status, entry]) => [status, entry.cards.length])
  );
  return renderTemplate(startTemplate, {
    package_id: packageId,
    package_dir: packageDir,
    created_at: new Date().toISOString(),
    source_focus: combinedJson.source.focus.label || combinedJson.source.focus.type || "unknown",
    backlog_count: String(counts.backlog || 0),
    in_progress_count: String(counts.in_progress || 0),
    blocked_count: String(counts.blocked || 0),
    review_count: String(counts.review || 0),
    simplification_count: String(counts.simplification || 0),
    auto_commit_count: String(counts.auto_commit || 0),
    done_count: String(counts.done || 0),
    total_points: String(kanbanJson.meta.total_story_points),
    completed_points: "0",
    kanban_path: path.join(packageDir, "kanban.json"),
    board_json_path: path.join(packageDir, "trello", "board.json"),
    cards_json_path: path.join(packageDir, "trello", "cards.json"),
    moves_jsonl_path: path.join(packageDir, "trello", "moves.jsonl"),
    board_url: "See trello/board.json after export.",
    move_script: MOVE_TRELLO_CARD_SCRIPT,
  });
}

function main() {
  const args = parseArgs(process.argv, {
    valueFlags: ["combined-json", "reports-dir", "templates-dir", "out-dir"],
  });

  const combinedJsonPath = args["combined-json"];
  const reportsDir = args["reports-dir"];
  const templatesDir = args["templates-dir"];
  if (!combinedJsonPath || !reportsDir || !templatesDir) {
    throw new Error(
      "Usage: build_sdd_package.js --combined-json /abs/report.json --reports-dir /abs/reports --templates-dir /abs/templates [--out-dir DIR]"
    );
  }

  const combinedJson = readJson(combinedJsonPath);
  validateCombinedReport(combinedJson, { runId: combinedJson.meta?.run_id || null });

  const runRoot = runRootFromReportsDir(reportsDir);
  const runManifest = verifyRunCohort(runRoot, reportsDir, combinedJsonPath, combinedJson);
  const runId = combinedJson.meta.run_id;
  const packageId = `sdd_${runId}`;
  const packageDir = args["out-dir"] || path.join(runRoot, `sdd_package_${runId}`);
  const packageReportsDir = path.join(packageDir, "reports");
  const trelloDir = path.join(packageDir, "trello");
  const templates = loadTemplates(templatesDir);

  [
    packageDir,
    path.join(packageDir, "00_backlog"),
    path.join(packageDir, "01_in_progress"),
    path.join(packageDir, "02_blocked"),
    path.join(packageDir, "03_review"),
    path.join(packageDir, "04_simplification"),
    path.join(packageDir, "05_auto_commit"),
    path.join(packageDir, "06_done"),
    packageReportsDir,
    trelloDir,
  ].forEach(ensureDir);

  copyReports(reportsDir, packageReportsDir, runId);

  const cards = deriveCardSlices(combinedJson.findings || []);
  const kanbanJson = buildKanbanJson(combinedJson, combinedJsonPath, cards, packageId, runId);

  const startMarkdown = buildStartMarkdown(templates.start, packageDir, packageId, combinedJson, kanbanJson)
    .replaceAll("<PACKAGE_DIR>", packageDir);
  writeText(path.join(packageDir, "START.md"), startMarkdown);
  writeJson(path.join(packageDir, "kanban.json"), kanbanJson);
  writeJson(path.join(trelloDir, "cards.json"), {
    host: kanbanJson.workflow_rules.trello_sync.host,
    board_id: null,
    cards: [],
  });
  writeText(path.join(trelloDir, "moves.jsonl"), "");

  Object.entries(kanbanJson.cards).forEach(([cardId, card]) => {
    const cardMarkdown = renderCardMarkdown(templates.card, cardId, { ...card, card_id: cardId })
      .replaceAll("<PACKAGE_DIR>", packageDir);
    writeText(path.join(packageDir, STATUS_TO_COLUMN[card.status], card.file), cardMarkdown);
  });

  ensureRunManifest(runRoot, {
    focus: normalizeFocus(runManifest.focus),
    phases: {
      package_built: new Date().toISOString(),
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        run_id: runId,
        package_dir: packageDir,
        kanban_json: path.join(packageDir, "kanban.json"),
        start_md: path.join(packageDir, "START.md"),
        backlog_cards: cards.length,
      },
      null,
      2
    )
  );
}

main();
