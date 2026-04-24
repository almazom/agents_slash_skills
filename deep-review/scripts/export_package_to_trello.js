#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  ensureRunManifest,
  parseArgs,
  readJson,
  writeJson,
} = require("./cli_helpers");
const {
  WORKFLOW_COLUMNS,
  STATUS_TO_TRELLO_LIST,
  validateKanban,
  validateTrelloBoard,
  validateTrelloLists,
} = require("./contracts");
const { addComment, createCard, listCards } = require("./trello_remote");

function orderedCardIds(kanban) {
  const ordered = [];
  WORKFLOW_COLUMNS.forEach((entry) => {
    const ids = kanban.columns[entry.status]?.cards || [];
    ids.forEach((cardId) => {
      if (!ordered.includes(cardId)) {
        ordered.push(cardId);
      }
    });
  });
  Object.keys(kanban.cards).forEach((cardId) => {
    if (!ordered.includes(cardId)) {
      ordered.push(cardId);
    }
  });
  return ordered;
}

function loadCardDescription(packageDir, card) {
  return fs.readFileSync(path.join(packageDir, card.column, card.file), "utf8").trim();
}

function upsertCardArtifact(cardsArtifact, entry) {
  const existingIndex = cardsArtifact.cards.findIndex((item) => item.package_card_id === entry.package_card_id);
  if (existingIndex === -1) {
    cardsArtifact.cards.push(entry);
  } else {
    cardsArtifact.cards[existingIndex] = { ...cardsArtifact.cards[existingIndex], ...entry };
  }
}

function findCardArtifact(cardsArtifact, packageCardId) {
  return cardsArtifact.cards.find((item) => item.package_card_id === packageCardId) || null;
}

function buildCardsArtifact(host, board) {
  return {
    host,
    board_id: board.board_id,
    board_url: board.board_url,
    cards: [],
  };
}

function listNameFromId(lists, listId) {
  const match = Object.entries(lists.by_name).find(([, value]) => value === listId);
  return match ? match[0] : null;
}

function listCardsCached(host, cache, listId) {
  if (!cache.has(listId)) {
    cache.set(listId, listCards(host, listId));
  }
  return cache.get(listId);
}

function reconcileCardArtifact(host, lists, cache, artifact) {
  if (!artifact?.trello_card_id) {
    return null;
  }

  const candidateListIds = [];
  if (artifact.trello_list_id) {
    candidateListIds.push(artifact.trello_list_id);
  }
  Object.values(lists.by_name).forEach((listId) => {
    if (!candidateListIds.includes(listId)) {
      candidateListIds.push(listId);
    }
  });

  for (const listId of candidateListIds) {
    const cards = listCardsCached(host, cache, listId);
    const match = cards.find((item) => item.id === artifact.trello_card_id);
    if (match) {
      return {
        ...artifact,
        trello_list_id: listId,
        trello_list_name: listNameFromId(lists, listId) || artifact.trello_list_name,
        name: match.name,
      };
    }
  }

  return null;
}

function main() {
  const args = parseArgs(process.argv, {
    valueFlags: ["package-dir", "host"],
    booleanFlags: ["reset-cards"],
    defaults: { host: "pets" },
  });

  const packageDir = args["package-dir"];
  const host = args.host;
  if (!packageDir) {
    throw new Error("Usage: export_package_to_trello.js --package-dir /abs/package [--host pets] [--reset-cards]");
  }

  const kanbanPath = path.join(packageDir, "kanban.json");
  const trelloDir = path.join(packageDir, "trello");
  const boardPath = path.join(trelloDir, "board.json");
  const listsPath = path.join(trelloDir, "lists.json");
  const cardsPath = path.join(trelloDir, "cards.json");

  const kanban = readJson(kanbanPath);
  validateKanban(kanban, { runId: kanban.meta.run_id });

  const board = validateTrelloBoard(readJson(boardPath));
  const lists = validateTrelloLists(readJson(listsPath));

  let cardsArtifact = fs.existsSync(cardsPath)
    ? readJson(cardsPath)
    : buildCardsArtifact(host, board);
  const resetCards = Boolean(args["reset-cards"]);
  const hasSavedCards = Array.isArray(cardsArtifact.cards) && cardsArtifact.cards.length > 0;
  if (hasSavedCards && cardsArtifact.board_id && cardsArtifact.board_id !== board.board_id && !resetCards) {
    throw new Error(
      `cards.json is mapped to board ${cardsArtifact.board_id}, but board.json points to ${board.board_id}. Re-run with --reset-cards to rebuild mappings intentionally.`
    );
  }

  if (!Array.isArray(cardsArtifact.cards) || resetCards || cardsArtifact.board_id !== board.board_id) {
    cardsArtifact = buildCardsArtifact(host, board);
  } else {
    cardsArtifact.host = host;
    cardsArtifact.board_id = board.board_id;
    cardsArtifact.board_url = board.board_url;
  }

  const ids = orderedCardIds(kanban);
  const listCache = new Map();
  let createdCount = 0;
  let reconciledCount = 0;

  ids.forEach((cardId) => {
    const kanbanCard = kanban.cards[cardId];
    if (!kanbanCard) {
      return;
    }

    const targetListName = STATUS_TO_TRELLO_LIST[kanbanCard.status] || "Backlog";
    const targetListId = lists.by_name[targetListName];
    if (!targetListId) {
      throw new Error(`Missing Trello list mapping for ${targetListName}`);
    }

    let artifact = findCardArtifact(cardsArtifact, cardId);
    if (artifact) {
      const reconciled = reconcileCardArtifact(host, lists, listCache, artifact);
      if (reconciled) {
        artifact = reconciled;
        upsertCardArtifact(cardsArtifact, artifact);
        reconciledCount += 1;
      } else {
        artifact = null;
      }
    }

    if (!artifact) {
      const description = loadCardDescription(packageDir, kanbanCard);
      const created = createCard(host, targetListId, kanbanCard.title, description);
      artifact = {
        package_card_id: cardId,
        trello_card_id: created.id,
        trello_list_id: targetListId,
        trello_list_name: targetListName,
        name: created.name,
        initial_comment_posted: false,
        description_source: `${kanbanCard.column}/${kanbanCard.file}`,
      };
      upsertCardArtifact(cardsArtifact, artifact);
      kanban.cards[cardId].trello_card_id = created.id;
      kanban.cards[cardId].trello_list_id = targetListId;
      kanban.cards[cardId].trello_list_name = targetListName;
      writeJson(cardsPath, cardsArtifact);
      writeJson(kanbanPath, kanban);
      createdCount += 1;
    }

    if (!artifact.initial_comment_posted) {
      const comment = `Карточка создана из deep-review: ${cardId}.`;
      addComment(host, artifact.trello_card_id, comment);
      artifact.initial_comment_posted = true;
      upsertCardArtifact(cardsArtifact, artifact);
      writeJson(cardsPath, cardsArtifact);
    }

    kanban.cards[cardId].trello_card_id = artifact.trello_card_id;
    kanban.cards[cardId].trello_list_id = artifact.trello_list_id;
    kanban.cards[cardId].trello_list_name = artifact.trello_list_name;
  });

  kanban.workflow_rules.trello_sync = {
    ...kanban.workflow_rules.trello_sync,
    enabled: true,
    host,
    board_id: board.board_id,
    board_name: board.board_name,
    board_url: board.board_url,
    exported_at: new Date().toISOString(),
  };

  writeJson(cardsPath, cardsArtifact);
  writeJson(kanbanPath, kanban);

  const runRoot = path.dirname(packageDir);
  ensureRunManifest(runRoot, {
    phases: {
      trello_exported: new Date().toISOString(),
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        board_url: board.board_url,
        cards_created: createdCount,
        cards_reconciled: reconciledCount,
        total_cards: cardsArtifact.cards.length,
        cards_json: cardsPath,
      },
      null,
      2
    )
  );
}

main();
