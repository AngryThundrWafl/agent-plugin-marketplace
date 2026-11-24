# Skill Authoring Guide

Use this runtime procedure when creating, refactoring, or auditing an Agent Skill under `skills/<skill-name>/`. This document is a self-contained leaf guide; route to model or topic reference files directly from `SKILL.md`.

## Confidence Tags & Evidence Policy

Tag every prompting or behavioral claim in skill guides using the Prompting Reference Pack convention `[General]`:
- `[Claude docs]` — directly sourced from Anthropic Claude Platform documentation.
- `[Vendor]` — directly sourced from vendor documentation or model cards (Google Gemini, DeepSeek, Qwen, OpenAI, Meta).
- `[General]` — cross-source synthesis requiring empirical verification against evals.
- `unverified` — official sources are silent; keep gaps explicit rather than extrapolating from other models.

## Step 1: Clarify Use Case, Target Harnesses/Models, and Triggers

1. **Define success criteria first:** Write Specific, Measurable, Achievable, Relevant targets covering task fidelity, consistency, formatting, safety, and latency/cost before drafting instructions `[Claude docs]`.
2. **Identify target harnesses and packaging:**
   - Package as a standalone skill or portable plugin component at `skills/<skill-name>/SKILL.md` (per Agent Plugins `1.0.0`, plugin `name` allows `.` while skill `name` allows only lowercase alphanumeric characters and `-`, with no `.` and no `--`).
   - Include `compatibility` only when the skill genuinely requires specific runtimes, binaries, or network access; omit it otherwise (`agentskills.io`).
3. **Identify target models:** Determine whether the skill targets specific Claude models, Google Gemini models, open-weight families, or is model-agnostic `[General]`.
4. **Define trigger boundaries:** List concrete user phrases and task contexts that should activate the skill, plus near-neighbor requests that should stay outside its scope `[General]`.

## Step 2: Ground Instructions in Loaded Reference Files

Base all model-specific rules, sampling parameters, and thinking or tool guidance on the leaf reference file(s) routed directly from `SKILL.md` rather than memory `[General]`. When both a model-specific file and a general topic file apply, follow the model-specific file because model-specific behavior overrides general defaults `[Claude docs]`.

## Step 3: Plan Progressive-Disclosure Resources

Agent Skills load in three tiers (`agentskills.io`):
- **Tier 1 — Metadata (~100 tokens):** `name` and `description` loaded at startup for discovery across installed skills. Keep internal filesystem paths out of `description` so metadata stays readable in skill pickers `[General]`.
- **Tier 2 — Entrypoint (`SKILL.md`, < 5,000 tokens recommended):** Loaded upon activation. Keep `SKILL.md` under 500 lines (`agentskills.io`), and keep router `SKILL.md` files under 120 lines when paired with on-demand guides `[General]`.
- **Tier 3 — On-demand leaf resources:** Load only when the active task requires them:
  - `references/` — focused procedures, checklists, and domain docs (smaller, single-topic files save context).
  - `scripts/` — self-contained executable helpers with clear error messages and documented dependencies.
  - `assets/` — static templates, schemas, lookup tables, or images.

Keep all references **one level deep** from `SKILL.md` using relative paths (`agentskills.io`). Design every companion file and shared reference doc as a self-contained **leaf node** so agents avoid multi-hop chains (`SKILL.md` → Guide → Index → Doc A → Doc B) `[General]`.

## Step 4: Write Valid `SKILL.md` Frontmatter (`agentskills.io`)

Start `SKILL.md` (exact uppercase filename) on line 1 with `---`, a YAML mapping, and closing `---`. Use only the six allowed keys (`agentskills.io` / `skills-ref` reject unknown keys):

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | 1–64 chars; lowercase alphanumeric and single `-` only (`a-z`, `0-9`, `-`); no leading/trailing `-`; no `--`; exact match to parent directory name |
| `description` | Yes | 1–1024 non-empty chars; single line; omit `: ` (colon-space) and `<`/`>`; omit internal file paths; write in third person (`"Extracts text from PDFs..."`, not `"I can..."` or `"You can..."`) because it is injected into the system prompt `[Claude docs]`; state **what** the skill does, **when** to use it, and the concrete keywords users say |
| `license` | No | Short license name or bundled license filename |
| `compatibility` | No | 1–500 chars if present; include only when genuine runtime/package/network requirements exist |
| `metadata` | No | Mapping of string keys to **string** values (quote versions, e.g., `"1.1.0"`) |
| `allowed-tools` | No | Space-separated string of pre-approved tools (experimental; cross-harness support `unverified` beyond `agentskills.io` note) |

## Step 5: Write the Skill Body and Leaf Guides

Apply the distilled prompting practices from the reference pack:
1. **Be clear, explicit, and direct:** Assume zero implicit team context ("colleague test"); use numbered lists where step order or completeness matters `[Claude docs]`.
2. **Use positive framing:** State what the agent should do rather than bare prohibitions, and align prompt formatting with the desired output formatting `[Claude docs]`.
3. **Explain the "why":** Give motivation behind constraints so the agent generalizes cleanly to edge cases `[Claude docs]`.
4. **Use XML tags and examples selectively:** Wrap distinct sections, inputs, or examples in descriptive XML tags (`<instructions>`, `<context>`, `<examples>`) where separation prevents ambiguity, and include 3–5 diverse, relevant `<example>` blocks when enforcing strict output formats `[Claude docs]`.
5. **Tune tool and agent instructions neutrally:**
   - State explicitly whether the agent should act immediately or investigate and propose first `[Claude docs]`.
   - Use neutral triggers (`"Use [tool] when..."`) rather than aggressive legacy phrasing (`"CRITICAL: You MUST..."`) to prevent overtriggering on modern Claude models `[Claude docs]`.
   - Scope subagent spawning to parallel or isolated-context workstreams, and require reading files before editing or answering about their contents `[Claude docs]`.
6. **Keep model knowledge in one place:** Reference shared model docs from `SKILL.md` rather than duplicating model-card tables, sampling values, or API error lists inside skill guides, preventing drift and wasted context `[General]`.
7. **Match freedom to fragility:** Give high-freedom prose guidance for judgment-heavy tasks, templates or parameterized skeletons for patterned tasks, and exact commands or scripts for fragile, high-consequence operations `[Claude docs]`.
8. **Tag provenance where it matters:** When a skill makes claims about model behavior or prompting technique, tag them `[Claude docs]`, `[Vendor]`, or `[General]` and mark undocumented behavior `unverified`. Leave procedural steps untagged so tags stay meaningful.

## Step 6: Package Supporting Files and Verify Flat Links

For multi-step or high-rigor skills, keep `SKILL.md` as a thin router and place operational detail in focused leaf files under `references/` (for example, `references/authoring-guide.md` and `references/checklist.md`) `[General]`.

Verify every link from `SKILL.md`:
- Use relative paths from the skill root (`references/authoring-guide.md`, `scripts/check.sh`, or `../../reference/<file>.md` for shared plugin references).
- Ensure `SKILL.md` loads each companion file conditionally by task rather than forcing every file to load upfront `[General]`.
- Confirm companion files and shared reference docs contain zero second-hop links or unshipped local scratch paths `[General]`.
- Start every reference file longer than 100 lines with a short table of contents so a partial read still reveals its full scope `[Claude docs]`.

## Step 7: Validate

1. Run every check in the skill's verification checklist against the target skill directory (`SKILL.md`, guides, references, and links).
2. Run the official reference validator when available (`agentskills.io`):
   ```bash
   skills-ref validate ./skills/<skill-name>
   ```
3. When authoring inside a marketplace repository that provides a validation script (for example, `npm run build && npm test && npm run validate`), run it before committing:
   ```bash
   npm run build && npm test && npm run validate
   ```
4. If modifying a shipped plugin skill, bump `version` consistently across `plugin.json`, `.antigravity-plugin/plugin.json` (if present), `.claude-plugin/marketplace.json`, and `SKILL.md` `metadata.version` so harnesses refresh cached packages `[General]`.

## Step 8: Iterate with Evals

1. **Define measurable eval targets:** Pair automated checks with multidimensional success criteria across fidelity, consistency, tone/format, safety, and latency/cost `[Claude docs]`.
2. **Test triggers and outputs:** Build task-specific eval cases covering realistic prompts, edge cases (missing inputs, long inputs, ambiguous requests), and near-neighbor negative prompts that should stay outside the skill's triggers `[Claude docs]` `[General]`.
3. **Automate grading first:** Prefer deterministic code-based checks (frontmatter, schema, regex/structure) first, then rubric-driven LLM grading with discrete `<result>` outputs and thinking enabled on the grader `[Claude docs]`.
4. **Change one variable per iteration:** Edit one instruction, example, or description phrase at a time, re-run the eval set, and keep changes only when quality holds or improves across your success criteria `[General]`.
5. **Optimize latency and tokens last:** After quality meets threshold, trim redundant prose or tune model and `effort` while gating on the same eval suite `[Claude docs]` `[General]`.
