---
name: Reference pack source provenance
source:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  - https://agent-plugins.org/specification
  - https://agent-plugins.org/schemas/1.0.0/plugin.schema.json
  - https://agentskills.io/specification.md
  - .cache/prompt-engineering-sources/specs/fetch-statuses.tsv
fetched: 2026-11-24
covers: Complete provenance table with exact source URLs, local cache files, reference pack mappings, fetch date (2026-11-24), redirects, derived vs. embedded open-weight URLs, and Agent Plugins / Agent Skills spec URLs
---

# Reference Pack Source Provenance

Tags: `[Claude docs]` = Anthropic Platform documentation. `[Vendor]` = open-weight vendor cards/guides. `[General]` = pack provenance/maintenance rules. `unverified` = absent from cached sources.
All primary sources below were fetched on **`2026-11-24`**. Cached raw materials under `.cache/prompt-engineering-sources/` are gitignored scratch inputs; the distilled files in `plugins/prompt-engineering/reference/` are the committed runtime reference. `[General]`

## 1. Claude Platform Core, Formatting, Thinking, Guardrails & Evals (`[Claude docs]`)

| Reference File(s) | Exact Source URL | Local Cache Path (`.cache/prompt-engineering-sources/`) | Fetched | Notes / Redirects |
| --- | --- | --- | --- | --- |
| `01` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview` | `claude-core/overview.md` | `2026-11-24` | Canonical overview page. |
| `01`, `05`, `06`, `07`, `11`–`14` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices` | `claude-core/claude-prompting-best-practices.md` & `claude-models/claude-prompting-best-practices.md` | `2026-11-24` | Canonical target for all 5 redirected core pages below. |
| `01` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/be-clear-and-direct` | `claude-core/be-clear-and-direct.md` | `2026-11-24` | **Redirects** to `claude-prompting-best-practices`. |
| `01` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags` | `claude-core/use-xml-tags.md` | `2026-11-24` | **Redirects** to `claude-prompting-best-practices`. |
| `01` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/long-context-tips` | `claude-core/long-context-tips.md` | `2026-11-24` | **Redirects** to `claude-prompting-best-practices`. |
| `06` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/chain-of-thought` | `claude-core/chain-of-thought.md` | `2026-11-24` | **Redirects** to `claude-prompting-best-practices`. |
| `06` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/extended-thinking-tips` | `claude-core/extended-thinking-tips.md` | `2026-11-24` | **Redirects** to `claude-prompting-best-practices`. |
| `05` | `https://platform.claude.com/docs/en/build-with-claude/structured-outputs` | `claude-core/structured-outputs.md` | `2026-11-24` | JSON schemas, `strict: true`, SDK helpers, limits. |
| `06` | `https://platform.claude.com/docs/en/build-with-claude/thinking` | `claude-core/thinking.md` | `2026-11-24` | Adaptive/manual thinking, `display`, prefix checks. |
| `06` | `https://platform.claude.com/docs/en/build-with-claude/thinking-steering-and-cost` | `claude-core/thinking-steering-and-cost.md` | `2026-11-24` | Steering order, cost & caching interactions. |
| `06` | `https://platform.claude.com/docs/en/build-with-claude/effort` | `claude-core/effort.md` | `2026-11-24` | `output_config.effort` levels and per-model matrix. |
| `08` | `https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations` | `claude-core/reduce-hallucinations.md` | `2026-11-24` | Grounding, quotes, uncertainty, best-of-N. |
| `08` | `https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/increase-consistency` | `claude-core/increase-consistency.md` | `2026-11-24` | Structured outputs, examples, KB retrieval, character. |
| `08` | `https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks` | `claude-core/mitigate-jailbreaks.md` | `2026-11-24` | Direct/indirect injection, `tool_result`, Haiku screen. |
| `08` | `https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-prompt-leak` | `claude-core/reduce-prompt-leak.md` | `2026-11-24` | Post-processing, secret omission, conditional use. |
| `09` | `https://platform.claude.com/docs/en/test-and-evaluate/develop-tests` | `claude-core/develop-tests.md` | `2026-11-24` | Criteria, eval design, metric pairings, graders. |
| `09` | `https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-latency` | `claude-core/reduce-latency.md` | `2026-11-24` | TTFT vs. baseline latency, `haiku-5-5`, streaming. |

## 2. Claude Model-Specific Prompting Pages (`[Claude docs]`)

| Reference File | Exact Source URL | Local Cache Path (`.cache/prompt-engineering-sources/`) | Fetched | Model(s) Covered |
| --- | --- | --- | --- | --- |
| `11-fable-5-2.md` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2` | `claude-models/prompting-claude-fable-5-2.md` | `2026-11-24` | Claude Fable 5.2 & Mythos 5.2 |
| `12-opus-5-5.md` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5` | `claude-models/prompting-claude-opus-5-5.md` | `2026-11-24` | Claude Opus 5.5 |
| `13-sonnet-5-5.md` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5` | `claude-models/prompting-claude-sonnet-5-5.md` | `2026-11-24` | Claude Sonnet 5.5 |
| `14-haiku-5-5.md` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-haiku-5-5` | `claude-models/prompting-claude-haiku-5-5.md` | `2026-11-24` | Claude Haiku 5.5 |
| `15-legacy-models.md` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1` | `claude-models/prompting-claude-fable-5-1.md` | `2026-11-24` | Claude Fable 5.1 & Mythos 5.1 |
| `15-legacy-models.md` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5` | `claude-models/prompting-claude-fable-5.md` | `2026-11-24` | Claude Fable 5 & Mythos 5 |
| `15-legacy-models.md` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5` | `claude-models/prompting-claude-opus-5.md` | `2026-11-24` | Claude Opus 5 |
| `15-legacy-models.md` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-4-8` | `claude-models/prompting-claude-opus-4-8.md` | `2026-11-24` | Claude Opus 4.8 |
| `15-legacy-models.md` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5` | `claude-models/prompting-claude-sonnet-5.md` | `2026-11-24` | Claude Sonnet 5 |

*(Cross-referenced cookbook URL cited in `01`, `12`, `13`: `https://platform.claude.com/cookbook/multimodal-crop-tool` — referenced in source docs, not separately cached in `claude-core/` or `claude-models/`.)* `[Claude docs]`

## 3. Open-Weight Model Cards & Format Docs (`02-open-weight.md`, `[Vendor]`)

| Model / Spec | Exact URL | Local Cache Path (`open-weight/`) | URL Provenance (`embedded` vs. `derived`) | Fetched |
| --- | --- | --- | --- | --- |
| **DeepSeek-R1** | `https://huggingface.co/deepseek-ai/DeepSeek-R1` | `deepseek-r1.md` | **Embedded** directly in `deepseek-r1.md`. | `2026-11-24` |
| **DeepSeek-R1-0528** | `https://huggingface.co/deepseek-ai/DeepSeek-R1-0528` | `deepseek-r1-0528.md` | **Derived** from `deepseek-r1-0528.md`; file embeds `https://github.com/deepseek-ai/DeepSeek-R1`. | `2026-11-24` |
| **Qwen3-235B-A22B** | `https://huggingface.co/Qwen/Qwen3-235B-A22B` | `qwen3-235b-a22b.md` | **Embedded** via `LICENSE` link in `qwen3-235b-a22b.md`. | `2026-11-24` |
| **Qwen3-32B** | `https://huggingface.co/Qwen/Qwen3-32B` | `qwen3-32b.md` | **Embedded** via `LICENSE` link in `qwen3-32b.md`. | `2026-11-24` |
| **Qwen3-235B-A22B-Instruct-2507** | `https://huggingface.co/Qwen/Qwen3-235B-A22B-Instruct-2507` | `qwen3-235b-a22b-instruct-2507.md` | **Embedded** via `LICENSE` link in `qwen3-235b-a22b-instruct-2507.md`. | `2026-11-24` |
| **Qwen3-235B-A22B-Thinking-2507** | `https://huggingface.co/Qwen/Qwen3-235B-A22B-Thinking-2507` | `qwen3-235b-a22b-thinking-2507.md` | **Embedded** via `LICENSE` link in `qwen3-235b-a22b-thinking-2507.md`. | `2026-11-24` |
| **OpenAI `gpt-oss-120b`** | `https://huggingface.co/openai/gpt-oss-120b` | `gpt-oss-120b.md` | **Derived** from `model_id = "openai/gpt-oss-120b"` in `gpt-oss-120b.md`. | `2026-11-24` |
| **OpenAI `gpt-oss-20b`** | `https://huggingface.co/openai/gpt-oss-20b` | `gpt-oss-20b.md` | **Embedded** directly in `gpt-oss-20b.md`. | `2026-11-24` |
| **Harmony Repo** | `https://github.com/openai/harmony` | `openai-harmony-readme.md` | **Embedded** directly in `openai-harmony-readme.md`. | `2026-11-24` |
| **Harmony Cookbook Guide** | `https://cookbook.openai.com/articles/openai-harmony` | `openai-cookbook-harmony.md` | **Embedded** in `openai-harmony-readme.md`. | `2026-11-24` |
| **Meta Llama 3.3 70B Instruct** | `https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct` | `llama3_3-model-card.md` | **Derived** from card; embeds `https://github.com/meta-llama/llama-models/blob/main/models/llama3_3/LICENSE`. | `2026-11-24` |
| **Llama 3.3 & 4 Prompt Format Docs** | `https://github.com/meta-llama/llama-models` | `llama3_3-prompt-format.md`, `llama4-prompt-format.md` | **Derived** from model-card repo links (exact URL not embedded in prompt-format files). | `2026-11-24` |
| **Meta Llama 4 (`Scout` / `Maverick`)** | `https://huggingface.co/meta-llama` | `llama4-model-card.md` | **Derived** (exact HF repo slug not embedded); card embeds `https://github.com/meta-llama/llama-models/blob/main/models/llama4/LICENSE`. | `2026-11-24` |

## 4. Agent Plugins 1.0.0 & Agent Skills Specifications (`.cache/.../specs/fetch-statuses.tsv`) `[Vendor]`

| Spec Artifact | Exact Fetched URL | Local Cache File (`specs/`) | HTTP Status & Content-Type | Fetched |
| --- | --- | --- | --- | --- |
| **Agent Plugins Specification** | `https://agent-plugins.org/specification` | `01-specification.html` | `200` (`text/html; charset=utf-8`) | `2026-11-24` |
| **Agent Plugins Schemas Overview** | `https://agent-plugins.org/schemas` | `02-schemas.html` | `200` (`text/html; charset=utf-8`) | `2026-11-24` |
| **Plugin Schema v1.0.0** | `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json` | `03-plugin.schema.1.0.0.json` | `200` (`application/json; charset=utf-8`) | `2026-11-24` |
| **Build an Agent Plugin Guide** | `https://agent-plugins.org/plugin-authors/build-an-agent-plugin` | `04-build-an-agent-plugin.html` | `200` (`text/html; charset=utf-8`) | `2026-11-24` |
| **Plugin Manifest Reference** | `https://agent-plugins.org/plugin-authors/manifest` | `05-manifest.html` | `200` (`text/html; charset=utf-8`) | `2026-11-24` |
| **Plugin Skills Authoring** | `https://agent-plugins.org/plugin-authors/skills` | `06-skills.html` | `200` (`text/html; charset=utf-8`) | `2026-11-24` |
| **Compatible Clients** | `https://agent-plugins.org/compatible-clients` | `07-compatible-clients.html` | `200` (`text/html; charset=utf-8`) | `2026-11-24` |
| **Agent Skills Specification** | `https://agentskills.io/specification.md` | `08-agentskills-specification.md` | `200` (`text/markdown; charset=utf-8`) | `2026-11-24` |
| **Plugin Schema v1.1.0 Probe** | `https://agent-plugins.org/schemas/1.1.0/plugin.schema.json` | `09-plugin.schema.1.1.0.probe` | `404` (`text/html; charset=utf-8`) — confirms `1.0.0` is latest | `2026-11-24` |
| **MCP Servers Authoring** | `https://agent-plugins.org/plugin-authors/mcp-servers` | `10-mcp-servers.html` | `200` (`text/html; charset=utf-8`) | `2026-11-24` |
| **Client Extensions Authoring** | `https://agent-plugins.org/plugin-authors/client-extensions` | `11-client-extensions.html` | `200` (`text/html; charset=utf-8`) | `2026-11-24` |

## 5. Provenance & Verification Notes `[General]`

- **Claude redirects:** `be-clear-and-direct`, `use-xml-tags`, `long-context-tips`, `chain-of-thought`, and `extended-thinking-tips` all resolve to `claude-prompting-best-practices`. `[Claude docs]`
- **Unfetched cross-references (`unverified`):** The Opus 5.5 (4 breaking API changes), Sonnet 5.5 (5 breaking API changes), and Haiku 5.5 migration guides, Managed Agents API specs, and `multimodal-crop-tool` cookbook code were not separately cached—their unstated details remain `unverified`. `[General]`
