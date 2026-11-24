---
name: OpenAI gpt-oss and Harmony format prompting reference
source:
  - https://huggingface.co/openai/gpt-oss-120b
  - https://huggingface.co/openai/gpt-oss-20b
  - https://github.com/openai/harmony
  - https://cookbook.openai.com/articles/openai-harmony
fetched: 2026-11-24
covers: OpenAI gpt-oss-120b, gpt-oss-20b, MXFP4 quantization, mandatory o200k_harmony format, role hierarchy, Reasoning levels, analysis/commentary/final channels, built-in and custom function declarations, history persistence, anti-patterns
---

# OpenAI `gpt-oss` (`120b`, `20b`) & Harmony Format

Tags: `[Vendor]` = directly from the vendor model cards and Harmony docs above. `[General]` = cross-source synthesis (must be tested). `unverified` = vendor docs are silent; nothing extrapolated from other models.

## 1. Model & Sampling Summary `[Vendor]`

| Model | Active / Total Params & Footprint | Sampling (`Temp`, `TopP`, `TopK`, `MinP`, `Presence Penalty`) | Max Context / Output | Reasoning Control |
| :--- | :--- | :--- | :--- | :--- |
| **`gpt-oss-120b`** | 117B total / 5.1B active MoE (MXFP4; fits 1× 80GB GPU; fine-tunes on 1× H100 node) | `unverified` | `unverified` | `Reasoning: low \| medium \| high` in `system` (default `medium`) |
| **`gpt-oss-20b`** | 21B total / 3.6B active MoE (MXFP4; fits 16GB memory; fine-tunes on consumer hardware) | `unverified` | `unverified` | `Reasoning: low \| medium \| high` in `system` (default `medium`) |

## 2. Mandatory Harmony Format (`o200k_harmony`) `[Vendor]`

- **Hard requirement:** Both models were trained on Harmony and will not work correctly without it. Use `openai-harmony` (Python/Rust, includes `StreamableParser`) or compliant framework chat templates (Transformers, vLLM, Ollama). `[Vendor]`
- **Special tokens:** `<|start|>` (`200006`), `<|end|>` (`200007`), `<|message|>` (`200008`), `<|channel|>` (`200005`), `<|constrain|>` (`200003`), `<|return|>` (`200002`, final stop token), `<|call|>` (`200012`, tool-call stop token). `[Vendor]`
- **Message envelope:** `<|start|>{header}<|message|>{content}<|end|>`. `[Vendor]`

## 3. Role Hierarchy, Reasoning Levels & Channels `[Vendor]`

- **Instruction hierarchy:** `system` > `developer` > `user` > `assistant` > `tool`. `[Vendor]`
- **`system` message (meta, reasoning effort & built-in tools):** `[Vendor]`
  - Keep identity verbatim (`You are ChatGPT, a large language model trained by OpenAI.`), `Knowledge cutoff: 2024-06`, and `Current date: YYYY-MM-DD`. `[Vendor]`
  - Set `Reasoning: low | medium | high` (default `medium`: balanced speed/detail; `low`: fast dialogue; `high`: deep analysis). `[Vendor]`
  - Include `# Valid channels: analysis, commentary, final. Channel must be included for every message.`, `Calls to these tools must go to the commentary channel: 'functions'.` (when functions exist), and built-in `# Tools` (`browser`, `python`). `[Vendor]`
- **`developer` message (custom instructions, functions & schemas):** `[Vendor]`
  - Acts as the customizable system prompt (`# Instructions`). `[Vendor]`
  - Declares custom functions (`# Tools` → `## functions` → TypeScript-like `namespace functions { type fn = (_: { ... }) => any; }` with `any` return type, comments above fields, and a blank line between definitions). `[Vendor]`
  - Optionally sets `# Response Formats` (`## {format_name}` + JSON Schema)—**advisory only** unless paired with grammar-constrained sampling to guarantee schema adherence. `[Vendor]`
- **Three channels:**
  - `analysis`: Chain-of-thought plus built-in `browser.search`/`open`/`find` and stateful 120s-timeout `python` Jupyter calls (`/mnt/data`). Keep `analysis` hidden from end users—it lacks `final`-channel safety standards; `python` is for internal reasoning only (not user-visible files/plots), and `browser` cites via `【{cursor}†L{line_start}(-L{line_end})?】` with `<=10` quoted words. `[Vendor]`
  - `commentary`: Function tool calls (`<|channel|>commentary to=functions.<name> <|constrain|>json<|message|>{...}<|call|>`) and optional user-visible action-plan preambles before multi-tool runs. Return tool outputs as `<|start|>functions.<name> to=assistant<|channel|>commentary<|message|>{output}<|end|>`. `[Vendor]`
  - `final`: End-user response terminated at decode time by `<|return|>`. `[Vendor]`

## 4. Starter Skeleton, History Persistence & Anti-Patterns `[Vendor]`

- **Harmony starter skeleton** (render via `openai-harmony` or a compliant chat template; keep `system` identity verbatim, place custom rules/tools in `developer`, and hide `analysis` from end users): `[Vendor]` `[General]`
  ```text
  <|start|>system<|message|>You are ChatGPT, a large language model trained by OpenAI.
  Knowledge cutoff: 2024-06
  Current date: {{YYYY-MM-DD}}
  Reasoning: medium
  # Valid channels: analysis, commentary, final. Channel must be included for every message.
  Calls to these tools must go to the commentary channel: 'functions'.<|end|>
  <|start|>developer<|message|># Instructions
  {{custom_system_instructions}}
  # Tools
  ## functions
  namespace functions {
  type {{tool_name}} = (_: { arg: string }) => any;
  } // namespace functions
  # Response Formats
  // Advisory only — pair with grammar-constrained sampling to guarantee JSON.
  {"type":"object","properties":{"answer":{"type":"string"}},"required":["answer"],"additionalProperties":false}<|end|>
  <|start|>user<|message|>{{user_query}}<|end|>
  <|start|>assistant
  ```
- **History persistence:** Normalize trailing `<|return|>` → `<|end|>` in stored messages. Drop `analysis` CoT after a `final` response, **except** retain prior `analysis` CoT across intermediate tool-call turns until `final` is emitted: `[Vendor]`
  ```text
  <|start|>assistant<|channel|>analysis<|message|>Need get_current_weather.<|end|>
  <|start|>assistant<|channel|>commentary to=functions.get_current_weather <|constrain|>json<|message|>{"location":"San Francisco"}<|call|>
  <|start|>functions.get_current_weather to=assistant<|channel|>commentary<|message|>{"sunny":true,"temperature":20}<|end|>
  <|start|>assistant
  ```
- **Anti-patterns to avoid:**
  - Always format prompts with `o200k_harmony` (models fail outside Harmony). `[Vendor]`
  - Keep the `system` identity line verbatim and place persona or custom instruction overrides in `developer` `# Instructions`. `[Vendor]`
  - Keep `browser`/`python` built-in tool declarations in `system`, and custom functions in `developer`. `[Vendor]`
  - Keep `analysis` CoT hidden from end users and strip completed `analysis` blocks once a `final` response has been emitted. `[Vendor]`

## 5. Gaps / `unverified` `[Vendor]`

- Recommended `temperature`, `top_p`, `top_k`, `min_p`, `presence_penalty`, max context length, max output tokens, and few-shot guidance are `unverified` in the vendor model cards and Harmony documentation.
