#!/usr/bin/env bash
set -euo pipefail

skill_root="/Users/al/.agents/skills/ssh-mesh"

if [ ! -d "$skill_root" ]; then
  echo "missing skill root: $skill_root" >&2
  exit 1
fi

chmod +x "$skill_root"/scripts/*.sh

ssh pets_proxy_ssh 'mkdir -p /home/pets/.agents/skills && rm -rf /home/pets/.agents/skills/ssh-mesh'
scp -r "$skill_root" pets_proxy_ssh:/home/pets/.agents/skills/

ssh almaz-server 'mkdir -p /home/almaz/.agents/skills && rm -rf /home/almaz/.agents/skills/ssh-mesh'
scp -r "$skill_root" almaz-server:/home/almaz/.agents/skills/

echo "synced ssh-mesh to pets and almaz"
