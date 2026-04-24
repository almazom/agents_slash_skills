---
name: repo-wiki
description: Analyze, plan, rebuild, refresh, validate, or improve repository wiki documentation through /home/almaz/TOOLS/repo-wiki-cli-skill when the user wants a reusable .repowiki structure, reference pack extraction, selective regeneration, hook-based freshness, or temp-clone validation on real repositories.
triggers: repo-wiki, $repo-wiki, .repowiki, repo wiki, repository documentation, wiki generation, repo-wiki-cli-skill, reference pack, wiki regeneration, repo wiki validation
---

# repo-wiki

Use this skill as a thin wrapper over `/home/almaz/TOOLS/repo-wiki-cli-skill`.

The runtime is the source of truth for:

- RepoWiki analysis from an existing `.repowiki/` or legacy `.qoder/repowiki/` tree;
- universal `.repowiki/<language>/content/` scaffold generation for new repositories;
- reference-pack extraction and reusable page-template structure;
- selective post-commit regeneration through `hook-run`;
- freshness artifacts under `.repowiki/<language>/meta/repo-wiki-cli/`;
- non-interactive validation loops on copied or temp-cloned repositories.

## When to use

Use this skill when the user wants any of the following:

- understand an existing RepoWiki structure;
- create or rebuild `.repowiki/` for a project;
- make RepoWiki globally reusable as a universal structure, not project-specific docs;
- install or run hook-based refresh after commits;
- extract a reusable reference pack and page taxonomy;
- validate the runtime on temporary clones of real repositories;
- improve the universal RepoWiki skill by observing generated output on varied codebases.

## Default workflow

1. Start with `analyze` on the target repository.
2. If the repo already has meaningful wiki content, inspect the active root and page structure first.
3. If the user wants a tool-owned wiki, run `rebuild` and write into `.repowiki/`.
4. If the user wants commit-time freshness, run `install-hook` or `hook-run`.
5. If the task is about improving the skill itself, validate on temp copies or temp clones of real repositories before changing the runtime.
6. Prefer universal fixes that improve behavior across repo classes instead of fitting one repository.

## Operating rules

- Treat `.repowiki/` as the skill-owned output root.
- Treat `.qoder/repowiki/` as legacy read input when present.
- Default language is `ru` unless the user explicitly asks for another language.
- Prefer `PYTHONPATH=/home/almaz/TOOLS/repo-wiki-cli-skill/src python3.11 -m repo_wiki_cli_skill.cli ...` when using the runtime directly.
- Use `rebuild` before testing `hook-run` on a repo that has no `.repowiki/` yet.
- When validating on public repositories, clone into `/tmp/` and keep the loop local to the temp clone.
- When improving the skill, only keep changes that generalize across repository types such as Python, TypeScript, Rust, C/C++, monorepos, and mixed-case layouts.
- Do not hardcode project-specific taxonomy or file-selection rules into the runtime.
- Use `self-improve` when the task is to stress the runtime itself; use manual temp-clone loops when reviewing actual generated pages is important.

## Core commands

- `analyze` inspects current RepoWiki state.
- `extract-reference` emits a normalized reference pack.
- `plan` emits the planned universal RepoWiki structure.
- `rebuild` writes `.repowiki/`.
- `refresh-check` computes impacted pages for the latest commit.
- `install-hook` installs the managed post-commit refresh hook.
- `hook-run` executes one refresh pass and writes freshness artifacts.
- `self-improve` runs a non-interactive improvement loop on copied repositories.

## Artifacts to inspect

- `.repowiki/<language>/content/*.md`
- `.repowiki/<language>/meta/repowiki-metadata.json`
- `.repowiki/<language>/meta/repo-wiki-cli/freshness-ledger.json`
- `.repowiki/<language>/meta/repo-wiki-cli/latest-refresh-report.json`
- `.repowiki/<language>/meta/repo-wiki-cli/refresh-summary.md`

## When to read extra references

- Read [references/examples.md](references/examples.md) for concrete command patterns and temp-clone validation flows.
