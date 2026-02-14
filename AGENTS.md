# AGENTS.md - Agent Orchestrator

This document provides guidelines for agents operating in this repository.

## Project Overview

This is a small Node.js ESM project (`type: "module"`) that provides:
- `skills-gate` - CLI for agent workflow governance based on skill matrices
- `prompts:install` - Installs Codex slash command prompts

## Build / Test / Run Commands

### Running the project

```bash
# Install dependencies
pnpm install

# Run skills gate (main CLI)
pnpm skills:gate --matrix ./agent-skills-matrix.json --stage coder --agent claude

# Install Codex prompts
pnpm prompts:install
pnpm prompts:install -- --force  # overwrite existing
```

### Skills Gate CLI Usage

```bash
node scripts/skills-gate.mjs \
  --matrix <path> \
  --stage <stage-name> \
  [--agent <agent-name>] \
  [--log <log-path>] \
  [--policies <csv>]
```

### Single Test

**There are no tests in this project.** If adding tests, use a standard framework like Node's built-in test runner:

```bash
# Run a single test file
node --test test/specific-test.mjs

# Run a single test
node --test --test-name-pattern="test name" test/file.mjs
```

### Linting / Type Checking

No linting or type checking is configured. If adding:
- Use ESLint with Node.js recommended config
- Use TypeScript for type safety (currently plain JS)

## Code Style Guidelines

### General Principles

- Write small, focused functions (under 50 lines)
- Use clear variable names - prefer explicitness over brevity
- Handle errors explicitly - don't swallow errors silently
- Exit with appropriate codes: `0` for success, `1` for errors, `2` for usage errors

### Imports

```javascript
// Use Node.js built-in modules with node: prefix
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
```

### Formatting

- Use 2 spaces for indentation
- Use single quotes for strings
- Add spaces inside braces: `{ key: "value" }`
- Use trailing commas in multi-line objects/arrays
- Line length target: 100 characters max

### Naming Conventions

- **Variables/functions**: camelCase (`getSkillDirs`, `installedSkills`)
- **Constants**: UPPER_SNAKE_CASE for magic values
- **Regex patterns**: Suffix with `_RE` (`SKILL_NAME_RE`)
- **Files**: kebab-case for scripts, CamelCase for classes (if any)

### Types

This is plain JavaScript. When adding types:
- Use JSDoc comments for complex types
- Consider migrating to TypeScript for new files
- Use meaningful type names: `string`, `Array<string>`, `Object`

### Error Handling

```javascript
// Use try/catch for operations that may fail
try {
  const data = JSON.parse(readFileSync(path, "utf8"));
} catch (error) {
  console.error(`Failed to parse: ${path}`);
  console.error(error);
  process.exit(1);
}

// For argument parsing errors, exit with code 2
if (!args.matrix) {
  console.error("Error: --matrix is required");
  process.exit(2);
}

// Check existence before operations
if (!existsSync(path)) {
  console.error(`File not found: ${path}`);
  process.exit(2);
}
```

### Functions

```javascript
// Prefer regular functions for top-level, arrow functions for callbacks
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    // ...
  }
  return out;
}

// Use array methods with arrow functions
const filtered = items.filter((item) => item.active);
const mapped = items.map((item) => ({ ...item, processed: true }));
```

### Output Format

- CLI tools should output JSON to stdout for programmatic consumption
- Use `console.error` for errors and warnings
- Use `process.exit` with appropriate codes

### Git Workflow

- `main`: protected production branch, no direct pushes
- `develop`: integration branch for test-stand deploy
- `feature/<story-id>-<slug>`: one branch per story/task
- Use worktrees for feature branches: `git worktree add .codex/worktrees/<story-id> -b feature/<story-id>-<slug> develop`

## Workflow Stages

The project defines these workflow stages in `agent-skills-matrix.json`:

| Stage | Description |
|-------|-------------|
| manager | PRD creation, brainstorming |
| coder | Claude Code execution |
| tester | E2E testing |
| reviewer | Code review |
| devops | Deployment |

## Key Files

- `scripts/skills-gate.mjs` - Main CLI for skill validation
- `scripts/install-codex-prompts.mjs` - Prompt installer
- `agent-skills-matrix.json` - Stage/skill configuration
- `prompts/codex/*.md` - Codex slash commands

## Adding New Features

1. Add skill requirements to `agent-skills-matrix.json` if needed
2. Create new CLI scripts in `scripts/` directory
3. Follow the existing code style (ESM, error handling patterns)
4. Test manually with `node scripts/your-script.mjs`
