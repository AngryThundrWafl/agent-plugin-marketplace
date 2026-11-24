# Build an Agent Plugin

A portable reference plugin and authoring guide for building harness-agnostic Agent Plugins that work across **GitHub Copilot**, **Claude Code**, and **Google Antigravity**.

## Dual-Manifest Layout

Every portable plugin in this marketplace keeps its shared components (such as `skills/<name>/SKILL.md`) at the plugin root and ships **two** plugin-level manifests:

```text
plugins/build-an-agent-plugin/
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
- **No live MCP config files**: This plugin does not bundle an MCP server executable, so it omits live `mcp.json` and `mcp_config.json` files. Validated reference snippets live in `skills/build-an-agent-plugin/references/mcp-config.md`.

## Using the Skill

Once installed, ask your agent to scaffold, review, or update a portable plugin, or invoke the `build-an-agent-plugin` skill directly. The skill uses progressive disclosure: `SKILL.md` provides a concise workflow and links one level deep to focused topic guides in `references/`.

## Installation by Harness

### Claude Code

Add this repository as a marketplace and install the plugin:

```bash
claude plugin marketplace add ./
# or from GitHub:
# claude plugin marketplace add <owner>/<repo>

claude plugin install build-an-agent-plugin@agent-plugin-marketplace
```

To test the plugin for a single session without installing:

```bash
claude --plugin-dir ./plugins/build-an-agent-plugin
```

### GitHub Copilot CLI

Add this repository as a marketplace (Copilot CLI discovers `.claude-plugin/marketplace.json` natively) and install the plugin:

```bash
copilot plugin marketplace add <local-path-or-owner/repo>
copilot plugin install build-an-agent-plugin@agent-plugin-marketplace
```

### Google Antigravity

Google Antigravity has no third-party repo-hosted marketplace catalog or `marketplace add` command (`antigravity-plugins-official` is reserved for Google's curated marketplace). Install third-party plugins directly from a local directory, from a GitHub repository URL, or by copying into workspace scope:

```bash
# Local directory
agy plugin install ./plugins/build-an-agent-plugin

# GitHub repository URL
agy plugin install https://github.com/<owner>/<repo>
```

For workspace-scoped installation, copy `plugins/build-an-agent-plugin/` into `.agents/plugins/build-an-agent-plugin/`.

Validate the plugin locally with the Antigravity CLI:

```bash
agy plugin validate ./plugins/build-an-agent-plugin
```

> **Note:** Run `agy plugin validate` without `--strict` in multi-tool repositories. The shadowed portable root `plugin.json` emits an expected non-fatal `warning` while `.antigravity-plugin/plugin.json` is active.

## Versioning Reminder

Whenever you modify files inside a plugin, bump `version` consistently in all three places so harnesses detect updates and repository validation passes:

1. `plugins/<plugin>/plugin.json`
2. `plugins/<plugin>/.antigravity-plugin/plugin.json`
3. `.claude-plugin/marketplace.json`
