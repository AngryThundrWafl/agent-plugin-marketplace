---
name: Google Gemini 4 prompting reference
source:
  - https://ai.google.dev/gemini-api/docs/models
  - https://ai.google.dev/gemini-api/docs/prompting-strategies
  - https://ai.google.dev/gemini-api/docs/thinking
  - https://ai.google.dev/gemini-api/docs/thought-signatures
  - https://ai.google.dev/gemini-api/docs/interactions
  - https://ai.google.dev/gemini-api/docs/structured-outputs
  - https://ai.google.dev/gemini-api/docs/function-calling
  - https://ai.google.dev/gemini-api/docs/caching
  - https://deepmind.google/models
  - https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-4-Carbon-Model-Card.pdf
  - https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-4-Neon-Model-Card.pdf
  - https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-4-Hydrogen-Model-Card.pdf
  - https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-4-Argon-Model-Card.pdf
fetched: 2026-11-24
covers: Gemini 4 Carbon, Neon, Hydrogen, Argon, unified 1M context and long decodes, thinking_level, thought_signature, Interactions API, ignored sampling params, implicit caching, media_resolution, expanded file inputs, prompting patterns, anti-patterns
---

# Google Gemini 4 (`Carbon`, `Neon`, `Hydrogen`, `Argon`)

Tags: `[Vendor]` = directly from the Google Gemini API docs and DeepMind Model Cards above. `[General]` = cross-source synthesis (must be tested). `unverified` = vendor docs are silent or variant-specific details were not confirmed; nothing extrapolated from other models.

Contents: 1 Lineup & limits · 2 Thinking & thought signatures · 3 Sampling, caching & media · 4 Prompting & structured outputs · 5 Skeleton & anti-patterns · 6 Gaps

## 1. Lineup, Context Limits & `thinking_level` Defaults `[Vendor]`

All four Gemini 4 models share a **unified `1,048,576`-token (1M) context limit** combining input tokens, thinking tokens, function calls, and output tokens. Standard foreground streams decode up to `65,536` (`64K`) output tokens; long decodes extend up to the 1M unified ceiling (minus input tokens) via Google Gen AI SDK multi-segment handling, server-managed background execution (`background=true`), or manual `continuation_token` loops on `v1beta1`. `[Vendor]`

| Model ID | Role & Speed Profile | Supported `thinking_level` | Default `thinking_level` |
| :--- | :--- | :--- | :--- |
| **`gemini-4-carbon`** | Flagship heavy reasoning, scientific/security verification, long-horizon coding (`deliberate`) | `low`, `medium`, `high` (`xhigh`: `unverified`) | `medium` |
| **`gemini-4-neon`** | Balanced mid-tier frontier reasoning & high-frequency enterprise workflows (`moderate`) | `low`, `medium`, `high`, `xhigh` | `high` |
| **`gemini-4-hydrogen`** | High-speed, efficient everyday coding and agentic tool loops (`fast`) | `low`, `medium`, `high`, `xhigh` | `high` |
| **`gemini-4-argon`** | Initial Gemini 4 frontier release; lower token spend per turn than Carbon | `low`, `medium`, `high` (`xhigh`: `unverified`) | `medium` |

- **Modalities & tools:** Accepts text, image, audio, video, PDF, Microsoft Office (`.docx`, `.dotx`, `.doc`, `.pptx`, `.ppt`, `.xlsx`, `.xls`), and OpenDocument (`.odt`, `.odp`, `.ods`) files inline or via Cloud Storage; supports Google Search grounding, code execution, function calling, and structured outputs. `[Vendor]`

## 2. Thinking Controls, `thought_signature` & Interactions API `[Vendor]`

- **`thinking_level` validation:** Use `thinking_level` (`LOW`, `MEDIUM`, `HIGH`, `XHIGH` where supported) instead of legacy `thinking_budget`. On `gemini-4-hydrogen`, passing `thinking_budget` or `thinking_level="MINIMAL"` triggers an HTTP `400` validation error. `[Vendor]`
- **Thought summaries:** Set `include_thoughts=True` (Python) / `includeThoughts: true` to inspect high-level reasoning summaries for debugging. `[Vendor]`
- **Mandatory `thought_signature` preservation:** Gemini 4 attaches an encrypted `thoughtSignature` inside response parts (on the final text part for standard turns, and on the first `functionCall` part for parallel tool calls). Passing `thought_signature` back verbatim across multi-turn chats and function-calling loops is **required**—omitting it triggers a `400` validation error. `[Vendor]`
- **SDK & Interactions API handling:**
  - **Google Gen AI SDKs** (`google-genai`, `@google/genai`): Appending full model response objects to chat history handles `thought_signature` automatically. `[Vendor]`
  - **Interactions API (`/v1beta/interactions`):** With `store: true`, the server manages state and `thought_signature` continuity automatically; in stateless mode, internal reasoning lives in dedicated `thought` entries inside `steps`. `[Vendor]`

## 3. Sampling, Context Caching & Per-Item Media Resolution `[Vendor]`

- **Sampling parameters ignored:** Custom `temperature`, `top_p`, and `top_k` values are ignored by Gemini 4 (the API may emit deprecation warning headers) because `thinking_level` governs generation dynamics natively. Omit custom sampling overrides rather than porting low-temperature hacks from older models. `[Vendor]`
- **Context caching:** Supports **implicit caching only** (automatic on shared prompt prefixes of `4,096` tokens or more, with durable caching enabled by default). Explicit context caching is **not** supported on `gemini-4-hydrogen` (explicit caching on other Gemini 4 variants is `unverified`). `[Vendor]`
- **Per-item `media_resolution`:** Control multimodal token allocation per content item within a single request (`unspecified`, `low`, `medium`, `high`)—for example, setting a dense diagram to `"high"` while keeping supporting screenshots at `"low"`. `[Vendor]`

## 4. Prompting Strategy, System Instructions & Structured Outputs `[Vendor]`

- **Direct & concise by default:** Gemini 4 favors precision over persuasive boilerplate and defaults to concise replies. If you want a thorough, conversational, or explanatory persona, request that style explicitly. `[Vendor]`
- **Role separation via `system_instruction`:** Put persistent persona, tone, temporal anchors, and formatting rules in `system_instruction` rather than repeating them in `user` turns. Keep instructions unambiguous so long histories do not override them. `[Vendor]`
- **Delimiters & long-context placement:** Separate instructions, reference data, and examples with consistent XML tags (`<instructions>`, `<context>`, `<task>`) or Markdown headers. For large repositories, transcripts, or documents, place bulk context **first** and put the concrete question or instruction at the **end**, anchored with a bridge phrase (e.g., `"Based on the information above..."`). `[Vendor]`
- **Structured outputs:** Pair `response_mime_type="application/json"` with `response_json_schema` (JSON Schema, Pydantic in Python, or Zod in JavaScript/TypeScript) to guarantee schema-valid JSON without prose wrappers. `[Vendor]`

## 5. Starter Skeleton & Anti-Patterns `[Vendor]` `[General]`

- **Gemini 4 starter skeleton** (uses `google-genai`, `system_instruction`, `thinking_level`, context-first ordering, and SDK-managed history): `[Vendor]` `[General]`
  ```python
  from google import genai
  from google.genai import types

  client = genai.Client()

  response = client.models.generate_content(
      model="gemini-4-hydrogen",
      contents=[
          "<context>\n{{large_docs_or_codebase}}\n</context>",
          "<task>\nBased on the context above, {{concrete_task}}.\n</task>",
      ],
      config=types.GenerateContentConfig(
          system_instruction=(
              "You are a precise engineering assistant. "
              "Verify edge cases before answering and cite exact file paths."
          ),
          thinking_config=types.ThinkingConfig(
              thinking_level="high",
          ),
          # Pair with response_mime_type="application/json" + response_json_schema when JSON is required
      ),
  )
  ```
- **Anti-patterns to avoid:**
  - **Omitting `thought_signature` in manual REST / tool loops:** Causes `400` validation errors; use `google-genai` history objects, `interactions` (`store: true`), or echo signatures verbatim. `[Vendor]`
  - **Passing `thinking_budget` or `thinking_level="MINIMAL"` on Hydrogen:** Triggers `400` errors; use `thinking_level` (`low`/`medium`/`high`/`xhigh`). `[Vendor]`
  - **Tuning `temperature`/`top_p`/`top_k` to steer determinism:** Ignored on Gemini 4; adjust `thinking_level`, explicit prompt constraints, and `response_json_schema` instead. `[Vendor]`
  - **Assuming 1M foreground streaming or explicit cache APIs:** Foreground turns stream up to `65,536` tokens unless using SDK segmentation, `background=true`, or `continuation_token` (`v1beta1`), and Hydrogen supports implicit caching only. `[Vendor]`
  - **Burying the query above huge context:** Place large files and transcripts first and the task at the bottom. `[Vendor]`

## 6. Gaps / `unverified` `[Vendor]`

- Exact `xhigh` availability on `gemini-4-carbon` and `gemini-4-argon`, explicit context-caching support on `carbon`/`neon`/`argon`, few-shot example count recommendations, exact safety/refusal finish-reason enums beyond `MAX_TOKENS`, and per-variant pricing/throughput benchmarks are `unverified` in the reviewed summaries.
