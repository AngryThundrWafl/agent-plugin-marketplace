---
name: skill-creator
description: Create, update, and audit portable Agent Skills following the agentskills.io specification and the plugin's distilled Prompting Reference Pack. Use when authoring a new skill, refactoring SKILL.md, structuring progressive-disclosure references, or validating skill compliance.
metadata:
  version: "1.2.0"
---

# Skill Creator

Author, refactor, and audit portable Agent Skills (`skills/<skill-name>/SKILL.md`) conforming to the `agentskills.io` specification, Agent Plugins v1.0.0 packaging rules, and the shared Prompting Reference Pack.

## On-Demand Loading (One-Level-Deep)

Load only the resources needed for the active task so startup and runtime context stay lean:

- **Creating or refactoring a skill:** Read [references/authoring-guide.md](references/authoring-guide.md) for the 8-step authoring procedure.
- **Auditing or verifying a skill:** Read [references/checklist.md](references/checklist.md) for the pass/fail verification rubric.
- **Writing model- or task-specific prompting instructions:** Read **only** the matching leaf file(s) below directly from `SKILL.md`. Load model-specific files (`11`–`19`) before general files (`01`, `03`–`09`), since model-specific behavior overrides general defaults.

| Target / Topic | Leaf Reference File |
| --- | --- |
| Claude Fable 5.2 / Mythos 5.2 overrides | [../../reference/11-fable-5-2.md](../../reference/11-fable-5-2.md) |
| Claude Opus 5.5 overrides | [../../reference/12-opus-5-5.md](../../reference/12-opus-5-5.md) |
| Claude Sonnet 5.5 overrides | [../../reference/13-sonnet-5-5.md](../../reference/13-sonnet-5-5.md) |
| Claude Haiku 5.5 overrides | [../../reference/14-haiku-5-5.md](../../reference/14-haiku-5-5.md) |
| Legacy Claude (Fable 5.1/5, Opus 5/4.8, Sonnet 5) | [../../reference/15-legacy-models.md](../../reference/15-legacy-models.md) |
| DeepSeek-R1 & DeepSeek-R1-0528 | [../../reference/16-deepseek-r1.md](../../reference/16-deepseek-r1.md) |
| Qwen3 (`235B-A22B`, `32B`, `2507` variants) | [../../reference/17-qwen3.md](../../reference/17-qwen3.md) |
| OpenAI `gpt-oss` (`120b`, `20b`) & Harmony | [../../reference/18-gpt-oss.md](../../reference/18-gpt-oss.md) |
| Meta Llama 3.3 & Llama 4 (`Scout`, `Maverick`) | [../../reference/19-llama.md](../../reference/19-llama.md) |
| Claude core principles (clarity, XML, few-shot, long context) | [../../reference/01-claude-core.md](../../reference/01-claude-core.md) |
| Cross-family overlap & porting rules | [../../reference/03-overlap-and-porting.md](../../reference/03-overlap-and-porting.md) |
| Condensed Claude prompt skeletons | [../../reference/04-templates.md](../../reference/04-templates.md) |
| Output formatting, prefill migration, JSON structured outputs | [../../reference/05-output-and-formatting.md](../../reference/05-output-and-formatting.md) |
| Adaptive thinking, `output_config.effort`, caching | [../../reference/06-thinking-and-effort.md](../../reference/06-thinking-and-effort.md) |
| Tool steering, parallelism, subagents, coding guardrails | [../../reference/07-tools-and-agents.md](../../reference/07-tools-and-agents.md) |
| Hallucination reduction, consistency, injection & leak defenses | [../../reference/08-guardrails.md](../../reference/08-guardrails.md) |
| Success criteria, evals, automated grading, latency tuning | [../../reference/09-evals-and-latency.md](../../reference/09-evals-and-latency.md) |
| Side-by-side cross-model delta matrix | [../../reference/10-model-delta-matrix.md](../../reference/10-model-delta-matrix.md) |
| Source provenance & fetch dates | [../../reference/sources.md](../../reference/sources.md) |

## Workflow Summary

1. **Clarify scope & triggers:** Define success criteria, target harnesses/models, and trigger/non-trigger boundaries.
2. **Ground in leaf references:** Load only the matching reference file(s) from the table above before drafting instructions.
3. **Structure progressive disclosure:** Keep `SKILL.md` thin and route directly (one level deep) to self-contained leaf files under `references/`, `scripts/`, `assets/`, or shared plugin references.
4. **Author valid frontmatter:** Use only allowed `agentskills.io` keys, match `name` to the parent directory, and write a clean single-line `description` with triggers.
5. **Write clear, positive guides:** Explain rationale ("why"), use neutral tool triggers, tag claims `[Claude docs]`, `[Vendor]`, `[General]`, or `unverified`, and link rather than duplicate model rules.
6. **Validate & iterate:** Verify every gate in [references/checklist.md](references/checklist.md), run repository/CLI validators, and refine one variable per iteration against evals.
