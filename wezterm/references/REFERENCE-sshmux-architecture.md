# REFERENCE — SSHMUX Architecture

Domain types, config structs, and how WezTerm multiplexing works under the hood.

## Domain Types

A *domain* is a distinct set of windows and tabs. WezTerm supports four domain types:

| Type | Connection | Persistence | Requires wezterm on remote |
|---|---|---|---|
| **Local** (default) | In-process | Until GUI closes | N/A (local) |
| **SSH Domain** | SSH + unix socket | Survives reconnect | **Yes** |
| **Unix Domain** | Local unix socket | Survives GUI restart | N/A (local) |
| **TLS Domain** | TLS-encrypted TCP | Survives reconnect, auto-reconnects | **Yes** (bootstraps via SSH) |

## SSH Domain Architecture

```
Client (local WezTerm)          Server (remote host)
┌──────────────────┐            ┌──────────────────┐
│  wezterm GUI     │──SSH──────>│  wezterm-mux-    │
│                  │            │  server           │
│  attach via      │<─unix─────>│  (unix socket)    │
│  connect/CLI     │  socket    │                  │
└──────────────────┘            └──────────────────┘
```

Flow:
1. Client opens SSH connection to remote host
2. Remote side spawns `wezterm-mux-server` (or reuses existing one)
3. Client connects to remote mux server via unix socket over SSH channel
4. Tabs/panes are managed by the remote mux server — they survive SSH disconnect
5. Client re-attaches on reconnect

## Multiplexing Modes for SSH Domains

| Mode | Behavior | Use case |
|---|---|---|
| `"WezTerm"` (default) | Full mux on remote, persistent tabs, requires wezterm binary on remote | Remote multiplexing |
| `"None"` | Plain SSH channel, no mux, tabs die on disconnect, no wezterm needed on remote | Quick SSH, WSL bridging |

## Auto-populated Domains from `~/.ssh/config`

WezTerm parses `~/.ssh/config` and `/etc/ssh/ssh_config`, auto-generates domains per host:

| Prefix | Type | Persistence |
|---|---|---|
| `SSH:hostname` | Plain SSH | No (dies on disconnect) |
| `SSHMUX:hostname` | SSH multiplexing | Yes (survives reconnect) |

Supported ssh config options:
- `IdentityAgent`, `IdentityFile`, `Hostname`, `User`, `Port`
- `ProxyCommand`, `ProxyUseFDpass`
- `Host` (including wildcard matching)
- `UserKnownHostsFile`, `IdentitiesOnly`, `BindAddress`
- `Include`, `Match` (Host and LocalUser only, no Exec support)
- `ServerAliveInterval` (libssh backend only, fire-and-forget keepalive)
- `ServerAliveCountMax` (NOT supported)

Customize auto-populated domains via `wezterm.default_ssh_domains()` in Lua config.

## SSH Backend

```lua
config.ssh_backend = 'LibSsh'   -- default: libssh (broader key support, clearer auth feedback)
-- config.ssh_backend = 'Ssh2'  -- alternative: libssh2 (older, separate implementation)
```

Despite naming, `libssh2` is not a newer version of `libssh` — they are completely separate SSH implementations.

## SSH Domain Config Struct (`.wezterm.lua`)

```lua
config.ssh_domains = {
  {
    name = 'unique-domain-name',       -- required, must be unique across all domains
    remote_address = 'host:port',      -- required, DNS or IP
    username = 'user',                 -- SSH username

    -- Auth
    -- no_agent_auth = false,          -- disable SSH agent auth

    -- Connection
    -- connect_automatically = true,   -- connect on startup
    -- timeout = 60,                   -- read timeout in seconds
    -- remote_wezterm_path = "/path",  -- wezterm binary location on remote

    -- Multiplexing mode
    -- multiplexing = 'WezTerm',       -- 'WezTerm' (full mux) or 'None' (plain SSH)
    -- default_prog = { 'fish' },      -- for multiplexing = 'None'
    -- assume_shell = 'Posix',         -- 'Posix' enables OSC 7 cwd tracking with None mux

    -- Latency
    -- local_echo_threshold_ms = 10,   -- predictive local echo when RTT exceeds threshold
    -- overlay_lag_indicator = false,   -- show lag overlay on pane (default: disabled)

    -- SSH config overrides
    -- ssh_option = {
    --   identityfile = '/path/to/key',
    -- },
  },
}
```

## Unix Domain Config Struct

```lua
config.unix_domains = {
  {
    name = 'unix',                     -- required, unique

    -- Socket
    -- socket_path = "/path",          -- default: computed automatically
    -- no_serve_automatically = false,  -- don't auto-start server
    -- skip_permissions_check = false,  -- for WSL scenarios (NTFS permissions)
    -- serve_command = { 'wsl', 'wezterm-mux-server', '--daemonize' },  -- custom server start

    -- Proxy (replaces direct unix socket)
    -- proxy_command = { 'nc', '-U', '/path/to/sock' },

    -- Latency
    -- local_echo_threshold_ms = 10,
  },
}

-- Auto-connect on startup:
-- config.default_gui_startup_args = { 'connect', 'unix' }
```

## TLS Domain Config Structs

Client:
```lua
config.tls_clients = {
  {
    name = 'server.name',             -- required, unique
    remote_address = 'host:port',     -- required

    -- Bootstrap (initial SSH to obtain TLS cert)
    bootstrap_via_ssh = 'host',       -- accepts same syntax as `wezterm ssh`

    -- TLS certificates
    -- pem_private_key = '/path/to/key',
    -- pem_cert = '/path/to/cert',
    -- pem_ca = '/path/to/ca',
    -- pem_root_certs = '/path/to/root',

    -- Validation
    -- accept_invalid_hostnames = false,
    -- expected_cn = 'expected-common-name',

    -- Connection
    -- connect_automatically = true,
    -- read_timeout = 60,
    -- write_timeout = 60,
    -- remote_wezterm_path = '/path',

    -- Latency
    -- local_echo_threshold_ms = 10,
    -- overlay_lag_indicator = false,
  },
}
```

Server:
```lua
config.tls_servers = {
  {
    bind_address = 'host:port',       -- required

    -- TLS certificates
    -- pem_private_key = '/path/to/key',
    -- pem_cert = '/path/to/cert',
    -- pem_ca = '/path/to/ca',
    -- pem_root_certs = '/path/to/root',
  },
}
```

## Global Mux Config

```lua
-- Default domain for mux server (cannot be SSH/Unix/TLS client domain — prevents recursion)
-- config.default_mux_server_domain = 'local'

-- Default domain for GUI (can be SSH/Unix domain)
-- config.default_domain = 'my.server'

-- Environment variables stripped from mux server environment
config.mux_env_remove = {
  'SSH_AUTH_SOCK',
  'SSH_CLIENT',
  'SSH_CONNECTION',
}

-- SSH agent forwarding through mux
-- config.mux_enable_ssh_agent = true   -- default: true
-- When true, sets SSH_AUTH_SOCK in local domain panes
-- Points to symlink updated within 100ms of active client changing
-- Check current value: wezterm cli list-clients (SSH_AUTH_SOCK column)
```

## DaemonOptions (source: `config/src/daemon.rs`)

Controls mux server daemon behavior. All fields optional with runtime fallbacks.

```lua
config.daemon_options = {
  -- pid_file = '/path/to/pid',     -- default: RUNTIME_DIR/pid
  -- stdout = '/path/to/stdout',    -- default: RUNTIME_DIR/log
  -- stderr = '/path/to/stderr',    -- default: RUNTIME_DIR/log
}
```

## Related CLI Commands

| Command | Purpose |
|---|---|
| `wezterm ssh user@host` | Ad-hoc SSH (non-persistent) |
| `wezterm connect <domain>` | Connect to configured domain |
| `wezterm cli spawn --domain-name SSHMUX:host` | Spawn pane in remote domain |
| `wezterm cli --prefer-mux <cmd>` | Route CLI through mux server |
| `wezterm cli list-clients` | Show connected clients, SSH_AUTH_SOCK per session |
