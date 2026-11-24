# Agent Plugin Marketplace

Harness-agnostic Agent Plugins marketplace (`agent-plugin-marketplace`) for GitHub Copilot, Claude Code, and Google Antigravity, with a strict TypeScript validator.

## Commands

- Install dependencies: `npm install`
- Build TypeScript: `npm run build` (type-check only: `npm run typecheck`)
- Run test suite: `npm test`
- Validate repository (catalog, manifests, MCP configs, skills): `npm run validate`
- Validate one plugin with Antigravity CLI, if installed: `agy plugin validate ./plugins/<plugin>` (omit `--strict`; the shadowed root `plugin.json` emits an expected warning)

## Repository Layout

- `.claude-plugin/marketplace.json` — Catalog of installable plugins, read by Claude Code and Copilot CLI.
- `plugins/<plugin>/` — Installable plugins (also auto-discovered by Antigravity bulk install). Each contains:
  - `plugin.json` — Portable Agent Plugins v1.0.0 manifest.
  - `.antigravity-plugin/plugin.json` — Antigravity v1 manifest (takes precedence in Antigravity; see ADR 0002).
  - `skills/<name>/SKILL.md` — Agent Skills with optional one-level-deep `references/`; optional plugin-level `reference/` holds leaf docs shared across skills.
  - `README.md` — Plugin docs and changelog.
- `examples/build-an-agent-plugin/` — Non-installable reference plugin and authoring guide (intentionally absent from the catalog).
- `schemas/` — Pinned official JSON Schemas (Agent Plugins 1.0.0, Antigravity v1).
- `src/` & `test/` — TypeScript ESM validator, Vitest tests, and fixtures.
- `docs/specs/` & `docs/decisions/` — Distilled harness specs and ADRs.

## Adding or Changing a Plugin

1. Create or edit `plugins/<plugin>/` with both manifests sharing the same `name`, `version`, and `description`.
2. Register new plugins in `.claude-plugin/marketplace.json` (`source: "./plugins/<plugin>"`).
3. Bump `version` in `plugin.json`, `.antigravity-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and each modified skill's `SKILL.md` `metadata.version` (when present), because harnesses cache plugins by version.
4. Add a changelog entry to the plugin's `README.md`.
5. Check relative Markdown links by hand, because `npm run validate` does not check them.
6. Run `npm run build && npm test && npm run validate` (plus `agy plugin validate` when available).

## Conventions

- Run `npm run build && npm test && npm run validate` before every commit.
- Use Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`) with an optional scope such as `feat(prompt-engineering):`.
- Push or open PRs only when the user asks.
- Keep `schemas/` unmodified; copy official updates verbatim only when pinning a new spec version.
- Keep `.cache/` uncommitted (gitignored scratch for cloned specs and fetched docs).
- Keep secrets out of `env`, `headers`, and Antigravity variable defaults—use `""`, `"changeme"`, `"example"`, or `${VAR}` placeholders because manifest and MCP files are committed in plaintext.

## Read When

| File | Open when you need |
| --- | --- |
| `docs/specs/agent-plugins.md` | Portable `plugin.json`, `mcp.json`, path containment, or extension namespace rules |
| `docs/specs/agent-skills.md` | `SKILL.md` frontmatter fields, name/directory constraints, or progressive-disclosure rules |
| `docs/specs/claude-marketplaces.md` | `.claude-plugin/marketplace.json` schema, Claude install commands, or `CLAUDE.md` import rules |
| `docs/specs/copilot-plugins.md` | Copilot Agent Plugins schema support, `com.github.copilot/`, or `copilot plugin` commands |
| `docs/specs/antigravity.md` | Antigravity install commands (`agy plugin install`), `agy plugin validate`, or multi-tool shadow rules |
| `docs/specs/mcp-config.md` | MCP transports and side-by-side mapping between `mcp.json` and Antigravity `mcp_config.json` |
| `docs/specs/harness-compat.md` | Compatibility notes for Cursor and other Agent Plugins clients (no manifests in this milestone) |
| `docs/decisions/0001-defaults.md` | Marketplace name, package manager (`npm`), Node/TS stack, and local git policy |
| `docs/decisions/0002-manifest-placement.md` | Rationale for two plugin manifests (`plugin.json` + `.antigravity-plugin/plugin.json`) |
| `docs/decisions/0003-marketplace-catalog.md` | Rationale for `.claude-plugin/marketplace.json` and per-harness install flows |
| `docs/decisions/0004-example-plugin-and-repo-layout.md` | Example plugin scope, root `AGENTS.md`/`CLAUDE.md` policy, and directory layout |
| `examples/build-an-agent-plugin/skills/build-an-agent-plugin/SKILL.md` | Step-by-step guide for scaffolding a new plugin (manifests, skills, MCP config) |
| `plugins/prompt-engineering/skills/skill-creator/references/checklist.md` | Pass/fail rubric for authoring or auditing any `SKILL.md` |
| `plugins/prompt-engineering/reference/README.md` | Catalog and sync rules before editing the prompt-engineering reference pack |
