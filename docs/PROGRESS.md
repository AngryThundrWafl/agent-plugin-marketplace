# Progress

- [x] Phase 0: Preflight, skeleton directories, defaults ADR (`docs/decisions/0001-defaults.md`), `.cache/` gitignored.
- [x] Phase 1: Research specs & schemas into `docs/specs/` and `schemas/` (7 spec files authored + fresh-reviewed once; 3 official schemas pinned unmodified).
- [x] Phase 2: Architecture Decision Records (`0002-manifest-placement.md`, `0003-marketplace-catalog.md`, `0004-example-plugin-and-repo-layout.md`).
- [x] Phase 3: TypeScript validator (`src/`), 10 fixtures (`test/fixtures/`), 17 passing Vitest tests (`ajv@8.20.0` Draft 2020-12, `yaml@2.9.1`, `vitest@3.2.7`).
- [x] Phase 4: Example plugin (`plugins/build-an-agent-plugin/`) + `.claude-plugin/marketplace.json` + snippet tests (`test/references-snippets.test.ts`), fresh-reviewed once; `npm test` (25/25), `npm run validate`, and `agy plugin validate` pass.
- [ ] Phase 5: Root `AGENTS.md` index (and `CLAUDE.md` if confirmed) + fresh-subagent probe.
- [ ] Phase 6: Local install verification and final report.
