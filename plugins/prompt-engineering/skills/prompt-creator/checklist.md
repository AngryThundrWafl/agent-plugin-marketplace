# Prompt Creator Verification Checklist

Run every check below before returning any prompt deliverable, and run Section F whenever `prompt-creator` itself is modified. Every item is a binary **PASS / FAIL** gate; fix any **FAIL** before finalizing the output.

## A. Reference Grounding & Spec-First Gates
- [ ] **Target identified first:** Exact model ID/family (`claude-*`, `DeepSeek-R1*`, `Qwen3*`, `gpt-oss*`, `Llama-*`) and deployment surface (`API`, `chat`, `agent`, `batch`, or `self-hosted`) are recorded before drafting.
- [ ] **Migration source recorded (if porting):** Legacy source model is named so carried-over scaffolding is audited and stripped before adding new instructions.
- [ ] **Matching reference files read before drafting:** Loaded `../../reference/01-claude-core.md` + model file (`11`–`15`) + relevant topic files (`05`–`09`) for Claude, or `../../reference/02-open-weight.md` + `../../reference/03-overlap-and-porting.md` for open-weight (plus `04-templates-and-checklist.md` and `10-model-delta-matrix.md` as needed).
- [ ] **Spec written before prompt:** `Spec` locks down SMART success criteria, input/output boundaries, failure modes, guardrails, and latency/cost budget prior to writing `Prompt`.
- [ ] **No invented techniques:** Every technique in `Prompt` and `Why` traces directly to the reference pack (with cross-section synthesis explicitly tagged `[General]`).

## B. Output Contract Completeness (All 8 Sections Present in Order)
- [ ] `1. Target` — States exact model ID/family, surface, migration source (if any), and reference files read.
- [ ] `2. Spec` — Covers SMART success criteria, inputs/outputs, failure modes, guardrails, and latency/cost budget.
- [ ] `3. Prompt` — Provides complete, copy-pasteable prompt, tool, template, and/or schema blocks for the target surface.
- [ ] `4. Why` — Every rationale line carries exactly one confidence tag: `[Claude docs]`, `[Vendor]`, or `[General]`.
- [ ] `5. Settings` — Lists concrete runtime settings grounded in docs/model cards; every parameter absent from the source is explicitly marked `unverified`.
- [ ] `6. Tests` — Includes `>= 3` concrete tests covering (1) happy path, (2) edge/adversarial/guardrail, and (3) format/schema/regression, each with explicit pass/fail criteria and grading tier (`code-based`, `LLM-based`, or `human`).
- [ ] `7. Changelog` — Records version, **one single isolated change**, hypothesis/rationale, and before/after eval delta (or `not yet run — baseline`).
- [ ] `8. Limitations` — Explicitly lists untested `[General]` syntheses, `unverified` settings, known model caveats, and harness-enforced responsibilities.

## C. Claude Anti-Pattern Refusals (Verify Zero Violations on Claude Targets)
- [ ] **No last-turn assistant prefill on 4.6+ / Mythos Preview:** Replaced with `output_config.format`, system/XML formatting rules, or `user`-turn continuation (`400` error otherwise).
- [ ] **No `budget_tokens` (`thinking.type: "enabled"`) on 4.7+ / 5.x / 5.5:** Uses `thinking.type: "adaptive"` + `output_config.effort` (or `between_tools` on Sonnet 5.5 at `effort <= high`).
- [ ] **No disallowed `thinking.type: "disabled"`:** Omitted on Fable 5–5.2, Mythos 5–5.2, Opus 5.5, and Sonnet 5.5 (`400`), and never paired with `xhigh`/`max` on Haiku 5.5 or Opus 5 (`400`).
- [ ] **No forbidden sampling overrides:** Zero `temperature`, `top_p`, or `top_k` overrides on 4.7+ or under API `2026-10-21` (`400` error).
- [ ] **No disallowed forced `tool_choice`:** Zero `tool_choice: {"type": "any" | "tool"}` on Fable 5.1/5.2, Mythos 5.1/5.2, Opus 5.5, or Sonnet 5.5 (`400` error); uses `"auto"` + schema/prompt steering instead.
- [ ] **No reasoning-extraction triggers:** Zero prompts requesting raw reasoning or `<thinking>` tags in visible output; uses `display: "summarized"` for inspection.
- [ ] **Append-only history & injection boundaries:** Zero mid-session edits to `system`, `tools`, or earlier turns in preserved-thinking sessions; untrusted data isolated in JSON-encoded `tool_result` or tagged `<pasted_content id="...">`.
- [ ] **Legacy migration scaffolding scrubbed:** Stripped `"CRITICAL: You MUST use this tool..."` (4.6+), `"do not think"` rules, `"include a verification step"` (Opus 5), `"think carefully"` (Opus 5.5 chat), `"treat that answer as done"` (Fable 5.2 / agentic tasks where mistake self-correction matters), and `"be conservative"` (code review).

## D. Open-Weight Anti-Pattern Refusals (Verify Zero Violations on Open-Weight Targets)
- [ ] **Original DeepSeek-R1 — no `system` prompt:** All instructions placed in `user`; `<think>\n` prefill included if empty-think bypasses occur (R1-0528 permits `system` and drops `<think>\n` prefill).
- [ ] **Original DeepSeek-R1 & R1-0528 — valid sampling:** `temperature` kept in `0.5`–`0.7` (`0.6` rec.); `top_p=0.95` where documented; absent params marked `unverified`.
- [ ] **Qwen3 thinking (`enable_thinking=True` / `Thinking-2507`) — no greedy decoding:** `temp=0` explicitly refused (`temp=0.6`, `top_p=0.95`, `top_k=20`, `min_p=0` used); `<think>...</think>` stripped from multi-turn history; static YaRN disabled for `<=32,768` contexts.
- [ ] **OpenAI `gpt-oss` (`120b` / `20b`) — Harmony format mandatory:** Full `o200k_harmony` envelope used; `system` identity line kept verbatim; custom rules/tools/schemas placed in `developer`; `browser`/`python` kept in `system`; `analysis` CoT never exposed to users or kept after completed `final` turns.
- [ ] **Meta Llama 3.3 vs. Llama 4 — no token mixing:** Zero mixing of Llama 3.3 (`<|start_header_id|>`, `<|eot_id|>`, `<|eom_id|>`) and Llama 4 (`<|header_start|>`, `<|eot|>`, `<|image_start|>`) tokens; zero combined prose + zero-shot tool calls on Llama 4.

## E. Settings, Evals, Versioning & Honesty Discipline
- [ ] **No cross-model setting extrapolation:** Parameters absent from docs/cards (`gpt-oss` sampling, Llama 3.3/4 sampling, undocumented context/output limits) are marked `unverified`, never copied from another model.
- [ ] **Structured output schema validity (if used):** Every object sets `additionalProperties: false`; zero `oneOf`, `not`, recursive `$ref`, or numeric/length bounds; complexity caps (`<=20` strict tools, `<=24` optional params, `<=16` unions) respected; `stop_reason: "max_tokens"` and `"refusal"` fail cleanly; enum matching is case-insensitive.
- [ ] **Long-context & multi-turn hygiene (if applicable):** Contexts >20K tokens place documents above query/instructions with `<quotes>` grounding; `max_tokens > 21,333` enables streaming; preserved-thinking turns pass `thinking` and `redacted_thinking` blocks unchanged.
- [ ] **Grading tiers fit criteria:** Deterministic checks use `code-based`; judgment checks use `LLM-based` with clear rubric, discrete `<result>` tags, and grader thinking enabled; `human` reserved for genuinely non-automatable checks.
- [ ] **One change per iteration:** `Changelog` isolates exactly one prompt, setting, or schema change per version bump with an explicit hypothesis and eval delta.
- [ ] **Untested items & harness boundaries explicit:** `Limitations` flags every untested `[General]` item and `unverified` param, and separates prompt controls from harness enforcement (permissions, streaming, `max_tokens` retry, `stop_reason: "refusal"` handling, append-only history).

## F. Agent Skills Structural Check (For `prompt-creator` Itself)
- [ ] **Valid `SKILL.md` frontmatter:** Contains ONLY allowed Agent Skills keys (`name`, `description`); `name: prompt-creator` matches parent directory `prompt-creator`.
- [ ] **Compliant `description`:** Single line, `<= 1024` chars, contains zero `: ` (colon-space) and zero `<` or `>`, and mentions designing, versioning, and testing prompts for Claude or open-weight models plus the 8-section output contract.
- [ ] **Thin entrypoint (< 120 lines) & progressive disclosure:** `SKILL.md` directs the agent to read `authoring-guide.md`, `checklist.md`, and on-demand `../../reference/*.md` files without inlining the reference pack.
- [ ] **Target line budgets & repo validation:** `authoring-guide.md` (~140–200 lines) and `checklist.md` (~70–110 lines) satisfy all acceptance criteria, and `npm run build && npm test && npm run validate` passes with 0 errors.

## G. Final Sign-Off Gate
- [ ] **All Sections A–E verified against deliverable:** Every item above checked before sending output to the user.
- [ ] **All Section F checks pass after skill edits:** Verified line counts, YAML frontmatter, progressive disclosure links, and repository validator exit code `0`.
- [ ] **Failure action:** If any item above fails, revise the prompt, settings, tests, or skill files and re-run this checklist before returning.

### Quick Reference — Common Error Codes & Hard Stops
- `400` on Claude 4.6+: last-turn assistant prefill or deprecated top-level `output_format` without beta header.
- `400` on Claude 4.7+: `thinking.budget_tokens`, `temperature`/`top_p`/`top_k` overrides, or mutating history/system/tools before preserved thinking blocks.
- `400` on Fable 5–5.2 / Mythos 5–5.2 / Opus 5.5 / Sonnet 5.5: `thinking.type: "disabled"` or forced `tool_choice` (`"any"`/`"tool"` on 5.1/5.2/5.5).
- `stop_reason: "refusal"` (`reasoning_extraction`): caused by asking for internal reasoning in visible output or JSON fields.
- Infinite repetition / quality collapse: `temp=0` on Qwen3 thinking, `temp` outside `0.5`–`0.7` on DeepSeek-R1, or omitting Harmony on `gpt-oss`.

### Quick Reference — Confidence & Verification Tags
- `[Claude docs]` — Directly grounded in `../../reference/01-claude-core.md`, `05`–`09`, or `11`–`15`.
- `[Vendor]` — Directly grounded in `../../reference/02-open-weight.md`.
- `[General]` — Cross-section or cross-family synthesis; must be listed in `Limitations` until tested.
- `unverified` — Parameter or capability omitted by the target's docs or model card; never extrapolated.

### Self-Check Record (`prompt-creator`)
- Verified `SKILL.md` frontmatter (`name: prompt-creator`, single-line `description` 273 chars, no `: `, no `<`/`>`, allowed keys only) and progressive-disclosure links.
- Verified `authoring-guide.md`, `checklist.md`, and `npm run build && npm test && npm run validate` pass with 0 errors and 0 warnings.
