---
name: Claude legacy models prompting reference
source:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-4-8
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5
fetched: 2026-11-24
covers: Earlier Claude 4.8 / 5 / 5.1 model prompting deltas and gotchas (Fable 5.1, Fable 5, Opus 5, Opus 4.8, Sonnet 5)
---

# Claude Legacy Models (Fable 5.1, Fable 5, Opus 5, Opus 4.8, Sonnet 5)

Tags: `[Claude docs]` = from the fetched pages above. `[General]` = synthesis, must be tested. `unverified` = page silent.
Condensed digest of earlier models whose prompts may still exist in production or require migration. **Verbatim** blocks are copied exactly from the respective source page.

## 1. Claude Fable 5.1 / Mythos 5.1 [Claude docs]

- **Effort calibration:** Default `high`; re-run sweeps rather than carrying over Fable 5 settings. `medium` roughly matches Fable 5 at lower cost; `low` is often cost/score competitive against smaller models at higher effort. At `low`, search/retrieval triggers less often (nudge it to verify unfamiliar or fast-moving names via search using the user's exact spelling). At `xhigh`/`max`, it can draft long deliverables twice (in thinking then reply) → set `max_tokens` for both and append a user note instructing it not to compose the full output in reasoning.
- **Progress updates:** Quieter between tool calls than Fable 5, especially at high effort. Set `display: "updates"` (beta `thinking-display-updates-2026-08-18`) or `"summarized"`, strip `"hold all findings for the final response"`, and send a turn-scoped system note (`clear_at: "next_user_message"`) if your UI hides terminal output.
- **Batching independent tool calls:** Batches explicit multi-item fetches, but in coding/computer-use loops may run implied independent calls one per turn. Append a turn-scoped system nudge (`mid-conversation-system-clear-at-2026-08-21`) after tool results (**verbatim**):

```text
First privately list what you need next; then request every item that doesn't depend on another's result in this one response.
```
- **Append-only history & prefix checks:** Never edit `system`, `tools`, or earlier turns containing thinking blocks, or prefix checks fail and prompt cache invalidates. Use `thinking.block_binding.prefix_mismatch_behavior: "drop_block"` (beta `thinking-binding-controls-2026-08-01`) + `input_transformations` logs to debug; use server-side compaction or full-history summary replacement. Cache reads cost `$0.25/M` tokens (`2.5%` of input), so test later compaction points.
- **Prose, formatting, quoting & scope gotchas:**
  - Denser prose than Fable 5 → add `"Please remove all mannered prose."` (or define mannered prose explicitly).
  - Underuses bold/headers/bullets in chat → remove anti-formatting rules and specify when lists/prose apply.
  - Copies retrieved text without quote marks → add a one-shot `<example>` + `<rationale>` showing indirect speech + marked quotes.
  - Rewrites whole files for small edits → add surgical-edit guidance to save output tokens.
  - Adds unrequested fixes/tests → restrict changes to requested behavior and matching neighboring-style tests.
  - Async early stopping (`"Next, I'll..."` / `"Shall I...?"`) → add `"You are operating autonomously. The user is not watching in real time..."` + `# Delivering work` scope rules.
  - Client compaction summaries → instruct it to preserve difficulties, options tried, exact constraints/agreements, current status, open items, and exact names/numbers/links in `<summary></summary>`.
  - Non-blocking async subagents (launch + separate wait tool) cut wall-clock completion time; supply a PIL/OpenCV container or crop tool for dense charts.
- **Safeguard false positives:** Fewer than Fable 5, but triggered by `"Does this program compile without errors?"` (ask `"Are there any bugs in this program?"` instead), lesser-known languages lacking docs, and base64 strings in tool outputs. Never ask for reasoning in response text (`reasoning_extraction` refusal).

## 2. Claude Fable 5 / Mythos 5 [Claude docs]

- **Thinking & safeguards:** Adaptive thinking only, summarized-only thinking output, no `budget_tokens`. Safety classifiers cover offensive cyber, biology/life sciences, and `reasoning_extraction` (supports fallback to Opus 4.8, except `fallbacks: "default"` does not retry `reasoning_extraction`).
- **Long turns & timeouts:** Default `high` (`xhigh` for hardest tasks; `medium`/`low` often exceed prior models' `xhigh`). Individual turns can run many minutes or hours → raise client timeouts, enable streaming, and check runs asynchronously.
- **Concise steering:** Instruction following is strong enough for brief rules over exhaustive lists:
  - Act once enough info exists; lead with outcome/TLDR; avoid premature abstractions or unrequested refactoring.
  - Audit every progress claim against session tool results before reporting.
  - Distinguish assessment-only questions from change requests; verify evidence before state-changing commands.
- **Subagents & memory:** Spawns parallel subagents readily; prefer async orchestrator communication and one-lesson-per-Markdown-file memory systems.
- **Long-session failure modes:**
  - Rare text-only `"I'll now run X"` endings → add autonomous-operation check of the final paragraph before ending turn.
  - Context-budget anxiety from harness token countdowns → omit countdowns or add (**verbatim**): `You have ample context remaining. Do not stop, summarize, or suggest a new session on account of context limits. Continue the work.`
  - Working shorthand/arrow chains in final summaries → distinguish terse inter-tool notes from plain-sentence standalone final recaps.
- **`send_to_user` tool & skill cleanup:** Add a verbatim pass-through tool paired with explicit system-prompt elicitation (do not route narration through it). Refactor over-prescriptive legacy skills that degrade default performance.

## 3. Claude Opus 5 [Claude docs]

- **Strengths & defaults:** Built for complex agentic coding, **1M token context** (default and max), multisheet spreadsheets/slides, and high-precision/recall code review (avoid `"only report high-severity"` unless you want fewer bugs reported; filter in a second pass). Default effort: `high` (re-run sweeps; `low`/`medium` yield strong quality at lower cost/latency).
- **Verbosity & over-verification gotchas:**
  - Default replies, progress narration, and written files run longer than prior Opus models; effort does **not** reliably shorten visible text — prompt explicitly for concision and unpadded files.
  - **Self-verifies and self-corrects automatically:** Remove legacy `"include a final verification step"` / `"double-check your answer"` prompts and verification scaffolding — they cause costly over-verification. Instruct it not to narrate trivial self-corrections.
  - Can expand scope or over-spawn subagents unless constrained (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`, SDK `max_budget_usd` / `maxBudgetUsd`). Note: `claude_code` preset adds delegation guidance automatically; custom system prompts must add it.
- **Thinking-disabled artifacts:** Thinking is on by default and can be disabled only at `high` or below (`xhigh`/`max` + `disabled` = **400 error**). With thinking off, Opus 5 may emit **tool calls as plain text** or leak `<thinking>`/XML tags (remove any `"do not think"` rule, which worsens leakage). Prefer `low` effort thinking over `disabled`; if `disabled` is mandatory, add **verbatim**:

```text
When you use a tool, you may say a brief sentence first. If no tool can express what the user asked for, say so instead of guessing. Do not include internal or system XML tags in your response.
```
- **Refusals:** Prompts requesting verbatim/fixed-format reasoning in text can trigger `reasoning_extraction` refusals; read `display: "summarized"` thinking blocks instead.

## 4. Claude Opus 4.8 [Claude docs]

- **Thinking & effort:** Thinking is **off by default** unless `thinking: {type: "adaptive"}` is explicitly set (steerable via prompt). Start coding/agentic work at `xhigh` (`max` can overthink); use `>= high` for intelligence-sensitive tasks and `>= 64k` `max_tokens` at `xhigh`/`max`. Respects `low`/`medium` strictly (risk of under-thinking complex tasks).
- **Behavioral deltas:**
  - **1M context window default** and mid-conversation system messages (shared with Opus 5.5 migration path).
  - **Favors reasoning over tool calls:** Raise effort (`high`/`xhigh`) or explicitly specify when/how to call tools (e.g., web search).
  - **Literal instruction following:** Does not generalize rules across items; state scope broadly (`"Apply this formatting to every section, not just the first one"`).
  - **Tone & progress:** Direct, opinionated prose with minimal validation/emojis; emits regular updates (remove `"after every 3 tool calls"` prompts); spawns fewer subagents by default (guide fan-out explicitly).
  - **Interactive vs. autonomous tokens:** Multi-turn interactive coding uses more tokens from re-reasoning after user turns; front-load full specs and reduce human turns.
  - **Code review literalism:** `"be conservative"` / `"only high-severity"` drops reported recall even when bugs are found — separate full-coverage finding (with severity/confidence) from downstream filtering.
- **Frontend house style & computer use:** Persistent warm cream (`~#F4F1EA`), serif display (Georgia/Fraunces/Playfair), italic accents, terracotta/amber palette. Override with concrete specs or ask for 4 visual directions first. Computer use: `computer_toolset_20260801` (`computer_20251124`), `browser_toolset_20260801`, max `2576px / 3.75MP` (1080p balanced; 720p/`1366x768` cheaper).

## 5. Claude Sonnet 5 [Claude docs]

- **Adaptive thinking ON by default & new tokenizer:** Requests without `thinking` now run adaptive thinking (unlike Sonnet 4.6); `high` effort default. Rough mapping: Sonnet 5 `medium` ≈ Sonnet 4.6 `high`; Sonnet 5 `high` ≈ Sonnet 4.6 `max`. Manual extended thinking (`budget_tokens`) returns **400**. **New tokenizer produces ~30% more tokens** for identical text — raise `max_tokens` limits tuned on Sonnet 4.6 to avoid `stop_reason: "max_tokens"` truncation.
- **Sampling params removed:** Passing `temperature`, `top_p`, or `top_k` returns **400** (use `"propose 4 visual directions"` instead of `temperature` for design variety).
- **Agentic & literalism traits:** More agentic than Sonnet 4.6 (with thinking `disabled`, tool calls drop unless nudged); emits regular progress updates (remove `"every 3 tool calls"` scaffolding); literal scope interpretation; `"be conservative"` code-review prompts drop recall; front-load specs to minimize multi-turn token overhead.
- **Frontend & computer use:** Settles into a fixed default house style unless given concrete specs or 4-option selection (+ `<frontend_aesthetics>` anti-slop block). Computer use: `computer_toolset_20260801` (`computer_20251124`), `browser_toolset_20260801`, max `2576px / 3.75MP` (1080p balanced; 720p/`1366x768` cheaper).

## 6. Cross-model migration synthesis & `unverified`

- [General] Audit legacy prompts before upgrading to 5.2 / 5.5 models: `"be conservative"` review bars, `"after every 3 tool calls"` narration rules, `"include a verification step"`, `"do not think"` rules, `temperature`, and `budget_tokens` are the likeliest sources of regressions or 400 errors.
- `unverified`: Pricing, deprecation timelines, and exact context-window sizes (where omitted on a model's prompting page, e.g., Fable 5, Fable 5.1, Sonnet 5) are not covered on these pages.
