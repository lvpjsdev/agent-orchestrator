---
status: pending
priority: p2
issue_id: "014"
tags: [code-review, security, path-traversal]
dependencies: []
---

# Validate cwd Parameter for Path Traversal

The `cwd` parameter is passed to spawn without validation, allowing operations on arbitrary filesystem locations.

## Problem Statement

Multiple functions accept a `cwd` option that determines where the `bd` CLI executes. No validation ensures:
- Path is absolute
- Path is within expected project boundaries
- Path is free of traversal sequences (`../`)

## Findings

- **Location:** Lines 27-28, 38, 41-42
- `isBeadsInitialized(cwd)` passes user input directly to `existsSync`
- `execBeads(args, options)` passes `cwd` to `spawn`
- No validation between input and usage

**Attack Vector:**
```javascript
await showTask(taskId, { cwd: '/etc' });
await createTask(title, { cwd: '../../../etc' });
```

## Proposed Solutions

### Option 1: Allowlist Approach

**Approach:** Only allow paths within project root.

```javascript
import { resolve, normalize } from 'node:path';

function sanitizeCwd(inputCwd) {
  if (!inputCwd) return process.cwd();
  
  const resolved = resolve(inputCwd);
  const projectRoot = findProjectRoot(); // Walk up to find package.json
  
  if (!resolved.startsWith(projectRoot)) {
    throw new Error(`cwd must be within project root`);
  }
  
  return resolved;
}
```

**Pros:**
- Strong security boundary
- Prevents all traversal attacks

**Cons:**
- Requires project root detection
- May break legitimate use cases

**Effort:** 30 minutes

**Risk:** Low

---

### Option 2: Blocklist Approach

**Approach:** Block obvious traversal patterns and system directories.

```javascript
const UNSAFE_PATTERNS = ['../', '/etc', '/root', '/home'];
const SAFE_CWD_RE = /^\/[a-zA-Z0-9_\-./]+$/;

function sanitizeCwd(inputCwd) {
  if (!inputCwd) return process.cwd();
  
  const resolved = resolve(inputCwd);
  
  if (!SAFE_CWD_RE.test(resolved)) {
    throw new Error(`Invalid cwd: unsafe characters`);
  }
  
  for (const pattern of UNSAFE_PATTERNS) {
    if (resolved.includes(pattern)) {
      throw new Error(`Invalid cwd: contains blocked pattern`);
    }
  }
  
  return resolved;
}
```

**Pros:**
- Simpler implementation
- Less restrictive

**Cons:**
- May miss edge cases
- Less secure than allowlist

**Effort:** 20 minutes

**Risk:** Medium

---

### Option 3: Document and Trust

**Approach:** Add JSDoc warning but don't validate.

```javascript
/**
 * @param {{ cwd?: string }} options - Working directory (must be trusted)
 * @throws {Error} If path is invalid
 */
```

**Pros:**
- No implementation change

**Cons:**
- Security risk remains
- Relies on caller discipline

**Effort:** 5 minutes

**Risk:** High (doesn't fix the issue)

## Recommended Action

**Option 1** - Allowlist approach provides strongest security. Use project root as boundary.

## Technical Details

**Affected files:**
- `scripts/beads-client.mjs:27-29` - `isBeadsInitialized`
- `scripts/beads-client.mjs:38-61` - `execBeads`

**Helper function needed:**
```javascript
function findProjectRoot(start = process.cwd()) {
  let dir = start;
  while (dir !== '/') {
    if (existsSync(join(dir, 'package.json'))) return dir;
    dir = dirname(dir);
  }
  return start;
}
```

## Acceptance Criteria

- [ ] `../` in cwd is rejected
- [ ] Absolute paths outside project are rejected
- [ ] Valid paths within project still work
- [ ] Clear error message for invalid paths

## Work Log

### 2026-02-19 - Code Review Discovery

**By:** Security Sentinel

**Actions:**
- Identified path traversal vulnerability
- Analyzed attack vectors
- Proposed multiple remediation strategies

**Learnings:**
- spawn() respects cwd but doesn't validate it
- Defense in depth requires validation at API boundary
