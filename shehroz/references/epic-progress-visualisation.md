# Epic Progress Visualisation

Use this reference when the operator asks for:

- epic progress bar
- simplified epic visualisation
- quick `Done / In Progress / Remaining` report for an epic

## Intent

Give the operator a fast visual read of epic progress without a long status
paragraph.

## Live Count Rules

Verify live Trello state first.

Default counting rules:

- exclude the top emoji info card
- include the dedicated runner card
- count `Done`, `In Progress`, and still-in-epic execution cards
- if one card is currently active, name it under the bar

If you use a different count rule, say so explicitly.

## Preferred Output Shape

Use simplified Russian and keep it compact:

```text
EPIC <n> сейчас так:

[🟩🟩🟩🟨⬜⬜⬜]

- 🟩 Done: 3/7
- 🟨 In Progress: 1/7
- ⬜ Remaining: 3/7

Упрощённо:
- 43% сделано
- 14% в работе
- 43% осталось

Текущий активный шаг:
- card 0004 = <short title>

Примечание:
- 🧭 info-card не считаю
- runner card включён в общий execution count
```

## Template Reference

Operator ask:

```text
Show me epic 9 status progress bar. Simplified visualisation
```

Reference reply shape:

```text
EPIC 9 сейчас так:

[🟩🟩🟩🟩🟨⬜⬜⬜⬜⬜]

- 🟩 Done: 4/10
- 🟨 In Progress: 1/10
- ⬜ Remaining: 5/10

Упрощённо:
- 40% сделано
- 10% в работе
- 50% осталось

Текущий активный шаг:
- card 0004 = Rewrite the architecture doc

Примечание:
- 🧭 info-card не считаю
- runner card включён в общий execution count
```
