#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  appendJsonl,
  parseArgs,
  readJson,
  readJsonl,
  writeJson,
} = require("./cli_helpers");
const {
  STATUS_TO_COLUMN,
  TRELLO_LIST_TO_STATUS,
  VERDICTS,
  validateKanban,
  validateTrelloCards,
  validateTrelloLists,
} = require("./contracts");
const { addComment, listCards, moveCard } = require("./trello_remote");

const FINAL_MOVE_PHASES = new Set([
  "committed",
  "rolled_back",
  "reconciled_committed",
  "reconciled_abandoned",
  "remote_inconsistent",
]);

function removeCardFromColumns(columns, cardId) {
  Object.values(columns).forEach((column) => {
    column.cards = column.cards.filter((item) => item !== cardId);
  });
}

function pushCardToColumn(columns, status, cardId) {
  columns[status].cards.push(cardId);
}

function findCardArtifact(cardsArtifact, packageCardId) {
  return cardsArtifact.cards.find((item) => item.package_card_id === packageCardId) || null;
}

function updateCardArtifact(cardsArtifact, packageCardId, patch) {
  const index = cardsArtifact.cards.findIndex((item) => item.package_card_id === packageCardId);
  if (index === -1) {
    throw new Error(`Unknown package card in cards artifact: ${packageCardId}`);
  }
  cardsArtifact.cards[index] = { ...cardsArtifact.cards[index], ...patch };
}

function requireValue(value, flagName) {
  if (!value) {
    throw new Error(`Missing required flag: ${flagName}`);
  }
  return value;
}

function buildLaneComment(targetStatus, evidence) {
  if (targetStatus === "in_progress") {
    return "Взял в работу.";
  }
  if (targetStatus === "blocked") {
    return `Есть блокер: ${evidence.blocked.reason}`;
  }
  if (targetStatus === "review") {
    return `Ревью: ${evidence.review.verdict} - ${evidence.review.summary}`;
  }
  if (targetStatus === "simplification") {
    return `Упростил: ${evidence.simplification.summary}`;
  }
  if (targetStatus === "auto_commit") {
    if (evidence.auto_commit.blocked_reason) {
      return `Коммит блокирован: ${evidence.auto_commit.blocked_reason}`;
    }
    return `Коммит: ${evidence.auto_commit.commit_sha} ${evidence.auto_commit.commit_subject}`;
  }
  if (targetStatus === "done") {
    return `Готово: ${evidence.done.summary}`;
  }
  return "Обновил карточку.";
}

function buildEvidence(card, targetStatus, args, now) {
  const evidence = JSON.parse(JSON.stringify(card.lane_evidence));

  if (targetStatus === "blocked") {
    evidence.blocked.reason = requireValue(args["blocked-reason"], "--blocked-reason");
    evidence.blocked.recorded_at = now;
  }

  if (targetStatus === "review") {
    evidence.review.selector = requireValue(args["review-selector"], "--review-selector");
    evidence.review.verdict = requireValue(args["review-verdict"], "--review-verdict");
    if (!VERDICTS.has(evidence.review.verdict)) {
      throw new Error(`--review-verdict must be one of: ${Array.from(VERDICTS).join(", ")}`);
    }
    evidence.review.summary = requireValue(args["review-summary"], "--review-summary");
    evidence.review.report_ref = args["review-report-ref"] || null;
    evidence.review.completed_at = now;
  }

  if (targetStatus === "simplification") {
    evidence.simplification.outcome = requireValue(args["simplification-outcome"], "--simplification-outcome");
    evidence.simplification.summary = requireValue(args["simplification-summary"], "--simplification-summary");
    evidence.simplification.completed_at = now;
  }

  if (targetStatus === "auto_commit") {
    const blockedReason = args["commit-blocked-reason"] || null;
    if (!blockedReason) {
      evidence.auto_commit.commit_sha = requireValue(args["commit-sha"], "--commit-sha");
      evidence.auto_commit.commit_subject = requireValue(args["commit-subject"], "--commit-subject");
      evidence.auto_commit.blocked_reason = null;
    } else {
      evidence.auto_commit.commit_sha = null;
      evidence.auto_commit.commit_subject = null;
      evidence.auto_commit.blocked_reason = blockedReason;
    }
    evidence.auto_commit.completed_at = now;
  }

  if (targetStatus === "done") {
    if (!card.lane_evidence.review.completed_at) {
      throw new Error("Cannot move to Done before Review evidence exists");
    }
    if (!card.lane_evidence.simplification.completed_at) {
      throw new Error("Cannot move to Done before Simplification evidence exists");
    }
    if (!card.lane_evidence.auto_commit.completed_at) {
      throw new Error("Cannot move to Done before Auto-commit evidence exists");
    }
    evidence.done.summary = requireValue(args["done-summary"], "--done-summary");
    evidence.done.completed_at = now;
  }

  const comment = buildLaneComment(targetStatus, evidence);
  evidence.comments.push({
    at: now,
    status: targetStatus,
    text: comment,
  });

  return { evidence, comment };
}

function latestOpenMove(entries, packageCardId) {
  const byMove = new Map();
  entries
    .filter((entry) => entry.package_card_id === packageCardId)
    .forEach((entry) => {
      byMove.set(entry.move_id, entry);
    });
  const openMoves = Array.from(byMove.values()).filter((entry) => !FINAL_MOVE_PHASES.has(entry.phase));
  if (!openMoves.length) {
    return null;
  }
  return openMoves.sort((left, right) => String(left.at).localeCompare(String(right.at))).at(-1);
}

function locateCardInLists(host, lists, trelloCardId) {
  for (const [listName, listId] of Object.entries(lists.by_name)) {
    const cards = listCards(host, listId);
    const match = cards.find((item) => item.id === trelloCardId);
    if (match) {
      return {
        list_name: listName,
        list_id: listId,
        card: match,
      };
    }
  }
  return null;
}

function applyLocalState(packageDir, kanban, cardsArtifact, cardId, card, nextState) {
  removeCardFromColumns(kanban.columns, cardId);
  pushCardToColumn(kanban.columns, nextState.status, cardId);

  const sourceCardPath = path.join(packageDir, card.column, card.file);
  const targetCardPath = path.join(packageDir, STATUS_TO_COLUMN[nextState.status], card.file);
  if (fs.existsSync(sourceCardPath) && sourceCardPath !== targetCardPath) {
    fs.renameSync(sourceCardPath, targetCardPath);
  }

  card.status = nextState.status;
  card.column = STATUS_TO_COLUMN[nextState.status];
  card.trello_list_id = nextState.trello_list_id;
  card.trello_list_name = nextState.trello_list_name;
  card.lane_evidence = nextState.evidence;
  if (nextState.status === "in_progress" && !card.started_at) {
    card.started_at = nextState.at;
  }
  if (nextState.status === "done") {
    card.completed_at = nextState.at;
  }

  updateCardArtifact(cardsArtifact, cardId, {
    trello_list_id: nextState.trello_list_id,
    trello_list_name: nextState.trello_list_name,
  });
}

function reconcilePendingMove(host, packageDir, movesLogPath, lists, cardsArtifact, kanban, packageCardId, trelloCardId) {
  const pendingMove = latestOpenMove(readJsonl(movesLogPath), packageCardId);
  if (!pendingMove) {
    return;
  }

  const remoteLocation = locateCardInLists(host, lists, trelloCardId);
  if (!remoteLocation) {
    appendJsonl(movesLogPath, {
      move_id: pendingMove.move_id,
      phase: "reconciled_abandoned",
      at: new Date().toISOString(),
      package_card_id: packageCardId,
      reason: "Remote card was not found in any expected Trello list.",
    });
    return;
  }

  if (remoteLocation.list_name === pendingMove.to_list_name) {
    const card = kanban.cards[packageCardId];
    applyLocalState(packageDir, kanban, cardsArtifact, packageCardId, card, {
      status: pendingMove.to_status,
      trello_list_id: remoteLocation.list_id,
      trello_list_name: remoteLocation.list_name,
      evidence: pendingMove.evidence,
      at: new Date().toISOString(),
    });
    writeJson(path.join(packageDir, "trello", "cards.json"), cardsArtifact);
    writeJson(path.join(packageDir, "kanban.json"), kanban);
    appendJsonl(movesLogPath, {
      move_id: pendingMove.move_id,
      phase: "reconciled_committed",
      at: new Date().toISOString(),
      package_card_id: packageCardId,
      trello_card_id: trelloCardId,
      to: pendingMove.to_list_name,
      comment: pendingMove.comment,
    });
    return;
  }

  if (remoteLocation.list_name === pendingMove.from_list_name) {
    appendJsonl(movesLogPath, {
      move_id: pendingMove.move_id,
      phase: "reconciled_abandoned",
      at: new Date().toISOString(),
      package_card_id: packageCardId,
      trello_card_id: trelloCardId,
      reason: "Remote card is still at the previous list; local move was abandoned.",
    });
    return;
  }

  throw new Error(
    `Pending move for ${packageCardId} is inconsistent: remote card is in ${remoteLocation.list_name}, expected ${pendingMove.from_list_name} or ${pendingMove.to_list_name}`
  );
}

function main() {
  const args = parseArgs(process.argv, {
    valueFlags: [
      "package-dir",
      "package-card-id",
      "to-list",
      "host",
      "review-selector",
      "review-verdict",
      "review-summary",
      "review-report-ref",
      "blocked-reason",
      "simplification-outcome",
      "simplification-summary",
      "commit-sha",
      "commit-subject",
      "commit-blocked-reason",
      "done-summary",
    ],
    defaults: { host: "pets" },
  });

  const packageDir = args["package-dir"];
  const packageCardId = args["package-card-id"];
  const toList = args["to-list"];
  const host = args.host;

  if (!packageDir || !packageCardId || !toList) {
    throw new Error(
      "Usage: move_trello_card.js --package-dir /abs/package --package-card-id P0_001 --to-list \"Review\" [lane evidence flags]"
    );
  }

  const targetStatus = TRELLO_LIST_TO_STATUS[toList];
  if (!targetStatus) {
    throw new Error(`Unknown Trello list: ${toList}`);
  }

  const trelloDir = path.join(packageDir, "trello");
  const listsPath = path.join(trelloDir, "lists.json");
  const cardsPath = path.join(trelloDir, "cards.json");
  const kanbanPath = path.join(packageDir, "kanban.json");
  const movesLogPath = path.join(trelloDir, "moves.jsonl");

  const lists = validateTrelloLists(readJson(listsPath));
  const cardsArtifact = validateTrelloCards(readJson(cardsPath));
  const kanban = readJson(kanbanPath);
  validateKanban(kanban, { runId: kanban.meta.run_id });

  const trelloCard = findCardArtifact(cardsArtifact, packageCardId);
  const card = kanban.cards[packageCardId];
  if (!trelloCard || !card) {
    throw new Error(`Unknown package card: ${packageCardId}`);
  }

  reconcilePendingMove(host, packageDir, movesLogPath, lists, cardsArtifact, kanban, packageCardId, trelloCard.trello_card_id);
  if (card.status === targetStatus) {
    writeJson(cardsPath, cardsArtifact);
    writeJson(kanbanPath, kanban);
    console.log(
      JSON.stringify(
        {
          ok: true,
          package_card_id: packageCardId,
          trello_card_id: trelloCard.trello_card_id,
          moved_to: toList,
          reconciled_only: true,
        },
        null,
        2
      )
    );
    return;
  }

  const targetListId = lists.by_name[toList];
  if (!targetListId) {
    throw new Error(`List ID not found for ${toList}`);
  }

  const previous = {
    status: card.status,
    column: card.column,
    trello_list_id: trelloCard.trello_list_id,
    trello_list_name: trelloCard.trello_list_name,
  };
  const now = new Date().toISOString();
  const { evidence, comment } = buildEvidence(card, targetStatus, args, now);
  const moveId = `${packageCardId}:${now}`;

  appendJsonl(movesLogPath, {
    move_id: moveId,
    phase: "pending",
    at: now,
    package_card_id: packageCardId,
    trello_card_id: trelloCard.trello_card_id,
    from_status: previous.status,
    to_status: targetStatus,
    from_list_name: previous.trello_list_name,
    to_list_name: toList,
    evidence,
    comment,
  });

  const moved = moveCard(host, trelloCard.trello_card_id, targetListId);
  appendJsonl(movesLogPath, {
    move_id: moveId,
    phase: "remote_move",
    at: new Date().toISOString(),
    package_card_id: packageCardId,
    trello_card_id: trelloCard.trello_card_id,
    remote_result: moved,
  });

  try {
    const commentResult = addComment(host, trelloCard.trello_card_id, comment);
    appendJsonl(movesLogPath, {
      move_id: moveId,
      phase: "remote_comment",
      at: new Date().toISOString(),
      package_card_id: packageCardId,
      trello_card_id: trelloCard.trello_card_id,
      remote_result: commentResult,
      comment,
    });
  } catch (error) {
    try {
      if (previous.trello_list_id && previous.trello_list_id !== targetListId) {
        moveCard(host, trelloCard.trello_card_id, previous.trello_list_id);
      }
      appendJsonl(movesLogPath, {
        move_id: moveId,
        phase: "rolled_back",
        at: new Date().toISOString(),
        package_card_id: packageCardId,
        trello_card_id: trelloCard.trello_card_id,
        error: error.message,
      });
    } catch (rollbackError) {
      appendJsonl(movesLogPath, {
        move_id: moveId,
        phase: "remote_inconsistent",
        at: new Date().toISOString(),
        package_card_id: packageCardId,
        trello_card_id: trelloCard.trello_card_id,
        error: error.message,
        rollback_error: rollbackError.message,
      });
      throw rollbackError;
    }
    throw error;
  }

  applyLocalState(packageDir, kanban, cardsArtifact, packageCardId, card, {
    status: targetStatus,
    trello_list_id: targetListId,
    trello_list_name: toList,
    evidence,
    at: now,
  });

  writeJson(cardsPath, cardsArtifact);
  writeJson(kanbanPath, kanban);
  appendJsonl(movesLogPath, {
    move_id: moveId,
    phase: "committed",
    at: new Date().toISOString(),
    package_card_id: packageCardId,
    trello_card_id: trelloCard.trello_card_id,
    to: toList,
    comment,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        package_card_id: packageCardId,
        trello_card_id: trelloCard.trello_card_id,
        moved_to: toList,
        comment,
      },
      null,
      2
    )
  );
}

main();
