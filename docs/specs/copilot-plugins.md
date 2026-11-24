# GitHub Copilot Plugins & Marketplaces

- **Sources:**
  - https://docs.github.com/en/copilot/concepts/agents/about-plugins (redirects to `/en/copilot/concepts/customizations/plugins`)
  - https://docs.github.com/en/copilot/reference/plugin-and-marketplace-reference
  - https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference
  - https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing
  - https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/create-and-share-plugin-marketplaces
  - Local CLI verification: `copilot plugin --help`, `copilot plugin marketplace --help`, `copilot plugin install --help`
- **Retrieved:** 2026-11-24
- **Doc version:** Unversioned live GitHub Docs

## Review Claims (5)

1. GitHub Copilot documents the portable Agent Plugins format directly at root `plugin.json`, recognizing canonical `$schema` values for Agent Plugins `1.0.0` (`https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`) and `1.1.0` (`https://agent-plugins.org/schemas/1.1.0/plugin.schema.json` in Copilot CLI) (`cli-plugin-reference`, `plugin-and-marketplace-reference`).
2. A root `plugin.json` targeting Agent Plugins takes precedence over `.plugin/plugin.json` and `.claude-plugin/plugin.json`, and Copilot CLI rejects unsupported Agent Plugins `$schema` versions rather than falling back to legacy mode (`cli-plugin-reference`).
3. Copilot reads client-specific Agent Plugins components from the `com.github.copilot/` extension directory: `agents/` (`*.agent.md`), `commands/`, `rules/`, `hooks/hooks.json`, and `lsp.json` (`cli-plugin-reference`, `about-plugins`).
4. Copilot CLI discovers `marketplace.json` in this exact search order: `marketplace.json`, `.plugin/marketplace.json`, `.github/plugin/marketplace.json`, or `.claude-plugin/marketplace.json` — confirming native support for Claude-format `.claude-plugin/marketplace.json` (`cli-plugin-reference`).
5. Copilot CLI installs via `copilot plugin marketplace add <source>` (GitHub `owner/repo`, URL, or local directory path) and `copilot plugin install <plugin>@<marketplace>` (or direct `owner/repo`, `owner/repo:path`, URL, or local path), and supports `COPILOT_HOME` to isolate configuration directory (`cli-plugin-reference`, `plugins-finding-installing`).

## Plugin Format & Manifest (`plugin.json`)

- [ ] For new plugins, GitHub docs recommend Agent Plugins 1.0 at `<plugin-root>/plugin.json` with `"$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"`.
- [ ] Copilot CLI recognizes Agent Plugins `1.0.0` and `1.1.0` canonical `$schema` URLs. Unsupported Agent Plugins schema versions MUST be rejected (no fallback to legacy format).
- [ ] Precedence: a root `plugin.json` targeting Agent Plugins takes precedence over `.plugin/plugin.json` and `.claude-plugin/plugin.json`. (Legacy plugins without an Agent Plugins `$schema` check `.plugin/plugin.json`, `plugin.json`, `.github/plugin/plugin.json`, `.claude-plugin/plugin.json` in order.)
- [ ] Agent Plugins 1.0 portable locations are fixed:
  - Skills: `skills/<name>/SKILL.md` (no root `SKILL.md` fallback in Agent Plugins mode).
  - MCP servers: root `mcp.json` with matching Agent Plugins `$schema` version; supports `stdio`, `streamable-http`, and `sse`.
  - For `stdio` MCP servers, Copilot CLI sets `PLUGIN_ROOT` and `PLUGIN_DATA` and expands `${PLUGIN_ROOT}` and `${PLUGIN_DATA}` (plus `CLAUDE_PLUGIN_DATA` / `COPILOT_PLUGIN_DATA` aliases) in `args`, `env` values, and `cwd`; remote `http`/`sse`/`streamable-http` values are literal.
- [ ] Copilot-specific extension directory `com.github.copilot/` (Agent Plugins 1.0 mode):
  - `com.github.copilot/agents/` (`*.agent.md`)
  - `com.github.copilot/commands/`
  - `com.github.copilot/rules/`
  - `com.github.copilot/hooks/hooks.json`
  - `com.github.copilot/lsp.json`

## Marketplace Catalog (`marketplace.json`)

- [ ] Discovery order in Copilot CLI: `marketplace.json` -> `.plugin/marketplace.json` -> `.github/plugin/marketplace.json` -> `.claude-plugin/marketplace.json`.
  - Note: GitHub's "Creating and sharing a plugin marketplace on GitHub" guide recommends `.github/plugin/marketplace.json`, while the Copilot CLI reference explicitly confirms `.claude-plugin/marketplace.json` is also discovered.
- [ ] Required top-level fields: `name` (kebab-case, max 64 chars; dots allowed for Agent Plugins 1.0), `owner` (`{ name, email? }`), `plugins` (array). Optional: `metadata` (`{ description?, version?, pluginRoot? }`).
- [ ] Required plugin entry fields: `name`, `source` (relative path string with or without `./`, or `{ source: "github" | "url", ... }` object). Optional: `description` (max 1024), `version`, `author`, `homepage`, `repository`, `license`, `keywords`, `category`, `tags`, `strict` (default `true`), plus component fields.
- [ ] Plugin identifier is `<plugin-name>@<marketplace-name>`, derived from `marketplace.json`'s `name` field (not the repo name).
- [ ] Repository-level defaults use `.github/copilot/settings.json` (`enabledPlugins`), overridable locally in `.github/copilot/settings.local.json`.

## CLI Commands & Scratch Testing

- [ ] Add marketplace: `copilot plugin marketplace add <owner/repo | url | /local/path>`
- [ ] Browse / list marketplaces: `copilot plugin marketplace list [--json]`, `copilot plugin marketplace browse <name> [--json]`, `copilot plugin marketplace update [name]`, `copilot plugin marketplace remove <name> [--force]`
- [ ] Install / manage plugins: `copilot plugin install <plugin>@<marketplace>` (or `./local-plugin`, `owner/repo`, `owner/repo:path`, git URL), `copilot plugin list [--json]`, `copilot plugin update <name> | --all`, `copilot plugin enable|disable|uninstall <name>`.
- [ ] Scratch config isolation: set `COPILOT_HOME=/tmp/...` (replaces deprecated `--config-dir`) and `COPILOT_CACHE_HOME=/tmp/...` so user settings under `~/.copilot/` are untouched.

## Gotchas

- **Surface differences:** GitHub docs warn that plugin formats and `marketplace.json` locations can differ across VS Code, Copilot CLI, GitHub Copilot app, and Copilot in the cloud; `.claude-plugin/marketplace.json` discovery is explicitly documented for Copilot CLI, while VS Code's exact `marketplace.json` discovery order is unverified on the fetched pages.
- **1.1.0 schema field list:** Copilot CLI docs mention recognizing `https://agent-plugins.org/schemas/1.1.0/plugin.schema.json`, while live `agent-plugins.org` returned HTTP 404 for 1.1.0 schemas on 2026-11-24; pin `1.0.0`.
- **Prompt injection check:** No agent-directed instructions found in the fetched GitHub Copilot docs.
