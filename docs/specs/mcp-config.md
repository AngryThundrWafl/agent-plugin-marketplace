# MCP Configuration Reference: Agent Plugins `mcp.json` vs. Antigravity `mcp_config.json`

- **Retrieval date:** `2026-11-24`
- **MCP specification version:** `2026-07-28`
- **Sources:**
  - MCP Transports Overview (`2026-07-28`): https://modelcontextprotocol.io/specification/2026-07-28/basic/transports
  - Agent Plugins MCP Servers: https://agent-plugins.org/plugin-authors/mcp-servers
  - Agent Plugins `1.0.0` MCP Schema: `schemas/agent-plugins/1.0.0/mcp.schema.json` (`https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`)
  - Antigravity MCP Docs: https://antigravity.google/docs/mcp
  - Antigravity Build Plugins Docs: https://antigravity.google/docs/build-plugins

## Review Claims

1. MCP `2026-07-28` defines two standard transports (`stdio` and `Streamable HTTP`) plus custom transports over UTF-8 JSON-RPC with client-initiated requests only; legacy HTTP+SSE is absent from the `2026-07-28` standard transport list (and noted as deprecated in Agent Plugins `mcp-servers` docs).
2. Agent Plugins `1.0.0` `mcp.json` is a closed JSON Schema (`additionalProperties: false`) requiring `$schema` (`https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`), `mcpServers`, and an explicit `type` (`stdio`, `streamable-http`, or optional legacy `sse`).
3. Antigravity `mcp_config.json` infers transport from `command` (`stdio`) or `serverUrl`/`url` (`Streamable HTTP`), does not support legacy HTTP+SSE or `httpUrl`, and ignores `mcp.json`/`.mcp.json` with validation warnings.
4. Both formats expose `PLUGIN_ROOT` and `PLUGIN_DATA` in `stdio` environments and expand `${PLUGIN_ROOT}`/`${PLUGIN_DATA}` in `args`, `cwd`, and `env` values; Agent Plugins formally forbids defining those keys in `env` (`mcp.schema.json` `not.enum`), while Antigravity's `build-plugins` pre-publish checklist directs authors not to duplicate them in `env`.
5. Agent Plugins `1.0.0` forbids credentials/secrets in `headers` and defines no OAuth or credential-reference fields, whereas Antigravity `mcp_config.json` adds `authProviderType`, `oauth`, and plugin-scoped `mcpServers.<server>.variables` (`${VARIABLE_NAME}`).

---

## 1. Official MCP Spec (`2026-07-28`) Transport Baseline

The MCP specification defines wire behavior and lifecycle; it does **not** standardize client configuration file schemas (`mcp.json` / `mcp_config.json`).

| Transport | Status in `2026-07-28` | Wire Framing & Delivery | Cancellation | Spec Config Properties |
| --- | --- | --- | --- | --- |
| `stdio` | Standard | Newline-delimited UTF-8 JSON-RPC over stdin/stdout of a client-launched subprocess | Client sends `notifications/cancelled` | None defined by MCP spec (detailed binding sub-page unverified) |
| `Streamable HTTP` | Standard | HTTP `POST` per message to a single MCP endpoint; replies as JSON object or request-scoped SSE stream; may mirror `_meta.io.modelcontextprotocol/*` into HTTP headers (body is source of truth) | Client closes the request's response stream | None defined by MCP spec (detailed binding sub-page unverified) |
| Legacy `HTTP+SSE` | Deprecated (omitted from `2026-07-28` standard list) | Earlier connection-scoped `initialize` era (backward-compat matrix and deprecated details unverified in local excerpt) | Unverified in local excerpt | None defined by MCP spec |
| Custom transports | Optional (`MAY`) | Any bidirectional channel preserving UTF-8 JSON-RPC, message patterns, and `_meta.io.modelcontextprotocol/*`; byte streams `SHOULD` reuse `stdio` framing | Transport-defined (`SHOULD` document) | None defined by MCP spec |

**Core wire invariants (`2026-07-28`):**
- All JSON-RPC messages `MUST` be UTF-8 encoded.
- Directionality: clients send `requests` and `notifications`; servers send `responses` and `notifications` (servers do not initiate JSON-RPC requests in `2026-07-28`; earlier revisions allowed server-initiated requests).
- Per-request protocol version and capabilities travel in `_meta.io.modelcontextprotocol/*`.

---

## 2. Side-by-Side Mapping: Agent Plugins `mcp.json` vs. Antigravity `mcp_config.json`

| Concern | Agent Plugins `1.0.0` (`mcp.json`) | Antigravity (`mcp_config.json`) |
| --- | --- | --- |
| **File path(s)** | `<plugin-root>/mcp.json` | Plugin: `<plugin-root>/mcp_config.json`<br>Global: `~/.gemini/config/mcp_config.json`<br>Workspace: `<workspace>/.agents/mcp_config.json` |
| **Top-level schema** | Closed (`additionalProperties: false`): only `$schema` and `mcpServers` (both required) | Root object with `mcpServers` map; formal JSON Schema and `$schema` URL **unverified** |
| **`$schema` value** | Required `const`: `"https://agent-plugins.org/schemas/1.0.0/mcp.schema.json"` | **Unverified** (not documented for `mcp_config.json`) |
| **Server key naming** | Map key under `mcpServers` (regex constraints **unverified**) | Map key under `mcpServers`; plugin servers are namespaced at runtime as `<plugin-name>_<server-key>` |
| **Transport selector** | Required explicit `type`: `"stdio"` \| `"streamable-http"` \| `"sse"` (`oneOf`, `additionalProperties: false`) | Implicit: exactly one of `command` (`stdio`) or `serverUrl` / `url` (`Streamable HTTP`). No `type` field documented |
| **Supported transports** | `stdio` and/or `streamable-http` (clients support >=1, `SHOULD` support both); `sse` optional, deprecated; no fallback defined | `stdio` and `Streamable HTTP` only; legacy `HTTP+SSE` and `httpUrl` **not supported** in `mcp_config.json` (Python SDK supports `stdio`, `SSE`, `HTTP` programmatically) |
| **`stdio` required fields** | `type: "stdio"`, `command` (`string`, `minLength: 1`) | `command` (`string`) |
| **`stdio` optional fields** | `args` (`string[]`), `env` (`Record<string, string>`), `cwd` (`string`) | `args` (`string[]`, default `[]`), `env` (`object`, default `{}`), `cwd` (`string`) |
| **Remote required fields** | `type: "streamable-http"` \| `"sse"`, `url` (`string`, `minLength: 1`) | `serverUrl` (`string`) or alias `url` (`string`); `httpUrl` rejected/unsupported |
| **Remote optional fields** | `headers` (`Record<string, string>`) | `headers` (`object`, default `{}`), `authProviderType`, `oauth` |
| **Reserved env vars** | `PLUGIN_ROOT`, `PLUGIN_DATA` injected by client; **forbidden** as `env` keys (`propertyNames.not.enum`) | `PLUGIN_ROOT`, `PLUGIN_DATA` auto-exported to every plugin MCP server; pre-publish checklist forbids duplicating them in `env` |
| **Path variable expansion** | `${PLUGIN_ROOT}`, `${PLUGIN_DATA}` expanded textual/single-pass/non-recursive in `args`, `env` values, `cwd` ONLY (not `command`, `env` keys, `url`, `headers`) | `${PLUGIN_ROOT}`, `${PLUGIN_DATA}` expanded in `args`, `cwd`, and custom `env` values (see Gotchas for doc wording slip) |
| **User credential variables** | **None** in `1.0.0` (no portable credential-reference syntax) | `mcpServers.<server>.variables`: array of `{ name, title?, description?, link? }`; `${VARIABLE_NAME}` expanded in `command`, `args`, `env`, `url`, `headers` (and `oauth` per table 1; see Gotchas) |
| **Authentication & OAuth** | Client-managed only; no portable OAuth fields in `1.0.0` | Auto OAuth 2.0 PKCE via CIMD (`https://antigravity.google/oauth/client-metadata.json`) or DCR; manual `oauth: { clientId, clientSecret? }` (redirect `https://antigravity.google/oauth-callback`); `authProviderType: "google_credentials"` (ADC) |
| **Secret handling** | `headers` are literal visible package data and **must not** contain credentials or secrets | Plugin configs should use `variables`, `oauth`, or `authProviderType` (static secret linting by `agy plugin validate` is **unverified**); user/workspace configs allow literal `headers` / `oauth.clientSecret`; OAuth tokens stored in `~/.gemini/antigravity/mcp_oauth_tokens.json` |
| **Runtime / tool controls** | Disallowed (`additionalProperties: false`) | `disabled` (`boolean`, default `false`), `enabledTools` (`string[]`), `disabledTools` (`string[]`, default `[]`), `tools.<name>` (`{ eager?: boolean, background?: "off" \| "always" }`), `timeoutSeconds` (`integer`; defaults `300`s connect / `180`s call; `0`/unset = defaults; `<0` disables both) |
| **Failure / install behavior** | Invalid top-level `mcp.json` disables MCP for plugin; invalid single server disables only that entry | Plugins declaring `variables` install **disabled** until user fills them via `/plugin` or Customizations UI; OAuth-only plugins install enabled |

---

## 3. Author & TypeScript Validator Checklist

### 3.1 Agent Plugins `mcp.json` (`1.0.0`)

**JSON Schema checks (`mcp.schema.json`, Draft 2020-12):**
- [ ] Root is an object with **only** `$schema` and `mcpServers` (`additionalProperties: false`).
- [ ] `$schema` equals `"https://agent-plugins.org/schemas/1.0.0/mcp.schema.json"`.
- [ ] Every `mcpServers.<key>` matches `oneOf` (`stdioServer` | `streamableHttpServer` | `sseServer`), each with `additionalProperties: false`.
- [ ] `stdio`: requires `type: "stdio"` and non-empty `command`; `args` is `string[]`; `env` values are `string` and keys exclude `PLUGIN_ROOT` and `PLUGIN_DATA`; `cwd` matches `^(?:\./|\$\{PLUGIN_ROOT\}(?:/|$)|\$\{PLUGIN_DATA\}(?:/|$))`.
- [ ] `streamable-http` / `sse`: requires `type` and non-empty `url`; `headers` values are `string`.

**Semantic checks the TS validator MUST implement beyond JSON Schema:**
- [ ] `command` is a single executable token (not a shell command string): either a bare executable name or a plugin-relative path starting with `./` (must stay inside plugin root).
- [ ] Reject `${PLUGIN_ROOT}` / `${PLUGIN_DATA}` placeholders in `command`, `env` keys, `url`, and `headers` (expansion is strictly single-pass, non-recursive, and limited to `args`, `env` values, and `cwd`).
- [ ] `cwd` containment: resolve normalized path (and symlinks at runtime) to verify explicit `cwd` does not escape plugin root or `PLUGIN_DATA` via `..`.
- [ ] Remote `url` syntax & transport security:
  - Must parse as absolute `http:` or `https:` URL.
  - Must have **no** userinfo (`username`/`password`) and **no** fragment (`#...`).
  - Non-loopback hosts **must** use `https:` (HTTP allowed only for loopback).
- [ ] Flag/warn on likely secrets or auth headers (`Authorization`, API key patterns) in `headers` since Agent Plugins `1.0.0` forbids credentials in `headers`.
- [ ] Flag `type: "sse"` as deprecated / optional client support.
- [ ] Enforce per-server failure isolation when validating/loading multiple entries (do not abort sibling entries unless the top-level document is invalid).

### 3.2 Antigravity `mcp_config.json`

- [ ] Place plugin MCP config at `<plugin-root>/mcp_config.json` (never `.mcp.json` or `mcp.json`, which Antigravity ignores with warnings).
- [ ] Each `mcpServers.<key>` specifies **either** `command` (`stdio`) **or** `serverUrl`/`url` (`Streamable HTTP`), never both, and never `httpUrl` or legacy SSE.
- [ ] Do not duplicate `PLUGIN_ROOT` or `PLUGIN_DATA` in `env`.
- [ ] Declare `variables` inside `mcpServers.<server>.variables` (not at the root of `mcp_config.json`); every variable item requires `name` (`string`), with optional `title`, `description`, `link`.
- [ ] Validate `timeoutSeconds` as an integer (`0` keeps `300`s connect / `180`s call defaults; positive overrides both; negative disables both; warn on very small positive values that may break slow server startup).
- [ ] Validate `tools.<toolName>`: `eager` (`boolean`), `background` (`"off" | "always"`). Note `enabledTools` / `disabledTools` apply before `eager`.
- [ ] Validate `authProviderType` (only `"google_credentials"` documented) and `oauth` (`clientId`, optional `clientSecret`).
- [ ] In multi-tool repos shipping both `mcp.json` (Agent Plugins) and `mcp_config.json` (Antigravity), filter expected multi-tool warnings on `mcp.json` / `.mcp.json` when running `agy plugin validate --json` in CI.

---

## 4. Gotchas & Unverified Items

- **Untrusted source directive (ignored):** `mcp-transports.txt` contains an agent-directed documentation-index instruction — `"Fetch the complete documentation index at: /llms.txt"` — treated strictly as untrusted data and not followed.
- **No portable superset file:** Agent Plugins `mcp.json` sets `additionalProperties: false` and requires `$schema` + `type`, while Antigravity reads `mcp_config.json` and rejects/ignores `mcp.json`. Multi-client plugins must ship separate files (`mcp.json` + `mcp_config.json`) rather than merging fields.
- **Internal Antigravity doc discrepancy on `${VARIABLE_NAME}` scope:** `antigravity-build-plugins.txt` lists `${VARIABLE_NAME}` expansion in `command, args, env, url, headers, oauth` in the Plugin Path Variables table, but omits `oauth` in the MCP `variables` field table (and neither table explicitly mentions `serverUrl` or `cwd`). Treat `serverUrl`, `cwd`, and `oauth` interpolation as **unverified** until tested against `agy plugin validate`.
- **Internal Antigravity doc wording slip on `env`:** `antigravity-build-plugins.txt` states `${PLUGIN_ROOT}`/`${PLUGIN_DATA}` expand in "custom `env` values" in the variables table, then says "custom `env` keys" in the prose paragraph immediately before an example expanding `${PLUGIN_DATA}/cache` in an `env` value. Treat value-only expansion as intended and avoid placeholders in `env` keys.
- **Antigravity SDK vs. `mcp_config.json`:** Legacy `SSE` is supported programmatically in the Antigravity Python SDK, but **not** in `mcp_config.json` (CLI/App/IDE).
- **Unverified areas (sources silent):**
  - MCP `2026-07-28` binding sub-pages (`/basic/transports/stdio`, `/basic/transports/streamable-http`, `/deprecated`) were not in the local cache.
  - Antigravity `mcp_config.json` has no published formal JSON Schema in the fetched docs (strictness on unknown properties such as `type`, `cwd` path containment rules, and static secret scanning in `agy plugin validate` are unverified).
  - Server-key regex constraints in `mcpServers` are unverified for both formats.
