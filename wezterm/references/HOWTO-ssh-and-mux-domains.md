# HOWTO — SSH and Mux Domains

Connect to remote hosts via SSH, configure multiplexing domains, and use SSHMUX.

## Ad-hoc SSH Connection

Connect to a remote host without persistent mux (non-persistent — tabs die if network drops):

```bash
wezterm ssh user@my.server                  # interactive shell
wezterm ssh user@my.server -- top           # run specific command
wezterm ssh -oIdentityFile=/secret/key host  # override SSH options
```

Creating new tabs/panes in this session reuses the SSH channel (no re-auth).

## Connect to Mux Domain

Connect to a configured multiplexing domain (persistent — tabs survive reconnect):

```bash
wezterm connect my.server                   # connect to named domain
wezterm connect unix                        # connect to local unix domain
```

## SSHMUX — Auto-populated from `~/.ssh/config`

WezTerm auto-generates domains from `~/.ssh/config`:

- `SSH:hostname` — plain SSH connection (non-persistent)
- `SSHMUX:hostname` — multiplexing SSH connection (requires wezterm on remote)

```bash
# Connect to auto-populated SSHMUX domain
wezterm connect SSHMUX:my.server

# Spawn into SSHMUX domain from existing wezterm
wezterm cli spawn --domain-name SSHMUX:my.server
```

SSH config parsing supports: `IdentityAgent`, `IdentityFile`, `Hostname`, `User`, `Port`, `ProxyCommand`, `Host` (wildcards), `UserKnownHostsFile`, `IdentitiesOnly`, `BindAddress`, `Include`.

## Configure SSH Domain in `.wezterm.lua`

```lua
config.ssh_domains = {
  {
    name = 'my.server',
    remote_address = '192.168.1.1',
    username = 'wez',
    -- no_agent_auth = false,
    -- connect_automatically = true,
    -- timeout = 60,
    -- remote_wezterm_path = "/home/user/bin/wezterm"
  },
}
```

Auto-connect on startup:
```lua
config.default_gui_startup_args = { 'connect', 'my.server' }
-- or for the GUI default domain:
-- config.default_domain = 'my.server'
```

### Multiplexing Modes

```lua
config.ssh_domains = {
  {
    name = 'my.server',
    remote_address = '192.168.1.1',
    -- "WezTerm" (default): full mux, requires wezterm on remote
    -- "None": plain SSH, no mux, loses panes on disconnect
    multiplexing = 'WezTerm',
  },
}
```

When `multiplexing = "None"`:
- `default_prog` can specify what runs in new tabs (e.g. `{ 'fish' }`)
- `assume_shell = 'Posix'` enables OSC 7 shell integration for cwd tracking

### Local Echo (Latency Hiding)

```lua
config.ssh_domains = {
  {
    name = 'my.server',
    remote_address = '192.168.1.1',
    local_echo_threshold_ms = 10,  -- predict local echo if RTT > 10ms
    -- overlay_lag_indicator = false,  -- show lag overlay (default: disabled)
  },
}
```

### SSH Backend

```lua
config.ssh_backend = 'LibSsh'   -- default: libssh (better key support)
-- config.ssh_backend = 'Ssh2'  -- alternative: libssh2 (older)
```

## Configure Unix Domain (Local Mux)

```lua
config.unix_domains = {
  {
    name = 'unix',
    -- socket_path = "/some/path",           -- custom socket path
    -- no_serve_automatically = false,        -- don't auto-start server
    -- skip_permissions_check = false,        -- for WSL scenarios
  },
}
config.default_gui_startup_args = { 'connect', 'unix' }  -- auto-connect
```

With `proxy_command` (e.g. WSL bridging):

```lua
config.unix_domains = {
  {
    name = 'unix',
    proxy_command = { 'nc', '-U', '/Users/wez/.local/share/wezterm/sock' },
  },
}
```

With custom server command:
```lua
config.unix_domains = {
  {
    name = 'wsl',
    serve_command = { 'wsl', 'wezterm-mux-server', '--daemonize' },
    skip_permissions_check = true,
  },
}
```

## Configure TLS Domain

TLS domains bootstrap via SSH, then switch to TLS-encrypted TCP:

```lua
-- Client side
config.tls_clients = {
  {
    name = 'server.name',
    remote_address = 'server.hostname:8080',
    bootstrap_via_ssh = 'server.hostname',  -- initial SSH to obtain cert
  },
}

-- Server side
config.tls_servers = {
  {
    bind_address = 'server.hostname:8080',
  },
}
```

Connect: `wezterm connect server.name` — auto-reconnects with TLS cert on disconnect.
