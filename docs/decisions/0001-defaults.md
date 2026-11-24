# ADR 0001: Repository Defaults and Environment Baseline

- **Date:** 2026-11-24
- **Status:** Accepted

## Decisions

1. **Marketplace name:** `agent-plugin-marketplace`
   - Derived from `git remote -v` (`https://github.com/AngryThundrWafl/agent-plugin-marketplace`).
   - Valid Agent Plugins name (kebab-case, 1-64 chars, `a-z` and `-`, alphanumeric at both ends, no `--` or `..`).
2. **Package manager & runtime:** `npm` (v12.2.3) on Node.js v22.23.5 LTS.
   - Tooling language: strict TypeScript (ESM), `vitest` test runner.
3. **Target harnesses:** GitHub Copilot, Claude Code, and Google Antigravity as first-class targets, with no extra harness-specific overrides requested in Phase 0. Cursor and other harnesses are documented as a sourced note only.
4. **Git & push policy:** Keep all commits local on branch `boring-bat`. Do not push without explicit user instruction.
   - Existing pre-Phase-0 commits (`eeff94e` and earlier) may be overwritten as needed per user confirmation during preflight.
5. **Subagent mechanism (Rule 1):**
   - Tool: `invoke_subagent` (using type `self` for full toolset including shell/network/file writes in isolated conversation contexts; up to 4 concurrent workers).
   - Model pin status: **untested** — `invoke_subagent` only accepts `Model` values `inherit | flash_lite | flash | pro` and exposes no `thinking_level` argument. Each brief states `Model: gemini-4-hydrogen` and `Thinking: high`, and spawns use the tool default (`inherit`).
6. **Available local CLIs (observed at Phase 0):**
   - `agy`: `/usr/local/bin/agy`
   - `copilot`: `/usr/local/bin/copilot`
   - `claude`: not on PATH
