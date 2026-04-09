---
name: ssh-mesh
description: Shared SSH mesh runbook for the al, pets, and almaz nodes. Use when tasks involve SSH aliases, host reachability, key-based trust, directional connectivity, SCP flows, keepalive settings, or validating multi-node communication between these machines.
---

# SSH Mesh

Maintain and validate SSH connectivity between the three nodes:

- `al` - operator machine at `/Users/al`
- `pets` - RackNerd host at `/home/pets`
- `almaz` - Contabo host at `/home/almaz`

Use this skill when the task mentions:

- `pets`, `almaz`, or `al`
- SSH handshakes, aliases, keys, `authorized_keys`, `known_hosts`
- `scp`, file copy, jump hosts, proxy paths
- full mesh / multidirectional connectivity
- awareness of which node can connect to which peer

## Quick Workflow

1. Read `references/topology.md` for the current mesh state and gaps.
2. Read `references/hosts.md` for canonical aliases, home paths, and outbound key names.
3. Run `scripts/mesh-check.sh` on the relevant node to verify current reachability using node-appropriate defaults.
4. If the task includes `remote -> al`, read `references/relay-tests.md` and use the temporary reverse-tunnel return-path pattern unless `al` is already reachable as a real SSH host.
5. If a direction is missing, add a dedicated outbound key on the source node and append its public key to the destination node's `authorized_keys`.
6. Add or repair the source node's `~/.ssh/config` host stanza using the canonical alias and conservative keepalive settings.
7. Verify with repeated `ssh -o BatchMode=yes` and `scp`, not just a single interactive login.
8. After any local change to this skill on `al`, run `bash ~/.agents/skills/ssh-mesh/scripts/sync-skill.sh` so `pets` and `almaz` keep the same skill version.

## Rules

- Prefer one canonical alias per peer: `al`, `pets`, `almaz`, `almaz-contabo`, `pets-proxy`.
- Prefer dedicated outbound keys per direction or per source node. Do not move private keys into this skill.
- Keep secrets out of skill files. Store only hostnames, public facts, and workflow.
- Use `IdentitiesOnly yes` for mesh aliases to avoid accidental key selection.
- Use:
  - `ControlMaster auto`
  - `ControlPath ~/.ssh/controlmasters/%C`
  - `ControlPersist 4h`
  - `ServerAliveInterval 30`
  - `ServerAliveCountMax 10`
  - `TCPKeepAlive yes`
  - `ConnectTimeout 10`
- Verify both SSH and SCP for any new direction.

## When Full Mesh Is Not Real Yet

If `al` is a laptop or non-public node, do not pretend the mesh is fully symmetric.

- Record the current working directions in `references/topology.md`.
- Mark missing directions explicitly.
- For true 3-way any-direction access, prefer an overlay network such as Tailscale or WireGuard.

## Temporary Return Path To `al`

When `pets` or `almaz` must push a file back to `al` and `al` is not directly reachable:

- run a user-space `sshd` on `al` bound to `127.0.0.1` on a high port
- open a reverse tunnel from each remote node back to that local `sshd`
- use the remote node's existing outbound key with `scp -P <remote_port> ... al@127.0.0.1:<path>`

Important gotcha from live testing:

- creating a reverse tunnel to `pets` through local alias `pets_proxy_ssh` can silently fall through if an existing ControlMaster socket is reused
- for a dedicated reverse tunnel to `pets`, prefer `ssh -S none -o ControlMaster=no -NT -R ... pets_proxy_ssh`
- fixed reverse-tunnel ports can collide with stale listeners from earlier ad hoc sessions; the relay harness should pick dynamic high ports per run

## Validation

Run:

```bash
~/.agents/skills/ssh-mesh/scripts/mesh-check.sh
```

Or pass explicit aliases:

```bash
~/.agents/skills/ssh-mesh/scripts/mesh-check.sh pets almaz-contabo
```

Looped relay validation from `al`:

```bash
bash ~/.agents/skills/ssh-mesh/scripts/relay-loop-test.sh --iterations 10
```

Sync the same skill version to `pets` and `almaz`:

```bash
bash ~/.agents/skills/ssh-mesh/scripts/sync-skill.sh
```

For the last verified file relay sequence and hash results, read `references/relay-tests.md`.
