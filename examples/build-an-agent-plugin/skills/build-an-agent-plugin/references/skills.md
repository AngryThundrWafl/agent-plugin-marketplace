# Agent Skills (`skills/<skill-name>/SKILL.md`)

Skills are shared unmodified across GitHub Copilot, Claude Code, and Google Antigravity when they conform to the [Agent Skills](https://agentskills.io/specification) specification.

## Discovery & Naming Rules

- Place each skill in an immediate child directory of `<plugin-root>/skills/` (`skills/<skill-name>/SKILL.md`), because clients discover only direct children under `skills/` and do not recurse into nested directories.
- Use the exact uppercase filename `SKILL.md` (required by Agent Plugins §7.1 for cross-harness discovery rather than lowercase `skill.md`).
- Format frontmatter `name` to meet all four constraints:
  - Length of 1–64 characters.
  - Lowercase alphanumeric characters and hyphens only (`[a-z0-9-]`, no dots `.`).
  - Alphanumeric at start and end, with no consecutive `--`.
  - Exact match to the parent directory name.

## Allowed Frontmatter Fields

Only six YAML frontmatter keys are permitted by the Agent Skills specification and validator (unknown keys fail validation):

| Key | Required | Rules |
| --- | --- | --- |
| `name` | Yes | 1–64 chars, lowercase alphanumeric + `-`, matches parent folder name |
| `description` | Yes | 1–1024 non-empty chars describing both **what** the skill does and **when** to use it |
| `license` | No | String (e.g., `"MIT"` or relative license filename) |
| `compatibility` | No | 1–500 chars if provided |
| `metadata` | No | Mapping of string keys to **string** values (quote versions like `"1.0.0"`) |
| `allowed-tools` | No | Space-separated string of pre-approved tools (experimental) |

## Progressive Disclosure Checklist

- **Tier 1 (Metadata):** Keep `name` + `description` concise (~100 tokens) as a clean single-line string with clear trigger cues.
- **Tier 2 (`SKILL.md` body):** Keep under 500 lines (under 120 lines for router skills paired with `references/`) and focus on core workflow steps.
- **Tier 3 (On-demand resources):** Move detailed guides, templates, and scripts into `references/`, `assets/`, and `scripts/` referenced by relative paths one level deep from the skill root.

## Validated `SKILL.md` Example

Save the following as `skills/hello-world/SKILL.md`:

```markdown validate:skill:hello-world
---
name: hello-world
description: Generate a concise project greeting and verify starter plugin layout. Use when onboarding a new repository or testing skill discovery across harnesses.
license: MIT
metadata:
  version: "1.0.0"
---

# Hello World

Use this skill to verify that a portable plugin is discovered and activated properly.

## Steps

1. Inspect the workspace root and confirm `plugin.json` is present.
2. Read [references/checklist.md](references/checklist.md) for detailed checks.
3. Report the verified files concisely.
```
