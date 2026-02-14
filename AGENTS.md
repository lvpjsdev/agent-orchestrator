# AGENTS.md

Guidelines for coding agents operating in this repository.

## Project Overview

Agent orchestration utilities for workflow governance with Codex/Ralph agents: skills matrix validation, Codex prompt installation, and workflow prompts (`/burlaki-start`, `/burlaki-run`, `/burlaki-continue`, etc.).

## Build/Lint/Test Commands

```bash
# Install dependencies
pnpm install

# Run skills gate check (main CLI)
pnpm skills:gate -- --matrix ./agent-skills-matrix.json --stage coder --agent claude

# Install Codex prompts to ~/.codex/prompts
pnpm prompts:install

# Force overwrite existing prompts
pnpm prompts:install -- --force
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

### Testing

No test suite configured. When added:

```bash
pnpm test                    # Run all tests
pnpm test -- path/to/test.mjs  # Run single test file
```

### Linting

No linter configured. Recommended:

```bash
pnpm lint        # Check with ESLint
pnpm lint --fix  # Auto-fix
```

## Source of Truth

- `agent-skills-matrix.json` - skill requirements per workflow stage
- `.agents/skills/` - local skill definitions
- PRD JSON (`.agents/tasks/prd.json`) - primary execution source for coder loop
- Specs are secondary reference for anti-drift checks only

## Code Style Guidelines

### General Principles

- Write small, focused functions (under 50 lines)
- Use clear variable names - prefer explicitness over brevity
- Handle errors explicitly - don't swallow errors silently
- Exit with appropriate codes: `0` for success, `1` for errors, `2` for usage errors

### Language & Modules

- Use ESM modules (`import`/`export`) with `.mjs` extension
- Node.js built-ins use `node:` prefix: `node:fs`, `node:os`, `node:path`, `node:url`
- Use `fileURLToPath` and `dirname` for ESM `__dirname` equivalent

### Imports

```javascript
import { existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
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

### Variables & Declarations

- Use `const` by default; `let` only when reassignment required
- Never use `var`
- Prefer descriptive names: `installedSkills`, `skillsMissing`
- Loop counters: use `i += 1` (not `i++`)

### Functions

- Use `function` keyword for top-level functions (not arrow functions)
- Keep functions focused and single-purpose
- Use early returns to reduce nesting

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
```

### Control Flow

- Use `for...of` for array iteration when index not needed
- Use `?.` optional chaining and `??` nullish coalescing
- Prefer `Array.isArray()` for type checking arrays

### Error Handling

- Exit codes: `0` = success, `1` = error/block, `2` = usage error
- Use `console.error()` for errors, `process.stdout.write()` for output
- Wrap parsing in try/catch with descriptive messages

```javascript
// Use try/catch for operations that may fail
if (!existsSync(matrixPath)) {
  console.error(`Matrix not found: ${matrixPath}`);
  process.exit(2);
}

try {
  return JSON.parse(readFileSync(matrixPath, "utf8"));
} catch (error) {
  console.error(`Failed to parse matrix file: ${matrixPath}`);
  console.error(error);
  process.exit(1);
}
```

### CLI Output

- Output JSON for programmatic consumption: `JSON.stringify(obj, null, 2)`
- End output with newline: `process.stdout.write(`${json}\n`)`
- Include both `status` and actionable `reasons` in results

### Data Structures

- Use `Set` for unique collections
- Spread Sets to arrays: `[...new Set([...arr1, ...arr2])]`
- Sort arrays before returning: `[...skills].sort()`

### Regex

- Pre-compile regex as constants at module level
- Use descriptive names: `SKILL_NAME_RE`, `QUOTES_TRIM_RE`

## Git Workflow

- **main**: Protected production branch, no direct pushes
- **develop**: Integration branch for test-stand deploy
- **feature/&lt;story-id&gt;-&lt;slug&gt;**: One branch per story/task

Each feature branch must use a dedicated worktree:

```bash
git worktree add .codex/worktrees/<story-id> -b feature/<story-id>-<slug> develop
```

## Workflow Stages

| Stage | Required Skills | Forbidden Skills |
|-------|----------------|------------------|
| manager | brainstorming, prd | coding-agent, yeet |
| coder | coding-agent, react-best-practices, typescript-advanced-types | yeet, security-best-practices |
| tester | e2e-testing-patterns, playwright | coding-agent |
| reviewer | (none) | coding-agent |
| devops | (none) | product-scope-change |

## Key Files

- `scripts/skills-gate.mjs` - Main CLI for skill validation
- `scripts/install-codex-prompts.mjs` - Prompt installer
- `agent-skills-matrix.json` - Stage/skill configuration
- `prompts/codex/*.md` - Codex slash commands
- `.agents/skills/` - Local skill definitions

## Prompts Structure

Codex prompts in `prompts/codex/` use YAML frontmatter:

```markdown
---
description: Short description for CLI help
argument-hint: "<required-arg> [optional-arg]"
---
```

Main prompts: `/burlaki-start`, `/burlaki-run`, `/burlaki-continue`, `/burlaki-human`, `/burlaki-gate`
