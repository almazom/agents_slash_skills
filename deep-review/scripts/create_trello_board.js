#!/usr/bin/env node

const path = require("path");
const {
  ensureDir,
  ensureRunManifest,
  parseArgs,
  readJson,
  writeJson,
} = require("./cli_helpers");
const {
  WORKFLOW_COLUMNS,
  validateKanban,
  validateTrelloBoard,
  validateTrelloLists,
} = require("./contracts");
const { archiveList, boardInfo, createBoard, createList, listLists } = require("./trello_remote");

function defaultBoardName(packageDir, kanban) {
  const repoName = path.basename(path.dirname(path.dirname(packageDir)));
  const focus = kanban.meta?.source_focus || "review";
  return `deep-review ${repoName} ${focus}`.slice(0, 160);
}

function listArtifact(boardId, host, remoteLists) {
  return {
    host,
    board_id: boardId,
    lists: remoteLists,
    by_name: Object.fromEntries(
      WORKFLOW_COLUMNS.map((entry) => {
        const match = remoteLists.find((item) => item.name === entry.trello_list);
        return [entry.trello_list, match ? match.id : null];
      })
    ),
  };
}

function ensureRequiredLists(host, boardId, existingLists, listsPath) {
  let currentLists = [...existingLists];

  WORKFLOW_COLUMNS.forEach((entry) => {
    const alreadyExists = currentLists.find((item) => item.name === entry.trello_list);
    if (!alreadyExists) {
      const created = createList(host, entry.trello_list, boardId, String(entry.order + 1));
      currentLists = [...currentLists, created];
      writeJson(listsPath, listArtifact(boardId, host, currentLists));
    }
  });

  currentLists = listLists(host, boardId);
  writeJson(listsPath, listArtifact(boardId, host, currentLists));
  return currentLists;
}

function archiveUnexpectedLists(host, remoteLists) {
  const required = new Set(WORKFLOW_COLUMNS.map((entry) => entry.trello_list));
  remoteLists
    .filter((item) => !required.has(item.name))
    .forEach((item) => {
      archiveList(host, item.id);
    });
}

function main() {
  const args = parseArgs(process.argv, {
    valueFlags: ["package-dir", "board-name", "host"],
    booleanFlags: ["force-new"],
    defaults: { host: "pets" },
  });

  const packageDir = args["package-dir"];
  const host = args.host;
  if (!packageDir) {
    throw new Error("Usage: create_trello_board.js --package-dir /abs/package [--host pets] [--board-name NAME] [--force-new]");
  }

  const kanbanPath = path.join(packageDir, "kanban.json");
  const trelloDir = path.join(packageDir, "trello");
  const boardPath = path.join(trelloDir, "board.json");
  const listsPath = path.join(trelloDir, "lists.json");

  ensureDir(trelloDir);

  const kanban = readJson(kanbanPath);
  validateKanban(kanban, { runId: kanban.meta.run_id });

  let boardArtifact = null;
  let existingLists = [];
  if (!args["force-new"]) {
    try {
      boardArtifact = validateTrelloBoard(readJson(boardPath));
      const remoteBoard = boardInfo(host, boardArtifact.board_id);
      boardArtifact = {
        host,
        board_id: remoteBoard.id,
        board_name: remoteBoard.name,
        board_url: remoteBoard.url,
        source_package: path.basename(packageDir),
      };
      writeJson(boardPath, boardArtifact);
    } catch (error) {
      if (error?.kind === "not_found") {
        boardArtifact = null;
      } else if (error?.code === "ENOENT" || /Missing|Unexpected token|must be/.test(error?.message || "")) {
        boardArtifact = null;
      } else {
        throw error;
      }
    }
  }

  if (!boardArtifact) {
    const created = createBoard(
      host,
      args["board-name"] || defaultBoardName(packageDir, kanban),
      `Generated from deep-review package ${kanban.meta.package_id}`
    );
    boardArtifact = {
      host,
      board_id: created.id,
      board_name: created.name,
      board_url: created.url,
      source_package: path.basename(packageDir),
    };
    writeJson(boardPath, boardArtifact);
    existingLists = listLists(host, boardArtifact.board_id);
    archiveUnexpectedLists(host, existingLists);
    existingLists = listLists(host, boardArtifact.board_id);
  }

  if (!args["force-new"] && existingLists.length === 0) {
    try {
      const savedLists = validateTrelloLists(readJson(listsPath));
      if (savedLists.board_id === boardArtifact.board_id) {
        existingLists = listLists(host, boardArtifact.board_id);
      }
    } catch (_error) {
      existingLists = [];
    }
  }

  const finalLists = ensureRequiredLists(host, boardArtifact.board_id, existingLists, listsPath);

  kanban.workflow_rules.trello_sync = {
    ...kanban.workflow_rules.trello_sync,
    enabled: true,
    host,
    board_id: boardArtifact.board_id,
    board_name: boardArtifact.board_name,
    board_url: boardArtifact.board_url,
  };
  writeJson(kanbanPath, kanban);

  const runRoot = path.dirname(packageDir);
  ensureRunManifest(runRoot, {
    phases: {
      trello_board_created: new Date().toISOString(),
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        board: boardArtifact,
        lists_created_or_found: finalLists.length,
        board_json: boardPath,
        lists_json: listsPath,
      },
      null,
      2
    )
  );
}

main();
