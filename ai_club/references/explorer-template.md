# Explorer Template

Use this reference when the user asks for:

- `explorer template`
- `communication explorer`
- `publish in explorer template`
- `like comm-network-explorer-v3-8`
- `not a linear report, make explorer`

## Canonical Reference

Treat this existing core artifact as the canonical explorer template:

- `/home/pets/TOOLS/aiclub_skill/docs/project_gathering/visualizations/comm-network-global-v3-8/index.html`
- `/home/pets/TOOLS/aiclub_skill/docs/project_gathering/visualizations/comm-network-global-v3-8/README.md`

Do not reinterpret `explorer template` as a generic landing. Reuse this structure and interaction model.

## What Explorer Template Means

The explorer template is a dark interactive communication explorer with:

- left sidebar
- global overview
- strategic takeaways
- core topics
- network graph in the main pane
- top badge for time range
- personal drill-down mode for one speaker
- per-speaker stats
- per-speaker insights
- per-speaker topics
- `Read All Messages in Bubbles` overlay
- `Back to Global` navigation

## Data Contract For Explorer Pages

Explorer pages should organize data around:

- `rawNodes`
  each participant node carries message count, topics, insights, total messages, and `raw_messages`
- `rawEdges`
  relationship or reply intensity between participants
- `globalData`
  global topics, insights, and active speakers

When generating an explorer page, preserve this shape whenever practical:

- participant node metadata
- raw message timestamps and texts
- global summary blocks
- network relations

## Presentation Rules

- Prefer the exact explorer mental model over article-style prose.
- Keep the dark visual system, sidebar-plus-graph layout, and message overlay behavior.
- Preserve per-speaker exploration as the primary drill-down.
- Show full message history for the selected speaker in bubble mode when raw messages are available.
- Keep the graph as the center of navigation, not as a decorative element.

## When To Use It

Prefer explorer template when the user wants:

- communication structure
- who talked to whom
- per-person exploration
- all messages of one participant
- theme plus speaker plus network navigation in one page

Do not default to explorer template for short textual summaries or simple digests unless the user asks for it.
