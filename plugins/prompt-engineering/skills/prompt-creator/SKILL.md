---
name: prompt-creator
description: Design, version, and test prompts for Claude and open-weight models using live-distilled model guides, refusing known family anti-patterns and returning Target, Spec, Prompt, Why, Settings, Tests, Changelog, and Limitations. Use when creating, tuning, or migrating prompts.
---

# Prompt Creator

Follow a spec-first, reference-grounded, one-change-per-iteration workflow to design, version, and test prompts for Claude and open-weight models.

## Mandatory Startup Sequence

1. Read [authoring-guide.md](authoring-guide.md) in full before writing or modifying any prompt.
2. Read [checklist.md](checklist.md) so every verification gate is active while drafting.
3. Identify the target model family and load **only** the matching reference files on demand under `../../reference/` before drafting:

| Target / Topic | Read Before Drafting |
| --- | --- |
| Any Claude model (core principles & prerequisites) | [../../reference/01-claude-core.md](../../reference/01-claude-core.md) |
| Claude Fable 5.2 / Mythos 5.2 | [../../reference/11-fable-5-2.md](../../reference/11-fable-5-2.md) |
| Claude Opus 5.5 | [../../reference/12-opus-5-5.md](../../reference/12-opus-5-5.md) |
| Claude Sonnet 5.5 | [../../reference/13-sonnet-5-5.md](../../reference/13-sonnet-5-5.md) |
| Claude Haiku 5.5 | [../../reference/14-haiku-5-5.md](../../reference/14-haiku-5-5.md) |
| Legacy Claude (Fable 5.1/5, Opus 5/4.8, Sonnet 5) | [../../reference/15-legacy-models.md](../../reference/15-legacy-models.md) |
| Output formatting, prefill deprecation, JSON schemas | [../../reference/05-output-and-formatting.md](../../reference/05-output-and-formatting.md) |
| Adaptive thinking, `output_config.effort`, caching | [../../reference/06-thinking-and-effort.md](../../reference/06-thinking-and-effort.md) |
| Tools, parallel calls, subagents, coding guardrails | [../../reference/07-tools-and-agents.md](../../reference/07-tools-and-agents.md) |
| Hallucinations, consistency, jailbreaks, indirect injection | [../../reference/08-guardrails.md](../../reference/08-guardrails.md) |
| Success criteria, automated grading, latency tuning | [../../reference/09-evals-and-latency.md](../../reference/09-evals-and-latency.md) |
| Open-weight (DeepSeek-R1, Qwen3, `gpt-oss`, Llama 3.3/4) | [../../reference/02-open-weight.md](../../reference/02-open-weight.md) |
| Cross-family overlap & porting rules | [../../reference/03-overlap-and-porting.md](../../reference/03-overlap-and-porting.md) |
| Prompt templates & pre-ship checklist | [../../reference/04-templates-and-checklist.md](../../reference/04-templates-and-checklist.md) |
| Cross-model delta matrix (all Claude & open-weight) | [../../reference/10-model-delta-matrix.md](../../reference/10-model-delta-matrix.md) |

## Core Execution Rules

- **Spec before draft:** Lock down success criteria, inputs/outputs, failure modes, guardrails, and latency/cost budget before writing prompt text.
- **Refuse anti-patterns:** Never emit techniques documented as broken or harmful on the target model family (see [authoring-guide.md](authoring-guide.md) and [checklist.md](checklist.md)).
- **Source grounding & tags:** Tag every justification in `Why` with `[Claude docs]`, `[Vendor]`, or `[General]`; mark any setting absent from the docs `unverified`. Never invent techniques absent from the reference pack.
- **Required Output Contract:** Always deliver all 8 sections in order: `Target`, `Spec`, `Prompt`, `Why`, `Settings`, `Tests`, `Changelog`, and `Limitations`.
- **Verify before returning:** Run every item in [checklist.md](checklist.md) against the deliverable.
