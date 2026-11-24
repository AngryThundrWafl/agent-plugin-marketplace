# Skill Verification Checklist

Run every check below against the target skill directory before finalizing. Every item must **PASS** (or be explicitly **N/A** where optional fields/resources are unused). Mark failures with the exact file path and line number to fix.

## 1. Directory & File Structure (`agentskills.io` / Agent Plugins)

- [ ] **Exact filename:** Skill root contains a regular file named exactly `SKILL.md` (uppercase).
- [ ] **Skill placement:** Inside a plugin, the skill lives at immediate child path `skills/<skill-name>/SKILL.md` (not nested deeper under `skills/`).
- [ ] **One-level-deep references:** All skill-local references (`authoring-guide.md`, `checklist.md`, `references/*`, `scripts/*`, `assets/*`) are one level deep from `SKILL.md` with no deep reference chains.
- [ ] **Relative paths:** All internal file links use relative paths from the skill root (shared plugin references point to `../../reference/<file>.md`).

## 2. `SKILL.md` Frontmatter (`agentskills.io` Closed Schema)

- [ ] **YAML delimiters:** `SKILL.md` starts on line 1 with `---` and closes frontmatter with `---`.
- [ ] **Allowed keys only:** Frontmatter contains ONLY keys from the closed 6-field set: `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`.
- [ ] **`name` format & match:** Required non-empty string, `1–64` characters, lowercase alphanumeric and single hyphens only (`[a-z0-9-]` / Unicode lowercase alphanumeric + `-`), no leading or trailing `-`, no consecutive `--`, no dots `.`, and **exact match** to the parent directory name.
- [ ] **`description` format:** Required non-empty string, `1–1024` characters, **single line** `[General]`, contains **no `: ` (colon-space)** `[General]`, and contains **no `<` or `>`** `[General]`.
- [ ] **`description` content:** Clearly describes both **what** the skill does and **when** to use it, including specific trigger keywords.
- [ ] **`compatibility` (if present):** String of `1–500` characters stating genuine environment requirements.
- [ ] **`metadata` (if present):** Mapping of string keys to **string** values (numbers/versions quoted, e.g., `"1.0.0"`).
- [ ] **`license` & `allowed-tools` (if present):** Strings (`allowed-tools` space-separated).

## 3. Progressive Disclosure & Token Budget

- [ ] **Line budget:** `SKILL.md` is strictly under `500` lines (`agentskills.io`), and thin trigger/router `SKILL.md` files (paired with `authoring-guide.md` + `checklist.md`) are under `120` lines `[General]`.
- [ ] **On-demand loading:** `SKILL.md` directs the agent to load `authoring-guide.md`, `checklist.md`, and relevant `../../reference/*.md` files on demand rather than inlining them.
- [ ] **No duplicated model knowledge:** Neither `SKILL.md` nor runtime guides duplicate model-card tables, sampling values, or API rules—they link to `../../reference/*.md` instead `[General]`.

## 4. Prompting Hygiene & Provenance

- [ ] **Clear & direct:** Instructions use explicit, sequential steps where order matters and pass the "colleague test" `[Claude docs]`.
- [ ] **Positive framing & motivation:** Rules emphasize what to do and explain **why** constraints matter `[Claude docs]`.
- [ ] **Neutral tool/trigger phrasing:** Avoids legacy `"CRITICAL: You MUST..."` overtriggering language (`"Use [tool] when..."` instead) `[Claude docs]`.
- [ ] **Confidence tags & honesty:** Prompting and behavioral claims in skill guides carry `[Claude docs]`, `[Vendor]`, or `[General]` tags, and unsupported details are marked `unverified` instead of guessed `[General]`.

## 5. Validation & Eval Readiness

- [ ] **Schema & repo validation:** `skills-ref validate ./<skill-dir>` (if installed) and `npm run build && npm test && npm run validate` pass with zero errors.
- [ ] **Eval & iteration plan:** Skill defines measurable success criteria, trigger/non-trigger test cases, and a one-change-per-iteration refinement loop `[Claude docs]` / `[General]`.
- [ ] **Self-check (for `skill-creator`):** Applying sections 1–5 to `plugins/prompt-engineering/skills/skill-creator/` yields **PASS** on every item.

## Self-Check Record (`skill-creator`)

- `SKILL.md`: 30 lines (< 120), frontmatter keys `name` (`skill-creator` == directory), `description`, and `metadata.version` (`"1.0.0"`), single-line `description` (277 chars, no `: `, no `<`/`>`), progressive-disclosure loading order only. **PASS**
- `authoring-guide.md`: 112 lines, covers steps 1–8, `../../reference/` routing table, `[Claude docs]`/`[Vendor]`/`[General]`/`unverified` tags, no duplicated model tables. **PASS**
- `checklist.md`: 47 lines, all relative links verified, repo `npm run build && npm test && npm run validate` passes (`0` errors, `0` warnings). **PASS**
