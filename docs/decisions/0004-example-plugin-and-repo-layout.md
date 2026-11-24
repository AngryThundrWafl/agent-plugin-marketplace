# ADR 0004: Example Plugin Scope & Repository Layout

- **Date:** 2026-11-24
- **Status:** Accepted
- **Sources:** `docs/decisions/0001-defaults.md`, `docs/decisions/0002-manifest-placement.md`, `docs/decisions/0003-marketplace-catalog.md`, `docs/specs/agent-skills.md`, `docs/specs/mcp-config.md`, `docs/specs/claude-marketplaces.md`

## Decisions

### 1. Example Plugin (`plugins/build-an-agent-plugin/`)

- **Name:** `build-an-agent-plugin`, **initial version:** `1.0.0`.
- **Role:** Working reference plugin and authoring guide across GitHub Copilot, Claude Code, and Google Antigravity.
- **Skill:** `skills/build-an-agent-plugin/SKILL.md` using progressive disclosure (short activation guide + links to focused one-level-deep files in `references/`):
  - `references/layout.md` — multi-harness directory layout and why two plugin manifests exist
  - `references/manifests.md` — validated `plugin.json` and `.antigravity-plugin/plugin.json` examples
  - `references/skills.md` — `SKILL.md` frontmatter and progressive-disclosure checklist
  - `references/mcp-config.md` — validated Agent Plugins `mcp.json` and Antigravity `mcp_config.json` examples and secret rules
- **MCP files:** Do **not** ship a live `mcp.json` or `mcp_config.json` inside `plugins/build-an-agent-plugin/` because this milestone includes no bundled secret-free MCP server executable. Valid and invalid `mcp.json` / `mcp_config.json` snippets live in `references/mcp-config.md` and are verified directly by automated tests against the validator.

### 2. Root Instruction Files (`AGENTS.md` and `CLAUDE.md`)

- **`AGENTS.md`** (≤80 lines): Short progressive-disclosure index read natively by Antigravity, Copilot-family tools, and Claude Code v2.1.277+.
- **`CLAUDE.md`**: Minimal file containing `@AGENTS.md`, confirmed by `docs/specs/claude-marketplaces.md` to load `AGENTS.md` on Claude Code <v2.1.277 and non-native sessions without causing duplicate loading on v2.1.277+.
- **No `GEMINI.md`:** Antigravity reads `AGENTS.md` natively; adding `GEMINI.md` would split rules unnecessarily.

### 3. Repository Layout

Replaces the pre-existing `.mjs` scaffold (`scripts/*.mjs`, `plugins/example-plugin/`, `plugins/test-plugin/`) per Phase 0 preflight confirmation:

```text
<repo>/
├── AGENTS.md
├── CLAUDE.md                                   # @AGENTS.md import
├── .claude-plugin/marketplace.json             # Claude Code + Copilot CLI catalog
├── plugins/build-an-agent-plugin/
│   ├── plugin.json                             # Agent Plugins v1.0.0 manifest
│   ├── .antigravity-plugin/plugin.json         # Antigravity v1 manifest
│   ├── README.md                               # Per-harness install & authoring guide
│   └── skills/build-an-agent-plugin/
│       ├── SKILL.md
│       └── references/
│           ├── layout.md
│           ├── manifests.md
│           ├── skills.md
│           └── mcp-config.md
├── schemas/                                    # Pinned official Draft 2020-12 schemas, unmodified
│   ├── agent-plugins/1.0.0/
│   │   ├── plugin.schema.json
│   │   └── mcp.schema.json
│   └── antigravity/v1/
│       └── plugin.json
├── docs/
│   ├── specs/
│   ├── decisions/
│   └── PROGRESS.md
├── src/                                        # Strict TypeScript ESM validator
├── test/
│   ├── fixtures/valid/
│   └── fixtures/invalid/
├── package.json
├── tsconfig.json
└── .cache/                                     # Gitignored spec clones & fetched docs
```

### 4. TypeScript Tooling Stack

- Node.js v22 LTS, ESM (`"type": "module"`), strict TypeScript (`tsc --noEmit` / `tsc`), `vitest` test runner.
- JSON Schema library: `ajv` (`ajv/dist/2020` for Draft 2020-12, matching all three pinned schemas) + `yaml` (strict YAML frontmatter parsing for `SKILL.md`).
