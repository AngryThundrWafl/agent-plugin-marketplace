---
name: Claude thinking and effort reference
source:
  - https://platform.claude.com/docs/en/build-with-claude/thinking
  - https://platform.claude.com/docs/en/build-with-claude/thinking-steering-and-cost
  - https://platform.claude.com/docs/en/build-with-claude/effort
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/chain-of-thought
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/extended-thinking-tips
fetched: 2026-11-24
covers: Adaptive vs manual thinking, budget_tokens deprecation/removal, output_config.effort levels & per-model defaults, thinking.display modes, interleaved thinking, progress updates, block preservation & prefix checks, prompt caching, CoT fallback, cost & sampling limits
---

# Claude Thinking & Effort

Tags: `[Claude docs]` = directly from the fetched pages above. `[General]` = cross-section synthesis, must be tested. `unverified` = source pages are silent.
Scope note: Model-specific effort calibrations and thinking constraints override general defaults when both apply. `[Claude docs]`

## 1. Adaptive vs. Manual Thinking & Per-Model Matrix [Claude docs]

- **Adaptive thinking (`thinking: {"type": "adaptive"}`):** Claude evaluates each request's complexity and decides whether and how deeply to think. Reliably outperforms manual extended thinking on Anthropic evals and automatically enables interleaved thinking between tool calls.
- **Manual extended thinking (`thinking: {"type": "enabled", "budget_tokens": N}`):** Deprecated on Opus 4.6 and Sonnet 4.6; **returns `400`** on all 4.7, 4.8, 5, 5.1, 5.2, and 5.5 models (Mythos Preview still accepts it).
- **Turn-start rule:** Adaptive thinking does *not* guarantee a `thinking` block on every turn—select response blocks by `block.type`, never by index `0`.

| Model group | Omitting `thinking` | `"adaptive"` | `"enabled"` (`budget_tokens`) | `"between_tools"` | `"disabled"` |
| --- | --- | --- | --- | --- | --- |
| Fable 5–5.2, Mythos 5–5.2, Opus 5.5 | Adaptive (always on) | Adaptive | 400 error | 400 error | 400 error |
| Sonnet 5.5 | Adaptive (always on) | Adaptive | 400 error | OK at `effort` ≤ `high` (no up-front thinking; 400 at `xhigh`/`max`) | 400 error |
| Haiku 5.5, Opus 5 | Adaptive (on by default) | Adaptive | 400 error | 400 error | OK at `effort` ≤ `high` (400 at `xhigh`/`max`) |
| Sonnet 5 | Adaptive (on by default) | Adaptive | 400 error | 400 error | Thinking off |
| Opus 4.7, Opus 4.8 | Thinking off | Adaptive | 400 error | 400 error | Thinking off |
| Opus 4.6, Sonnet 4.6 | Thinking off | Adaptive | Extended (deprecated) | 400 error | Thinking off |
| Mythos Preview | Adaptive | Adaptive | Extended | 400 error | 400 error |
| Opus 4.5, Sonnet 4.5, Haiku 4.5 | Thinking off | 400 error | Extended | 400 error | Thinking off |

- Check support programmatically via Models API: `capabilities.thinking.types.disabled.supported` and `between_tools.supported`.
- **Managed Agents:** Thinking is always on; agent definitions have no `thinking` field (set `effort` on the model object/override instead).

## 2. Effort (`output_config.effort`) Levels & Model Calibration [Claude docs]

`output_config.effort` is behavioral soft guidance affecting **all** output tokens (thinking, response text, and tool call volume/verbosity—works with or without thinking). Do **not** pass `"adaptive"` as `effort`.

| Level | Thinking & tool-use behavior | Typical use |
| --- | --- | --- |
| `low` | Minimal thinking; skips simple queries; fewer/terser tool calls; acts directly without preamble | High-volume, speed-sensitive, chat, well-specified subagents |
| `medium` | Moderate thinking; skips simple queries. **Default on Opus 5.5 and Haiku 5.5** | Balanced speed/cost/quality; interactive coding, everyday agentic work |
| `high` | Deep reasoning on complex tasks. **Default on all other effort-capable models** | Complex reasoning, hard coding, research, agentic loops |
| `xhigh` | Deeper/more frequent reasoning than `high` | Long-horizon coding/agentic runs (>30 min, multi-million token budgets); recommended start for Opus 4.7/4.8 coding |
| `max` | Unconstrained token spending for deepest reasoning | Frontier math/science/open-ended ceiling runs (note: can overthink on simple/structured tasks) |

- **Model defaults & quirks:**
  - **Opus 5.5 & Haiku 5.5** default to `medium`; all other effort models default to `high`. Passing the model's default explicitly behaves identically to omitting `effort` (no cache break).
  - **Re-sweep on every model upgrade:** Same level names calibrate differently across versions (e.g., Fable 5.2 vs 5.1, Sonnet 5.5 vs 5, Opus 5.5 `medium` ≥ Opus 5 `high`).
  - **Opus 4.5:** Only extended-thinking-only model supporting `effort`—composes alongside `budget_tokens`.
  - **Output length:** On Opus 5 and Fable 5.2, `effort` barely alters visible reply length—prompt for conciseness/length separately.
  - **Availability caveat:** Not every model supporting `max` supports `xhigh` (for example, Opus 4.6 and Sonnet 4.6 support `low`, `medium`, `high`, and `max`, but omit `xhigh`).

## 3. Reading Thinking Output (`thinking.display`) [Claude docs]

- `"summarized"`: Readable summary of reasoning (never raw CoT). **Default on 4.6 and earlier.** (Note: 4.6/earlier have a verbose opening preamble; Mythos Preview summarizes from token 1.)
- `"omitted"`: Empty `thinking: ""` string + valid encrypted `signature` (identical `signature` to `"summarized"`). **Default on 4.7, 4.8, 5, 5.1, 5.2, 5.5, and Mythos Preview.** Cuts streaming time-to-first-text-token; **billing is unchanged** (you still pay for full internal thinking tokens).
- `"updates"` *(beta header `thinking-display-updates-2026-08-18`)*: Reasoning blocks have empty `thinking: ""`, while between-tool progress updates (`Fable 5–5.2`, `Mythos 5–5.2`, `Opus 5.5`, `Sonnet 5.5`) stream readable summary text. Treat any `thinking` block with non-empty text as a progress update. (On Sonnet 5.5, `type: "between_tools"` returns progress updates similarly without `display`.)
- **Never prompt for reasoning in visible response text** (e.g., `<thinking>` tags in output): newer models can refuse with `stop_reason: "refusal"` and `stop_details.category: "reasoning_extraction"`. Read `display: "summarized"` blocks instead.

## 4. Steering Thinking vs. Manual CoT [Claude docs]

Use controls in strict order: **(1) Set `effort` first → (2) Add prompt guidance only if needed.**
- **To reduce thinking:** Lower `effort` first. On **Fable 5.2** (at `medium`+), **Sonnet 5.5**, and **Haiku 5.5**, `"Answer directly without deliberating"` does *not* reliably suppress thinking—you must lower `effort`.
- **System prompt steering (other models):**
  - Reduce: `"Extended thinking adds latency and should only be used when it will meaningfully improve answer quality, typically for problems that require multistep reasoning. When in doubt, respond directly."`
  - Encourage: `"This task involves multistep reasoning. Think carefully before responding."`
- **Per-message steering (user turn):** Append `"Please think hard before responding."` or `"Answer directly without deliberating."` to steer a single turn without invalidating the prefix cache.
- **General vs. prescriptive prompting:** Prefer `"think thoroughly"` and worked 3–5 multishot examples over rigid step-by-step plans. After tools: `"After receiving tool results, carefully reflect on their quality and determine optimal next steps before proceeding."`
- **Manual CoT fallback:** Only when thinking is genuinely off (`disabled` on older/supported models): ask Claude to reason step by step and wrap the final answer in `<answer>` tags (avoid asking models subject to `reasoning_extraction` refusals to emit raw reasoning).
  - **Opus 4.5 quirk (thinking off):** Sensitive to the word `"think"`—use `"consider"`, `"evaluate"`, or `"reason through"`.
- **Self-checking:** `"Before you finish, verify your answer against [test criteria]"` improves math/coding accuracy, **except on Opus 5**, where extra verification lines cause over-verification (remove them on Opus 5).

## 5. Interleaved Thinking, Block Preservation & Prefix Checks [Claude docs]

- **Interleaved thinking:** Automatic in adaptive mode (supported by all adaptive models; Haiku 4.5 does not support interleaved thinking; manual mode requires a beta header).
- **Tool-use turn = one assistant turn:** Do not toggle `thinking` mid-turn (between `tool_use` and `tool_result`); doing so silently disables thinking and strips blocks.
- **Pass all `thinking` and `redacted_thinking` blocks back unchanged:**
  - Mandatory inside tool-use loops; recommended across all multi-turn conversations (even across model switches—API ignores/drops unreadable blocks cleanly and preserves fallback credit). Never filter out `redacted_thinking` (`data` field).
  - **Keep-all models** (`Opus 4.5+`, `Sonnet 4.6+`, `Haiku 5.5`, `Fable 5–5.2`, `Mythos 5–5.2`, `Mythos Preview`): retain all prior thinking blocks in context (count as input tokens and consume context window; use `clear_thinking_20251015` context editing if needed). **Last-turn-only models** (`4.5` Sonnet/Haiku, earlier): API auto-strips older turns' thinking blocks.
  - **Prefix-check `400` errors (preserved-thinking models: Fable 5.1/5.2, Mythos 5.1/5.2, Opus 5.5, Sonnet 5.5, Haiku 5.5):** Editing `system`, `tools`, or earlier messages before existing thinking blocks fails the prefix check (`400`). Keep history append-only; use mid-conversation system messages or server-side compaction/context editing.

## 6. Cost, Caching, Limits & Compatibility [Claude docs]

- **Cost & `max_tokens`:** `max_tokens` is a **hard per-request cap** covering thinking + visible text combined (up to **128K** on 4.6–5.5 models; **64K** on 4.5; **300K** on Batches beta `output-300k-2026-03-24` for supported 4.6–5.5 models). Always leave headroom; SDK requires streaming when `max_tokens > 21,333` (and use Batches if thinking > ~32K tokens to avoid timeouts).
- **Observability:** Billed tokens = full internal reasoning + output text (`display: "omitted"` saves streaming latency, **zero** tokens/cost). Inspect `usage.output_tokens_details.thinking_tokens` (final `message_delta` when streaming) to see internal reasoning tokens.
- **Prompt caching:** Changing `thinking` mode, `budget_tokens`, or top-level `output_config.effort` invalidates cache breakpoints. To vary effort mid-session without breaking cache, use **per-message effort** (beta `mid-conversation-output-config-2026-07-01` via a `role: "system"` message; invalid with `disabled` or `between_tools`). Consider **1-hour cache TTL** for long thinking workflows.
- **Sampling params & forced tools:**
  - Non-default `temperature`/`top_p`/`top_k` (or including both `temperature` and `top_p`, even at defaults like `top_p: 0.99`) returns **400** on 4.7/4.8/5/5.1/5.2/5.5/Mythos Preview; under API version `2026-10-21`, sending *any* `temperature`/`top_p`/`top_k` returns **400** on every model.
  - Forced `tool_choice` (`"any"` or `"tool"`) fails with manual extended thinking, and fails on **every** request (`400`) on Fable 5.1/5.2, Mythos 5.1/5.2, Opus 5.5, and Sonnet 5.5—use `tool_choice: {"type": "auto"}` + `strict: true` / `output_config.format` + prompt guidance instead.

## 7. Gaps / `unverified`

- Exact internal token multipliers per `effort` level (`low` vs `medium` vs `high` vs `xhigh` vs `max`) are not published numerically—always measure via evals (`usage.output_tokens_details.thinking_tokens`).
