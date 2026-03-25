# Explain Message

Use this reference when the user asks to explain a specific message, the latest message from `ИИшница`, or the latest message from a specific person such as `@michaelsavin`.

## Goal

Explain the meaning of the message in simplified Russian and place it inside the right amount of conversational context.

## Default Context Strategy

Use `thread first` logic.

1. Prefer an existing local dataset for the relevant day.
2. If the user asks for the latest message and no good local dataset exists, create a fresh 24-hour window with `fetch-border` and `read --json`.
3. Identify the target message.
   The target may be:
   - the latest message in the channel
   - the latest message from one named sender
   - a message from one named sender inside a specific day dataset
4. If `reply_to_id` is present, reconstruct the reply chain from the same dataset.
5. If `reply_to_id` is absent or the chain is incomplete, collect nearby messages around the target.
6. If nearby messages do not form a coherent conversational unit, treat the message as standalone.

## Concrete Fallback Rules

When the message is part of a thread:

- Include the replied-to parent if present.
- Include direct replies to the target if they exist in the dataset.
- Include short thread summary before explaining the specific target message.

When the message is not part of a clear thread:

- Take up to 5 preceding messages and up to 3 following messages from the same dataset.
- Prefer nearby messages within the same activity burst.
- Treat messages more than 90 minutes away as weak context unless the text clearly connects them.

## Output Shape

Answer in simplified Russian with this structure:

1. `Суть:` what the message says in plain words
2. `Контекст:` how it connects to the surrounding conversation, or that it looks standalone
3. `Что имелось в виду:` the practical meaning or likely intent
4. `Неясности:` only if the message remains ambiguous

Keep the answer short unless the user asks for a deeper breakdown.

## Useful Retrieval Patterns

Fresh latest-message path:

```bash
cd /home/pets/TOOLS/aiclub_skill
./telega_v2 fetch-border "https://t.me/+6vi39KaavkU2M2Yy" rolling_24h --profile almazom
./telega_v2 read "https://t.me/+6vi39KaavkU2M2Yy" last:1 --json --profile almazom
```

Local-dataset path:

```bash
cd /home/pets/TOOLS/aiclub_skill
find fetched -maxdepth 3 -path '*/iishnitsa/messages.json' | sort | tail
```
