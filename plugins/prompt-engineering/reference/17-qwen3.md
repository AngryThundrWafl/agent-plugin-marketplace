---
name: Qwen3 series prompting reference
source:
  - https://huggingface.co/Qwen/Qwen3-235B-A22B
  - https://huggingface.co/Qwen/Qwen3-32B
  - https://huggingface.co/Qwen/Qwen3-235B-A22B-Instruct-2507
  - https://huggingface.co/Qwen/Qwen3-235B-A22B-Thinking-2507
fetched: 2026-11-24
covers: Qwen3-235B-A22B, Qwen3-32B, Qwen3-235B-A22B-Instruct-2507, Qwen3-235B-A22B-Thinking-2507, hybrid vs single-mode thinking, sampling presets, YaRN and DCA long context, history stripping, Qwen-Agent tool calling, anti-patterns
---

# Qwen3 Series (`235B-A22B`, `32B`, `2507` Variants)

Tags: `[Vendor]` = directly from the vendor model cards above. `[General]` = cross-source synthesis (must be tested). `unverified` = vendor cards are silent; nothing extrapolated from other models.

## 1. Sampling & Context Summary `[Vendor]`

| Variant / Mode | Temp | TopP | TopK | MinP | Presence Penalty | Native Context / Max Output | Thinking Control |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Qwen3** (`235B-A22B`, `32B`) thinking | `0.6` | `0.95` | `20` | `0` | `0`–`2` (opt.) | `32,768` (`131,072` YaRN) / `32,768` (`38,912` hard) | `enable_thinking=True` (default); `/think`, `/no_think` |
| **Qwen3** (`235B-A22B`, `32B`) non-thinking | `0.7` | `0.8` | `20` | `0` | `0`–`2` (opt.) | `32,768` (`131,072` YaRN) / `32,768` | `enable_thinking=False` (hard switch) |
| **Qwen3-235B-A22B-Instruct-2507** | `0.7` | `0.8` | `20` | `0` | `0`–`2` (opt.) | `262,144` (`1,010,000` DCA) / `16,384` | Non-thinking only (no `<think>` blocks) |
| **Qwen3-235B-A22B-Thinking-2507** | `0.6` | `0.95` | `20` | `0` | `0`–`2` (opt.) | `262,144` (`1,010,000` DCA) / `32,768` (`81,920` hard) | Thinking only (template injects `<think>`) |

## 2. Hybrid vs. Single-Mode Thinking Controls `[Vendor]`

- **Qwen3-235B-A22B** (235B/22B MoE, 128 experts/8 active) & **Qwen3-32B** (32.8B dense): Require `transformers>=4.51.0` (`transformers<4.51.0` raises `KeyError: 'qwen3_moe'` or `'qwen3'`), `sglang>=0.4.6.post1`, or `vllm>=0.8.5`. Toggle reasoning via `tokenizer.apply_chat_template(..., enable_thinking=True|False)` (`True` default). `[Vendor]`
  - **Hard switch (`enable_thinking=False`):** Strictly disables reasoning (matches Qwen2.5-Instruct); emits no `<think>...</think>` block and ignores user `/think` or `/no_think` tags. `[Vendor]`
  - **Soft switch (`enable_thinking=True`):** Append `/think` or `/no_think` in system or user messages to switch turn-by-turn (latest instruction wins). For API compatibility, `<think>...</think>` is still emitted even when `/no_think` leaves the block empty. `[Vendor]`
- **Qwen3-235B-A22B-Instruct-2507:** Non-thinking **only**; never emits `<think></think>` blocks and does not need `enable_thinking=False`. `[Vendor]`
- **Qwen3-235B-A22B-Thinking-2507:** Thinking **only**; the default chat template injects `<think>`, so raw completions contain only the closing `</think>` (token ID `151668`). Parsers expecting an opening `<think>` in raw completions will miss it. `[Vendor]`

## 3. Sampling, Context Windows & History Hygiene `[Vendor]`

- **Thinking sampling** (`enable_thinking=True` or `Thinking-2507`): `Temperature=0.6`, `TopP=0.95`, `TopK=20`, `MinP=0`. `[Vendor]`
- **Non-thinking sampling** (`enable_thinking=False` or `Instruct-2507`): `Temperature=0.7`, `TopP=0.8`, `TopK=20`, `MinP=0`. `[Vendor]`
- **`presence_penalty`:** Optional `0`–`2` to reduce endless repetitions; higher values may cause language mixing and slight performance decrease. `[Vendor]`
- **Output budgets:** `32,768` tokens for standard queries (`38,912` for hard math/coding on base Qwen3; `81,920` on `Thinking-2507`; `16,384` on `Instruct-2507`). `[Vendor]`
- **Long-context scaling:**
  - Base Qwen3 (`235B-A22B`, `32B`): `32,768` native (`max_position_embeddings=40,960` allocates `8,192` prompt + `32,768` output); extend to `131,072` via static YaRN (`{"rope_type":"yarn","factor":4.0,"original_max_position_embeddings":32768}`, or `factor: 2.0` for ~65K). Open-source frameworks apply static YaRN to all inputs; Alibaba Model Studio uses dynamic YaRN automatically. `[Vendor]`
  - `2507` variants: `262,144` native; extend to `1,010,000` by replacing `config.json` with `config_1m.json` and enabling Dual Chunk Attention (DCA) + MInference (`VLLM_ATTENTION_BACKEND=DUAL_CHUNK_FLASH_ATTN` / `--attention-backend dual_chunk_flash_attn`, `--enforce-eager`, `--max-num-seqs 1`, ~1000 GB total GPU memory). `[Vendor]`
- **Multi-turn history:** Include **only** the final response in prior assistant turns (exclude `<think>...</think>`). The Jinja2 template enforces this; custom pipelines must strip thinking manually. `[Vendor]`

## 4. Standardized Prompts, Starter Skeleton, Tool Calling & Anti-Patterns `[Vendor]`

- **Starter skeleton** (pair with mode-matched sampling from §1; strip `<think>...</think>` from prior assistant turns): `[General]` `[Vendor]`
  ```text
  [system]
  You are a precise assistant. {{domain_rules}}
  [user]
  {{task_prompt}} /think   <!-- soft switch when enable_thinking=True; use /no_think to skip -->
  ```
- **Benchmark formats:** Math: `"Please reason step by step, and put your final answer within \boxed{}."` Multiple-choice: `"Please show your choice in the answer field with only the choice letter, e.g., \"answer\": \"C\"."` Few-shot guidance is `unverified`. `[Vendor]`
- **Tool calling & serving:** Use `Qwen-Agent` for MCP servers and built-in tools (`thought_in_content: True` when reasoning is inline rather than split into `reasoning_content`). On `Thinking-2507`, disable vLLM/SGLang reasoning and tool-call parsers when letting `Qwen-Agent` parse; otherwise serve with `--reasoning-parser qwen3` (SGLang base) or `--enable-reasoning --reasoning-parser deepseek_r1` (vLLM / `Thinking-2507`). `[Vendor]`
- **Anti-patterns to avoid:**
  - Avoid greedy decoding (`Temp=0`) in thinking mode (causes severe performance degradation and endless repetition loops). `[Vendor]`
  - Keep static YaRN disabled when contexts stay `<=32,768` tokens (static YaRN degrades short-text performance). `[Vendor]`
  - Strip `<think>...</think>` content from prior assistant turns in multi-turn conversation history. `[Vendor]`
  - Omit `enable_thinking=False` on `Instruct-2507` (non-thinking only), and avoid relying on `/no_think` when `enable_thinking=False` (hard switch ignores soft tags). `[Vendor]`

## 5. Gaps / `unverified` `[Vendor]`

- Few-shot prompting guidance and built-in grammar-constrained JSON enforcement are `unverified` across all four vendor model cards.
