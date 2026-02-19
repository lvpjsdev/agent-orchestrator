---
status: complete
priority: p2
issue_id: "012"
tags: [code-review, code-quality, cleanup]
dependencies: []
---

# Remove Unused Import and Pre-compile Regex

Two code quality issues: unused `homedir` import and inline regex that should be a constant per project conventions.

## Problem Statement

1. The `homedir` function is imported from `node:os` but never used anywhere in the file
2. A regex pattern is defined inline instead of as a module-level constant, violating AGENTS.md conventions

## Findings

- **Unused Import:** Line 5 - `import { homedir } from 'node:os';`
- **Inline Regex:** Line 114 - `const idMatch = result.stdout.match(/(bd-[a-z0-9]+)/i);`
- AGENTS.md states: "Pre-compile regex as constants at module level with `_RE` suffix"

## Proposed Solutions

### Option 1: Simple Cleanup

**Approach:** Remove the unused import and extract regex to constant.

```javascript
// Remove line 5 entirely

// Add at module level after imports:
const TASK_ID_RE = /(bd-[a-z0-9]+)/i;

// Line 114 becomes:
const idMatch = result.stdout.match(TASK_ID_RE);
```

**Pros:**
- Follows project conventions
- Removes dead code
- Improves regex discoverability

**Cons:**
- None

**Effort:** 2 minutes

**Risk:** None

---

### Option 2: Also Add Validation Regex

**Approach:** Same as Option 1, plus add a validation regex for task IDs.

```javascript
const TASK_ID_RE = /(bd-[a-z0-9]+)/i;
const TASK_ID_VALIDATE_RE = /^bd-[a-z0-9]{4,12}$/i;
```

**Pros:**
- Enables input validation
- More comprehensive

**Cons:**
- Scope creep for this fix

**Effort:** 5 minutes

**Risk:** Low

## Recommended Action

**Option 1** - Simple cleanup to remove dead code and follow conventions.

## Technical Details

**Affected files:**
- `scripts/beads-client.mjs:5` - Remove unused import
- `scripts/beads-client.mjs:114` - Use constant instead of inline regex

## Acceptance Criteria

- [ ] No unused imports in the file
- [ ] Regex pattern defined as `TASK_ID_RE` constant at module level
- [ ] Code still functions correctly

## Work Log

### 2026-02-19 - Code Review Discovery

**By:** Code Review Agents

**Actions:**
- kieran-typescript-reviewer identified unused import
- code-simplicity-reviewer flagged YAGNI violation
- Both reviewers noted regex convention violation

**Learnings:**
- Multiple agents independently caught these issues
