# Burlaki Integration Guide

## Quick Start for New Projects

1. **Install Burlaki**
   - `pnpm add burlaki-cli` (or `npm install --save burlaki-cli`).
   - Verify the CLI is available: `pnpm burlaki --version`.
2. **Create `.codex` config**
   - Add a `.codex/config.json` with `{ "defaultPrompt": "burlaki" }`.
   - Point `skillsDir` to `.agents/skills` and add any custom prompts (`prompts/codex`).

## Integrating with Existing Workflows

- **Ralph/Codex compatibility**: Burlaki builds on the same prompt-driven flow; register your Ralph skills in `.agents/skills` and list them in `agent-skills-matrix.json` exactly as Burlaki expects. The CLI simply orchestrates the stage validations you already run.
- **Migrating from other systems**: Replace legacy hooks with Burlaki commands (`pnpm skills:gate`, `pnpm prompts:install`), keep existing workflow files (PRD, drafts) and update build CI steps to call Burlaki scripts instead of prior tooling.

## Configuration Options

- **Environment variables**
  - `BURLAKI_STAGE` to lock the current workflow stage.
  - `BURLAKI_SKILLS_DIR` overrides the skill directory.
  - `BURLAKI_PROMPTS_DIR` points to custom prompt copies when not stored in the repo.
- **Skills matrix customization**
  - Edit `agent-skills-matrix.json` to add stages, requirements, and `agentConstraints`.
  - Use `scripts/skills-gate.mjs --matrix path/to/matrix --stage coder` to test changes locally.
- **Custom prompt installation**
  - Run `pnpm prompts:install -- --force` after adding prompts under `prompts/codex/`.

## Common Integration Patterns

- **CI/CD**
  - Add `pnpm skills:gate -- --matrix agent-skills-matrix.json --stage <stage>` as a pipeline step.
- **Team onboarding**
  - Document required skills/state in `docs/skills.md`, mirror the staging flow in README, and run `pnpm burlaki` during onboarding.
- **Monorepo usage**
  - Keep shared skills matrix at repo root and reference monorepo-specific submatrices via the CLI `--matrix` flag.

## Troubleshooting Common Issues

- **Skills not found**
  - Ensure `BURLAKI_SKILLS_DIR` or default `.agents/skills` is populated and `agent-skills-matrix.json` lists each skill.
  - Run `pnpm burlaki --list-skills` (if available) to verify discovery.
- **PRD validation failures**
  - Confirm `.agents/tasks/prd.json` matches required schema; use `node scripts/skills-gate.mjs --matrix agent-skills-matrix.json` locally to reproduce.
  - Update `skills` entries to match actual stage IDs.
- **Git workflow issues**
  - Update `skills:gate` steps to respect feature branches; pass `--branch ${CI_COMMIT_REF_NAME}` when needed.
  - Keep `.codex` config synced with repo; commit any generated prompts or rely on installation steps rather than committing large binaries.
