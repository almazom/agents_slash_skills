# repo-wiki examples

## Runtime root

Use the runtime from:

`/home/almaz/TOOLS/repo-wiki-cli-skill`

## Direct command form

```bash
PYTHONPATH=/home/almaz/TOOLS/repo-wiki-cli-skill/src python3.11 -m repo_wiki_cli_skill.cli analyze --repo /path/to/repo --json
```

## Common commands

```bash
PYTHONPATH=/home/almaz/TOOLS/repo-wiki-cli-skill/src python3.11 -m repo_wiki_cli_skill.cli rebuild --repo /path/to/repo --json
PYTHONPATH=/home/almaz/TOOLS/repo-wiki-cli-skill/src python3.11 -m repo_wiki_cli_skill.cli hook-run --repo /path/to/repo --json
PYTHONPATH=/home/almaz/TOOLS/repo-wiki-cli-skill/src python3.11 -m repo_wiki_cli_skill.cli install-hook --repo /path/to/repo --json
PYTHONPATH=/home/almaz/TOOLS/repo-wiki-cli-skill/src python3.11 -m repo_wiki_cli_skill.cli extract-reference --repo /path/to/repo --json
PYTHONPATH=/home/almaz/TOOLS/repo-wiki-cli-skill/src python3.11 -m repo_wiki_cli_skill.cli self-improve --runs 10 --workspace /tmp/repo-wiki-self-improve --json
```

## Temp-clone validation loop

```bash
git clone --depth 1 https://github.com/<owner>/<repo>.git /tmp/repo-wiki-validation/<repo>
PYTHONPATH=/home/almaz/TOOLS/repo-wiki-cli-skill/src python3.11 -m repo_wiki_cli_skill.cli rebuild --repo /tmp/repo-wiki-validation/<repo> --json
PYTHONPATH=/home/almaz/TOOLS/repo-wiki-cli-skill/src python3.11 -m repo_wiki_cli_skill.cli analyze --repo /tmp/repo-wiki-validation/<repo> --json
```

Then inspect:

- `/tmp/repo-wiki-validation/<repo>/.repowiki/<language>/content/`
- `/tmp/repo-wiki-validation/<repo>/.repowiki/<language>/meta/repo-wiki-cli/`

## Selective refresh check on a temp clone

```bash
cd /tmp/repo-wiki-validation/<repo>
git add .repowiki
git commit -m "store repowiki scaffold"

# change one real cited source file
git add <changed-file>
git commit -m "touch source"

PYTHONPATH=/home/almaz/TOOLS/repo-wiki-cli-skill/src python3.11 -m repo_wiki_cli_skill.cli hook-run --repo /tmp/repo-wiki-validation/<repo> --json
```

Review:

- `mode`
- `changed_files`
- `all_impacted_pages`
- `regeneration.rewritten_pages`
- untouched pages staying untouched

## Universal improvement rule

Keep fixes that improve classes of repositories such as:

- Python libraries
- TypeScript workspaces
- Rust workspaces
- C/C++ repositories
- mixed-case roots
- docs-heavy repos
- code-heavy repos

Avoid fixing the runtime for one repository name, one product domain, or one vendor tree.
