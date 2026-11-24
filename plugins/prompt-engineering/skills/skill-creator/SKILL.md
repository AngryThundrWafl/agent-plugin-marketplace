---
name: skill-creator
description: Create, update, and audit portable Agent Skills following the agentskills.io specification and the distilled Prompting Reference Pack (../../reference/). Use when authoring a new skill, refactoring SKILL.md, adding progressive-disclosure guides, or validating skill compliance.
metadata:
  version: "1.0.0"
---

# Skill Creator

Author and maintain portable Agent Skills (`skills/<skill-name>/SKILL.md`) that comply with the `agentskills.io` specification, Agent Plugins v1.0.0 packaging rules, and the distilled Prompting Reference Pack.

## Required Loading Order

Follow progressive disclosure—do not draft skill instructions from memory and do not inline the reference pack into `SKILL.md`:

1. Read [authoring-guide.md](authoring-guide.md) for the 8-step authoring procedure and the `../../reference/` routing table.
2. Read [checklist.md](checklist.md) so the pass/fail acceptance checks guide drafting from the start.
3. Read only the relevant files in `../../reference/` for your target model family and task before writing any prompting guidance or behavioral instructions.

## Workflow Overview

1. **Clarify scope & triggers:** Define the skill's use case, target harnesses/models, and trigger/non-trigger boundaries.
2. **Read references on demand:** Load matching `../../reference/*.md` files (model-specific files first, since they override general defaults).
3. **Plan progressive disclosure:** Keep `SKILL.md` thin; place detailed procedures, checklists, references, scripts, and assets one level deep.
4. **Author valid frontmatter:** Use only allowed `agentskills.io` keys, match `name` to the directory, and write a single-line `description` with clear triggers.
5. **Write body & guides:** Apply clear, direct, positive instructions with rationale; link to `../../reference/` instead of duplicating model rules; tag claims `[Claude docs]`, `[Vendor]`, `[General]`, or `unverified`.
6. **Package supporting files:** Add `authoring-guide.md` and `checklist.md` for complex workflow skills using relative paths.
7. **Validate:** Verify every check in [checklist.md](checklist.md) and run `skills-ref validate` / `npm run validate`.
8. **Iterate with evals:** Measure triggers and outputs against success criteria, changing one variable per iteration.
