# Notifications

`deep-review` may send major-step notifications when the operator explicitly
asked for them.

Use `$notify-me` and follow its contract.
Default transport is Mattermost only.

## When To Notify

Send at most one message for each major phase:

1. focus selected
2. reviewer batch launched
3. all 6 individual reports saved
4. combined report ready
5. SDD package ready
6. Trello board exported
7. blocked state
8. done state

Do not send low-signal progress spam.

## Message Style

- short
- Russian-first by default
- include repo or focus reference when useful
- include the main artifact path only for end states

## Canonical Message Catalog

Use these as the default Russian-first message shapes.

Major phases:

- focus selected:
  `deep-review: focus выбран - <focus>`
- reviewer batch launched:
  `deep-review: 6 reviewers запущены`
- all 6 reports saved:
  `deep-review: все 6 отчётов сохранены`
- combined report ready:
  `deep-review: combined report готов - <path>`
- SDD package ready:
  `deep-review: SDD package готов - <path>`
- Trello board exported:
  `deep-review: Trello board готов - <url>`
- blocked state:
  `deep-review: блокер - <short reason>`
- done state:
  `deep-review: готово - <short result>`

Lane comments in Trello:

- `In progress`: `Взял в работу.`
- `Blocked`: `Есть блокер: ...`
- `Review`: `Ревью: LGTM - ...` or `Ревью: BLOCKED - ...`
- `Simplification`: `Упростил: ...`
- `Auto-commit`: `Коммит: abc123 ...` or `Коммит блокирован: ...`
- `Done`: `Готово: ...`

## Command Shape

```bash
/Users/al/TOOLS/mattermost_to_me_cli/mattermost_to_me --only mattermost "deep-review: combined report ready"
```

## Good Examples

- `deep-review: focus выбран - PR #42`
- `deep-review: 6 reviewers запущены`
- `deep-review: все 6 отчётов сохранены`
- `deep-review: combined report готов - /abs/path/to/combined_report_....md`
- `deep-review: SDD package готов - /abs/path/to/sdd_package_...`
- `deep-review: Trello board готов - https://trello.com/b/...`
- `deep-review: блокер - не удалось собрать 6 обязательных отчётов`
- `deep-review: карточка готова - P0_001`

## Safety

- If the operator did not ask for notifications, do not send them implicitly.
- If Mattermost delivery fails, surface the failure explicitly.
