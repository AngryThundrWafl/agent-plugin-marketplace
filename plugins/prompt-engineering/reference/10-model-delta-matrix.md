---
name: Model delta matrix across Claude, Google Gemini, and open-weight families
source:
  - https://platform.claude.com/docs/en/build-with-claude/thinking
  - https://platform.claude.com/docs/en/build-with-claude/effort
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-haiku-5-5
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-4-8
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5
  - https://huggingface.co/deepseek-ai/DeepSeek-R1
  - https://huggingface.co/deepseek-ai/DeepSeek-R1-0528
  - https://huggingface.co/Qwen/Qwen3-235B-A22B
  - https://huggingface.co/openai/gpt-oss-120b
  - https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct
  - https://huggingface.co/meta-llama
  - https://ai.google.dev/gemini-api/docs/models
  - https://ai.google.dev/gemini-api/docs/thinking
  - https://ai.google.dev/gemini-api/docs/thought-signatures
  - https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-4-Carbon-Model-Card.pdf
  - https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-4-Neon-Model-Card.pdf
  - https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-4-Hydrogen-Model-Card.pdf
  - https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-4-Argon-Model-Card.pdf
  - https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-3-8-Flash-Model-Card.pdf
fetched: 2026-11-24
covers: Side-by-side matrix of covered Claude models, Google Gemini (Gemini 4 and 3.8 Flash), and open-weight families, migration triggers, and API compatibility snapshot
---

# Model Delta Matrix

Tags: `[Claude docs]` = directly from Anthropic's Claude model/thinking documentation. `[Vendor]` = from Google Gemini docs and open-weight vendor model cards. `[General]` = cross-model synthesis (must be tested). `unverified` = source docs silent.

Contents: 1 Current Claude · 2 Legacy Claude · 3 Google Gemini · 4 Open-weight families · 5 Upgrade & tune · 6 Claude migrations · 7 API compatibility · 8 Gaps

## 1. Current Claude Models (`5.2` / `5.5`) `[Claude docs]`

| Model | Thinking & Effort Defaults | Verbosity, Tone & Progress Updates | Tool & Subagent Behavior | Key Gotchas & Refusals | When to Tune / Migrate |
| --- | --- | --- | --- | --- | --- |
| **Fable 5.2 / Mythos 5.2** | Adaptive **always on** (`disabled`/`enabled`/`between_tools` → `400`). Default `high`; re-sweep `medium`/`xhigh`. `"Don't deliberate"` fails at `medium`+. | Effort barely changes reply length. Updates arrive via `display: "updates"` (`thinking` blocks); add harness reminder after silent tool streaks. Strong standalone reports. | Forced `tool_choice` → `400`. Rarely spawns subagents on short tasks; uses reviewer subagents at `xhigh`/`max`. Ownership line flips duplicate code (`<10%` → `~75%` consolidation) at `+70–80%` tokens. | Prefix-check `400` on edited history (`block_binding` beta optional). Opus 5.5 `"treat answer as done"` stops mistake self-correction. Refusals: `cyber`, `bio` (verification programs), `frontier_llm`, `reasoning_extraction`, `general_harms`. | Start here for long async work or orchestration. Audit/remove legacy delegate, token-budget, `"think less"`, and accumulated cautious rules first. |
| **Opus 5.5** | Adaptive **always on** (`disabled` → `400`). Default **`medium`** (matches/beats Opus 5 `high`). `xhigh`/`max` think more than Opus 5. | `>30%` faster than Opus 5; fewer tokens. Clear progress/final summaries. Use `display: "updates"` + silent-streak reminder or `send` tool for verbatim snippets. | Forced `tool_choice` → `400`. Strong multihour parallel subagents; responsive to elapsed-time signals (`elapsed 340s / 1200s`). Needs multi-app explore prompt for unmentioned records. | `low` + `disabled` Opus 5 migrations need effort re-sweep. Unattended turns may end on text updates (harness checklist + ≤3 auto-continues). Generic `"avoid AI look"` swaps frontend defaults; name anti-patterns. New `bio` + `cyber` + `reasoning_extraction` classifiers. | Upgrade from Opus 5 for speed, review precision, and knowledge work. Re-sweep `effort` (`medium` default); tag pasted text with random IDs. |
| **Sonnet 5.5** | Adaptive **always on** (default `high`). Supports `between_tools` at `<=high` (`xhigh`/`max` or per-message effort → `400`). `disabled` → `400`. | Adds unrequested tests/docs/helpers unless capped. Progress via `display: "updates"` or `between_tools`. Strip `"hold findings"` rules. | Forced `tool_choice` → `400`. May pause early at `low`/`medium`; launches extra reviewer subagents at `xhigh`/`max` (cut `~1/3` cost via stop-and-report prompt). Occasional tool-name/param case typos. | Skips `low`/`medium` JSON reasoning unless nudged (`Think the problem through...`); `stop_reason: "max_tokens"` on structured output = fail. Mid-turn user text right after `tool_result` risks injection false positives. Refusal fallback to Sonnet 5 (`cyber`, `frontier_llm` only). | Best everyday coding/tool balance (`medium`/`high`). Add `low`-effort verification block; strip `"minimize tool calls"`. |
| **Haiku 5.5** | Adaptive on by default; default **`medium`**. Supports `disabled` at `<=high` (`xhigh`/`max` → `400`). `budget_tokens` → `400`. | Fast chat/tool execution; **empty-reply risk at `xhigh`** (consumes budget in thinking). Add anti-pleading system-adherence rule for chatbots. | `disabled` + `output_config.format` can skip tool calls (use adaptive, omit schema on tool turn, or add JSON-final-only rule). Needs `{{current_date}}` (+ nudge at `low`/long prompts) for search grounding. | Long agent prompts at `low` stop early or skip tests/checks. Mid-turn user text inside `tool_result` or mixed with system notice gets ignored. **No server-side refusal fallback** (handle `stop_reason: "refusal"` in client). | Use for speed-critical chat, routing, and guardrail classifiers. Benchmark `disabled` vs. `low`/`medium` adaptive; raise `max_tokens` above Haiku 4.5. |

## 2. Legacy Claude Models (`4.8` / `5` / `5.1`) `[Claude docs]`

| Model | Thinking & Effort Defaults | Verbosity, Tone & Progress Updates | Tool & Subagent Behavior | Key Gotchas & Migration Path |
| --- | --- | --- | --- | --- |
| **Fable 5.1 / Mythos 5.1** | Adaptive **always on**; default `high`. `medium` ≈ Fable 5. `xhigh`/`max` can double-draft in thinking + reply. | Quieter between tool calls than Fable 5; denser prose (`"remove mannered prose"`); underuses bold/bullets if anti-markdown rules exist. | Forced `tool_choice` → `400`. May run implied independent calls 1/turn (add turn-scoped batching nudge). Prefers async non-blocking subagents. | Rewrites whole files on small edits; copies quotes without quote marks; `"Does this compile?"` triggers safeguard false positives. Prefix-check `400` on history edits. Migrate to **Fable 5.2** (re-sweep `effort`). |
| **Fable 5 / Mythos 5** | Adaptive only, `summarized` display only; default `high` (`low`/`medium` beat older `xhigh`). | Long autonomous turns (minutes/hours) → raise timeouts & stream. Can leak shorthand/arrows into final summary unless separated. | Spawns parallel subagents readily; needs explicit `send_to_user` tool for verbatim pass-through. | Rare text-only `"I'll now run X"` endings; token countdowns cause early-stop anxiety. Fallback to Opus 4.8 (except `reasoning_extraction`). Migrate to **Fable 5.2**. |
| **Opus 5** | Adaptive on by default; default `high`. `disabled` valid at `<=high` (`xhigh`/`max` → `400`). | **Longer replies/files**; `effort` barely shrinks text—prompt explicitly for concision. | **Self-verifies automatically** (legacy verification prompts cause costly loops). Can over-spawn subagents without budget/depth caps. | With `disabled`, emits tool calls as plain text or leaks `<thinking>` tags (`"do not think"` worsens it). 1M context default. Migrate to **Opus 5.5** (`low` replaces `disabled`). |
| **Opus 4.8** | Thinking **off by default** unless `adaptive` passed. Start coding at `xhigh` (`max` overthinks). `budget_tokens` → `400`. | Direct, opinionated prose; emits regular updates (remove `"every 3 tool calls"`). Persistent cream/serif frontend house style. | Favors reasoning over tool calls; spawns fewer subagents by default; literal scope (won't generalize formatting across sections). | `"Be conservative"` code-review prompts drop bug recall. 1M context default. Migrate to **Opus 5.5** (note thinking becomes always-on). |
| **Sonnet 5** | Adaptive **on by default** (unlike 4.6); default `high`; `disabled` allowed. `budget_tokens` & sampling params → `400`. | Regular progress updates; fixed frontend house style unless 4 visual directions or specs given. | More agentic than 4.6; literal scope; `"be conservative"` drops review recall; `disabled` lowers tool calls unless nudged. | **Tokenizer emits ~30% more tokens** than 4.6 (raise `max_tokens`). Migrate to **Sonnet 5.5** (re-sweep `effort`; note `disabled` removed on 5.5). |

*(Note: `Opus 4.6`/`Sonnet 4.6` default to thinking off and still accept deprecated `budget_tokens` with `xhigh` unavailable; `4.5` models lack adaptive thinking and support manual `budget_tokens` only.)* `[Claude docs]`

## 3. Google Gemini Models (`Gemini 4` & `3.8 Flash`) `[Vendor]`

| Model | `thinking_level` & Defaults | Context & Output Limits | Sampling, Caching & Modalities | Key Gotchas & Migration Triggers |
| :--- | :--- | :--- | :--- | :--- |
| **`gemini-4-carbon`** | `low`, `medium` (default), `high` (`xhigh`: `unverified`) | `1,048,576` unified input+output; `64K` sync / long decode up to 1M (`background=true` or `continuation_token` on `v1beta1`) | Custom `temperature`/`top_p`/`top_k` ignored; per-item `media_resolution`; text/image/audio/video/PDF/Office/ODF | Must pass `thought_signature` verbatim (`400` if omitted; automatic in `google-genai` / `store: true`). Deliberate speed; use for hardest verification & long-horizon coding. |
| **`gemini-4-neon`** | `low`, `medium`, `high` (default), `xhigh` | `1,048,576` unified; `64K` sync / long decode | Custom sampling ignored; per-item `media_resolution`; Office/ODF supported | Balances Carbon-grade frontier reasoning with faster turnaround and fewer output tokens. |
| **`gemini-4-hydrogen`** | `low`, `medium`, `high` (default), `xhigh` (`MINIMAL` / `thinking_budget` → `400`) | `1,048,576` unified; `65,536` foreground stream / 1M long decode | Custom sampling ignored; **implicit caching only** (`>=4,096` tokens); per-item `media_resolution`; Office/ODF | Default workhorse for fast everyday coding and agentic tool loops; defaults to concise output unless verbosity requested. |
| **`gemini-4-argon`** | `low`, `medium` (default), `high` (`xhigh`: `unverified`) | `1,048,576` unified; `64K` sync / long decode | Custom sampling ignored; per-item `media_resolution` | Initial Gemini 4 frontier release; lower token spend per turn than Carbon. |
| **`gemini-3.8-flash`** | `low`, `medium` (default), `high` (`minimal` & `thinking_budget` unsupported → error) | `1,048,576` input / `65,536` `max_output_tokens` (shared: `thoughtsTokenCount` + `candidatesTokenCount`) | Keep `temperature=1.0` (avoid lowering); drop deprecated sampling overrides | Migrate `3.7 Flash` `minimal` → `low`; preserve `thought_signature` or `previous_interaction_id`; tight `max_output_tokens` at `high` risks `MAX_TOKENS` truncation. |

## 4. Open-Weight Family Summary `[Vendor]`

| Family / Variant | Thinking / Reasoning Control | Recommended Sampling | Key Structural / Prompt Rule |
| --- | --- | --- | --- |
| **DeepSeek-R1** (`671B/37B`, `128K`) | `<think>\n` assistant prefill required | `temp=0.6` (`0.5`–`0.7`), `top_p=0.95` | **No `system` prompt**; put all rules in `user`; `\boxed{}` for math. |
| **DeepSeek-R1-0528** | Automatic (no `<think>\n` prefill) | `temp=0.6`, `top_p=0.95` | `system` supported; `[file name]` & `[webpage X begin]` + `[citation:X]`. |
| **Qwen3** (`235B-A22B`, `32B`, `32K`/`131K` YaRN) | `enable_thinking=True\|False`; `/think`, `/no_think` | Think: `0.6/0.95/20/0`; Non-think: `0.7/0.8/20/0` | Strip `<think>` from history; **no greedy decoding** in thinking mode. |
| **Qwen3-2507** (`Instruct` / `Thinking`, `262K`/`1M` DCA) | Single-mode weights (`Thinking` injects `<think>`) | Same mode-matched presets as Qwen3 | Parse `</think>` (`151668`) on `Thinking-2507`; strip history `<think>`. |
| **OpenAI `gpt-oss`** (`120b`, `20b`) | `Reasoning: low \| medium \| high` in `system` | `unverified` | **Harmony format mandatory**; custom rules in `developer`; hide `analysis`. |
| **Meta Llama 3.3** (`70B`, `128K`) & **Llama 4** (`Scout` `10M`, `Maverick` `1M`) | None (`unverified`) | `unverified` | Distinct headers/stops (`<\|eot_id\|>` vs `<\|eot\|>`); Pythonic `[func(k=v)]` tools; external Llama Guard. |

## 5. When to Upgrade & Re-Tune Prompts `[General]`

- **Always re-sweep `effort` and `max_tokens`** on every Claude minor/major bump (`5` → `5.1` → `5.2` or `5` → `5.5`): identical effort names produce different reasoning depths, and preserved thinking counts against `max_tokens`. `[Claude docs]` `[General]`
- **Prune before adding:** Most cross-version regressions come from obsolete scaffolding (`budget_tokens`, prefill, sampling params, forced `tool_choice`, `"do not think"`, `"be conservative"`, or Opus 5 verification prompts) rather than missing rules. `[Claude docs]` `[General]`
- **Check prefix & fallback behavior:** On `Fable 5.1/5.2`, `Opus 5.5`, `Sonnet 5.5`, and `Haiku 5.5`, keep history append-only (`400` prefix check) and handle `stop_reason: "refusal"` explicitly (`Haiku 5.5` has no server fallback; `Sonnet 5.5` only falls back on `cyber`/`frontier_llm`). `[Claude docs]`
- **Re-test visual tooling on upgrades:** `Opus 5.5` reads dense charts more accurately without scaffolding, while `Fable 5.1` and `Sonnet 5.5` still gain on dense technical drawings/charts with a crop/zoom or PIL/OpenCV tool. `[Claude docs]`
- **Check prompt-cache invalidation triggers:** Changing top-level `output_config.effort`, `thinking` mode, or `output_config.format` invalidates cached prefixes; use beta per-message effort (`mid-conversation-output-config-2026-07-01`) for dynamic turns. `[Claude docs]`
- **Treat cross-family numbers as `unverified` until measured:** Never copy Claude `effort` prompts or open-weight sampling presets across model families without running your task eval suite. `[General]`

## 6. Per-Model Quick Migration Actions `[Claude docs]`

- **To Fable 5.2 / Mythos 5.2:** Start `effort: high`, audit/prune legacy delegate and token-budget rules, add `"Finishing work"` at `low`/`medium`, add code-ownership only if consolidation is wanted, and enable `display: "updates"` + silent-streak reminder for interactive UIs.
- **To Opus 5.5:** Re-sweep `effort` starting at `medium`, convert Opus 5 `thinking: disabled` calls to `low` effort, add unattended checklist loop (`<=3` auto-continues), tag user-pasted text with random IDs, and name specific frontend anti-patterns.
- **To Sonnet 5.5:** Re-sweep `effort` (`medium` coding / `high` default), cap unrequested tests/files and `xhigh`/`max` reviewer subagents, add JSON reasoning nudge at `low`/`medium`, and keep mid-turn user text after the last `tool_result`.
- **To Haiku 5.5:** Raise `max_tokens` for default adaptive thinking (`budget_tokens` → `400`), pass `{{current_date}}` for search, guard `disabled` + JSON tool skipping, check for empty text at `xhigh`, and handle `stop_reason: "refusal"` client-side.

## 7. Context, `max_tokens`, and API Compatibility Snapshot `[Claude docs]`

- **Hard `max_tokens` ceiling:** Up to `128K` on `4.6`–`5.5` models (`64K` on `4.5`; `300K` Batches beta `output-300k-2026-03-24`), covering internal thinking + visible text combined.
- **Sampling params (`temperature`, `top_p`, `top_k`):** Rejected (`400`) for non-default values on `4.7`/`4.8`/`5`/`5.1`/`5.2`/`5.5`/`Mythos Preview`, and rejected unconditionally under API version `2026-10-21`.
- **Last-turn prefill:** Removed (`400`) on `4.6+` and `Mythos Preview`; use `output_config.format`, system rules, or `user` continuation messages.
- **Forced `tool_choice` (`any` / `tool`):** Returns `400` on `Fable 5.1/5.2`, `Mythos 5.1/5.2`, `Opus 5.5`, and `Sonnet 5.5` (and fails with manual extended thinking); use `tool_choice: {"type": "auto"}` + `strict: true` / `output_config.format`.
- **Client-side refusal & schema guardrails:** Always handle `stop_reason: "refusal"` (`stop_details.category`) and `stop_reason: "max_tokens"` explicitly in harness code; never assume HTTP `200` guarantees valid JSON. `[Claude docs]`
- **Preserved-thinking models (`Fable 5.1/5.2`, `Mythos 5.1/5.2`, `Opus 5.5`, `Sonnet 5.5`, `Haiku 5.5`):** Keep history append-only; use mid-conversation `system` messages or server compaction (`clear_thinking_20251015`) instead of editing earlier turns.

## 8. Gaps / `unverified`

- Exact numerical token multipliers per Claude `effort` tier, TTFT/TPS comparisons across models, and missing context-window sizes where model prompting pages are silent (`Fable 5`, `Fable 5.1`, `Sonnet 5`, `DeepSeek-R1-0528`, `gpt-oss`) are `unverified`.
- Detailed breaking API changes referenced in the Opus 5.5 (4 changes) and Sonnet 5.5 (5 changes) migration guides are `unverified` here.
