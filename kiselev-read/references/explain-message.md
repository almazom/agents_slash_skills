# Explain Message

Use this reference when the user asks to explain:

- the last message
- the last message from one person
- a specific message inside DEKSDEN space

## Goal

Explain the message in simplified Russian and place it into the right context.

## Default Context Strategy

1. Prefer a fresh live probe if the user clearly means the latest message now.
2. Prefer a local fetched day snapshot if the user means a past day or period analysis.
3. If both channel and chat matter, work from a deduped combined snapshot.
4. Use thread-first logic:
   - if `reply_to_id` exists, reconstruct the parent and nearby replies
   - otherwise take nearby messages from the same activity burst
5. If the target is a mirrored channel post inside the chat, explain the original channel post and then mention the chat reaction around it.

## Fallback Rules

When the message is part of a thread:

- include parent message if present
- include direct replies if present
- summarize thread briefly before explaining target meaning

When the message is not part of a clear thread:

- take up to 5 previous messages and up to 3 next messages
- prefer same-day same-burst context
- treat messages more than 90 minutes away as weak context unless the text clearly connects

## Output Shape

Use this structure:

1. `Суть:`
2. `Контекст:`
3. `Что имелось в виду:`
4. `Неясности:` only if needed

Keep it short unless the user asks for depth.
