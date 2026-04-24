#!/usr/bin/env node

const path = require("path");
const { assert } = require("./cli_helpers");

const ROLE_SPECS = [
  ["security_auditor", "Security Auditor"],
  ["performance_engineer", "Performance Engineer"],
  ["maintainer", "Maintainer"],
  ["simplicity_advocate", "Simplicity Advocate"],
  ["testability_engineer", "Testability Engineer"],
  ["api_guardian", "API Guardian"],
];

const ROLE_SLUGS = ROLE_SPECS.map(([slug]) => slug);
const ROLE_LABELS = Object.fromEntries(ROLE_SPECS);

const VERDICTS = new Set(["BLOCKED", "APPROVED_WITH_NOTES", "LGTM"]);
const SEVERITIES = new Set(["critical", "high", "medium", "low", "info"]);
const PRIORITIES = new Set(["P0", "P1", "P2"]);

const WORKFLOW_COLUMNS = [
  { status: "backlog", column: "00_backlog", trello_list: "Backlog", order: 0, wip_limit: null },
  { status: "in_progress", column: "01_in_progress", trello_list: "In progress", order: 1, wip_limit: 4 },
  { status: "blocked", column: "02_blocked", trello_list: "Blocked", order: 2, wip_limit: null },
  { status: "review", column: "03_review", trello_list: "Review", order: 3, wip_limit: null },
  { status: "simplification", column: "04_simplification", trello_list: "Simplification", order: 4, wip_limit: null },
  { status: "auto_commit", column: "05_auto_commit", trello_list: "Auto-commit", order: 5, wip_limit: null },
  { status: "done", column: "06_done", trello_list: "Done", order: 6, wip_limit: null },
];

const WORKFLOW_STATUS_SET = new Set(WORKFLOW_COLUMNS.map((entry) => entry.status));
const STATUS_TO_COLUMN = Object.fromEntries(WORKFLOW_COLUMNS.map((entry) => [entry.status, entry.column]));
const STATUS_TO_TRELLO_LIST = Object.fromEntries(
  WORKFLOW_COLUMNS.map((entry) => [entry.status, entry.trello_list])
);
const TRELLO_LIST_TO_STATUS = Object.fromEntries(
  WORKFLOW_COLUMNS.map((entry) => [entry.trello_list, entry.status])
);

const COMMIT_PREFIX = {
  P0: "fix:",
  P1: "refactor:",
  P2: "chore:",
  simplification: "simplify:",
};

function workflowColumnsObject() {
  return Object.fromEntries(
    WORKFLOW_COLUMNS.map((entry) => [
      entry.status,
      {
        order: entry.order,
        wip_limit: entry.wip_limit,
        cards: [],
      },
    ])
  );
}

function defaultTrelloSync(overrides = {}) {
  return {
    enabled: false,
    projection_mode: "mirror",
    host: "pets",
    board_id: null,
    board_name: null,
    board_url: null,
    exported_at: null,
    comment_language: "ru-simple",
    review_command: "codex_wp review",
    simplification_skill: "$code-simplification",
    auto_commit_skill: "$auto-commit",
    pair_move_with_comment: true,
    required_lists: WORKFLOW_COLUMNS.map((entry) => entry.trello_list),
    ...overrides,
  };
}

function emptyLaneEvidence() {
  return {
    review: {
      required: true,
      command: "codex_wp review",
      selector: null,
      verdict: null,
      summary: null,
      report_ref: null,
      completed_at: null,
    },
    simplification: {
      required: true,
      command: "$code-simplification",
      outcome: null,
      summary: null,
      completed_at: null,
    },
    auto_commit: {
      required: true,
      command: "$auto-commit",
      commit_sha: null,
      commit_subject: null,
      blocked_reason: null,
      completed_at: null,
    },
    blocked: {
      reason: null,
      recorded_at: null,
    },
    done: {
      summary: null,
      completed_at: null,
    },
    comments: [],
  };
}

function requireObject(value, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  return value;
}

function requireString(value, label) {
  assert(typeof value === "string" && value.trim().length > 0, `${label} must be a non-empty string`);
  return value;
}

function requireNullableString(value, label) {
  assert(
    value === null || (typeof value === "string" && value.trim().length > 0),
    `${label} must be null or a non-empty string`
  );
  return value;
}

function requireNumber(value, label) {
  assert(typeof value === "number" && Number.isFinite(value), `${label} must be a number`);
  return value;
}

function requireArray(value, label) {
  assert(Array.isArray(value), `${label} must be an array`);
  return value;
}

function requireBoolean(value, label) {
  assert(typeof value === "boolean", `${label} must be a boolean`);
  return value;
}

function requireEnum(value, label, choices) {
  assert(choices.has(value), `${label} must be one of: ${Array.from(choices).join(", ")}`);
  return value;
}

function computeTotalsFromFindings(findings) {
  const totals = {
    P0: { count: 0, story_points: 0 },
    P1: { count: 0, story_points: 0 },
    P2: { count: 0, story_points: 0 },
  };
  findings.forEach((finding) => {
    totals[finding.priority].count += 1;
    totals[finding.priority].story_points += finding.story_points;
  });
  return totals;
}

function normalizeFocus(focus) {
  requireObject(focus, "focus");
  return {
    type: requireString(focus.type, "focus.type"),
    label: requireString(focus.label, "focus.label"),
    source_ref: focus.source_ref || null,
    number: focus.number || null,
    head_ref: focus.head_ref || null,
    base_ref: focus.base_ref || null,
    branch: focus.branch || null,
    base_branch: focus.base_branch || null,
    range_spec: focus.range_spec || null,
    file_count: focus.file_count ?? null,
  };
}

function focusFingerprint(focus) {
  const normalized = normalizeFocus(focus);
  return JSON.stringify(normalized);
}

function validateRunManifest(payload, options = {}) {
  requireObject(payload, "run manifest");
  requireString(payload.schema_version, "run manifest.schema_version");
  requireString(payload.run_id, "run manifest.run_id");
  if (options.runId) {
    assert(payload.run_id === options.runId, `run manifest run_id must be ${options.runId}`);
  }
  requireString(payload.run_root, "run manifest.run_root");
  requireNullableString(payload.repo_root, "run manifest.repo_root");
  requireObject(payload.phases, "run manifest.phases");
  requireObject(payload.focus, "run manifest.focus");
  normalizeFocus(payload.focus);
  requireArray(payload.notes, "run manifest.notes");
  return payload;
}

function validateReviewerReport(payload, options = {}) {
  requireObject(payload, "reviewer report");
  requireObject(payload.meta, "reviewer report.meta");
  requireString(payload.meta.schema_version, "reviewer report.meta.schema_version");
  requireString(payload.meta.run_id, "reviewer report.meta.run_id");
  if (options.runId) {
    assert(payload.meta.run_id === options.runId, `report run_id must be ${options.runId}`);
  }
  requireString(payload.reviewer_role, "reviewer_role");
  requireString(payload.reviewer_slug, "reviewer_slug");
  assert(ROLE_SLUGS.includes(payload.reviewer_slug), `reviewer_slug must be one of: ${ROLE_SLUGS.join(", ")}`);
  if (options.expectedSlug) {
    assert(payload.reviewer_slug === options.expectedSlug, `reviewer_slug must be ${options.expectedSlug}`);
  }
  normalizeFocus(payload.focus);
  requireEnum(payload.verdict, "verdict", VERDICTS);
  requireNumber(payload.confidence, "confidence");
  requireString(payload.recommended_action, "recommended_action");
  requireArray(payload.findings, "findings");

  payload.findings.forEach((finding, index) => {
    const prefix = `findings[${index}]`;
    requireObject(finding, prefix);
    requireString(finding.id, `${prefix}.id`);
    requireString(finding.title, `${prefix}.title`);
    requireString(finding.summary, `${prefix}.summary`);
    requireEnum(finding.severity, `${prefix}.severity`, SEVERITIES);
    requireEnum(finding.priority, `${prefix}.priority`, PRIORITIES);
    requireNumber(finding.confidence, `${prefix}.confidence`);
    requireArray(finding.file_refs, `${prefix}.file_refs`);
    requireString(finding.recommended_action, `${prefix}.recommended_action`);
    requireBoolean(finding.merge_blocker, `${prefix}.merge_blocker`);
    requireNumber(finding.story_points, `${prefix}.story_points`);
    requireArray(finding.dedupe_keys, `${prefix}.dedupe_keys`);
  });

  return payload;
}

function validateCombinedReport(payload, options = {}) {
  requireObject(payload, "combined report");
  requireObject(payload.meta, "combined report.meta");
  requireString(payload.meta.schema_version, "combined report.meta.schema_version");
  requireString(payload.meta.timestamp, "combined report.meta.timestamp");
  requireString(payload.meta.run_id, "combined report.meta.run_id");
  if (options.runId) {
    assert(payload.meta.run_id === options.runId, `combined report run_id must be ${options.runId}`);
  }
  requireObject(payload.source, "source");
  const normalizedFocus = normalizeFocus(payload.source.focus);
  requireArray(payload.source.reports, "source.reports");
  requireEnum(payload.overall_verdict, "overall_verdict", VERDICTS);
  requireObject(payload.totals, "totals");
  requireArray(payload.reviewer_summaries, "reviewer_summaries");
  requireArray(payload.findings, "findings");

  assert(payload.source.reports.length === ROLE_SPECS.length, "source.reports must contain all six reviewer reports");
  assert(payload.reviewer_summaries.length === ROLE_SPECS.length, "reviewer_summaries must contain all six reviewers");

  const seenReviewerSlugs = new Set();
  payload.reviewer_summaries.forEach((summary, index) => {
    const prefix = `reviewer_summaries[${index}]`;
    requireObject(summary, prefix);
    requireString(summary.reviewer_role, `${prefix}.reviewer_role`);
    requireString(summary.reviewer_slug, `${prefix}.reviewer_slug`);
    requireEnum(summary.verdict, `${prefix}.verdict`, VERDICTS);
    requireNumber(summary.confidence, `${prefix}.confidence`);
    requireString(summary.key_finding, `${prefix}.key_finding`);
    requireNumber(summary.story_points_total, `${prefix}.story_points_total`);
    requireString(summary.report_file_json, `${prefix}.report_file_json`);
    requireString(summary.report_file_md, `${prefix}.report_file_md`);
    assert(!seenReviewerSlugs.has(summary.reviewer_slug), `reviewer slug duplicated in combined report: ${summary.reviewer_slug}`);
    seenReviewerSlugs.add(summary.reviewer_slug);
  });

  payload.findings.forEach((finding, index) => {
    const prefix = `combined findings[${index}]`;
    requireObject(finding, prefix);
    requireString(finding.id, `${prefix}.id`);
    requireString(finding.title, `${prefix}.title`);
    requireString(finding.summary, `${prefix}.summary`);
    requireEnum(finding.severity, `${prefix}.severity`, SEVERITIES);
    requireEnum(finding.priority, `${prefix}.priority`, PRIORITIES);
    requireNumber(finding.story_points, `${prefix}.story_points`);
    requireArray(finding.experts, `${prefix}.experts`);
    requireArray(finding.source_report_files, `${prefix}.source_report_files`);
    requireArray(finding.source_finding_ids, `${prefix}.source_finding_ids`);
    requireArray(finding.file_refs, `${prefix}.file_refs`);
    requireArray(finding.dedupe_keys, `${prefix}.dedupe_keys`);
    requireString(finding.recommended_action, `${prefix}.recommended_action`);
    requireBoolean(finding.merge_blocker, `${prefix}.merge_blocker`);
    requireObject(finding.estimate_spread, `${prefix}.estimate_spread`);
    requireString(finding.estimate_spread.consensus_method, `${prefix}.estimate_spread.consensus_method`);
    requireNumber(finding.estimate_spread.min, `${prefix}.estimate_spread.min`);
    requireNumber(finding.estimate_spread.max, `${prefix}.estimate_spread.max`);
    requireArray(finding.estimate_spread.values, `${prefix}.estimate_spread.values`);
    finding.estimate_spread.values.forEach((value, valueIndex) => {
      requireNumber(value, `${prefix}.estimate_spread.values[${valueIndex}]`);
    });
  });

  const totals = computeTotalsFromFindings(payload.findings);
  for (const priority of PRIORITIES) {
    requireObject(payload.totals[priority], `totals.${priority}`);
    requireNumber(payload.totals[priority].count, `totals.${priority}.count`);
    requireNumber(payload.totals[priority].story_points, `totals.${priority}.story_points`);
    assert(
      payload.totals[priority].count === totals[priority].count,
      `totals.${priority}.count does not match findings`
    );
    assert(
      payload.totals[priority].story_points === totals[priority].story_points,
      `totals.${priority}.story_points does not match findings`
    );
  }

  if (options.expectedSourceReports) {
    const expected = [...options.expectedSourceReports].sort();
    const actual = [...payload.source.reports].sort();
    assert(
      JSON.stringify(actual) === JSON.stringify(expected),
      `source.reports does not match expected reviewer report set`
    );
  }
  if (options.expectedFocusFingerprint) {
    assert(
      focusFingerprint(normalizedFocus) === options.expectedFocusFingerprint,
      "combined report focus does not match expected focus"
    );
  }

  return payload;
}

function validateLaneEvidence(payload, label, currentStatus = null) {
  requireObject(payload, label);
  requireObject(payload.review, `${label}.review`);
  requireObject(payload.simplification, `${label}.simplification`);
  requireObject(payload.auto_commit, `${label}.auto_commit`);
  requireObject(payload.blocked, `${label}.blocked`);
  requireObject(payload.done, `${label}.done`);
  requireArray(payload.comments, `${label}.comments`);

  requireBoolean(payload.review.required, `${label}.review.required`);
  requireString(payload.review.command, `${label}.review.command`);
  requireNullableString(payload.review.selector, `${label}.review.selector`);
  if (payload.review.verdict !== null) {
    requireEnum(payload.review.verdict, `${label}.review.verdict`, VERDICTS);
  }
  requireNullableString(payload.review.summary, `${label}.review.summary`);
  requireNullableString(payload.review.report_ref, `${label}.review.report_ref`);
  requireNullableString(payload.review.completed_at, `${label}.review.completed_at`);

  requireBoolean(payload.simplification.required, `${label}.simplification.required`);
  requireString(payload.simplification.command, `${label}.simplification.command`);
  requireNullableString(payload.simplification.outcome, `${label}.simplification.outcome`);
  requireNullableString(payload.simplification.summary, `${label}.simplification.summary`);
  requireNullableString(payload.simplification.completed_at, `${label}.simplification.completed_at`);

  requireBoolean(payload.auto_commit.required, `${label}.auto_commit.required`);
  requireString(payload.auto_commit.command, `${label}.auto_commit.command`);
  requireNullableString(payload.auto_commit.commit_sha, `${label}.auto_commit.commit_sha`);
  requireNullableString(payload.auto_commit.commit_subject, `${label}.auto_commit.commit_subject`);
  requireNullableString(payload.auto_commit.blocked_reason, `${label}.auto_commit.blocked_reason`);
  requireNullableString(payload.auto_commit.completed_at, `${label}.auto_commit.completed_at`);

  requireNullableString(payload.blocked.reason, `${label}.blocked.reason`);
  requireNullableString(payload.blocked.recorded_at, `${label}.blocked.recorded_at`);
  requireNullableString(payload.done.summary, `${label}.done.summary`);
  requireNullableString(payload.done.completed_at, `${label}.done.completed_at`);

  payload.comments.forEach((entry, index) => {
    const prefix = `${label}.comments[${index}]`;
    requireObject(entry, prefix);
    requireNullableString(entry.at ?? null, `${prefix}.at`);
    requireNullableString(entry.status ?? null, `${prefix}.status`);
    requireString(entry.text, `${prefix}.text`);
  });

  if (currentStatus === "blocked") {
    requireString(payload.blocked.reason, `${label}.blocked.reason`);
    requireString(payload.blocked.recorded_at, `${label}.blocked.recorded_at`);
  }

  if (currentStatus === "review" || currentStatus === "simplification" || currentStatus === "auto_commit" || currentStatus === "done") {
    requireString(payload.review.selector, `${label}.review.selector`);
    requireEnum(payload.review.verdict, `${label}.review.verdict`, VERDICTS);
    requireString(payload.review.summary, `${label}.review.summary`);
    requireString(payload.review.completed_at, `${label}.review.completed_at`);
  }

  if (currentStatus === "simplification" || currentStatus === "auto_commit" || currentStatus === "done") {
    requireString(payload.simplification.outcome, `${label}.simplification.outcome`);
    requireString(payload.simplification.summary, `${label}.simplification.summary`);
    requireString(payload.simplification.completed_at, `${label}.simplification.completed_at`);
  }

  if (currentStatus === "auto_commit" || currentStatus === "done") {
    const hasCommit = payload.auto_commit.commit_sha !== null && payload.auto_commit.commit_subject !== null;
    const hasBlockedReason = payload.auto_commit.blocked_reason !== null;
    assert(hasCommit || hasBlockedReason, `${label}.auto_commit requires commit evidence or blocked reason`);
    requireString(payload.auto_commit.completed_at, `${label}.auto_commit.completed_at`);
  }

  if (currentStatus === "done") {
    requireString(payload.done.summary, `${label}.done.summary`);
    requireString(payload.done.completed_at, `${label}.done.completed_at`);
  }
}

function validateKanban(payload, options = {}) {
  requireObject(payload, "kanban");
  requireObject(payload.meta, "meta");
  requireString(payload.meta.package_id, "meta.package_id");
  requireString(payload.meta.run_id, "meta.run_id");
  if (options.runId) {
    assert(payload.meta.run_id === options.runId, `kanban meta.run_id must be ${options.runId}`);
  }
  requireString(payload.meta.source_focus, "meta.source_focus");
  requireString(payload.meta.source_combined_report, "meta.source_combined_report");
  requireNumber(payload.meta.total_story_points, "meta.total_story_points");
  requireArray(payload.source_reports, "source_reports");
  requireObject(payload.workflow_rules, "workflow_rules");
  requireObject(payload.columns, "columns");
  requireObject(payload.cards, "cards");
  requireObject(payload.workflow_rules.trello_sync, "workflow_rules.trello_sync");
  requireArray(payload.workflow_rules.trello_sync.required_lists, "workflow_rules.trello_sync.required_lists");

  WORKFLOW_COLUMNS.forEach((entry) => {
    requireObject(payload.columns[entry.status], `columns.${entry.status}`);
    requireArray(payload.columns[entry.status].cards, `columns.${entry.status}.cards`);
  });

  for (const [cardId, card] of Object.entries(payload.cards)) {
    requireObject(card, `cards.${cardId}`);
    requireString(card.title, `cards.${cardId}.title`);
    requireEnum(card.priority, `cards.${cardId}.priority`, PRIORITIES);
    requireEnum(card.status, `cards.${cardId}.status`, WORKFLOW_STATUS_SET);
    requireString(card.column, `cards.${cardId}.column`);
    requireString(card.file, `cards.${cardId}.file`);
    requireString(card.source_finding_id, `cards.${cardId}.source_finding_id`);
    requireString(card.summary, `cards.${cardId}.summary`);
    requireString(card.recommended_action, `cards.${cardId}.recommended_action`);
    requireArray(card.acceptance_criteria, `cards.${cardId}.acceptance_criteria`);
    requireArray(card.testing_strategy, `cards.${cardId}.testing_strategy`);
    requireArray(card.main_risks, `cards.${cardId}.main_risks`);
    requireArray(card.depends_on, `cards.${cardId}.depends_on`);
    requireArray(card.file_refs, `cards.${cardId}.file_refs`);
    requireArray(card.experts, `cards.${cardId}.experts`);
    requireArray(card.source_report_files, `cards.${cardId}.source_report_files`);
    requireNumber(card.story_points, `cards.${cardId}.story_points`);
    requireArray(card.ownership_keys || [], `cards.${cardId}.ownership_keys`);
    requireArray(card.conflict_keys || [], `cards.${cardId}.conflict_keys`);
    requireBoolean(card.parallel_safe, `cards.${cardId}.parallel_safe`);
    requireBoolean(card.split_required, `cards.${cardId}.split_required`);
    requireBoolean(card.size_exception, `cards.${cardId}.size_exception`);
    requireString(card.split_strategy, `cards.${cardId}.split_strategy`);
    requireObject(card.estimate_spread, `cards.${cardId}.estimate_spread`);
    requireString(card.estimate_spread.consensus_method, `cards.${cardId}.estimate_spread.consensus_method`);
    requireNumber(card.estimate_spread.min, `cards.${cardId}.estimate_spread.min`);
    requireNumber(card.estimate_spread.max, `cards.${cardId}.estimate_spread.max`);
    requireArray(card.estimate_spread.values, `cards.${cardId}.estimate_spread.values`);
    requireNullableString(card.parallel_group ?? null, `cards.${cardId}.parallel_group`);
    requireNullableString(card.size_exception_reason ?? null, `cards.${cardId}.size_exception_reason`);
    requireNullableString(card.slice_scope ?? null, `cards.${cardId}.slice_scope`);
    requireNullableString(card.slice_boundary ?? null, `cards.${cardId}.slice_boundary`);
    requireNullableString(card.parallel_rationale ?? null, `cards.${cardId}.parallel_rationale`);
    requireNullableString(card.trello_card_id ?? null, `cards.${cardId}.trello_card_id`);
    requireNullableString(card.trello_list_id ?? null, `cards.${cardId}.trello_list_id`);
    requireString(card.trello_list_name, `cards.${cardId}.trello_list_name`);
    requireNullableString(card.started_at ?? null, `cards.${cardId}.started_at`);
    requireNullableString(card.completed_at ?? null, `cards.${cardId}.completed_at`);
    validateLaneEvidence(card.lane_evidence, `cards.${cardId}.lane_evidence`, card.status);
    assert(card.column === STATUS_TO_COLUMN[card.status], `cards.${cardId}.column must match status`);
    assert(card.trello_list_name === STATUS_TO_TRELLO_LIST[card.status], `cards.${cardId}.trello_list_name must match status`);
  }

  return payload;
}

function validateTrelloBoard(payload) {
  requireObject(payload, "trello board");
  requireString(payload.board_id, "board_id");
  requireString(payload.board_name, "board_name");
  requireString(payload.board_url, "board_url");
  return payload;
}

function validateTrelloLists(payload) {
  requireObject(payload, "trello lists");
  requireString(payload.board_id, "board_id");
  requireArray(payload.lists, "lists");
  requireObject(payload.by_name, "by_name");
  WORKFLOW_COLUMNS.forEach((entry) => {
    requireString(payload.by_name[entry.trello_list], `by_name.${entry.trello_list}`);
  });
  return payload;
}

function validateTrelloCards(payload) {
  requireObject(payload, "trello cards");
  requireString(payload.board_id, "board_id");
  requireArray(payload.cards, "cards");
  payload.cards.forEach((card, index) => {
    const prefix = `trello cards[${index}]`;
    requireObject(card, prefix);
    requireString(card.package_card_id, `${prefix}.package_card_id`);
    requireString(card.trello_card_id, `${prefix}.trello_card_id`);
    requireString(card.trello_list_id, `${prefix}.trello_list_id`);
    requireString(card.trello_list_name, `${prefix}.trello_list_name`);
  });
  return payload;
}

function findRunIdInFilename(fileName) {
  const match = fileName.match(/_(\d{8}T\d{6}Z)\.(json|md)$/);
  return match ? match[1] : null;
}

function expectedReportFile(roleSlug, runId, extension) {
  return `${roleSlug}_report_${runId}.${extension}`;
}

function expectedCombinedFile(runId, extension) {
  return `combined_report_${runId}.${extension}`;
}

function reportRootFromPackage(packageDir) {
  return path.join(packageDir, "reports");
}

module.exports = {
  COMMIT_PREFIX,
  PRIORITIES,
  ROLE_LABELS,
  ROLE_SLUGS,
  ROLE_SPECS,
  SEVERITIES,
  STATUS_TO_COLUMN,
  STATUS_TO_TRELLO_LIST,
  TRELLO_LIST_TO_STATUS,
  VERDICTS,
  WORKFLOW_COLUMNS,
  computeTotalsFromFindings,
  defaultTrelloSync,
  emptyLaneEvidence,
  expectedCombinedFile,
  expectedReportFile,
  findRunIdInFilename,
  focusFingerprint,
  normalizeFocus,
  reportRootFromPackage,
  validateCombinedReport,
  validateKanban,
  validateLaneEvidence,
  validateReviewerReport,
  validateRunManifest,
  validateTrelloBoard,
  validateTrelloCards,
  validateTrelloLists,
  workflowColumnsObject,
};
