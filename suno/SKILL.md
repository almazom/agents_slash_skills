---
name: suno
description: Use when the task is to operate the local Suno CLI toolkit in `/home/pets/TOOLS/suno_skill_cli`, including auth/session checks, `/me` library work, liked-feed sync and cache, exact random liked picks, song rename, song download, Telegram delivery, taste-aware Suno prompt generation, and Suno operator chain flows.
triggers: suno, $suno, Suno CLI, suno_song_cli, suno auth, suno liked, suno download, suno prompt, song download, music generation, Suno song, liked feed sync
---

# Suno

Use this skill for the local Suno CLI repository:

- `/home/pets/TOOLS/suno_skill_cli`

## Skill trace

- Follow the governing `AGENTS.md` skill-trace contract when one exists.
- Fallback examples: `🚀🎹 [skill:suno] ON ...`, `🛠️🎹 [skill:suno] STEP ...`, and `✅🎹 [skill:suno] DONE ...`.

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
- Treat human-friendly phrases such as “сердечки”, “мои лайки”, “избранное”, “surprise me”, “не только свежие”, “не только то, что видно”, and “честно случайно” as exact whole-liked random intent when the user is clearly asking for random liked songs.
- If the user wants `3-7` links only from liked songs, prefer `suno-random-liked` over Telegram delivery stations.
- If the user says `только ссылки`, `без слов`, `без пояснений`, `без нумерации`, or `по одной в строке`, treat that as a strict output contract: emit exactly the requested count of raw Suno URLs and nothing else.
- Do not write cookies, tokens, or raw auth state into docs or memory.

## Random Liked Quality Gate

Before showing any human-requested random liked links to the user:

1. treat the candidate batch as provisional
2. verify every final `song_id` against the exact liked cache
3. require every candidate to exist in the cache as an active liked song
4. reject the entire batch if even one link is missing or not liked
5. rerun selection instead of mixing valid and invalid links
6. only after the gate passes, print the final links

If the user asked for links only, do not show the validation prose or provisional list; show only the final gated URLs.

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
- `./suno-random-liked`
- `./pw-suno-rename-song`
- `./pw-suno-download`
- `./pw-suno-deliver`
- `./pw-suno-latest-liked-deliver`

## Decision Rules

- If the user asks for a truly random liked song, require the exact liked cache and use `pw-suno-liked-random-pick`.
- If the user asks conversationally for a few truly random liked links, use `suno-random-liked`.
- If the user asks for the latest liked song, use the visible `/me` path.
- If the user asks for the total liked count, prefer the exact feed cache.
- If the user asks to rename by song id, use `pw-suno-rename-song`.
- If the user asks to deliver a song, keep the local MP3 filename stable and use the Telegram caption with the real title plus canonical song link when available.

## If User Wants X -> Use Y

- latest liked song -> `pw-suno-favorites-pick --strategy latest`
- latest liked delivery -> `pw-suno-latest-liked-deliver`
- true random liked song -> `pw-suno-liked-random-pick`
- true random liked batch delivery -> `pw-suno-liked-random-deliver`
- 3-7 truly random liked links only -> `suno-random-liked`
- "сделай сюрприз из моих сердечек" -> `suno-random-liked`
- "дай несколько честно случайных ссылок из всех лайков" -> `suno-random-liked`
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

## Example User Requests

- "покажи мой последний лайк в Suno" -> `pw-suno-favorites-pick --strategy latest`
- "скинь последний лайк в телегу" -> `pw-suno-latest-liked-deliver`
- "дай одну по-настоящему случайную песню из всех лайков" -> `pw-suno-liked-random-pick`
- "сделай сюрприз из моих сердечек, только 5 ссылок" -> `suno-random-liked`
- "дай 3-7 честно случайных ссылок из всех моих лайков, не только из свежих" -> `suno-random-liked`
- "отправь 3 truly random liked songs в Telegram" -> `pw-suno-liked-random-deliver`
- "сколько у меня всего liked songs?" -> `pw-suno-feed-read --consistency exact`
- "обнови exact liked cache" -> `pw-suno-feed-sync --mode auto` or `--mode full`
- "скачай этот song по id" -> `pw-suno-download`
- "отправь только ссылку на этот song" -> `pw-suno-deliver --delivery-mode link`
- "переименуй эту песню по id" -> `pw-suno-rename-song`
- "открой мою библиотеку /me" -> `pw-suno-library-open`

## True Random Promise

When the user explicitly cares that the pick is truly random, explain the method briefly in 3-7 short steps when helpful:

1. use the exact liked cache, not visible DOM cards
2. if the cache is missing or not exact, sync it first
3. remember that incremental sync can leave the cache provisional
4. use full sync when exact whole-liked coverage must be restored
5. pick uniformly from the full active liked list by index
6. report the pool size and chosen position when that builds trust

For human-friendly link-only requests, keep one more mapping in mind:

1. if the user wants links only, prefer `suno-random-liked`
2. if the user wants one song artifact, use `pw-suno-liked-random-pick`
3. if the user wants Telegram delivery, use `pw-suno-liked-random-deliver`

Keep the explanation compact and concrete. The goal is to make it clear that the result is not biased toward newest songs, currently visible cards, or partial `/me` state.

## Taste-Aware Prompt Generation

### Triggers

Activate this flow when the user asks to generate Suno creation prompts or instructions, especially with phrases like:

- "generate prompts", "generate instructions", "suno instructions", "creation prompts"
- "music instructions", "instrumental prompts", "suno prompts"
- "придумай промпты", "сгенерируй инструкции", "инструкции для сано", "промпты для сано"
- "based on my taste", "под мой вкус", "под мои лайки", "based on my tastes"
- "like Frisell", "like Jakob Bro", "в стиле [guitarist]", "like [guitarist]"
- "look into my music tastes", "my music tastes", "analyze my tastes"
- any request that combines "taste" + "generate" + "suno" intent

### What to Generate

Produce **3 copy-paste ready Suno `/create` prompts**. Each prompt must be:

1. **Instrumental only** — no vocals, no singing, no lyrics
2. **Copy-paste ready** — `Style:` line + `Prompt:` block, nothing else needed
3. **Very different from each other** — each targets a different genre cluster, tempo range, instrumentation, and mood
4. **Grounded in the operator's actual liked tags** — use the real tag distribution from `items.jsonl`
5. **Rich in specific detail** — real instrument names, amp types, pedal chains, harmonic language, specific playing techniques
6. **Creative and varied** — no two prompts should share the same time signature, BPM range, or primary instrument role

### Mandatory Steps

Every time this flow runs, the agent must:

1. **Read the taste mapping card** — `.MEMORY/cards/029-music-taste-guitar-influences.md`
2. **Read all guitarist influence cards** — currently cards `030` (Bill Frisell) and `031` (Jakob Bro), more may exist; find them via `.MEMORY/INDEX.md`
3. **Read the live liked tag distribution** — parse `.state/suno-feed/liked-newest/items.jsonl` and count `display_tags` frequencies; do not rely on stale summaries
4. **If a guitarist is named** — anchor at least 1 prompt to that guitarist's specific gear, technique, amp, and pedal markers from their profile card
5. **Ensure each prompt targets a different genre cluster** — pick 3 distinct clusters from the operator's tag distribution (e.g. jazz fusion + ambient electronic + free jazz world music)
6. **Output format** — for each prompt emit:

```
### #N — [Short Evocative Title]

Style: [comma-separated tags — see Style Line Rules below]

Prompt: [detailed instrumental generation instruction]
```

### Genre Cluster Selection

Pick 3 different clusters from the operator's tag distribution. Known clusters from the current taste profile:

| Cluster | Key tags in liked library | Approx weight |
|---|---|---|
| Jazz Fusion / Prog Jazz Rock | jazz fusion, progressive jazz rock, jazz, nu jazz, fusion, jazz-fusion, fusion jazz, progressive jazz, acoustic jazz | ~50% |
| Free Jazz / Avant-Garde | free jazz, avant-garde, experimental, solo improvisation, free improvisation, experimental jazz | ~15% |
| Progressive Rock | progressive rock, rock, blues rock, progressive blues rock | ~8% |
| Blues | blues, delta blues, progressive blues, slow blues | ~8% |
| Drum and Bass / Electronic | drum and bass, electronic, electronica, minimal electronica, minimal electronic, industrial | ~9% |
| World / Folk | world music, world fusion, folk, ethnic folk, ethnic, indian jazz-fusion | ~7% |
| Ambient / Atmospheric | ambient, atmospheric | ~3% |
| Trip Hop / Downtempo | trip hop, trip-hop, nu disco, nu funk | ~4% |
| Classical / Orchestral | classical, contemporary classical, orchestral, chamber jazz | ~2% |
| ECM / Nordic Cool | ECM jazz, ECM-style, contemporary jazz, dark jazz | ~3% |

When picking 3 clusters, prefer combinations that maximize contrast (e.g. Jazz Fusion + Ambient + Free Jazz, or Prog Rock + Trip Hop + World Folk).

### Style Line Rules

The `Style:` line is the single most important factor for Suno output quality. It must be a **rich keyword soup** — the more specific tags, the better. Rules:

1. **Include genre tags** — primary genre + 2-3 sub-genres from the operator's liked tags
2. **Include every instrument by name** — e.g. "Rhodes piano, upright bass, brushed drums, alto saxophone, tabla"
3. **Include mood adjectives** — e.g. "melancholic, cinematic, meditative, autumnal, spacious"
4. **Include production/atmosphere descriptors** — e.g. "warm analog tone, natural room ambiance, close-miked, cinematic"
5. **Include tempo indication** — e.g. "slow tempo, 65 BPM" or "rubato, no fixed tempo" or "driving 120 BPM"
6. **Include recording space** — e.g. "recorded in a small wooden room", "stone church acoustics", "dry studio"
7. **Always end with** `instrumental, no vocals, no lyrics` — double-reinforce the no-vocal constraint
8. **Maximum ~200 characters** — Suno truncates very long style fields

Example Style line:
```
Style: Instrumental, jazz fusion, ECM-style, baritone guitar, Rhodes piano, upright bass, brushed drums, alto sax, tabla, warm analog tone, slow tempo, melancholic, cinematic, natural room ambiance, no vocals, no lyrics
```

### Prompt Block Rules

The `Prompt:` block is where technique, structure, and guitarist DNA live. Rules:

1. **Open with the sonic foundation** — tempo, key/time signature, core instrument setup
2. **Encode guitarist technique as sonic instructions** — not brand names. Use sonic descriptions:
   - ✅ "volume pedal swells into long delay with 6 repeats" — NOT "Ernie Ball VP Jr into Boss DD-2"
   - ✅ "clean bell-like tone with occasional grit on crescendos" — NOT "Fender Princeton Reverb with ProCo RAT"
   - ✅ "crystalline Telecaster tone with tape echo and long reverb tail" — NOT "Fender Telecaster through Boss DD-2 and Lexicon MPX G2"
3. **Describe harmonic language** — e.g. "suspended chords, lydian mode, open voicings, quartal harmony"
4. **Include at least 1 structural twist** — drop-out, silence, tempo change, key shift, double-time, or section where instruments drop out
5. **Describe the ending** — how does the piece resolve or fade
6. **Include mood/scene anchors** — e.g. "film-noir atmosphere", "vast empty landscape at dusk", "autumnal melancholy"
7. **End with** `No vocals. No lyrics.`

### Guitarist Integration

When a guitarist is named or when generating general taste-based prompts:

- Use the guitarist's **specific technique** encoded as sonic descriptions, NOT brand names:
  - Frisell: volume pedal swells into long delay with regeneration, clean bell-like tone with occasional grit, looping textures, wide intervallic leaps
  - Bro: crystalline clean tone with minimal effects, space and silence as structure, sketch-like melodic fragments unfolded through improvisation, quartal harmony
- Use the guitarist's **harmonic language** directly in the Prompt text: lydian mode, quartal harmony, pedal points, suspended chords, open voicings
- Use the guitarist's **typical collaborators' instruments** as secondary textures (pedal steel, cello, trumpet, tabla, piccolo trumpet, marimba, etc.)
- The profile cards store brand-name gear for reference — but when writing prompts, always translate gear into **sonic descriptions**

### Creativity Guidelines

- Vary tempo: use slow (50-70 BPM), medium (80-110 BPM), and odd-meter or rubato across the 3 prompts
- Vary ensemble size: solo guitar, trio, quartet, large ensemble
- Vary dynamics: from whisper-quiet to explosive
- Vary production aesthetic: dry/studio, washy/reverb-heavy, lo-fi, cinematic
- At least 1 prompt should include a structural twist (drop-out, silence, tempo change, key shift, double-time)
- Use **sonic descriptions** over brand names: prefer "tape echo with 5 repeats and warm decay" over "Boss DD-2"
- Use **mood/scene anchors**: give Suno an emotional world to inhabit (e.g. "film-noir atmosphere", "vast empty landscape at dusk", "autumnal melancholy")
- Use **recording space descriptions**: tell Suno what room to simulate (e.g. "recorded in a small wooden room", "stone church acoustics", "dry close-miked studio")
- Use **harmonic language** explicitly: tell Suno what harmony to use (e.g. "suspended chords and lydian mode", "quartal harmony and pedal points", "open voicings in fourths")
- Reinforce `instrumental, no vocals, no lyrics` in BOTH Style line AND at the end of the Prompt block

### Adding New Guitarist Profiles

When the operator names a new guitarist influence:

1. Research the guitarist: Wikipedia, interviews, gear guides, discography
2. Create a new memory card following the same structure as cards 030/031 (guitars, amps, effects, technique, style, key collaborators, key albums)
3. Register the card in `.MEMORY/INDEX.md`
4. Update card 029 to list the new influence
5. Then generate prompts using the new profile

### Memory Dependencies

This flow depends on these memory artifacts:

- `.MEMORY/cards/029-music-taste-guitar-influences.md` — taste-to-influence mapping
- `.MEMORY/cards/030-bill-frisell-profile.md` — full profile (guitars, amps, effects, technique, style, collaborators, albums)
- `.MEMORY/cards/031-jakob-bro-profile.md` — full profile (same structure)
- `.state/suno-feed/liked-newest/items.jsonl` — live liked songs with `display_tags` for fresh tag distribution

All guitarist profile cards follow the same section structure for consistency:
Fact → Guitars → Amps → Effects chain → Technique → Style → Key collaborators → Key albums → Why → Evidence → Next → Confidence
