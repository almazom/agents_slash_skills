# codex-orchestra bot testing playbook

Verified: 2026-03-29
Scope: iterate on `codex-orchestra` through a Telegram bot such as
`@miniapp_typescript_bot`, while capturing enough evidence to tighten the skill,
docs, examples, and failure playbooks after each run.

## Why this exists

- The skill is not proven by a clean `codex_wp exec` alone.
- Real operator usage happens through bot prompts, routing rules, service logs,
  and proxy state.
- The fastest way to improve the skill is a repeatable loop:
  trigger -> observe -> classify -> adjust docs/examples -> retest.

## Evidence set

Capture all of these on each serious run:

- Telegram evidence: `./TOOLS/telega fetch --profile default --json --wait ...`
- Bot service logs: `journalctl --user -u telegram-standalone.service -f`
- Local history: `tail -n 20 state/chats/<chat-id>.jsonl`
- Proxy health: `cdx status --json`, `cdx doctor --probe`, `cdx all`
- Proxy diagnostics when needed: `cdx trace --limit 20`, `cdx logs --lines 50`,
  `cdx limits --tail 10`
- Direct wrapper smoke when needed: `codex_wp exec --json "Reply with OK only."`

## 35-step loop

1. Validate the Telegram sender profile.
2. Confirm the target bot service is running.
3. Clear the bot chat before the scenario.
4. Write a run label for the scenario.
5. Snapshot the current `SKILL.md`.
6. Snapshot current prompt examples.
7. Snapshot current proxy health.
8. Run a direct local `codex_wp` smoke probe.
9. Pick a safe workspace for implementation tests.
10. Prefer a temp pilot project for destructive tests.
11. Test opinion mode with `ask Codex`.
12. Test explicit `$codex-orchestra` wording.
13. Test `Codex-only` wording.
14. Test Russian-only operator phrasing.
15. Test mixed Russian-English operator phrasing.
16. Test a second-opinion review request.
17. Test a plan-only request through the bot.
18. Test a small implementation request in temp workspace.
19. Test a file-scoped request with an explicit path.
20. Test a follow-up correction in the same chat.
21. Test a comparison request with two options.
22. Test a request that should mention `cdx health` first.
23. Test the `-p` pitfall as a negative case.
24. Verify the bot still routes to `exec`, not `-p`.
25. Test a long-running task and watch inactivity behavior.
26. Test hook-loop mode with `exec --json` when useful.
27. Inspect `cdx trace` after a suspicious run.
28. Inspect `cdx logs` after a suspicious run.
29. Inspect `cdx limits` when latency or refusal looks quota-related.
30. Run `cdx rotate --dry-run` before blaming a bad auth pool.
31. Classify the failure layer: prompt, wrapper, proxy, auth, or bot.
32. Tighten trigger phrases based on real prompts that worked.
33. Add or replace copy-paste examples using only proven prompts.
34. Record the stable rule in memory/docs immediately.
35. Retest the changed example before calling it canonical.

## Prompt pack for inside-bot testing

Use these as seed prompts to the operator bot.

### Opinion mode

```text
Спроси Codex мнение по этой реализации и перечисли 3 главных риска.
```

```text
$codex-orchestra ask Codex for a second opinion on this change and do not edit files.
```

### Plan mode

```text
Пусть Codex сначала предложит короткий план в 5 шагах без изменений файлов.
```

### Safe implementation mode

```text
Пусть Codex реализует это только в /home/pets/temp/pilot_project_ts и потом коротко перечислит изменения.
```

```text
Codex-only: проверь cdx health, потом реализуй правку в temp-проекте и сообщи точную команду, которой стартовал run.
```

### Negative and guardrail prompts

```text
Проверь, что для headless prompt не используется codex_wp -p, а только codex_wp exec.
```

```text
Если Codex недоступен, сначала покажи точную ошибку runtime, а не переходи молча на fallback.
```

## Suggested send/fetch rhythm

```bash
./TOOLS/telega send --profile default @miniapp_typescript_bot "/clear"
./TOOLS/telega fetch --profile default --json --wait 10 --limit 6 @miniapp_typescript_bot
./TOOLS/telega send --profile default @miniapp_typescript_bot "Спроси Codex мнение по этой реализации и перечисли 3 главных риска."
./TOOLS/telega fetch --profile default --json --wait 25 --limit 10 @miniapp_typescript_bot
```

Repeat the same pattern for each scenario. Do not stack multiple prompts before
capturing the previous result.

## What to improve after each cycle

- Trigger phrases that users actually type.
- Stable prompt templates that avoid ambiguity.
- Failure signatures such as `failed to parse session_id from codex JSON output`.
- Recovery order: `status -> doctor -> all -> trace/logs -> rotate`.
- When to disclose fallback instead of silently switching paths.

## Promotion rule

- Keep `SKILL.md` short.
- Move deep operational detail into references.
- Promote only examples that passed at least one direct `codex_wp` probe and one
  bot-mediated run.
