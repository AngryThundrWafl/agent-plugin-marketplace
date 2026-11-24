# Prompt Creator Authoring Guide

Use this leaf procedure to design, tune, migrate, and version prompts using the model and topic reference file(s) already loaded from `SKILL.md`. Keep model-specific rules, sampling presets, and API limits grounded directly in those loaded reference files rather than memory `[General]`.

**Grounding & Tagging Policy `[General]`:**
- `[Claude docs]` — directly supported by the loaded Claude Platform reference file(s).
- `[Vendor]` — directly supported by the loaded open-weight vendor reference file(s).
- `[General]` — cross-section or cross-family synthesis requiring empirical verification on target evals.
- `unverified` — parameter or behavior omitted by the target's reference file; keep it explicit instead of extrapolating across models.

---

## 1. Seven-Step Authoring Workflow

### Step 1 — Identify Target Model & Deployment Surface `[General]`
Record the exact target context before drafting so every downstream rule stays model-scoped:
- **Exact model ID / family:** Record the specific Claude model (`Fable 5.2` / `Mythos 5.2`, `Opus 5.5`, `Sonnet 5.5`, `Haiku 5.5`, or legacy Claude) or open-weight checkpoint (`DeepSeek-R1` / `R1-0528`, `Qwen3` / `2507`, `gpt-oss`, `Llama 3.3` / `Llama 4`).
- **Deployment surface:** Direct Messages API, interactive chat UI, autonomous agent/tool loop, Message Batches, or self-hosted open-weight runtime (`vLLM`, `SGLang`, `Transformers`, `openai-harmony`).
- **Migration source (if porting):** Name the legacy source model so obsolete scaffolding (deprecated API parameters, incompatible chat tokens, aggressive tool-trigger wording, or legacy verification nudges) is audited and pruned before adding new instructions `[Claude docs]` `[General]`.

### Step 2 — Apply Loaded Reference Precedence `[Claude docs]` `[General]`
Review the reference file(s) loaded from `SKILL.md` before writing prompt text:
- Follow the **model-specific file first** whenever it overrides general core or topic guidance (for example, default `effort` calibration, supported `thinking` types, prompt-format envelopes, or known refusal behaviors) `[Claude docs]`.
- Keep all cross-family porting differences grounded in the loaded porting/delta reference when moving prompts across model families `[General]`.

### Step 3 — Write the Spec First `[Claude docs]`
Lock down the task specification before drafting prompt text so instructions target concrete failure modes:
1. **Success criteria (SMART):** Quantified thresholds across task fidelity, paraphrase consistency, tone/style, privacy/safety, and error severity `[Claude docs]`.
2. **Inputs & outputs:** Required user/system inputs, untrusted third-party data boundaries (isolated per the target model's wire container), and exact output shape (prose, structured tags, or constrained JSON Schema) `[Claude docs]` `[General]`.
3. **Failure modes:** Target-specific risks from the loaded model file (early stopping, unrequested edits, stale facts, refusal triggers, truncation, repetition loops, or indirect injection) `[Claude docs]` `[Vendor]`.
4. **Guardrails:** Confirmation gates for irreversible or externally visible actions, fail-closed safety screening, verbatim grounding for long inputs, and explicit permission to admit uncertainty `[Claude docs]`.
5. **Latency & cost budget:** Target TTFT, streaming or batching needs, and acceptable reasoning/token ceiling `[Claude docs]`.

### Step 4 — Draft the Prompt & Refuse Documented Anti-Patterns `[Claude docs]` `[Vendor]` `[General]`
Construct the prompt strictly from verified patterns in the loaded reference file(s):
- Write clear, literal instructions that pass the colleague test, use numbered steps when order matters, use positive framing aligned to desired output format, and explain **why** key constraints matter so edge cases generalize `[Claude docs]`.
- Structure instructions, context, untrusted inputs, and examples using the target family's native roles and delimiters (e.g., XML tags and `tool_result` JSON on Claude; native role/token envelopes on open-weight families) `[Claude docs]` `[Vendor]`.
- When context is long, place source material above instructions/queries and require verbatim quote or citation grounding before synthesis `[Claude docs]` `[Vendor]`.
- **Refuse target anti-patterns:** Audit the draft against the loaded model and topic reference file(s) and exclude every technique documented as causing API errors, quality collapse, repetition loops, token mixing, or safeguard refusals on the target model—replacing each with the documented modern alternative `[Claude docs]` `[Vendor]`.
- **Prune legacy scaffolding on migrations:** Remove carried-over workarounds that degrade the target model before layering on new rules `[Claude docs]` `[General]`.

### Step 5 — Specify Runtime Settings Directly From Loaded References `[Claude docs]` `[Vendor]` `[General]`
Copy every concrete runtime setting (thinking/reasoning control, `effort`, structured-output schema, `max_tokens`, streaming, sampling parameters, and context scaling) directly from the loaded target reference file(s):
- Omit parameters rejected by the target API or model version (documenting why in `Settings` or `Why`) `[Claude docs]`.
- Mark every parameter absent from the target's reference file **`unverified`** so operators benchmark it on their own stack instead of inheriting unverified defaults from another model `[General]`.
- Keep harness-enforced constraints (streaming thresholds, append-only history, thinking-block retention/stripping, schema complexity limits, refusal handling, and hard timeouts) explicit alongside model settings `[Claude docs]` `[Vendor]`.

### Step 6 — Design `>= 3` Concrete Tests & Grading Methods `[Claude docs]` `[General]`
Include at least three runnable test cases matching the spec:
1. **Happy path:** Realistic input verifying core task fidelity and desired tone/structure `[Claude docs]`.
2. **Edge / adversarial / guardrail case:** Missing or ambiguous input, long-context grounding, indirect prompt injection, refusal handling, or confirmation before an irreversible action `[Claude docs]` `[General]`.
3. **Format / schema / regression case:** Strict output/schema compliance (treating truncated outputs as failure) or regression coverage against a documented target-family gotcha `[Claude docs]` `[Vendor]`.

For each test specify **Input**, **Expected Pass Condition**, and **Grading Tier** `[Claude docs]`:
- Prefer **code-based** grading (exact match, schema validation, regex, unit/build checks) whenever checks are deterministic.
- Use **LLM-based** grading for nuanced judgment, with an explicit auto-fail rubric, discrete parseable `<result>` tags, and thinking enabled on the grader.
- Reserve **human** grading for subjective qualities that automated graders cannot score reliably.

### Step 7 — Version & Iterate (One Change Per Iteration) `[Claude docs]` `[General]`
- Start initial baselines at `v0.1.0` and bump semver (`v0.1.1`, `v0.2.0`) on each iteration `[General]`.
- Isolate **one change per iteration** (one prompt edit, one runtime setting change, or one schema change) so before/after eval deltas remain attributable `[Claude docs]` `[General]`.
- Record the hypothesis and before/after eval delta (or `not yet run — baseline` for `v0.1.0`) in `Changelog` `[General]`.

---

## 2. Required Output Contract (8 Sections, In Order) `[General]`

Deliver these eight top-level sections in order so every prompt is reproducible, auditable, and testable:

1. **`Target`** — Exact model ID/family, deployment surface, migration source (if any), and reference files loaded.
2. **`Spec`** — SMART success criteria, inputs/outputs, failure modes, guardrails, and latency/cost budget.
3. **`Prompt`** — Complete, copy-pasteable prompt blocks (`system`/`developer`/`user`/tools and JSON Schema if used) free of documented target anti-patterns.
4. **`Why`** — Technique-by-technique justification; each bullet carries exactly one tag: `[Claude docs]`, `[Vendor]`, or `[General]`.
5. **`Settings`** — Concrete runtime parameter table/JSON grounded in the loaded reference file(s), with silent parameters marked `unverified`.
6. **`Tests`** — At least 3 concrete tests (happy path, edge/adversarial/guardrail, format/schema/regression) with inputs, pass/fail conditions, and grading tier (`code-based`, `LLM-based`, or `human`).
7. **`Changelog`** — Version, single isolated change for this iteration, hypothesis/rationale, and before/after eval delta (or baseline status).
8. **`Limitations`** — Explicit inventory of untested `[General]` items, `unverified` settings, known target-model caveats, and harness-side responsibilities.

---

## 3. Minimal Output Skeleton (Copy-Paste Scaffold)

```markdown
## 1. Target
- Model: <exact model ID / family>
- Surface: <Messages API | Chat | Agent/Tools | Batch | Self-hosted>
- Migration from: <none | legacy model>
- Reference files loaded: <list of reference files read>

## 2. Spec
- Success criteria: <SMART metrics & thresholds>
- Inputs / outputs: <required inputs, untrusted boundaries, output shape>
- Failure modes & guardrails: <top failure modes + mitigations>
- Latency & cost budget: <TTFT, streaming/batch, effort/token ceiling>

## 3. Prompt
<System / Developer / User / Tool / Schema blocks>

## 4. Why
- <Technique> — <mechanism/reason> <[Claude docs] | [Vendor] | [General]>

## 5. Settings
<Parameter table / JSON; mark silent parameters `unverified`>

## 6. Tests
1. [Happy Path] Input: ... | Pass: ... | Grading: <code-based | LLM-based | human>
2. [Edge / Guardrail] Input: ... | Pass: ... | Grading: <...>
3. [Format / Regression] Input: ... | Pass: ... | Grading: <...>

## 7. Changelog
- `v0.1.0` — Change: Initial baseline | Hypothesis: ... | Eval delta: not yet run — baseline

## 8. Limitations
- Untested `[General]` syntheses: ...
- `unverified` settings: ...
- Model caveats & harness dependencies: ...
```
