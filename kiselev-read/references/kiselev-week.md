# Kiselev Week

Use this reference when the user says `kiselev-week`.

`kiselev-week` is a shortcut for:

- weekly DEKSDEN report
- channel + chat together
- read-only mode
- the saved output format below

## Scope

- Default window: last 7 days unless the user sets dates
- Default sources:
  `@deksden_notes` + `DEKSDEN (chat)`
- Always dedupe mirrored channel posts inside the chat

## Required Output Shape

Use this exact organization and keep the tone close to the saved good example.

1. `Готово. Вот отчет по DEKSDEN (канал + чат) за неделю <даты>:`
2. separator line `---`
3. `DEKSDEN: неделя <даты>`
4. `Кратко`
5. short 1-paragraph executive summary
6. `Что публиковали в канале`
7. daily bullets grouped by date
8. `Обсуждения в чате`
9. grouped chat themes with short bullets
10. `Цитаты недели`
11. 1-3 quoted lines
12. separator line `---`
13. closing line with saved report path when a report file exists

## Formatting Rules

- Write in simplified Russian.
- No tables.
- Prefer short bullets.
- Keep channel and chat clearly separated.
- Channel section:
  show publication flow by day.
- Chat section:
  group by themes such as тарифы, инструменты, оркестрация, споры, use cases.
- Quotes:
  keep only the strongest memorable lines.

## Template

```text
Готово. Вот отчет по DEKSDEN (канал + чат) за неделю <DD-DD month YYYY>:

---

DEKSDEN: неделя <DD-DD month YYYY>

Кратко

<1 короткий абзац о главной линии недели>

Что публиковали в канале

<дата>:
- <пункт>
- <пункт>

<дата>:
- <пункт>

Обсуждения в чате

<тема>:
- <пункт>
- <пункт>

<тема>:
- <пункт>

Цитаты недели

"<цитата>"

"<цитата>"

---

Полный отчет сохранен в docs/reports/<file>.md
```

## Trigger Examples

```text
kiselev-week: сделай недельный отчёт
kiselev-week: сначала забери неделю и собери отчёт
kiselev-week: отчёт за последние 7 дней
kiselev-week: сделай weekly report по DEKSDEN
```
