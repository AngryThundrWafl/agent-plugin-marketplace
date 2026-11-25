---
name: dockhand-gitops
description: Observe, validate, and troubleshoot multi-host GitOps Docker stacks and containers through mcp-dockhand across Dockhand environments, Compose definitions, and Hawser agents. Use when auditing stack drift, checking container health or logs, verifying Git sync status, or safely restarting unhealthy containers.
license: MIT
compatibility: Requires mcp-dockhand (v1.19.0+) reachable via DOCKHAND_MCP_URL with DOCKHAND_MCP_AUTH_TOKEN, plus a local checkout or GitHub access to the GitOps Compose repository.
metadata:
  version: "1.0.1"
---

# Dockhand GitOps

Observe and validate the multi-host homelab GitOps stack via `mcp-dockhand`, comparing desired Compose definitions against live Dockhand state and guarding any container lifecycle action behind explicit confirmation.

## Guardrails

- **Default to read-only observation:** Inspect environments, stacks, Git sync status, containers, stats, and logs before proposing any change, so validation runs never alter live workloads unexpectedly.
- **Confirm before container lifecycle changes:** Present the target environment, container name, current state, and reason, and wait for explicit user approval before calling `start_container`, `stop_container`, `restart_container`, `pause_container`, or `unpause_container`, so running services are not disrupted or restarted before root causes are reviewed.
- **Redact secrets from outputs:** Mask `Env` secret values from `inspect_container` and token values from environment variables when summarizing config keys, so credentials are not exposed in chat transcripts or logs.
- **Respect filtered tool boundaries:** Load [references/tools-and-guardrails.md](references/tools-and-guardrails.md) when you need the exact 38-tool allowlist (`33` read/diagnostic + `5` lifecycle), excluded write tools, or `mcp-dockhand` troubleshooting notes.

## End-to-End Validation Workflow

Load [references/gitops-validation.md](references/gitops-validation.md) when running a full-stack audit or checking expected host/stack layout and report structure.

1. **Verify MCP and Dockhand reachability:**
   - Call `get_server_info` and `self_check` (or `health_check` + `list_environments`) to confirm `mcp-dockhand` connectivity, auth validity, and Hawser agent reachability for every host environment.
2. **Collect desired GitOps state:**
   - Identify the active GitOps repository and target branch from `list_git_repositories` / `list_git_stacks`, then read the local checkout (e.g., `core/`, `hosts/<host>/<stack>/compose.yaml`, `shared/<service>/compose.yaml`) or fall back to `gh` against the repository's configured branch when no local checkout is present.
   - Record each stack's expected Compose `name:`, service names, pinned `image: tag@sha256:digest`, and healthcheck expectations.
3. **Inspect live Dockhand state per environment:**
   - Query `list_environments`, `list_git_stacks`, `list_git_repositories`, and `list_stacks` to verify every expected stack exists and points to the expected branch.
   - Check `get_git_repository_sync_status` (when checking remote sync), `list_stack_deploys`, and `get_stack_compose` to detect sync failures, failed deploys, or Compose drift.
   - Query `list_containers`, `get_containers_stats`, and `get_pending_updates` per environment to check running state, Docker healthchecks, restart counts, and resource pressure.
4. **Deep-dive anomalies:**
   - For any stopped, restarting, unhealthy, or missing container, call `inspect_container` and `get_container_logs` (plus `get_stack_deploy_log` if a recent deploy failed) and summarize root causes concisely.
5. **Report and confirm remediation:**
   - Return a structured summary (`Environments` -> `GitOps Stacks & Drift` -> `Container Health & Logs` -> `Proposed Actions`).
   - If a container needs `restart_container`, `start_container`, `stop_container`, `pause_container`, or `unpause_container`, ask the user for confirmation first; after approval, execute the lifecycle tool and re-check `get_container`, `inspect_container` (health status), and `get_container_logs` to confirm recovery.
