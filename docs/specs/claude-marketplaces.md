# Claude Code Plugins & Marketplaces

- **Sources:**
  - https://code.claude.com/docs/en/plugins/marketplace-reference
  - https://code.claude.com/docs/en/plugins/manifest-reference
  - https://code.claude.com/docs/en/plugins/install
  - https://code.claude.com/docs/en/plugins/host-marketplace
  - https://code.claude.com/docs/en/plugins/create
  - https://code.claude.com/docs/en/plugins/loading
  - https://code.claude.com/docs/en/plugins/troubleshooting
  - https://code.claude.com/docs/en/memory
- **Retrieved:** 2026-11-24
- **Doc version:** Unversioned live docs (notes features through Claude Code v2.1.328)

## Review Claims (5)

1. A Claude Code marketplace catalog lives at `.claude-plugin/marketplace.json` relative to the marketplace root, with required top-level fields `name`, `owner` (`name` required), and `plugins` (each entry requiring `name` and `source`) (`marketplace-reference.md`).
2. Claude Code does NOT document reading a portable root `plugin.json`; its native manifest path is optional `.claude-plugin/plugin.json`, and when absent Claude Code loads default root components (such as `skills/<name>/SKILL.md`) using the marketplace entry or `--plugin-dir` directory name (`manifest-reference.md`, `marketplace-reference.md`).
3. Relative plugin `source` paths in `marketplace.json` resolve from the marketplace root (not `.claude-plugin/`), MUST start with `./` (unless using bare names under `metadata.pluginRoot`, or `"."`), MUST NOT contain `..`, and MUST use forward slashes (`marketplace-reference.md`).
4. Adding a local marketplace and installing a plugin use `claude plugin marketplace add ./<path>` (or `/plugin marketplace add ./<path>`) and `claude plugin install <plugin>@<marketplace>` (default user scope; `--scope project` or `--scope local` available; `--plugin-dir <plugin-path>` loads a single plugin for one session without installing) (`install.md`, `create.md`).
5. Claude Code confirms `@AGENTS.md` import syntax in `CLAUDE.md` (loaded without duplication even on v2.1.277+ which also reads `AGENTS.md` natively when no `CLAUDE.md` exists) (`memory.md`).

## Marketplace Catalog (`.claude-plugin/marketplace.json`)

- [ ] Fixed path: `<marketplace-root>/.claude-plugin/marketplace.json`. Relative plugin `source` paths resolve from `<marketplace-root>`.
- [ ] Required top-level fields:
  - `name` (string): letters, digits, `.`, `_`, `-`; MUST start with letter or digit; MUST NOT contain spaces, path separators, `..`, control/bidi chars, non-ASCII, or reserved names (`claude-code-marketplace`, `claude-plugins-official`, `anthropic-marketplace`, `agent-skills`, `inline`, `builtin`, `skills-dir`, `synced`, `claude-plugin-test`, `claudeai-*`, JS `Object.prototype` names like `constructor`/`toString`).
  - `owner` (object): `name` (required, non-empty string), optional `email`, `url`.
  - `plugins` (array): plugin entry objects (validated independently).
- [ ] Optional top-level fields: `$schema`, `description` (`claude plugin validate` warns if missing), `version`, `metadata` (`description`, `version`, `pluginRoot`), `forceRemoveDeletedPlugins`, `allowCrossMarketplaceDependenciesOn`, `renames`.
- [ ] Unknown top-level or entry keys are ignored at runtime and warned by `claude plugin validate`.

## Plugin Entries & Sources

- [ ] Required entry fields:
  - `name` (string): letters, digits, `.`, `_`, `-`, starting with letter/digit; no spaces, `@`, `:`, path separators, control/bidi chars; MUST NOT impersonate Anthropic (`claude-*`, `anthropic-*`, `anthropics-*`, `cc-plugin-*`, `claude`, `anthropic`, `claude-code`, `claude-mods`, `official` beside `claude`/`anthropic`).
  - `source` (string or object):
    - Relative path string: MUST start with `./` (or `"."`, or bare name when `metadata.pluginRoot` is set), MUST NOT contain `..` or backslashes after `./`, MUST resolve inside marketplace root. Valid only for `github`, `git`, `file`, `directory` marketplace sources (NOT `url` or `settings`).
    - Object sources: `github` (`repo`, `ref?`, `sha?`), `url` (`url`, `ref?`, `sha?`), `git-subdir` (`url`, `path`, `ref?`, `sha?`), `npm` (`package`, `version?`, `registry?`), `archive` (`url` HTTPS non-loopback, `sha256?`), `command` (`command`, `timeout?`, `mode?`).
- [ ] Optional entry fields: `description`, `version`, `displayName`, `category`, `tags`, `strict` (boolean, default `true`), `defaultEnabled`, `dependencies`, `engines` (omit for Claude Code <=2.1.75 compat), `relevance`, `metadata`, `headers`, `headersHelper`, plus manifest fields (except directory-listing fields `icon`, `documentationUrl`, `supportUrl`, `privacyPolicyUrl`, `termsOfServiceUrl`).
- [ ] Strict mode & manifest interaction:
  - No `.claude-plugin/plugin.json`: the marketplace entry IS the manifest regardless of `strict`.
  - `.claude-plugin/plugin.json` present + `strict: true` (default): manifest is authoritative; entry component fields append (except `hooks` which replace per event).
  - `.claude-plugin/plugin.json` present + `strict: false`: any entry component field causes a conflict error.
  - Precedence: entry `displayName`/`description`/`author`/`defaultEnabled` override manifest; manifest `version` overrides entry `version` (`claude plugin validate` warns if both set).

## Plugin Manifest (`.claude-plugin/plugin.json`) & Standard Layout

- [ ] Manifest path: `<plugin-root>/.claude-plugin/plugin.json` (optional). Every other component directory MUST sit at `<plugin-root>`, NOT inside `.claude-plugin/`.
- [ ] Default component locations: `skills/` (`<name>/SKILL.md`), `commands/`, `agents/`, `hooks/hooks.json`, `.mcp.json` (note leading dot!), `.lsp.json`, `output-styles/`, `workflows/`, `themes/`, `monitors/monitors.json`, `bin/`.
- [ ] `plugin.json` fields: `name` (required if file exists), `$schema` (ignored at load time), `displayName`, `version`, `description`, `author` (`name` required if object present), `homepage` (must parse as URL), `repository`, `license`, `keywords`, `metadata`, `defaultEnabled`, `dependencies`, `userConfig`, `channels`, component path/inline fields (`skills`, `commands`, `agents`, `hooks`, `mcpServers`, `lspServers`, etc.).
- [ ] Component paths in manifest MUST start with `./` (except `skills` also accepts `"."`, `mcpServers` accepts `https://` bundle URL) and MUST resolve inside the plugin root and exist.
- [ ] Variables: `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}`, `${CLAUDE_PROJECT_DIR}`, `${user_config.KEY}`.

## Install, Validation, Versioning & `CLAUDE.md`

- [ ] Validate: `claude plugin validate <path> [--strict]` (accepts plugin dir, marketplace root, or `marketplace.json`).
- [ ] Add marketplace: `claude plugin marketplace add ./<dir>` (or `owner/repo[#ref]`, git URL, or `https://.../marketplace.json`). Leading `./` or `../` required for relative paths so they aren't parsed as GitHub `owner/repo`.
- [ ] Install plugin: `claude plugin install <plugin>@<marketplace> [--scope user|project|local]`, or one-step `claude plugin install <plugin> --marketplace <source>`. List: `claude plugin list`. Session-only test (no install): `claude --plugin-dir ./plugins/<plugin>`.
- [ ] Versioning: resolution order is (1) manifest `version`, (2) marketplace entry `version`, (3) git SHA / archive SHA-256 / `unknown`. Authors MUST bump `version` when contents change because `claude plugin update` skips copies with matching version (except local-path marketplaces loaded in place).
- [ ] `CLAUDE.md` & `AGENTS.md`: Claude Code v2.1.277+ reads root `AGENTS.md` directly if no `CLAUDE.md` exists; a root `CLAUDE.md` containing `@AGENTS.md` is officially confirmed, never duplicates `AGENTS.md` on v2.1.277+, and ensures older versions (< v2.1.277) also load `AGENTS.md`. A `CLAUDE.md` inside a *plugin* root is NOT loaded and triggers a validation warning.

## Gotchas

- **Root `plugin.json` & `mcp.json` mismatch:** Claude Code's native manifest is `.claude-plugin/plugin.json` (optional) and its default MCP file is `.mcp.json` (not `mcp.json`). For portable skills-only plugins listed in `.claude-plugin/marketplace.json`, this repository omits `.claude-plugin/plugin.json` so Claude Code loads root `skills/<name>/SKILL.md` directly via the marketplace entry without duplicate-`version` warnings; add `.claude-plugin/plugin.json` only when a plugin needs Claude-only features (`userConfig`, `channels`, or custom component paths).
- **Duplicate `version` warning:** Setting `version` in both `.claude-plugin/plugin.json` and the `marketplace.json` entry triggers a `claude plugin validate` warning (manifest wins).
- **Prompt injection check:** No agent-directed instructions found in the fetched Claude Code docs.
