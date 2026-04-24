#!/usr/bin/env node

const path = require("path");
const {
  assert,
  ensureRunManifest,
  parseArgs,
  readJson,
  writeJson,
  writeText,
} = require("./cli_helpers");

function buildFocusMarkdown(payload) {
  const lines = [
    "# Review Focus",
    "",
    `- Type: ${payload.selected.type}`,
    `- Label: ${payload.selected.label}`,
    `- Reason: ${payload.selected.reason}`,
    `- Ambiguity: ${payload.ambiguity ? "true" : "false"}`,
  ];
  if (payload.ambiguity_reason) {
    lines.push(`- Ambiguity reason: ${payload.ambiguity_reason}`);
  }
  return `${lines.join("\n")}\n`;
}

function main() {
  const args = parseArgs(process.argv, {
    valueFlags: ["focus-json", "focus-md", "candidate-index", "reason"],
    booleanFlags: ["accept-recommended"],
  });

  const focusJsonPath = args["focus-json"];
  const focusMdPath = args["focus-md"];
  assert(focusJsonPath, "Missing --focus-json");
  assert(focusMdPath, "Missing --focus-md");

  const payload = readJson(focusJsonPath);
  assert(Array.isArray(payload.candidates) && payload.candidates.length > 0, "focus.json must contain candidates");

  const candidateIndex = Number(args["candidate-index"] || 0);
  const acceptRecommended = Boolean(args["accept-recommended"]);
  if (candidateIndex > 0 && acceptRecommended) {
    throw new Error("Use either --candidate-index or --accept-recommended, not both");
  }

  if (payload.ambiguity && candidateIndex === 0 && !acceptRecommended) {
    throw new Error("Ambiguous focus requires --candidate-index or --accept-recommended");
  }

  if (candidateIndex > 0) {
    assert(Number.isInteger(candidateIndex), "--candidate-index must be an integer");
    assert(candidateIndex >= 1 && candidateIndex <= payload.candidates.length, "--candidate-index is out of range");
    const candidate = payload.candidates[candidateIndex - 1];
    payload.selected = {
      ...candidate,
      reason: args.reason || `User selected candidate ${candidateIndex}.`,
      recommended_only: false,
    };
  } else if (acceptRecommended) {
    assert(payload.selected, "focus.json must contain selected focus");
    payload.selected = {
      ...payload.selected,
      recommended_only: false,
      reason: args.reason || payload.selected.reason || "Recommended focus accepted explicitly.",
    };
  } else {
    payload.selected = {
      ...payload.selected,
      recommended_only: false,
      reason: args.reason || payload.selected.reason || "Focus confirmed without ambiguity.",
    };
  }

  payload.ambiguity = false;
  payload.ambiguity_reason = null;

  writeJson(focusJsonPath, payload);
  writeText(focusMdPath, buildFocusMarkdown(payload));

  const runRoot = path.dirname(path.dirname(focusJsonPath));
  ensureRunManifest(runRoot, {
    focus: payload.selected,
    phases: {
      focus_resolved: new Date().toISOString(),
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        focus_json: focusJsonPath,
        focus_md: focusMdPath,
        selected: payload.selected,
      },
      null,
      2
    )
  );
}

main();
