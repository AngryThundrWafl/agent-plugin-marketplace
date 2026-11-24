---
name: Prompt templates and pre-ship checklist
source:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  - https://platform.claude.com/docs/en/build-with-claude/structured-outputs
  - https://platform.claude.com/docs/en/build-with-claude/thinking
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-haiku-5-5
  - https://huggingface.co/deepseek-ai/DeepSeek-R1
  - https://huggingface.co/deepseek-ai/DeepSeek-R1-0528
  - https://huggingface.co/Qwen/Qwen3-235B-A22B
  - https://github.com/openai/harmony
  - https://github.com/meta-llama/llama-models
fetched: 2026-11-24
covers: Condensed prompt skeletons for Claude (general, agentic/coding, long-context Q&A) and open-weight models (DeepSeek-R1/0528, Qwen3, gpt-oss Harmony, Llama 4 tool use), plus pre-ship review checklist
---

# Prompt Templates & Pre-Ship Checklist

Tags: `[Claude docs]` = official verbatim wording or direct rule. `[Vendor]` = vendor-documented format/directive. `[General]` = condensed cross-file synthesis (must be tested). `unverified` = source docs silent.

> **Template provenance note:** All prompt skeletons below are **condensed syntheses (`[General]`)** assembled from the reference pack unless a line is explicitly marked `[Claude docs]` (verbatim) or `[Vendor]` (exact template/directive). Always check the target model file (`11`–`15` or `02`) before deploying.

## 1. Claude General Task `[General]`

Pair with `thinking: {"type": "adaptive"}` (or default), explicit `output_config.effort`, no sampling params (`temperature`/`top_p`), and no last-turn assistant prefill. `[Claude docs]`

```text
[system]
You are a [domain] specialist helping [audience].
If required facts are missing, say "I don't have enough information to confidently assess this" rather than guessing.
Write smoothly flowing prose paragraphs (use bullet lists only for discrete items). Respond directly without preamble.

[user]
<context>{{domain_context}}</context>
<examples>
  <example><input>...</input><output>...</output></example> <!-- 3-5 diverse examples [Claude docs] -->
</examples>
<instructions>
1. [Step 1] — [Brief "why" explaining why this constraint matters].
2. [Step 2]
</instructions>
<input>{{user_input}}</input>
```

- For strict JSON, pass `output_config.format` (`type: "json_schema"`, `additionalProperties: false`); never put reasoning fields in the schema (`reasoning_extraction`). `[Claude docs]`

## 2. Claude Agentic / Coding `[General]`

Pair with `max_tokens: 128000` + streaming, append-only history (pass `thinking`/`redacted_thinking` unchanged), and `tool_choice: {"type": "auto"}`. `[Claude docs]`

```text
[system]
You are a software engineering agent working in the repository.
Implement requested changes directly using tools rather than only suggesting them; read files before answering or editing.
Invoke independent read/search calls in parallel; keep dependent steps sequential and never guess missing parameters.
Make only requested changes (no unrequested refactors, docstrings on untouched code, or speculative helpers).
Ask before destructive, hard-to-reverse, or externally visible actions. Clean up temporary scratchpad files when done.

<!-- Verbatim verification block (13-sonnet-5-5.md / 14-haiku-5-5.md) [Claude docs] -->
When you change code that can be run, built, or type-checked, run a real check that exercises the change before reporting it done: the project's tests, type-checker, or build, or the changed command itself. A syntax-only check, or a check command that failed to start, does not count; if all that is missing is the project's declared dependencies, install them with its own package manager and lockfile (for example, npm install or pip install -r requirements.txt), never through sudo or the system package manager, unless told not to. Only if no real check can run here, say which one you did not run and why instead of reporting the change as done.
```

- Add Fable 5.2 code-ownership (`11-fable-5-2.md` §3) only when refactoring/consolidation is wanted; add Sonnet 5.5 review-cap (`13-sonnet-5-5.md` §2) at `xhigh`/`max`. `[Claude docs]` `[General]`

## 3. Claude Long-Context Grounded Q&A (20k+ Tokens) `[General]`

Place data at the top and query at the bottom (`+30%` quality in Anthropic tests). Never combine Citations with `output_config.format` (`400`). `[Claude docs]`

```text
[system]
Answer strictly from the provided documents, ignoring outside memory. If unsupported, state "No relevant quotes found."

[user]
<documents>
  <document index="1"><source>{{source_name}}</source><document_content>{{document_text}}</document_content></document>
</documents>
<instructions>Extract verbatim numbered passages in <quotes> first, then write your answer in <info> citing those quote numbers.</instructions>
<query>{{question}}</query>
```

## 4. DeepSeek-R1 & DeepSeek-R1-0528 `[General]` + `[Vendor]`

- **DeepSeek-R1** (`temp=0.6`, `top_p=0.95`, `max_tokens=32,768`; **no `system` prompt**, `<think>\n` prefill): `[Vendor]`

```text
[user]
{{instructions_and_context}}
Please reason step by step, and put your final answer within \boxed{}.

[assistant prefill]
<think>\n
```

- **DeepSeek-R1-0528** (`temp=0.6`, `top_p=0.95`, `max_tokens=64K`; `system` supported; no `<think>\n` prefill): `[Vendor]`

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

*(Web search on R1-0528 uses `[webpage X begin]...[webpage X end]` + inline `[citation:X]` at sentence ends, `<=10` bullets / `<=5` summary points. `[Vendor]`)*

## 5. Qwen3 Thinking & Non-Thinking `[General]` + `[Vendor]`

- **Thinking:** `enable_thinking=True` (or `Thinking-2507`), `Temp=0.6`, `TopP=0.95`, `TopK=20`, `MinP=0`, `max_tokens=32,768` (`38,912`/`81,920` hard). **Non-thinking:** `enable_thinking=False` (or `Instruct-2507`), `Temp=0.7`, `TopP=0.8`, `TopK=20`, `MinP=0`. `[Vendor]`

```text
[system]
You are a precise assistant. {{domain_rules}}
[user]
{{task_prompt}} /think   <!-- soft switch when enable_thinking=True; use /no_think to skip -->
```

- Strip `<think>...</think>` from prior assistant turns; never use greedy decoding (`Temp=0`) in thinking mode. `[Vendor]`

## 6. OpenAI `gpt-oss` Harmony (`developer` + `system`) `[Vendor]` + `[General]`

Render via `openai-harmony` or compliant template; keep `system` identity verbatim, put rules/tools in `developer`, and never expose `analysis`. `[Vendor]`

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

## 7. Meta Llama 4 Zero-Shot Tool Use `[Vendor]` + `[General]`

Use Llama 4 tokens (`<|header_start|>`, `<|header_end|>`, `<|eot|>`)—never Llama 3.3 tokens (`<|start_header_id|>`, `<|eot_id|>`). `[Vendor]`

```text
<|begin_of_text|><|header_start|>system<|header_end|>

You are a helpful assistant with tool access. Avoid preachy phrasing ("it's important to", "it's crucial to", "Remember...").
Available tools (JSON schemas): {{tool_schemas_json}}
Rules: Output parallel Pythonic calls as [func1(k=v), func2(...)] only—never mix prose with calls, never invent functions, never emit [], and summarize tool results concisely.<|eot|><|header_start|>user<|header_end|>

{{user_request}}<|eot|><|header_start|>assistant<|header_end|>

```

## 8. Pre-Ship Prompt Review Checklist `[General]`

1. **Model file checked:** Confirmed model-specific overrides in `11`–`15` or `02-open-weight.md`. `[Claude docs]` `[General]`
2. **Eval criteria & baseline ready:** Quantified fidelity, safety, latency, and cost metrics with automated/LLM-rubric graders. `[Claude docs]`
3. **API compatibility verified:** No `budget_tokens` (`4.7+`), no last-turn prefill (`4.6+`), no `temperature`/`top_p`/`top_k` (`4.7+` / API `2026-10-21`), no forced `tool_choice` (`Fable 5.1+`, `Opus/Sonnet 5.5`), and `max_tokens` sized for thinking + output. `[Claude docs]`
4. **Thinking & history hygiene:** `effort` swept empirically; responses read by `block.type`; Claude history append-only with `thinking`/`redacted_thinking` intact; Qwen3 `<think>` stripped; `gpt-oss` `analysis` hidden & stripped after `final`. `[Claude docs]` `[Vendor]`
5. **Injection & safeguard defenses:** Untrusted text isolated (`tool_result` JSON + random-ID `<pasted_content>`), Haiku 5.5 screens fail closed on `stop_reason: "refusal"`, no visible-CoT requests (`reasoning_extraction`), and no PHI in cached Claude JSON schemas. `[Claude docs]`
6. **Legacy bloat removed:** Stripped `"CRITICAL: MUST use tool"`, `"do not think"` on adaptive-only models, `"after every 3 tool calls"`, and Opus 5 `"include verification step"`. `[Claude docs]`
