#!/usr/bin/env bash
set -euo pipefail

skill_root="/Users/al/.agents/skills/pane-to-pane-communication"

if [[ ! -d "$skill_root" ]]; then
  echo "missing skill root: $skill_root" >&2
  exit 1
fi

targets=("$@")
if [[ ${#targets[@]} -eq 0 ]]; then
  targets=(pets_proxy_ssh)
fi

for target in "${targets[@]}"; do
  case "$target" in
    pets|pets-proxy|pets_proxy_ssh)
      remote_root="/home/pets/.agents/skills"
      ;;
    *)
      echo "unsupported target: $target" >&2
      echo "supported targets: pets_proxy_ssh" >&2
      exit 1
      ;;
  esac

  ssh "$target" "mkdir -p '$remote_root' && rm -rf '$remote_root/pane-to-pane-communication'"
  scp -r "$skill_root" "$target:$remote_root/"
done

echo "synced pane-to-pane-communication to: ${targets[*]}"
