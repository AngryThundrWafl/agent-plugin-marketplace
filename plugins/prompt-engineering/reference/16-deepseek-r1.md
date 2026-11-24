---
name: DeepSeek-R1 and DeepSeek-R1-0528 prompting reference
source:
  - https://huggingface.co/deepseek-ai/DeepSeek-R1
  - https://huggingface.co/deepseek-ai/DeepSeek-R1-0528
  - https://github.com/deepseek-ai/DeepSeek-R1
fetched: 2026-11-24
covers: DeepSeek-R1, DeepSeek-R1-Zero, 6 distilled dense checkpoints, DeepSeek-R1-0528, DeepSeek-R1-0528-Qwen3-8B, sampling, system prompt rules, thinking prefill, file/web-search templates, anti-patterns
---

# DeepSeek-R1 & DeepSeek-R1-0528

Tags: `[Vendor]` = directly from the vendor model cards above. `[General]` = cross-source synthesis (must be tested). `unverified` = vendor cards are silent; nothing extrapolated from other models.

## 1. Sampling & Context Summary `[Vendor]`

| Variant | Temp | TopP | TopK | MinP | Presence Penalty | Native Context / Max Output | Thinking Control |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DeepSeek-R1** | `0.5`–`0.7` (`0.6` rec.) | `0.95` (evals) | `unverified` | `unverified` | `unverified` | `128K` ctx / `32,768` eval max | Prefill `<think>\n` at output start |
| **DeepSeek-R1-0528** | `0.6` | `0.95` (evals) | `unverified` | `unverified` | `unverified` | `unverified` ctx / `64K` eval max | Automatic (no `<think>\n` prefill needed) |

## 2. Models & Architecture `[Vendor]`

- **DeepSeek-R1 / DeepSeek-R1-Zero:** 671B total / 37B active MoE (based on DeepSeek-V3-Base), `128K` context. R1 adds cold-start SFT and two RL/SFT stages over R1-Zero to fix endless repetition, poor readability, and language mixing. Hugging Face `transformers` is not directly supported for the 671B models (use the `DeepSeek-V3` repo setup). `[Vendor]`
- **Distilled dense checkpoints:** Six models fine-tuned on 800K R1 samples use modified configs and tokenizers—run with DeepSeek-R1 settings (e.g., vLLM `--max-model-len 32768` or SGLang) rather than base Qwen2.5/Llama defaults: `[Vendor]`
  - Qwen2.5-based: `DeepSeek-R1-Distill-Qwen-1.5B` (`Qwen2.5-Math-1.5B`), `7B` (`Qwen2.5-Math-7B`), `14B` (`Qwen2.5-14B`), `32B` (`Qwen2.5-32B`). `[Vendor]`
  - Llama-based: `DeepSeek-R1-Distill-Llama-8B` (`Llama-3.1-8B`), `DeepSeek-R1-Distill-Llama-70B` (`Llama-3.3-70B-Instruct`). `[Vendor]`
- **DeepSeek-R1-0528:** Post-training upgrade deepening CoT (AIME avg `23K` tokens vs. `12K` on R1), lowering hallucinations, and improving function calling and vibe coding. Also adds `DeepSeek-R1-0528-Qwen3-8B` (identical architecture to `Qwen3-8B`, using `DeepSeek-R1-0528`'s tokenizer config; run like `Qwen3-8B`). `[Vendor]`

## 3. Sampling, System Prompts & Thinking Controls `[Vendor]`

- **Sampling (DeepSeek-R1):** `temperature` `0.5`–`0.7` (`0.6` recommended); evals used `top_p=0.95`, `max_tokens=32,768`, 64 samples/query. `top_k`, `min_p`, and `presence_penalty` are `unverified`. `[Vendor]`
- **Sampling (DeepSeek-R1-0528):** Official web/app sets `temperature=0.6`; evals used `top_p=0.95`, `max_tokens=64K`, 16 samples/query. `top_k`, `min_p`, `presence_penalty`, and native context limit are `unverified`. `[Vendor]`
- **Original DeepSeek-R1 system & thinking rules:**
  - Put all instructions inside the `user` prompt and omit the `system` prompt. `[Vendor]`
  - Because original R1 tends to bypass thinking on certain queries by emitting `<think>\n\n</think>`, force every assistant response to begin with `<think>\n`. `[Vendor]`
- **DeepSeek-R1-0528 changes:**
  - `system` prompts are supported (official web/app prompt sets model identity and current date: `该助手为DeepSeek-R1，由深度求索公司创造。\n今天是{current date}。`). `[Vendor]`
  - Forcing `<think>\n` at output start is no longer required. `[Vendor]`

## 4. Prompt Templates, Starter Skeletons & Anti-Patterns `[Vendor]`

- **Original DeepSeek-R1 starter skeleton** (omit `system` prompt; prefill `<think>\n`; include math directive when applicable): `[General]` `[Vendor]`
  ```text
  [user]
  {{instructions_and_context}}
  Please reason step by step, and put your final answer within \boxed{}.

  [assistant prefill]
  <think>\n
  ```
- **Math & eval directive (R1):** Include `"Please reason step by step, and put your final answer within \boxed{}."` Run multiple tests and average results. `[Vendor]`
- **DeepSeek-R1-0528 starter & file upload template** (`system` supported; no `<think>\n` prefill): `[Vendor]`
  ```text
  [system]
  该助手为DeepSeek-R1，由深度求索公司创造。
  今天是{{current_date}}。

  [user]
  [file name]: {{file_name}}
  [file content begin]
  {{file_content}}
  [file content end]
  {{question}}
  ```
- **Web search template (R1-0528):** `[Vendor]`
  - Wrap retrieved pages as `[webpage X begin]...[webpage X end]`. `[Vendor]`
  - Instruct inline `[citation:X]` (e.g., `[citation:3][citation:5]`) at sentence ends rather than clustered at the end, multi-source synthesis (avoid repeatedly citing one page), `<=10` list bullets / `<=5` summary points, no mentioning unprovided content, and matching the user's language. `[Vendor]`
- **Tool calling & few-shot:** Tool-calling wire format is `unverified` for R1 (R1-0528 reports BFCL_v3_MultiTurn and Tau-Bench improvements; exact schema `unverified`). Few-shot guidance is `unverified` in both cards (zero-shot directives shown). `[Vendor]`
- **Anti-patterns to avoid:**
  - Avoid adding a `system` prompt on original DeepSeek-R1 (place all instructions in `user`). `[Vendor]`
  - Keep `temperature` within `0.5`–`0.7` (sampling outside this band—especially greedy decoding—risks endless repetition or incoherent outputs). `[Vendor]`
  - Keep `<think>\n` assistant prefill on original R1 when empty `<think>\n\n</think>` bypasses occur. `[Vendor]`
  - Run distilled checkpoints (`DeepSeek-R1-Distill-*`) with DeepSeek-R1 configs/tokenizers rather than base Qwen2.5/Llama defaults. `[Vendor]`

## 5. Gaps / `unverified` `[Vendor]`

- `top_k`, `min_p`, `presence_penalty`, few-shot guidance, multi-turn thinking-history stripping rules, tool-calling wire format, grammar-constrained JSON support, and DeepSeek-R1-0528's native context window are `unverified` in the vendor model cards.
