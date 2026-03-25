# Extract Artifacts

Use this reference when the user asks for:

- links
- GitHub links
- themes
- people
- focused topic extraction

## Link Extraction

Preferred flow:

1. make sure day/week snapshots exist
2. build deduped combined dataset
3. extract URLs from combined messages
4. group by domain
5. optionally separate:
   - channel links
   - chat follow-up links

## GitHub Focus

When the user says `analyze all github links`:

- filter URLs by `github.com`
- dedupe identical URLs
- keep message context for each link
- say whether the repo appeared in the channel post itself or only in chat discussion

## Theme Focus

When the user says `focus on theme X`:

- filter messages by keyword cluster
- show where the theme originated:
  channel, chat, or both
- include the people who moved that theme forward

## People Focus

When the user asks about one person:

- search both sources in the combined deduped dataset
- do not confuse mirrored channel messages with that person's own discussion messages
