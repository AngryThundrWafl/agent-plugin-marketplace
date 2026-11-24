# Build an Agent Plugin (Educational Reference Example)

An **educational reference plugin** and authoring guide for building harness-agnostic Agent Plugins that work across **GitHub Copilot**, **Claude Code**, and **Google Antigravity**.

> **Educational / Non-Installable Example:** This directory lives under `examples/build-an-agent-plugin/` (outside `plugins/` and omitted from `.claude-plugin/marketplace.json`) so it is **not** installed when users add the marketplace or run `agy plugin install .`. Use it as a template and reference when creating new installable plugins under `plugins/<your-plugin>/`.

## Dual-Manifest Layout

Every portable plugin in this marketplace keeps its shared components (such as `skills/<name>/SKILL.md`) at the plugin root and ships **two** plugin-level manifests:

```text
examples/build-an-agent-plugin/
├── plugin.json                                     # Agent Plugins v1.0.0 (Copilot, VS Code, Cursor)
├── .antigravity-plugin/
│   └── plugin.json                                 # Google Antigravity v1 (shadows root plugin.json)
├── README.md
└── skills/
    └── build-an-agent-plugin/
        ├── SKILL.md                                # Short activation guide (progressive disclosure)
        └── references/
            ├── layout.md                           # Multi-harness layout & marketplace.json
            ├── manifests.md                        # Validated plugin.json examples
            ├── skills.md                           # SKILL.md frontmatter & disclosure checklist
            └── mcp-config.md                       # Validated mcp.json & mcp_config.json examples
```

- **Root `plugin.json`** implements [Agent Plugins v1.0.0](https://agent-plugins.org/specification) (`https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`), consumed directly by GitHub Copilot CLI and other Agent Plugins 1.0 clients.
- **`.antigravity-plugin/plugin.json`** implements Google Antigravity v1 (`https://antigravity.google/schemas/v1/plugin.json`). It takes precedence over root `plugin.json` at runtime in Antigravity while keeping the portable manifest intact.
- **Claude Code** reads the plugin entry from the repository catalog at `.claude-plugin/marketplace.json` and discovers `skills/<name>/SKILL.md` directly from the plugin root. `.claude-plugin/plugin.json` is intentionally omitted to avoid a third manifest and duplicate-`version` warnings.
- **No live MCP config files**: This example does not bundle an MCP server executable, so it omits live `mcp.json` and `mcp_config.json` files. Validated reference snippets live in `skills/build-an-agent-plugin/references/mcp-config.md`.

## Using This Example

Copy this directory structure to `plugins/<your-plugin>/` when scaffolding a new installable plugin, update `name` and `version` in `plugin.json` and `.antigravity-plugin/plugin.json`, and register it in `.claude-plugin/marketplace.json`.

You can validate this educational example at any time with:

```bash
# Repository validator (validates both plugins/ and examples/)
npm run validate

# Antigravity CLI validator (run without --strict due to shadowed portable root plugin.json)
agy plugin validate ./examples/build-an-agent-plugin
```

## Versioning Reminder

Whenever you modify files inside an installable plugin under `plugins/<plugin>/`, bump `version` consistently across all four places so harnesses detect updates and repository validation passes:

1. `plugins/<plugin>/plugin.json`
2. `plugins/<plugin>/.antigravity-plugin/plugin.json`
3. `.claude-plugin/marketplace.json`
4. Each modified skill's `SKILL.md` `metadata.version` (when present)
