---
name: Claude core prompting principles
source:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/be-clear-and-direct
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/long-context-tips
fetched: 2026-11-24
covers: Prerequisite eval workflow, clarity and directness, context/motivation, multishot examples, XML tag structure, system-prompt role, long-context placement and grounding, model self-knowledge, modern Claude migration defaults
---

# Claude Core Prompting Principles

Tags: `[Claude docs]` = directly from the fetched pages above. `[General]` = cross-section synthesis, must be tested. `unverified` = source pages are silent.
Scope note: Covers current Claude models (Fable 5.2, Mythos 5.2, Fable 5.1, Mythos 5.1, Fable 5, Mythos 5, Opus 5.5, Opus 5, Opus 4.8, Opus 4.7, Opus 4.6, Sonnet 5.5, Sonnet 5, Sonnet 4.6, Haiku 5.5, Haiku 4.5). Model-specific behavior overrides general defaults when both apply. `[Claude docs]`

## 0. Prerequisites: Before Prompt Engineering [Claude docs]

Prompt engineering assumes you already have:
1. A clear definition of success criteria for the use case.
2. Empirical ways to test (evals) against those criteria.
3. A first-draft prompt to iterate on (e.g., generated via the Cookbook metaprompt if starting from scratch).

Not every failing eval is a prompting problem: latency and cost targets are often solved more easily by changing models than by prompt tuning. [Claude docs]

## 1. Be Clear, Explicit, and Direct [Claude docs]

- Treat Claude like a brilliant new employee who lacks your team's norms, workflow context, and unstated expectations.
- **Colleague test:** Show the prompt to a colleague with minimal task context; if they would be confused, Claude will be too.
- **Literal instruction following:** Current Claude models follow instructions precisely. If you want extra features, thoroughness, or direct action instead of suggestions, ask explicitly rather than expecting the model to infer it.
- **Sequential steps:** Use numbered lists or bullets when step order or completeness matters.
- **Modifiers for quality/ambition:** Replace bare asks (`"Create an analytics dashboard"`) with explicit scope and quality modifiers (`"Include as many relevant features and interactions as possible. Go beyond the basics to create a fully-featured implementation."`).

## 2. Add Context and Motivation ("Why") [Claude docs]

- Explaining *why* an instruction or constraint matters helps Claude generalize to edge cases better than bare negative rules.
- Example: instead of `NEVER use ellipses`, write: `Your response will be read aloud by a text-to-speech engine, so never use ellipses since the text-to-speech engine will not know how to pronounce them.` [Claude docs]

## 3. Positive Framing vs. Negative Rules [Claude docs]

- Tell Claude **what to do** rather than what *not* to do (e.g., `"Your response should be composed of smoothly flowing prose paragraphs"` instead of `"Do not use markdown in your response"`). [Claude docs]
- Align prompt formatting with desired output formatting: removing markdown from the prompt reduces markdown in the output. [Claude docs]
- [General] Reserve hard negative rules for specific failure modes you have observed in evals (e.g., avoiding specific frontend patterns or TTS hazards with an explicit reason).

## 4. Examples (Few-Shot / Multishot Prompting) [Claude docs]

Examples are one of the most reliable ways to steer output format, tone, structure, and reasoning style:
- **Count:** Include **3–5 examples** for best results.
- **Relevant:** Mirror your real task inputs and outputs closely.
- **Diverse:** Cover edge cases and vary phrasing/structure so Claude does not latch onto accidental patterns.
- **Structured:** Wrap each in `<example>` tags (and a set in `<examples>`) so Claude separates examples from instructions.
- Worked examples (problem → method → expected answer) also shape how Claude reasons inside its thinking blocks.
- You can ask Claude to evaluate your examples for diversity/relevance or generate additional edge-case examples.

## 5. Structure Prompts with XML Tags [Claude docs]

- Use XML tags (`<instructions>`, `<context>`, `<input>`, `<examples>`, `<documents>`) to separate instructions, reference material, examples, and variable user input unambiguously.
- Use consistent, descriptive tag names across the prompt.
- Nest tags for hierarchical data (`<documents>` containing `<document index="n">`).
- Note: For untrusted user-pasted blocks on newer models (such as Opus 5.5), wrap pasted text in random-ID `<pasted_content id="...">` tags per model-specific guidance. `[General]`

## 6. Give Claude a Role (`system` Prompt) [Claude docs]

- Set a focused role in the API `system` parameter to anchor domain expertise, behavior, and tone (even a single sentence helps, e.g., `"You are a helpful coding assistant specializing in Python."`).
- If Claude must identify itself or choose an LLM inside an app, state identity and exact model string explicitly (e.g., `"The assistant is Claude, created by Anthropic. The current model is Claude Opus 5.5."` and exact string `claude-opus-5-5`). [Claude docs]

## 7. Long Context Prompting (20k+ Tokens) [Claude docs]

- **Data at the top, query at the bottom:** Place long documents and large data inputs near the top of the prompt, *above* your query, instructions, and examples. Putting queries at the end improved response quality by up to **30%** in tests, especially with complex multidocument inputs.
- **Structured document metadata:** Wrap each source in `<document index="n">` with `<source>` and `<document_content>` subtags inside `<documents>`.
- **Quote-grounding before answering:** For large-document analysis/diagnosis, instruct Claude to extract verbatim relevant quotes into `<quotes>` tags first, then produce its analysis (e.g., in `<info>`) based on those quotes. This anchors attention on relevant passages and filters noise.

## 8. Capability-Specific & Safety Blocks in System Prompts [Claude docs]

- **Vision cropping:** On dense images, charts, or UI screenshots, give Claude a crop/zoom tool or skill; testing showed consistent uplift when Claude can zoom into image regions (`multimodal-crop-tool` cookbook). [Claude docs]
- **Medication dosing (children's OTC):** If users may ask about child dosing, Anthropic's prompting best-practices docs provide model-specific verbatim `<medical_guidance>` blocks (variants differ across Fable 5.2, Fable 5.1/Opus 5.5/Sonnet 5.5, Haiku 5.5, Sonnet 4.6, and Haiku 4.5; exact verbatim wording is omitted from this digest; upstream URL is recorded in `source:`). Without web search, Claude defers to the product label, pharmacist, or doctor rather than dosing from memory; with web search, it confirms against an official label such as DailyMed. `[Claude docs]`
- **Financial records / payments:** Anthropic provides a verbatim customer-records/payments system-prompt block for agents handling account numbers, financial reports, or payment workflows (always enforce money-moving approvals in tool/harness code as well). `[Claude docs]`

## 9. Migration Principles for Modern Claude Models [Claude docs]

When updating prompts built for earlier Claude generations:
1. **Specify exact desired behavior** and use quality/completeness modifiers instead of terse under-specified prompts.
2. **Soften aggressive anti-laziness / anti-undertriggering language:** Instructions like `"CRITICAL: You MUST use this tool..."` or `"If in doubt, use [tool]"` cause overtriggering and overthinking on Claude 4.6+ models. Replace with neutral `"Use [tool] when..."`.
3. **Remove last-turn assistant prefills:** Unsupported (returns **400**) starting with Claude 4.6 and Mythos Preview; move formatting, continuation, and preamble rules to system/user prompts or `output_config.format`.
4. **Switch manual `budget_tokens` to adaptive thinking + `effort`:** `budget_tokens` is deprecated on 4.6 and returns **400** on 4.7+.
5. **Keep conversation history append-only & pass thinking blocks unchanged:** On preserved-thinking models (Fable 5.1/5.2, Mythos 5.1/5.2, Opus 5.5, Sonnet 5.5, Haiku 5.5), editing earlier messages, `system`, or `tools` invalidates later thinking blocks and triggers prefix-check **400** errors. Use mid-conversation system messages or server-side context editing/compaction instead.
6. **Apply model-specific overrides:** E.g., Opus 5 defaults to longer replies and self-verifies without prompt nudges; Fable 5.2 requires `effort` changes rather than `"don't deliberate"` prompt lines; Opus 5.5 defaults to `medium` effort and rejects `thinking.type: "disabled"`.

## 10. Gaps / `unverified`

- Prompt-length ceilings, exact system-prompt token overhead, and prompt-level sampling tuning are not covered in Anthropic's overview or best-practices documentation (sampling parameters `temperature`/`top_p`/`top_k` are rejected with 400 on newer models and under API `2026-10-21`) → prompt-level sampling tuning is `unverified`.
