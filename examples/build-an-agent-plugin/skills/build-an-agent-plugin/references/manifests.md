# Plugin Manifests (`plugin.json` & `.antigravity-plugin/plugin.json`)

Both manifests use strict closed JSON Schemas (Draft `2020-12`, `additionalProperties: false`) and MUST agree on `name` and `version` with each other and with `.claude-plugin/marketplace.json`.

## 1. Portable Agent Plugins v1.0.0 Manifest (`<plugin-root>/plugin.json`)

- **Required fields:**
  - `$schema`: exact string `"https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"`.
  - `name`: 1–64 chars, lowercase `[a-z0-9.-]`, alphanumeric first and last character, no `--` or `..`. (Prefer lowercase kebab-case without dots so it matches Antigravity's strict naming rules too.)
- **Optional fields:** `version` (SemVer recommended), `description`, `author` (`{ name?, email?, url? }`, closed object), `homepage`, `repository`, `license` (SPDX ID recommended), `keywords` (`string[]`), `extensions` (map of reverse-domain namespace strings to objects).
- **Fixed components:** Do NOT inline skills or MCP servers in `plugin.json`; Agent Plugins 1.0 discovers `skills/` and `mcp.json` at fixed locations only.

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
- **Avoid these pitfalls:**
  - Do NOT prefix `name` or `displayName` with `"Antigravity"`, `"Gemini"`, `"Claude"`, or `"Cursor"`.
  - Do NOT set deprecated import fields (`source`, `sourcePath`, `source_path`).
  - Do NOT declare MCP configuration variables in `plugin.json`—declare them in `mcp_config.json` under `mcpServers.<server>.variables`.

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

Always bump `version` in all three files whenever plugin contents change:

1. `<plugin-root>/plugin.json`
2. `<plugin-root>/.antigravity-plugin/plugin.json`
3. `.claude-plugin/marketplace.json`

Harnesses cache plugins by `version`, and the repository validator fails if any of the three versions disagree.
