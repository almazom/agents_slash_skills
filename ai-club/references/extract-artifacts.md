# Extract Artifacts

Use this reference after a fetch when the user wants to work on the dataset itself.

## Dataset Rule

Prefer local `fetched/.../messages.json` files over a new Telegram read.

If the needed dataset does not exist, fetch it first through the low-level operations reference.

## Supported Artifact Types

### Themes

Use when the user asks:

- extract themes
- focus on one theme
- collect messages about topic X

Default process:

1. read the period dataset
2. cluster messages into recurring topics
3. rank themes by frequency and discussion weight
4. if the user asks to focus, build a small dossier for one theme:
   summary, key messages, participants, links, and takeaways

### Links

Use when the user asks:

- collect all links
- analyze all links from fetched
- show what links were shared today or this week

Default process:

1. extract URLs from all message texts
2. deduplicate exact repeats
3. group by domain
4. keep the surrounding message context for each important link
5. if the user asks to analyze links, open the linked pages when browsing is available and permitted; otherwise perform a metadata-only grouping by URL, domain, and message context

### GitHub Links

Use when the user asks:

- collect GitHub links
- analyze repos mentioned in the chat

Default process:

1. filter extracted URLs to `github.com`
2. classify each URL as org, repo, issue, PR, commit, file, or release when possible
3. deduplicate by canonical repo or object
4. summarize what the chat used each GitHub link for

### Entities

Use when the user asks:

- extract people
- extract tools
- extract products
- extract repos
- what projects were discussed

Default process:

1. scan the dataset for repeated names and references
2. normalize obvious duplicates
3. group by people, tools, companies, projects, and repos
4. attach the shortest useful evidence snippets

## Output Defaults

Choose one of these outputs unless the user asks for another format:

- short bullet digest
- table-like markdown list without literal markdown tables
- theme dossier
- links digest
- GitHub digest
- landing-ready structured blocks
