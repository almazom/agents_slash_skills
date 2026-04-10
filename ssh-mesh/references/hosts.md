# Canonical Hosts And Keys

## Canonical Aliases

- `al` - operator node
- `pets` - RackNerd node
- `almaz` - Contabo node
- `pets-proxy` - local-machine-only proxy-backed path to `pets`
- `almaz-contabo` - alias on `pets` for reaching Contabo

## Current Host Facts

### al

- home: `/Users/al`
- local SSH config: `/Users/al/.ssh/config`
- current working aliases:
  - `pets_proxy_ssh`
  - `pets` may be unreliable locally
  - `almaz-server`
- temporary test-only local return endpoint:
  - local `sshd` on a dynamic high port chosen by `relay-loop-test.sh`

### pets

- home: `/home/pets`
- SSH config: `/home/pets/.ssh/config`
- current outbound key to Contabo:
  - `~/.ssh/id_ed25519_pets_to_almaz_contabo`
- current aliases to Contabo:
  - `almaz`
  - `almaz-contabo`
- local preference:
  - use `almaz` as the stable local alias on `pets`
  - keep `almaz-contabo` as a compatibility alias to the same host
- temporary return port back to `al` during testing:
  - dynamic high port on `127.0.0.1` chosen by `relay-loop-test.sh`

### almaz

- home: `/home/almaz`
- SSH config: `/home/almaz/.ssh/config`
- current outbound key to pets:
  - `~/.ssh/id_ed25519_almaz_to_pets`
- current alias to pets:
  - `pets`
- temporary return port back to `al` during testing:
  - dynamic high port on `127.0.0.1` chosen by `relay-loop-test.sh`

## Reverse-Tunnel Test Pattern

When `al` is not directly reachable, remote nodes can still push to `al` during a controlled test:

- `almaz`:

```bash
scp -P <almaz_return_port> -o BatchMode=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  -i ~/.ssh/id_ed25519_almaz_to_pets /tmp/testfile al@127.0.0.1:/tmp/testfile
```

- `pets`:

```bash
scp -P <pets_return_port> -o BatchMode=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  -i ~/.ssh/id_ed25519_pets_to_almaz_contabo /tmp/testfile al@127.0.0.1:/tmp/testfile
```

## Validation Commands

### On pets

```bash
ssh -o BatchMode=yes almaz 'hostname; whoami'
ssh -o BatchMode=yes almaz-contabo 'hostname; whoami'
scp -o BatchMode=yes /tmp/testfile almaz-contabo:/tmp/testfile
```

### On almaz

```bash
ssh -o BatchMode=yes pets 'hostname; whoami'
scp -o BatchMode=yes /tmp/testfile pets:/tmp/testfile
```

### On al

```bash
ssh -o BatchMode=yes pets_proxy_ssh 'hostname; whoami'
ssh -o BatchMode=yes almaz-server 'hostname; whoami'
```
