# MCP Server Configuration (`mcp.json` & `mcp_config.json`)

Only ship MCP configuration files when your plugin bundles or connects to an actual MCP server. Because Agent Plugins `mcp.json` uses a closed schema (`additionalProperties: false`) requiring `$schema` and `type`, while Google Antigravity reads `mcp_config.json` (ignoring `mcp.json` with a warning) and Claude Code reads `.mcp.json` (leading dot, or `mcpServers` in `.claude-plugin/plugin.json` / `marketplace.json`), **there is no single portable superset file**—ship `mcp.json` for Agent Plugins / Copilot and `mcp_config.json` for Antigravity (plus `.mcp.json` or Claude manifest `mcpServers` if targeting Claude Code with MCP).

## Key Rules Across Both Formats

- **Transports:** Prefer `stdio` (local subprocess) and `streamable-http` / Streamable HTTP (remote endpoint). Legacy `sse` is deprecated in Agent Plugins 1.0 and unsupported in Antigravity `mcp_config.json` (which also rejects `httpUrl`).
- **Reserved environment variables:** Clients inject `PLUGIN_ROOT` and `PLUGIN_DATA` automatically for `stdio` servers, so omit `PLUGIN_ROOT` and `PLUGIN_DATA` from `env` keys to avoid schema rejection or overriding host paths.
- **Placeholder expansion:** Use `${PLUGIN_ROOT}` and `${PLUGIN_DATA}` only in `args`, `cwd`, and `env` values—keep `mcp.json` `command`, `env` keys, `url`, and `headers` free of placeholders because clients do not expand them there.
- **Secret-free config files:** Keep API keys, tokens, and passwords out of committed `env`, `headers`, and `oauth` blocks. For secret-like keys (`secret`, `token`, `password`, `api_key`, `credential`), use `""`, `"example"`, `"changeme"`, or a `${VAR}` placeholder.

## 1. Agent Plugins v1.0.0 (`<plugin-root>/mcp.json`)

- Set `$schema` to `"https://agent-plugins.org/schemas/1.0.0/mcp.schema.json"` (matching `plugin.json`'s version).
- Set `stdio` `command` to a single executable token (bare name like `"npx"` or plugin-relative `./...` path, with no spaces and no placeholders).
- Prefix optional `stdio` `cwd` (defaults to plugin root) with `./`, `${PLUGIN_ROOT}`, or `${PLUGIN_DATA}` so it stays contained within the plugin or data root.
- Use an absolute `https://` URL for remote `url` (plain `http://` is permitted only for loopback hosts `localhost`, `127.x.x.x`, `::1`), omitting userinfo and `#fragment`.
- Agent Plugins 1.0 defines no portable credential-reference or OAuth fields; keep `env` and `headers` secret-free.

```json validate:mcp.json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "local-tool": {
      "type": "stdio",
      "command": "./bin/server",
      "args": [
        "--cache-dir",
        "${PLUGIN_DATA}/cache"
      ],
      "cwd": "${PLUGIN_ROOT}",
      "env": {
        "LOG_LEVEL": "info",
        "STATE_DIR": "${PLUGIN_DATA}/state"
      }
    },
    "npx-helper": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@example/mcp-helper"
      ],
      "cwd": "./"
    },
    "docs-remote": {
      "type": "streamable-http",
      "url": "https://mcp.example.com/v1",
      "headers": {
        "X-Client-Name": "hello-world"
      }
    }
  }
}
```

## 2. Google Antigravity (`<plugin-root>/mcp_config.json`)

- Transport is inferred from either `command` (`stdio`) or `serverUrl` / `url` (Streamable HTTP)—never both, and never `httpUrl` or `type: "sse"`.
- User credentials belong in `mcpServers.<server>.variables` (never at top-level `variables`) and are referenced via `${VARIABLE_NAME}`. Plugins declaring `variables` install disabled until configured by the user.
- Optional Antigravity extensions include `timeoutSeconds` (integer), `authProviderType` (`"google_credentials"`), `oauth`, `disabled`, `enabledTools`, `disabledTools`, and per-tool `tools.<name>` (`{ eager?: boolean, background?: "off" | "always" }`).

```json validate:mcp_config.json
{
  "mcpServers": {
    "local-tool": {
      "command": "node",
      "args": [
        "./scripts/server.mjs",
        "--cache-dir",
        "${PLUGIN_DATA}/cache"
      ],
      "cwd": "${PLUGIN_ROOT}",
      "env": {
        "LOG_LEVEL": "info",
        "API_TOKEN": "${API_TOKEN}"
      },
      "variables": [
        {
          "name": "API_TOKEN",
          "title": "API Token",
          "description": "Personal access token for the local tool backend.",
          "link": "https://example.com/settings/tokens"
        }
      ],
      "timeoutSeconds": 60
    },
    "docs-remote": {
      "serverUrl": "https://mcp.example.com/v1",
      "headers": {
        "X-Client-Name": "hello-world"
      },
      "tools": {
        "search_docs": {
          "eager": true,
          "background": "off"
        }
      }
    }
  }
}
```

## Common Mistakes to Avoid

| Invalid Pattern | Why It Fails |
| --- | --- |
| `"command": "node ./bin/server"` in `mcp.json` | `command` must be a single token with no whitespace; move arguments into `args`. |
| `"command": "${PLUGIN_ROOT}/bin/server"` in `mcp.json` | Placeholder expansion is forbidden in `command`; use `"./bin/server"`. |
| `"env": { "PLUGIN_ROOT": "..." }` | `PLUGIN_ROOT` and `PLUGIN_DATA` are reserved and injected by the host. |
| `"env": { "API_TOKEN": "sk-live-12345" }` | Hardcoded secret; use `"${API_TOKEN}"` (with Antigravity `variables`) or `""`/`"example"`/`"changeme"`. |
| `"url": "http://mcp.example.com/v1"` in `mcp.json` | Non-loopback remote MCP endpoints must use `https://`. |
| Top-level `"variables": [...]` in `mcp_config.json` | Antigravity requires `variables` inside `mcpServers.<server>.variables`. |
| `"httpUrl": "..."` or `"type": "sse"` in `mcp_config.json` | Unsupported in Antigravity `mcp_config.json`; use `serverUrl` with Streamable HTTP. |
