# Request Template

Use this reference when the user says "use this message as template" or gives a rough natural-language brief.

## Raw-style template

```text
Review deep systematically each and every jsonl file in all 3 servers:
tailscale Mac is localhost, pets ssh, almaz ssh.

Each and every jsonl file that was changed today in .codex/sessions folders.

Look deep, organize information we can extract from them.

Present it in a way easy to human eye answering:
what we was working on today on all 3 servers.

In simplified Russian with minimal visual markers.

Important: collect by project folder name.

For each project, organize a clear short digest in Russian:
7-12 bullet items about what was going on there and what people were working on.
```

## Normalized operator intent

- scope: `.jsonl` under `~/.codex/sessions`
- date: today unless overridden
- hosts: `al`, `pets`, `almaz`
- extraction depth: more than file listing; inspect prompts, finals, status signals, and project identity
- grouping key: real project folder name
- output language: simplified Russian
- output style: minimal markers, compact tables, easy to scan
- per-project contract: `7-12` short bullets in Russian for each main project
- list contract: flat lists only, calm markers, one thought per bullet

## Useful follow-up variables

- exact date instead of "today"
- include or exclude temp/review worktrees
- show per-host details before project details or vice versa
- include only major projects or every detected bucket
- make project bullets shorter or more detailed
- reduce markers to a minimal palette
