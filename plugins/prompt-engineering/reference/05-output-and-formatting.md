---
name: Claude output formatting and structured outputs reference
source:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  - https://platform.claude.com/docs/en/build-with-claude/structured-outputs
fetched: 2026-11-24
covers: Communication style, verbosity, markdown/prose steering, LaTeX opt-out, document creation, prefill deprecation & migration, JSON structured outputs (output_config.format), strict tool use, schema limitations, grammar caching, SDK helpers, feature compatibility
---

# Claude Output Formatting & Structured Outputs

Tags: `[Claude docs]` = directly from the fetched pages above. `[General]` = cross-section synthesis, must be tested. `unverified` = source pages are silent.
Scope note: Model-specific defaults (verbosity, progress updates, and structured-output caveats) override general rules when both apply. `[Claude docs]`

Contents: 1 Verbosity · 2 Format & Markdown · 3 Prefill deprecation · 4 Structured outputs · 5 Schema limitations · 6 Feature compatibility · 7 Gaps

## 1. Communication Style & Verbosity [Claude docs]

Current Claude models default to a direct, grounded, conversational, and concise style—often skipping post-tool summaries to move straight to the next action.
- **To require post-tool summaries:** `"After completing a task that involves tool use, provide a quick summary of the work you've done."`
- **Model exceptions:**
  - **Claude Opus 5:** Default visible replies are longer; changing `output_config.effort` does **not** reliably shorten visible responses—prompt explicitly for conciseness instead.
  - **Claude Fable 5.1:** Writes fewer user-facing progress updates between tool calls; request progress text explicitly and remove "keep updates brief" constraints.
  - **Claude Fable 5.2:** Use `display: "updates"` or turn-scoped harness reminders for mid-turn updates; changing `effort` barely changes visible reply length.

## 2. Steering Output Format & Markdown [Claude docs]

1. **Positive framing:** Specify the target format (`"Your response should be composed of smoothly flowing prose paragraphs."`) rather than negative bans (`"Do not use markdown"`).
2. **XML format indicators:** Wrap target sections in named format tags (e.g., `"Write the prose sections of your response in <smoothly_flowing_prose_paragraphs> tags."`).
3. **Match prompt style to target style:** Removing markdown from your prompt lowers markdown density in Claude's output.
4. **Explicit prose-over-bullets block:** Use `<avoid_excessive_markdown_and_bullet_points>` (reserve markdown for `` `inline code` ``, fenced code blocks, and `##`/`###`; avoid `**bold**` and `*italics*`; forbid lists unless items are truly discrete or explicitly requested).
   - **Caveat (Fable 5.1):** Fable 5.1 already formats sparingly; large anti-markdown blocks can suppress needed structure—remove or replace with a shorter rule.
5. **LaTeX opt-out:** Current models default to LaTeX for math. To force plain text: `"Format your response in plain text only. Do not use LaTeX, MathJax, or any markup notation such as \( \), $, or \frac{}{}. Write all math expressions using standard text characters (e.g., "/" for division, "*" for multiplication, and "^" for exponents)."`
6. **Document / presentation creation:** Ask explicitly for `"thoughtful design elements, visual hierarchy, and engaging animations where appropriate"`; modern models usually produce usable visual output on the first pass.

## 3. Prefilled Assistant Responses: Deprecation & Migration [Claude docs]

Starting with **Claude 4.6** models and **Claude Mythos Preview**, **prefilling the last assistant turn is not supported and returns a `400` error** (earlier assistant turns in history remain valid; prefill still works on pre-4.6 models when thinking is off).

| Legacy prefill use case | Modern replacement |
| --- | --- |
| Force JSON / YAML / classification | Use `output_config.format` (`type: "json_schema"`) or tools with an `enum` field; or prompt schema directly (with retries). |
| Skip preamble (`Here is the summary:\n`) | System prompt: `"Respond directly without preamble. Do not start with phrases like 'Here is...', 'Based on...', etc."`, XML output tags, structured outputs, or tool calls; strip rare slips in post-processing. |
| Steer around over-refusals | Clear prompting in the `user` message (refusal calibration is much improved). |
| Resume / continue interrupted text | Put continuation in `user` turn with the trailing text: `"Your previous response was interrupted and ended with `[previous_response]`. Continue from where you left off."`, or retry if UX allows. |
| Context hydration / periodic reminders | Inject reminders into `user` turns, hydrate via tools on turn heuristics, or use context compaction. |

## 4. Structured Outputs (`output_config.format` & Strict Tool Use) [Claude docs]

Structured outputs use grammar-constrained decoding so responses never fail JSON parsing, miss required fields, or violate field types. Available on **all models** documented in Anthropic's structured-outputs guide (Claude 4.5 through 5.5 and Fable/Mythos 5–5.2) via `/v1/messages` (not available in Managed Agents).

- **JSON outputs (`output_config.format`):** Constrains Claude's `text` block output:
  ```json
  "output_config": {
    "format": {
      "type": "json_schema",
      "schema": {
        "type": "object",
        "properties": { "name": { "type": "string" } },
        "required": ["name"],
        "additionalProperties": false
      }
    }
  }
  ```
- **Strict tool use (`strict: true` on tool definition):** Guarantees tool name and `input_schema` compliance. Can be combined with `output_config.format` in the same request so Claude calls tools reliably and returns structured final JSON.
- **Beta migration:** Legacy top-level `output_format` is **deprecated** (requires beta header `structured-outputs-2025-11-13` or returns `400`). In Python SDK v1.0+, passing a dict as `output_format={...}` raises `TypeError`—use `output_config={"format": ...}` or `client.messages.parse(output_format=PydanticModel)`.

### SDK Helpers & Schema Transformation [Claude docs]
- **Python:** `client.messages.parse(..., output_format=MyPydanticModel)` → `response.parsed_output`; `transform_schema()` converts Pydantic or raw JSON schemas. Avoid raw `dict` fields (become `{}`); use nested models or key/value arrays.
- **TypeScript:** `client.messages.parse({ output_config: { format: zodOutputFormat(ZodSchema) } })` or `jsonSchemaOutputFormat(schema)` (transforms by default unless `{ transform: false }`). Avoid `z.record()` when keys are known.
- **C# / Go / Java / PHP / Ruby:**
  - C#: `client.Messages.Create<T>(...)` + `.Parsed()`.
  - Go: `client.Beta.Messages.New` with `BetaJSONOutputFormatParam{Schema: &struct}` (or `BetaJSONSchemaOutputFormat()`), or `client.Messages.New` with `JSONOutputFormatParam`.
  - Java: `.outputConfig(MyClass.class)` (top-level or `static` inner class; validates locally against API subset instead of transforming—disable via `JsonSchemaLocalValidation.NO` if SDK lags API; Jackson/Swagger annotations supported; all class fields marked required).
  - PHP: `StructuredOutputModel` + `StructuredOutputModelTrait` + `#[Constrained]` attribute.
  - Ruby: `Anthropic::BaseModel` (`required`/`optional`, `ArrayOf`, `EnumOf`, `UnionOf`) → `message.parsed_output`.
- **How SDK transformation works:** Strips unsupported constraints (`minimum`, `maximum`, `minLength`, `maxLength`), appends them to the field `description` (e.g. `{minimum: 100}`), forces `additionalProperties: false` on all objects, filters string `format` to supported values, and validates full constraints client-side on parse.

## 5. JSON Schema Limitations, Ordering, Edge Cases & Complexity [Claude docs]

- **Supported:** `object`, `array`, `string`, `integer`, `number`, `boolean`, `null`; `enum`/`const` (primitives); `anyOf`, `allOf` (non-conflicting); `$ref`, `$defs`, `definitions`; `default`; `required`; `additionalProperties: false` (mandatory for objects); `minItems` of `0` or `1` only; string formats `date-time`, `time`, `date`, `duration`, `email`, `hostname`, `uri`, `ipv4`, `ipv6`, `uuid`; basic regex (`^...$`, `*`, `+`, `?`, simple `{n,m}`, `[]`, `.`, `\d`, `\w`, `\s`, `(...)`).
- **Not supported (returns `400`):** Recursive schemas; `oneOf` (use `anyOf`); `not`; `anyOf` alongside `type`/`properties` on the same object; `allOf` combining conflicting types or ≥2 schemas where one directly has `$ref`/`anyOf`/`allOf`; complex types in `enum`; external `$ref`; numeric (`minimum`, `maximum`, `multipleOf`) or string (`minLength`, `maxLength`) bounds; `minItems` > 1 or `maxItems`; `additionalProperties` ≠ `false`; regex backreferences (`\1`), lookarounds (`(?=...)`), `\b`/`\B`, large `{n,m}` ranges.
- **Arbitrary keys:** Use `type: "array"` of `{ "key": string, "value": string }` objects because `additionalProperties` must be `false` (empty `properties` lets Claude return only `{}`).
- **Property ordering:** Output preserves schema order for **required properties first**, then **optional properties**. Mark all fields `required` if exact output order matters.
- **When output can still fail schema validation:**
  1. `stop_reason: "refusal"` (200 OK, billed; refusal text overrides schema—do **not** ask for step-by-step thinking/reasoning in a schema field or it may trigger `reasoning_extraction`; ask for a short explanation instead).
  2. `stop_reason: "max_tokens"` (truncated JSON—retry with higher `max_tokens`).
  3. **Enum casing:** Grammar does not strictly lock letter casing on `enum`/`const` strings (e.g., `"Conversation topic 3"` → `"Conversation Topic 3"`). Compare case-insensitively; avoid enums differing only by case.
- **Grammar compilation, caching & costs:**
  - First request with a new schema incurs grammar compilation latency; cached **24 hours** from last use.
  - Changing schema structure or tool set invalidates grammar cache (`name`/`description` edits do not).
  - API injects a format system prompt (slightly higher input tokens); changing `output_config.format` invalidates **prompt caching** for that thread.
  - Grammar applies only to Claude's direct output—not `thinking` blocks or `tool_use`/`tool_result`.
- **Complexity limits:** Max **20** `strict: true` tools per request; max **24** total optional parameters across all strict tools + output schema; max **16** union (`anyOf` / type-array) parameters across all strict schemas; internal grammar-size cap (`"Schema is too complex for compilation"` 400) and **180s** compilation timeout. Mitigate by marking only critical tools `strict`, making fields `required`, flattening nesting, or splitting across requests/subagents.

## 6. Feature Compatibility & Data Handling [Claude docs]

- **Compatible:** Batch processing (50% discount), Token counting (no compilation), Streaming, combined `output_config.format` + `strict: true`, Thinking (`thinking` blocks stay unconstrained).
- **Incompatible (`400` error):** **Citations** (interleaved citation blocks conflict with JSON schema) and **message prefilling**.
- **ZDR / HIPAA:** Qualified ZDR (prompts/outputs not stored; JSON schema cached ≤24h). HIPAA eligible, **but never put PHI in schema definitions** (property names, `enum`, `const`, `pattern` regexes) because cached schemas lack message-content PHI protections. [Claude docs]

## 7. Gaps / `unverified`

- YAML/TOML/XML grammar-constrained decoding: only JSON Schema (`type: "json_schema"`) is documented; other constrained grammars are `unverified`.
