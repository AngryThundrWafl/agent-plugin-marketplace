---
name: prompt-creator
description: Design, version, and test prompts for Claude and open-weight models using live-distilled model guides, refusing known family anti-patterns and returning Target, Spec, Prompt, Why, Settings, Tests, Changelog, and Limitations. Use when creating, tuning, or migrating prompts.
metadata:
  version: "1.2.0"
---

# Prompt Creator

Follow a spec-first, reference-grounded, one-change-per-iteration workflow to design, version, and test prompts for Claude and open-weight models.

## On-Demand Loading (One-Level-Deep)

Load only the resources needed for the active task so context stays focused on the target model:

- **Creating, tuning, or migrating a prompt:** Read [references/authoring-guide.md](references/authoring-guide.md) for the 7-step workflow and 8-section output contract.
- **Verifying a prompt deliverable before returning:** Read [references/checklist.md](references/checklist.md) to run every pass/fail gate.
- **Grounding in model & topic rules:** Read **only** the matching leaf file(s) below directly from `SKILL.md` before drafting. Load the target model file (`11`–`19`) first because model-specific behavior overrides general defaults (`01`, `03`–`09`).

| Target / Topic | Leaf Reference File |
| --- | --- |
| Claude Fable 5.2 / Mythos 5.2 | [../../reference/11-fable-5-2.md](../../reference/11-fable-5-2.md) |
| Claude Opus 5.5 | [../../reference/12-opus-5-5.md](../../reference/12-opus-5-5.md) |
| Claude Sonnet 5.5 | [../../reference/13-sonnet-5-5.md](../../reference/13-sonnet-5-5.md) |
| Claude Haiku 5.5 | [../../reference/14-haiku-5-5.md](../../reference/14-haiku-5-5.md) |
| Legacy Claude (Fable 5.1/5, Opus 5/4.8, Sonnet 5) | [../../reference/15-legacy-models.md](../../reference/15-legacy-models.md) |
| DeepSeek-R1 & DeepSeek-R1-0528 | [../../reference/16-deepseek-r1.md](../../reference/16-deepseek-r1.md) |
| Qwen3 (`235B-A22B`, `32B`, `2507` variants) | [../../reference/17-qwen3.md](../../reference/17-qwen3.md) |
| OpenAI `gpt-oss` (`120b`, `20b`) & Harmony | [../../reference/18-gpt-oss.md](../../reference/18-gpt-oss.md) |
| Meta Llama 3.3 & Llama 4 (`Scout`, `Maverick`) | [../../reference/19-llama.md](../../reference/19-llama.md) |
| Claude core principles & prerequisites | [../../reference/01-claude-core.md](../../reference/01-claude-core.md) |
| Cross-family overlap & porting rules | [../../reference/03-overlap-and-porting.md](../../reference/03-overlap-and-porting.md) |
| Condensed Claude prompt skeletons | [../../reference/04-templates.md](../../reference/04-templates.md) |
| Output formatting, prefill migration, JSON schemas | [../../reference/05-output-and-formatting.md](../../reference/05-output-and-formatting.md) |
| Adaptive thinking, `output_config.effort`, caching | [../../reference/06-thinking-and-effort.md](../../reference/06-thinking-and-effort.md) |
| Tools, parallel calls, subagents, coding guardrails | [../../reference/07-tools-and-agents.md](../../reference/07-tools-and-agents.md) |
| Hallucinations, consistency, jailbreaks, indirect injection | [../../reference/08-guardrails.md](../../reference/08-guardrails.md) |
| Success criteria, automated grading, latency tuning | [../../reference/09-evals-and-latency.md](../../reference/09-evals-and-latency.md) |
| Cross-model delta matrix (Claude & open-weight) | [../../reference/10-model-delta-matrix.md](../../reference/10-model-delta-matrix.md) |
| Source provenance & fetch dates | [../../reference/sources.md](../../reference/sources.md) |

## Core Execution Principles

- **Spec before draft:** Lock down success criteria, inputs/outputs, failure modes, guardrails, and latency/cost budget before writing prompt text so every instruction serves a measurable goal.
- **Refuse documented anti-patterns:** Omit techniques that error or degrade quality on the target model family according to the loaded reference file(s), and explain the safer replacement in `Why`.
- **Source grounding & provenance tags:** Ground every technique in the loaded reference file(s), tag each bullet in `Why` with `[Claude docs]`, `[Vendor]`, or `[General]`, and mark any undocumented runtime setting `unverified`.
- **8-section output contract:** Deliver all 8 sections in order—`Target`, `Spec`, `Prompt`, `Why`, `Settings`, `Tests`, `Changelog`, and `Limitations`—so every prompt ships with reproducible tests and honest caveats.
- **Verify before returning:** Check the finished deliverable against [references/checklist.md](references/checklist.md).
