#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseArgs(argv, spec = {}) {
  const valueFlags = new Set(spec.valueFlags || []);
  const booleanFlags = new Set(spec.booleanFlags || []);
  const defaults = { ...(spec.defaults || {}) };
  const args = { ...defaults };

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${token}`);
    }

    const equalsIndex = token.indexOf("=");
    const hasInlineValue = equalsIndex !== -1;
    const key = hasInlineValue ? token.slice(2, equalsIndex) : token.slice(2);
    const inlineValue = hasInlineValue ? token.slice(equalsIndex + 1) : undefined;
    if (valueFlags.has(key)) {
      if (hasInlineValue) {
        if (inlineValue.length === 0) {
          throw new Error(`Flag requires a value: --${key}`);
        }
        args[key] = inlineValue;
        continue;
      }
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
        throw new Error(`Flag requires a value: --${key}`);
      }
      args[key] = next;
      index += 1;
      continue;
    }

    if (booleanFlags.has(key)) {
      if (hasInlineValue) {
        throw new Error(`Boolean flag does not take a value: --${key}`);
      }
      args[key] = true;
      continue;
    }

    throw new Error(`Unknown flag: --${key}`);
  }

  return args;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonl(filePath) {
  if (!isFile(filePath)) {
    return [];
  }
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSONL at ${filePath}:${index + 1}: ${error.message}`);
      }
    });
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.writeFileSync(filePath, value.endsWith("\n") ? value : `${value}\n`);
}

function listFiles(dirPath) {
  return fs.readdirSync(dirPath).sort();
}

function isFile(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function isDirectory(dirPath) {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
}

function utcTimestamp() {
  const iso = new Date().toISOString();
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function slugify(value, separator = "-") {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`^${separator}+|${separator}+$`, "g"), "")
    .replace(new RegExp(`${separator}+`, "g"), separator);
  return normalized;
}

function runRootFromReportsDir(reportsDir) {
  return path.dirname(reportsDir);
}

function runIdFromRunRoot(runRoot) {
  return path.basename(runRoot);
}

function runManifestPath(runRoot) {
  return path.join(runRoot, "run.json");
}

function ensureRunManifest(runRoot, patch = {}) {
  ensureDir(runRoot);
  const filePath = runManifestPath(runRoot);
  const existing = isFile(filePath) ? readJson(filePath) : {};
  const runId = existing.run_id || patch.run_id || runIdFromRunRoot(runRoot);
  const payload = {
    schema_version: "deep-review-run/v1",
    run_id: runId,
    created_at: existing.created_at || new Date().toISOString(),
    run_root: runRoot,
    repo_root: patch.repo_root || existing.repo_root || null,
    phases: {
      focus_detected: existing.phases?.focus_detected || null,
      focus_resolved: existing.phases?.focus_resolved || null,
      context_collected: existing.phases?.context_collected || null,
      reports_validated: existing.phases?.reports_validated || null,
      combined_report_built: existing.phases?.combined_report_built || null,
      package_built: existing.phases?.package_built || null,
      trello_board_created: existing.phases?.trello_board_created || null,
      trello_exported: existing.phases?.trello_exported || null,
      ...existing.phases,
      ...(patch.phases || {}),
    },
    focus: patch.focus || existing.focus || null,
    notes: patch.notes || existing.notes || [],
  };
  writeJson(filePath, payload);
  return payload;
}

function loadRunManifest(runRoot) {
  const filePath = runManifestPath(runRoot);
  assert(isFile(filePath), `Missing run manifest: ${filePath}`);
  return readJson(filePath);
}

function appendJsonl(filePath, payload) {
  fs.appendFileSync(filePath, `${JSON.stringify(payload)}\n`);
}

module.exports = {
  appendJsonl,
  assert,
  ensureDir,
  ensureRunManifest,
  isDirectory,
  isFile,
  listFiles,
  loadRunManifest,
  parseArgs,
  readJson,
  readJsonl,
  runIdFromRunRoot,
  runManifestPath,
  runRootFromReportsDir,
  slugify,
  utcTimestamp,
  writeJson,
  writeText,
};
