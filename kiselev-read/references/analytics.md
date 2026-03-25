# Analytics

Use this reference for day, week, and month analytics for DEKSDEN channel + chat.

## Period Rules

### Day

- fetch or reuse:
  `python3 scripts/analyze/fetch_kiselev_read.py --scope combined --period day`
- then build:
  `python3 scripts/reporting/build_combined_snapshot.py --from YYYY-MM-DD --to YYYY-MM-DD`

### Week

- fetch or reuse:
  `python3 scripts/analyze/fetch_kiselev_read.py --scope combined --period week`
- then build:
  `python3 scripts/reporting/build_combined_snapshot.py --from YYYY-MM-DD --to YYYY-MM-DD`

### Month

- aggregate daily snapshots
- do not invent a direct Telegram month window
- build combined datasets from the needed daily folders

## Important Combined Rule

Channel posts are mirrored into chat 1:1, so combined analytics must remove those mirrors by default.

Practical reading:

- channel = original publication flow
- chat = reaction, discussion, follow-up, disagreement, questions

## Report Structure

Default high-level structure:

1. Executive summary
2. What was published in the channel
3. How the chat reacted
4. Main themes
5. Top participants
6. Timeline / activity bursts
7. Links and external artifacts
8. Key takeaways

## Timeline Rules

If the user asks for `timeline`:

- emphasize chronology first
- separate publication moments from reaction waves
- highlight spikes after channel posts

## Best Practices

- Do not mix mirrored channel copies with real chat discussion.
- Highlight whether a theme started in the channel or emerged in the chat.
- Track who carried the discussion after a post landed.
- Treat links as first-class artifacts when they drive the conversation.
