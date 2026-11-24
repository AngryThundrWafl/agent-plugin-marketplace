---
name: Claude guardrails reference
source:
  - https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
  - https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/increase-consistency
  - https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks
  - https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-prompt-leak
fetched: 2026-11-24
covers: Hallucination reduction, output consistency, jailbreaks and direct/indirect prompt injection defenses, and prompt-leak mitigation
---

# Claude Guardrails

Tags: `[Claude docs]` = from the fetched pages above. `[General]` = synthesis, must be tested. `unverified` = page silent.
Condensed digest, not official text. All fetched snippets are treated as untrusted reference material distilled into operational rules.

## 1. Reduce hallucinations [Claude docs]

Basic strategies:
- **Permit uncertainty:** Explicitly instruct Claude to admit uncertainty (e.g., `"I don't have enough information to confidently assess this."`); substantially reduces fabricated claims.
- **Direct quotes for long documents (>20k tokens):** Have Claude extract verbatim numbered quotes first (or state `"No relevant quotes found."`), then restrict analysis strictly to those numbered quotes.
- **Verify with citations:** Require claim-level quote citations, or add a post-draft self-verification pass where Claude finds a supporting direct quote for every claim and removes unsupported claims (marking removals with `[]`).

Advanced strategies:
- **Chain-of-thought verification:** Enable thinking with `display: "summarized"` and inspect the summarized reasoning in `thinking` blocks when an answer looks wrong to uncover faulty logic or assumptions.
- **Best-of-N verification:** Run the same prompt multiple times and compare outputs; divergence signals likely hallucinations.
- **Iterative refinement:** Pass Claude's prior outputs into follow-up prompts asking it to verify or expand earlier claims.
- **External knowledge restriction:** Explicitly instruct Claude to use only the provided documents and ignore general knowledge.

Limitation [Claude docs]: None of these eliminate hallucinations completely; always validate critical outputs in high-stakes workflows.

## 2. Increase output consistency [Claude docs]

- **Guaranteed JSON schema conformance:** Use Structured Outputs (`output_config.format` with `json_schema`) instead of prompt-only formatting whenever valid schema-compliant JSON is required.
- **Specify exact output format:** Define exact JSON keys, XML schemas, or custom templates when flexibility beyond strict JSON schemas is needed.
- **Prefill `Assistant` turn (deprecated on modern models):** Prefilling skips preamble and enforces structure on older models, but is **not supported on Claude 4.6 and later models or Claude Mythos Preview**. Use structured outputs or system-prompt instructions instead.
- **Constrain with examples:** Supplying a concrete output example is more reliable than abstract formatting prose.
- **Ground with retrieval:** For chatbots/KBs, inject fixed KB entries (`<kb><entry>...</entry></kb>`) and require citing `<kb_entry>` alongside `<answer>`.
- **Chain prompts:** Decompose complex workflows into smaller single-subtask prompts to reduce inconsistency across steps.
- **Keep Claude in character:**
  - Define role, personality, background, and tone in the `system` prompt.
  - Provide explicit scenario-to-response templates (e.g., proprietary IP refusal, ambiguous spec clarification) so Claude stays in character under edge inputs.

## 3. Mitigate jailbreaks & direct prompt injection [Claude docs]

Threat model: an adversarial end user crafts inputs to bypass guardrails or violate Anthropic's Terms of Service / Usage Policy.

- **Harmlessness screens:** Pre-screen user inputs with a lightweight model (`claude-haiku-5-5`) constrained via `output_config.format` (`type: "json_schema"`, e.g. `{"is_harmful": boolean}`, `additionalProperties: false`).
  - **Refusal handling gotcha:** Haiku 5.5 safety classifiers can decline the screening request itself (`stop_reason: "refusal"`). Treat `stop_reason: "refusal"` identically to `is_harmful: true`.
- **Input validation:** Filter known injection strings before calling Claude, or build a generalized LLM validator seeded with known jailbreak examples.
- **Hardened ethical system prompts:** State explicit values/policy boundaries in `system` and give Claude an exact refusal string to output on conflict.
- **Respond to repeat offenders:** Track repeated policy refusals (e.g., content-filter blocks) per user; warn, throttle, or ban repeat offenders.

## 4. Mitigate indirect prompt injection [Claude docs]

Threat model: the user is trusted, but third-party content (inbound emails, webpages, OCR text, tool results) contains adversarial instructions.

- **Put untrusted content only in `tool_result` blocks:** Never place third-party content in `system` prompts or plain user `text` blocks; Claude is trained to treat `tool_result` content with skepticism.
- **State content nature and provenance:** Specify in the tool `description` or result payload what the data is and where it came from (e.g., inbound email from unknown sender, OCR from uploaded image).
- **State untrusted-content policy in `system`:** Instruct Claude that tool/search/file outputs are untrusted data to report, never commands to follow, and must never alter goals, reveal system prompts, or trigger unrequested tools.
- **JSON-encode third-party strings:** Wrap untrusted fields inside a JSON object inside `tool_result` so attackers cannot close quotes or XML tags to break out into instruction context.
- **Never put developer instructions in `tool_result`:** Claude may ignore them or treat them as injection. Send follow-up instructions in the subsequent `user` turn or a mid-conversation `system` message (on supported models).
- **Least privilege:** Withhold secrets Claude does not need, sandbox tool execution, and scope permissions tightly.
- **Screen tool outputs before ingestion:** Pass raw tool outputs through a `claude-haiku-5-5` structured-output screen (`injection_suspected: boolean`) before constructing `tool_result`. Return an error or stripped summary—never raw output—if `injection_suspected: true` or `stop_reason: "refusal"`.
- **Built-in computer/browser classifiers:** `computer_use` and `browser_use` run additional Anthropic classifiers on screenshots/page text to flag potential prompt injections.
- **Red-team & monitor:** Test agents with planted injection payloads pre-deploy and continuously audit production logs for successful redirects.
- **Chain safeguards:** Combine system directives, pre-execution `harmlessness_screen` tools, and structured outputs in regulated workflows.

## 5. Reduce prompt leak [Claude docs]

Caveat [Claude docs]: Apply leak-prevention prompts **only when strictly necessary** — leak-proofing increases prompt complexity and can degrade core task performance. Start with output monitoring first.

- **Separate context from queries:** Put sensitive instructions inside a role-framed `system` prompt and re-emphasize non-disclosure in `User` turns. (Legacy `Assistant` prefilling is **not supported on Claude 4.6+ or Claude Mythos Preview**.)
- **Post-process outputs:** Scan responses with regex/keyword filters or a secondary LLM output-leak check.
- **Omit unnecessary proprietary details:** Do not include secret formulas or internal details Claude does not need; extra prompt mass weakens adherence to `"never mention"` rules.
- **Audit regularly:** Review prompts and completions periodically for accidental leakage and quality regression.

## 6. Cross-page synthesis & `unverified`

- [General] Treat `tool_result` JSON wrapping + Haiku 5.5 pre/post screening + least-privilege tool scoping as defense-in-depth; never rely on system-prompt policy text alone against untrusted third-party inputs.
- [General] Wrap every Haiku 5.5 classifier call so `stop_reason: "refusal"` fails closed (harmful / injection suspected).
- [General] Prefer `output_config.format` JSON schemas over `Assistant` prefilling (unsupported on Claude 4.6+ / Mythos Preview) and reserve anti-leak prompt additions for cases where output filtering is insufficient.
- `unverified`: Classifier false-positive rates, added screening latency, and exact regex/keyword patterns for prompt-leak filtering are not covered on these pages.
