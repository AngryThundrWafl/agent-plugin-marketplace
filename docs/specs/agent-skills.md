# Agent Skills Specification

- **Sources:**
  - https://agentskills.io/specification (upstream `agentskills/agentskills` `docs/specification.mdx`)
  - https://github.com/agentskills/agentskills.git (reference library `skills-ref/`)
- **Retrieved:** 2026-11-24
- **Spec version:** Unversioned live specification (`agentskills/agentskills` main)
- **Reference validator:** Upstream `skills-ref/src/skills_ref/validator.py` (Python + `strictyaml`; README marks it "demonstration purposes only, not meant for production"; TypeScript validator implements its exact rule set directly).

## Review Claims (5)

1. A skill is a directory containing at minimum a `SKILL.md` file with YAML frontmatter delimited by `---` followed by Markdown instructions (`specification.mdx`).
2. Frontmatter `name` is REQUIRED, MUST be 1–64 characters, lowercase alphanumeric plus hyphens (`-`), MUST NOT start or end with `-`, MUST NOT contain `--`, and MUST match the parent directory name (`specification.mdx`, `validator.py`).
3. Frontmatter `description` is REQUIRED and MUST be 1–1024 non-empty characters describing what the skill does and when to use it (`specification.mdx`, `validator.py`).
4. Only six frontmatter fields are allowed by the spec and `skills-ref`: `name`, `description`, `license`, `compatibility` (1–500 chars if provided), `metadata` (string-to-string map), and `allowed-tools` (space-separated string, experimental) (`specification.mdx`, `validator.py`).
5. Optional conventions are `scripts/`, `references/`, and `assets/` (not an exhaustive allowlist); progressive disclosure recommends keeping `SKILL.md` under 500 lines and keeping file references one level deep relative to the skill root (`specification.mdx`).

## Directory & File Rules

- [ ] A skill directory MUST contain `SKILL.md` at its root. (Note: `skills-ref` also checks lowercase `skill.md`, but Agent Plugins §7.1 requires exact filename `SKILL.md`.)
- [ ] Optional conventional subdirectories (any additional files/directories are permitted):
  - `scripts/`: executable code (self-contained or documented deps).
  - `references/`: focused on-demand documentation (e.g., `REFERENCE.md`, topic files).
  - `assets/`: static templates, images, lookup tables, schemas.
- [ ] File references inside `SKILL.md` SHOULD use relative paths from the skill root (e.g., `references/REFERENCE.md`) and stay one level deep.

## `SKILL.md` Frontmatter Rules

- [ ] MUST start with `---`, followed by a valid YAML mapping, closed by `---`, followed by Markdown body.
- [ ] Closed set of 6 allowed frontmatter keys (`skills-ref` rejects unknown keys):
  - `name` (**required**, string):
    - MUST be 1–64 characters (after NFKC normalization and trim).
    - MUST contain only lowercase Unicode alphanumeric characters and hyphens (`-`) — ASCII `[a-z0-9-]` for maximum cross-harness portability.
    - MUST NOT start or end with `-`.
    - MUST NOT contain consecutive hyphens (`--`).
    - MUST match the parent directory name (NFKC-normalized).
  - `description` (**required**, string):
    - MUST be non-empty and 1–1024 characters.
    - SHOULD describe both what the skill does and when to use it.
  - `license` (optional, string): short license name or reference to bundled license file.
  - `compatibility` (optional, string): MUST be 1–500 characters if provided.
  - `metadata` (optional, mapping): map of string keys to string values for additional client/author metadata.
  - `allowed-tools` (optional, string): space-separated list of pre-approved tools (experimental).

## Progressive Disclosure Recommendations

- [ ] Tier 1 (startup metadata): `name` + `description` (~100 tokens).
- [ ] Tier 2 (activated skill body): full `SKILL.md` body SHOULD stay under 500 lines / < 5000 tokens.
- [ ] Tier 3 (on-demand resources): move detailed docs/templates/code into `references/`, `assets/`, `scripts/`.

## Reference Validator Notes (`skills-ref`)

- Upstream `skills-ref` (`src/skills_ref/validator.py`) enforces:
  - Unknown frontmatter key rejection (`ALLOWED_FIELDS`).
  - `name` non-empty string, NFKC-normalized, ≤64 chars, lowercase, no leading/trailing `-`, no `--`, `isalnum() or '-'`, matches `skill_dir.name`.
  - `description` non-empty string, ≤1024 chars.
  - `compatibility` string, ≤500 chars (note: `validator.py` does not explicitly reject empty string `""` for `compatibility`, while `specification.mdx` says "Must be 1-500 characters if provided" — TypeScript validator enforces 1–500 when present).
- `skills-ref` is Python-only (`strictyaml`), and `python3` is not installed in this workspace, so the TypeScript validator implements all rules natively.

## Gotchas

- **Filename casing:** `skills-ref` falls back to `skill.md`, while Agent Plugins §7.1 requires exact `SKILL.md`. Always require `SKILL.md` in plugin packages.
- **No dots in skill names:** Unlike Agent Plugins `plugin.json` names (which allow `.`), Agent Skills `name` allows only lowercase alphanumeric characters and hyphens (`-`).
- **Prompt injection check:** No agent-directed instructions found in the cloned Agent Skills specification or `skills-ref` files.
