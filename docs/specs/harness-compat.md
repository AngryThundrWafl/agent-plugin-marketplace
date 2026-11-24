# Agent Harness Compatibility Reference

## Header

- **Sources**:
  - `https://agent-plugins.org/compatible-clients`
  - `https://cursor.com/docs/plugins`
- **Retrieval date**: `2026-11-24`
- **Doc version**: Source pages unversioned; Agent Plugins manifest schema `1.0.0` (`https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`, cited in `cursor.com/docs/plugins`)
- **Review claims (5)**:
  1. `agent-plugins.org/compatible-clients` lists 12 clients adopting the portable Agent Plugins format; all 12 support Agent Skills and MCP, with MCP transport support differing across `stdio`, `Streamable HTTP`, and `legacy SSE`.
  2. Cursor loads both portable Agent Plugins (root `plugin.json` for Skills + MCP) and native Cursor Plugins (`.cursor-plugin/plugin.json` adding Rules `.mdc`, Agents, Commands, Hooks, variables, and Canvases; `.cursor-plugin/marketplace.json` for multi-plugin repos).
  3. Cursor does not expand the Agent Plugins standard's `${PLUGIN_ROOT}` or `${PLUGIN_DATA}` variables in `mcp.json`; Cursor requires `${CURSOR_PLUGIN_ROOT}` for the plugin root.
  4. Cursor Team Marketplaces (Teams: Default + 1 imported repo; Enterprise: unlimited) distribute both Agent Plugins and Cursor Plugins with `Default Off`, `Default On`, and `Required` installation modes and Organization Group/SCIM access controls.
  5. `AGENTS.md` compatibility for Cursor and all 11 other clients, plus marketplace/native-manifest specs for the 11 non-Cursor clients, are not documented in these sources and remain `unverified`.

## Harness Compatibility Checklist

### Cursor
- [x] **Portable Agent Plugins**: Supported; root `plugin.json` (`$schema` `1.0.0`, `name`, `description`, `version`, `author`), `skills/<name>/SKILL.md`, and `mcp.json`.
- [x] **Native Cursor Plugins**: `.cursor-plugin/plugin.json`; supports `.cursor-plugin/marketplace.json` for multi-plugin repos.
- [x] **Components**: Skills and MCP Servers (both formats); Rules (`.mdc`, Always / Agent Decides / Manual), Agents, Commands, Hooks (e.g., `workspaceOpen` returning plugin paths), variables, and Canvases (Cursor Plugins only). Skills invoke manually via `/skill-name`.
- [x] **MCP transports**: `stdio`, `Streamable HTTP`, `legacy SSE`; also supports MCP install deeplinks (`cursor://anysphere.cursor-deeplink/mcp/install?name=$NAME&config=$BASE64_ENCODED_CONFIG`).
- [x] **Public marketplaces**: Official Cursor Marketplace (`cursor.com/marketplace`, open-source Git repos, manual review on listing and updates, submitted via `cursor.com/marketplace/publish`); community directory at `cursor.directory`.
- [x] **Team marketplaces**: Teams (Default + 1 imported) & Enterprise (unlimited, admin-only creation); accepts GitHub, GitLab, Bitbucket, Azure DevOps repos; distributes both Agent Plugins and Cursor Plugins; modes `Default Off`, `Default On`, `Required`; Default marketplace cannot be renamed or deleted and links Team MCP servers across Cloud Agents, Agent Window, IDE, and CLI.
- [x] **Local dev & scopes**: Install at `project` or `user` scope (managed in Customize with user/workspace/team filters); local test folder `~/.cursor/plugins/local/<plugin>` (reload required); personal skill publishing from `~/.cursor/skills/` to Default marketplace.
- [ ] **`AGENTS.md` compatibility**: `unverified` (not mentioned in either source).

### VS Code
- [x] **Portable Agent Plugins**: Listed compatible client (Agent Skills supported).
- [x] **MCP transports**: `stdio`, `Streamable HTTP`, `legacy SSE`.
- [ ] **Marketplace / native manifests / `AGENTS.md`**: `unverified` (not in sources).

### GitHub Copilot
- [x] **Portable Agent Plugins**: Listed compatible client (Agent Skills supported).
- [x] **MCP transports**: `stdio`, `Streamable HTTP`, `legacy SSE`.
- [ ] **Marketplace / native manifests / `AGENTS.md`**: `unverified` (not in sources).

### ChatGPT & Codex
- [x] **Portable Agent Plugins**: Listed compatible client (Agent Skills supported).
- [x] **MCP transports**: `stdio`, `Streamable HTTP` (`legacy SSE` not listed).
- [ ] **Marketplace / native manifests / `AGENTS.md`**: `unverified` (not in sources).

### Kiro
- [x] **Portable Agent Plugins**: Listed compatible client (Agent Skills supported).
- [x] **MCP transports**: `stdio`, `Streamable HTTP`, `legacy SSE`.
- [ ] **Marketplace / native manifests / `AGENTS.md`**: `unverified` (not in sources).

### Hermes Agent
- [x] **Portable Agent Plugins**: Listed compatible client (Agent Skills supported).
- [x] **MCP transports**: `stdio`, `Streamable HTTP` (`legacy SSE` not listed).
- [ ] **Marketplace / native manifests / `AGENTS.md`**: `unverified` (not in sources).

### OpenClaw
- [x] **Portable Agent Plugins**: Listed compatible client (Agent Skills supported).
- [x] **MCP transports**: `stdio`, `Streamable HTTP`, `legacy SSE`.
- [ ] **Marketplace / native manifests / `AGENTS.md`**: `unverified` (not in sources).

### Grok Bot
- [x] **Portable Agent Plugins**: Listed compatible client (Agent Skills supported).
- [x] **MCP transports**: `stdio`, `Streamable HTTP`, `legacy SSE`.
- [ ] **Marketplace / native manifests / `AGENTS.md`**: `unverified` (not in sources).

### NanoClaw
- [x] **Portable Agent Plugins**: Listed compatible client (Agent Skills supported).
- [x] **MCP transports**: `stdio`, `Streamable HTTP` (`legacy SSE` not listed).
- [ ] **Marketplace / native manifests / `AGENTS.md`**: `unverified` (not in sources).

### OpenHands
- [x] **Portable Agent Plugins**: Listed compatible client (Agent Skills supported).
- [x] **MCP transports**: `stdio`, `Streamable HTTP` (`legacy SSE` not listed).
- [ ] **Marketplace / native manifests / `AGENTS.md`**: `unverified` (not in sources).

### Perplexity Computer
- [x] **Portable Agent Plugins**: Listed compatible client (Agent Skills supported).
- [x] **MCP transports**: `Streamable HTTP`, `legacy SSE` (`stdio` not listed).
- [ ] **Marketplace / native manifests / `AGENTS.md`**: `unverified` (not in sources).

### Google Antigravity
- [x] **Portable Agent Plugins**: Listed compatible client (Agent Skills supported).
- [x] **MCP transports**: `stdio`, `Streamable HTTP` (`legacy SSE` not listed).
- [ ] **Marketplace / native manifests / `AGENTS.md`**: `unverified` (not in sources).

## Gotchas

- **Cursor `mcp.json` variable divergence**: Standard `${PLUGIN_ROOT}` and `${PLUGIN_DATA}` are **not** expanded by Cursor; portable Agent Plugins relying on them in `mcp.json` need `${CURSOR_PLUGIN_ROOT}` (no `${PLUGIN_DATA}` equivalent documented).
- **MCP transport matrix gaps**: `Streamable HTTP` is the only transport listed across all 12 clients. Perplexity Computer does not list `stdio`; five clients (ChatGPT & Codex, Hermes Agent, NanoClaw, OpenHands, Google Antigravity) do not list `legacy SSE`.
- **Cursor local plugin pitfalls**:
  - Symlinks inside `~/.cursor/plugins/local` are skipped if they resolve outside `~/.cursor/plugins/local`.
  - Name collisions with an installed marketplace plugin load **both** copies in the editor/CLI; on self-hosted workers, the local copy wins and only `stdio` MCP servers run.
  - `Allow Local Plugin Imports` (controlling `~/.cursor/plugins/local` and `Import from Disk`) is **off by default** on Enterprise.
  - Hosted Cloud Agents ignore `~/.cursor/plugins/local` and pin plugin versions for the lifetime of a running agent.
- **Cursor marketplace caveats**:
  - `Auto Refresh` (requires Cursor GitHub App; throttled to max once per 10 minutes; full-manifest re-read only for repo-imported marketplaces) and `Serve marketplace from Cursor` apply only to GitHub imports, not GitLab/Bitbucket/Azure DevOps.
  - Removing a linked MCP plugin or deleting a marketplace can delete the underlying Team MCP server for both local users and Cloud Agents.
  - Publishing a personal skill moves it out of `~/.cursor/skills/` into the plugin install folder (1 skill = 1 plugin; referenced skills are not bundled; teammates opt in).
- **Coverage & untrusted-data check**: `AGENTS.md` handling and non-Cursor marketplace/native extension specs are `unverified` from these sources. Neither fetched file contained agent-directed instructions.
