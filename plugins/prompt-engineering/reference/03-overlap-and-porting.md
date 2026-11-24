---
name: Cross-family overlap and porting guide
source:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  - https://platform.claude.com/docs/en/build-with-claude/thinking
  - https://platform.claude.com/docs/en/build-with-claude/structured-outputs
  - https://huggingface.co/deepseek-ai/DeepSeek-R1
  - https://huggingface.co/deepseek-ai/DeepSeek-R1-0528
  - https://huggingface.co/Qwen/Qwen3-235B-A22B
  - https://huggingface.co/openai/gpt-oss-120b
  - https://github.com/openai/harmony
  - https://github.com/meta-llama/llama-models
  - https://ai.google.dev/gemini-api/docs/prompting-strategies
  - https://ai.google.dev/gemini-api/docs/thinking
  - https://ai.google.dev/gemini-api/docs/thought-signatures
  - https://ai.google.dev/gemini-api/docs/structured-outputs
fetched: 2026-11-24
covers: What transfers cleanly vs. what breaks when porting prompts across Claude 4.8–5.5/Fable, Google Gemini (Gemini 4 and 3.8 Flash), and open-weight families (DeepSeek-R1/0528, Qwen3, gpt-oss, Llama 3.3/4)
---

# Cross-Family Overlap & Porting Guide

Tags: `[Claude docs]` = from the fetched Claude Platform docs above. `[Vendor]` = from Google Gemini and open-weight vendor docs. `[General]` = cross-family synthesis (must be tested). `unverified` = source docs silent.

Contents: 1 Transfers cleanly · 2 What breaks · 3 Claude-to-Claude traps · 4 Porting checklist · 5 Gaps · 6 Wire-format comparison

## 1. What Transfers Cleanly Across Families `[General]`

- **Explicit task criteria & step ordering:** Clear scope, numbered steps, explicit stop/uncertainty conditions, and empirical evals before tuning transfer across Claude, Gemini, and open-weight models. `[Claude docs]` `[Vendor]` `[General]`
- **Context-first / query-last grounding:** Placing large reference inputs above instructions/queries and requiring inline or quote-first attribution works across Claude (`<documents>` + `<quotes>`), Google Gemini (bulk context first, concrete query at bottom), and DeepSeek-R1-0528 (`[file content begin]` / `[webpage X begin]` + `[citation:X]`). `[Claude docs]` `[Vendor]` `[General]`
- **Untrusted-input isolation:** Separating developer instructions from retrieved/user-pasted content transfers conceptually, though the wire container differs (`tool_result` JSON + random-ID `<pasted_content>` tags on Claude vs. Gemini `system_instruction` separation vs. Harmony roles vs. Llama `system` separation). `[Claude docs]` `[Vendor]` `[General]`
- **Model-level vs. prompt-level responsibility:** Irreversible/payment gates, hard timeouts, and completion loops belong in harness/tool code rather than prompt prose alone across all models. `[Claude docs]` `[General]`

## 2. What Breaks When Porting Across Families

- **System prompt role semantics:**
  - **Claude:** Uses a dedicated `system` parameter (`role: "system"` mid-conversation on supported models); mutating `system` mid-thread breaks prefix checks (`400`) on preserved-thinking models (`Fable 5.1/5.2`, `Opus/Sonnet/Haiku 5.5`). `[Claude docs]`
  - **Google Gemini (`Gemini 4` & `3.8 Flash`):** Uses `system_instruction` in generation config to set persistent persona, formatting, and temporal constraints separately from `contents`. `[Vendor]`
  - **DeepSeek-R1 vs. R1-0528:** Original `DeepSeek-R1` instructs **avoiding** a system prompt and putting all instructions in `user`; `R1-0528` restores `system` support (identity + current date). `[Vendor]`
  - **OpenAI `gpt-oss`:** `system` is locked to verbatim OpenAI identity, knowledge cutoff, current date, `Reasoning:` level, valid channels, and built-in tools (`browser`, `python`); custom system instructions and functions belong in `developer`. `[Vendor]`
  - **Llama 4:** Strong `system` prompts actively suppress false refusals and preachy boilerplate. `[Vendor]`
- **Assistant prefill vs. thinking injection:**
  - **Claude `4.6+` & `Mythos Preview`:** Last-turn assistant prefill is removed (`400` error); replace with `output_config.format`, system rules, or `user` continuation turns. `[Claude docs]`
  - **Google Gemini (`Gemini 4` & `3.8 Flash`):** Replace prefilled model turns with standard multi-turn history, `system_instruction`, `response_json_schema`, or Interactions API `previous_interaction_id`. `[Vendor]`
  - **Original DeepSeek-R1:** *Requires* prefilling `<think>\n` at the start of the assistant output so it does not bypass reasoning with `<think>\n\n</think>`; `R1-0528` drops this requirement, and `Qwen3-235B-A22B-Thinking-2507` injects `<think>` inside its chat template. `[Vendor]`
- **Sampling & greedy decoding:**
  - **Claude `4.7+` / API `2026-10-21`:** Rejects non-default `temperature`/`top_p`/`top_k` (and under `2026-10-21`, rejects *any* sampling parameter) with `400`. `[Claude docs]`
  - **Google Gemini (`Gemini 4` & `3.8 Flash`):** Gemini 4 ignores custom `temperature`/`top_p`/`top_k`; Gemini 3.8 Flash recommends keeping `temperature=1.0` (lowering risks output degradation or loops) and dropping deprecated sampling overrides. `[Vendor]`
  - **Qwen3 & DeepSeek-R1:** **Greedy decoding (`temperature=0`) breaks thinking** with severe degradation and repetition loops; use `0.6`/`0.95` (`TopK=20`, `MinP=0` on Qwen3 thinking; `0.7`/`0.8` on Qwen3 non-thinking). Optional `presence_penalty` `0`–`2` reduces Qwen3 repetitions (high values risk language mixing). `gpt-oss` and Llama 3.3/4 sampling defaults are `unverified`. `[Vendor]`
- **Claude-to-Claude quick defaults:** For `4.8+`, `5.x`, `5.2`, and `5.5`, prefer `output_config.effort` + `output_config.format` + `tool_choice: auto` over legacy `budget_tokens`, prefill, sampling params, and forced tool calls. `[Claude docs]`
- **Context-extension & multi-image wiring:**
  - **Claude `4.8`–`5.5`:** `1M` default/max documented for `Opus 4.8` and `Opus 5`; prompt-level long-context rule places documents at the top and query at the bottom (`+30%` quality). `[Claude docs]`
  - **Qwen3:** Static YaRN (`factor: 4.0` → `131K`) hurts short-text performance if left enabled on `<=32K` prompts; `2507` `1M` uses DCA + MInference. **Llama 4:** supports up to `5` tested input images wrapped individually in `<|image_start|>...<|image_end|>`. `[Vendor]`
- **Delimiters, chat envelopes & special tokens:**
  - **Claude:** XML tags (`<instructions>`, `<examples>`, `<documents>`) + `tool_result` JSON wrappers. `[Claude docs]`
  - **`gpt-oss`:** Harmony (`o200k_harmony`) is mandatory (`<|start|>`, `<|end|>`, `<|message|>`, `<|channel|>`, `<|constrain|>`, `<|call|>`, `<|return|>`); models fail outside Harmony. `[Vendor]`
  - **Llama 3.3 vs. Llama 4:** Incompatible header/stop tokens (`<|start_header_id|>`, `<|eot_id|>`, `<|eom_id|>` vs. `<|header_start|>`, `<|eot|>`, plus image tokens `<|image_start|>`, `<|patch|>`). `[Vendor]`
- **Thinking history retention & parsers:**
  - **Claude keep-all models (`Opus 4.5+`, `Sonnet 4.6+`, `Haiku 5.5`, `Fable 5–5.2`):** Must pass `thinking` and `redacted_thinking` blocks back unchanged in tool loops and append-only threads; read responses by `block.type` because `display: "omitted"` emits empty `thinking: ""` at index `0`. `[Claude docs]`
  - **Google Gemini (`Gemini 4` & `3.8 Flash`):** Must pass encrypted `thought_signature` back verbatim across multi-turn and function-calling loops (`400` if omitted); use `google-genai` chat objects or Interactions API (`store: true` / `previous_interaction_id`) to automate pass-back. `[Vendor]`
  - **Qwen3:** Must strip `<think>...</think>` from prior assistant turns (Jinja2 template does this automatically; custom pipelines must strip manually). `[Vendor]`
  - **`gpt-oss`:** Keep `analysis` CoT across intermediate tool calls until `final`, then drop `analysis` and normalize `<|return|>` → `<|end|>`; **never** expose `analysis` to end users. `[Vendor]`
- **JSON schema enforcement & tool calling:**
  - **Claude:** `output_config.format` (`json_schema`, `additionalProperties: false`) + `strict: true` tools guarantee grammar conformance (max `20` strict tools, `24` optional params, `16` unions; incompatible with Citations and prefill; no PHI in cached schemas). Forced `tool_choice` (`any`/`tool`) returns `400` on `Fable 5.1/5.2`, `Opus 5.5`, `Sonnet 5.5`. `[Claude docs]`
  - **Google Gemini (`Gemini 4` & `3.8 Flash`):** Pair `response_mime_type="application/json"` with `response_json_schema` / `response_schema` (Pydantic/Zod supported), alongside function calling and `thinking_level`; ensure `max_output_tokens` leaves headroom above thinking tokens. `[Vendor]`
  - **`gpt-oss`:** `# Response Formats` JSON Schema in `developer` is **advisory only**—pair with grammar-constrained sampling; declare functions as TypeScript `namespace functions` returning `any` and invoke on `commentary`. `[Vendor]`
  - **Llama 3.3 / 4 & Qwen3 / R1:** Llama 3.3/4 use zero-shot Pythonic `[func(k=v)]` (no mixed prose on Llama 4); Qwen3 uses `Qwen-Agent`; DeepSeek-R1 tool-call wire format and Llama/R1 grammar enforcement are `unverified`. `[Vendor]`
- **Few-shot examples & visible CoT:**
  - **Claude:** 3–5 diverse `<example>` blocks steer style/thinking; never ask for reasoning in visible response text (`reasoning_extraction` refusal/`400`). `[Claude docs]`
  - **Open-weight:** Few-shot rules are `unverified` across DeepSeek-R1, Qwen3, `gpt-oss`, and Llama 3.3/4 cards (vendor prompts use zero-shot directives like `\boxed{}` and `[citation:X]`). `[Vendor]`

## 3. Claude-to-Claude Porting Traps `[Claude docs]`

- **4.5/4.6 → 5.x/5.2/5.5:** Strip `budget_tokens`, last-turn assistant prefill, sampling parameters, `"CRITICAL: You MUST use tool"`, `"every 3 tool calls"` narration rules, and `"include a final verification step"` (causes Opus 5 over-verification).
- **Opus 5 → Opus 5.5:** Re-sweep `effort` (`medium` default ≈ Opus 5 `high`); migrate `thinking: disabled` (`400`) to `low` effort; check `stop_reason: "refusal"` for new bio classifiers.
- **Opus 5.5 → Fable 5.2:** Do **not** copy Opus 5.5's `"treat that answer as done"` chat lines verbatim—Fable 5.2 stopped self-correcting earlier mistakes; check code-ownership wording (duplicates vs. +70–80% tokens).
- **Sonnet 4.6 → Sonnet 5 / 5.5:** Raise `max_tokens` (`~30%` more tokens from Sonnet 5 tokenizer); avoid forced `tool_choice` on 5.5; add scope/review caps at `xhigh`/`max`.
- **Haiku 4.5 → Haiku 5.5:** Handle `stop_reason: "refusal"` (no server fallback), raise `max_tokens` for default adaptive thinking, and supply `{{current_date}}` + tool-before-JSON rule if thinking is `disabled`.

## 4. Concise Porting Checklist `[General]`

1. **Swap wire format first:** Match `system`/`system_instruction`/`developer`/`user` roles, chat template tokens, and Harmony/XML/bracket delimiters to the target model. `[General]`
2. **Reset inference controls:** Remove `temperature`/`top_p` for Claude (`4.7+`) and Gemini 4 (keep `temperature=1.0` on Gemini 3.8 Flash); enforce non-greedy `0.6`/`0.95` for Qwen3/DeepSeek-R1 thinking; map `budget_tokens` / `thinking_budget` → `output_config.effort`, `thinking_level`, or `Reasoning:`. `[Claude docs]` `[Vendor]`
3. **Update history & parser logic:** Keep Claude `thinking`/`redacted_thinking` append-only; preserve Gemini `thought_signature` verbatim (or use `google-genai` / `store: true`); strip Qwen3 `<think>`; keep `gpt-oss` `analysis` only across tool turns; read Claude blocks by `block.type` (not index `0`). `[Claude docs]` `[Vendor]`
4. **Strip legacy anti-patterns:** Delete prefill hacks, `"do not think"` lines on adaptive-only Claude models, visible-CoT tags (`reasoning_extraction`), and `"be conservative"` review bars. `[Claude docs]`
5. **Re-run evals & sweep effort/temperature:** Validate tool-call reliability, schema adherence, refusal rates, and `max_tokens` headroom on the target model before shipping. `[Claude docs]` `[General]`

## 5. Gaps / `unverified`

- Sampling defaults for `gpt-oss` and Llama 3.3/4, few-shot guidance across all four open-weight families, DeepSeek-R1/0528 tool-call wire schemas, and Llama/DeepSeek grammar-constrained JSON support remain `unverified` in the fetched sources. `[Vendor]`
- Cross-model TTFT/throughput benchmarks and breaking API changes in the unfetched Claude 5.5 migration guides also remain `unverified`. `[Claude docs]`

## 6. Quick Wire-Format Comparison (`[Claude docs]` vs. `[Vendor]`)

| Model / Family | Role Carrying Instructions | Required Wrapper / Delimiters | Thinking Block Handling in Multi-Turn History |
| --- | --- | --- | --- |
| **Claude (`4.8`–`5.5`, `Fable 5`–`5.2`)** | `system` (immutable on `5.1+`/`5.5` preserved-thinking) | XML tags + `tool_result` JSON | Pass `thinking` & `redacted_thinking` unchanged (`keep-all`) |
| **Google Gemini (`Gemini 4`, `3.8 Flash`)** | `system_instruction` | XML tags or Markdown headers | Pass `thought_signature` verbatim (`google-genai` / `store: true`) |
| **DeepSeek-R1 (original)** | `user` only (**avoid `system`**) | `<think>\n` prefill at assistant start | `unverified` across turns; `\boxed{}` for math |
| **DeepSeek-R1-0528** | `system` + `user` | `[file content begin]` / `[webpage X begin]` | Automatic CoT; no `<think>\n` prefill required |
| **Qwen3 (`235B`, `32B`, `2507`)** | `system` + `user` | `/think` or `/no_think` (when `enable_thinking=True`) | Strip `<think>...</think>` from prior assistant turns |
| **OpenAI `gpt-oss` (`120b`, `20b`)** | `developer` (`system` fixed to identity/date/`Reasoning:`) | Harmony `<\|start\|>`, `<\|channel\|>`, `<\|call\|>`, `<\|return\|>` | Keep `analysis` across tool turns; drop after `final` |
| **Llama 3.3 / Llama 4** | `system` + `user` | `3.3`: `<\|start_header_id\|>`, `<\|eot_id\|>`; `4`: `<\|header_start\|>`, `<\|eot\|>` | None (`unverified`) |
