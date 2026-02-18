# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [0.1.1] - 2026-02-18

### Added
- Add `/workflows:deepen-plan` command to enrich research-oriented plans with deeper planning steps
- Add PRD validation tooling, including the JSON Schema, `.env.example`, and accompanying unit testing scaffolding for the CLI

### Refactored
- Modularize the workflow prompts by splitting `burlaki-start.md` into dedicated modular sub-prompts under `prompts/codex/workflow/`

### Changed
- Update the `/burlaki-run` prompt to reference the new `/workflows:deepen-plan` command and reflect the modular workflow structure
- Adjust orchestration scripts (skills-gate, prompt references, etc.) so the new prompt structure and tests are discoverable and runnable
