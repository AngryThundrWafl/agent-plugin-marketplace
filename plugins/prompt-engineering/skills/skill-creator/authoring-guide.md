# Skill Authoring Guide

Use this runtime procedure when creating or updating an Agent Skill under `skills/<skill-name>/`. Tags follow the Prompting Reference Pack convention: `[Claude docs]` = sourced from Claude Platform docs, `[Vendor]` = sourced from open-weight vendor cards/docs, `[General]` = cross-source synthesis requiring eval verification, `unverified` = source material is silent.

## Confidence Tags & Evidence Policy

Every prompting or behavioral claim in `authoring-guide.md` and `checklist.md` uses the Prompting Reference Pack tags:
- `[Claude docs]` — directly sourced from Anthropic Claude Platform documentation.
- `[Vendor]` — directly sourced from open-weight vendor model cards or guides.
- `[General]` — cross-source synthesis requiring verification against evals.
- `unverified` — official sources are silent; never extrapolated from other models.

## Step 1: Clarify Use Case, Target Harnesses/Models, and Triggers

1. **Define success criteria first:** Write Specific, Measurable, Achievable, Relevant targets covering task fidelity, consistency, formatting, safety, and latency/cost before drafting instructions `[Claude docs]`.
2. **Identify target harnesses and packaging:**
   - Standalone skill or portable plugin component under `skills/<skill-name>/SKILL.md` (per Agent Plugins `1.0.0`, plugin `name` allows `.` while skill `name` allows only lowercase alphanumeric characters and `-`, no `.` and no `--`).
   - Confirm whether `compatibility` is actually needed (omit unless the skill requires specific runtimes, binaries, or network access; `agentskills.io` notes most skills do not need it).
3. **Identify target models:** Determine whether the skill targets Claude models (Fable 5.2, Mythos 5.2, Opus 5.5, Sonnet 5.5, Haiku 5.5, or earlier models), open-weight models (DeepSeek-R1, Qwen3, `gpt-oss`, Llama 3.3/4), or is model-agnostic `[General]`.
4. **Define trigger boundaries:** List concrete user phrases and file/task contexts that should activate the skill, plus near-neighbor tasks that should not `[General]`.

## Step 2: Read Relevant `../../reference/` Files Before Drafting

Never write model-specific rules, sampling parameters, or thinking/tool guidance from memory `[General]`. Read model-specific files **first** because model-specific behavior overrides general defaults `[Claude docs]`.

| Need / Target | Read First |
| --- | --- |
| Clarity, motivation ("why"), XML tags, few-shot, long context, legacy migration | [01-claude-core.md](../../reference/01-claude-core.md) |
| DeepSeek-R1/0528, Qwen3, OpenAI `gpt-oss` Harmony, Llama 3.3 & 4 | [02-open-weight.md](../../reference/02-open-weight.md) |
| Verbosity, markdown vs. prose, JSON structured outputs, prefill removal | [05-output-and-formatting.md](../../reference/05-output-and-formatting.md) |
| Adaptive vs. manual thinking, `effort`, `budget_tokens` deprecation, preserved thinking | [06-thinking-and-effort.md](../../reference/06-thinking-and-effort.md) |
| Tool-use steering, parallelism, long-horizon state, subagents, coding guardrails | [07-tools-and-agents.md](../../reference/07-tools-and-agents.md) |
| Hallucination reduction, consistency, prompt-injection & prompt-leak defenses | [08-guardrails.md](../../reference/08-guardrails.md) |
| Success criteria, test design, code/LLM grading, latency/TTFT trade-offs | [09-evals-and-latency.md](../../reference/09-evals-and-latency.md) |
| Claude Fable 5.2 / Mythos 5.2 overrides | [11-fable-5-2.md](../../reference/11-fable-5-2.md) |
| Claude Opus 5.5 overrides | [12-opus-5-5.md](../../reference/12-opus-5-5.md) |
| Claude Sonnet 5.5 overrides | [13-sonnet-5-5.md](../../reference/13-sonnet-5-5.md) |
| Claude Haiku 5.5 overrides | [14-haiku-5-5.md](../../reference/14-haiku-5-5.md) |
| Earlier Claude 4.8 / 5 / 5.1 models and migrations | [15-legacy-models.md](../../reference/15-legacy-models.md) |

## Step 3: Plan Progressive-Disclosure Resources

Agent Skills load in three tiers (`agentskills.io`):
- **Tier 1 — Metadata (~100 tokens):** `name` and `description` loaded at startup for discovery across all installed skills.
- **Tier 2 — Instructions (< 5,000 tokens recommended):** `SKILL.md` body loaded upon activation. Keep `SKILL.md` under 500 lines (`agentskills.io`), and keep trigger/router `SKILL.md` files under 120 lines when paired with runtime guides `[General]`.
- **Tier 3 — Resources (on demand):** Load detailed workflows, checklists, docs, scripts, or templates only when needed:
  - `authoring-guide.md` and `checklist.md` (for complex workflow skills)
  - `references/` (focused domain/technical docs—smaller files consume less context)
  - `scripts/` (self-contained executable helpers with clear error messages and documented dependencies)
  - `assets/` (static templates, schemas, lookup tables, images)

Keep skill-local file references **one level deep** from `SKILL.md` using relative paths; avoid deeply nested reference chains (`agentskills.io`).

## Step 4: Write Legal `SKILL.md` Frontmatter (`agentskills.io`)

Start `SKILL.md` (exact uppercase filename) with `---`, a YAML mapping, and closing `---`. Only six keys are allowed (`agentskills.io` / `skills-ref` reject unknown keys):

| Field | Required | Rules |
| --- | --- | --- |
| `name` | Yes | 1–64 chars; lowercase alphanumeric and `-` only (`a-z`, `0-9`, `-`); no leading/trailing `-`; no `--`; must match parent directory name exactly |
| `description` | Yes | 1–1024 non-empty chars; single line `[General]`; no `: ` (colon-space) and no `<` or `>` `[General]`; states **what** the skill does, **when** to use it, and trigger keywords |
| `license` | No | Short license name or bundled license filename |
| `compatibility` | No | 1–500 chars if present; include only when genuine runtime/package/network requirements exist |
| `metadata` | No | Mapping of string keys to **string** values (quote versions, e.g., `"1.0.0"`) |
| `allowed-tools` | No | Space-separated string of pre-approved tools (experimental; cross-harness support `unverified` beyond `agentskills.io` note) |

## Step 5: Write the Skill Body and Runtime Guides

Apply the distilled prompting practices from `../../reference/`:
1. **Be clear, explicit, and direct:** Assume zero implicit team context ("colleague test"); use numbered lists where step order or completeness matters `[Claude docs]`.
2. **Use positive framing:** State what the agent should do rather than bare prohibitions, and align prompt formatting with desired output formatting `[Claude docs]`.
3. **Explain the "why":** Give motivation behind constraints so the agent generalizes cleanly to edge cases `[Claude docs]`.
4. **Use XML tags and examples selectively:** Wrap distinct sections, inputs, or examples in descriptive XML tags (`<instructions>`, `<context>`, `<examples>`) where separation prevents ambiguity `[Claude docs]`. Include 3–5 diverse, relevant `<example>` blocks when enforcing strict output formats `[Claude docs]`.
5. **Tune tool and agent instructions neutrally:**
   - State whether the agent should act immediately or investigate/propose first `[Claude docs]`.
   - Use neutral tool triggers (`"Use [tool] when..."`) instead of aggressive legacy phrasing (`"CRITICAL: You MUST..."`) to avoid overtriggering `[Claude docs]`.
   - Constrain subagent spawning to parallel or isolated-context workstreams, and forbid guessing unopened file contents or fabricating checks `[Claude docs]`.
6. **Do not duplicate model knowledge:** Never copy model-card tables, sampling values, or API parameter rules into skill files—link to the relevant `../../reference/*.md` file instead `[General]`.
7. **Tag provenance and mark gaps:** Tag prompting and behavioral claims `[Claude docs]`, `[Vendor]`, or `[General]`, and mark undocumented behavior `unverified` rather than extrapolating `[General]`.

## Step 6: Package Complex Workflow Skills and Check Links

For multi-step or high-rigor skills, keep `SKILL.md` as a thin entrypoint and split operational detail into:
- `authoring-guide.md` — concrete step-by-step execution guide.
- `checklist.md` — executable pass/fail verification rubric.

Check every link in `SKILL.md` and companion files:
- Use relative paths from the skill root (`authoring-guide.md`, `references/guide.md`, `scripts/check.sh`).
- Keep skill-local references one level deep (`agentskills.io`).
- Point cross-skill prompting knowledge to `../../reference/<file>.md` rather than duplicating it `[General]`.

## Step 7: Validate

1. Run every check in [checklist.md](checklist.md) against the skill directory (`SKILL.md`, guides, references, and links).
2. Run the official reference validator when available (`agentskills.io`):
   ```bash
   skills-ref validate ./skills/<skill-name>
   ```
3. In this repository, run the full build, test, and marketplace validator before committing:
   ```bash
   npm run build && npm test && npm run validate
   ```
4. If modifying a shipped plugin skill, bump `version` consistently across `plugin.json`, `.antigravity-plugin/plugin.json` (if present), and `.claude-plugin/marketplace.json` `[General]`.

## Step 8: Iterate with Evals

1. **Define measurable eval targets:** Pair automated checks with multidimensional success criteria across fidelity, consistency, tone/format, safety, and latency/cost `[Claude docs]`.
2. **Test triggers and outputs:** Build task-specific eval cases covering realistic prompts, edge cases (missing inputs, long inputs, ambiguous requests), and near-neighbor negative prompts that should *not* trigger the skill `[Claude docs]` / `[General]`.
3. **Automate grading first:** Prefer deterministic code-based checks (frontmatter, schema, regex/structure) first, then rubric-driven LLM grading with discrete `<result>` outputs and thinking enabled on the grader `[Claude docs]`.
4. **Change one variable per iteration:** Edit one instruction, example, or description phrase at a time, re-run the eval set, and keep changes only when quality holds or improves across your success criteria `[General]`.
5. **Optimize latency/tokens last:** Only after quality meets threshold, trim redundant prose or adjust model/`effort` while gating on the same eval suite `[Claude docs]` / `[General]`.
