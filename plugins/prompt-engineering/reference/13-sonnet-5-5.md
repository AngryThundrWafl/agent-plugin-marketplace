---
name: Claude Sonnet 5.5 prompting reference
source:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
fetched: 2026-11-24
covers: Claude Sonnet 5.5 (effort calibration, initiative/scope, between_tools thinking, JSON reasoning, progress updates, tool use, mid-turn messages, coding verification, tolerant tool calls, visual tools, refusals)
---

# Claude Sonnet 5.5

Tags: `[Claude docs]` = from the fetched page above. `[General]` = synthesis, must be tested. `unverified` = page silent.
Condensed digest, not official text. **Verbatim** blocks are copied exactly from the source page.

Baseline [Claude docs]: Existing Sonnet 5 prompts generally perform well unchanged; for the hardest long-horizon tasks, prefer an Opus model. Five breaking API changes vs. Sonnet 5 are documented in the Sonnet 5.5 migration guide (not fetched here → details `unverified`).

Contents: 1 Effort · 2 Initiative & scope · 3 `between_tools` · 4 JSON reasoning · 5 Progress, tools, mid-turn messages & verification · 6 Refusals · 7 Synthesis & gaps

## 1. Calibrate effort [Claude docs]

- Effort levels are **recalibrated** vs. Sonnet 5; run a fresh effort sweep against your evals rather than carrying over Sonnet 5 settings.
- Starting points:
  - API default: `high` (start here unless workload is agentic or latency-sensitive).
  - Agentic coding / multistep tool use: `medium` for well-specified tasks, `high` for harder/longer ones.
  - Chat / latency-sensitive work: `low` or `medium` (higher effort delays first token).
  - `xhigh` / `max`: reserve for tasks with a measured quality gain (much longer thinking and replies; `between_tools` is rejected with 400 here).
- `max_tokens`: Thinking counts toward `max_tokens` even when hidden. Set `max_tokens: 128000` (model max) with streaming for agentic coding.
- Lower `effort` to reduce thinking; asking in `system` to think less does not reliably shrink thinking.
- **Mid-conversation effort changes:** Changing top-level `effort` invalidates prompt cache. Use beta per-message effort instead to preserve cache (requires adaptive thinking; returns **400** if `between_tools` is active).

## 2. Steer initiative and scope [Claude docs]

- **Early check-ins (`low` / `medium`):** On long agentic coding tasks at `low`/`medium`, Sonnet 5.5 may pause to confirm a plan or ask before finishing. Raise effort first, or add **verbatim** (increases `low`/`medium` length/cost; keep own risky-action rules):

```text
Keep working until everything the user asked for is done, and only stop to ask when you can't go on without the user or before a risky step.

When the work the user asked for is done and checked, stop and report. Don't add features, tests, files, docs, or refactors that weren't asked for. If you think one would help, mention it at the end instead of doing it.
```
- **Unrequested additions:** Tends to add extra tests, docs, and helper files at all effort levels (more at higher effort). Add only the second paragraph (`"When the work the user asked for is done..."`) to keep edits minimal; at `xhigh`/`max` this cuts overall change size.
- **Extra review rounds (`xhigh` / `max`):** May run self-initiated review/hardening rounds or spawn reviewer subagents after completion. Adding this **verbatim** block eliminated extra reviewer subagents and cut `max`-effort coding cost ~1/3 with no quality loss in Anthropic testing:

```text
When the work the user asked for is done and its checks pass, stop and report. Don't start extra rounds of review or hardening on your own, and don't launch reviewer subagents unless the user asked for a review. If you think a deeper review is worth doing, say so at the end.
```
- **Open-ended prompts:** Requests like `"show me what you can do"` can make it build full artifacts instead of listing ideas. Add **verbatim**:

```text
When the user asks for ideas, options, or a plan, give them that and stop. Don't start building or changing anything until they say to go ahead.
```

## 3. Running without up-front thinking (`between_tools`) [Claude docs]

Lowest thinking mode on Sonnet 5.5: `thinking: {"type": "between_tools"}`. Constraints:
- **Valid only at `high` effort or below:** Combining `between_tools` with `xhigh`, `max`, per-message `effort` changes, `display`, `budget_tokens`, or `block_binding` returns **400**.
- Remove any `"do not think"` system rules when using `between_tools` (they increase internal XML tag leakage).
- **Read by block type:** Responses can start with an empty `thinking` block (adaptive + default `display: "omitted"`) or a progress-update `thinking` block (`between_tools`); never assume block 0 is `text`.
- **Pass `thinking` blocks back unchanged:** Long inter-tool notes return as `thinking` blocks carrying summaries; returning them gives the model the full note.
- **Tool-free requests do not think:** Under `between_tools`, requests without tools skip thinking before answering; use adaptive thinking for multi-step reasoning.

## 4. Reasoning tasks with JSON output [Claude docs]

With structured outputs (`output_config.format`), `text` holds only JSON, so multi-step reasoning (totals, rules, ranking) must happen in thinking — which Sonnet 5.5 often skips at `low`/`medium`:
- **Adaptive thinking + prompt nudge:** Append to end of `system` (**verbatim**): `Think the problem through before you answer.` (At `high`, approaches `xhigh` accuracy for modest token cost; helps `low`/`medium` too with larger token growth.)
- **Or `xhigh` adaptive thinking:** Highest accuracy without the nudge; uses more output tokens.
- **Do not use `between_tools`** for tool-free JSON reasoning (nudge has no effect; splitting into two calls works well but is very slow/expensive).
- **Guard `stop_reason`:** At `low`/`medium` with structured outputs, thinking can hit `max_tokens`. Treat `stop_reason: "max_tokens"` as failed even if partial text parses as JSON, and retry.
- **Prompt-requested JSON (no structured outputs):**
  - Read `text` blocks only; reject `stop_reason: "max_tokens"`.
  - Scan forward from each `{`/`[` and **keep the last valid JSON value** (or last contiguous NDJSON/comma-separated run); never slice first `{` to last `}`, because the model sometimes writes a draft before its final JSON.
  - Or run `xhigh` adaptive thinking so working stays in thinking blocks and `text` returns clean JSON.

## 5. Progress updates, tool use, mid-turn messages & verification [Claude docs]

- **Progress updates:** Inter-tool notes >1–2 sentences arrive as progress-update `thinking` blocks (empty at default `display`). Set `display: "updates"` (beta header `thinking-display-updates-2026-08-18`), or use `between_tools`. Declare a send-user-message tool in the **first** request for verbatim mid-turn snippets. Remove legacy `"hold all findings for the final response"` lines. After ~5 consecutive silent tool steps, append a turn-scoped system reminder (`clear_at: "next_user_message"`), stopping after 2–3 reminders and leaving them in `messages` (append-only) to keep cache and preserved thinking intact. **Verbatim** reminder:

```text
The user hasn't heard from you in a while: say in a few words what you're doing, then continue.
```
- **Tool use in chat/knowledge work:** Strip `"only use tools when strictly necessary"` / `"minimize tool calls"`. To prevent stale training-data answers, add **verbatim**:

```text
Use the search tool to check specifics that may have changed since your training, such as what is allowed, required, or charged, even when you feel confident. For researched work such as a report or a comparison, gather current sources rather than writing from your training knowledge.
```
- **Mid-turn user messages:** Placement right after `tool_result` (or inside `tool_result`) can trigger indirect-injection false positives.
  - Never put user text inside `tool_result`.
  - Append mid-turn user text as a `text` block *after* the last `tool_result` in the same `user` message.
  - Put harness notices in a separate mid-conversation `system` message after the user's text.
  - Avoid custom per-step token countdowns in interactive sessions (beta Task Budgets did not trigger this misread in testing).
- **Coding verification (`low` effort):** May claim done without running checks. Add **verbatim**:

```text
When you change code that can be run, built, or type-checked, run a real check that exercises the change before reporting it done: the project's tests, type-checker, or build, or the changed command itself. A syntax-only check, or a check command that failed to start, does not count; if all that is missing is the project's declared dependencies, install them with its own package manager and lockfile (for example, npm install or pip install -r requirements.txt), never through sudo or the system package manager, unless told not to. Only if no real check can run here, say which one you did not run and why instead of reporting the change as done.
```
- **Tolerant tool calls:** Occasionally emits wrong letter case (`bash` for `Bash`) or slightly renamed params. Handle via unambiguous case-insensitive matching or return `tool_result` with `is_error: true` stating the exact expected name.
- **Visual inputs:** Supply a crop/zoom/image-code tool (`multimodal-crop-tool` cookbook). Helps charts at all effort levels (`high` + tools beat `max` without tools at lower cost) and technical drawings at `high`+ (most at `xhigh`/`max`).

## 6. Safeguard refusals [Claude docs]

- Declines return `stop_reason: "refusal"` with `stop_details.category` ∈ `cyber`, `bio`, `frontier_llm`, `reasoning_extraction`, `general_harms`.
- Verification programs exist for legitimate security (`Cyber Verification Program`) and life-sciences (`Life Sciences Verification Program`) work.
- Beta server-side fallback retries `cyber` and `frontier_llm` on Claude Sonnet 5, **not** `bio`, `reasoning_extraction`, or `general_harms`.
- Remove prompt/skill instructions asking for reasoning in response text (triggers `reasoning_extraction`); read `display: "summarized"` thinking blocks instead.

## 7. Cross-page synthesis & `unverified`

- [General] For interactive Sonnet 5.5 coding agents, test `medium` + `"Keep working..."` scope control before upgrading to `high`/`xhigh`.
- `unverified`: Sampling parameter restrictions (`temperature`/`top_p`), server compaction defaults, and the exact five breaking API changes in the Sonnet 5.5 migration guide are not detailed on this page.
