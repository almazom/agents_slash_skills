# Examples

Create a new run:

```bash
cd /home/pets/TOOLS/long-task-skill-family-skill
PYTHONPATH=src python -m long_task_skill_family_skill start \
  --repo-root /abs/path/to/repo \
  --goal "Ship this task through plan, split, and implementation with durable state"
```

Show current state:

```bash
cd /home/pets/TOOLS/long-task-skill-family-skill
PYTHONPATH=src python -m long_task_skill_family_skill status \
  --run-root /abs/path/to/runs/<run-id>
```

Register a finished plan and open the split phase:

```bash
cd /home/pets/TOOLS/long-task-skill-family-skill
PYTHONPATH=src python -m long_task_skill_family_skill gate-check \
  --run-root /abs/path/to/runs/<run-id> \
  --phase plan \
  --artifact /abs/path/to/IMPLEMENTATION_PLAN.md
```

Register a finished split package and open implementation:

```bash
cd /home/pets/TOOLS/long-task-skill-family-skill
PYTHONPATH=src python -m long_task_skill_family_skill gate-check \
  --run-root /abs/path/to/runs/<run-id> \
  --phase split \
  --artifact /abs/path/to/generated/package
```

Resume while preserving the same manager/worker panes:

```bash
cd /home/pets/TOOLS/long-task-skill-family-skill
PYTHONPATH=src python -m long_task_skill_family_skill resume \
  --run-root /abs/path/to/runs/<run-id> \
  --manager-pane-id 212 \
  --worker-pane-id 219
```

Write the local minute summary:

```bash
cd /home/pets/TOOLS/long-task-skill-family-skill
PYTHONPATH=src python -m long_task_skill_family_skill observe \
  --run-root /abs/path/to/runs/<run-id>
```

Render or send the 15-minute Mattermost-ready update:

```bash
cd /home/pets/TOOLS/long-task-skill-family-skill
PYTHONPATH=src python -m long_task_skill_family_skill notify \
  --run-root /abs/path/to/runs/<run-id>
```

```bash
cd /home/pets/TOOLS/long-task-skill-family-skill
PYTHONPATH=src python -m long_task_skill_family_skill notify \
  --run-root /abs/path/to/runs/<run-id> \
  --send
```

Prepare the cron observers for one manager pane and one worker pane:

```bash
cd /home/pets/TOOLS/long-task-skill-family-skill
PYTHONPATH=src python -m long_task_skill_family_skill schedule \
  --run-root /abs/path/to/runs/<run-id> \
  --manager-wakeup-pane-id 212 \
  --worker-pane-id 219
```

Use a prompt-ready dedicated manager wakeup pane for `--manager-wakeup-pane-id`.
Do not reuse a busy outer Codex control pane for cron wakeups.
