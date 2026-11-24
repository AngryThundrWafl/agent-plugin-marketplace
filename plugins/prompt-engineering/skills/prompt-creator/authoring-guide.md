# Prompt Creator Authoring Guide

This guide defines the workflow and 8-section Output Contract for designing, tuning, porting, and versioning prompts using the `prompt-engineering` reference pack.

**Grounding rule:** Never invent techniques absent from the reference pack. Tag every cross-section synthesis `[General]`, cite `[Claude docs]` or `[Vendor]` where directly supported by the fetched docs or model cards, and mark any parameter absent from the target's source `unverified`.

---

## 1. Seven-Step Authoring Workflow

### Step 1 — Identify Target Model & Deployment Surface
Record the exact target context before opening model guides or drafting prompt text:
- **Exact model ID / family:**
  - *Claude:* `claude-fable-5-2` / `claude-mythos-5-2`, `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5`, or legacy Claude (`Fable 5.1`, `Fable 5`, `Opus 5`, `Opus 4.8`, `Sonnet 5`, `4.6`, `4.5`).
  - *Open-weight:* `DeepSeek-R1` (including the 6 distilled dense checkpoints), `DeepSeek-R1-0528` (and `DeepSeek-R1-0528-Qwen3-8B`), `Qwen3-235B-A22B` / `Qwen3-32B`, `Qwen3-235B-A22B-Instruct-2507`, `Qwen3-235B-A22B-Thinking-2507`, `openai/gpt-oss-120b` / `openai/gpt-oss-20b`, `Llama-3.3-70B-Instruct`, `Llama-4-Scout` / `Llama-4-Maverick`.
- **Deployment surface:**
  - Direct Messages API (`/v1/messages`)
  - Interactive chat UI
  - Autonomous / unattended agent + tool loop
  - Message Batches (e.g., thinking > ~32K tokens or 50% cost discount)
  - Self-hosted open-weight runtime (`vLLM`, `SGLang`, `Transformers`, `openai-harmony`)
- **Migration context (if porting):** Identify the source model so carried-over scaffolding—last-turn prefills, `budget_tokens`, sampling overrides, aggressive tool-trigger lines, `"do not think"` rules, or `"be conservative"` review bars—is audited and stripped before adding new instructions.

### Step 2 — Classify Model Family & Read Matching Reference Files BEFORE Drafting
Load only the files needed for the target under `../../reference/` before writing prompt text:
- **Claude targets:** Always read `../../reference/01-claude-core.md` + the exact model file (`11-fable-5-2.md`, `12-opus-5-5.md`, `13-sonnet-5-5.md`, `14-haiku-5-5.md`, or `15-legacy-models.md`, because model-specific behavior overrides general defaults) + relevant topic files:
  - `05-output-and-formatting.md` — prose/markdown steering, prefill deprecation & replacements, `output_config.format` JSON schemas, strict tool use, complexity caps.
  - `06-thinking-and-effort.md` — adaptive vs. `between_tools` thinking, `output_config.effort` calibration, `display` modes, prompt caching, prefix-check rules.
  - `07-tools-and-agents.md` — action vs. suggestion steering, parallel calls, multi-window state (`tests.json`, `progress.txt`), reversibility & financial records, subagent scoping, coding guardrails, frontend aesthetics.
  - `08-guardrails.md` — hallucination reduction, consistency, `claude-haiku-5-5` harmlessness/injection screens, indirect-injection isolation, prompt-leak mitigation.
  - `09-evals-and-latency.md` — SMART criteria, automated vs. LLM vs. human grading, TTFT, streaming, token trimming.
- **Open-weight targets:** Read `../../reference/02-open-weight.md` and `../../reference/03-overlap-and-porting.md`.
- **Templates & cross-model deltas:** Read `../../reference/04-templates-and-checklist.md` for condensed prompt skeletons and `../../reference/10-model-delta-matrix.md` when comparing or migrating across models.

### Step 3 — Write the Spec First
Lock down the task specification before drafting (`01-claude-core.md` §0, `09-evals-and-latency.md` §1):
1. **Success criteria (SMART):** Quantified thresholds across task fidelity, paraphrase consistency, tone/style, privacy/safety, and error severity (e.g., `F1 >= 0.85`, `< 0.1%` unsafe rate, `95%` latency target).
2. **Inputs & outputs:** Required user/system inputs, untrusted third-party inputs (must isolate in JSON-encoded `tool_result` blocks or random-ID `<pasted_content id="...">` tags), and exact output shape (plain prose, XML tags, or `output_config.format` JSON Schema).
3. **Failure modes:** Model-specific failure modes such as early stopping (`low`/`medium` effort), unrequested files/refactors, stale training-data answers, `reasoning_extraction` refusals, `max_tokens` truncation, repetition loops, or indirect prompt injection.
4. **Guardrails:** Human confirmation for destructive or externally visible actions, `claude-haiku-5-5` structured-output pre/post screens failing closed on `stop_reason: "refusal"`, verbatim `<quotes>` grounding for >20K-token documents, and explicit permission to admit uncertainty.
5. **Latency & cost budget:** Target TTFT, streaming (mandatory in Claude SDK when `max_tokens > 21,333`), Batch vs. real-time execution, and acceptable effort/token ceiling.

### Step 4 — Draft the Prompt & Explicitly Refuse Family Anti-Patterns
Construct the prompt using verified structures from the reference pack:
- **Claude core structure (`01-claude-core.md`, `05-output-and-formatting.md`, `07-tools-and-agents.md`):**
  - Write clear, literal instructions (colleague test); use numbered steps for order-sensitive flows and explain *why* constraints matter so edge cases generalize.
  - Use positive framing matched to the target output format (omit heavy markdown in prompts when seeking smooth prose).
  - Separate instructions, context, and 3–5 diverse `<example>` blocks with XML tags (`<instructions>`, `<context>`, `<examples>`, `<documents><document index="n">`).
  - Long context (>20K tokens): place documents at the top, query/instructions at the bottom (up to +30% quality), and extract verbatim `<quotes>` before analysis.
  - Model-specific steering: apply verbatim blocks only where the model file warrants them (e.g., Haiku 5.5 current-date grounding and JSON+tools ordering; Sonnet 5.5 / Haiku 5.5 coding verification and scope control; Opus 5.5 multi-app explore, time signals, and `<pasted_content id="...">`; Fable 5.2 finishing-work / ownership rules).

**Explicitly refuse these techniques known to error or degrade the target family:**
- **Claude 4.6+ / Mythos Preview — NO last-turn assistant prefill:** Returns `400`. Replace with `output_config.format`, system/XML formatting rules, or `user`-turn continuation (`05-output-and-formatting.md` §3).
- **Claude 4.7+ / 5.x / 5.5 — NO `budget_tokens` (`thinking.type: "enabled"`):** Returns `400` (deprecated on 4.6). Use `thinking.type: "adaptive"` + `output_config.effort` (`06-thinking-and-effort.md` §1).
- **Claude Fable 5–5.2, Mythos 5–5.2, Opus 5.5, Sonnet 5.5 — NO `thinking.type: "disabled"`:** Returns `400` (and `disabled` + `xhigh`/`max` returns `400` on Haiku 5.5 / Opus 5).
- **Claude 4.7+ & API `2026-10-21` — NO `temperature`/`top_p`/`top_k` overrides:** Returns `400`; also NO forced `tool_choice` (`"any"`/`"tool"`) on Fable 5.1/5.2, Mythos 5.1/5.2, Opus 5.5, or Sonnet 5.5 (`400`) (`06-thinking-and-effort.md` §6).
- **Claude safeguard & preserved-thinking rules:** Never ask for raw reasoning or `<thinking>` tags in visible text (`reasoning_extraction` refusal); never mutate `system`, `tools`, or earlier turns in preserved-thinking sessions (`400` prefix check); keep history append-only (`06-thinking-and-effort.md` §§3, 5).
- **Claude legacy scaffolding:** Strip `"CRITICAL: You MUST use this tool..."` (overtriggers on 4.6+), `"do not think"` rules (worsen XML leakage), `"include a verification step"` on Opus 5, `"think carefully"` in Opus 5.5 chat, `"treat that answer as done"` on Fable 5.2, and `"be conservative"` in code review (`01-claude-core.md` §9, `11-fable-5-2.md` §7, `15-legacy-models.md`).
- **Original DeepSeek-R1 — NO `system` prompt:** Put all instructions in `user`, prefill `<think>\n` at assistant start if empty-think bypasses occur, and sample `temperature` in `0.5`–`0.7` (`0.6` rec.). (DeepSeek-R1-0528 supports `system` and drops the `<think>\n` prefill requirement.) (`02-open-weight.md` §2)
- **Qwen3 thinking (`enable_thinking=True` / `Thinking-2507`) — NO greedy decoding:** `temp=0` causes severe degradation and repetition loops. Strip `<think>...</think>` from multi-turn history and do not enable static YaRN for `<=32,768` contexts (`02-open-weight.md` §3).
- **OpenAI `gpt-oss` (`120b`, `20b`) — NEVER omit Harmony format:** Always use `o200k_harmony` (`<|start|>{header}<|message|>{content}<|end|>`), keep the `system` identity line verbatim, put custom `# Instructions` / `# Tools` / `# Response Formats` in `developer`, keep `browser`/`python` in `system`, and never expose `analysis` CoT to users or keep `analysis` after completed `final` turns (`02-open-weight.md` §4).
- **Meta Llama 3.3 vs. Llama 4 — NEVER mix special tokens:** Keep Llama 3.3 (`<|start_header_id|>`, `<|eot_id|>`, `<|eom_id|>`) distinct from Llama 4 (`<|header_start|>`, `<|eot|>`, `<|image_start|>`) and never combine prose with zero-shot tool calls on Llama 4 (`02-open-weight.md` §5).

### Step 5 — Specify Settings Directly From Docs / Model Cards
Ground every runtime setting in the target's reference file; mark any parameter absent from the source **`unverified`** (never extrapolate across models):
- **Claude parameters (`05`, `06`, `09`, `11`–`14`):**
  - `thinking`: `{"type": "adaptive"}` (or `{"type": "between_tools"}` on Sonnet 5.5 at `effort <= high`); `display`: `"omitted"` (default on 4.7+), `"summarized"` (debugging/evals), or `"updates"` (beta `thinking-display-updates-2026-08-18`).
  - `output_config.effort`: `low` | `medium` (default on Opus 5.5 & Haiku 5.5) | `high` (default on Fable 5.2, Sonnet 5.5, and other effort models) | `xhigh` | `max`. Use beta `mid-conversation-output-config-2026-07-01` for mid-session changes without cache breaks.
  - `output_config.format`: `{"type": "json_schema", "schema": {...}}` with `additionalProperties: false` on all objects; max 20 `strict: true` tools, 24 total optional params, 16 unions; no `oneOf`/`not`/recursive refs/bounds; incompatible with Citations and prefill (`05-output-and-formatting.md` §§4–6).
  - `max_tokens`: Combined cap for thinking + text (up to `128,000` on 4.6–5.5; `64,000` on 4.5; `300,000` Batches beta). Always leave thinking headroom and enable streaming when `max_tokens > 21,333`.
  - `temperature` / `top_p` / `top_k`: Omit (rejected with `400` on 4.7+ and API `2026-10-21`; `unverified` where silent).
- **Open-weight parameters (`02-open-weight.md` §1):**
  - *DeepSeek-R1:* `temperature=0.6` (`0.5`–`0.7`), `top_p=0.95`, `max_tokens=32,768` (`128K` ctx); `top_k`/`min_p`/`presence_penalty` = `unverified`.
  - *DeepSeek-R1-0528:* `temperature=0.6`, `top_p=0.95`, `max_tokens=64K`; `top_k`/`min_p`/`presence_penalty`/native ctx = `unverified`.
  - *Qwen3:* Thinking `temperature=0.6`, `top_p=0.95`, `top_k=20`, `min_p=0`; Non-thinking / `Instruct-2507` `temperature=0.7`, `top_p=0.8`, `top_k=20`, `min_p=0`; optional `presence_penalty` `0`–`2`; native context `32,768` (`262,144` on `2507`).
  - *`gpt-oss` (`120b`/`20b`):* `Reasoning: low | medium | high` in `system` (default `medium`); `temperature`, `top_p`, `top_k`, `min_p`, `presence_penalty`, max context/output = `unverified`.
  - *Llama 3.3 / Llama 4:* `128K` ctx (3.3), `10M` ctx (4 Scout), `1M` ctx (4 Maverick); sampling and max output = `unverified`.

### Step 6 — Design >= 3 Concrete Tests & Grading Methods
Follow `09-evals-and-latency.md` §§2–3 and include at least three runnable test cases:
1. **Happy path:** Realistic input verifying core task fidelity and desired tone/structure.
2. **Edge / adversarial / guardrail case:** Missing/ambiguous input, >20K-token quote-grounding, indirect injection in `tool_result`, refusal handling (`stop_reason: "refusal"`), or confirmation before an irreversible step.
3. **Format / schema / regression case:** JSON schema compliance (`additionalProperties: false`, case-insensitive enum check, `stop_reason: "max_tokens"` treated as failure), or regression check against a family gotcha (e.g., no preamble, no unrequested files, no `<think>` retained in history).

For every test specify **Input**, **Expected Pass Condition**, and **Grading Method**:
- Prefer **code-based** grading (exact match, schema parse, regex, unit/build check) first.
- Use **LLM-based** grading for open-ended judgment, with explicit auto-fail rubric rules, discrete `<result>` tags (`correct`/`incorrect` or `1–5`), and grader thinking enabled (`09-evals-and-latency.md` §3).
- Reserve **human** grading for subjective checks automated graders cannot score reliably.

### Step 7 — Version & Iterate (One Change Per Iteration)
- Start initial drafts at `v0.1.0`; bump semver (`v0.1.1`, `v0.2.0`) on each iteration.
- Enforce **one isolated change per iteration** (one prompt edit, one `effort`/setting change, or one schema change) so before/after eval deltas stay attributable (`11-fable-5-2.md` §10).
- Record the **hypothesis** and **before/after eval delta** (or `not yet run — baseline` for `v0.1.0`) in `Changelog`.

---

## 2. Required Output Contract (8 Sections, In Order)

Every `prompt-creator` deliverable MUST emit these exact eight top-level sections in order:

1. **`Target`** — Exact model ID/family, deployment surface (`API`, `chat`, `agent`, `batch`, or `self-hosted`), migration source if applicable, and reference files read.
2. **`Spec`** — SMART success criteria, inputs/outputs, failure modes, guardrails, and latency/cost budget.
3. **`Prompt`** — Complete, copy-pasteable prompt blocks (`system`/`developer`/`user`/tools and `output_config.format` JSON Schema if used) with zero refused anti-patterns.
4. **`Why`** — Technique-by-technique justification; **every bullet carries exactly one tag: `[Claude docs]`, `[Vendor]`, or `[General]`**. Never invent unreferenced techniques; tag synthesis `[General]`.
5. **`Settings`** — Concrete parameter table/JSON grounded in docs or model cards; every parameter omitted by the source is explicitly marked **`unverified`**.
6. **`Tests`** — At least 3 concrete tests (happy path, edge/adversarial/guardrail, format/schema/regression) with inputs, pass/fail criteria, and grading tier (`code-based`, `LLM-based`, or `human`).
7. **`Changelog`** — Version, **single isolated change** for this iteration, hypothesis/rationale, and before/after eval delta (or baseline status).
8. **`Limitations`** — Explicit inventory of untested `[General]` items, `unverified` settings, known model caveats (`stop_reason: "refusal"` without fallback, enum casing drift, streaming/token caps), and harness-side responsibilities (permissions, append-only history, `max_tokens` retry).

---

## 3. Minimal Output Skeleton (Copy-Paste Scaffold)

```markdown
## 1. Target
- Model: <exact model ID / family>
- Surface: <Messages API | Chat | Agent/Tools | Batch | Self-hosted>
- Migration from: <none | legacy model>
- Reference files read: <list of ../../reference/*.md files>

## 2. Spec
- Success criteria: <SMART metrics & thresholds>
- Inputs / outputs: <required inputs, untrusted boundaries, output shape>
- Failure modes & guardrails: <top failure modes + mitigations>
- Latency & cost budget: <TTFT, streaming/batch, effort ceiling>

## 3. Prompt
<System / Developer / User / Tool / Schema blocks>

## 4. Why
- <Technique> — <mechanism/reason> [<Claude docs | Vendor | General>]

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
