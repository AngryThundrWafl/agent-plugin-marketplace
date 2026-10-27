# Agent Plugins Marketplace

A monorepo of portable agent plugins conforming to the **Agent Plugins Specification v1.0.0** (https://agent-plugins.org/specification). Works with **Claude Code** and **GitHub Copilot CLI** from a single source.

## Specification Compliance

This marketplace implements the Agent Plugins v1.0.0 specification:

- **Manifest** (`plugin.json`) — validated against `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`
- **MCP Configuration** (`mcp.json`) — validated against `https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`
- **Component Discovery** — skills from `skills/`, MCP servers from `mcp.json` (per spec §6.1)
- **Plugin Names** — enforced per spec §5.5 (1-64 chars, lowercase alphanumeric/hyphen/period, no consecutive `--` or `..`)
- **Client Extensions** — supported via `extensions` field and top-level directories (per spec §8)

## Why this works

Both tools converge on compatible manifest formats:

- **Marketplace file** — Claude Code reads `.claude-plugin/marketplace.json`. Copilot CLI (v1.0.74+) reads it from the same `.claude-plugin/` path. One marketplace manifest serves both.
- **Plugin manifest** — Copilot CLI requires `plugin.json` at plugin root. Claude Code requires it at `<plugin>/.claude-plugin/plugin.json`. This repo keeps a single **canonical** `plugins/<name>/plugin.json` and generates the `.claude-plugin/` copy.
- **Client extensions** — Per spec §8, client-specific data goes in `extensions` (reverse-domain namespaces) and/or top-level directories (`com.anthropic.claude/`, `com.github.copilot/`). The sync script mirrors these to `.claude-plugin/` for Claude Code.

```
agents-plugin-marketplace/
├── .claude-plugin/
│   ├── marketplace.json        # generated — do not hand-edit
│   └── (mirrored client extensions)
├── plugins/
│   └── example-plugin/
│       ├── plugin.json         # canonical manifest — edit this one
│       ├── mcp.json            # optional MCP servers (validated)
│       ├── .claude-plugin/     # generated copies
│       │   ├── plugin.json
│       │   ├── mcp.json
│       │   └── com.anthropic.claude/  # mirrored for Claude Code
│       │   └── com.github.copilot/    # mirrored for Claude Code
│       ├── agents/             # agent definitions (markdown + frontmatter)
│       ├── skills/             # skills (subdirs with SKILL.md)
│       ├── commands/           # slash commands (markdown + frontmatter)
│       └── hooks/hooks.json    # optional hooks
├── scripts/
│   ├── sync-manifests.mjs      # regenerate .claude-plugin/ + marketplace.json
│   ├── new-plugin.mjs          # scaffold a new plugin (spec-compliant)
│   └── validate.mjs            # schema validation (AJV + official schemas)
├── .github/workflows/validate.yml
├── Dockerfile                  # containerized validation
└── docker-compose.yml          # compose services for CI
```

## Quick Start

```bash
# Install dependencies
npm install

# Create a new plugin (enforces spec §5.5 naming)
node scripts/new-plugin.mjs my-plugin

# Edit plugins/my-plugin/plugin.json, add agents/skills/commands/mcp.json

# Regenerate manifests (run after any manifest edit)
node scripts/sync-manifests.mjs

# Validate everything (schemas, frontmatter, consistency)
node scripts/validate.mjs
```

## CI / Docker

```bash
# Build image
docker build -t agent-plugin-marketplace .

# Validate (exit code 1 on failure)
docker run --rm agent-plugin-marketplace

# Check manifests are in sync (for CI)
docker run --rm agent-plugin-marketplace node scripts/sync-manifests.mjs --check

# Or use docker-compose
docker compose run --rm validate
docker compose run --rm sync-check
```

## Installing Locally

**Claude Code**

```
/plugin marketplace add /absolute/path/to/agent-plugin-marketplace
/plugin install example-plugin@agents-plugin-marketplace
```

**GitHub Copilot CLI**

```
copilot plugin marketplace add /absolute/path/to/agent-plugin-marketplace
copilot plugin install example-plugin@agents-plugin-marketplace
```

Both point at the same repo checkout — no separate clone or branch per harness.

## CI Workflow

`.github/workflows/validate.yml` runs on every push/PR:
1. `sync-manifests.mjs --check` — fails if generated files are stale
2. `validate.mjs` — validates schemas, frontmatter, naming, consistency

## Commands

| Command | Description |
|---------|-------------|
| `node scripts/new-plugin.mjs <name>` | Scaffold new plugin (validates name per spec) |
| `node scripts/sync-manifests.mjs` | Regenerate `.claude-plugin/` copies + marketplace |
| `node scripts/sync-manifests.mjs --check` | CI check: exit 1 if stale |
| `node scripts/validate.mjs` | Full validation (schemas + conventions) |

## Plugin Structure

Each plugin under `plugins/` follows the Agent Plugins standard layout (spec §4.2):

```
my-plugin/
├── plugin.json          # required: manifest with $schema, name
├── mcp.json             # optional: MCP servers with $schema
├── skills/              # optional: skill directories with SKILL.md
│   └── my-skill/
│       ├── SKILL.md
│       ├── scripts/
│       └── references/
├── agents/              # optional: agent markdown with frontmatter
├── commands/            # optional: command markdown with frontmatter
├── hooks/hooks.json     # optional: hooks
├── com.anthropic.claude/  # optional: Claude Code extension
└── com.github.copilot/    # optional: Copilot CLI extension
```

## Validation Details

`validate.mjs` checks:
- `plugin.json` against official schema (draft-2020-12 via AJV)
- `mcp.json` against official schema (draft-2020-12 via AJV)
- Plugin name constraints (spec §5.5)
- Required fields: `$schema`, `name`, `version`, `description`, `author`
- Directory name matches manifest `name`
- `.claude-plugin/plugin.json` copy exists
- YAML frontmatter on all `.md` files in `agents/`, `skills/`, `commands/`
- Valid JSON for `hooks/hooks.json` and `mcp.json`
- MCP server config: valid transport, no reserved env vars (`PLUGIN_ROOT`, `PLUGIN_DATA`), valid `cwd` patterns