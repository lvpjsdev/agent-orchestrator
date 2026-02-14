# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-14

### Breaking Changes

- Package renamed: `@lvpjsdev/agent-orchestrator` → `@lvpjsdev/burlaki`
- CLI command renamed: `ao-skills-gate` → `burlaki-gate`

#### Migration Guide

1. Uninstall old package and install new:

   ```bash
   pnpm remove @lvpjsdev/agent-orchestrator
   pnpm add @lvpjsdev/burlaki
   ```

2. Update import statements:

   ```js
   // Old
   import matrix from '@lvpjsdev/agent-orchestrator';
   
   // New
   import matrix from '@lvpjsdev/burlaki';
   ```

3. Update CLI calls in scripts/CI:

   ```bash
   # Old
   pnpm dlx ao-skills-gate --matrix ./agent-skills-matrix.json --stage coder
   
   # New
   pnpm dlx burlaki-gate --matrix ./agent-skills-matrix.json --stage coder
   ```

4. Check and update other files:

   - `package.json` scripts: replace `ao-skills-gate` with `burlaki-gate`
   - CI/CD configurations (GitHub Actions, GitLab CI, etc.)
   - Configuration files referencing the package
   - Comments and documentation in your project

### Added

- Initial public release
- Agent skills matrix JSON configuration
- Skills gate CLI for workflow governance
- Codex prompts installation script
- Slash commands: `/ao-start`, `/ao-run`, `/ao-continue`, `/ao-human`, `/ao-gate`, `/ao-matrix`, `/ao-onboard`
