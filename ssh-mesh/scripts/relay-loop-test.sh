#!/usr/bin/env bash
set -euo pipefail

iterations=10

while [ $# -gt 0 ]; do
  case "$1" in
    --iterations)
      iterations="$2"
      shift 2
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if ! [[ "$iterations" =~ ^[0-9]+$ ]] || [ "$iterations" -lt 1 ]; then
  echo "iterations must be a positive integer" >&2
  exit 1
fi

tmp_root="/tmp/ssh-mesh-relay"
sshd_root="$tmp_root/sshd"
results_file="$tmp_root/results.tsv"
mkdir -p "$tmp_root"
rm -f "$results_file"

sshd_pid=""
pets_tunnel_pid=""
almaz_tunnel_pid=""

cleanup() {
  if [ -n "${pets_tunnel_pid:-}" ] && kill -0 "$pets_tunnel_pid" 2>/dev/null; then
    kill "$pets_tunnel_pid" 2>/dev/null || true
    wait "$pets_tunnel_pid" 2>/dev/null || true
  fi
  if [ -n "${almaz_tunnel_pid:-}" ] && kill -0 "$almaz_tunnel_pid" 2>/dev/null; then
    kill "$almaz_tunnel_pid" 2>/dev/null || true
    wait "$almaz_tunnel_pid" 2>/dev/null || true
  fi
  if [ -n "${sshd_pid:-}" ] && kill -0 "$sshd_pid" 2>/dev/null; then
    kill "$sshd_pid" 2>/dev/null || true
    wait "$sshd_pid" 2>/dev/null || true
  fi
  rm -rf "$sshd_root"
}

trap cleanup EXIT

local_port_in_use() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

random_port() {
  local low="$1"
  local high="$2"
  echo $((low + RANDOM % (high - low + 1)))
}

pick_local_port() {
  local port=""
  while :; do
    port=$(random_port 22000 22999)
    if ! local_port_in_use "$port"; then
      echo "$port"
      return 0
    fi
  done
}

start_tunnel() {
  local label="$1"
  local host_alias="$2"
  local remote_port=""
  local pid=""
  local log_file="$tmp_root/${label}-tunnel.log"

  while :; do
    remote_port=$(random_port 32000 32999)
    : > "$log_file"

    ssh -NT -S none -o ControlMaster=no -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=10 -R "${remote_port}:127.0.0.1:${local_sshd_port}" "$host_alias" > /dev/null 2>"$log_file" &
    pid=$!
    sleep 1

    if kill -0 "$pid" 2>/dev/null; then
      printf '%s\t%s\n' "$remote_port" "$pid"
      return 0
    fi

    wait "$pid" 2>/dev/null || true
  done
}

pets_pubkey=$(ssh pets_proxy_ssh 'cat ~/.ssh/id_ed25519_pets_to_almaz_contabo.pub')
almaz_pubkey=$(ssh almaz-server 'cat ~/.ssh/id_ed25519_almaz_to_pets.pub')

local_sshd_port=$(pick_local_port)

rm -rf "$sshd_root"
mkdir -p "$sshd_root"
chmod 700 "$sshd_root"
cat > "$sshd_root/authorized_keys" <<EOF
$pets_pubkey
$almaz_pubkey
EOF
chmod 600 "$sshd_root/authorized_keys"
ssh-keygen -q -t ed25519 -N '' -f "$sshd_root/ssh_host_ed25519_key"

cat > "$sshd_root/sshd_config" <<EOF
Port $local_sshd_port
ListenAddress 127.0.0.1
HostKey $sshd_root/ssh_host_ed25519_key
PidFile $sshd_root/sshd.pid
AuthorizedKeysFile $sshd_root/authorized_keys
PasswordAuthentication no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
PubkeyAuthentication yes
UsePAM no
AllowUsers $(whoami)
PermitRootLogin no
StrictModes no
Subsystem sftp internal-sftp
LogLevel ERROR
EOF

/usr/sbin/sshd -D -f "$sshd_root/sshd_config" -E "$sshd_root/sshd.log" &
sshd_pid=$!
sleep 1

IFS=$'\t' read -r pets_return_port pets_tunnel_pid < <(start_tunnel pets pets_proxy_ssh)
IFS=$'\t' read -r almaz_return_port almaz_tunnel_pid < <(start_tunnel almaz almaz-server)

sleep 2

# shellcheck disable=SC2029
ssh pets_proxy_ssh "ssh -p ${pets_return_port} -o BatchMode=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -i ~/.ssh/id_ed25519_pets_to_almaz_contabo al@127.0.0.1 'echo pets-return-ok'" >/dev/null
# shellcheck disable=SC2029
ssh almaz-server "ssh -p ${almaz_return_port} -o BatchMode=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -i ~/.ssh/id_ed25519_almaz_to_pets al@127.0.0.1 'echo almaz-return-ok'" >/dev/null

echo "local_sshd_port=$local_sshd_port"
echo "pets_return_port=$pets_return_port"
echo "almaz_return_port=$almaz_return_port"

echo -e "iteration\torig_hash\tpets_hash\talmaz_hash\tal_from_almaz_hash\tpets_back_hash\tal_from_pets_hash\tstatus" > "$results_file"

pass_count=0

for i in $(seq 1 "$iterations"); do
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  orig="/tmp/ssh_mesh_payload_${stamp}_${i}.txt"
  ret1="/tmp/ssh_mesh_return_from_almaz_${stamp}_${i}.txt"
  ret2="/tmp/ssh_mesh_return_from_pets_${stamp}_${i}.txt"
  pets_fwd="/tmp/ssh_mesh_payload_${stamp}_${i}.txt"
  almaz_fwd="/tmp/ssh_mesh_payload_${stamp}_${i}.txt"
  pets_back="/tmp/ssh_mesh_payload_back_${stamp}_${i}.txt"

  printf 'ssh-mesh payload\niteration=%s\nstamp=%s\nsource=al\n' "$i" "$stamp" > "$orig"
  orig_hash=$(shasum -a 256 "$orig" | cut -d' ' -f1)

  scp -q "$orig" pets_proxy_ssh:"$pets_fwd"
  # shellcheck disable=SC2029
  pets_hash=$(ssh pets_proxy_ssh "sha256sum '$pets_fwd' | cut -d' ' -f1")

  # shellcheck disable=SC2029
  ssh pets_proxy_ssh "scp -q '$pets_fwd' almaz-contabo:'$almaz_fwd'"
  # shellcheck disable=SC2029
  almaz_hash=$(ssh almaz-server "sha256sum '$almaz_fwd' | cut -d' ' -f1")

  # shellcheck disable=SC2029
  ssh almaz-server "scp -q -P ${almaz_return_port} -o BatchMode=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -i ~/.ssh/id_ed25519_almaz_to_pets '$almaz_fwd' al@127.0.0.1:'$ret1'"
  al_from_almaz_hash=$(shasum -a 256 "$ret1" | cut -d' ' -f1)

  # shellcheck disable=SC2029
  ssh almaz-server "scp -q '$almaz_fwd' pets:'$pets_back'"
  # shellcheck disable=SC2029
  pets_back_hash=$(ssh pets_proxy_ssh "sha256sum '$pets_back' | cut -d' ' -f1")

  # shellcheck disable=SC2029
  ssh pets_proxy_ssh "scp -q -P ${pets_return_port} -o BatchMode=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -i ~/.ssh/id_ed25519_pets_to_almaz_contabo '$pets_back' al@127.0.0.1:'$ret2'"
  al_from_pets_hash=$(shasum -a 256 "$ret2" | cut -d' ' -f1)

  status="ok"
  if [ "$orig_hash" != "$pets_hash" ] || \
     [ "$orig_hash" != "$almaz_hash" ] || \
     [ "$orig_hash" != "$al_from_almaz_hash" ] || \
     [ "$orig_hash" != "$pets_back_hash" ] || \
     [ "$orig_hash" != "$al_from_pets_hash" ]; then
    status="mismatch"
  fi

  if [ "$status" = "ok" ]; then
    pass_count=$((pass_count + 1))
  fi

  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$i" \
    "$orig_hash" \
    "$pets_hash" \
    "$almaz_hash" \
    "$al_from_almaz_hash" \
    "$pets_back_hash" \
    "$al_from_pets_hash" \
    "$status" >> "$results_file"

  echo "iteration=$i status=$status hash=$orig_hash"

  # shellcheck disable=SC2029
  ssh pets_proxy_ssh "rm -f '$pets_fwd' '$pets_back'"
  # shellcheck disable=SC2029
  ssh almaz-server "rm -f '$almaz_fwd'"
done

echo "passes=$pass_count/$iterations"
echo "results_file=$results_file"
