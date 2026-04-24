#!/usr/bin/env node

const { spawnSync } = require("child_process");

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function buildRemoteCommand(argv) {
  return argv.map(shellQuote).join(" ");
}

function runRemote(host, argv, options = {}) {
  const sshArgs = [
    "-o",
    "BatchMode=yes",
    "-o",
    "ConnectTimeout=10",
    host,
    buildRemoteCommand(argv),
  ];
  const result = spawnSync("ssh", sshArgs, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });

  return {
    ok: result.status === 0 && !result.error,
    exitCode: result.status ?? 1,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
    error: result.error || null,
    host,
    argv,
    remoteCommand: buildRemoteCommand(argv),
  };
}

function combinedOutput(result) {
  return [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
}

function parseMaybeJson(text) {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
}

function looksLikeErrorText(text) {
  const normalized = String(text || "").trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return (
    normalized.startsWith("error:") ||
    normalized.startsWith("invalid ") ||
      normalized.startsWith("unknown ") ||
      normalized.startsWith("usage:") ||
      normalized.includes("bad_request_error") ||
      normalized.includes("not found") ||
      normalized.includes("invalid id") ||
      normalized.includes("requires at least one")
  );
}

function classifyFailure(result, output) {
  const normalized = String(output || "").trim().toLowerCase();
  if (
    result.error ||
    result.exitCode === 255 ||
    normalized.includes("could not resolve hostname") ||
    normalized.includes("connection timed out") ||
    normalized.includes("connection refused") ||
    normalized.includes("permission denied") ||
    normalized.includes("network is unreachable")
  ) {
    return "transport";
  }
  if (normalized.includes("not found") || normalized.includes("invalid id")) {
    return "not_found";
  }
  return "command";
}

function commandError(label, result, output, kind = classifyFailure(result, output)) {
  const parts = [
    `${label} failed on ${result.host}`,
    `argv: ${result.argv.join(" ")}`,
    `exit: ${result.exitCode}`,
  ];
  if (output) {
    parts.push(`output: ${output}`);
  }
  const error = new Error(parts.join("\n"));
  error.kind = kind;
  error.host = result.host;
  error.argv = result.argv;
  error.exitCode = result.exitCode;
  error.stdout = result.stdout;
  error.stderr = result.stderr;
  return error;
}

function assertJsonSuccess(label, result, validator) {
  const output = combinedOutput(result);
  if (!result.ok) {
    throw commandError(label, result, output);
  }

  const payload = parseMaybeJson(result.stdout);
  if (!payload) {
    if (looksLikeErrorText(output)) {
      throw commandError(label, result, output);
    }
    throw commandError(label, result, `Expected JSON on stdout but got: ${output || "<empty>"}`);
  }

  if (
    (typeof payload === "object" && payload !== null && ("error" in payload || "message" in payload)) &&
    !validator(payload)
  ) {
    throw commandError(label, result, JSON.stringify(payload));
  }

  if (!validator(payload)) {
    throw commandError(label, result, `Unexpected payload: ${JSON.stringify(payload)}`);
  }

  return payload;
}

function runTrelloJson(host, args, label, validator) {
  let lastResult = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    lastResult = runRemote(host, ["trello", ...args, "--format", "json"]);
    const output = combinedOutput(lastResult);
    if (classifyFailure(lastResult, output) !== "transport") {
      break;
    }
  }
  return assertJsonSuccess(label, lastResult, validator);
}

function runTrelloRaw(host, args, label, validator) {
  let lastResult = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    lastResult = runRemote(host, ["trello", ...args]);
    const output = combinedOutput(lastResult);
    if (classifyFailure(lastResult, output) !== "transport") {
      break;
    }
  }
  return assertJsonSuccess(label, lastResult, validator);
}

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function hasKeys(payload, keys) {
  return isObject(payload) && keys.every((key) => payload[key] !== undefined && payload[key] !== null);
}

function createBoard(host, name, desc = "") {
  return runTrelloJson(host, ["create-board", name, desc], "create-board", (payload) =>
    hasKeys(payload, ["id", "name", "url"])
  );
}

function boardInfo(host, boardId) {
  return runTrelloJson(host, ["board-info", boardId], "board-info", (payload) =>
    hasKeys(payload, ["id", "name", "url"])
  );
}

function listLists(host, boardId) {
  return runTrelloJson(host, ["list-lists", boardId], "list-lists", (payload) =>
    Array.isArray(payload) && payload.every((item) => hasKeys(item, ["id", "name", "pos"]))
  );
}

function createList(host, name, boardId, pos) {
  const args = ["create-list", name];
  if (boardId) {
    args.push(boardId);
  }
  if (pos) {
    args.push(pos);
  }
  return runTrelloJson(host, args, "create-list", (payload) => hasKeys(payload, ["id", "name"]));
}

function archiveList(host, listId) {
  return runTrelloJson(host, ["archive-list", listId], "archive-list", (payload) =>
    hasKeys(payload, ["id", "name"])
  );
}

function listCards(host, listId) {
  return runTrelloJson(host, ["list-cards", listId], "list-cards", (payload) =>
    Array.isArray(payload) && payload.every((item) => hasKeys(item, ["id", "name"]))
  );
}

function createCard(host, listId, name, description = "") {
  return runTrelloJson(host, ["create-card", listId, name, description], "create-card", (payload) =>
    hasKeys(payload, ["id", "name"])
  );
}

function moveCard(host, cardId, listId) {
  return runTrelloJson(host, ["move-card", cardId, listId], "move-card", (payload) =>
    hasKeys(payload, ["id", "idList"])
  );
}

function updateCard(host, cardId, options = {}) {
  const args = ["update-card", cardId];
  if (options.name) {
    args.push("--name", options.name);
  }
  if (options.desc) {
    args.push("--desc", options.desc);
  }
  return runTrelloRaw(host, args, "update-card", (payload) => hasKeys(payload, ["id"]));
}

function addComment(host, cardId, text) {
  return runTrelloRaw(host, ["add-comment", cardId, text], "add-comment", (payload) => isObject(payload) && payload.id);
}

module.exports = {
  addComment,
  archiveList,
  boardInfo,
  buildRemoteCommand,
  combinedOutput,
  createBoard,
  createCard,
  createList,
  listCards,
  listLists,
  moveCard,
  runRemote,
  shellQuote,
  updateCard,
};
