#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  ensureRunManifest,
  loadRunManifest,
  parseArgs,
  readJson,
  runRootFromReportsDir,
  writeJson,
  writeText,
} = require("./cli_helpers");
const {
  PRIORITIES,
  ROLE_SPECS,
  expectedCombinedFile,
  expectedReportFile,
  focusFingerprint,
  normalizeFocus,
  validateReviewerReport,
  validateCombinedReport,
} = require("./contracts");

const SEVERITY_ORDER = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

function renderTemplate(template, values) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : ""
  );
}

function escapePipes(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\n+/g, " ");
}

function loadReviewerReports(reportsDir, runId) {
  return ROLE_SPECS.map(([slug, display]) => {
    const jsonFile = expectedReportFile(slug, runId, "json");
    const mdFile = expectedReportFile(slug, runId, "md");
    const jsonPath = path.join(reportsDir, jsonFile);
    const mdPath = path.join(reportsDir, mdFile);
    if (!fs.existsSync(jsonPath) || !fs.existsSync(mdPath)) {
      throw new Error(`Missing reviewer pair for ${slug} and run ${runId}`);
    }
    const payload = readJson(jsonPath);
    validateReviewerReport(payload, { expectedSlug: slug, runId });
    return {
      ...payload,
      reviewer_role: payload.reviewer_role || display,
      report_file_json: jsonFile,
      report_file_md: mdFile,
    };
  });
}

function assertSingleFocus(reports) {
  const fingerprints = new Set(reports.map((report) => focusFingerprint(report.focus)));
  if (fingerprints.size !== 1) {
    throw new Error("Reviewer reports do not agree on one focus");
  }
  return normalizeFocus(reports[0].focus);
}

function dedupeStrings(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values) {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }
  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function fallbackClusterKey(finding) {
  const refs = dedupeStrings(finding.file_refs).sort().join("|") || "no_refs";
  return `${finding.title.toLowerCase()}|${refs}`;
}

function strongestSeverity(values) {
  return [...values].sort((left, right) => SEVERITY_ORDER[right] - SEVERITY_ORDER[left])[0];
}

function canonicalPriority(severity, mergeBlocker) {
  if (mergeBlocker || severity === "critical") {
    return "P0";
  }
  if (severity === "high") {
    return "P1";
  }
  return "P2";
}

function createCluster(finding, report) {
  return {
    titles: [],
    summaries: [],
    severities: [],
    priorities: [],
    story_points: [],
    experts: new Set(),
    source_report_files: new Set(),
    source_finding_ids: new Set(),
    file_refs: new Set(),
    dedupe_keys: new Set(),
    recommended_actions: [],
    merge_blocker: false,
    simplification_win: false,
    lines_saved_estimate: null,
    confidence_values: [],
    fallback_key: fallbackClusterKey(finding),
  };
}

function hydrateCluster(cluster, finding, report) {
  cluster.titles.push(finding.title);
  cluster.summaries.push(finding.summary);
  cluster.severities.push(finding.severity);
  cluster.priorities.push(finding.priority);
  cluster.story_points.push(finding.story_points);
  cluster.experts.add(report.reviewer_role);
  cluster.source_report_files.add(report.report_file_json);
  cluster.source_finding_ids.add(finding.id);
  cluster.merge_blocker = cluster.merge_blocker || finding.merge_blocker;
  cluster.simplification_win = cluster.simplification_win || Boolean(finding.simplification_win);
  cluster.lines_saved_estimate = Math.max(
    cluster.lines_saved_estimate || 0,
    finding.lines_saved_estimate || 0
  );
  cluster.confidence_values.push(finding.confidence);
  finding.file_refs.forEach((ref) => cluster.file_refs.add(ref));
  finding.dedupe_keys.forEach((keyPart) => cluster.dedupe_keys.add(keyPart));
  cluster.recommended_actions.push(finding.recommended_action);
}

function mergeClusters(target, source) {
  source.titles.forEach((value) => target.titles.push(value));
  source.summaries.forEach((value) => target.summaries.push(value));
  source.severities.forEach((value) => target.severities.push(value));
  source.priorities.forEach((value) => target.priorities.push(value));
  source.story_points.forEach((value) => target.story_points.push(value));
  source.experts.forEach((value) => target.experts.add(value));
  source.source_report_files.forEach((value) => target.source_report_files.add(value));
  source.source_finding_ids.forEach((value) => target.source_finding_ids.add(value));
  source.file_refs.forEach((value) => target.file_refs.add(value));
  source.dedupe_keys.forEach((value) => target.dedupe_keys.add(value));
  source.recommended_actions.forEach((value) => target.recommended_actions.push(value));
  target.merge_blocker = target.merge_blocker || source.merge_blocker;
  target.simplification_win = target.simplification_win || source.simplification_win;
  target.lines_saved_estimate = Math.max(target.lines_saved_estimate || 0, source.lines_saved_estimate || 0);
  source.confidence_values.forEach((value) => target.confidence_values.push(value));
}

function findMatchingClusterIndexes(clusters, finding) {
  const findingKeys = new Set(dedupeStrings(finding.dedupe_keys));
  if (findingKeys.size > 0) {
    return clusters
      .map((cluster, index) => ({ cluster, index }))
      .filter(({ cluster }) => Array.from(cluster.dedupe_keys).some((key) => findingKeys.has(key)))
      .map(({ index }) => index);
  }

  const fallbackKey = fallbackClusterKey(finding);
  return clusters
    .map((cluster, index) => ({ cluster, index }))
    .filter(({ cluster }) => cluster.dedupe_keys.size === 0 && cluster.fallback_key === fallbackKey)
    .map(({ index }) => index);
}

function dedupeFindings(reports) {
  const clusters = [];

  for (const report of reports) {
    for (const finding of report.findings) {
      const matches = findMatchingClusterIndexes(clusters, finding);
      if (matches.length === 0) {
        const cluster = createCluster(finding, report);
        hydrateCluster(cluster, finding, report);
        clusters.push(cluster);
        continue;
      }

      const primary = clusters[matches[0]];
      hydrateCluster(primary, finding, report);
      matches
        .slice(1)
        .sort((left, right) => right - left)
        .forEach((clusterIndex) => {
          mergeClusters(primary, clusters[clusterIndex]);
          clusters.splice(clusterIndex, 1);
        });
    }
  }

  const findings = Array.from(clusters.values()).map((cluster) => {
    const severity = strongestSeverity(cluster.severities);
    const storyPoints = median(cluster.story_points);
    return {
      title: dedupeStrings(cluster.titles).sort((a, b) => b.length - a.length)[0],
      summary: dedupeStrings(cluster.summaries).sort((a, b) => b.length - a.length)[0],
      severity,
      priority: canonicalPriority(severity, cluster.merge_blocker),
      story_points: storyPoints,
      estimate_spread: {
        consensus_method: "median",
        min: Math.min(...cluster.story_points),
        max: Math.max(...cluster.story_points),
        values: [...cluster.story_points].sort((left, right) => left - right),
      },
      experts: Array.from(cluster.experts).sort(),
      source_report_files: Array.from(cluster.source_report_files).sort(),
      source_finding_ids: Array.from(cluster.source_finding_ids).sort(),
      file_refs: Array.from(cluster.file_refs).sort(),
      dedupe_keys: Array.from(cluster.dedupe_keys).sort(),
      recommended_action: dedupeStrings(cluster.recommended_actions).join(" / "),
      merge_blocker: cluster.merge_blocker,
      simplification_win: cluster.simplification_win,
      lines_saved_estimate: cluster.lines_saved_estimate || null,
      confidence: Math.round(average(cluster.confidence_values)),
    };
  });

  findings.sort((left, right) => {
    const priorityDelta =
      (left.priority === "P0" ? 0 : left.priority === "P1" ? 1 : 2) -
      (right.priority === "P0" ? 0 : right.priority === "P1" ? 1 : 2);
    if (priorityDelta !== 0) {
      return priorityDelta;
    }
    const severityDelta = SEVERITY_ORDER[right.severity] - SEVERITY_ORDER[left.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }
    return left.title.localeCompare(right.title);
  });

  const counters = { P0: 0, P1: 0, P2: 0 };
  findings.forEach((finding) => {
    counters[finding.priority] += 1;
    finding.id = `${finding.priority}_${String(counters[finding.priority]).padStart(3, "0")}`;
  });

  return findings;
}

function computeTotals(findings) {
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

function overallVerdict(reports, findings) {
  if (findings.some((finding) => finding.priority === "P0")) {
    return "BLOCKED";
  }
  if (reports.some((report) => report.verdict === "BLOCKED")) {
    return "BLOCKED";
  }
  return findings.length > 0 ? "APPROVED_WITH_NOTES" : "LGTM";
}

function toMarkdownTable(headers, rows) {
  const headerLine = `| ${headers.join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  if (!rows.length) {
    return `${headerLine}\n${separator}\n| ${headers.map(() => "-").join(" | ")} |`;
  }
  return `${headerLine}\n${separator}\n${rows
    .map((row) => `| ${row.map(escapePipes).join(" | ")} |`)
    .join("\n")}`;
}

function toBulletList(values, fallback = "- none") {
  if (!values.length) {
    return fallback;
  }
  return values.map((value) => `- ${value}`).join("\n");
}

function buildCombinedJson(runId, reports, findings) {
  const totals = computeTotals(findings);
  const focus = assertSingleFocus(reports);
  return {
    meta: {
      schema_version: "deep-review-combined/v1",
      run_id: runId,
      timestamp: runId,
      created_at: new Date().toISOString(),
      report_count: reports.length,
    },
    source: {
      focus,
      reports: reports.map((report) => report.report_file_json),
    },
    overall_verdict: overallVerdict(reports, findings),
    totals,
    reviewer_summaries: reports.map((report) => ({
      reviewer_role: report.reviewer_role,
      reviewer_slug: report.reviewer_slug,
      verdict: report.verdict,
      confidence: report.confidence,
      key_finding:
        report.findings[0]?.title || (report.verdict === "LGTM" ? "LGTM" : report.recommended_action),
      story_points_total: report.findings.reduce((sum, finding) => sum + finding.story_points, 0),
      report_file_json: report.report_file_json,
      report_file_md: report.report_file_md,
    })),
    findings,
    simplification_wins: findings
      .filter((finding) => finding.simplification_win)
      .map((finding) => ({
        id: finding.id,
        title: finding.title,
        lines_saved_estimate: finding.lines_saved_estimate,
        story_points: finding.story_points,
      })),
  };
}

function buildMarkdown(combinedJson, templatePath) {
  const template = fs.readFileSync(templatePath, "utf8");
  const totals = combinedJson.totals;
  const findings = combinedJson.findings;

  const renderPriorityTable = (priority) =>
    toMarkdownTable(
      ["Issue", "Severity", "Experts", "Story Points", "Source Reports"],
      findings
        .filter((finding) => finding.priority === priority)
        .map((finding) => [
          finding.title,
          finding.severity,
          finding.experts.join(", "),
          String(finding.story_points),
          finding.source_report_files.join(", "),
        ])
    );

  return renderTemplate(template, {
    timestamp: combinedJson.meta.timestamp,
    source_focus: combinedJson.source.focus.label || combinedJson.source.focus.type,
    overall_verdict: combinedJson.overall_verdict,
    sprint_planning_summary: toMarkdownTable(
      ["Priority", "Total Story Points", "Items"],
      Array.from(PRIORITIES).map((priority) => [
        priority,
        String(totals[priority].story_points),
        String(totals[priority].count),
      ])
    ),
    p0_table: renderPriorityTable("P0"),
    p1_table: renderPriorityTable("P1"),
    p2_table: renderPriorityTable("P2"),
    simplification_wins: toBulletList(
      combinedJson.simplification_wins.map((item) => {
        const estimate = item.lines_saved_estimate ? `${item.lines_saved_estimate} lines` : "unknown lines";
        return `${item.title} - ${estimate} - ${item.story_points} pts`;
      })
    ),
    expert_summary_table: toMarkdownTable(
      ["Expert", "Verdict", "Key Finding", "Points"],
      combinedJson.reviewer_summaries.map((summary) => [
        summary.reviewer_role,
        summary.verdict,
        summary.key_finding,
        String(summary.story_points_total),
      ])
    ),
    source_reports_list: toBulletList(combinedJson.source.reports),
  });
}

function main() {
  const args = parseArgs(process.argv, {
    valueFlags: ["reports-dir", "templates-dir", "run-id", "out-json", "out-md"],
  });

  const reportsDir = args["reports-dir"];
  const templatesDir = args["templates-dir"];
  if (!reportsDir || !templatesDir) {
    throw new Error("Usage: build_combined_report.js --reports-dir /abs/reports --templates-dir /abs/templates [--run-id ID] [--out-json FILE] [--out-md FILE]");
  }

  const runRoot = runRootFromReportsDir(reportsDir);
  const runManifest = loadRunManifest(runRoot);
  const runId = args["run-id"] || runManifest.run_id;
  const reports = loadReviewerReports(reportsDir, runId);
  const findings = dedupeFindings(reports);
  const expectedSourceReports = ROLE_SPECS.map(([slug]) => expectedReportFile(slug, runId, "json"));
  const expectedFocusFingerprint = focusFingerprint(runManifest.focus);
  const combinedJson = buildCombinedJson(runId, reports, findings);
  validateCombinedReport(combinedJson, {
    runId,
    expectedSourceReports,
    expectedFocusFingerprint,
  });
  const outJson = args["out-json"] || path.join(reportsDir, expectedCombinedFile(runId, "json"));
  const outMd = args["out-md"] || path.join(reportsDir, expectedCombinedFile(runId, "md"));

  writeJson(outJson, combinedJson);
  writeText(outMd, buildMarkdown(combinedJson, path.join(templatesDir, "combined_report.md.tmpl")));

  ensureRunManifest(runRoot, {
    phases: {
      reports_validated: new Date().toISOString(),
      combined_report_built: new Date().toISOString(),
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        run_id: runId,
        combined_json: outJson,
        combined_md: outMd,
        findings: findings.length,
        overall_verdict: combinedJson.overall_verdict,
      },
      null,
      2
    )
  );
}

main();
