# Agent Plugins Specification (v1.0.0)

- **Sources:**
  - https://agent-plugins.org/specification (cloned at `.cache/agent-plugins-spec/spec/1.0.0.md`)
  - https://agent-plugins.org/schemas (`schemas/agent-plugins/1.0.0/plugin.schema.json`, `schemas/agent-plugins/1.0.0/mcp.schema.json`)
  - https://agent-plugins.org/plugin-authors/build-an-agent-plugin
  - https://agent-plugins.org/plugin-authors/manifest
  - https://agent-plugins.org/plugin-authors/skills
  - https://agent-plugins.org/plugin-authors/mcp-servers
  - https://agent-plugins.org/plugin-authors/client-extensions
- **Retrieved:** 2026-11-24
- **Spec version:** `1.0.0` (Published; `1.1.0` schema URLs on `agent-plugins.org` returned HTTP 404 on retrieval date)
- **Pinned schemas (unmodified):**
  - `schemas/agent-plugins/1.0.0/plugin.schema.json` — JSON Schema Draft `2020-12` (`https://json-schema.org/draft/2020-12/schema`)
  - `schemas/agent-plugins/1.0.0/mcp.schema.json` — JSON Schema Draft `2020-12` (`https://json-schema.org/draft/2020-12/schema`)

## Review Claims (5)

1. A plugin MUST include a manifest at `plugin.json` in the plugin root, with required `$schema` equal to `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json` and `name` matching 1–64 chars `[a-z0-9.-]`, alphanumeric start/end, and no `--` or `..` (§4.1, §5.1–§5.5).
2. `plugin.json` is a closed schema (`$schema`, `name`, `version`, `description`, `author`, `homepage`, `repository`, `license`, `keywords`, `extensions`); clients MUST report and ignore unknown top-level fields and non-object `extensions`, while any other schema violation MUST cause plugin rejection (§5.2, §8.1).
3. Agent Plugins v1 defines exactly two fixed component locations: `skills/` (immediate child directories containing regular file `SKILL.md`, no recursive descent) and `mcp.json` at the plugin root (MUST NOT be declared inline in `plugin.json`) (§6.1, §7.1, §7.2.1).
4. In `mcp.json`, `$schema` MUST be `https://agent-plugins.org/schemas/1.0.0/mcp.schema.json` and its declared version MUST match `plugin.json`; `stdio` `command` MUST be a single executable token (bare name or `./` plugin-relative, no placeholder expansion), `env` MUST NOT contain `PLUGIN_ROOT` or `PLUGIN_DATA`, and optional `cwd` (defaulting to plugin root) MUST be `./...`, exact `${PLUGIN_ROOT}` or `${PLUGIN_ROOT}/...`, or exact `${PLUGIN_DATA}` or `${PLUGIN_DATA}/...` and stay contained (§7.2.1, §9.2, §10.1).
5. All package files and plugin-relative paths (`./`) MUST resolve within the filesystem-resolved plugin root; the normative specification text is authoritative where it conflicts with the machine-readable JSON Schemas (§4.1, §5.2, §7.2.1).

## Package Model & Containment (§4)

- [ ] A plugin MUST include a manifest at `plugin.json` in the plugin root.
- [ ] Every file or directory discovered, read, or executed from the package MUST resolve within the filesystem-resolved plugin root (symlinks/junctions escaping the root MUST be rejected).
- [ ] Any field defined as a plugin-relative path MUST begin with `./`, resolve against the plugin root, and stay within the filesystem-resolved plugin root.
- [ ] Non-path strings (`args`, `env` values) are opaque strings and MUST NOT be rejected as package paths.
- [ ] Narrowest failure boundary applies: `plugin.json` escape rejects the plugin; fixed component location escape invalidates that component type; `SKILL.md` escape skips that skill; MCP `command`/`cwd` escape invalidates that server entry.

## Manifest (`plugin.json`) (§5, §8)

- [ ] MUST be a JSON object at `<plugin-root>/plugin.json`; no other core file replaces or overrides it.
- [ ] Required fields:
  - `$schema`: string, MUST be `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json` for v1.0.0.
  - `name`: string, 1–64 chars, only `a-z`, `0-9`, `-`, `.`, alphanumeric first and last char, no `--` or `..`.
- [ ] Optional metadata fields (validated strictly by JSON type only; clients MUST NOT reject non-SemVer `version`, non-URL `homepage`/`repository`/`author.url`, non-email `author.email`, or non-SPDX `license`):
  - `version` (string; SemVer RECOMMENDED; used for update/cache checks)
  - `description` (string)
  - `author` (object with closed keys: optional `name`, `email`, `url` strings; any other key or non-string value is fatal)
  - `homepage` (string), `repository` (string), `license` (string; SPDX RECOMMENDED), `keywords` (`string[]`)
- [ ] `extensions` (optional object): keyed by reverse-domain namespace (e.g., `com.example.client`), values MUST be objects. Clients MUST ignore unimplemented namespaces without validating their contents. File-based extensions live in a matching top-level directory (`<namespace>/`).
- [ ] Unknown top-level fields violate the schema; clients MUST report and ignore them (and non-object `extensions`) rather than rejecting the plugin. Validators SHOULD flag unknown top-level fields as non-conformant.
- [ ] Clients MUST NOT fetch `$schema` URLs over the network at load time.

## Component Discovery & Skills (§6, §7.1)

- [ ] Fixed locations only: `skills/` and `mcp.json`. `plugin.json` cannot override them or inline components.
- [ ] Missing fixed locations MUST NOT be treated as errors. Wrong filesystem kind (e.g., `skills` is a file) invalidates only that component type.
- [ ] Skills discovery: each immediate child directory of `skills/` containing a regular file named exactly `SKILL.md` is one skill. Clients MUST NOT recursively search deeper descendants.
- [ ] Each discovered skill MUST conform to the Agent Skills specification; invalid skills are skipped without failing other skills or MCP servers.

## MCP Configuration (`mcp.json`) (§7.2, §9, §10.1)

- [ ] Located strictly at `<plugin-root>/mcp.json` (never inline in `plugin.json`).
- [ ] Closed top-level object with required `$schema` (`https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`) and `mcpServers` (object of server entries; `{}` is valid).
- [ ] The Agent Plugins version in `mcp.json`'s `$schema` MUST match `plugin.json`'s `$schema`; mismatch disables MCP for the plugin.
- [ ] Validate each server entry independently against `#/$defs/server` (closed union by `type`):
  - `stdio`: required `type: "stdio"`, `command` (single executable token — bare name or `./` plugin-relative path, NO whitespace/shell command string, NO placeholder expansion); optional `args` (`string[]`), `env` (object of strings), `cwd` (string).
    - `env` MUST NOT contain reserved keys `PLUGIN_ROOT` or `PLUGIN_DATA`.
    - `cwd` defaults to plugin root; if present, MUST start with `./`, be `${PLUGIN_ROOT}` or `${PLUGIN_ROOT}/...`, or be `${PLUGIN_DATA}` or `${PLUGIN_DATA}/...`, and MUST stay contained after placeholder expansion.
    - Placeholder expansion (`${PLUGIN_ROOT}`, `${PLUGIN_DATA}` ONLY, single-pass non-recursive) applies to `args` elements, `env` values, and `cwd`; MUST NOT apply to `env` keys or `command`.
  - `streamable-http` / `sse`: required `type` (`"streamable-http"` or `"sse"`), `url` (absolute `http`/`https` URL, MUST NOT contain userinfo or fragment; non-loopback MUST use `https`, `http` MAY be used only for `localhost` or loopback IP); optional `headers` (object of valid HTTP header strings; duplicate case-insensitive header names are invalid; NO placeholder expansion in `url` or `headers`).
- [ ] Secrets: `env` and `headers` are visible package data; plugins MUST NOT embed credentials or secrets in them. No OAuth or credential-reference fields exist in v1.0.0.
- [ ] Conformant MCP clients MUST support `stdio` or `streamable-http` (SHOULD support both); `sse` is OPTIONAL.

## Gotchas

- **Spec wins over schema:** JSON Schema cannot enforce symlink containment, single-token bare `command` (no spaces), remote URL loopback/HTTPS/no-userinfo/no-fragment rules, or case-insensitive duplicate HTTP headers — validators MUST enforce these programmatically beyond JSON Schema.
- **No marketplace catalog in spec:** Agent Plugins v1.0.0 defines no marketplace catalog format, installation UX, or distribution protocol.
- **1.1.0 status:** `.cache/agent-plugins-spec/` contains `spec/1.1.0.md` and `schemas/1.1.0/` (adding hooks), but live `https://agent-plugins.org/schemas/1.1.0/*.schema.json` returned HTTP 404 on 2026-11-24; pin `1.0.0`.
- **Prompt injection check:** No agent-directed instructions found in the fetched Agent Plugins sources.
