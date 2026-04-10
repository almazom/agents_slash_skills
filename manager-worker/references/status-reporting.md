# Status Reporting Reference

Use this when the operator asks for the status of a concrete task, card, or
worker run.

## Evidence Order

Do not answer from one surface only. Use this order:

1. package or board SSOT
   - `kanban.json`, `state.json`, lane pointer, or canonical card
2. git movement for the task
   - recent commits, current diff, or task commit artifacts
3. task-local artifacts
   - review notes, verification logs, run metadata, or card-local files
4. live log freshness
   - terminal log timestamp, latest relevant lines, and process liveness
5. manager interpretation
   - what is done, what is active, what is blocked, and the next truthful step

If the live pane or log has moved beyond SSOT, say that explicitly.

## Reporting Shape

Prefer simplified Russian and this structure:

```text
Сейчас признаков тихой остановки нет/есть:
- текущее время проверки: ...
- последний апдейт worker log: ...
- последний апдейт verification/review log: ...
- живой ли процесс сейчас: ...

Коротко про задачу <card>:
- что это за карта простыми словами
- что уже было сделано
- какие review/findings уже были
- какие фиксы после них уже внесли
- что происходит прямо сейчас
- что осталось до честного закрытия карты

Итог по-человечески:
- что зелёное
- что ещё не зелёное
- есть ли реальный риск зависания
- какой следующий шаг
```

## Rules

- mention when SSOT is older than live truth
- anchor progress in commits, artifacts, timestamps, or log lines
- do not say only `worker alive`; say what it is doing
- do not say only `kanban shows X`; say whether live work has moved beyond it
- if review artifacts exist, summarize the findings/fix loop
- if no fresh log movement exists, say that plainly and name the last confirmed
  activity time

## Board-Aware Reporting

When the run belongs to a tracked project board, prefer:

```text
board -> card -> lane -> change
```

instead of generic prose alone.

## Minimum Sourcing Checklist

- git or commit artifacts for "what changed"
- task-local review and verification logs for "what was found and fixed"
- terminal log plus process check for "is it still moving now"
- package SSOT for "what the official state still says"
