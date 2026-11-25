# MCP-Dockhand Tool Allowlist and Guardrails

## Contents

- [Read-Only Monitoring and Validation Tools (33)](#read-only-monitoring-and-validation-tools-33)
- [Confirmation-Gated Lifecycle Tools (5)](#confirmation-gated-lifecycle-tools-5)
- [Excluded High-Risk Tools](#excluded-high-risk-tools)
- [Server-Side Filtering Upgrade Path](#server-side-filtering-upgrade-path)

## Read-Only Monitoring and Validation Tools (33)

Verified against `strausmann/mcp-dockhand` `v1.19.0` (`src/tools/meta.ts` and `src/openapi/tool-endpoint-map.ts`). In Antigravity (`mcp_config.json`), these are included in `enabledTools`; in Claude Code and Copilot, adhere to this allowlist via skill discipline or server-side filtering.

### MCP Server, Dockhand Health, and Host Metrics (8)

| Tool | Source / Endpoint | Purpose |
| --- | --- | --- |
| `get_server_info` | Meta tool | Reports `mcp-dockhand` version, protocol version, and Dockhand version |
| `self_check` | Meta tool | Verifies Dockhand health, auth validity, and per-environment Hawser reachability |
| `health_check` | `GET /api/health` | Confirms Dockhand API liveness |
| `health_check_database` | `GET /api/health/database` | Confirms Dockhand SQLite database health |
| `get_system_info` | `GET /api/system` | Reads Dockhand system metadata |
| `get_host_info` | `GET /api/host` | Reads Docker host info for an environment |
| `get_system_disk` | `GET /api/system/disk` | Checks host disk usage |
| `get_dashboard_stats` | `GET /api/dashboard/stats` | Summarizes containers, images, volumes, and stacks per environment |

### Environments, Stacks, and GitOps Sync (14)

| Tool | Source / Endpoint | Purpose |
| --- | --- | --- |
| `list_environments` | `GET /api/environments` | Lists all Dockhand environments and IDs |
| `get_environment` | `GET /api/environments/{id}` | Inspects environment labels and connection details |
| `list_stacks` | `GET /api/stacks` | Lists Compose stacks in an environment |
| `get_stack_compose` | `GET /api/stacks/{name}/compose` | Reads live Compose definition managed by Dockhand |
| `get_stack_sources` | `GET /api/stacks/sources` | Inspects stack source mappings |
| `get_stack_stats` | `GET /api/stack-stats` | Reads aggregate stack resource stats |
| `list_stack_deploys` | `GET /api/stacks/{name}/deploys` | Lists deploy run history for a stack |
| `get_stack_deploy` | `GET /api/stacks/{name}/deploys/{runId}` | Reads metadata and status for one deploy run |
| `get_stack_deploy_log` | `GET /api/stacks/{name}/deploys/{runId}/log` | Reads stdout/stderr log for a failed or recent deploy |
| `list_git_stacks` | `GET /api/git/stacks` | Lists all Git-backed stacks and their branches/paths |
| `get_git_stack` | `GET /api/git/stacks/{id}` | Inspects one Git stack's repo, branch, compose path, and sync state |
| `list_git_repositories` | `GET /api/git/repositories` | Lists configured Git repositories in Dockhand |
| `get_git_repository` | `GET /api/git/repositories/{id}` | Inspects a Git repository configuration |
| `get_git_repository_sync_status` | `GET /api/git/repositories/{id}/sync` | Triggers `git fetch` to compare Dockhand's clone against remote `main` |

### Container Status, Stats, Logs, and Activity (11)

| Tool | Source / Endpoint | Purpose |
| --- | --- | --- |
| `list_containers` | `GET /api/containers` | Lists all containers in an environment with state and health |
| `get_container` | `GET /api/containers/{id}` | Reads summary state for one container |
| `inspect_container` | `GET /api/containers/{id}/inspect` | Inspects image digest, mounts, healthcheck status, and restart policy (redact `Env` secrets in output) |
| `get_container_compose` | `GET /api/containers/{id}/compose` | Maps a container back to its Compose file/project |
| `get_container_logs` | `GET /api/containers/{id}/logs` | Fetches recent stdout/stderr lines for a container |
| `get_merged_logs` | `GET /api/logs/merged` | Fetches merged logs across containers in an environment |
| `get_container_stats` | `GET /api/containers/{id}/stats` | Captures one-shot CPU/memory/network/block-IO stats for one container |
| `get_containers_stats` | `GET /api/containers/stats` | Captures stats for all running containers in an environment |
| `get_container_activity` | `GET /api/activity/containers` | Reads container lifecycle events (starts, stops, health changes) |
| `get_activity_events` | `GET /api/activity/events` | Reads recent Dockhand activity events |
| `get_pending_updates` | `GET /api/containers/pending-updates` | Reads cached pending image-update records without triggering registry pulls |

## Confirmation-Gated Lifecycle Tools (5)

Only invoke these tools after presenting the target environment, container name/ID, current status, and intended effect, and receiving explicit user approval:

| Tool | Endpoint | Action |
| --- | --- | --- |
| `start_container` | `POST /api/containers/{id}/start` | Starts a stopped container |
| `stop_container` | `POST /api/containers/{id}/stop` | Gracefully stops a running container |
| `restart_container` | `POST /api/containers/{id}/restart` | Restarts an unhealthy or wedged container |
| `pause_container` | `POST /api/containers/{id}/pause` | Pauses container processes (cgroups freezer) |
| `unpause_container` | `POST /api/containers/{id}/unpause` | Resumes a paused container |

## Excluded High-Risk Tools

These `mcp-dockhand` tools are intentionally omitted from `enabledTools` and avoided across all harnesses:

- **Container exec and filesystem access:** `exec_container`, `run_container_exec`, `get_container_shells`, `list_container_files`, `get_container_file_content`, `create_container_file`, `write_container_file_content`, `delete_container_file`, `chmod_container_file`, `chown_container_file`, `upload_container_file`, `download_container_file`, `list_system_files`, `get_system_file_content`, `write_system_file`.
- **Stack deploys, mutations, and pruning:** `deploy_git_stack`, `deploy_git_stack_stream`, `deploy_stack`, `down_stack`, `start_stack`, `stop_stack`, `restart_stack`, `sync_git_stack`, `sync_git_repository`, `create_*`, `update_*`, `delete_*`, `remove_*`, `prune_*`, `batch_*`.
- **Secrets, auth, and backups:** `get_stack_env_raw`, `*_auth_*`, `*_user*`, `*_role*`, `*_credential*`, `*_secret_provider*`, `*_backup_*`.

## Server-Side Filtering Upgrade Path

`mcp-dockhand` `v1.19.0` does not yet expose `MCP_READ_ONLY` or `MCP_TOOLS_ALLOW` environment variables (added in newer upstream commits on `main`). When upgrading `mcp-dockhand` to a release supporting `MCP_TOOLS_ALLOW`, you can enforce the exact same 38-tool allowlist at the server boundary for every client (including Claude Code and GitHub Copilot):

```bash
MCP_TOOLS_ALLOW=get_server_info,self_check,health_check,health_check_database,get_system_info,get_host_info,get_system_disk,get_dashboard_stats,list_environments,get_environment,list_stacks,get_stack_compose,get_stack_sources,get_stack_stats,list_stack_deploys,get_stack_deploy,get_stack_deploy_log,list_git_stacks,get_git_stack,list_git_repositories,get_git_repository,get_git_repository_sync_status,list_containers,get_container,inspect_container,get_container_compose,get_container_logs,get_merged_logs,get_container_stats,get_containers_stats,get_container_activity,get_activity_events,get_pending_updates,start_container,stop_container,restart_container,pause_container,unpause_container
```
