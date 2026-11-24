# Agent Plugin Marketplace

A harness-agnostic monorepo of portable Agent Plugins conforming to the **Agent Plugins v1.0.0**, **Agent Skills**, and **Google Antigravity v1** specifications. Supports **Claude Code**, **GitHub Copilot CLI**, and **Google Antigravity** from a single repository.

## Available Plugins

| Plugin | Path | Description |
| --- | --- | --- |
| `prompt-engineering` | [`plugins/prompt-engineering/`](plugins/prompt-engineering/README.md) | Live-distilled Prompting Reference Pack for Claude and open-weight models plus `skill-creator` and `prompt-creator` skills. |

### Educational Examples (Not Installable)

* [`examples/build-an-agent-plugin/`](examples/build-an-agent-plugin/README.md) — Reference how-to plugin and skill demonstrating the dual-manifest layout, `SKILL.md` progressive disclosure, and validated `mcp.json` / `mcp_config.json` patterns. It lives under `examples/` (outside `plugins/` and omitted from `.claude-plugin/marketplace.json`) so it is validated in CI for correctness without being installed by marketplace or bulk-install commands.

## How Multi-Harness Support Works

Every installable plugin under `plugins/<plugin>/` keeps shared components (`skills/<name>/SKILL.md`) at the plugin root and ships two plugin-level manifests:

* **`plugin.json`** — Portable Agent Plugins v1.0.0 manifest (`https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`), consumed by GitHub Copilot CLI and other Agent Plugins 1.0 clients.
* **`.antigravity-plugin/plugin.json`** — Google Antigravity v1 manifest (`https://antigravity.google/schemas/v1/plugin.json`), which takes precedence over root `plugin.json` in Antigravity without deleting the portable manifest.
* **`.claude-plugin/marketplace.json`** — Shared marketplace catalog consumed by Claude Code and GitHub Copilot CLI.

## Installation

### Google Antigravity (`agy`)

Google Antigravity reserves named `@<marketplace>` installs for `antigravity-plugins-official` and has no third-party `marketplace add` command. Instead, Antigravity natively bulk-installs all plugins from this repository's `plugins/` directory:

```bash
# Install all marketplace plugins from GitHub
agy plugin install https://github.com/AngryThundrWafl/agent-plugin-marketplace

# Or install all marketplace plugins from a local clone
agy plugin install .

# Or install a single plugin
agy plugin install ./plugins/prompt-engineering
agy plugin install https://github.com/AngryThundrWafl/agent-plugin-marketplace/tree/main/plugins/prompt-engineering

# List installed plugins
agy plugin list --json
```

For workspace-scoped installation in Antigravity, copy `plugins/<plugin>/` into `.agents/plugins/<plugin>/`.

### Claude Code

```bash
claude plugin marketplace add ./
# or from GitHub:
# claude plugin marketplace add AngryThundrWafl/agent-plugin-marketplace

claude plugin install prompt-engineering@agent-plugin-marketplace
```

### GitHub Copilot CLI

```bash
copilot plugin marketplace add ./
# or from GitHub:
# copilot plugin marketplace add AngryThundrWafl/agent-plugin-marketplace

copilot plugin install prompt-engineering@agent-plugin-marketplace
```

## Development & Validation

```bash
# Install dependencies
npm install

# Build TypeScript validator
npm run build

# Run Vitest test suite
npm test

# Validate marketplace catalog, manifests, MCP configs, skills, and examples
npm run validate

# Validate an individual plugin with Antigravity CLI (without --strict)
agy plugin validate ./plugins/prompt-engineering
```

> **Note:** Run `agy plugin validate` on individual plugin directories without `--strict` in multi-tool repositories (root `plugin.json` emits an expected warning because `.antigravity-plugin/plugin.json` takes precedence). Do not run `agy plugin validate .claude-plugin/marketplace.json`, as Antigravity's `marketplace.json` schema uses an object `source` rather than Claude/Copilot's `./plugins/...` string paths.
