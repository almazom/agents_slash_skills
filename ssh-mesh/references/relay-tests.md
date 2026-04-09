# Relay Copy Tests

Last validated: 2026-04-09

## Latest 10-Pass Run

Command:

```bash
bash ~/.agents/skills/ssh-mesh/scripts/relay-loop-test.sh --iterations 10
```

Latest dynamic ports from the clean run:

- local temporary `sshd` on `al`: `22672`
- return port on `pets`: `32292`
- return port on `almaz`: `32993`

Sequence per iteration:

1. `al -> pets`
2. `pets -> almaz`
3. `almaz -> al` through temporary reverse tunnel
4. `almaz -> pets`
5. `pets -> al` through temporary reverse tunnel

## Result

- passes: `10/10`
- mismatches: `0`
- every hop preserved the SHA-256 digest
- detailed per-iteration output was written to `/tmp/ssh-mesh-relay/results.tsv`

Sample digests from the last clean run:

- iteration 1: `e18c94bd3e86de9f5425eb5aefb412be328ffe734f5c70894252d2f06ca975d8`
- iteration 10: `3c3e285bad5a4ddae57b3885fae3c84de3664cb8fb92e1a60d79654bcba3dbe6`

## Operational Knowledge

- the mesh supports repeated file relay across `al -> pets -> almaz -> al` and `almaz -> pets -> al`
- for `remote -> al`, a temporary reverse-tunnel harness is still required because `al` is not a persistent public SSH target
- `pets` reverse tunnels must avoid local ControlMaster reuse:

```bash
ssh -S none -o ControlMaster=no -NT -R <pets_return_port>:127.0.0.1:<local_sshd_port> pets_proxy_ssh
```

- fixed reverse-tunnel ports are a bad default because stale listeners can survive earlier ad hoc sessions, especially on `almaz`
- the relay harness now chooses dynamic high ports per run to avoid those collisions

## Implication

The relay workflow is repeatable and stable for testing and controlled transfers, but it still relies on a temporary return-path harness. This does not make `al` permanently reachable from `pets` or `almaz`.
