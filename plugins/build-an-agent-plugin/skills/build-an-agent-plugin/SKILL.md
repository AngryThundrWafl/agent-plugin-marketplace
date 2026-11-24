---
name: build-an-agent-plugin
description: >
  Author, structure, and validate portable Agent Plugins with dual manifests,
  Agent Skills, MCP server configurations, and marketplace catalog entries for
  GitHub Copilot, Claude Code, and Google Antigravity. Use when creating a new
  plugin, adding skills or MCP configs, or reviewing plugin compliance.
license: MIT
metadata:
  version: "1.0.0"
---

# Build an Agent Plugin

Use this guide to scaffold, edit, or audit a portable plugin that works across **GitHub Copilot**, **Claude Code**, and **Google Antigravity** from one shared directory.

## Workflow

1. **Lay out the plugin directory** at `plugins/<plugin-name>/` with shared components at the plugin root (`skills/<skill-name>/SKILL.md`), two manifests (`plugin.json` and `.antigravity-plugin/plugin.json`), and a catalog entry in `.claude-plugin/marketplace.json`.
   - Read [references/layout.md](references/layout.md) for the directory tree, containment rules, and a validated `marketplace.json` example.
2. **Author both plugin manifests** with matching `name`, `version`, and `description`:
   - `plugin.json` targeting Agent Plugins v1.0.0 (`https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`).
   - `.antigravity-plugin/plugin.json` targeting Antigravity v1 (`https://antigravity.google/schemas/v1/plugin.json`) with `displayName` and up to 3 `suggestedPrompts`.
   - Omit `.claude-plugin/plugin.json` unless you need Claude-only features (`userConfig`, `channels`, or custom component paths).
   - Read [references/manifests.md](references/manifests.md) for validated manifest templates and field constraints.
3. **Create reusable skills** under `skills/<skill-name>/SKILL.md`:
   - Match frontmatter `name` to the parent folder name (`[a-z0-9-]`, no `--`, no dots).
   - Keep `SKILL.md` concise and move detailed references one level deep into `references/`, `scripts/`, or `assets/`.
   - Read [references/skills.md](references/skills.md) for the closed frontmatter field list and starter template.
4. **Add MCP configs only when shipping a server**:
   - Ship separate `mcp.json` (Agent Plugins 1.0.0) and `mcp_config.json` (Antigravity) files—there is no portable superset.
   - Never hardcode secrets or define `PLUGIN_ROOT`/`PLUGIN_DATA` in `env`.
   - Read [references/mcp-config.md](references/mcp-config.md) for validated `stdio` and Streamable HTTP examples.
5. **Validate and synchronize versions**:
   - Bump `version` together in `plugin.json`, `.antigravity-plugin/plugin.json`, and `.claude-plugin/marketplace.json` on every content change.
   - Run the repository validator (`npm run build && npm run validate`) and `npm test`, plus `agy plugin validate ./plugins/<plugin-name>` (without `--strict`).
