# Skill Verification Checklist

Run every check below against the target skill directory (and any referenced plugin docs) before finalizing. Mark each item **PASS**, **FAIL** (with exact file path and line number), or **N/A** where optional resources are unused.

## 1. Directory & File Structure (`agentskills.io` / Agent Plugins)

- [ ] **Exact filename:** Skill root contains a regular file named exactly `SKILL.md` (uppercase).
- [ ] **Skill placement:** Inside a plugin, the skill lives at immediate child path `skills/<skill-name>/SKILL.md` (never nested deeper under `skills/`).
- [ ] **One-level-deep flat references:** All skill-local files (`references/*`, `scripts/*`, `assets/*`) and shared plugin references are linked directly from `SKILL.md` (1 hop). Companion guides and referenced docs act as self-contained leaf nodes with zero multi-hop chains or circular back-links `[General]`.
- [ ] **Clean relative paths:** All internal links use relative paths from the skill root; zero broken links, zero repo-root paths, and zero uncommitted local scratch/cache paths (e.g., `.cache/`) appear in shipped docs `[General]`.

## 2. `SKILL.md` Frontmatter (`agentskills.io` Closed Schema)

- [ ] **YAML delimiters:** `SKILL.md` starts on line 1 with `---` and closes frontmatter with `---`.
- [ ] **Allowed keys only:** Frontmatter contains only keys from the closed 6-field set: `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`.
- [ ] **`name` format & match:** Required non-empty string, `1–64` characters, lowercase alphanumeric and single hyphens only (`[a-z0-9-]` / Unicode lowercase alphanumeric + `-`), no leading or trailing `-`, no consecutive `--`, no dots `.`, and exact match to the parent directory name.
- [ ] **`description` format:** Required non-empty string, `1–1024` characters, single line `[General]`, contains no `: ` (colon-space), no `<` or `>`, and no internal relative file paths `[General]`.
- [ ] **`description` content:** Written in third person and clearly describes both **what** the skill does and **when** to use it, including specific trigger keywords users would say `[Claude docs]`.
- [ ] **`compatibility` (if present):** String of `1–500` characters stating genuine environment requirements.
- [ ] **`metadata` (if present):** Mapping of string keys to **string** values (quote versions, e.g., `"1.1.0"`).
- [ ] **`license` & `allowed-tools` (if present):** Strings (`allowed-tools` space-separated).

## 3. Progressive Disclosure & Token Budget

- [ ] **Line budget:** `SKILL.md` is strictly under `500` lines (`agentskills.io`), and router `SKILL.md` files paired with `references/` guides stay under `120` lines `[General]`.
- [ ] **Task-scoped on-demand loading:** `SKILL.md` directs the agent to load each companion guide, checklist, and shared reference file only when the active task needs it—avoiding mandatory upfront loading of unused guides `[General]`.
- [ ] **Single-topic leaf docs & no duplicated model knowledge:** Neither `SKILL.md` nor runtime guides duplicate model-card tables, sampling values, API error matrices, or other guides' checklists; large multi-family reference files are split by model/topic so unused families consume zero context `[General]`.
- [ ] **TOC for long files:** Every reference or guide file longer than 100 lines opens with a table of contents `[Claude docs]`.

## 4. Prompting Hygiene & Provenance

- [ ] **Clear & direct:** Instructions use explicit, numbered steps where order matters, pass the "colleague test", and avoid redundant boilerplate `[Claude docs]`.
- [ ] **Positive framing & motivation:** Rules emphasize what to do and explain **why** constraints matter so edge cases generalize cleanly `[Claude docs]`.
- [ ] **Neutral tool/trigger phrasing:** Uses calm, condition-based triggers (`"Use [tool] when..."`) instead of aggressive legacy phrasing (`"CRITICAL: You MUST..."`, all-caps prohibitions, or `"Mandatory..."`) to avoid overtriggering `[Claude docs]`.
- [ ] **Freedom matches fragility:** Judgment-heavy steps use prose guidance, patterned steps use templates, and fragile or destructive operations use exact commands or scripts `[Claude docs]`.
- [ ] **Confidence tags & honesty (when the skill makes model-behavior claims):** Prompting and behavioral claims carry `[Claude docs]`, `[Vendor]`, or `[General]` tags, undocumented details are marked `unverified` instead of guessed, and procedural steps stay untagged; mark `N/A` for skills without such claims `[General]`.
- [ ] **Separation of concerns:** Runtime task checklists contain only deliverable verification gates—skill-maintenance self-checks and hardcoded historical logs live outside runtime checklists `[General]`.

## 5. Validation, Versioning & Eval Readiness

- [ ] **Schema & repo validation:** `skills-ref validate ./<skill-dir>` (if installed), the host marketplace repository's validation suite when applicable (e.g., `npm run build && npm test && npm run validate`), and `agy plugin validate ./plugins/<plugin>` (without `--strict`, if installed) pass with zero errors.
- [ ] **Version synchronization:** On content changes to a shipped plugin skill, `version` is bumped consistently across `plugin.json`, `.antigravity-plugin/plugin.json` (if present), `.claude-plugin/marketplace.json`, and `SKILL.md` `metadata.version` `[General]`.
- [ ] **Eval & iteration plan:** Authoring spec or companion eval suite (kept outside lean runtime `SKILL.md`) defines measurable success criteria, trigger/non-trigger test cases, and a one-change-per-iteration refinement loop; mark `N/A` when auditing packaged skills without an attached eval harness `[Claude docs]` `[General]`.
