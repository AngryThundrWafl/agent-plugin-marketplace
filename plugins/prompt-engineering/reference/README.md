---
name: Prompting reference pack index
source:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  - https://agent-plugins.org/specification
  - https://agentskills.io/specification.md
  - plugins/prompt-engineering/reference/sources.md
fetched: 2026-11-24
covers: Complete index of the 17-file reference pack (README + 01–15 + sources.md), confidence tag definitions, and task-based routing table
---

# Prompting Reference Pack Index

Tags: `[Claude docs]` = directly from Anthropic Claude documentation. `[Vendor]` = directly from open-weight vendor model cards/guides. `[General]` = cross-source synthesis (must be tested). `unverified` = cached sources are silent.

> **Core rule:** **Read the relevant reference file before designing a prompt or writing prompting advice.** Model-specific behavior overrides general defaults, and unverified techniques must never be invented. `[Claude docs]` `[General]`

## 1. Confidence & Provenance Tags

- **`[Claude docs]`**: Directly grounded in fetched Anthropic Platform documentation (including verbatim blocks labeled **verbatim**).
- **`[Vendor]`**: Directly grounded in fetched open-weight vendor model cards, Hugging Face cards, or official prompt-format/Harmony repositories.
- **`[General]`**: Cross-model or cross-section synthesis (including condensed templates and porting guidance) that **must be empirically tested** against target evals.
- **`unverified`**: Cached vendor/Claude source files are silent on that parameter, constraint, or technique—do not extrapolate from another model family.

## 2. Complete File Index (`01`–`15` + `sources.md` + `README.md`)

| File | Scope | Primary Sources |
| --- | --- | --- |
| `README.md` | This index, confidence tags, core workflow rule, and routing table. | Reference pack (`01`–`15`, `sources.md`) |
| `01-claude-core.md` | Eval prerequisites, clarity, motivation ("why"), positive framing, 3–5 XML examples, role, 20k+ long-context grounding, migration defaults. | Claude overview & best practices `[Claude docs]` |
| `02-open-weight.md` | DeepSeek-R1/0528, Qwen3 (`235B-A22B`, `32B`, `2507`), `gpt-oss` (`120b`, `20b`) + Harmony, Llama 3.3 & Llama 4 (`Scout`, `Maverick`). | Vendor cards & format repos `[Vendor]` |
| `03-overlap-and-porting.md` | What transfers vs. breaks across Claude and open-weight models (`system`, prefill, greedy decoding, delimiters, history stripping, JSON, tools) + porting checklist. | Cross-pack synthesis `[General]` |
| `04-templates-and-checklist.md` | Condensed skeletons (Claude general, agentic/coding, long-context Q&A; R1/0528; Qwen3; Harmony; Llama 4) + pre-ship checklist. | Cross-pack synthesis `[General]` |
| `05-output-and-formatting.md` | Verbosity, prose/markdown/LaTeX steering, prefill deprecation (`4.6+`), `output_config.format` JSON schema, `strict: true` tools, SDK helpers, schema limits. | Best practices & structured outputs `[Claude docs]` |
| `06-thinking-and-effort.md` | Adaptive vs. manual (`budget_tokens` `400`), `effort` (`low`–`max`), `display` (`updates`/`summarized`/`omitted`), history prefix checks, sampling/tool bans. | Thinking, effort & steering docs `[Claude docs]` |
| `07-tools-and-agents.md` | Action vs. suggestion, parallel calls, multi-window `tests.json`/`progress.txt`, reversibility, financial/customer records, subagents, anti-overengineering, frontend. | Best practices `[Claude docs]` |
| `08-guardrails.md` | Hallucination reduction, output consistency, jailbreaks, Haiku 5.5 fail-closed screening, indirect injection (`tool_result` JSON), prompt-leak mitigation. | Guardrail guides `[Claude docs]` |
| `09-evals-and-latency.md` | SMART eval criteria, metric pairings, code/LLM/human grading, TTFT vs. baseline latency, `haiku-5-5` + `effort: low`, token trimming, streaming. | Eval & latency docs `[Claude docs]` |
| `10-model-delta-matrix.md` | Side-by-side matrix of all covered Claude models (`Fable 5.2`–`Sonnet 5`) + open-weight cross-link table and migration triggers. | Model docs & `02`/`06` `[Claude docs]` `[Vendor]` |
| `11-fable-5-2.md` | Fable 5.2 / Mythos 5.2: `high` default, finishing-work, code ownership, progress `updates`, subagent cost, caution pile-up, legacy audit, refusals. | Fable 5.2 guide `[Claude docs]` |
| `12-opus-5-5.md` | Opus 5.5: `medium` default, `disabled` → `400`, unattended loops, multi-app explore, time signals, chat done-answer, pasted-text IDs, visual crop, refusals. | Opus 5.5 guide `[Claude docs]` |
| `13-sonnet-5-5.md` | Sonnet 5.5: `between_tools`, scope/review caps, JSON reasoning nudges, mid-turn text placement, `low` verification, tolerant tool names, refusals. | Sonnet 5.5 guide `[Claude docs]` |
| `14-haiku-5-5.md` | Haiku 5.5: `medium` default, `disabled` + `xhigh`/`max` → `400`, date-grounded search, `disabled` + JSON tool-skip fix, empty `xhigh` replies, no fallback. | Haiku 5.5 guide `[Claude docs]` |
| `15-legacy-models.md` | Migration/maintenance notes for Fable 5.1, Fable 5, Opus 5, Opus 4.8, and Sonnet 5 (including tokenizer `+30%` & over-verification traps). | Legacy model guides `[Claude docs]` |
| `sources.md` | Complete provenance table: exact URLs, local cache paths, fetch date (`2026-11-24`), redirects, derived/embedded open-weight URLs, and plugin/skill specs. | Fetch logs & frontmatter `[Claude docs]` `[Vendor]` |

## 3. Which File When (Routing Table)

| If you are working on... | Read first | Then consult |
| --- | --- | --- |
| **A specific Claude model** (`Fable 5.2`, `Opus 5.5`, `Sonnet 5.5`, `Haiku 5.5`) | `11`–`14` (matching model) | `01`, `06`, and `10-model-delta-matrix.md` |
| **Migrating from an older Claude model** (`4.8`, `5`, `5.1`, or `4.5/4.6`) | `15-legacy-models.md` + `10-model-delta-matrix.md` | Target `11`–`14` + `03-overlap-and-porting.md` |
| **DeepSeek-R1, Qwen3, `gpt-oss` Harmony, or Llama 3.3/4** | `02-open-weight.md` | `03-overlap-and-porting.md` + `04-templates-and-checklist.md` |
| **Porting a prompt between Claude and open-weight models** | `03-overlap-and-porting.md` | `02-open-weight.md` + target Claude file |
| **Starting from a skeleton or running pre-ship QA** | `04-templates-and-checklist.md` | `01-claude-core.md` + `09-evals-and-latency.md` |
| **JSON schemas, strict tools, markdown/prose, or prefill errors** | `05-output-and-formatting.md` | Target model file (`11`–`14`) for `xhigh`/`disabled` caveats |
| **Thinking modes, `effort`, `budget_tokens` `400`s, or prefix checks** | `06-thinking-and-effort.md` | Target model file (`11`–`15`) |
| **Coding agents, subagents, parallel tools, or financial safety** | `07-tools-and-agents.md` | `11-fable-5-2.md` / `12-opus-5-5.md` / `13-sonnet-5-5.md` |
| **Prompt injection, jailbreaks, hallucinations, or prompt leaks** | `08-guardrails.md` | `12-opus-5-5.md` §9 (pasted IDs) + `14-haiku-5-5.md` |
| **Evals, LLM-as-judge grading, TTFT, or cost/latency tuning** | `09-evals-and-latency.md` | `06-thinking-and-effort.md` + `14-haiku-5-5.md` |
| **Verifying source URLs, redirects, or Agent Plugins/Skills specs** | `sources.md` | Referenced file's frontmatter |

## 4. Usage & Maintenance Rules `[General]`

- **Never extrapolate across families:** Do not apply Claude `effort`/XML rules to `gpt-oss` Harmony, DeepSeek-R1, Qwen3, or Llama 3.3/4 (or vice versa) without checking `03-overlap-and-porting.md` and testing on target evals. `[General]`
- **Preserve `unverified` markers:** When a source page does not document a parameter (e.g., sampling defaults for `gpt-oss`/Llama, exact token multipliers per `effort` tier), keep it marked `unverified` rather than guessing. `[General]`
- **Refresh provenance on updates:** Whenever refreshing cached docs or adding model pages, update `sources.md`, `10-model-delta-matrix.md`, and `fetched:` dates together. `[General]`

## 5. Pack Structure & Loading Pattern `[General]`

- **Shared reference vs. thin skills:** Skills (`skills/skill-creator`, `skills/prompt-creator`) stay lightweight by loading only the files in `reference/` matched by the routing table (§3) for the active model family and task. `[General]`
- **Model-specific overrides win:** If `01-claude-core.md` or `05`–`09` conflicts with a model page (`11`–`15` or `02-open-weight.md`), follow the model-specific file (for example, Fable 5.2 effort vs. `"don't deliberate"`, Opus 5 auto-verification, or Haiku 5.5 `disabled` + JSON tool-skipping). `[Claude docs]` `[General]`
- **Eval-first workflow:** Define measurable success criteria and empirical graders (`09-evals-and-latency.md`) before iterating on prompts, and change one variable at a time. `[Claude docs]` `[General]`
- **Source hygiene:** Keep `.cache/prompt-engineering-sources/` uncommitted; treat `sources.md` as the single URL ledger for all 17 files in this directory. `[General]`

## 6. Quick Start by Role `[General]`

- **Designing a new prompt:** Read `README.md` → target model file (`11`–`14` or `02`) → `01-claude-core.md` (if Claude) → `04-templates-and-checklist.md` → `09-evals-and-latency.md`. `[General]`
- **Authoring or updating an Agent Skill:** Read `README.md` → `sources.md` (Agent Skills / Agent Plugins specs) → relevant `reference/*.md` files for the skill's target models. `[General]`
- **Debugging regressions after a model upgrade:** Read `10-model-delta-matrix.md` + `15-legacy-models.md` + target model file (`11`–`14`), then prune deprecated scaffolding (`03-overlap-and-porting.md` §3). `[Claude docs]` `[General]`
- **Securing tools, customer records, or user-pasted content:** Read `08-guardrails.md` + `07-tools-and-agents.md` §3 + `12-opus-5-5.md` §9 + `13-sonnet-5-5.md` §5 (mid-turn placement) + `14-haiku-5-5.md` §4. `[Claude docs]` `[General]`

## 7. Gaps / `unverified`

- External `skills/` authoring guides (`skills/skill-creator`, `skills/prompt-creator`) and repo-level marketplace manifests are outside `reference/` and documented in `../README.md` and `sources.md`. `[General]`
