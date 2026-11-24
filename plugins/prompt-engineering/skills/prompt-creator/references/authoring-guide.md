# Prompt Creator Authoring Guide

Use this leaf procedure to design, tune, migrate, and version prompts using the model and topic reference file(s) already loaded from `SKILL.md`. Ground model-specific rules, sampling presets, and API limits in those loaded files rather than memory.

**Provenance tags** (used on claims about model behavior, and on every bullet in the deliverable's `Why` section):
- `[Claude docs]` — directly supported by the loaded Claude Platform reference file(s).
- `[Vendor]` — directly supported by the loaded vendor reference file(s) (Google Gemini, DeepSeek, Qwen, OpenAI, Meta).
- `[General]` — cross-section or cross-family synthesis requiring empirical verification on target evals.
- `unverified` — parameter or behavior omitted by the target's reference file; keep it explicit instead of extrapolating across models.

---

## 1. Seven-Step Workflow

### Step 1 — Identify Target Model & Deployment Surface
Record the exact target context before drafting so every downstream rule stays model-scoped:
- **Exact model ID / family:** The specific Claude model (`Fable 5.2` / `Mythos 5.2`, `Opus 5.5`, `Sonnet 5.5`, `Haiku 5.5`, or legacy Claude), Google Gemini model (`gemini-4-carbon`, `gemini-4-neon`, `gemini-4-hydrogen`, `gemini-4-argon`, or `gemini-3.8-flash`), or open-weight checkpoint (`DeepSeek-R1` / `R1-0528`, `Qwen3` / `2507`, `gpt-oss`, `Llama 3.3` / `Llama 4`).
- **Deployment surface:** Direct Messages API, Gemini `GenerateContent` / Interactions API, interactive chat UI, autonomous agent/tool loop, Message Batches, or self-hosted open-weight runtime (`vLLM`, `SGLang`, `Transformers`, `openai-harmony`).
- **Migration source (if porting):** Name the source model so obsolete scaffolding (deprecated API parameters, incompatible chat tokens, aggressive tool-trigger wording, legacy verification nudges) is audited and pruned before adding new instructions `[Claude docs]`.

### Step 2 — Apply Loaded Reference Precedence
- Follow the **model-specific file first** whenever it overrides general core or topic guidance (default `effort`, supported `thinking` types, prompt-format envelopes, known refusal behaviors) `[Claude docs]`.
- Ground cross-family porting differences in the loaded porting/delta reference when moving prompts across model families.

### Step 3 — Write the Spec First
Lock down the specification before drafting prompt text so instructions target concrete failure modes `[Claude docs]`:
1. **Success criteria (SMART):** Quantified thresholds across task fidelity, paraphrase consistency, tone/style, privacy/safety, and error severity.
2. **Inputs & outputs:** Required inputs, untrusted third-party data boundaries (isolated per the target's wire container), and exact output shape (prose, structured tags, or constrained JSON Schema).
3. **Failure modes:** Target-specific risks from the loaded model file (early stopping, unrequested edits, stale facts, refusal triggers, truncation, repetition loops, indirect injection).
4. **Guardrails:** Confirmation gates for irreversible or externally visible actions, fail-closed safety screening, verbatim grounding for long inputs, and explicit permission to admit uncertainty.
5. **Latency & cost budget:** Target TTFT, streaming or batching needs, and acceptable reasoning/token ceiling.

### Step 4 — Draft the Prompt & Refuse Documented Anti-Patterns
- Write clear, literal instructions that pass the colleague test, use numbered steps when order matters, use positive framing aligned to the desired output format, and explain **why** key constraints matter `[Claude docs]`.
- Structure instructions, context, untrusted inputs, and examples using the target family's native roles and delimiters (XML tags and `tool_result` on Claude; `system_instruction` + XML/Markdown on Gemini; native role/token envelopes on open-weight families) `[Claude docs]` `[Vendor]`.
- For long context, place source material above instructions and require verbatim quote or citation grounding before synthesis `[Claude docs]`.
- **Refuse target anti-patterns:** Exclude every technique the loaded files document as causing API errors, quality collapse, repetition loops, token mixing, or safeguard refusals on the target, replacing each with the documented alternative.
- **Prune legacy scaffolding on migrations:** Remove carried-over workarounds that degrade the target model before layering on new rules `[Claude docs]`.

### Step 5 — Specify Runtime Settings From Loaded References
Copy every concrete setting (thinking/reasoning control, `effort`, structured-output schema, `max_tokens`, streaming, sampling, context scaling) directly from the loaded target file(s):
- Omit parameters rejected by the target API or model version, and say why in `Settings` or `Why`.
- Mark every parameter absent from the target's reference file **`unverified`** so operators benchmark it instead of inheriting another model's defaults.
- Keep harness-enforced constraints (streaming thresholds, append-only history, thinking-block retention/stripping, schema limits, refusal handling, timeouts) explicit alongside model settings.

### Step 6 — Design At Least 3 Tests With Grading Methods
1. **Happy path:** Realistic input verifying core fidelity and tone/structure.
2. **Edge / adversarial / guardrail:** Missing or ambiguous input, long-context grounding, indirect prompt injection, refusal handling, or confirmation before an irreversible action.
3. **Format / schema / regression:** Strict output/schema compliance (truncation counts as failure) or regression coverage for a documented target-family gotcha.

Give each test an **Input**, **Pass Condition**, and **Grading Tier** `[Claude docs]`: prefer **code-based** grading for deterministic checks; use **LLM-based** grading for nuanced judgment with an auto-fail rubric, discrete `<result>` tags, and thinking enabled on the grader; reserve **human** grading for what automation cannot score reliably.

### Step 7 — Version & Iterate (One Change Per Iteration)
- Start baselines at `v0.1.0` and bump semver on each iteration.
- Isolate **one change per iteration** (one prompt edit, setting, or schema change) so eval deltas stay attributable `[Claude docs]`.
- Record the hypothesis and before/after eval delta (or `not yet run — baseline`) in `Changelog`.

---

## 2. Output Contract (8 Sections, In Order)

Deliver exactly these sections so every prompt is reproducible, auditable, and testable:

```markdown
## 1. Target
- Model: <exact model ID / family>
- Surface: <Messages API | Chat | Agent/Tools | Batch | Self-hosted>
- Migration from: <none | source model>
- Reference files loaded: <list>

## 2. Spec
- Success criteria: <SMART metrics & thresholds>
- Inputs / outputs: <required inputs, untrusted boundaries, output shape>
- Failure modes & guardrails: <top failure modes + mitigations>
- Latency & cost budget: <TTFT, streaming/batch, effort/token ceiling>

## 3. Prompt
<Complete, copy-pasteable system / developer / user / tool / schema blocks>

## 4. Why
- <Technique> — <mechanism/reason> <exactly one of [Claude docs] | [Vendor] | [General]>

## 5. Settings
<Parameter table / JSON grounded in loaded files; silent parameters marked `unverified`>

## 6. Tests
1. [Happy Path] Input: ... | Pass: ... | Grading: <code-based | LLM-based | human>
2. [Edge / Guardrail] Input: ... | Pass: ... | Grading: <...>
3. [Format / Regression] Input: ... | Pass: ... | Grading: <...>

## 7. Changelog
- `v0.1.0` — Change: Initial baseline | Hypothesis: ... | Eval delta: not yet run — baseline

## 8. Limitations
- Untested `[General]` syntheses: ...
- `unverified` settings: ...
- Model caveats & harness-side responsibilities: ...
```
