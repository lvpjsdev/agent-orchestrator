# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [0.2.0] - 2026-02-18

### Summary
- Builds on the 0.1.0 foundation by weaving together the `/workflows:deepen-plan` command, PRD validation tooling, schema baggage, workflow modularization, and refreshed orchestration docs so the CLI can ship research-facing workflows end-to-end.

### Added
- `/workflows:deepen-plan` command for deeper planning support in research workflows
- PRD validation tooling, including the JSON Schema, `.env.example`, and the associated testing harness
- `schema_version` field support plus lazy migration guidance for PRD artifacts

### Refactored
- Modularized the workflow prompts into dedicated sub-prompts under `prompts/codex/workflow/`

### Changed
- Updated documentation and orchestration references to track the new command, workflow split, engine metadata, and troubleshooting guidance

### Commits
- `feat(P2): add CHANGELOG, engines field, and todos documentation`
- `feat(P1): add JSON schema for PRD`
- `feat(P1): add PRD validation, JSON schema, env example, and testing`
- `feat(P0-1): add /workflows:deepen-plan command`
- `refactor(P0-3): modularize workflow - split into sub-prompts`
- `feat(prd): add schema_version field with lazy migration (#13)`
- `docs(P3): add comprehensive documentation - orchestration, integration, troubleshooting`

### Contributors
- @lvpjsdev

## [0.1.1] - 2026-02-18

### Added
- Add `/workflows:deepen-plan` command to enrich research-oriented plans with deeper planning steps
- Add PRD validation tooling, including the JSON Schema, `.env.example`, and accompanying unit testing scaffolding for the CLI

### Refactored
- Modularize the workflow prompts by splitting `burlaki-start.md` into dedicated modular sub-prompts under `prompts/codex/workflow/`

### Changed
- Update the `/burlaki-run` prompt to reference the new `/workflows:deepen-plan` command and reflect the modular workflow structure
- Adjust orchestration scripts (skills-gate, prompt references, etc.) so the new prompt structure and tests are discoverable and runnable
