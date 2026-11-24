# prompt-engineering

A portable Agent Plugins v1.0.0 package providing a shared, live-distilled **Prompting Reference Pack** (`reference/`) and two progressive-disclosure skills (`skill-creator` and `prompt-creator`) for Claude and open-weight model families.

## Contents

### Shared Reference Pack (`reference/`)

Every file under `reference/` is distilled from official Claude Platform documentation, open-weight model cards/vendor guides, and the Agent Plugins / Agent Skills specifications (see `reference/sources.md` for exact URLs and fetch dates). Claims are tagged `[Claude docs]`, `[Vendor]`, or `[General]`, and gaps where sources are silent are marked `unverified`.

Start with [`reference/README.md`](reference/README.md) for the full index (`01`–`15` + `sources.md`), confidence-tag definitions, and the "which file when" routing table.

### Skills (`skills/`)

Per the Agent Plugins v1.0.0 specification, skills are discovered from immediate subdirectories of `skills/`:

1. **`skills/skill-creator/`** — Creates and updates portable Agent Skills that follow the `agentskills.io` specification and the distilled Prompting Reference Pack.
   - `SKILL.md` — Thin trigger and progressive-disclosure entrypoint.
   - `authoring-guide.md` — Step-by-step authoring procedure.
   - `checklist.md` — Executable structural and prompting-hygiene verification checklist.
2. **`skills/prompt-creator/`** — Designs, versions, and tests prompts for Claude and open-weight models using the 8-section output contract (`Target` / `Spec` / `Prompt` / `Why` / `Settings` / `Tests` / `Changelog` / `Limitations`).
   - `SKILL.md` — Thin trigger and progressive-disclosure entrypoint.
   - `authoring-guide.md` — End-to-end prompt design, model-card settings, testing, and one-change-per-iteration workflow.
   - `checklist.md` — Format, confidence-tag, anti-pattern refusal, and self-check verification checklist.

## How Agents Load This Plugin

1. **Startup (Metadata):** The host loads `name` and `description` from each `skills/*/SKILL.md`.
2. **Activation (Thin Entrypoint):** When a task matches `skill-creator` or `prompt-creator`, the agent loads that skill's `SKILL.md`.
3. **Execution (On-Demand Guides & Reference):** `SKILL.md` directs the agent to read the skill's `authoring-guide.md` and `checklist.md`, then load only the relevant `reference/*.md` files for the target model family and task before drafting any prompt or skill instructions.

## Scope

- Schema: Agent Plugins `1.0.0` (`https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`).
- No `mcp.json` or MCP servers are included in this milestone.

## Changelog

### 1.0.0 (2026-11-24)
- Initial release of `prompt-engineering` plugin.
- Added 17-file live-distilled Prompting Reference Pack under `reference/` (`README.md`, `01`–`15`, `sources.md`).
- Added `skills/skill-creator` and `skills/prompt-creator`, each with thin `SKILL.md`, `authoring-guide.md`, and `checklist.md`.
- Added Agent Plugins 1.0.0 root `plugin.json`.
