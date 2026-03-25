# Examples

Use this reference when the user writes in:

- short command style
- mixed Russian and English
- typo-heavy shorthand
- `do X and send link only` form

Interpret these examples as canonical usage patterns for `ai_club`.

## Explain One Message

User:

`ai_club: there was last message in aiclub, explain in simplified russian`

Meaning:

- fetch or read the latest available message
- gather nearby context
- if it is a reply, reconstruct the local thread first
- explain in simple Russian

Expected output:

- short plain-language explanation
- mention whether the message is standalone or part of a thread

User:

`ai_club: explain last message with context, not solo`

Meaning:

- same as above
- bias strongly toward thread-first reading

## Explain Message From One Person

User:

`ai_club: explain last message from @michaelsavin in simplified russian`

Meaning:

- find the latest message from that person inside the relevant dataset
- gather thread or nearby context
- explain it in simple Russian

Expected output:

- short explanation in simple Russian
- say whether this was part of a thread or mostly standalone

User:

`ai_club: найди последнее сообщение от @michaelsavin, возьми тред и объясни в упрощённом русском`

Meaning:

- explicitly use thread-first logic
- if the target is a reply, include parent and nearby replies
- if there is no thread, fall back to nearby context

User:

`ai_club: explain message from @username with context around`

Meaning:

- same pattern for any `@username`
- interpret `with context around` as nearby-message context when a clean reply chain is missing

User:

`ai_club: explain message from @michaelsavin for 2026-03-24 in simplified russian`

Meaning:

- select the message from the requested day instead of the absolute latest one
- use that day's organized snapshot as the primary source

## Low-Level Fetch

User:

`ai_club: force fetch all messages today`

Meaning:

- refresh today's organized snapshot for `iishnitsa`
- prefer the core organize flow
- if the main runtime is blocked, use the nearest safe fallback and say so

Expected output:

- whether fetch succeeded
- where the snapshot lives

User:

`ai_club: refetch week`

Meaning:

- rebuild the week snapshot for `iishnitsa`

## Period Analytics

User:

`ai_club: analytics for 1 day`

Meaning:

- build a day report from organized snapshots
- extract major themes, active people, dynamics, and high-level takeaways

User:

`ai_club: make week report for iishnitsa`

Meaning:

- build a week report
- emphasize trend lines, repeated topics, strongest contributors, and structural observations

User:

`ai_club: month overview`

Meaning:

- aggregate daily snapshots inside the month
- do not treat month as a special Telegram fetch window

## Timeline Requests

User:

`ai_club: i wan to get 1 week time line`

Meaning:

- build a 7-day timeline artifact
- decide between text or published HTML from surrounding wording

User:

`ai_club: build timeline for 2026-03-18..2026-03-24 and send link only`

Meaning:

- create a published artifact for that exact time range
- return only the link

## Explorer Template

User:

`ai_club: publish yesterday communication in explorer template`

Meaning:

- load yesterday's snapshot or fetch it if missing
- generate the canonical dark communication explorer
- publish with `publish_me --direct`

Expected output:

- public link

User:

`ai_club: publish yesterday ai_club and send link only`

Meaning:

- infer the missing words as `publish yesterday communication from ИИшница`
- return only the final URL

User:

`ai_club: week explorer template for iishnitsa`

Meaning:

- produce the explorer layout for a week dataset, not a linear markdown report

## Landing Publication

User:

`ai_club: publish this as landing`

Meaning:

- make a normal HTML landing
- do not force explorer template unless the user says so

User:

`ai_club: publish in explorer template and send me as a link`

Meaning:

- keep explorer layout
- publish
- return the URL clearly

## Themes, Links, GitHub

User:

`ai_club: on fetched messages for today collect links`

Meaning:

- read today's snapshot
- extract all URLs
- group or deduplicate if useful

User:

`ai_club: analyze all github links from fetched`

Meaning:

- extract GitHub URLs from the selected period
- summarize what each repo or page is about if data is available

User:

`ai_club: focus on theme agents in week snapshot`

Meaning:

- filter the week dataset by the requested theme
- return a thematic report instead of a full period report

## Output Contracts

If the user says:

- `send link only`
  return only the published URL
- `simplified russian`
  answer in simple Russian
- `explorer template`
  use the canonical explorer layout, not a generic dashboard
- `timeline`
  emphasize chronological progression
- `force fetch`
  refresh data before analysis

## Safe Normalization Rule

When the user's wording is broken but intent is obvious, normalize to the nearest example above instead of asking for clarification.
