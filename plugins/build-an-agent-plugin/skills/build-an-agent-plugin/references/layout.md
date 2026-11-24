# Multi-Harness Plugin Layout & Marketplace Catalog

A portable plugin lives in a single directory and keeps all shared components at `<plugin-root>`. Two plugin manifests plus one repository catalog serve GitHub Copilot, Claude Code, and Google Antigravity without duplicating skills.

## Standard Directory Layout

```text
<repo>/
├── .claude-plugin/
│   └── marketplace.json                        # Shared catalog (Claude Code + Copilot CLI)
└── plugins/
    └── hello-world/
        ├── plugin.json                         # Agent Plugins v1.0.0 manifest
        ├── .antigravity-plugin/
        │   └── plugin.json                     # Google Antigravity v1 manifest
        ├── README.md                           # Human install & usage guide
        ├── mcp.json                            # Optional: Agent Plugins MCP config (only if shipping MCP)
        ├── mcp_config.json                     # Optional: Antigravity MCP config (only if shipping MCP)
        └── skills/
            └── hello-world/
                ├── SKILL.md                    # Exact uppercase filename; immediate child dir only
                └── references/                 # Optional one-level-deep docs
```

## Why Two Manifests Exist

| Harness | Manifest / Catalog Consumed | Behavior |
| --- | --- | --- |
| **GitHub Copilot** (CLI; VS Code/App for root `plugin.json`) | Root `plugin.json` (Copilot CLI also reads `.claude-plugin/marketplace.json`) | Reads root `plugin.json` in Agent Plugins 1.0 mode (takes precedence over `.plugin/plugin.json` and `.claude-plugin/plugin.json`). Copilot CLI discovers `.claude-plugin/marketplace.json` natively (VS Code's catalog discovery order is unverified). |
| **Google Antigravity** | `.antigravity-plugin/plugin.json` | `.antigravity-plugin/plugin.json` takes precedence over root `plugin.json` at runtime and is promoted to root `plugin.json` in Marketplace bundles. Root `plugin.json` is safely shadowed (`agy plugin validate` emits a non-fatal warning; run without `--strict`). |
| **Claude Code** | `.claude-plugin/marketplace.json` entry | Omits `.claude-plugin/plugin.json` for portable skills-only plugins so the catalog entry acts as the manifest and discovers `skills/<name>/SKILL.md` directly without triggering duplicate-`version` warnings. Add `.claude-plugin/plugin.json` only if you need Claude-only features (`userConfig`, `channels`, or custom component paths). |

## Containment & Path Rules

- Every component directory (`skills/`, `mcp.json`, `mcp_config.json`) MUST stay at `<plugin-root>`, never inside `.antigravity-plugin/` or `.claude-plugin/`.
- All plugin-relative and marketplace-relative paths MUST use forward slashes (`/`), begin with `./` (or `"."` for repo-root plugins), never contain `..`, and never resolve via symlinks outside the plugin or repository root.
- Do not place `CLAUDE.md` or `AGENTS.md` inside a plugin root (Claude Code warns on plugin-root `CLAUDE.md`; Antigravity ignores plugin-root `AGENTS.md` with a warning).

## Validated `.claude-plugin/marketplace.json` Example

Every entry in `plugins[]` must use a `./`-prefixed relative `source` path and match the `name` and `version` declared in both plugin manifests:

```json validate:marketplace.json
{
  "name": "acme-plugin-marketplace",
  "owner": {
    "name": "Acme Engineering",
    "url": "https://example.com"
  },
  "description": "Portable Agent Plugins catalog for GitHub Copilot, Claude Code, and Google Antigravity.",
  "metadata": {
    "description": "Portable Agent Plugins catalog for GitHub Copilot, Claude Code, and Google Antigravity.",
    "version": "1.0.0"
  },
  "plugins": [
    {
      "name": "hello-world",
      "source": "./plugins/hello-world",
      "version": "1.0.0",
      "description": "Starter portable plugin demonstrating dual manifests and a reusable Agent Skill.",
      "category": "developer-tools",
      "tags": [
        "agent-plugins",
        "skills",
        "starter"
      ]
    }
  ]
}
```
