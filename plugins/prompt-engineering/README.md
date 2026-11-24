# prompt-engineering

A portable Agent Plugins v1.0.0 and Google Antigravity v1 package providing a shared, live-distilled **Prompting Reference Pack** (`reference/`) and two progressive-disclosure skills (`skill-creator` and `prompt-creator`) for Claude, Google Gemini, and open-weight model families.

## Contents

### Shared Reference Pack (`reference/`)

Every file under `reference/` is a self-contained, single-topic **leaf document** distilled from official Claude Platform documentation, Google Gemini API docs and DeepMind model cards, open-weight model cards/vendor guides, and the Agent Plugins / Agent Skills specifications (see `reference/sources.md` for exact URLs and fetch dates). Claims are tagged `[Claude docs]`, `[Vendor]`, or `[General]`, and gaps where sources are silent are marked `unverified`.

See [`reference/README.md`](reference/README.md) for the human/maintainer catalog of all 22 files (`README.md`, `sources.md`, `01`, `03`–`21`).

### Skills (`skills/`)

Per the Agent Plugins v1.0.0 specification, skills are discovered from immediate subdirectories of `skills/`:

1. **`skills/skill-creator/`** — Creates, updates, and audits portable Agent Skills that follow the `agentskills.io` specification and the distilled Prompting Reference Pack.
   - `SKILL.md` — Thin trigger and one-level-deep progressive-disclosure router.
   - `references/authoring-guide.md` — Step-by-step leaf authoring procedure.
   - `references/checklist.md` — Reusable structural, progressive-disclosure, and prompting-hygiene verification checklist.
2. **`skills/prompt-creator/`** — Designs, versions, and tests prompts for Claude, Google Gemini, and open-weight models using the 8-section output contract (`Target` / `Spec` / `Prompt` / `Why` / `Settings` / `Tests` / `Changelog` / `Limitations`).
   - `SKILL.md` — Thin trigger and one-level-deep progressive-disclosure router.
   - `references/authoring-guide.md` — End-to-end leaf workflow and 8-section output contract.
   - `references/checklist.md` — Binary deliverable verification checklist grounded in loaded reference files.

## How Agents Load This Plugin

1. **Startup (Metadata):** The host loads `name` and `description` from each `skills/*/SKILL.md`.
2. **Activation (Thin Router):** When a task matches `skill-creator` or `prompt-creator`, the agent loads that skill's `SKILL.md`.
3. **Execution (Flat, On-Demand Leaf Loading):** `SKILL.md` routes directly (one level deep, no nested reference chains) to only the needed skill guide (`references/authoring-guide.md` or `references/checklist.md`) and the matching `reference/*.md` leaf file(s) for the target model family and task.

## Scope & Manifests

- Portable manifest: `plugin.json` (`https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`).
- Antigravity manifest: `.antigravity-plugin/plugin.json` (`https://antigravity.google/schemas/v1/plugin.json`).
- No `mcp.json` / `mcp_config.json` servers are included in this plugin.

## Changelog

### 1.4.0 (2026-11-24)
- Added Google Gemini model-specific leaf reference guides (`reference/20-gemini-4.md` for `gemini-4-carbon`, `gemini-4-neon`, `gemini-4-hydrogen`, `gemini-4-argon` and `reference/21-gemini-3-8-flash.md` for `gemini-3.8-flash`) grounded in Google Gemini API documentation and DeepMind model cards.
- Updated `reference/sources.md`, `reference/10-model-delta-matrix.md`, `reference/03-overlap-and-porting.md`, and `reference/README.md` (catalog expanded to 22 files; broadened `[Vendor]` tag scope to cover first-party Gemini docs alongside open-weight vendor cards).
- Updated `skills/prompt-creator/` and `skills/skill-creator/` routing tables, authoring guides, plugin manifests, and marketplace metadata to route directly to Gemini 4 and Gemini 3.8 Flash leaf references.

### 1.3.0 (2026-11-24)
- Rewrote both skill `description`s in third person with concrete trigger keywords (model families, prompt porting, skill review).
- Added an Audit Mode section to `skill-creator/SKILL.md`, plus authoring rules and checklist gates for third-person descriptions, matching freedom to task fragility, and tables of contents in files over 100 lines; scoped the provenance-tag gate to skills that make model-behavior claims.
- Merged the duplicated output contract and skeleton in `prompt-creator/references/authoring-guide.md` (now under 100 lines), removed tags from procedural steps, and replaced the duplicated tag reference in `prompt-creator/references/checklist.md` with a pointer.
- Added `Contents:` indexes to `reference/05`, `11`, `12`, and `13` (files over 100 lines).

### 1.2.0 (2026-11-24)
- Folded open-weight starter skeletons from `reference/04-templates.md` into their per-family leaf guides (`16-deepseek-r1.md`, `17-qwen3.md`, `18-gpt-oss.md`, `19-llama.md`), scoping `04-templates.md` cleanly to Claude starter skeletons and eliminating duplicated sampling values.
- Removed remaining external-fetch prompts, inline external URLs, and stale phrasing/metadata across `reference/01-claude-core.md`, `03-overlap-and-porting.md`, `10-model-delta-matrix.md`, `12-opus-5-5.md`, `13-sonnet-5-5.md`, and `15-legacy-models.md`.
- Made `skill-creator` validation instructions repo-portable, aligned the `checklist.md` eval-plan gate with lean runtime `SKILL.md` separation of concerns, and fixed minor tag-syntax wording in `prompt-creator`.

### 1.1.0 (2026-11-24)
- Flattened both skills (`skill-creator` and `prompt-creator`) to strict one-level-deep progressive disclosure with task-scoped on-demand loading directly from `SKILL.md`.
- Moved skill companion guides and checklists under conventional `skills/<name>/references/` directories.
- Removed duplicated model-card tables, sampling values, API error lists, and meta self-checks from `prompt-creator/references/authoring-guide.md` and `prompt-creator/references/checklist.md`; added provenance tags and neutral positive framing.
- Split `reference/02-open-weight.md` into four per-family leaf guides (`16-deepseek-r1.md`, `17-qwen3.md`, `18-gpt-oss.md`, `19-llama.md`) and streamlined `04-templates.md` (retiring the duplicate checklist section).
- Eliminated inter-file reference chains, `.cache/` filename leaks, inline external links, and external-fetch prompts across `reference/*.md`, and documented `.antigravity-plugin/plugin.json`.

### 1.0.0 (2026-11-24)
- Initial release of `prompt-engineering` plugin.
- Added 17-file live-distilled Prompting Reference Pack under `reference/` (`README.md`, `01`–`15`, `sources.md`).
- Added `skills/skill-creator` and `skills/prompt-creator`, each with thin `SKILL.md`, `authoring-guide.md`, and `checklist.md`.
- Added Agent Plugins 1.0.0 root `plugin.json` and `.antigravity-plugin/plugin.json`.
