# Plugin Manifests (`plugin.json` & `.antigravity-plugin/plugin.json`)

Both manifests use strict closed JSON Schemas (Draft `2020-12`, `additionalProperties: false`) and need matching `name` and `version` values with each other and with `.claude-plugin/marketplace.json`.

## 1. Portable Agent Plugins v1.0.0 Manifest (`<plugin-root>/plugin.json`)

- **Required fields:**
  - `$schema`: exact string `"https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"`.
  - `name`: 1–64 chars, lowercase `[a-z0-9.-]`, alphanumeric first and last character, no `--` or `..`. (Prefer lowercase kebab-case without dots so it matches Antigravity's strict naming rules too.)
- **Optional fields:** `version` (SemVer recommended), `description`, `author` (`{ name?, email?, url? }`, closed object), `homepage`, `repository`, `license` (SPDX ID recommended), `keywords` (`string[]`), `extensions` (map of reverse-domain namespace strings to objects).
- **Fixed components:** Keep `skills/` and `mcp.json` at their fixed plugin-root paths rather than inlining them in `plugin.json`, because Agent Plugins 1.0 discovers components at fixed locations only.

```json validate:plugin.json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "hello-world",
  "version": "1.0.0",
  "description": "Starter portable plugin demonstrating dual manifests and a reusable Agent Skill.",
  "author": {
    "name": "Acme Engineering",
    "url": "https://example.com"
  },
  "license": "MIT",
  "keywords": [
    "agent-plugins",
    "skills",
    "starter"
  ]
}
```

## 2. Google Antigravity v1 Manifest (`<plugin-root>/.antigravity-plugin/plugin.json`)

- **Required by schema:** `name` (`^[a-zA-Z0-9_-]+$`; lowercase kebab-case `^[a-z0-9]+(-[a-z0-9]+)*$` required for Marketplace and `--strict`).
- **Recommended / Marketplace fields:** `$schema` (`"https://antigravity.google/schemas/v1/plugin.json"`), `displayName`, `version`, `description` (120–160 chars recommended), `author` (`url` must use `https://`), `license`, `keywords`, `suggestedPrompts` (up to 3 non-empty strings), and `logo` (when submitting to Antigravity Marketplace, a bundled relative `.png`/`.svg`/`.jpg`/`.webp` icon).
- **Naming & field constraints:**
  - Choose `name` and `displayName` values without platform brand prefixes (`"Antigravity"`, `"Gemini"`, `"Claude"`, or `"Cursor"`), which Antigravity validators flag.
  - Omit deprecated legacy import fields (`source`, `sourcePath`, `source_path`).
  - Declare MCP configuration variables in `mcp_config.json` under `mcpServers.<server>.variables` rather than in `plugin.json`.

```json validate:antigravity-plugin.json
{
  "$schema": "https://antigravity.google/schemas/v1/plugin.json",
  "name": "hello-world",
  "displayName": "Hello World",
  "version": "1.0.0",
  "description": "Starter portable plugin demonstrating dual manifests and a reusable Agent Skill.",
  "author": {
    "name": "Acme Engineering",
    "url": "https://example.com"
  },
  "license": "MIT",
  "keywords": [
    "agent-plugins",
    "skills",
    "starter"
  ],
  "suggestedPrompts": [
    "Run the hello-world workflow on this repository",
    "Explain the structure of the hello-world skill"
  ]
}
```

## 3. Version Synchronization

Bump `version` consistently across all four locations whenever plugin or skill contents change:

1. `<plugin-root>/plugin.json`
2. `<plugin-root>/.antigravity-plugin/plugin.json`
3. `.claude-plugin/marketplace.json`
4. Each modified skill's `SKILL.md` `metadata.version` (when present)

Harnesses cache plugins by `version`, and the repository validator fails if the plugin manifests and marketplace catalog disagree.
