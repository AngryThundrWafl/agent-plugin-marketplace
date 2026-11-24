---
name: Meta Llama 3.3 and Llama 4 prompting reference
source:
  - https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct
  - https://huggingface.co/meta-llama
  - https://github.com/meta-llama/llama-models
fetched: 2026-11-24
covers: Meta Llama 3.3 70B Instruct, Llama 4 Scout, Llama 4 Maverick, special tokens and template differences, multimodal image encoding, system prompt steerability, zero-shot and built-in tool calling, external guardrails, anti-patterns
---

# Meta Llama 3.3 (`70B-Instruct`) & Llama 4 (`Scout`, `Maverick`)

Tags: `[Vendor]` = directly from the vendor model cards and prompt-format docs above. `[General]` = cross-source synthesis (must be tested). `unverified` = vendor docs are silent; nothing extrapolated from other models.

## 1. Model, Modality & Context Summary `[Vendor]`

| Model | Architecture & Modalities | Native Context | Sampling & Max Output | Thinking Control |
| :--- | :--- | :--- | :--- | :--- |
| **Llama 3.3** (`70B-Instruct`) | Text-only with GQA, 15T+ tokens, cutoff Dec 2023, 8 supported languages (`en`, `de`, `fr`, `it`, `pt`, `hi`, `es`, `th`) | `128K` | `unverified` | None (`unverified`) |
| **Llama 4 Scout** | Early-fusion multimodal MoE (17B×16E, 109B total, ~40T tokens; BF16 or on-the-fly int4 for 1× H100), text + up to 5 tested input images, cutoff Aug 2024, 12 languages | `10M` | `unverified` | None (`unverified`) |
| **Llama 4 Maverick** | Early-fusion multimodal MoE (17B×128E, 400B total, ~22T tokens; BF16 or FP8 for 1× H100 DGX), text + up to 5 tested input images, cutoff Aug 2024, 12 languages | `1M` | `unverified` | None (`unverified`) |

*(Llama 4 adds `ar`, `id`, `tl`, `vi` to Llama 3.3's 8 supported languages; pre-trained on 200 languages.)* `[Vendor]`

## 2. Special Tokens & Template Differences (Llama 3.3 vs. Llama 4) `[Vendor]`

| Template Element | Llama 3.3 (`70B-Instruct`) | Llama 4 (`Scout` / `Maverick`) |
| :--- | :--- | :--- |
| BOS / Base EOS / Pad | `<\|begin_of_text\|>`, `<\|end_of_text\|>` (base only), `<\|finetune_right_pad_id\|>` | `<\|begin_of_text\|>`, `<\|end_of_text\|>` (base only) |
| Header wrapper | `<\|start_header_id\|>{role}<\|end_header_id\|>\n\n` | `<\|header_start\|>{role}<\|header_end\|>\n\n` |
| Turn / tool stop | `<\|eot_id\|>` (turn end), `<\|eom_id\|>` (built-in/JSON continuation) | `<\|eot\|>` (turn end; `<\|eom\|>` appears in multi-image example) |
| Roles | `system`, `user`, `assistant`, `tool` (header `ipython` for built-in output) | `system`, `user`, `assistant` |
| Built-in tool tag | `<\|python_tag\|>` (`Environment: ipython`, `brave_search`, `wolfram_alpha`) | Not in Llama 4 token table (`unverified`) |
| Multimodal tokens | None (text-only) | `<\|image_start\|>`, `<\|image\|>`, `<\|patch\|>`, `<\|tile_x_separator\|>`, `<\|tile_y_separator\|>`, `<\|image_end\|>` |

## 3. Multimodal Format, Steerability & Tool Calling `[Vendor]`

- **Turn framing:** Both versions separate the role header from message content with `\n\n` and end the prompt with an open assistant header (`...\n\n`) to trigger generation; Llama 3.3 base completion uses `<|begin_of_text|>` alone with `<|end_of_text|>` as base-only EOS. `[Vendor]`
- **Llama 4 image encoding:**
  - Small images (below tile size) place `<|image|>` before patches with no tile separators (`<|image_start|><|image|><|patch|>...<|image_end|>`). `[Vendor]`
  - Larger images emit patch grids separated by `<|tile_x_separator|>`/`<|tile_y_separator|>` followed by `<|image|>` and downscaled single-tile patches; wrap each image in its own `<|image_start|>...<|image_end|>` block for multi-image prompts. `[Vendor]`
- **System prompt steerability (Llama 4):** Strong `system` prompts reduce false refusals and preachy/templated phrasing (card template bans `"it's important to"`, `"it's crucial to"`, `"it's essential to"`, `"it's unethical to"`, `"it's worth noting..."`, `"Remember..."`). Both Llama 3.3 and Llama 4 expect external guardrails (`Llama Guard`, `Prompt Guard`, `Code Shield`). `[Vendor]`
- **Zero-shot tool calling (recommended on 3.3 & 4):**
  - Supply JSON schemas in `system` or `user`; model outputs parallel Pythonic calls `[func1(k=v), func2(...)]` ending with `<|eot_id|>` (3.3) or `<|eot|>` (4). `[Vendor]`
  - Llama 4's prompt enforces strict rules: emit function calls without mixing prose, call only listed functions, avoid returning `[]`, and summarize tool outputs concisely without verbatim repetition. Custom `<function=name>{json}</function>` tags also work via prompt instructions. `[Vendor]`
- **Built-in & JSON single-tool calling (Llama 3.3):** `Environment: ipython` implicitly enables code interpreter; `Tools: brave_search, wolfram_alpha` adds search/math. Calls start with `<|python_tag|>` and stop with `<|eom_id|>`; tool responses return under `<|start_header_id|>ipython<|end_header_id|>`. JSON single-tool calling with `Environment: ipython` also emits `<|python_tag|>{...}<|eom_id|>`. `[Vendor]`

## 4. Starter Skeleton & Anti-Patterns `[Vendor]`

- **Llama 4 zero-shot tool-use starter skeleton** (keep Llama 4 header/stop tokens separate from Llama 3.3 tokens): `[Vendor]` `[General]`
  ```text
  <|begin_of_text|><|header_start|>system<|header_end|>

  You are a helpful assistant with tool access. Avoid preachy phrasing ("it's important to", "it's crucial to", "Remember...").
  Available tools (JSON schemas): {{tool_schemas_json}}
  Rules: Output parallel Pythonic calls as [func1(k=v), func2(...)] only—never mix prose with calls, never invent functions, never emit [], and summarize tool results concisely.<|eot|><|header_start|>user<|header_end|>

  {{user_request}}<|eot|><|header_start|>assistant<|header_end|>

  ```
- **Anti-patterns to avoid:**
  - Keep Llama 3.3 tokens (`<|start_header_id|>`, `<|eot_id|>`) strictly separate from Llama 4 tokens (`<|header_start|>`, `<|eot|>`)—note Llama 4's upstream prompt-format doc has a stray `<|eot_id|>` typo in one custom-tool example before `<|eot|>`. `[Vendor]`
  - Keep zero-shot tool calls on Llama 4 free of surrounding prose. `[Vendor]`
  - Avoid deploying on unsupported languages without fine-tuning and external system safety controls. `[Vendor]`

## 5. Gaps / `unverified` `[Vendor]`

- Recommended sampling parameters (`temperature`, `top_p`, `top_k`, `min_p`, `presence_penalty`), max output tokens, few-shot guidance, grammar-constrained JSON enforcement, and any Llama 4 `<|python_tag|>` equivalent are `unverified` in the vendor cards and prompt-format documentation.
