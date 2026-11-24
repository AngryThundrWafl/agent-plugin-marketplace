---
name: Claude Fable 5.2 / Mythos 5.2 prompting reference
source:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
fetched: 2026-11-24
covers: Claude Fable 5.2 and Claude Mythos 5.2 (effort, finishing tasks, approvals, code ownership, progress updates, subagents, accumulated caution, legacy-prompt review, final reports, safeguard refusals)
---

# Claude Fable 5.2 / Mythos 5.2

Tags: `[Claude docs]` = from the fetched page above. `[General]` = synthesis, must be tested. `unverified` = the page is silent; nothing borrowed from other models.
This is a condensed digest, not the official text. Blocks labelled **verbatim** are copied exactly from the source page; everything else is paraphrase.

Scope note: the page covers Fable 5.2 and Mythos 5.2 together. Mythos 5.2 offers the same capabilities only to organizations verified through the Cyber / Life Sciences Verification Programs. [Claude docs]

Contents: 0 New conversations only · 1 Effort · 2 Finish the task · 3 Code ownership · 4 Progress updates · 5 Subagents · 6 Caution pile-up · 7 Legacy prompt review · 8 Reports · 9 Refusals · 10 Where to start · 11 Synthesis · 12 Gaps

## 0. Apply changes in new conversations only [Claude docs]

- Suggested system-prompt additions, tool-description changes and line removals should go into **new** conversations only.
- On Fable 5.2 a request that fails the prefix check (changed `system`, `tools`, or an earlier message after thinking blocks) returns a 400 error.
- To change instructions mid-conversation: put them in the newest turn, or append a mid-conversation system message where available.

## 1. Calibrate effort [Claude docs]

- Default and starting point on the Claude API: `high`. Re-run the effort sweep; do not carry over settings tuned on Fable 5.1 or Opus 5.5 (level names rank the same but thinking amount differs).
- `low`: quick back-and-forth, well-specified tasks, high-volume/subagent work. Page says it scores close to Fable 5.1 at higher effort on coding evals.
- `medium`: interactive coding, chat, everyday knowledge work.
- `high`: hard coding, research, agentic work, long unattended runs. Most of the capability gain comes by `high`.
- `xhigh`: hardest long-running work where a gain is measured (slight gain, many more tokens).
- `max`: ceiling measurement / open-ended problems (e.g. science, mathematics); slow, very token-heavy.
- At `high`+ the model thinks before almost every reply, even greetings. "Answer directly without deliberating" does **not** stop thinking at `medium` and above — lower effort instead.
- Effort has little effect on reply length; use prompting for length/tone.
- For agentic work at `low`/`medium`, add the "Finishing work" text (§2): early stopping is more likely there.
- Mid-conversation effort changes without losing cache: per-message effort (beta, `mid-conversation-output-config-2026-07-01`). Otherwise a new top-level `effort` may invalidate cached messages.

## 2. Finish the whole task [Claude docs]

Symptom: turn ends with a list of what's left, an offer to continue, or at an ordinary obstacle (timeout). More common at `low`/`medium`.

Fix: add a "Finishing work" system-prompt section. Key ideas (condensed, not official wording):
- do not stop while owing requested work; continue anything not dependent on the user's answer;
- if inviting the user to redirect, instead do the next step;
- diagnose ordinary obstacles (errors, timeouts, locked files, empty results, failing tools) and work through them;
- leave deliberate blockers (files marked untouchable, withheld access, safety guardrails) alone, report them, look for another safe route;
- does not override confirmation for risky/destructive actions.

Measured by Anthropic (medium, replayed coding sessions): about half as many sessions ended with continuable unfinished work; fewer permission-asking endings; not fewer "list remaining and stop" endings; output tokens +~30%. Keep your own confirmation step for risky/irreversible actions.

### Approvals [Claude docs]
- Reply to a "may I proceed?" with the specific action ("Yes, run the migration on the staging database"), not a bare "go"/thumbs-up.
- Be specific in approval rules: listing "sending messages to people outside this conversation" as needing approval made the model hold back ~half its routine requests to colleagues in a no-approver simulation.

## 3. Say who owns the code [Claude docs]

- With no ownership statement (or code framed as someone else's), the model tends to add to existing structure, even duplicating code.
- Saying the code is its own makes it consolidate duplicates (<10% of runs without → ~75% with, small coding tasks), but output tokens +70–80%, unrequested changes (tests, docs), occasional behavior changes, and PR summaries that omit small changes → review the diff, not just the summary.
- **Verbatim** sentence from the page:

```text
You are the owner and long-term maintainer of this codebase, and its design is up to you.
```

- Omit it where the user owns the code and wants minimal change. A scope rule such as "No drive-by refactors, renames or cleanups" earlier in the prompt did **not** cancel it (still consolidated in >50% of runs).

## 4. Keep users informed during long turns [Claude docs]

1. Check the client first: mid-turn updates arrive as progress-update `thinking` blocks, empty at default `thinking.display: "omitted"`. Set `display: "updates"` (beta header `thinking-display-updates-2026-08-18`) or `"summarized"`, and render non-empty `thinking` blocks between tool calls.
2. Harness reminder (needs mid-conversation system messages): count consecutive tool-calling steps with nothing readable (count only with `display` = `updates`/`summarized`); then append a turn-scoped system message (`clear_at: "next_user_message"`, beta `mid-conversation-system-clear-at-2026-08-21`). Roughly halved the longest silent stretch in multi-turn coding tests. Leave reminders in `messages` on later requests (removing/rewording invalidates later thinking blocks). **Verbatim** reminder:

```text
The user hasn't heard from you in a while: say in a few words what you're doing, then continue.
```

3. Intent signalling (human-in-the-loop). **Verbatim**:

```text
Before you start, say in a line what you're about to do; brief updates while you work help the user follow along. Close with a short recap that stands on its own (what you found, what you did, and what's next), so a reader who only sees the last message has the full picture.
```
   Result: pre-first-tool message in every run; output tokens ~+20%.
4. Fallback with no reminder support. **Verbatim**: `Every few tool calls, give the user a one-line update on where things stand.` Cut most long silent stretches on workflow-automation tasks; runs of several tool calls between updates remain.
5. The page recommends the model for long asynchronous tasks where nobody needs frequent updates.

## 5. Set expectations for subagents [Claude docs]

- Delegation depends on harness/tasks: rarely spawned with a minimal subagent tool on short tasks; readily when prompts invite delegation.
- At `xhigh`/`max` it used subagents to review its own work in a coding product (Fable 5.1 did not on the same tasks).
- Early testers: good planner/orchestrator for other models. Subagents can be a large share of session cost — check the default subagent model.
- Only rewrite the subagent tool description if it over-spawns. In the description: state what a subagent adds to session cost, when delegation is/isn't worth it, how to brief a subagent. A longer cost-focused description roughly halved subagent count at `high` vs a shorter one.
- Review standing delegation lines in system prompts, skills and agent files first.

## 6. Keep caution from piling up [Claude docs]

Accumulated cautious notes/memory/instruction files can make the model ask for needless approval (seen mostly with several cooperating agents). Remedies:
- delete notes you no longer need (e.g. stale "never retry");
- name the routine steps needing no approval (vague "act more freely" is too weak);
- audit/narrow validation stop conditions ("stop at first error");
- avoid absolute "never"; write "ask for approval before deleting files" rather than "never delete files".
Keep own confirmation for risky/irreversible actions.

## 7. Review prompts/harnesses written for earlier models [Claude docs]

Reconsider: standing delegate-instructions; a token budget shown in the prompt (removing a large one lowered cost with equivalent performance at `high`/`xhigh`, coding tasks; does not cover the API task-budgets beta); harness code that edits earlier turns (preserved thinking → prefix-check failures; use context editing or compaction; optional `thinking.block_binding.prefix_mismatch_behavior: "drop_block"` beta `thinking-binding-controls-2026-08-01`; dropping every turn raised output tokens; otherwise keep history append-only); the Opus 5.5 "treat that answer as done" chat lines (cut thinking on follow-ups but made the model far less likely to point out its earlier mistakes); "think less" instructions (no longer effective at `medium`+); hard style rules (e.g. "one instruction per sentence, in 20 words or fewer" makes prose choppy); accumulated rules/notes/memories (rewrite absolute rules with scope and reason; consider restarting a stuck system with trimmed memory).

## 8. Make reports easy to follow [Claude docs]

- Testers rated writing above Fable 5.1 and similar in clarity to Opus 5.5. Readers of final reports usually haven't seen tool calls, so reports must stand alone.
- The page supplies a "Communicating clearly" system-prompt block (low-context reader, self-contained, key points first, progressive disclosure, plain words, no invented terms, mostly ASD-STE100-style short sentences, prose for connected ideas, bullets for separate items). Effect: less dense final reports, fewer semicolons, shorter sentences on workflow-automation tasks. Adapt length/detail (exact verbatim wording is omitted from this digest; upstream URL is recorded in `source:`).

## 9. Safeguard refusals [Claude docs]

- Classifiers can decline: `stop_reason: "refusal"`, `stop_details.category` ∈ `cyber`, `bio`, `frontier_llm`, `reasoning_extraction`, `general_harms`, `null`.
- Benign cyber/life-sciences work can trigger `cyber`/`bio`; verification programs exist (Cyber Verification Program; Life Sciences Verification Program).
- Remove prompt/skill/tool-description instructions that ask the model to write out its reasoning in the response; read reasoning from `display: "summarized"` thinking blocks instead.

## 10. Where to start (page's order) [Claude docs]

1. Set `effort: high` explicitly, then eval `medium` and `xhigh`.
2. Audit carried-over system prompts, skills, agent files, memory, notes, harness text (§7).
3. Run longest agentic tasks; note early stops, needless approvals, silence, over-delegation, additive-vs-restructure code behavior.
4. Add one fix at a time; measure effect and token cost.

## 11. Cross-model synthesis [General] — must be tested

- [General] Treat 5.2 prompts as "remove first, add second": older anti-narration, delegate, think-less and always-stop-and-ask rules are the likeliest regressions.
- [General] When porting a snippet from another model's page (e.g. Opus 5.5 unattended-run paragraph), A/B it on 5.2; the Fable 5.2 page itself warns that the Opus 5.5 "treat answer as done" lines have side effects here.

## 12. Not covered by this page — `unverified`

Model-specific guidance on XML tags, few-shot examples, system-prompt length, `temperature`/sampling parameters, vision tooling, frontend design defaults, JSON/structured output, tool-call parallelism, and context-window size is `unverified` for Fable 5.2 (not on this page).
