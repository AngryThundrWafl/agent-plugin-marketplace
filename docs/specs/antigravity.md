# Google Antigravity Plugin & Customization Specification

- **Retrieved**: `2026-11-24`
- **Schema**: `v1` — `$id`: `https://antigravity.google/schemas/v1/plugin.json` | Draft: `https://json-schema.org/draft/2020-12/schema` (local copy: `schemas/antigravity/v1/plugin.json`)
- **Sources**:
  - `https://antigravity.google/docs/plugins`
  - `https://antigravity.google/docs/build-plugins`
  - `https://antigravity.google/docs/marketplace`
  - `https://antigravity.google/docs/customization-discovery`
  - `https://antigravity.google/docs/skills`
  - `https://antigravity.google/docs/mcp`
  - `https://antigravity.google/schemas/v1/plugin.json`
  - Local CLI verification: `agy plugin --help`, `agy plugin validate --help`

## Review Claims (5)

1. **Manifest paths & precedence**: A plugin MUST place its manifest at `<plugin-root>/plugin.json` or `<plugin-root>/.antigravity-plugin/plugin.json` (`.antigravity-plugin/plugin.json` takes precedence over root `plugin.json` at runtime and is promoted to root `plugin.json` in Marketplace bundles; `customization-discovery` also lists `.gemini-plugin/plugin.json`, whose precedence is unverified), and MUST keep all component paths (`skills/`, `agents/`, `rules/`, `scripts/`, `mcp_config.json`, `hooks.json`) at `<plugin-root>`.
2. **Multi-tool shadow/ignore behavior**: Presence of `.mcp.json`, `mcp.json`, root `AGENTS.md`, root `GEMINI.md`, `hooks/hooks.json`, `commands/`, or a shadowed root `plugin.json` (when `.antigravity-plugin/plugin.json` exists) is safely ignored/shadowed at runtime, install, and Marketplace packaging; `agy plugin validate` MUST report these as `warning` (never `error` and never silent), failing non-zero only under `--strict`.
3. **Manifest schema (`v1`, Draft 2020-12) contract**: `plugin.json` sets `additionalProperties: false` and `required: ["name"]`; keys are case-sensitive, a recognized key with the wrong type MUST stop plugin loading, unrecognized keys are ignored at runtime and flagged by `agy plugin validate`, deprecated keys (`source`, `sourcePath`, `source_path`) MUST NOT be authored; Marketplace submission (not `--strict` alone) requires `displayName`, `description`, `version`, `logo`, and `author`, while `name`/`displayName` MUST NOT lead with `"Antigravity"`, `"Gemini"`, `"Claude"`, or `"Cursor"`.
4. **Component & discovery rules**: Plugins configure MCP servers in `mcp_config.json` (Streamable HTTP `serverUrl`/`url` or `stdio` `command`; no `httpUrl`/SSE per `antigravity.google/docs/mcp`; `variables` inside `mcpServers.<server>.variables`), hooks in `hooks.json` (named groups, flat arrays for `SessionStart`/`PreInvocation`/`PostInvocation`/`Stop`, relative script paths), rules in `rules/` (`globs` as a comma-separated string, not a YAML array), and skills in default `skills/<name>/SKILL.md` (matching parent folder) plus optional extra relative directories declared via `plugin.json`'s `skills` field; workspace discovery walks upward from workspace to repo root (never downward) scanning 1 level deep and loads `AGENTS.md`/`GEMINI.md` at each level plus `~/.gemini/`.
5. **Marketplace & CLI contract**: Named marketplace installs support ONLY `antigravity-plugins-official` (third-party distribution uses GitHub repo URLs or local directories; repo-hosted `marketplace.json` schema/install support is unverified, though local `agy plugin validate --help` lists `marketplace.json` and optional `[target]`), and `agy plugin validate [target] [--strict] [--json]` exits non-zero on `error` (or `warning` with `--strict`), outputting JSON with `.manifest` and `.findings[].{severity,file}`.

---

## 1. Manifest Search Order & Multi-Tool File Behavior

- [ ] **Manifest locations**: Loader checks `<plugin-root>/.antigravity-plugin/plugin.json` and `<plugin-root>/plugin.json`. `.antigravity-plugin/plugin.json` MUST win over root `plugin.json` at runtime and is promoted to root `plugin.json` during Marketplace packaging. `customization-discovery` also names `<plugin-root>/.gemini-plugin/plugin.json` (exact precedence vs `.antigravity-plugin/` and root: **unverified**).
- [ ] **Component root invariant**: Even when using `.antigravity-plugin/plugin.json`, `skills/`, `agents/`, `rules/`, `scripts/`, `mcp_config.json`, and `hooks.json` MUST remain at `<plugin-root>`. `README.md` MAY live at `<plugin-root>/README.md` or `<plugin-root>/.antigravity-plugin/README.md`.
- [ ] **Multi-tool file matrix** (warning in `agy plugin validate`, hard failure ONLY with `--strict`, never blocks `agy plugin install` or Marketplace packaging):
  - `.mcp.json` / `mcp.json`: Ignored at runtime (MCP loads only from `mcp_config.json`); `.mcp.json` is excluded from Marketplace bundles. Validator emits `warning`.
  - Root `plugin.json` alongside `.antigravity-plugin/plugin.json`: Safely shadowed at runtime; validator emits `warning` on `file: "plugin.json"` while `.manifest != "plugin.json"`.
  - Root `AGENTS.md`: Safely ignored in plugins (plugin rules load only from `rules/`), preventing contributor docs from injecting into user sessions. Validator emits `warning`.
  - Root `GEMINI.md`, `hooks/hooks.json`, `commands/`: Ignored when native equivalents (`rules/`, `hooks.json`, `skills/`) are used; validator emits `warning`.

---

## 2. `plugin.json` Schema (`v1`, JSON Schema Draft 2020-12)

Source of truth: `schemas/antigravity/v1/plugin.json` (`additionalProperties: false`, `required: ["name"]`).

- [ ] **Type & unknown-key handling**: Keys are case-sensitive. A recognized key with an invalid type MUST fail loading (`error`). Unknown keys are ignored at runtime and MUST be reported by the validator (`warning` or schema violation).
- [ ] **`$schema`** (`string`, optional): SHOULD be `"https://antigravity.google/schemas/v1/plugin.json"`.
- [ ] **`name`** (`string`, **required** by schema, `agy plugin install`, `--strict`, and Marketplace; local folder load without `name` falls back to folder name):
  - Schema regex: `^[a-zA-Z0-9_-]+$`.
  - Marketplace / `--strict` rule: MUST be lowercase kebab-case `^[a-z0-9]+(-[a-z0-9]+)*$` (non-kebab-case emits `warning`).
  - Namespaces bundled MCP servers as `<name>_<server>` and plugin skills as `<name>:<skill>`.
  - MUST NOT lead with `"Antigravity"`, `"Gemini"`, `"Claude"`, or `"Cursor"`.
- [ ] **`displayName`** (`string`, required for Marketplace, optional locally) & **`display_name`** (`string`, schema alias; `displayName` wins if both set): SHOULD omit `"Plugin"`/`"MCP"` suffixes and MUST NOT prefix with `"Antigravity"`, `"Gemini"`, `"Claude"`, or `"Cursor"`.
- [ ] **`description`** (`string`, required for Marketplace, optional locally): 1–2 sentences (120–160 chars recommended).
- [ ] **`version`** (`string`, required for Marketplace; missing emits `warning`): Schema accepts any string; `MAJOR.MINOR.PATCH` SemVer recommended.
- [ ] **`disabled`** (`boolean`, optional, default `false`): Initial enabled state; user enable/disable choice takes precedence.
- [ ] **`logo`** (`string`, required for Marketplace; invalid path emits `warning`, missing emits `note`):
  - Schema `anyOf`:
    1. Relative path (no URI scheme, no leading `/`, starts with `\S`) ending in `.png|.svg|.jpg|.jpeg|.webp` (case-insensitive): `^(?![A-Za-z][A-Za-z0-9+.-]*:)(?!\/)\S.*\.([Pp][Nn][Gg]|[Ss][Vv][Gg]|[Jj][Pp][Ee]?[Gg]|[Ww][Ee][Bb][Pp])$`
    2. HTTPS URL on `google.com`, `gstatic.com`, or `googleusercontent.com`: `^https://([A-Za-z0-9-]+\.)*(google\.com|gstatic\.com|googleusercontent\.com)(:[0-9]+)?([/?#].*)?$`
  - Other values are ignored. Marketplace requires a bundled local 1:1 square icon (`>= 128x128px`, ~10% transparent padding, Light & Dark legible).
- [ ] **`suggestedPrompts`** (`string[]`, optional/recommended, `maxItems: 3`, each item matches `\S`) & **`suggested_prompts`** (schema alias; used only when `suggestedPrompts` is empty).
- [ ] **`skills`** (`string | string[]`, optional; non-whitespace `\S`): Extra skill directories relative to `<plugin-root>`, loaded **in addition to** default `skills/`.
- [ ] **`author`** (`string | { name?: string, email?: string, url?: string }` with `additionalProperties: false`, required for Marketplace): Docs require `url` to use `https://`.
- [ ] **`homepage`** (`string`, recommended, `https://`), **`repository`** (`string`, optional, `https://`), **`license`** (`string`, recommended, SPDX ID), **`keywords`** (`string[]`, recommended, lowercase).
- [ ] **`extensions`** (`Record<string, object>`, optional): Client-specific settings keyed by namespace.
- [ ] **Deprecated keys** (`source`, `sourcePath`, `source_path` — all `string`, `deprecated: true`): Set by legacy imports; authors MUST NOT set them.
- [ ] **Configuration variables**: NOT declared in `plugin.json`; declared in `mcp_config.json` under `mcpServers.<server>.variables` (see Section 3).

---

## 3. Plugin Component Locations & Validation Rules

### Skills (`skills/<skill-name>/SKILL.md`)
- [ ] Directory layout: `skills/<skill-name>/SKILL.md` plus optional `scripts/` (executable `0755` in Marketplace bundles), `references/`, `assets/` (`skills` doc also mentions `examples/`, `resources/`).
- [ ] YAML frontmatter:
  - `name`: lowercase `kebab-case`, `1–64` chars, MUST match parent directory name (`skills/<name>/SKILL.md`). Exposed as `/<name>`. Required in plugin skills (standalone `skills` doc marks `name` optional, defaulting to folder name).
  - `description`: **required**, `1–1,024` chars (what it does + when to trigger).
  - Optional: `disable-model-invocation` (`boolean`, default `false`), `license`, `compatibility`.
- [ ] Paths inside `SKILL.md` MUST be relative to the skill directory (e.g., `scripts/check.mjs`, `references/checklist.md`).

### MCP Servers (`<plugin-root>/mcp_config.json`)
- [ ] Root object contains `mcpServers: Record<string, ServerConfig>`. Each key is namespaced at runtime as `<plugin-name>_<server-key>`.
- [ ] Transport: Each server MUST define either `command` (local `stdio`) or `serverUrl` / `url` (remote **Streamable HTTP**). Legacy HTTP+SSE and `httpUrl` are NOT supported (in App/CLI/IDE; Python SDK supports `stdio`/`SSE`/`HTTP`).
- [ ] Optional properties: `args` (`string[]`, `[]`), `env` (`object`, `{}`), `cwd` (`string`), `headers` (`object`, `{}`), `authProviderType` (`"google_credentials"`), `oauth` (`{ clientId, clientSecret? }`; redirect URI `https://antigravity.google/oauth-callback`; CIMD `https://antigravity.google/oauth/client-metadata.json`), `disabled` (`boolean`, `false`), `enabledTools` (`string[]`), `disabledTools` (`string[]`, `[]`), `tools.<toolName>` (`{ eager?: boolean, background?: "off" | "always" }`), `timeoutSeconds` (`integer`, defaults: `180` tool call / `300` connect; `>0` sets both, `<0` disables both, `0` keeps defaults).
- [ ] **Variables & path expansion**:
  - `variables` MUST be declared inside `mcpServers.<server>.variables` (NEVER at root of `mcp_config.json`), as objects `{ name (required), title?, description?, link? }` (`title` defaults to `name`; variable `default` value field is **unverified**).
  - `${VARIABLE_NAME}` expands in `command`, `args`, `env`, `url`, `headers`, and `oauth`.
  - `${PLUGIN_ROOT}` (read-only `~/.gemini/config/plugins/<plugin-name>`) and `${PLUGIN_DATA}` (persistent writable dir) expand in `args`, `cwd`, and custom `env`, and are auto-exported as `PLUGIN_ROOT`/`PLUGIN_DATA` env vars (MUST NOT be duplicated in `"env"`).
  - Plugins declaring `variables` install **disabled** until configured interactively (emits `note`); OAuth-only plugins install **enabled**.
- [ ] Tools are lazy-loaded by default (schemas cached to `<app-data-dir>/mcp/<serverName>/<toolName>.json`, invoked via `call_mcp_tool`); `"eager": true` registers natively as `mcp_<serverName>_<toolName>` (evaluated after `enabledTools`/`disabledTools`).

### Custom Agents / Subagents (`agents/<agent-name>.md` or `agents/<agent-name>/agent.md`)
- [ ] Required frontmatter: `name` (`kebab-case`), `description`.
- [ ] Optional frontmatter & defaults: `mainAgent` (`true`), `subagent` (`true`), `model` (`"inherit"` | `"flash_lite"` | `"flash"` | `"pro"`), `tools` (all; `send_message` always included), `commandExecutionPolicy` (`"sandbox"` | `"off"` | `"auto"` | `"eager"`), `skills` (`[]`), `inheritMcp` (`true`), `inheritCustomizations` (`true`).

### Rules (`rules/AGENTS.md`, `rules/GEMINI.md`, `rules/<rule-name>.md`)
- [ ] `rules/AGENTS.md` and `rules/GEMINI.md`: loaded automatically as `always_on` with no frontmatter required.
- [ ] `rules/<rule-name>.md`: MUST include YAML frontmatter with valid `trigger`:
  - `always_on` (no required fields)
  - `model_decision` (requires `description`)
  - `glob` (requires `globs` as a **comma-separated string**, e.g. `"**/*.tf, **/*.yaml"` — MUST NOT be a YAML array)
  - `manual` (no required fields; invoked via `@<rule-name>`)

### Lifecycle Hooks (`<plugin-root>/hooks.json`)
- [ ] Top-level keys MUST be named hook groups (e.g. `{ "policy-guard": { "enabled": true, ... } }`).
- [ ] `PreToolUse` and `PostToolUse` MUST wrap handlers in `{ "matcher": "<tool-name-regex>", "hooks": [...] }`.
- [ ] `SessionStart`, `PreInvocation`, `PostInvocation`, and `Stop` MUST use a **flat array** of handler objects (no `matcher` wrapper).
- [ ] Command hooks run with `cwd = <plugin-root>`, MUST use relative paths (e.g. `node ./scripts/policy.mjs`, NOT `${PLUGIN_ROOT}`), read JSON on `stdin`, and MUST exit `0` writing JSON to `stdout`. Non-zero exits are logged and ignored (fail open).
- [ ] Executable helper scripts SHOULD live under `scripts/` (or `skills/<name>/scripts/`) to retain `0755` permissions in Marketplace bundles.

---

## 4. Workspace & Personal Customization Discovery (`AGENTS.md` / `GEMINI.md`)

- [ ] **Workspace scope**: `.agents/` (legacy aliases `.agent/`, `_agents/`, `_agent/` also recognized; use `.agents/`) plus `AGENTS.md` and `GEMINI.md`.
- [ ] **Parent walk boundaries**: Antigravity checks the workspace folder (CLI: cwd + `--add-dir`/`/add-dir`; App: each project folder) and walks **upward** to the repository root (folder containing `.git`), loading `AGENTS.md`, `GEMINI.md`, and `.agents/` at each level. It MUST stop at the repo root (or workspace folder if not in a repo) and NEVER descends into subfolders below the workspace folder.
- [ ] **Personal (global) scope**: `~/.gemini/config/` (same layout: `rules/*.md`, `AGENTS.md`, `GEMINI.md`, `skills/<name>/SKILL.md`, `agents/<name>.md` or `agents/<name>/agent.md`, `plugins/<plugin>/`, `hooks.json`, `mcp_config.json`) plus `~/.gemini/AGENTS.md` and `~/.gemini/GEMINI.md`.
- [ ] **Manual plugin folders**: Workspace `.agents/plugins/<plugin>/`; Global `~/.gemini/config/plugins/<plugin>/` (also CLI staging path).
- [ ] **Scan depth**: Strictly **1 level deep** inside `skills/`, `rules/`, and `agents/` (`agents/<name>.md` or `agents/<name>/agent.md`). Deeper items are skipped unless listed in additive discovery manifests (`skills.json`, `rules.json`, `agents.json`, `plugins.json` with `entries`, `inherits`, `exclude`; no wildcards; no `~` expansion).
- [ ] **Surface-specific skill folders**: CLI also loads `~/.gemini/antigravity-cli/skills/` and `~/.gemini/skills/` (ignored by App); IDE also supports legacy `~/.gemini/antigravity/skills/`.
- [ ] **Precedence (skills & agents)**: CLI-only `~/.gemini/antigravity-cli/skills/` & `~/.gemini/skills/` (cannot be excluded by manifests) > repo `.gemini/config.json` `personal_customization_dir` (`people/{user}`) > workspace `.agents/` & manifests > `~/.gemini/config/` & personal manifests > built-in. **Rules never shadow each other** (all load). Plugin skills are namespaced `<plugin>:<skill>`.

---

## 5. Marketplace & CLI Reference

- [ ] **Marketplace catalog**: Official docs support ONLY `antigravity-plugins-official` as `<marketplace-name>` (requires `agy` sign-in; submissions via partner intake form). Self-hosted distribution uses GitHub repo URLs or local directories. Whether a repo-hosted `marketplace.json` catalog can be installed or its schema is **unverified** in docs (note: `agy plugin validate --help` accepts `marketplace.json`).
- [ ] **`agy plugin install <target>`**: Accepts `<plugin>@antigravity-plugins-official`, bare `<plugin>` (defaults to `@antigravity-plugins-official`), `https://github.com/<owner>/<repo>`, or `</local/path>`. Stages into `~/.gemini/config/plugins/<name>/`.
- [ ] **`agy plugin list [--json]`**: Human-readable summary or JSON array of `{ name, enabled, version, source, path, skills?, agents?, rules?, mcpServers?, hooks? }` (empty component arrays omitted in documented example).
- [ ] **`agy plugin validate [target] [--strict] [--json]`**: Accepts plugin dir, `plugin.json`, `.zip`, GitHub URL, or `marketplace.json`. Severities: `error` (always exits non-zero), `warning` (exits `0`, or non-zero with `--strict`), `note` (never fails). `--json` outputs an object containing `.manifest` (`string`) and `.findings` (`Array<{ severity: "error"|"warning"|"note", file: string, ... }>`; additional finding fields are **unverified**).
- [ ] **Other CLI commands**: `agy plugin enable|disable|uninstall <name>`, `agy plugin import [gemini|claude|<dir>]`, `agy agents`, `agy --agent <name>`, and TUI `/plugin`, `/skills [reload]`, `/agents`, `/hooks`, `/mcp`.

---

## 6. Gotchas & Source Discrepancies

- **Schema vs docs drift (`name` & `logo`)**: Official `schemas/antigravity/v1/plugin.json` permits `^[a-zA-Z0-9_-]+$` for `name` and Google-hosted `https://` URLs for `logo`, whereas `build-plugins` docs show stricter kebab-case `^[a-z0-9]+(-[a-z0-9]+)*$` and local-only `logo` paths. Validators SHOULD enforce the JSON Schema as baseline errors and kebab-case / local logo as strict/Marketplace warnings.
- **Undocumented schema keys**: `schemas/antigravity/v1/plugin.json` includes snake_case aliases (`display_name`, `suggested_prompts`), `extensions`, and deprecated keys (`source`, `sourcePath`, `source_path`) that are omitted from the `build-plugins` inline schema or field table.
- **`SKILL.md` `name` requiredness**: `build-plugins` marks `name` required and matching the directory name; standalone `skills` docs mark `name` optional (defaulting to folder name). Require `name` for plugin validation.
- **Multi-tool `--strict` CI trap**: Running `agy plugin validate --strict` in a multi-tool repo fails on expected warnings (`.mcp.json`, `mcp.json`, `AGENTS.md`, shadowed root `plugin.json`). Use `agy plugin validate` without `--strict` or filter `--json` findings by `.file` and `.manifest`.
- **Unverified items**: Precedence of `.gemini-plugin/plugin.json`; `marketplace.json` catalog schema & install support; full JSON schema of `agy plugin validate --json` beyond `.manifest` and `.findings[].{severity,file}`; default-value field on MCP `variables`.
- **Untrusted source check**: No agent-directed or prompt-injection instructions were found in the fetched source texts.
