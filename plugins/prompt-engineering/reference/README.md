---
name: Prompting reference pack index
source:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  - https://agent-plugins.org/specification
  - https://agentskills.io/specification.md
fetched: 2026-11-24
covers: Human and maintainer catalog of the 22-file Prompting Reference Pack (README + 01, 03-21 + sources.md) and confidence-tag definitions
---

# Prompting Reference Pack Index

This directory contains self-contained, single-topic **leaf reference documents** shared by the plugin's skills. Skills route directly from `SKILL.md` to the exact leaf file(s) needed (one level deep, zero multi-hop chains); this index serves human readers and pack maintainers. `[General]`

## 1. Confidence & Provenance Tags

- **`[Claude docs]`**: Directly grounded in fetched Anthropic Platform documentation (including verbatim blocks labeled **verbatim**).
- **`[Vendor]`**: Directly grounded in fetched vendor documentation, model cards, or official prompt-format repositories (Google Gemini, DeepSeek, Qwen, OpenAI, Meta).
- **`[General]`**: Cross-model or cross-section synthesis (including condensed templates and porting guidance) that requires empirical testing against target evals.
- **`unverified`**: Official vendor/Claude sources are silent on that parameter, constraint, or technique—keep gaps explicit rather than extrapolating across models.

## 2. Flat File Catalog (22 Files)

### Model-Specific Leaf Guides (`11`–`21`) — Take Precedence Over General Defaults

| File | Scope | Primary Sources |
| --- | --- | --- |
| `11-fable-5-2.md` | Claude Fable 5.2 / Mythos 5.2: `high` default, finishing-work, code ownership, progress `updates`, subagent cost, caution pile-up, legacy audit, refusals. | Fable 5.2 guide `[Claude docs]` |
| `12-opus-5-5.md` | Claude Opus 5.5: `medium` default, `disabled` → `400`, unattended loops, multi-app explore, time signals, chat done-answer, pasted-text IDs, visual crop, refusals. | Opus 5.5 guide `[Claude docs]` |
| `13-sonnet-5-5.md` | Claude Sonnet 5.5: `between_tools`, scope/review caps, JSON reasoning nudges, mid-turn text placement, `low` verification, tolerant tool names, refusals. | Sonnet 5.5 guide `[Claude docs]` |
| `14-haiku-5-5.md` | Claude Haiku 5.5: `medium` default, `disabled` + `xhigh`/`max` → `400`, date-grounded search, `disabled` + JSON tool-skip fix, empty `xhigh` replies, no fallback. | Haiku 5.5 guide `[Claude docs]` |
| `15-legacy-models.md` | Earlier Claude 4.8 / 5 / 5.1 maintenance & migration notes (Fable 5.1, Fable 5, Opus 5, Opus 4.8, Sonnet 5, tokenizer `+30%`, over-verification). | Legacy model guides `[Claude docs]` |
| `16-deepseek-r1.md` | DeepSeek-R1, distilled dense checkpoints, and DeepSeek-R1-0528: sampling, `system` prompt rules, `<think>\n` prefill, starter skeletons, file/web-search templates. | DeepSeek model cards `[Vendor]` |
| `17-qwen3.md` | Qwen3 (`235B-A22B`, `32B`, `Instruct-2507`, `Thinking-2507`): hybrid vs. single-mode thinking, sampling presets, YaRN/DCA scaling, history stripping, starter skeleton, `Qwen-Agent`. | Qwen3 model cards `[Vendor]` |
| `18-gpt-oss.md` | OpenAI `gpt-oss` (`120b`, `20b`): mandatory `o200k_harmony` format, `system` vs. `developer` hierarchy, `Reasoning:` levels, `analysis`/`commentary`/`final` channels, Harmony skeleton. | `gpt-oss` & Harmony docs `[Vendor]` |
| `19-llama.md` | Meta Llama 3.3 (`70B-Instruct`) & Llama 4 (`Scout`, `Maverick`): distinct special tokens, multimodal image encoding, system steerability, zero-shot tool calling & skeleton. | Meta Llama cards & format docs `[Vendor]` |
| `20-gemini-4.md` | Google Gemini 4 (`Carbon`, `Neon`, `Hydrogen`, `Argon`): unified 1M context & long decodes, `thinking_level`, `thought_signature`, Interactions API, ignored sampling, implicit caching, `media_resolution`, Office/ODF inputs. | Google Gemini API docs & model cards `[Vendor]` |
| `21-gemini-3-8-flash.md` | Google Gemini 3.8 Flash (`gemini-3.8-flash`): `low`/`medium`/`high` `thinking_level` (`minimal` unsupported), `65K` combined output cap, `temperature=1.0`, `thought_signature`, paired invariant framing. | Google Gemini API docs & model card `[Vendor]` |

### Topic & Cross-Family Leaf Guides (`01`, `03`–`10`)

| File | Scope | Primary Sources |
| --- | --- | --- |
| `01-claude-core.md` | Eval prerequisites, clarity, motivation ("why"), positive framing, 3–5 XML examples, role, 20k+ long-context grounding, migration defaults. | Claude overview & best practices `[Claude docs]` |
| `03-overlap-and-porting.md` | What transfers vs. breaks across Claude, Gemini, and open-weight models (`system`, prefill, sampling/greedy decoding, delimiters, thinking/history, JSON, tools) + porting checklist. | Cross-pack synthesis `[General]` |
| `04-templates.md` | Condensed Claude starter skeletons (general task, agentic/coding, long-context grounded Q&A). | Claude docs synthesis `[General]` |
| `05-output-and-formatting.md` | Verbosity, prose/markdown/LaTeX steering, prefill deprecation (`4.6+`), `output_config.format` JSON schema, `strict: true` tools, SDK helpers, schema limits. | Best practices & structured outputs `[Claude docs]` |
| `06-thinking-and-effort.md` | Adaptive vs. manual (`budget_tokens` `400`), `effort` (`low`–`max`), `display` (`updates`/`summarized`/`omitted`), history prefix checks, sampling/tool bans. | Thinking, effort & steering docs `[Claude docs]` |
| `07-tools-and-agents.md` | Action vs. suggestion, parallel calls, multi-window `tests.json`/`progress.txt`, reversibility, financial/customer records, subagents, anti-overengineering, frontend. | Best practices `[Claude docs]` |
| `08-guardrails.md` | Hallucination reduction, output consistency, jailbreaks, Haiku 5.5 fail-closed screening, indirect injection (`tool_result` JSON), prompt-leak mitigation. | Guardrail guides `[Claude docs]` |
| `09-evals-and-latency.md` | SMART eval criteria, metric pairings, code/LLM/human grading, TTFT vs. baseline latency, `haiku-5-5` + `effort: low`, token trimming, streaming. | Eval & latency docs `[Claude docs]` |
| `10-model-delta-matrix.md` | Side-by-side matrix of covered Claude (`Fable 5.2`–`Sonnet 5`), Google Gemini (`Gemini 4`, `3.8 Flash`), and open-weight families, upgrade triggers, and API compatibility snapshot. | Model docs & vendor cards `[Claude docs]` `[Vendor]` |

### Catalog & Provenance (`README.md`, `sources.md`)

| File | Scope | Primary Sources |
| --- | --- | --- |
| `README.md` | This human/maintainer catalog and confidence-tag definitions. | Reference pack (`01`, `03`–`21`, `sources.md`) |
| `sources.md` | Complete URL provenance table, fetch date (`2026-11-24`), redirects, Google Gemini docs/cards, derived vs. embedded open-weight URLs, and Agent Plugins / Agent Skills spec URLs. | Fetch logs & frontmatter `[Claude docs]` `[Vendor]` |

## 3. Maintenance Rules `[General]`

- **Keep every leaf file self-contained:** Avoid inter-file redirects ("see `XX-other.md`") or external-fetch prompts inside `01`, `03`–`21`; skills route directly to the matching leaf file(s) from `SKILL.md`. `[General]`
- **Model-specific overrides win:** Whenever a general topic file (`01`, `03`–`09`) conflicts with a model-specific file (`11`–`21`), follow the model-specific file. `[Claude docs]` `[General]`
- **Preserve `unverified` markers:** Keep undocumented parameters explicitly marked `unverified` rather than extrapolating across model families. `[General]`
- **Refresh provenance together:** When updating fetched sources or adding a model page, update `sources.md`, `10-model-delta-matrix.md`, this catalog, both skills' `SKILL.md` routing tables, and `fetched:` dates together. `[General]`
