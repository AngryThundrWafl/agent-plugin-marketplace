---
name: Reference pack source provenance
source:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  - https://agent-plugins.org/specification
  - https://agent-plugins.org/schemas/1.0.0/plugin.schema.json
  - https://agentskills.io/specification.md
fetched: 2026-11-24
covers: Complete provenance table with exact source URLs, reference pack mappings, fetch date (2026-11-24), redirects, Google Gemini API docs and model cards, derived vs. embedded open-weight URLs, and Agent Plugins / Agent Skills spec URLs
---

# Reference Pack Source Provenance

Tags: `[Claude docs]` = Anthropic Platform documentation. `[Vendor]` = Google Gemini, DeepSeek, Qwen, OpenAI, and Meta documentation/model cards. `[General]` = pack provenance/maintenance rules. `unverified` = absent from fetched sources.
All primary sources below were fetched on **`2026-11-24`**. The distilled files in this directory are the committed runtime reference. `[General]`

Contents: 1 Claude core · 2 Claude model-specific · 3 Open-weight cards · 4 Google Gemini docs & cards · 5 Agent Plugins & Skills specs · 6 Verification notes

## 1. Claude Platform Core, Formatting, Thinking, Guardrails & Evals (`[Claude docs]`)

| Reference File(s) | Exact Source URL | Fetched | Notes / Redirects |
| --- | --- | --- | --- |
| `01` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview` | `2026-11-24` | Canonical overview page. |
| `01`, `05`, `06`, `07`, `11`–`14` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices` | `2026-11-24` | Canonical target for all 5 redirected core pages below. |
| `01` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/be-clear-and-direct` | `2026-11-24` | **Redirects** to `claude-prompting-best-practices`. |
| `01` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags` | `2026-11-24` | **Redirects** to `claude-prompting-best-practices`. |
| `01` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/long-context-tips` | `2026-11-24` | **Redirects** to `claude-prompting-best-practices`. |
| `06` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/chain-of-thought` | `2026-11-24` | **Redirects** to `claude-prompting-best-practices`. |
| `06` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/extended-thinking-tips` | `2026-11-24` | **Redirects** to `claude-prompting-best-practices`. |
| `05` | `https://platform.claude.com/docs/en/build-with-claude/structured-outputs` | `2026-11-24` | JSON schemas, `strict: true`, SDK helpers, limits. |
| `06` | `https://platform.claude.com/docs/en/build-with-claude/thinking` | `2026-11-24` | Adaptive/manual thinking, `display`, prefix checks. |
| `06` | `https://platform.claude.com/docs/en/build-with-claude/thinking-steering-and-cost` | `2026-11-24` | Steering order, cost & caching interactions. |
| `06` | `https://platform.claude.com/docs/en/build-with-claude/effort` | `2026-11-24` | `output_config.effort` levels and per-model matrix. |
| `08` | `https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations` | `2026-11-24` | Grounding, quotes, uncertainty, best-of-N. |
| `08` | `https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/increase-consistency` | `2026-11-24` | Structured outputs, examples, KB retrieval, character. |
| `08` | `https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks` | `2026-11-24` | Direct/indirect injection, `tool_result`, Haiku screen. |
| `08` | `https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-prompt-leak` | `2026-11-24` | Post-processing, secret omission, conditional use. |
| `09` | `https://platform.claude.com/docs/en/test-and-evaluate/develop-tests` | `2026-11-24` | Criteria, eval design, metric pairings, graders. |
| `09` | `https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-latency` | `2026-11-24` | TTFT vs. baseline latency, `haiku-5-5`, streaming. |

## 2. Claude Model-Specific Prompting Pages (`[Claude docs]`)

| Reference File | Exact Source URL | Fetched | Model(s) Covered |
| --- | --- | --- | --- |
| `11-fable-5-2.md` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2` | `2026-11-24` | Claude Fable 5.2 & Mythos 5.2 |
| `12-opus-5-5.md` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5` | `2026-11-24` | Claude Opus 5.5 |
| `13-sonnet-5-5.md` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5` | `2026-11-24` | Claude Sonnet 5.5 |
| `14-haiku-5-5.md` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-haiku-5-5` | `2026-11-24` | Claude Haiku 5.5 |
| `15-legacy-models.md` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1` | `2026-11-24` | Claude Fable 5.1 & Mythos 5.1 |
| `15-legacy-models.md` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5` | `2026-11-24` | Claude Fable 5 & Mythos 5 |
| `15-legacy-models.md` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5` | `2026-11-24` | Claude Opus 5 |
| `15-legacy-models.md` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-4-8` | `2026-11-24` | Claude Opus 4.8 |
| `15-legacy-models.md` | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5` | `2026-11-24` | Claude Sonnet 5 |

*(Cross-referenced cookbook URL cited in source docs: `https://platform.claude.com/cookbook/multimodal-crop-tool` — not separately fetched.)* `[Claude docs]`

## 3. Open-Weight Model Cards & Format Docs (`16`–`19`, `[Vendor]`)

| Reference File | Model / Spec | Exact URL | URL Provenance (`embedded` vs. `derived`) | Fetched |
| --- | --- | --- | --- | --- |
| `16-deepseek-r1.md` | **DeepSeek-R1** | `https://huggingface.co/deepseek-ai/DeepSeek-R1` | **Embedded** directly in model card. | `2026-11-24` |
| `16-deepseek-r1.md` | **DeepSeek-R1-0528** | `https://huggingface.co/deepseek-ai/DeepSeek-R1-0528` | **Derived** from card; embeds `https://github.com/deepseek-ai/DeepSeek-R1`. | `2026-11-24` |
| `17-qwen3.md` | **Qwen3-235B-A22B** | `https://huggingface.co/Qwen/Qwen3-235B-A22B` | **Embedded** via `LICENSE` link in model card. | `2026-11-24` |
| `17-qwen3.md` | **Qwen3-32B** | `https://huggingface.co/Qwen/Qwen3-32B` | **Embedded** via `LICENSE` link in model card. | `2026-11-24` |
| `17-qwen3.md` | **Qwen3-235B-A22B-Instruct-2507** | `https://huggingface.co/Qwen/Qwen3-235B-A22B-Instruct-2507` | **Embedded** via `LICENSE` link in model card. | `2026-11-24` |
| `17-qwen3.md` | **Qwen3-235B-A22B-Thinking-2507** | `https://huggingface.co/Qwen/Qwen3-235B-A22B-Thinking-2507` | **Embedded** via `LICENSE` link in model card. | `2026-11-24` |
| `18-gpt-oss.md` | **OpenAI `gpt-oss-120b`** | `https://huggingface.co/openai/gpt-oss-120b` | **Derived** from `model_id = "openai/gpt-oss-120b"` in model card. | `2026-11-24` |
| `18-gpt-oss.md` | **OpenAI `gpt-oss-20b`** | `https://huggingface.co/openai/gpt-oss-20b` | **Embedded** directly in model card. | `2026-11-24` |
| `18-gpt-oss.md` | **Harmony Repo** | `https://github.com/openai/harmony` | **Embedded** directly in Harmony README. | `2026-11-24` |
| `18-gpt-oss.md` | **Harmony Cookbook Guide** | `https://cookbook.openai.com/articles/openai-harmony` | **Embedded** in Harmony README. | `2026-11-24` |
| `19-llama.md` | **Meta Llama 3.3 70B Instruct** | `https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct` | **Derived** from card; embeds `https://github.com/meta-llama/llama-models/blob/main/models/llama3_3/LICENSE`. | `2026-11-24` |
| `19-llama.md` | **Llama 3.3 & 4 Prompt Format Docs** | `https://github.com/meta-llama/llama-models` | **Derived** from model-card repo links. | `2026-11-24` |
| `19-llama.md` | **Meta Llama 4 (`Scout` / `Maverick`)** | `https://huggingface.co/meta-llama` | **Derived** (exact HF repo slug not embedded); card embeds `https://github.com/meta-llama/llama-models/blob/main/models/llama4/LICENSE`. | `2026-11-24` |

## 4. Google Gemini API Docs & DeepMind Model Cards (`20`–`21`, `[Vendor]`)

| Reference File(s) | Model / Topic | Exact URL | Fetched | Notes |
| --- | --- | --- | --- | --- |
| `20`, `21`, `03`, `10` | **Gemini API Models** | `https://ai.google.dev/gemini-api/docs/models` | `2026-11-24` | Model IDs, limits, modalities, capabilities. |
| `20`, `21`, `03` | **Prompting Strategies** | `https://ai.google.dev/gemini-api/docs/prompting-strategies` | `2026-11-24` | Structure, system instructions, long context. |
| `20`, `21`, `03`, `10` | **Gemini Thinking** | `https://ai.google.dev/gemini-api/docs/thinking` | `2026-11-24` | `thinking_level`, `include_thoughts`, `max_output_tokens`. |
| `20`, `21`, `03`, `10` | **Thought Signatures** | `https://ai.google.dev/gemini-api/docs/thought-signatures` | `2026-11-24` | Encrypted reasoning state & `400` enforcement. |
| `20`, `21` | **Interactions API** | `https://ai.google.dev/gemini-api/docs/interactions` | `2026-11-24` | Stateful `store: true` / `previous_interaction_id` vs. stateless steps. |
| `20`, `21`, `03` | **Structured Outputs** | `https://ai.google.dev/gemini-api/docs/structured-outputs` | `2026-11-24` | `response_mime_type`, `response_json_schema`, Pydantic/Zod. |
| `20`, `21` | **Function Calling** | `https://ai.google.dev/gemini-api/docs/function-calling` | `2026-11-24` | Tool declarations, parallel calls, signature continuity. |
| `20` | **Context Caching** | `https://ai.google.dev/gemini-api/docs/caching` | `2026-11-24` | Implicit caching rules (`>=4,096` tokens on Gemini 4). |
| `20` | **DeepMind Model Cards Hub** | `https://deepmind.google/models` | `2026-11-24` | Index to DeepMind model cards. |
| `20` | **Gemini 4 Carbon Card** | `https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-4-Carbon-Model-Card.pdf` | `2026-11-24` | Official DeepMind model card PDF. |
| `20` | **Gemini 4 Neon Card** | `https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-4-Neon-Model-Card.pdf` | `2026-11-24` | Official DeepMind model card PDF. |
| `20` | **Gemini 4 Hydrogen Card** | `https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-4-Hydrogen-Model-Card.pdf` | `2026-11-24` | Official DeepMind model card PDF. |
| `20` | **Gemini 4 Argon Card** | `https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-4-Argon-Model-Card.pdf` | `2026-11-24` | Official DeepMind model card PDF. |
| `21` | **Gemini 3.8 Flash Card** | `https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-3-8-Flash-Model-Card.pdf` | `2026-11-24` | Official DeepMind model card PDF. |

## 5. Agent Plugins 1.0.0 & Agent Skills Specifications (`[Vendor]`)

| Spec Artifact | Exact Fetched URL | HTTP Status & Content-Type | Fetched |
| --- | --- | --- | --- |
| **Agent Plugins Specification** | `https://agent-plugins.org/specification` | `200` (`text/html; charset=utf-8`) | `2026-11-24` |
| **Agent Plugins Schemas Overview** | `https://agent-plugins.org/schemas` | `200` (`text/html; charset=utf-8`) | `2026-11-24` |
| **Plugin Schema v1.0.0** | `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json` | `200` (`application/json; charset=utf-8`) | `2026-11-24` |
| **Build an Agent Plugin Guide** | `https://agent-plugins.org/plugin-authors/build-an-agent-plugin` | `200` (`text/html; charset=utf-8`) | `2026-11-24` |
| **Plugin Manifest Reference** | `https://agent-plugins.org/plugin-authors/manifest` | `200` (`text/html; charset=utf-8`) | `2026-11-24` |
| **Plugin Skills Authoring** | `https://agent-plugins.org/plugin-authors/skills` | `200` (`text/html; charset=utf-8`) | `2026-11-24` |
| **Compatible Clients** | `https://agent-plugins.org/compatible-clients` | `200` (`text/html; charset=utf-8`) | `2026-11-24` |
| **Agent Skills Specification** | `https://agentskills.io/specification.md` | `200` (`text/markdown; charset=utf-8`) | `2026-11-24` |
| **Plugin Schema v1.1.0 Probe** | `https://agent-plugins.org/schemas/1.1.0/plugin.schema.json` | `404` (`text/html; charset=utf-8`) — confirms `1.0.0` is latest | `2026-11-24` |
| **MCP Servers Authoring** | `https://agent-plugins.org/plugin-authors/mcp-servers` | `200` (`text/html; charset=utf-8`) | `2026-11-24` |
| **Client Extensions Authoring** | `https://agent-plugins.org/plugin-authors/client-extensions` | `200` (`text/html; charset=utf-8`) | `2026-11-24` |

## 6. Provenance & Verification Notes `[General]`

- **Claude redirects:** `be-clear-and-direct`, `use-xml-tags`, `long-context-tips`, `chain-of-thought`, and `extended-thinking-tips` all resolve to `claude-prompting-best-practices`. `[Claude docs]`
- **Unfetched cross-references (`unverified`):** The Opus 5.5 (4 breaking API changes), Sonnet 5.5 (5 breaking API changes), and Haiku 5.5 migration guides, Managed Agents API specs, and `multimodal-crop-tool` cookbook code were not separately fetched—their unstated details remain `unverified`. `[General]`
