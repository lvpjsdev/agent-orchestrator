---
module: Workflow Orchestration
date: 2026-02-15
problem_type: developer_experience
component: tooling
symptoms:
  - Interactive prompts blocking CI/CD automation when running burlaki commands
  - No visibility into workflow state without manually reading PRD files
  - Developers cannot quickly check which stories are pending/blocked
root_cause: missing_tooling
resolution_type: tooling_addition
severity: medium
tags: [cli, automation, non-interactive, ci-cd, burlaki]
---

# Troubleshooting: CLI Non-Interactive Mode for CI/CD Automation

## Problem

The burlaki workflow commands (`/burlaki-rollback`, `/burlaki-continue`, `/burlaki-run`) required interactive user input, preventing their use in CI/CD pipelines. Additionally, there was no CLI command to check workflow status, requiring developers to manually read PRD JSON files.

## Environment

- Module: Workflow Orchestration (Burlaki)
- Node.js Version: 18+
- Affected Components: Agent prompts, CLI scripts
- Date: 2026-02-15

## Symptoms

- Running `/burlaki-rollback --yes` still required confirmation prompts
- No way to run `/burlaki-run` in CI without per-story confirmation
- Checking workflow state required: `cat .agents/tasks/prd.json | jq '.stories[] | select(.status=="pending")'`
- Error output used `console.log()` instead of `process.stdout.write()`, breaking UNIX conventions

## What Didn't Work

**Attempted Solution 1:** Use `--yes` flag alone
- **Why it failed:** `--yes` only skipped confirmation prompts, not all interactive decision trees (e.g., "which phase to resume?")

**Attempted Solution 2:** Set environment variable without flag support
- **Why it failed:** Prompts didn't check for `WORKFLOW_NON_INTERACTIVE` environment variable

## Solution

Added `--no-input` flag support to agent prompts and created `burlaki-status` CLI command.

### 1. Agent Prompt Updates

Added mode detection to three prompts:

```markdown
## Mode Detection

Parse `$ARGUMENTS` to detect non-interactive mode:

**Non-interactive when ANY of:**
- `--no-input` flag present
- `WORKFLOW_NON_INTERACTIVE=true` environment variable

**Defaults (when --no-input):**
- Target: `last-checkpoint` (rollback)
- Phase: Auto-detect from artifacts (continue)
- Auto-approve: true (run)
```

### 2. New burlaki-status.mjs Script

```javascript
#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const PRD_PATH = '.agents/tasks/prd.json';
const STORY_ID_RE = /Story:\s*([a-zA-Z0-9-]+)/;

function getLastCheckpoint() {
  try {
    // Use null-byte delimiter to handle commit subjects with |
    const output = execSync(
      'git log --grep="\\[burlaki-checkpoint\\]" -n 1 --format="%H%x00%ci%x00%s"',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    
    if (!output) return null;
    
    const parts = output.split('\0');
    const sha = parts[0];
    const timestamp = parts[1];
    const subject = parts.slice(2).join('\0');
    const storyMatch = subject.match(STORY_ID_RE);
    
    return {
      sha: sha.substring(0, 7),
      fullSha: sha,
      timestamp: timestamp,
      storyId: storyMatch ? storyMatch[1] : null,
    };
  } catch (error) {
    // Git exits with 128 when no matching commits found
    if (error.status !== 128) {
      console.error(`Warning: git log failed: ${error.message}`);
    }
    return null;
  }
}

// Output with status field and process.stdout.write
const result = {
  status: 'success',
  currentStage: prd.currentStage ?? prd.stage ?? 'unknown',
  pendingStories: pending,
  completedStories: completed,
  totalStories: total,
  lastCheckpoint: getLastCheckpoint(),
  blockedStories: blocked,
};

if (args.json) {
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
} else {
  process.stdout.write(formatHuman(result) + '\n');
}
```

### 3. esbuild.config.js Update

```javascript
const ASSETS = [
  { from: 'scripts/skills-gate.mjs', to: 'scripts/skills-gate.mjs' },
  { from: 'scripts/install-prompts.mjs', to: 'scripts/install-prompts.mjs' },
  { from: 'scripts/burlaki-status.mjs', to: 'scripts/burlaki-status.mjs' }, // Added
];
```

### 4. package.json Updates

```json
{
  "bin": {
    "burlaki-skills-gate": "./dist/scripts/skills-gate.mjs",
    "burlaki-status": "./dist/scripts/burlaki-status.mjs"
  },
  "scripts": {
    "burlaki:status": "node scripts/burlaki-status.mjs"
  }
}
```

## Why This Works

1. **`$ARGUMENTS` string substitution**: Claude Code replaces `$ARGUMENTS` with literal command-line text, allowing prompts to parse flags
2. **Mode detection pattern**: Checking both flag and env var provides flexibility for different automation contexts
3. **Null-byte delimiter**: Using `%x00` in git format prevents parsing failures when commit subjects contain `|`
4. **`process.stdout.write()`**: Follows CLI guidelines - stdout for output, stderr for errors, always ends with newline
5. **Status field in JSON**: Enables programmatic consumption with consistent schema

## Prevention

- Always include `--no-input` when adding interactive prompts to agent commands
- Use `process.stdout.write()` for CLI output, `console.error()` for errors
- Add new CLI scripts to esbuild ASSETS array for proper packaging
- Pre-compile regex as module-level constants (e.g., `STORY_ID_RE`)
- Document short flag aliases (e.g., `-h` for `--help`)

## Related Issues

- See also: [rollback-checkpoint-recovery-Burlaki-20260215.md](./rollback-checkpoint-recovery-Burlaki-20260215.md)
- See also: [code-review-roadmap-findings-Burlaki-20260215.md](./code-review-roadmap-findings-Burlaki-20260215.md)
