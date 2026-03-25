# Publishing

Use this reference when the user wants a web page, landing, digest page, or shareable HTML artifact from `ИИшница` material.

## Canonical Mode

Default to direct HTML publishing:

```bash
publish_me --direct --slug <slug> /absolute/path/to/index.html
```

Use markdown publishing only when the user explicitly wants markdown-first output instead of a landing.

## Reference Implementation

The current proven direct-publish pattern lives here:

- `/home/pets/TOOLS/aiclub_skill/docs/project_gathering/visualizations/comm-network-global-v3-6/README.md`
- `/home/pets/TOOLS/aiclub_skill/docs/project_gathering/visualizations/comm-network-global-v3-6/publish.sh`

That pattern uses:

- a versioned HTML folder
- a stable slug
- `publish_me --direct`

## Start Point

For a new page, start from this skill asset:

- `assets/channel_landing_template.html`

Then fill the placeholders with:

- page title
- period label
- top metrics
- themes
- thread or context cards
- links or GitHub section
- insights

## Recommended Landing Types

- full period report
- one-theme dossier
- links digest
- GitHub digest
- single-thread explainer
- month overview

## Slug Rules

- keep slugs lowercase
- prefer hyphens
- include the artifact type and period when useful
- keep the slug stable when updating the same landing

Examples:

- `iishnitsa-day-report`
- `iishnitsa-week-links`
- `iishnitsa-month-overview`
- `iishnitsa-theme-agents`

## Guardrails

- Use `--direct` only for trusted local HTML you control.
- Keep the publish file absolute.
- Mention the public URL clearly after publish.
- If the user only wants analysis in chat, do not publish automatically.
