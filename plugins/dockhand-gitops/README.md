# dockhand-gitops

Portable Agent Plugin (`Agent Plugins v1.0.0`, `Google Antigravity v1`, and `Claude Code`) for observing, validating, and safely managing multi-host GitOps Docker stacks via [`strausmann/mcp-dockhand`](https://github.com/strausmann/mcp-dockhand).

## Prerequisites

- A running `mcp-dockhand` (`v1.19.0+`) Streamable HTTP endpoint (for example, `https://intel-nuc.<tailnet>.ts.net/mcp` fronted by Tailscale Serve).
- Environment variables (or Antigravity plugin variables) available to the agent runtime:
  - `DOCKHAND_MCP_URL` — full `/mcp` endpoint URL.
  - `DOCKHAND_MCP_AUTH_TOKEN` — Bearer token matching `MCP_AUTH_TOKEN` on `mcp-dockhand`.
- Access to the GitOps Compose repository (local checkout or `gh` CLI) for desired-state comparison.

## Per-Harness Setup

| Harness | Manifest / MCP Config | Setup Notes |
| --- | --- | --- |
| **Google Antigravity** (`agy`) | `.antigravity-plugin/plugin.json` + `mcp_config.json` | Installs disabled until `DOCKHAND_MCP_URL` and `DOCKHAND_MCP_AUTH_TOKEN` are configured under `/plugin` or Customizations UI. `mcp_config.json` enforces the 38-tool `enabledTools` allowlist (`33` read/diagnostic + `5` container lifecycle tools). |
| **Claude Code** | `.claude-plugin/marketplace.json` + `.mcp.json` | Reads `${DOCKHAND_MCP_URL}` and `${DOCKHAND_MCP_AUTH_TOKEN}` directly from environment variables. |
| **GitHub Copilot** | `plugin.json` (skills-only MCP) | Agent Plugins `1.0.0` `mcp.json` forbids credential headers and `${VAR}` URL placeholders, so `mcp.json` is intentionally omitted. Configure the MCP server in `~/.copilot/mcp-config.json` (see below). |

### GitHub Copilot Manual MCP Configuration

Add the `dockhand` server to `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "dockhand": {
      "type": "http",
      "url": "https://intel-nuc.<tailnet>.ts.net/mcp",
      "headers": {
        "Authorization": "Bearer ${DOCKHAND_MCP_AUTH_TOKEN}"
      }
    }
  }
}
```

### Optional Server-Side Filtering (`mcp-dockhand` Newer Than `v1.19.0`)

`mcp-dockhand` `v1.19.0` exposes the full Dockhand API on the server side, so Antigravity relies on `enabledTools` in [`mcp_config.json`](mcp_config.json) and Claude Code / Copilot rely on skill guardrails. When running a newer `mcp-dockhand` release that supports `MCP_TOOLS_ALLOW`, you can mirror the exact 38-tool allowlist on the server via `MCP_TOOLS_ALLOW` (see [`skills/dockhand-gitops/references/tools-and-guardrails.md`](skills/dockhand-gitops/references/tools-and-guardrails.md)).

## Contents

- `plugin.json` — Agent Plugins `v1.0.0` manifest.
- `.antigravity-plugin/plugin.json` — Google Antigravity `v1` manifest with `displayName` and `suggestedPrompts`.
- `mcp_config.json` — Antigravity Streamable HTTP config (`serverUrl`, `Authorization` Bearer header, `variables`, `enabledTools`).
- `.mcp.json` — Claude Code HTTP MCP config (`${DOCKHAND_MCP_URL}` and `${DOCKHAND_MCP_AUTH_TOKEN}`).
- `skills/dockhand-gitops/SKILL.md` — End-to-end GitOps validation and confirmation-gated container lifecycle workflow.
- `skills/dockhand-gitops/references/tools-and-guardrails.md` — Verified `v1.19.0` 38-tool allowlist and excluded high-risk tools.
- `skills/dockhand-gitops/references/gitops-validation.md` — GitOps topology, desired-vs-live validation checklist, and report template.

## Changelog

### 1.0.1 (2026-11-25)
- Improved prompting hygiene in `SKILL.md` and `references/gitops-validation.md` with positive framing, explicit rationale for confirmation gating, secret redaction, and prompt-injection defense, plus `inspect_container` post-recovery verification.
- Generalized GitOps repository and host topology discovery in `SKILL.md`, `references/gitops-validation.md`, and `.antigravity-plugin/plugin.json` `suggestedPrompts`.
- Added copy-pasteable `MCP_TOOLS_ALLOW` 38-tool list in `references/tools-and-guardrails.md` and fixed the Antigravity CLI label in `README.md`.

### 1.0.0 (2026-11-25)
- Initial release of `dockhand-gitops` with dual plugin manifests (`plugin.json` and `.antigravity-plugin/plugin.json`), Antigravity `mcp_config.json`, Claude Code `.mcp.json`, and the `dockhand-gitops` skill with one-level-deep reference guides.
- Scoped `enabledTools` in `mcp_config.json` to 33 read/diagnostic tools and 5 confirmation-gated container lifecycle tools (`start_container`, `stop_container`, `restart_container`, `pause_container`, `unpause_container`) verified against `strausmann/mcp-dockhand` `v1.19.0`.
