# SSH Mesh Topology

Last updated: 2026-04-09

## Nodes

- `al` - local operator machine, home `/Users/al`
- `pets` - RackNerd server, home `/home/pets`
- `almaz` - Contabo server, home `/home/almaz`

## Current Known Working Directions

- `al -> pets` via local alias `pets_proxy_ssh`
- `al -> almaz` via local alias `almaz-server`
- `pets -> almaz` via alias `almaz-contabo` on `pets`
- `almaz -> pets` via alias `pets` on `almaz`

## Current Gaps

- `pets -> al` not configured or verified
- `almaz -> al` not configured or verified
- `al <- pets` and `al <- almaz` depend on whether `al` is reachable as a server

## Temporary Return Paths Validated On 2026-04-09

- `almaz -> al` worked through a dynamic reverse tunnel on `almaz`
- `pets -> al` worked through a dynamic reverse tunnel on `pets`
- both paths terminated in a temporary user-space `sshd` on `al` bound to a dynamic high local port
- these are test-only return paths, not persistent host aliases

## Interpretation

This is not yet a true full mesh. It is a partially connected operational mesh with verified server-to-server trust between `pets` and `almaz`, operator access from `al`, and temporary reverse-tunnel return paths back into `al`.

## Recommended Path To True Any-Direction Connectivity

Use an overlay network, preferably Tailscale or WireGuard, so all three nodes have stable private addresses and do not depend on ad hoc public-IP or proxy routing.

After that:

- define the same canonical aliases on all three nodes
- add dedicated outbound keys
- pre-populate `known_hosts`
- run `mesh-check.sh` from each node
