---
name: suno
description: Use when the task is to operate the local Suno CLI toolkit in `/home/pets/TOOLS/suno_skill_cli`, including auth/session checks, `/me` library work, liked-feed sync and cache, exact random liked picks, song rename, song download, Telegram delivery, and Suno operator chain flows.
---

# Suno

Use this skill for the local Suno CLI repository:

- `/home/pets/TOOLS/suno_skill_cli`

## Bootstrap

Before substantial work in that repo, read:

1. `PROFILE.md`
2. `AURA.md`
3. `PROTOCOL.json`
4. `flow.md`
5. `AGENTS.md`
6. `.MEMORY/NOW.md`
7. `.MEMORY/INDEX.md`
8. only the relevant memory cards

## Core Rules

- Prefer the existing wrappers and `make` targets over ad hoc scripts when a station already exists.
- For exact whole-liked work, use the feed cache tools, not visible DOM sampling.
- For visible `/me` picks only, use `pw-suno-favorites-pick`.
- For delivery flows, prefer `download -> deliver` so the caption can use the real song title plus canonical Suno link.
- When the user asks for “true random”, “truly random”, “really random”, “exact random”, “unbiased random”, or “no bias”, treat that as exact whole-liked random from the full cache, not visible-surface randomness.
- Do not write cookies, tokens, or raw auth state into docs or memory.

## Common Commands

```bash
cd /home/pets/TOOLS/suno_skill_cli
```

```bash
make fetch-liked
```

```bash
make fetch-liked-full
```

```bash
make read-liked
```

```bash
make pick-liked-random
```

```bash
make deliver-liked-random3
```

## Direct Stations

- `./pw-suno-auth-check`
- `./pw-suno-library-open`
- `./pw-suno-favorites-pick`
- `./pw-suno-feed-collect`
- `./pw-suno-feed-sync`
- `./pw-suno-feed-read`
- `./pw-suno-liked-random-pick`
- `./pw-suno-liked-random-deliver`
- `./pw-suno-rename-song`
- `./pw-suno-download`
- `./pw-suno-deliver`
- `./pw-suno-latest-liked-deliver`

## Decision Rules

- If the user asks for a truly random liked song, require the exact liked cache and use `pw-suno-liked-random-pick`.
- If the user asks for the latest liked song, use the visible `/me` path.
- If the user asks for the total liked count, prefer the exact feed cache.
- If the user asks to rename by song id, use `pw-suno-rename-song`.
- If the user asks to deliver a song, keep the local MP3 filename stable and use the Telegram caption with the real title plus canonical song link when available.

## If User Wants X -> Use Y

- latest liked song -> `pw-suno-favorites-pick --strategy latest`
- latest liked delivery -> `pw-suno-latest-liked-deliver`
- true random liked song -> `pw-suno-liked-random-pick`
- true random liked batch delivery -> `pw-suno-liked-random-deliver`
- visible `/me` random only -> `pw-suno-favorites-pick --strategy random`
- exact liked count or exact liked read -> `pw-suno-feed-read --consistency exact`
- refresh exact liked cache -> `pw-suno-feed-sync --mode auto`, then `--mode full` if exactness must be restored now
- collect whole liked feed -> `pw-suno-feed-collect`
- rename by `song_id` or `song_url` -> `pw-suno-rename-song`
- download one song -> `pw-suno-download`
- deliver one downloaded song or link -> `pw-suno-deliver`
- auth/session check -> `pw-suno-auth-check`
- inspect `/me` library surface -> `pw-suno-library-open`
- inspect `/create` surface -> `pw-suno-create-open`
- capture proof for a Suno page -> `pw-suno-proof-capture`

## True Random Promise

When the user explicitly cares that the pick is truly random, explain the method briefly in 3-7 short steps when helpful:

1. use the exact liked cache, not visible DOM cards
2. if the cache is missing or not exact, sync it first
3. remember that incremental sync can leave the cache provisional
4. use full sync when exact whole-liked coverage must be restored
5. pick uniformly from the full active liked list by index
6. report the pool size and chosen position when that builds trust

Keep the explanation compact and concrete. The goal is to make it clear that the result is not biased toward newest songs, currently visible cards, or partial `/me` state.
