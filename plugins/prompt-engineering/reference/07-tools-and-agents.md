---
name: Claude tool use and agentic systems reference
source:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
fetched: 2026-11-24
covers: Tool-use action steering, parallel tool calling, long-horizon multi-window workflows, state tracking, autonomy & safety, financial/customer records, research, subagent orchestration, prompt chaining, scratchpad file cleanup, overeagerness, anti-hardcoding, coding hallucinations, frontend design
---

# Claude Tool Use & Agentic Systems

Tags: `[Claude docs]` = directly from the fetched page above. `[General]` = cross-section synthesis, must be tested. `unverified` = source page is silent.
Scope note: Model-specific tool, subagent, and persistence behavior overrides general defaults when both apply. `[Claude docs]`

## 1. Tool Use Steering & Parallelism [Claude docs]

- **Action vs. suggestion:** Current models follow instructions literally. `"Can you suggest some changes?"` yields suggestions; write `"Change this function..."` or `"Make these edits..."` when you want tool execution.
  - **Proactive default (`<default_to_action>`):** Instruct Claude to implement changes by default rather than only suggesting them, and to infer likely actions and use tools to discover missing details instead of guessing.
  - **Conservative default (`<do_not_act_before_instructions>`):** Instruct Claude to research and recommend when intent is ambiguous, editing or modifying files only when explicitly requested.
- **Avoid overtriggering (Opus 4.5 / 4.6):** Replace aggressive legacy phrasing (`"CRITICAL: You MUST use this tool when..."`) with neutral guidance (`"Use this tool when..."`).
- **Parallel tool calling:** Current models natively run independent tool calls in parallel (speculative searches, multi-file reads, parallel bash—watch for local system bottlenecks).
  - **Maximize parallelism (`<use_parallel_tool_calls>`):** Instruct Claude to invoke all independent tool calls simultaneously (e.g., reading 3 files in 3 parallel calls), keep dependent calls sequential, and **never** use placeholders or guess missing parameters.
  - **Sequential fallback:** `"Execute operations sequentially with brief pauses between each step to ensure stability."`
  - **Fable 5.1 long agent loops:** Send the parallel-calls instruction as a turn-scoped system message after each round of tool results.

## 2. Long-Horizon Reasoning & Multi-Window State Tracking [Claude docs]

- **Context awareness** (Sonnet 5, Sonnet 4.6, Sonnet 4.5 deprecated, Haiku 4.5): Models track remaining context budget and may wrap up early if unaware of compaction. Tell Claude explicitly when the harness auto-compacts and instruct it to save state to memory (pairs well with the memory tool) and continue without stopping early for token-budget concerns.
- **Multi-window workflow pattern:**
  1. **First context window:** Set up scaffolding (write tests, create `init.sh` to start servers/tests/linters). Later windows iterate on a todo list.
  2. **Structured test tracking (`tests.json`):** Create tests up front in structured JSON and state: `"It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality."`
  3. **Fresh context vs. compaction:** Fresh windows work well because modern Claude discovers repo state from disk. Give a prescriptive startup sequence: `"Call pwd; you can only read and write files in this directory."` → `"Review progress.txt, tests.json, and the git logs."` → `"Manually run through a fundamental integration test before moving on to implementing new features."`
  4. **Verification tools:** Provide computer use, browser use, or browser-automation MCP tools for unattended UI verification.
  5. **Complete context usage:** Encourage spending full output context systematically while avoiding leaving large uncommitted work.
- **State management artifacts:** Use structured JSON (`tests.json`) for status schemas, freeform text (`progress.txt`) for session notes, and `git` for checkpoints/history.

## 3. Autonomy, Safety & Financial/Customer Records [Claude docs]

- **Reversibility & confirmation (Opus 4.6+):** Encourage local, reversible actions (editing files, running tests), but require user confirmation for destructive (`rm -rf`, dropping tables, deleting branches), hard-to-reverse (`git push --force`, `git reset --hard`, amending published commits), or externally visible operations (pushing code, PR/issue comments, sending messages, modifying shared infra). Forbid bypassing safety checks (`--no-verify`) or discarding unfamiliar in-progress files.
- **Payments, account numbers & financial records:** Anthropic provides a verbatim system-prompt block recommended even for non-payment agents handling customer records (first three sentences apply to all customer records). Key rules in the block:
  - Copy full account/card/government IDs only when required; use last 4 digits where a reference suffices; check audience first.
  - **Never** initiate/send/release a payment, withdrawal, or transfer—even if a user claims approval; prepare/queue requests for a human. (Three setups: never pay via queue-only tool; separate request tool if sole tool waits for approval; or omit the two `Never initiate` / `Prepare the payment request` sentences if meant to pay, and require human approval on every money-moving tool call.)
  - Report a check as done only if a tool result in the session showed it before acting; state plainly if skipped or returned late.
  - Keep figures from documents on file as the main version; put unsupported requested changes only in a separate, labeled what-if that nothing else reads from.
  - Never send a message in a named person's name without approval unless it states an assistant wrote it; never draft messages hiding that someone is away (state absence or who covers).
  - *Prompting does not enforce permissions:* enforce money-moving approvals in tool/harness code and test the block on ordinary tasks.

## 4. Research, Subagents & Prompt Chaining [Claude docs]

- **Research & information gathering:** Define explicit success criteria, require cross-source verification, and for complex corpora instruct Claude to maintain competing hypotheses, calibrated confidence levels in progress notes, a hypothesis tree/research notes file, and regular self-critique.
- **Subagent orchestration:** Modern models delegate natively when well-described subagent tools exist.
  - **Over-spawning (Opus 4.6, Opus 5):** May spawn subagents where direct `grep` or single-file tools are faster. Constrain with explicit criteria: use subagents for parallel, isolated-context, or independent workstreams; work directly for simple, sequential, single-file, or shared-context tasks.
- **Prompt chaining:** Still useful (alongside adaptive thinking) when you must inspect intermediate stages or enforce pipelines—most commonly **self-correction** (draft → review against criteria → refine in separate API calls so you can log, evaluate, or branch).

## 5. Agentic Coding Guardrails [Claude docs]

- **Minimizing hallucinations (`<investigate_before_answering>`):** Never speculate about unopened code; **must** read referenced or relevant files before answering codebase questions.
- **Overeagerness / overengineering (Opus 4.5, Opus 4.6):** Constrain explicitly across four axes:
  1. *Scope:* Only make requested or clearly necessary changes (no drive-by refactors, extra features, or unrequested configurability).
  2. *Documentation:* No docstrings, comments, or type annotations on untouched code; comment only non-obvious logic.
  3. *Defensive coding:* No fallback/validation for impossible internal states; validate only at system boundaries (user input, external APIs).
  4. *Abstractions:* No helpers/utilities for one-time operations or hypothetical future needs.
- **Anti-hardcoding & test-gaming:** Instruct Claude to implement general-purpose solutions using standard tools—no hardcoding for test cases, no helper-script workarounds—and to report infeasible tasks or incorrect tests rather than working around them.
- **Temporary scratchpad files:** Claude may create temporary Python scripts/files to iterate (often improves quality). Add a cleanup rule to delete helper/temporary files at task completion if a clean tree is required.

## 6. Frontend Design Guidance [Claude docs]

- Left undirected, Opus 4.5/4.6 converge on generic "AI slop" patterns. Add `<frontend_aesthetics>` targeting:
  - **Typography:** Distinctive fonts; avoid Inter, Roboto, Arial, system fonts, and overused defaults like Space Grotesk.
  - **Color & theme:** Cohesive CSS-variable palettes with dominant colors + sharp accents (drawn from IDE/cultural aesthetics); avoid purple gradients on white.
  - **Motion:** High-impact orchestrated page loads (`animation-delay` staggered reveals) using CSS-only HTML animations or Motion for React.
  - **Backgrounds & layout:** Layer CSS gradients, geometric patterns, or contextual depth rather than flat solid colors and cookie-cutter layouts; vary light/dark themes.
- *(Note: On Opus 5.5, generic "avoid AI look" prompts merely swap defaults—name specific visual anti-patterns to avoid, such as cream backgrounds, italic headline accents, numbered section labels, or pill buttons.)* `[Claude docs]`

## 7. Cross-Model Synthesis [General] — must be tested

- [General] Enforce irreversible/payment boundaries and completion checklists in harness/tool code rather than relying solely on system-prompt blocks.
- [General] Remove legacy anti-undertriggering and over-thoroughness prompts when upgrading harnesses before adding new guardrails.

## 8. Gaps / `unverified`

- Specific Claude Managed Agents API parameters, exact subagent cost-accounting formulas, and MCP server registration schemas are outside Anthropic's prompting best-practices page → `unverified` here.
