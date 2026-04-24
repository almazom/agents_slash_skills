---
name: jsonl-digest-today
description: Digest and summarize `.jsonl` session logs under `~/.codex/sessions` for today or a requested date, across `al`/Mac, `pets`, and `almaz`, then explain what work happened grouped by project folder name. Use when the user asks for `jsonl_digest_today`, wants "each and every jsonl file" reviewed deeply, asks what was worked on today across 3 servers, or wants a simplified-Russian digest with minimal visual markers, host breakdown, temp-worktree normalization, and a clear per-project bullet digest of what was going on and what was being worked on.
---

# Jsonl Digest Today

Use this skill to turn many Codex rollout/session `.jsonl` files into one human digest.

Default outcome:
- collect per-host inventories from `al`, `pets`, and `almaz`
- extract stable fields from each `.jsonl`
- normalize temp worktrees back to real projects when possible
- answer `что мы делали сегодня` grouped by project
- present the result in simplified Russian with minimal visual markers, compact tables, and short per-project bullet digests

Read [references/request-template.md](references/request-template.md) when the user says "use this request as template" or gives a rough natural-language prompt to emulate.

Read [references/three-server-collection.md](references/three-server-collection.md) before collecting from all 3 servers. That file contains the host-specific SSH details and the exact collection order.

## Workflow

1. Resolve the date scope.
Default to "today" in the current environment timezone unless the user gives an absolute date.

2. Export per-host summaries first, not raw full logs into chat.
Use `scripts/export_jsonl_host_today.py` locally on each host to produce one JSON export per host.

3. Copy remote exports back to the active machine.
Prefer one local staging area such as `/tmp/jsonl-digest-<date>/`.

4. Aggregate only after all reachable hosts are exported.
Use `scripts/aggregate_jsonl_today.py` on the combined host export files.

5. Review the aggregate for project normalization quality.
If temp worktrees still leak through, inspect `cwd`, `repo_url`, `prompt_short`, and `final_answer_short` and re-map them before answering.

6. Write the final digest for humans.
Answer in simplified Russian with minimal visual markers. Lead with the big picture, then project-by-project truth, then host notes.

7. For each real project, write a short digest block with `7-12` bullets.
Keep each bullet compact and concrete. The bullets should answer two things together:
- what was going on in this project
- what exactly people were working on

## Extraction Rules

- Count only `.jsonl` files under `~/.codex/sessions`.
- Use file `mtime` for "changed today" unless the user explicitly asks for another rule.
- For each file, extract at least:
  - `host`
  - `path`
  - `mtime`
  - `cwd`
  - `repo_url`
  - first meaningful user prompt
  - last assistant/final answer
  - `event_types`
  - `has_task_complete`
- Treat a missing `~/.codex/sessions` directory as a truthful zero, not as an error.
- Keep a `temp_misc` bucket only when the real project cannot be inferred honestly.

## Project Normalization Rules

- Prefer real project names from `repo_url` first.
- If `repo_url` is absent or temporary, use a stable basename from `cwd`.
- If `cwd` is a temp path, scan all text fields for stable repo-like paths such as:
  - `/Users/al/TOOLS/<project>`
  - `/Users/al/zoo_apps/<project>`
  - `/home/pets/TOOLS/<project>`
  - `/home/almaz/TOOLS/<project>`
- Treat values like `.`, `repo`, `tmp`, `tmp.*`, `mw-card*`, and similar scratch names as non-final until cross-checked against text.

## Output Shape

Prefer this order:
1. overall counts
2. by-server counts
3. by-project digest
4. important blockers/completions
5. caveats such as unreachable hosts or unresolved temp buckets

## Visual Style Contract

Keep the visual style minimal.

Allowed markers palette:
- `○ ● ◐ ◑ ◒ ◓`
- `⬆︎ ↗︎ ➡︎ ↘︎ ⬇︎ ↙︎ ⬅︎ ↖︎`
- `◔ ◑ ◶`
- `□ ◲ ◱ ◰ ■`
- `◌ ◎ ◉ ●`
- `① ② ③ ④ ⑤`
- `❶ ❷ ❸ ❹ ❺`
- `⓵ ⓶ ⓷ ⓸ ⓹`

Default preference:
- use only `○`, `●`, `◌`, `①`, `②`, `③`
- use arrows only when direction matters
- use at most one marker per line

Avoid:
- colorful emoji spam
- mixing many marker families in one answer
- decorative markers with no semantic purpose
- using more than 2-3 marker styles in a single digest

## Per-Project Digest Contract

For every main project bucket:
- write `7-12` short bullets in simplified Russian
- keep bullets easy to scan, usually one sentence each
- prefer action truth over vague summaries
- say both the ongoing situation and the concrete work surface
- mention blockers or completions only when they are actually visible in the logs

Good bullet shapes:
- `Шёл review вокруг ...`
- `Чинили ...`
- `Гоняли rerun для ...`
- `Проверяли, завершён ли ...`
- `Готовили/правили runner для ...`
- `Докручивали docs/spec для ...`
- `Тащили truth по Trello/epic/card ...`

Avoid:
- overly generic bullets like `Работали над проектом`
- huge paragraphs
- mixing several unrelated projects into one block
- pretending certainty when temp worktrees are still ambiguous

Good final wording pattern:
- `что было главным`
- `по каким проектам шла работа`
- `что уже завершилось`
- `где были блокеры`
- `что на каком сервере происходило`

When the user explicitly asks for a project-first digest, the per-project `7-12` bullet blocks are more important than a big global summary.
When the user asks for fewer emojis or calmer styling, obey that immediately and keep only the minimal marker palette above.

## List Requirements

Keep list formatting strict and calm.

Rules:
- use flat lists only
- do not nest bullets
- prefer one marker style across the whole answer
- keep one thought per bullet
- keep bullets short and scan-friendly
- avoid paragraphs hiding multiple facts inside one line

Recommended shape:
- overview section: `3-6` bullets
- by-server section: `1-3` bullets or one small table
- each project section: `7-12` bullets
- caveats section: `1-4` bullets

When the user explicitly asks for list requirements, treat this section as mandatory output contract, not as style advice.

## Scripts

- `scripts/export_jsonl_host_today.py`
  Export one host's `~/.codex/sessions` files for a date into normalized JSON.
- `scripts/aggregate_jsonl_today.py`
  Combine one or more host exports and build a structured project digest.

Run the exporter on each reachable host first. Run the aggregator only on the collected exports.

## Validation

- Run the exporter locally at least once on a real date.
- Run the aggregator on at least one local export file.
- If remote hosts are part of the request, confirm whether they returned data, zero, or were unreachable.
