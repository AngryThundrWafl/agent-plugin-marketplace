# ADR 0003: Marketplace Catalog Format & Per-Harness Distribution

- **Date:** 2026-11-24
- **Status:** Accepted

## Context

Agent Plugins v1.0.0 defines no marketplace catalog format. Among our three first-class harnesses:
- **Claude Code** requires `.claude-plugin/marketplace.json` at the marketplace root (relative plugin `source` paths resolve from the repo root using `./`).
- **GitHub Copilot CLI** searches `marketplace.json`, `.plugin/marketplace.json`, `.github/plugin/marketplace.json`, and `.claude-plugin/marketplace.json` in order, using the same `name`, `owner`, `metadata`, `plugins[]` structure.
- **Google Antigravity** reserves `antigravity-plugins-official` for Google's curated marketplace and installs third-party plugins directly from a local directory (`agy plugin install ./plugins/<plugin>`), a GitHub repository URL (`agy plugin install https://github.com/<owner>/<repo>`), or manual placement under `.agents/plugins/` (workspace) or `~/.gemini/config/plugins/` (global).

## Decision

1. Maintain a single catalog at **`.claude-plugin/marketplace.json`** with marketplace `name: "agent-plugin-marketplace"` (per ADR 0001).
2. Every entry in `plugins[]` MUST use a `./`-prefixed relative `source` path (e.g., `"./plugins/prompt-engineering"`) with forward slashes and no `..`, and its `name` and `version` MUST match both the portable `plugin.json` and `.antigravity-plugin/plugin.json` inside that directory.
3. Document the exact per-harness "add marketplace / install plugin" commands in each harness spec and root `README.md`:
   - **Claude Code:** `claude plugin marketplace add ./` (or `<owner>/<repo>`) then `claude plugin install <plugin>@agent-plugin-marketplace`
   - **GitHub Copilot CLI:** `copilot plugin marketplace add <local-path-or-owner/repo>` then `copilot plugin install <plugin>@agent-plugin-marketplace`
   - **Google Antigravity:** `agy plugin install ./plugins/<plugin>` (or copy into `.agents/plugins/<plugin>/` for workspace scope)

## Consequences

- One catalog file serves both Claude Code and GitHub Copilot CLI without duplication.
- Antigravity users get accurate direct-install instructions rather than a non-existent marketplace-add command.
- Note: if a future milestone targets Copilot surfaces (e.g., VS Code) that prove to require `.github/plugin/marketplace.json`, a follow-up ADR can add a synced catalog or symlink.
