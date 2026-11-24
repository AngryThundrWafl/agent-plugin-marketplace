# Agent Plugin Marketplace

This repository is a harness-agnostic Agent Plugins marketplace (`agent-plugin-marketplace`) with TypeScript validation tooling and first-class support for GitHub Copilot, Claude Code, and Google Antigravity. Plugins follow the Agent Plugins v1.0.0 and Agent Skills specifications while shipping a dedicated Antigravity manifest so every harness loads cleanly without conflict.

## Commands

- Install dependencies: `npm install`
- Build TypeScript: `npm run build`
- Run test suite: `npm test`
- Validate repository (catalog, manifests, MCP configs, skills): `npm run validate`
- Validate an individual plugin with Antigravity CLI (if installed): `agy plugin validate ./plugins/<plugin>`

## Repository Layout

- `.claude-plugin/marketplace.json` — Shared marketplace catalog read by Claude Code and GitHub Copilot CLI.
- `plugins/<plugin>/` — Self-contained plugins (`plugins/build-an-agent-plugin/` is the reference how-to):
  - `plugin.json` — Portable Agent Plugins v1.0.0 manifest (read by Copilot, Cursor, and other portable clients).
  - `.antigravity-plugin/plugin.json` — Google Antigravity v1 manifest; exists alongside root `plugin.json` because Antigravity uses a distinct closed schema and gives `.antigravity-plugin/plugin.json` precedence over root `plugin.json` without deleting the portable manifest. (Claude Code treats `.claude-plugin/marketplace.json` as the manifest for skills-only plugins.)
  - `skills/<name>/SKILL.md` — Shared Agent Skills entrypoints with optional one-level-deep `references/`.
- `schemas/` — Pinned official Draft 2020-12 JSON Schemas (Agent Plugins 1.0.0 and Antigravity v1).
- `src/` & `test/` — Strict TypeScript ESM validator, Vitest tests, and fixtures.
- `docs/specs/` & `docs/decisions/` — Distilled harness specs and Architecture Decision Records (ADRs).

## Conventions

- Run `npm run build && npm test && npm run validate` before every commit.
- Bump `version` consistently across `plugin.json`, `.antigravity-plugin/plugin.json`, and `.claude-plugin/marketplace.json` whenever plugin contents change, because harnesses cache plugins by version.
- Keep `schemas/` unmodified; copy official updates verbatim only when pinning a new spec version.
- Keep `.cache/` uncommitted (gitignored scratch for cloned specs and fetched docs).
- Never commit secrets in `env`, `headers`, or Antigravity variable defaults (use `""`, `"changeme"`, `"example"`, or `${VAR}`).

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
