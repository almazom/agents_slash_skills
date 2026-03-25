# Telega CLI Surface

Wrapper path:

```bash
./TOOLS/telega
```

Verified top-level help:

```text
usage: telega [-h] [--version] [--config-dir CONFIG_DIR] [--profile PROFILE]
              [--profiles-dir DIR] [--profile-env FILE] [--pretty] [--verbose]
              {send,status,me,fetch,click,session} ...
```

Verified commands:

- `send`
- `status`
- `me`
- `fetch`
- `click`
- `session status`

Verified fetch shape:

```text
usage: telega fetch [-h] [--profile PROFILE] [--limit N] [--wait SEC] [--json]
                    [target]
```

Verified target forms for `fetch`:

- `@username`
- numeric chat/dialog id like `2771751570`
- web URL like `https://web.telegram.org/a/#-1002771751570`

Verified profiles in this environment:

- `default`
- `almazomkz`

Verified live identities:

- `./TOOLS/telega me --profile default` -> `@almazom`
- `./TOOLS/telega me --profile almazomkz` -> `@almazomkz`
