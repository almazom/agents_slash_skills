#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  assert,
  isDirectory,
  isFile,
  loadRunManifest,
  parseArgs,
  readJson,
  readJsonl,
  runRootFromReportsDir,
} = require("./cli_helpers");
const {
  ROLE_SLUGS,
  VERDICTS,
  WORKFLOW_COLUMNS,
  expectedCombinedFile,
  expectedReportFile,
  findRunIdInFilename,
  focusFingerprint,
  normalizeFocus,
  reportRootFromPackage,
  validateCombinedReport,
  validateKanban,
  validateReviewerReport,
  validateRunManifest,
  validateTrelloBoard,
  validateTrelloCards,
  validateTrelloLists,
} = require("./contracts");

const MOVE_PHASES = new Set([
  "pending",
  "remote_move",
  "remote_comment",
  "committed",
  "rolled_back",
  "reconciled_committed",
  "reconciled_abandoned",
  "remote_inconsistent",
]);

function expectedSourceReports(runId) {
  return ROLE_SLUGS.map((roleSlug) => expectedReportFile(roleSlug, runId, "json"));
}

function sameStringSet(left, right) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

function requireMarkdownSections(filePath, sections) {
  const text = fs.readFileSync(filePath, "utf8");
  sections.forEach((section) => {
    assert(text.includes(section), `${filePath} is missing section ${section}`);
  });
  return text;
}

function validateContext(runRoot, runManifest) {
  const contextDir = path.join(runRoot, "context");
  assert(isDirectory(contextDir), `Missing context directory: ${contextDir}`);
  const focusJsonPath = path.join(contextDir, "focus.json");
  const focusMdPath = path.join(contextDir, "focus.md");
  const reviewContextPath = path.join(contextDir, "review_context.json");

  assert(isFile(focusJsonPath), `Missing context focus JSON: ${focusJsonPath}`);
  assert(isFile(focusMdPath), `Missing context focus markdown: ${focusMdPath}`);
  assert(isFile(reviewContextPath), `Missing review context JSON: ${reviewContextPath}`);

  const focusPayload = readJson(focusJsonPath);
  assert(focusPayload.selected, "focus.json must contain selected focus");
  const normalizedFocus = normalizeFocus(focusPayload.selected);
  assert(
    focusFingerprint(normalizedFocus) === focusFingerprint(runManifest.focus),
    "run manifest focus does not match context/focus.json"
  );

  const focusMarkdown = requireMarkdownSections(focusMdPath, ["# Review Focus", `- Type: ${normalizedFocus.type}`]);
  assert(focusMarkdown.includes(normalizedFocus.label), "focus.md must include selected focus label");

  const reviewContext = readJson(reviewContextPath);
  assert(reviewContext.run_id === runManifest.run_id, "review_context.json run_id must match run manifest");
  assert(reviewContext.focus_type === normalizedFocus.type, "review_context focus_type must match selected focus");
  assert(reviewContext.focus_label === normalizedFocus.label, "review_context focus_label must match selected focus");
  assert(isFile(reviewContext.artifacts.focus_json), "review_context.focus_json path must exist");
  assert(isFile(reviewContext.artifacts.focus_md), "review_context.focus_md path must exist");
  assert(isFile(reviewContext.artifacts.changed_files), "review_context.changed_files path must exist");
  assert(isFile(reviewContext.artifacts.diff_patch), "review_context.diff_patch path must exist");
  if (reviewContext.artifacts.status_txt) {
    assert(isFile(reviewContext.artifacts.status_txt), "review_context.status_txt path must exist");
  }
}

function validateNoMixedRuns(reportsDir, runId) {
  const files = fs.readdirSync(reportsDir);
  const timestamps = new Set(files.map((file) => findRunIdInFilename(file)).filter(Boolean));
  assert(timestamps.size <= 1, `reports dir mixes multiple run ids: ${Array.from(timestamps).join(", ")}`);
  if (timestamps.size === 1) {
    assert(timestamps.has(runId), `reports dir run id does not match run manifest: ${runId}`);
  }
}

function validateReviewerMarkdown(reportsDir, roleSlug, payload, runId) {
  const markdownPath = path.join(reportsDir, expectedReportFile(roleSlug, runId, "md"));
  const text = requireMarkdownSections(markdownPath, [
    `# ${payload.reviewer_role} Report - ${runId}`,
    "## Verdict",
    "## Findings",
    "## Confidence",
    "## Recommended Action",
    "## Story Points Estimate",
  ]);
  assert(text.includes(payload.verdict), `${markdownPath} must include the verdict from JSON`);
  assert(text.includes(payload.recommended_action), `${markdownPath} must include the recommended action from JSON`);
}

function validateReviewerPairs(reportsDir, runManifest) {
  const files = new Set(fs.readdirSync(reportsDir));
  const reports = [];
  for (const roleSlug of ROLE_SLUGS) {
    const jsonFile = expectedReportFile(roleSlug, runManifest.run_id, "json");
    const mdFile = expectedReportFile(roleSlug, runManifest.run_id, "md");
    assert(files.has(jsonFile), `Missing reviewer JSON: ${jsonFile}`);
    assert(files.has(mdFile), `Missing reviewer Markdown: ${mdFile}`);
    const payload = validateReviewerReport(readJson(path.join(reportsDir, jsonFile)), {
      expectedSlug: roleSlug,
      runId: runManifest.run_id,
    });
    assert(
      focusFingerprint(payload.focus) === focusFingerprint(runManifest.focus),
      `reviewer report ${roleSlug} focus does not match run manifest`
    );
    validateReviewerMarkdown(reportsDir, roleSlug, payload, runManifest.run_id);
    reports.push({
      ...payload,
      report_file_json: jsonFile,
      report_file_md: mdFile,
    });
  }
  return reports;
}

function expectedOverallVerdict(reviewerReports, combinedReport) {
  if (
    combinedReport.findings.some((finding) => finding.priority === "P0") ||
    reviewerReports.some((report) => report.verdict === "BLOCKED")
  ) {
    return "BLOCKED";
  }
  return combinedReport.findings.length > 0 ? "APPROVED_WITH_NOTES" : "LGTM";
}

function validateCombinedMarkdown(reportsDir, combinedReport, runId) {
  const markdownPath = path.join(reportsDir, expectedCombinedFile(runId, "md"));
  const text = requireMarkdownSections(markdownPath, [
    `# 6 Reviewers Combined Report - ${runId}`,
    "## Source",
    "## Overall Verdict",
    "## Sprint Planning Summary",
    "## Expert-by-Expert Summary",
    "## Source Reports",
  ]);
  assert(text.includes(combinedReport.overall_verdict), `${markdownPath} must include the overall verdict`);
}

function validateCombinedArtifacts(reportsDir, runManifest, reviewerReports) {
  const combinedJsonFile = expectedCombinedFile(runManifest.run_id, "json");
  const combinedMdFile = expectedCombinedFile(runManifest.run_id, "md");
  const combinedJsonPath = path.join(reportsDir, combinedJsonFile);
  const combinedMdPath = path.join(reportsDir, combinedMdFile);
  assert(isFile(combinedJsonPath), `Missing combined JSON: ${combinedJsonFile}`);
  assert(isFile(combinedMdPath), `Missing combined Markdown: ${combinedMdFile}`);
  const combined = validateCombinedReport(readJson(combinedJsonPath), {
    runId: runManifest.run_id,
    expectedSourceReports: expectedSourceReports(runManifest.run_id),
    expectedFocusFingerprint: focusFingerprint(runManifest.focus),
  });

  validateCombinedMarkdown(reportsDir, combined, runManifest.run_id);

  const reviewerBySlug = new Map(reviewerReports.map((report) => [report.reviewer_slug, report]));
  combined.reviewer_summaries.forEach((summary) => {
    const report = reviewerBySlug.get(summary.reviewer_slug);
    assert(report, `combined reviewer summary points to unknown reviewer slug ${summary.reviewer_slug}`);
    assert(summary.report_file_json === report.report_file_json, `combined summary report_file_json mismatch for ${summary.reviewer_slug}`);
    assert(summary.report_file_md === report.report_file_md, `combined summary report_file_md mismatch for ${summary.reviewer_slug}`);
    assert(summary.verdict === report.verdict, `combined summary verdict mismatch for ${summary.reviewer_slug}`);
    assert(
      summary.story_points_total === report.findings.reduce((sum, finding) => sum + finding.story_points, 0),
      `combined summary story_points_total mismatch for ${summary.reviewer_slug}`
    );
  });

  const findingById = new Map();
  reviewerReports.forEach((report) => {
    report.findings.forEach((finding) => {
      findingById.set(finding.id, { finding, report });
    });
  });

  combined.findings.forEach((finding) => {
    const sourceReports = new Set();
    finding.source_finding_ids.forEach((findingId) => {
      const source = findingById.get(findingId);
      assert(source, `combined finding ${finding.id} points to unknown source finding ${findingId}`);
      sourceReports.add(source.report.report_file_json);
    });
    assert(
      sameStringSet(sourceReports, finding.source_report_files),
      `combined finding ${finding.id} source_report_files do not match resolved reviewer findings`
    );
  });

  const expectedVerdict = expectedOverallVerdict(reviewerReports, combined);
  assert(
    combined.overall_verdict === expectedVerdict,
    `combined overall_verdict must be ${expectedVerdict}, got ${combined.overall_verdict}`
  );

  return combined;
}

function validatePackageArtifacts(packageDir, runManifest, reviewerReports, combinedReport) {
  [
    "START.md",
    "kanban.json",
    "00_backlog",
    "01_in_progress",
    "02_blocked",
    "03_review",
    "04_simplification",
    "05_auto_commit",
    "06_done",
    "reports",
    "trello",
  ].forEach((entry) => {
    const target = path.join(packageDir, entry);
    if (entry.endsWith(".md") || entry.endsWith(".json")) {
      assert(isFile(target), `Missing package file: ${target}`);
    } else {
      assert(isDirectory(target), `Missing package directory: ${target}`);
    }
  });

  const kanban = validateKanban(readJson(path.join(packageDir, "kanban.json")), {
    runId: runManifest.run_id,
  });
  assert(
    kanban.meta.source_combined_report === expectedCombinedFile(runManifest.run_id, "json"),
    "kanban source_combined_report must point to the run combined JSON"
  );
  assert(
    kanban.meta.source_focus === combinedReport.source.focus.label,
    "kanban source_focus must match combined report focus"
  );
  assert(
    sameStringSet(kanban.source_reports, combinedReport.source.reports),
    "kanban source_reports must equal combined report source set"
  );

  const packageReportsDir = reportRootFromPackage(packageDir);
  const expectedPackagedFiles = [
    ...ROLE_SLUGS.flatMap((roleSlug) => [
      expectedReportFile(roleSlug, runManifest.run_id, "json"),
      expectedReportFile(roleSlug, runManifest.run_id, "md"),
    ]),
    expectedCombinedFile(runManifest.run_id, "json"),
    expectedCombinedFile(runManifest.run_id, "md"),
  ];
  expectedPackagedFiles.forEach((fileName) => {
    assert(isFile(path.join(packageReportsDir, fileName)), `Missing packaged report artifact: ${fileName}`);
  });
  assert(
    sameStringSet(fs.readdirSync(packageReportsDir), expectedPackagedFiles),
    "package reports directory must contain exactly the current run cohort"
  );

  const combinedFindingById = new Map(combinedReport.findings.map((finding) => [finding.id, finding]));
  for (const entry of WORKFLOW_COLUMNS) {
    const cardsInColumn = new Set(kanban.columns[entry.status].cards);
    for (const [cardId, card] of Object.entries(kanban.cards)) {
      if (card.status === entry.status) {
        assert(cardsInColumn.has(cardId), `cards.${cardId} status ${entry.status} must be listed in columns.${entry.status}.cards`);
      }
      const cardPath = path.join(packageDir, card.column, card.file);
      assert(isFile(cardPath), `Card markdown missing for ${cardId}: ${cardPath}`);
      const sourceFinding = combinedFindingById.get(card.source_finding_id);
      assert(sourceFinding, `cards.${cardId} points to unknown source finding ${card.source_finding_id}`);
      assert(card.priority === sourceFinding.priority, `cards.${cardId} priority must match combined finding`);
      assert(card.summary === sourceFinding.summary, `cards.${cardId} summary must match combined finding`);
      assert(card.recommended_action === sourceFinding.recommended_action, `cards.${cardId} recommended_action must match combined finding`);
      assert(
        card.file_refs.every((fileRef) => sourceFinding.file_refs.includes(fileRef)),
        `cards.${cardId} file_refs must be a subset of the combined finding file_refs`
      );
      assert(
        sameStringSet(card.source_report_files, sourceFinding.source_report_files),
        `cards.${cardId} source_report_files must match the combined finding`
      );
    }
    kanban.columns[entry.status].cards.forEach((cardId) => {
      assert(kanban.cards[cardId], `columns.${entry.status}.cards contains unknown card ${cardId}`);
      assert(
        kanban.cards[cardId].status === entry.status,
        `columns.${entry.status}.cards contains ${cardId} but card status is ${kanban.cards[cardId].status}`
      );
    });
  }

  if (kanban.workflow_rules.trello_sync.enabled) {
    assert(isFile(path.join(packageDir, "trello", "moves.jsonl")), "trello sync enabled but moves.jsonl is missing");
  }

  return kanban;
}

function validateMovesLog(movesLogPath, kanban, cardsArtifact) {
  const entries = readJsonl(movesLogPath);
  entries.forEach((entry, index) => {
    assert(MOVE_PHASES.has(entry.phase), `moves.jsonl entry ${index + 1} has unknown phase ${entry.phase}`);
    assert(kanban.cards[entry.package_card_id], `moves.jsonl entry ${index + 1} points to unknown card ${entry.package_card_id}`);
    if (entry.trello_card_id) {
      const artifact = cardsArtifact.cards.find((card) => card.package_card_id === entry.package_card_id);
      assert(artifact, `moves.jsonl entry ${index + 1} points to a card missing in cards.json`);
    }
  });
}

function validateTrelloArtifacts(trelloDir, packageDir) {
  const board = validateTrelloBoard(readJson(path.join(trelloDir, "board.json")));
  const lists = validateTrelloLists(readJson(path.join(trelloDir, "lists.json")));
  const cards = validateTrelloCards(readJson(path.join(trelloDir, "cards.json")));
  assert(cards.board_id === board.board_id, "trello cards board_id must match board.json");

  const kanban = readJson(path.join(packageDir, "kanban.json"));
  cards.cards.forEach((entry) => {
    const card = kanban.cards[entry.package_card_id];
    assert(card, `trello card maps to unknown kanban card: ${entry.package_card_id}`);
    assert(card.trello_card_id === entry.trello_card_id, `kanban trello_card_id mismatch for ${entry.package_card_id}`);
    assert(lists.by_name[entry.trello_list_name] === entry.trello_list_id, `trello list mapping mismatch for ${entry.package_card_id}`);
  });

  validateMovesLog(path.join(trelloDir, "moves.jsonl"), kanban, cards);
}

function capture(violations, phase, fn) {
  try {
    return fn();
  } catch (error) {
    violations.push({
      phase,
      message: error.message,
    });
    return null;
  }
}

function main() {
  const args = parseArgs(process.argv, {
    valueFlags: ["reports-dir", "package-dir", "trello-dir", "run-id"],
  });

  const reportsDir = args["reports-dir"];
  assert(reportsDir, "Missing --reports-dir");
  assert(isDirectory(reportsDir), `Reports directory does not exist: ${reportsDir}`);

  const violations = [];
  const runRoot = runRootFromReportsDir(reportsDir);
  const runManifest = capture(violations, "run_manifest", () =>
    validateRunManifest(loadRunManifest(runRoot), {
      runId: args["run-id"] || null,
    })
  );

  if (runManifest) {
    capture(violations, "context", () => validateContext(runRoot, runManifest));
  }

  if (runManifest) {
    capture(violations, "reports_dir", () => validateNoMixedRuns(reportsDir, runManifest.run_id));
  }

  const reviewerReports = runManifest
    ? capture(violations, "reviewer_reports", () => validateReviewerPairs(reportsDir, runManifest))
    : null;

  const combinedReport = runManifest && reviewerReports
    ? capture(violations, "combined_report", () => validateCombinedArtifacts(reportsDir, runManifest, reviewerReports))
    : null;

  if (args["package-dir"] && runManifest && reviewerReports && combinedReport) {
    capture(violations, "package", () => validatePackageArtifacts(args["package-dir"], runManifest, reviewerReports, combinedReport));
  }

  if (args["trello-dir"]) {
    assert(args["package-dir"], "--trello-dir requires --package-dir");
    capture(violations, "trello", () => validateTrelloArtifacts(args["trello-dir"], args["package-dir"]));
  }

  if (violations.length > 0) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          reports_dir: reportsDir,
          package_dir: args["package-dir"] || null,
          trello_dir: args["trello-dir"] || null,
          violations,
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        run_id: runManifest.run_id,
        reports_dir: reportsDir,
        package_dir: args["package-dir"] || null,
        trello_dir: args["trello-dir"] || null,
      },
      null,
      2
    )
  );
}

main();
