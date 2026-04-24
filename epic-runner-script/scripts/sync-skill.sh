#!/usr/bin/env bash
set -euo pipefail

skill_name="epic-runner-script"

if [[ -d "/Users/al/.agents/skills/$skill_name" && "$(id -un)" == "al" ]]; then
  skill_root="/Users/al/.agents/skills/$skill_name"
  target_host="pets@100.105.56.68"
  remote_root="/home/pets/.agents/skills"
elif [[ -d "/home/pets/.agents/skills/$skill_name" && "$(id -un)" == "pets" ]]; then
  skill_root="/home/pets/.agents/skills/$skill_name"
  target_host="al@100.112.49.58"
  remote_root="/Users/al/.agents/skills"
else
  echo "unsupported host/user for $skill_name sync" >&2
  exit 1
fi

if [[ ! -d "$skill_root" ]]; then
  echo "missing skill root: $skill_root" >&2
  exit 1
fi

ssh "$target_host" "mkdir -p '$remote_root' && rm -rf '$remote_root/$skill_name'"
scp -r "$skill_root" "$target_host:$remote_root/"

echo "synced $skill_name to: $target_host:$remote_root/$skill_name"
