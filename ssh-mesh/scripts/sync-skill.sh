#!/usr/bin/env bash
set -euo pipefail

skill_root="/Users/al/.agents/skills/ssh-mesh"

if [ ! -d "$skill_root" ]; then
  echo "missing skill root: $skill_root" >&2
  exit 1
fi

chmod +x "$skill_root"/scripts/*.sh

targets=("$@")
if [ ${#targets[@]} -eq 0 ]; then
  targets=(pets_proxy_ssh)
fi

for target in "${targets[@]}"; do
  case "$target" in
    pets|pets-proxy|pets_proxy_ssh)
      remote_root="/home/pets/.agents/skills"
      ;;
    almaz|almaz-server|almaz_contabo)
      remote_root="/home/almaz/.agents/skills"
      ;;
    *)
      echo "unsupported target: $target" >&2
      echo "supported targets: pets_proxy_ssh almaz-server" >&2
      exit 1
      ;;
  esac

  ssh "$target" "mkdir -p '$remote_root' && rm -rf '$remote_root/ssh-mesh'"
  scp -r "$skill_root" "$target:$remote_root/"
done

echo "synced ssh-mesh to: ${targets[*]}"
