# Examples

Show the current package status before launch or resume:

```bash
cd /home/pets/TOOLS/implementation_manager_skill_cli && PYTHONPATH=src python -m implementation_manager_skill_cli status --package /abs/path/generated/<plan-slug> --config /abs/path/generated/<plan-slug>/manager-runtime.yaml
```

Start a managed observed implementation session:

```bash
zellij
cd /home/pets/TOOLS/implementation_manager_skill_cli && PYTHONPATH=src python -m implementation_manager_skill_cli run --package /abs/path/generated/<plan-slug> --repo-root /abs/path/to/repo --config /abs/path/generated/<plan-slug>/manager-runtime.yaml
```

If status already reports a mid-card stage such as `in_progress`, `simplify`, `commit`, or `codex-review`:

- resume from the reported real stage
- keep `kanban.json` untouched by hand
- do not force the package back to `ready`

If the primary review path fails:

- keep the stage honest
- use a locally supported fallback backend only if it creates a real review artifact
- attach that artifact to the manager run evidence

Expected behavior:

- manager owns the session
- manager is launched from a Zellij-owned shell
- worker runs in a floating `zellij` pane
- worker prompt is force-prefixed with `$implementation-skill` for the active card
- runtime handoff questions are suppressed with `execution_mode=autonomous_managed`
- manager still owns stage transitions, commit flow, and next-card selection
- pane title shows current card index, total cards, and stage
- manager emits a progress bar plus 3 short Russian bullets
