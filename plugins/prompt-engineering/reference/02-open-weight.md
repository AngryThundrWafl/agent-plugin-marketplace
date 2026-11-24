---
name: Open-weight models prompting reference (DeepSeek-R1, Qwen3, gpt-oss, Llama 3.3 & 4)
source:
  - https://huggingface.co/deepseek-ai/DeepSeek-R1 (embedded in deepseek-r1.md)
  - https://huggingface.co/deepseek-ai/DeepSeek-R1-0528 (derived from deepseek-r1-0528.md; embeds https://github.com/deepseek-ai/DeepSeek-R1)
  - https://huggingface.co/Qwen/Qwen3-235B-A22B (embedded via LICENSE link in qwen3-235b-a22b.md)
  - https://huggingface.co/Qwen/Qwen3-32B (embedded via LICENSE link in qwen3-32b.md)
  - https://huggingface.co/Qwen/Qwen3-235B-A22B-Instruct-2507 (embedded via LICENSE link in qwen3-235b-a22b-instruct-2507.md)
  - https://huggingface.co/Qwen/Qwen3-235B-A22B-Thinking-2507 (embedded via LICENSE link in qwen3-235b-a22b-thinking-2507.md)
  - https://huggingface.co/openai/gpt-oss-120b (derived from `model_id = "openai/gpt-oss-120b"` in gpt-oss-120b.md)
  - https://huggingface.co/openai/gpt-oss-20b (embedded in gpt-oss-20b.md)
  - https://github.com/openai/harmony (embedded in openai-harmony-readme.md)
  - https://cookbook.openai.com/articles/openai-harmony (embedded in openai-harmony-readme.md; Harmony guide)
  - https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct (derived from llama3_3-model-card.md; embeds https://github.com/meta-llama/llama-models/blob/main/models/llama3_3/LICENSE)
  - https://github.com/meta-llama/llama-models (Llama 3.3 & Llama 4 prompt format docs; URL not embedded in prompt-format files, derived from model-card repo links)
  - https://huggingface.co/meta-llama (Llama 4 Scout & Maverick cards; exact HF repo slug not embedded, derived from llama4-model-card.md + https://github.com/meta-llama/llama-models/blob/main/models/llama4/LICENSE)
fetched: 2026-11-24
covers: DeepSeek-R1 & DeepSeek-R1-0528, Qwen3 (235B-A22B, 32B, Instruct-2507, Thinking-2507), OpenAI gpt-oss (120b, 20b) & Harmony format, Meta Llama 3.3 & Llama 4 (Scout, Maverick)
---

# Open-Weight Models Prompting Reference

Tags: `[Vendor]` = directly from the cached model card or vendor doc. `[General]` = cross-family synthesis (must be tested). `unverified` = cached files are silent; nothing extrapolated from other models.

## 1. Cross-Family Sampling & Context Matrix [Vendor]

| Family / Model | Temp | TopP | TopK | MinP | Presence Penalty | Native Context / Max Output | Thinking Control |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DeepSeek-R1** | `0.5`–`0.7` (`0.6` rec.) | `0.95` (evals) | `unverified` | `unverified` | `unverified` | `128K` ctx / `32,768` eval max | Prefill `<think>\n` at output start |
| **DeepSeek-R1-0528** | `0.6` | `0.95` (evals) | `unverified` | `unverified` | `unverified` | `unverified` ctx / `64K` eval max | Automatic (no `<think>\n` prefill needed) |
| **Qwen3** (`235B-A22B`, `32B`) thinking | `0.6` | `0.95` | `20` | `0` | `0`–`2` (opt.) | `32,768` (`131,072` YaRN) / `32,768` (`38,912` hard) | `enable_thinking=True` (default); `/think`, `/no_think` |
| **Qwen3** (`235B-A22B`, `32B`) non-thinking | `0.7` | `0.8` | `20` | `0` | `0`–`2` (opt.) | `32,768` (`131,072` YaRN) / `32,768` | `enable_thinking=False` (hard switch) |
| **Qwen3-235B-A22B-Instruct-2507** | `0.7` | `0.8` | `20` | `0` | `0`–`2` (opt.) | `262,144` (`1,010,000` DCA) / `16,384` | Non-thinking only (no `<think>` blocks) |
| **Qwen3-235B-A22B-Thinking-2507** | `0.6` | `0.95` | `20` | `0` | `0`–`2` (opt.) | `262,144` (`1,010,000` DCA) / `32,768` (`81,920` hard) | Thinking only (template injects `<think>`) |
| **OpenAI gpt-oss** (`120b`, `20b`) | `unverified` | `unverified` | `unverified` | `unverified` | `unverified` | `unverified` | `Reasoning: low \| medium \| high` in `system` |
| **Llama 3.3** (`70B-Instruct`) | `unverified` | `unverified` | `unverified` | `unverified` | `unverified` | `128K` ctx / `unverified` | None (`unverified`) |
| **Llama 4** (`Scout`, `Maverick`) | `unverified` | `unverified` | `unverified` | `unverified` | `unverified` | `10M` (Scout), `1M` (Maverick) / `unverified` | None (`unverified`) |

## 2. DeepSeek-R1 & DeepSeek-R1-0528 [Vendor]

### Models & Architecture [Vendor]
- **DeepSeek-R1 / DeepSeek-R1-Zero:** 671B total / 37B active MoE (based on DeepSeek-V3-Base), `128K` context. R1 adds cold-start SFT and two RL/SFT stages over R1-Zero to fix endless repetition, poor readability, and language mixing. Hugging Face `transformers` is not directly supported for the 671B models (use the `DeepSeek-V3` repo setup). [Vendor]
- **Distilled dense checkpoints:** Six models fine-tuned on 800K R1 samples use modified configs and tokenizers—run with DeepSeek-R1 settings (e.g., vLLM `--max-model-len 32768` or SGLang) rather than base Qwen2.5/Llama defaults: [Vendor]
  - Qwen2.5-based: `DeepSeek-R1-Distill-Qwen-1.5B` (`Qwen2.5-Math-1.5B`), `7B` (`Qwen2.5-Math-7B`), `14B` (`Qwen2.5-14B`), `32B` (`Qwen2.5-32B`). [Vendor]
  - Llama-based: `DeepSeek-R1-Distill-Llama-8B` (`Llama-3.1-8B`), `DeepSeek-R1-Distill-Llama-70B` (`Llama-3.3-70B-Instruct`). [Vendor]
- **DeepSeek-R1-0528:** Post-training upgrade deepening CoT (AIME avg `23K` tokens vs. `12K` on R1), lowering hallucinations, and improving function calling and vibe coding. Also adds `DeepSeek-R1-0528-Qwen3-8B` (identical architecture to `Qwen3-8B`, using `DeepSeek-R1-0528`'s tokenizer config; run like `Qwen3-8B`). [Vendor]

### Sampling, System Prompts & Thinking Controls [Vendor]
- **Sampling (DeepSeek-R1):** `temperature` `0.5`–`0.7` (`0.6` recommended); evals used `top_p=0.95`, `max_tokens=32,768`, 64 samples/query. `top_k`, `min_p`, and `presence_penalty` are `unverified`. [Vendor]
- **Sampling (DeepSeek-R1-0528):** Official web/app sets `temperature=0.6`; evals used `top_p=0.95`, `max_tokens=64K`, 16 samples/query. `top_k`, `min_p`, `presence_penalty`, and native context limit are `unverified`. [Vendor]
- **DeepSeek-R1 system & thinking rules:**
  - **Avoid adding a system prompt; put all instructions inside the user prompt.** [Vendor]
  - Because R1 tends to bypass thinking on certain queries by emitting `<think>\n\n</think>`, force every assistant response to begin with `<think>\n`. [Vendor]
- **DeepSeek-R1-0528 changes:**
  - **System prompts are supported** (official web/app prompt sets model identity and current date: `该助手为DeepSeek-R1，由深度求索公司创造。\n今天是{current date}。`). [Vendor]
  - Forcing `<think>\n` at output start is **no longer required**. [Vendor]

### Prompt Templates, Tool Use & Anti-Patterns [Vendor]
- **Math & eval directive (R1):** Include `"Please reason step by step, and put your final answer within \boxed{}."` Run multiple tests and average results. [Vendor]
- **File upload template (R1-0528):** [Vendor]
  ```text
  [file name]: {file_name}
  [file content begin]
  {file_content}
  [file content end]
  {question}
  ```
- **Web search template (R1-0528):** [Vendor]
  - Wrap retrieved pages as `[webpage X begin]...[webpage X end]`. [Vendor]
  - Instruct inline `[citation:X]` (e.g., `[citation:3][citation:5]`) at sentence ends rather than clustered at the end, multi-source synthesis (avoid repeatedly citing one page), `<=10` list bullets / `<=5` summary points, no mentioning unprovided content, and matching the user's language. [Vendor]
- **Tool calling & few-shot:** Tool calling wire format is `unverified` for R1 (R1-0528 reports BFCL_v3_MultiTurn and Tau-Bench improvements; exact schema `unverified`). Few-shot guidance is `unverified` in both cards (zero-shot directives shown). [Vendor]
- **Anti-patterns:**
  - Do **not** add a system prompt on original DeepSeek-R1 (put all instructions in the user prompt). [Vendor]
  - Do **not** sample outside `0.5`–`0.7` temperature (risks endless repetition or incoherent outputs). [Vendor]
  - Do **not** omit `<think>\n` prefill on original R1 when empty `<think>\n\n</think>` bypasses occur. [Vendor]
  - Do **not** run distilled checkpoints (`DeepSeek-R1-Distill-*`) with base Qwen2.5/Llama configs/tokenizers; run them with DeepSeek-R1 settings. [Vendor]

## 3. Qwen3 Series (`235B-A22B`, `32B`, `2507` Variants) [Vendor]

### Hybrid vs. Single-Mode Thinking Controls [Vendor]
- **Qwen3-235B-A22B** (235B/22B MoE, 128 experts/8 active) & **Qwen3-32B** (32.8B dense): Require `transformers>=4.51.0` (`transformers<4.51.0` raises `KeyError: 'qwen3_moe'` or `'qwen3'`), `sglang>=0.4.6.post1`, or `vllm>=0.8.5`. Toggle reasoning via `tokenizer.apply_chat_template(..., enable_thinking=True|False)` (`True` default). [Vendor]
  - **Hard switch (`enable_thinking=False`):** Strictly disables reasoning (matches Qwen2.5-Instruct); emits no `<think>...</think>` block and ignores user `/think` or `/no_think` tags. [Vendor]
  - **Soft switch (`enable_thinking=True`):** Append `/think` or `/no_think` in system or user messages to switch turn-by-turn (latest instruction wins). For API compatibility, `<think>...</think>` is still emitted even when `/no_think` leaves the block empty. [Vendor]
- **Qwen3-235B-A22B-Instruct-2507:** Non-thinking **only**; never emits `<think></think>` blocks and does not need `enable_thinking=False`. [Vendor]
- **Qwen3-235B-A22B-Thinking-2507:** Thinking **only**; the default chat template injects `<think>`, so raw completions contain only the closing `</think>` (token ID `151668`). [Vendor]

### Sampling, Context Windows & History Hygiene [Vendor]
- **Thinking sampling** (`enable_thinking=True` or `Thinking-2507`): `Temperature=0.6`, `TopP=0.95`, `TopK=20`, `MinP=0`. [Vendor]
- **Non-thinking sampling** (`enable_thinking=False` or `Instruct-2507`): `Temperature=0.7`, `TopP=0.8`, `TopK=20`, `MinP=0`. [Vendor]
- **`presence_penalty`:** Optional `0`–`2` to reduce endless repetitions; higher values may cause language mixing and slight performance decrease. [Vendor]
- **Output budgets:** `32,768` tokens for standard queries (`38,912` for hard math/coding on base Qwen3; `81,920` on `Thinking-2507`; `16,384` on `Instruct-2507`). [Vendor]
- **Long-context scaling:**
  - Base Qwen3 (`235B-A22B`, `32B`): `32,768` native (`max_position_embeddings=40,960` allocates `8,192` prompt + `32,768` output); extend to `131,072` via static YaRN (`{"rope_type":"yarn","factor":4.0,"original_max_position_embeddings":32768}`, or `factor: 2.0` for ~65K). Open-source frameworks apply static YaRN to all inputs; Alibaba Model Studio uses dynamic YaRN automatically. [Vendor]
  - `2507` variants: `262,144` native; extend to `1,010,000` by replacing `config.json` with `config_1m.json` and enabling Dual Chunk Attention (DCA) + MInference (`VLLM_ATTENTION_BACKEND=DUAL_CHUNK_FLASH_ATTN` / `--attention-backend dual_chunk_flash_attn`, `--enforce-eager`, `--max-num-seqs 1`, ~1000 GB total GPU memory). [Vendor]
- **Multi-turn history:** Include **only** the final response in prior assistant turns (exclude `<think>...</think>`). The Jinja2 template enforces this; custom pipelines must strip thinking manually. [Vendor]

### Standardized Prompts, Tool Calling & Anti-Patterns [Vendor]
- **Benchmark formats:** Math: `"Please reason step by step, and put your final answer within \boxed{}."` Multiple-choice: `"Please show your choice in the answer field with only the choice letter, e.g., \"answer\": \"C\"."` Few-shot guidance is `unverified`. [Vendor]
- **Tool calling & serving:** Use `Qwen-Agent` for MCP servers and built-in tools (`thought_in_content: True` when reasoning is inline rather than split into `reasoning_content`). On `Thinking-2507`, disable vLLM/SGLang reasoning and tool-call parsers when letting `Qwen-Agent` parse; otherwise serve with `--reasoning-parser qwen3` (SGLang base) or `--enable-reasoning --reasoning-parser deepseek_r1` (vLLM / `Thinking-2507`). [Vendor]
- **Anti-patterns:**
  - **DO NOT use greedy decoding** in thinking mode (causes severe performance degradation and endless repetitions). [Vendor]
  - Do **not** enable static YaRN when contexts stay `<=32,768` tokens (hurts short-text performance). [Vendor]
  - Do **not** keep `<think>` content in multi-turn conversation history. [Vendor]
  - Do **not** pass `enable_thinking=False` to `Instruct-2507` (non-thinking only) or rely on `/no_think` when `enable_thinking=False` (hard switch ignores tags). [Vendor]

## 4. OpenAI `gpt-oss` (`120b`, `20b`) & Harmony Format [Vendor]

### Models, Quantization & Sampling [Vendor]
- **`gpt-oss-120b`** (117B total / 5.1B active MoE; fits 1× 80GB GPU, fine-tunes on 1× H100 node) and **`gpt-oss-20b`** (21B total / 3.6B active; fits 16GB memory, fine-tunes on consumer hardware) use MXFP4 MoE quantization. Sampling parameters (`temperature`, `top_p`, `top_k`, `min_p`, `presence_penalty`) and max context length are `unverified` in the cached cards/docs. [Vendor]

### Mandatory Harmony Format (`o200k_harmony`) [Vendor]
- **Hard requirement:** Both models were trained on Harmony and **will not work correctly without it**. Use `openai-harmony` (Python/Rust, includes `StreamableParser`) or framework chat templates (Transformers, vLLM, Ollama). [Vendor]
- **Special tokens:** `<|start|>` (`200006`), `<|end|>` (`200007`), `<|message|>` (`200008`), `<|channel|>` (`200005`), `<|constrain|>` (`200003`), `<|return|>` (`200002`, final stop token), `<|call|>` (`200012`, tool-call stop token). [Vendor]
- **Message envelope:** `<|start|>{header}<|message|>{content}<|end|>`. [Vendor]

### Role Hierarchy, Reasoning Levels & Channels [Vendor]
- **Instruction hierarchy:** `system` > `developer` > `user` > `assistant` > `tool`. [Vendor]
- **`system` message (meta, effort & built-in tools):** [Vendor]
  - Keep identity verbatim (`You are ChatGPT, a large language model trained by OpenAI.`), `Knowledge cutoff: 2024-06`, and `Current date: YYYY-MM-DD`. [Vendor]
  - Set `Reasoning: low | medium | high` (default `medium`: balanced speed/detail; `low`: fast dialogue; `high`: deep analysis). [Vendor]
  - Include `# Valid channels: analysis, commentary, final. Channel must be included for every message.`, `Calls to these tools must go to the commentary channel: 'functions'.` (when functions exist), and built-in `# Tools` (`browser`, `python`). [Vendor]
- **`developer` message (instructions, custom tools & schemas):** [Vendor]
  - Acts as the customizable "system prompt" (`# Instructions`). [Vendor]
  - Declares custom functions (`# Tools` -> `## functions` -> TypeScript-like `namespace functions { type fn = (_: { ... }) => any; }` with `any` return type, comments above fields, and blank line between definitions). [Vendor]
  - Optionally sets `# Response Formats` (`## {format_name}` + JSON Schema)—advisory only unless paired with grammar-constrained sampling to guarantee schema adherence. [Vendor]
- **Three channels:**
  - `analysis`: Chain-of-thought plus built-in `browser.search`/`open`/`find` and stateful 120s-timeout `python` Jupyter calls (`/mnt/data`). **Do NOT expose `analysis` to end users**—it lacks `final`-channel safety standards; `python` is for internal reasoning only (not user-visible files/plots), and `browser` cites via `【{cursor}†L{line_start}(-L{line_end})?】` with `<=10` quoted words. [Vendor]
  - `commentary`: Function tool calls (`<|channel|>commentary to=functions.<name> <|constrain|>json<|message|>{...}<|call|>`) and optional user-visible action-plan preambles before multi-tool runs. Return tool outputs as `<|start|>functions.<name> to=assistant<|channel|>commentary<|message|>{output}<|end|>`. [Vendor]
  - `final`: End-user response terminated at decode time by `<|return|>`. [Vendor]
- **History persistence:** Normalize trailing `<|return|>` -> `<|end|>` in stored messages. Drop `analysis` CoT after a `final` response, **except** keep prior `analysis` CoT across intermediate tool-call turns until `final` is emitted: [Vendor]
  ```text
  <|start|>assistant<|channel|>analysis<|message|>Need get_current_weather.<|end|>
  <|start|>assistant<|channel|>commentary to=functions.get_current_weather <|constrain|>json<|message|>{"location":"San Francisco"}<|call|>
  <|start|>functions.get_current_weather to=assistant<|channel|>commentary<|message|>{"sunny":true,"temperature":20}<|end|>
  <|start|>assistant
  ```
- **Anti-patterns:**
  - Never prompt `gpt-oss` without Harmony. [Vendor]
  - Never alter the `system` identity line (put persona overrides in `developer` `# Instructions`). [Vendor]
  - Never put `browser`/`python` declarations in `developer` (they belong in `system`). [Vendor]
  - Never expose `analysis` CoT to users or retain `analysis` blocks after completed `final` turns. [Vendor]

## 5. Meta Llama 3.3 (`70B-Instruct`) & Llama 4 (`Scout`, `Maverick`) [Vendor]

### Models, Modalities & Sampling [Vendor]
- **Llama 3.3 70B Instruct:** Text-only with GQA, `128K` context, 15T+ tokens, cutoff Dec 2023, 8 supported languages (`en`, `de`, `fr`, `it`, `pt`, `hi`, `es`, `th`). [Vendor]
- **Llama 4:** Early-fusion multimodal MoEs (text + up to 5 tested input images), cutoff Aug 2024, 12 supported languages (`ar`, `id`, `tl`, `vi` added; pre-trained on 200). **Scout** (17B×16E, 109B total, `10M` context, ~40T tokens; BF16 or on-the-fly int4 for 1× H100) and **Maverick** (17B×128E, 400B total, `1M` context, ~22T tokens; BF16 or FP8 for 1× H100 DGX). [Vendor]
- **Sampling & few-shot:** `temperature`, `top_p`, `top_k`, `min_p`, `presence_penalty`, max output tokens, and few-shot rules are `unverified` in the cached Llama cards and prompt-format docs. [Vendor]

### Special Tokens & Template Differences (Llama 3.3 vs. Llama 4) [Vendor]

| Template Element | Llama 3.3 (`70B-Instruct`) | Llama 4 (`Scout` / `Maverick`) |
| :--- | :--- | :--- |
| BOS / Base EOS / Pad | `<\|begin_of_text\|>`, `<\|end_of_text\|>` (base only), `<\|finetune_right_pad_id\|>` | `<\|begin_of_text\|>`, `<\|end_of_text\|>` (base only) |
| Header wrapper | `<\|start_header_id\|>{role}<\|end_header_id\|>\n\n` | `<\|header_start\|>{role}<\|header_end\|>\n\n` |
| Turn / tool stop | `<\|eot_id\|>` (turn end), `<\|eom_id\|>` (built-in/JSON continuation) | `<\|eot\|>` (turn end; `<\|eom\|>` appears in multi-image example) |
| Roles | `system`, `user`, `assistant`, `tool` (header `ipython` for built-in output) | `system`, `user`, `assistant` |
| Built-in tool tag | `<\|python_tag\|>` (`Environment: ipython`, `brave_search`, `wolfram_alpha`) | Not in Llama 4 token table (`unverified`) |
| Multimodal tokens | None (text-only) | `<\|image_start\|>`, `<\|image\|>`, `<\|patch\|>`, `<\|tile_x_separator\|>`, `<\|tile_y_separator\|>`, `<\|image_end\|>` |

### Multimodal Format, Steerability & Tool Calling [Vendor]
- **Turn framing:** Both versions separate the role header from message content with `\n\n` and end the prompt with an open assistant header (`...\n\n`) to trigger generation; Llama 3.3 base completion uses `<|begin_of_text|>` alone with `<|end_of_text|>` as base-only EOS. [Vendor]
- **Llama 4 image encoding:**
  - Small images (below tile size) place `<|image|>` before patches with no tile separators (`<|image_start|><|image|><|patch|>...<|image_end|>`). [Vendor]
  - Larger images emit patch grids separated by `<|tile_x_separator|>`/`<|tile_y_separator|>` followed by `<|image|>` and downscaled single-tile patches; wrap each image in its own `<|image_start|>...<|image_end|>` block for multi-image prompts. [Vendor]
- **System prompt steerability (Llama 4):** Strong system prompts reduce false refusals and preachy/templated phrasing (card template bans `"it's important to"`, `"it's crucial to"`, `"it's essential to"`, `"it's unethical to"`, `"it's worth noting..."`, `"Remember..."`). Both Llama 3.3 and 4 expect external guardrails (`Llama Guard`, `Prompt Guard`, `Code Shield`). [Vendor]
- **Zero-shot tool calling (recommended on 3.3 & 4):**
  - Supply JSON schemas in `system` or `user`; model outputs parallel Pythonic calls `[func1(k=v), func2(...)]` ending with `<|eot_id|>` (3.3) or `<|eot|>` (4). [Vendor]
  - Llama 4's prompt enforces strict rules: never mix prose with calls, never invent unlisted functions, never return `[]`, and summarize tool outputs concisely without verbatim repetition. Custom `<function=name>{json}</function>` tags also work via prompt instructions. [Vendor]
- **Built-in & JSON single-tool calling (Llama 3.3):** `Environment: ipython` implicitly enables code interpreter; `Tools: brave_search, wolfram_alpha` adds search/math. Calls start with `<|python_tag|>` and stop with `<|eom_id|>`; tool responses return under `<|start_header_id|>ipython<|end_header_id|>`. JSON single-tool calling with `Environment: ipython` also emits `<|python_tag|>{...}<|eom_id|>`. [Vendor]
- **Anti-patterns:**
  - Never mix Llama 3.3 tokens (`<|start_header_id|>`, `<|eot_id|>`) with Llama 4 tokens (`<|header_start|>`, `<|eot|>`)—note Llama 4's prompt-format doc has a stray `<|eot_id|>` typo in one custom-tool example before `<|eot|>`. [Vendor]
  - Never combine text and zero-shot function calls on Llama 4. [Vendor]
  - Avoid unsupported languages without fine-tuning and system safety controls. [Vendor]

## 6. Cross-Family Synthesis [General]

- **[General] Keep chat templates, system-prompt rules, and CoT retention strictly model-scoped:** Original DeepSeek-R1 rejects system prompts while R1-0528, Qwen3, and Llama 4 depend on them; `gpt-oss` fails outside Harmony; Qwen3 strips `<think>` after every turn whereas `gpt-oss` keeps `analysis` across intermediate tool calls until `final`.
- **[General] Verify sampler floors and template-injected tags before deploying parsers or evals:** Reasoning modes (`DeepSeek-R1`, `Qwen3`) reject greedy decoding (`temp=0`) due to repetition loops, and `Qwen3-235B-A22B-Thinking-2507` injects `<think>` in the prompt template—parsers expecting `<think>` in raw completions will miss it.
- **[General] Treat cached card gaps as explicit `unverified` constraints:** Sampling defaults (`gpt-oss`, Llama 3.3/4), few-shot guidance across all four families, and R1-0528's native context limit / tool-call schema are absent from these vendor docs and should be evaluated against your inference stack before locking production defaults.

## 7. Unverified Across Cached Vendor Sources [Vendor]

- **DeepSeek-R1 / R1-0528:** `top_k`, `min_p`, `presence_penalty`, few-shot guidance, tool-calling wire format, and R1-0528 native context window. [Vendor]
- **Qwen3:** Few-shot prompting guidance across all four cached model cards. [Vendor]
- **OpenAI `gpt-oss` (`120b`, `20b`):** Recommended `temperature`, `top_p`, `top_k`, `min_p`, `presence_penalty`, and max context length. [Vendor]
- **Llama 3.3 & Llama 4:** Recommended sampling parameters (`temperature`, `top_p`, `top_k`, `min_p`, `presence_penalty`), max output tokens, few-shot guidance, and any Llama 4 `<|python_tag|>` equivalent. [Vendor]
