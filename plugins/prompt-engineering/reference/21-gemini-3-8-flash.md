---
name: Google Gemini 3.8 Flash prompting reference
source:
  - https://ai.google.dev/gemini-api/docs/models
  - https://ai.google.dev/gemini-api/docs/prompting-strategies
  - https://ai.google.dev/gemini-api/docs/thinking
  - https://ai.google.dev/gemini-api/docs/thought-signatures
  - https://ai.google.dev/gemini-api/docs/interactions
  - https://ai.google.dev/gemini-api/docs/structured-outputs
  - https://ai.google.dev/gemini-api/docs/function-calling
  - https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-3-8-Flash-Model-Card.pdf
fetched: 2026-11-24
covers: Gemini 3.8 Flash (gemini-3.8-flash), 1M input / 65K output limits, thinking_level (low/medium/high, minimal unsupported), temperature 1.0 default, thought_signature and previous_interaction_id, structured outputs, paired invariant framing, agentic prompting, anti-patterns
---

# Google Gemini 3.8 Flash (`gemini-3.8-flash`)

Tags: `[Vendor]` = directly from Google Gemini API docs and the Gemini 3.8 Flash Model Card above. `[General]` = cross-source synthesis (must be tested). `unverified` = vendor docs are silent or variant details were not confirmed; nothing extrapolated from other models.

Contents: 1 Specs & thinking_level · 2 Temperature & API migration · 3 Multi-turn, tools & structured outputs · 4 Prompting patterns & skeleton · 5 Gaps

## 1. Model Specs & `thinking_level` Controls `[Vendor]`

`gemini-3.8-flash` is a Flash-class reasoning model built for cost-effective scaling, long-horizon software engineering, multimodal parsing, and multi-step agentic tool loops. *(Related Gemini 3.8 variants on `ai.google.dev/gemini-api/docs/models` include `gemini-3.8-flash-lite`, `gemini-3.8-live`, `gemini-3.8-live-extended-thinking`, `gemini-3.8-flash-tts`, and `gemini-3.8-flash-lite-tts`.)* `[Vendor]`

| Model ID | Context / Max Output | Supported `thinking_level` | Default | Unsupported / Error Triggers |
| :--- | :--- | :--- | :--- | :--- |
| **`gemini-3.8-flash`** | `1,048,576` input / `65,536` `max_output_tokens` | `low`, `medium`, `high` | **`medium`** | `thinking_level="minimal"` and legacy `thinking_budget` → validation error |

- **Combined output ceiling:** `max_output_tokens` caps the **sum** of internal thinking tokens (`thoughtsTokenCount`) and final visible candidate tokens (`candidatesTokenCount`). If the budget is too tight at `high` thinking, the API returns `MAX_TOKENS` with truncated or empty visible text. `[Vendor]`
- **Level selection:**
  - `low`: Minimal latency and token spend for simple instruction following, fast chat, routing, and high-throughput classification. `[Vendor]`
  - `medium` **(default)**: Balanced speed and intelligence for interactive coding, agentic tool execution, and general multi-step tasks. `[Vendor]`
  - `high`: Deepest reasoning for complex math, logic, and multi-file code refactoring. `[Vendor]`
- **Thought summaries & modalities:** Accepts text, image, audio, video, and PDFs; supports `include_thoughts=True` for thought summaries, function calling, structured outputs, code execution, Google Search/Maps grounding, and Computer Use (preview). `[Vendor]`

## 2. Temperature, Sampling & Migration From `3.7 Flash` `[Vendor]`

- **Keep `temperature` at default (`1.0`):** Google recommends **not** lowering `temperature` to constrain Gemini 3 reasoning models—lowering temperature can cause output degradation, loops, or unnatural formatting constraints. `[Vendor]`
- **Clean up legacy parameters when upgrading from `3.7 Flash` or older versions:**
  - Update the model string to `gemini-3.8-flash`. `[Vendor]`
  - Replace `thinking_budget` with `thinking_level` (`low`, `medium`, or `high`). `[Vendor]`
  - Replace `thinking_level="minimal"` (supported on `3.6`/`3.7 Flash`, **unsupported** on `3.8 Flash`) with `"low"`. `[Vendor]`
  - Remove deprecated sampling parameters (`temperature` overrides, `top_p`, `top_k`, `candidate_count`) per current Gemini 3 migration guidance. `[Vendor]`
  - Replace prefilled model turns with standard multi-turn history or server-side `previous_interaction_id`. `[Vendor]`

## 3. Multi-Turn `thought_signature`, Tools & Structured Outputs `[Vendor]`

- **Preserve `thought_signature` across turns & tool calls:** Multi-turn conversations and function-calling loops require echoing the encrypted `thoughtSignature` (attached to the final part of text turns or the first `functionCall` part in parallel calls); omitting it causes a `400` validation error. Use `google-genai` / `@google/genai` chat history objects or Interactions API `previous_interaction_id` / `store: true` so signatures pass automatically. `[Vendor]`
- **Structured outputs alongside tools & thinking:** Pair `response_mime_type="application/json"` with `response_schema` or `response_json_schema` (or Pydantic/Zod types). Structured outputs work simultaneously with function calling and `thinking_level`. Ensure `max_output_tokens` leaves headroom above thinking tokens so JSON is not cut off at `MAX_TOKENS`. `[Vendor]`

## 4. Prompting Patterns, Starter Skeleton & Anti-Patterns `[Vendor]`

- **Top-down prompt anatomy:** Order instructions cleanly using XML tags or Markdown headers: (1) critical rules/constraints, (2) context and reference material, (3) edge-case definitions, (4) direct task, and (5) output/verification rules. `[Vendor]`
- **Inverted-pyramid long context:** When passing large files, logs, or transcripts (up to 1M tokens), place the bulk reference data **first** and put the extraction rule or question at the **very bottom** (e.g., `"Using exclusively the documentation provided above..."`). `[Vendor]`
- **Paired invariant framing over bare prohibitions:** Pair positive mandates with explicit negative boundaries rather than relying on standalone `"Don't ..."` lines—for example: `"Positive Mandate: Restrict all edits exclusively to existing paths. Negative Constraint: Absolute prohibition on instantiating new files on disk."` `[Vendor]`
- **Prompt for agentic verification:** For coding and multi-step engineering tasks, instruct the model to plan, execute/dry-run, check boundary conditions, and self-correct before returning the final patch; explicitly cap explanation verbosity if you want terse output. `[Vendor]`
- **Gemini 3.8 Flash starter skeleton** (`google-genai`, `medium` default, context-first, verification step): `[Vendor]` `[General]`
  ```python
  from google import genai
  from google.genai import types

  client = genai.Client()

  response = client.models.generate_content(
      model="gemini-3.8-flash",
      contents=[
          "<context>\n{{codebase_or_documents}}\n</context>",
          (
              "<task>\nBased exclusively on the context above, {{concrete_task}}.\n"
              "Verify boundary conditions and edge cases before finalizing.\n</task>"
          ),
      ],
      config=types.GenerateContentConfig(
          system_instruction=(
              "You are an autonomous engineering assistant. "
              "Positive Mandate: Restrict edits strictly to requested files. "
              "Negative Constraint: Avoid creating extra files or unrequested boilerplate."
          ),
          thinking_config=types.ThinkingConfig(
              thinking_level="medium",
              include_thoughts=True,
          ),
          max_output_tokens=16384,
      ),
  )
  ```
- **Anti-patterns to avoid:**
  - **Passing `thinking_level="minimal"` or `thinking_budget`:** Rejected by `gemini-3.8-flash`; use `"low"` instead. `[Vendor]`
  - **Lowering `temperature` below `1.0`:** Risks repetition loops or formatting degradation on Gemini 3 reasoning models. `[Vendor]`
  - **Setting tight `max_output_tokens` at `thinking_level="high"`:** Thinking tokens share the `max_output_tokens` cap and can starve visible output (`MAX_TOKENS`). `[Vendor]`
  - **Dropping `thought_signature` or using prefilled model turns:** Fails validation; rely on SDK response objects or `previous_interaction_id`. `[Vendor]`

## 5. Gaps / `unverified` `[Vendor]`

- Implicit vs. explicit context caching behavior on `gemini-3.8-flash`, per-item `media_resolution` granularity, long-decode support beyond `65,536` output tokens, exact `thinking_level` options for `gemini-3.8-flash-lite` and `gemini-3.8-live`, and exact few-shot count guidelines are `unverified` in the reviewed sources.
