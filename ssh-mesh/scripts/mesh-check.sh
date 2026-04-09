#!/usr/bin/env bash
set -euo pipefail

user_name=$(whoami)
host_name=$(hostname)
targets=("$@")

if [ ${#targets[@]} -eq 0 ]; then
  case "$user_name" in
    al)
      targets=(pets_proxy_ssh almaz-server)
      ;;
    pets)
      targets=(almaz-contabo)
      ;;
    almaz)
      targets=(pets)
      ;;
    *)
      targets=()
      ;;
  esac
fi

echo "mesh-check host=$host_name user=$user_name"

if [ ${#targets[@]} -eq 0 ]; then
  echo "no default targets for this node; pass aliases explicitly"
  exit 1
fi

for target in "${targets[@]}"; do
  printf '\n[%s]\n' "$target"
  if ssh -o BatchMode=yes -o ConnectTimeout=10 "$target" 'hostname; whoami' 2>/tmp/mesh-check.err.$$; then
    echo "status=ok"
  else
    rc=$?
    echo "status=fail rc=$rc"
    sed -n '1,8p' /tmp/mesh-check.err.$$ || true
  fi
done

rm -f /tmp/mesh-check.err.$$
