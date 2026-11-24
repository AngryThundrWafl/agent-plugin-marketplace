# Prompt Deliverable Verification Checklist

Run every check below against your finished prompt deliverable before returning it to the user. Treat each item as a binary **PASS / FAIL** gate and revise any **FAIL** item before finalizing. Verify model-specific rules against the target reference file(s) loaded from `SKILL.md` `[General]`.

## A. Reference Grounding & Spec-First Gates

- [ ] **Target recorded first:** Exact model ID/family and deployment surface (`API`, `chat`, `agent`, `batch`, or `self-hosted`) are explicitly stated in `Target` `[General]`.
- [ ] **Migration source recorded (when porting):** Source model is named so obsolete scaffolding is audited and pruned before adding new instructions `[Claude docs]` `[General]`.
- [ ] **Matching reference files loaded before drafting:** Loaded the target model file first (since model-specific behavior overrides general defaults) plus only the relevant topic reference files `[Claude docs]` `[General]`.
- [ ] **Spec locked before prompt:** `Spec` defines SMART success criteria, input/output boundaries, failure modes, guardrails, and latency/cost budget prior to drafting `Prompt` `[Claude docs]`.
- [ ] **Grounded techniques only:** Every technique in `Prompt` and `Why` traces directly to the loaded reference file(s), with cross-section syntheses tagged `[General]` in `Why` and `Limitations` `[General]`.

## B. Output Contract Completeness (All 8 Sections In Order) `[General]`

- [ ] `1. Target` — Names exact model ID/family, deployment surface, migration source (if applicable), and reference files loaded.
- [ ] `2. Spec` — Covers SMART success criteria, inputs/outputs, failure modes, guardrails, and latency/cost budget.
- [ ] `3. Prompt` — Provides complete, copy-pasteable prompt, tool, template, and/or schema blocks suited to the target surface.
- [ ] `4. Why` — Every bullet carries exactly one provenance tag: `[Claude docs]`, `[Vendor]`, or `[General]`.
- [ ] `5. Settings` — Lists concrete runtime settings grounded in the loaded reference file(s), marking every undocumented parameter `unverified`.
- [ ] `6. Tests` — Includes `>= 3` concrete tests covering (1) happy path, (2) edge/adversarial/guardrail, and (3) format/schema/regression, each with explicit pass/fail criteria and grading tier (`code-based`, `LLM-based`, or `human`).
- [ ] `7. Changelog` — Records semver version, one isolated change, hypothesis/rationale, and before/after eval delta (or `not yet run — baseline`).
- [ ] `8. Limitations` — Explicitly inventories untested `[General]` syntheses, `unverified` settings, known model caveats, and harness-enforced responsibilities.

## C. Target Anti-Pattern & API Compatibility Gates `[Claude docs]` `[Vendor]`

Verify zero violations against the loaded model and topic reference file(s):
- [ ] **Wire format & role hierarchy valid:** Prompt uses the target family's required roles, delimiters, and special tokens (no mixed template tokens, omitted mandatory envelopes, or disallowed `system` roles).
- [ ] **API & inference controls valid:** No deprecated or error-producing API parameters for the target model/version (e.g., disallowed prefill, removed thinking/budget modes, forbidden sampling overrides, invalid forced tool-choice settings, or harmful greedy decoding in thinking modes).
- [ ] **Safeguard & visibility hygiene:** Prompt avoids requesting raw internal reasoning in visible output or schema fields where forbidden, keeps private reasoning channels hidden from end users, and isolates untrusted third-party inputs in the target's safe container.
- [ ] **Legacy scaffolding pruned:** Carried-over anti-patterns documented as harmful on the target model (aggressive tool-trigger wording, obsolete verification/narration/caution lines, or incompatible migration snippets) have been removed.

## D. Settings, Schema, Multi-Turn & Eval Discipline `[Claude docs]` `[Vendor]` `[General]`

- [ ] **No cross-model extrapolation:** Parameters absent from the target's loaded reference file(s) are explicitly marked `unverified` rather than copied from another model family `[General]`.
- [ ] **Structured output validity (when used):** Schema follows all target grammar/complexity constraints, omits restricted features or sensitive data from cached schemas, handles truncation/refusal failure stops cleanly, and accounts for advisory-only schema formats where grammar enforcement is external `[Claude docs]` `[Vendor]`.
- [ ] **Long-context & multi-turn hygiene (when applicable):** Long inputs place source data above queries with grounding instructions; streaming and `max_tokens` headroom match target requirements; multi-turn thinking/reasoning history follows the target's exact retention or stripping rule `[Claude docs]` `[Vendor]`.
- [ ] **Grading tiers fit criteria:** Deterministic checks use `code-based` grading; nuanced judgment uses `LLM-based` grading with explicit auto-fail rubrics, discrete `<result>` tags, and grader thinking enabled; `human` grading is reserved for genuinely non-automatable checks `[Claude docs]`.
- [ ] **One isolated change per iteration:** `Changelog` isolates a single prompt, setting, or schema edit per version bump so eval deltas stay attributable `[Claude docs]` `[General]`.
- [ ] **Harness boundaries explicit:** `Limitations` clearly separates prompt instructions from harness-enforced controls (permissions, approvals, streaming, retries, refusal handling, and history management) `[Claude docs]` `[General]`.

Tag definitions (`[Claude docs]`, `[Vendor]`, `[General]`, `unverified`) are in the authoring guide header; list every `[General]` item in `Limitations` until validated on target evals.
