---
name: Claude evals and latency reference
source:
  - https://platform.claude.com/docs/en/test-and-evaluate/develop-tests
  - https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-latency
fetched: 2026-11-24
covers: Success criteria, evaluation design, code/human/LLM grading, latency metrics, model/effort trade-offs, token trimming, and streaming
---

# Claude Evals and Latency

Tags: `[Claude docs]` = from the fetched pages above. `[General]` = synthesis, must be tested. `unverified` = page silent.
Condensed digest, not official text. Optimization order [Claude docs]: first build a prompt that hits target quality without latency/model constraints, then optimize latency while holding quality above threshold.

## 1. Define success criteria [Claude docs]

Criteria should be **Specific, Measurable, Achievable, Relevant**:
- Quantify even "hazy" goals like safety (e.g., `< 0.1%` toxicity across `10,000` trials rather than `"safe outputs"`).
- Evaluate **multidimensionally** across quality, safety, error severity, latency, and cost (e.g., `F1 >= 0.85` on 10k held-out items, `99.5%` non-toxic, `90%` of errors minor inconvenience vs. egregious, `95%` response time `< 200ms`).
- Common success-criteria axes [Claude docs]:
  - **Task fidelity** (including rare/challenging edge inputs)
  - **Consistency** (semantic similarity across repeated or paraphrased inputs)
  - **Relevance & coherence**
  - **Tone & style** (audience fit)
  - **Privacy preservation** (handling PII/PHI)
  - **Context utilization** (multi-turn recall and grounding)
  - **Latency** and **Price** (per-call API cost, model size, call frequency)
- Measurement toolbox: quantitative metrics (`F1`, `BLEU`, perplexity, accuracy, precision, recall, response time ms, uptime %), A/B tests, implicit user task-completion rates, edge-case error rates, Likert scales (1–5), and expert rubrics.

## 2. Build evaluations [Claude docs]

Three eval design principles [Claude docs]:
1. **Be task-specific:** Mirror real-world input distributions and include edge cases:
   - Missing or irrelevant input data
   - Overly long inputs or user messages
   - Poor, harmful, or off-topic chat inputs
   - Ambiguous cases where even humans struggle to reach consensus
2. **Automate when possible:** Structure tasks for multiple-choice, exact/string match, code-graded, or LLM-graded checks.
3. **Prioritize volume over quality:** More test cases with slightly noisier automated grading outperform tiny hand-graded sets. Use Claude to synthesize additional test cases from a small baseline seed and to brainstorm eval methods.

Metric-to-task pairings illustrated in the docs [Claude docs]:
- **Exact match** (normalized whitespace/case) → categorical tasks like sentiment classification (`1,000` labeled items).
- **Cosine similarity** (e.g., Sentence-BERT embeddings) → response consistency across paraphrased FAQ queries (`50` paraphrase groups).
- **ROUGE-L** (longest common subsequence vs. reference summary) → summarization relevance/coherence (`200` articles).
- **LLM-based Likert scale (1–5)** → subjective tone/empathy/patience (`100` support inquiries).
- **LLM-based binary classification** → subtle context-dependent checks like PHI leakage (`500` simulated patient queries).
- **LLM-based ordinal scale (1–5)** → multi-turn context utilization (`100` multi-turn histories).

## 3. Grade evaluations [Claude docs]

Choose the fastest, most reliable, most scalable grading tier that fits the criterion [Claude docs]:
1. **Code-based grading:** Fastest, deterministic, maximally scalable (`output == golden_answer`, `key_phrase in output`), but lacks nuance for open-ended judgment.
2. **LLM-based grading:** Fast, flexible, scalable for complex judgment; validate grader reliability first, then scale.
3. **Human grading:** Highest flexibility/quality, but slow and expensive — avoid whenever automated grading works.

LLM-based grading tips [Claude docs]:
- **Write detailed, clear rubrics:** Include explicit auto-fail triggers (e.g., missing required phrase in sentence 1 → `'incorrect'`); use multiple rubrics when one criterion has several facets.
- **Force empirical/discrete outputs:** Output only `'correct'`/`'incorrect'` or `1–5` inside parseable tags (e.g., `<result>correct</result>`); avoid purely qualitative grades.
- **Enable thinking on the grader:** Turn thinking on for the grader model so it reasons before emitting the score; improves accuracy on complex judgment tasks.

## 4. Measure latency [Claude docs]

- **Baseline latency:** Total elapsed time from sending the prompt to receiving the full generated output (excluding per-token streaming UX effects).
- **Time to first token (TTFT):** Elapsed time until the first generated token arrives; the primary responsiveness metric when streaming.

## 5. Reduce latency [Claude docs]

### A. Choose the right model and effort
- For speed-critical workloads, **`claude-haiku-5-5`** delivers the fastest response times while keeping high intelligence.
- **`output_config.effort` is its main speed/cost knob:** `output_config: {"effort": "low"}` is cheapest and fastest. Leave headroom in `max_tokens` for thinking even at `low` (API example sets `max_tokens: 1024` with `anthropic-version: 2026-10-21`).

### B. Optimize prompt and output length
- **Be clear and concise:** Trim redundant prompt text without removing domain context Claude needs to infer intent accurately.
- **Ask for shorter replies:** Instruct Claude to reduce verbosity. Request **sentence or paragraph count limits** rather than exact word counts, because LLMs track tokens rather than words.
- **Set `max_tokens` carefully:** Hard-caps output length, but truncates mid-word/mid-sentence when reached — best for multiple-choice or short answers placed right at the start.

### C. Stream responses
- Enable streaming on the Messages API to emit SSE deltas (`text`, `tool_use`, extended thinking) immediately, improving perceived latency (TTFT) and allowing parallel UI updates or downstream processing.

## 6. Cross-page synthesis & `unverified`

- [General] Gate every latency change (smaller model, lower `effort`, tighter `max_tokens`, prompt trimming) behind your multidimensional eval suite so TTFT improvements do not silently drop task fidelity or safety below threshold.
- [General] When enabling thinking on an LLM grader, parse only `text` blocks for `<result>` tags and size `max_tokens` for both thinking and the grade tag.
- [General] Prefer automated grading (code-based first, LLM-based with explicit rubric and thinking second) over human grading, and scale dataset size with Claude-synthesized edge cases.
- `unverified`: Specific TTFT or tokens-per-second benchmarks across Claude 5.x models, prompt-caching speedups, and Message Batches API latency are not covered on these two pages.
