# ADR 0002: Per-Harness Plugin Manifest Placement

- **Date:** 2026-11-24
- **Status:** Accepted
- **Sources:** `docs/specs/agent-plugins.md`, `docs/specs/claude-marketplaces.md`, `docs/specs/copilot-plugins.md`, `docs/specs/antigravity.md`, `docs/specs/harness-compat.md`

## Context

Each target harness resolves plugin manifests differently:
- **Agent Plugins v1.0.0** requires a closed-schema root `plugin.json` (`$schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"`).
- **GitHub Copilot** (CLI, VS Code, App) reads root `plugin.json` directly in Agent Plugins 1.0 mode, and root `plugin.json` takes precedence over `.plugin/plugin.json` and `.claude-plugin/plugin.json`.
- **Google Antigravity** uses its own Draft 2020-12 schema (`https://antigravity.google/schemas/v1/plugin.json`, `additionalProperties: false`) at `<plugin-root>/plugin.json` or `<plugin-root>/.antigravity-plugin/plugin.json`. When `.antigravity-plugin/plugin.json` is present, it takes precedence over root `plugin.json` at runtime and is promoted to root `plugin.json` in Marketplace bundles; root `plugin.json` is safely shadowed (emitting a `warning` in `agy plugin validate`, never an `error`).
- **Claude Code** does not read portable root `plugin.json`. Its native `.claude-plugin/plugin.json` is explicitly optional: when omitted, Claude Code treats the plugin's `.claude-plugin/marketplace.json` entry as the manifest and discovers `skills/<name>/SKILL.md` at the plugin root (and setting `version` in both `.claude-plugin/plugin.json` and `marketplace.json` triggers a `claude plugin validate` warning).

## Decision

Every portable plugin in this marketplace ships **two** plugin-level manifests, with all components at `<plugin-root>`:

1. **`<plugin-root>/plugin.json`** — Agent Plugins v1.0.0 portable manifest (`https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`). Consumed by GitHub Copilot, Cursor, VS Code, and any other Agent Plugins 1.0 client.
2. **`<plugin-root>/.antigravity-plugin/plugin.json`** — Google Antigravity v1 manifest (`https://antigravity.google/schemas/v1/plugin.json`). Takes precedence over root `plugin.json` in Antigravity without deleting the portable manifest.
3. **Claude Code** — Served by the plugin's entry in `<repo>/.claude-plugin/marketplace.json` plus standard root `skills/<name>/SKILL.md` discovery. `.claude-plugin/plugin.json` is intentionally omitted for portable skills-only plugins to avoid a third manifest and duplicate-`version` warnings.
   - *Escape hatch:* Authors needing Claude-only features (`userConfig`, `channels`, non-default component paths, or `.claude/skills/` auto-loading) MAY add `.claude-plugin/plugin.json` without breaking Copilot (root `plugin.json` wins) or Antigravity (`.antigravity-plugin/plugin.json` wins).
4. **Other harnesses** (Cursor `.cursor-plugin/`, etc.) — Out of scope for manifests in this milestone; documented in `docs/specs/harness-compat.md` only.

## Consequences

- `skills/<name>/SKILL.md` is shared unmodified across all three first-class harnesses.
- `agy plugin validate <plugin-dir>` succeeds with exit code `0` (emitting an expected warning on the shadowed portable root `plugin.json`); CI runs `agy plugin validate` without `--strict` (or filters shadowed multi-tool warnings in `--json` output).
- Our TypeScript validator validates both `plugin.json` and `.antigravity-plugin/plugin.json` against their pinned Draft 2020-12 JSON Schemas plus spec semantic rules, and verifies agreement with `.claude-plugin/marketplace.json`.
