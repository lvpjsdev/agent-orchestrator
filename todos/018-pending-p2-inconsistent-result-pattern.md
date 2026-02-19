---
status: pending
priority: p2
issue_id: "018"
tags: [code-review, api-design, consistency]
dependencies: []
---

# Standardize Result Pattern Across All Functions

Functions return different result shapes, forcing callers to handle multiple patterns.

## Problem Statement

Three different return patterns exist:
1. `isBeadsAvailable()` → `Promise<boolean>`
2. `execBeads()` → `{ ok, stdout, stderr, code }`
3. Others → `BeadsClientResult<T>` (`{ ok, data } | { ok, error, fallback }`)

This increases complexity for consumers and AI agents.

## Findings

| Function | Return Type | Pattern |
|----------|-------------|---------|
| `isBeadsAvailable()` | `Promise<boolean>` | Direct value |
| `isBeadsInitialized()` | `boolean` | Direct value |
| `execBeads()` | `{ ok, stdout, stderr, code }` | Raw result |
| `listReadyTasks()` | `BeadsClientResult<T[]>` | Result pattern |
| `createTask()` | `BeadsClientResult<T>` | Result pattern |
| `updateTask()` | `BeadsClientResult<boolean>` | Result pattern |
| `showTask()` | `BeadsClientResult<T>` | Result pattern |

## Proposed Solutions

### Option 1: All Functions Return BeadsClientResult

**Approach:** Standardize on discriminated union for all async functions.

```javascript
export async function isBeadsAvailable(): Promise<BeadsClientResult<boolean>> {
  return new Promise((resolve) => {
    const proc = spawn('which', ['bd'], { timeout: 5000 });
    proc.on('close', (code) => {
      resolve({ ok: true, data: code === 0 });
    });
    proc.on('error', (err) => {
      resolve({ ok: false, error: err.message, fallback: true });
    });
  });
}

export function isBeadsInitialized(cwd = process.cwd()): BeadsClientResult<boolean> {
  try {
    return { ok: true, data: existsSync(join(cwd, '.beads')) };
  } catch (err) {
    return { ok: false, error: err.message, fallback: true };
  }
}
```

**Pros:**
- Consistent API
- Easier for agents to handle
- Same error handling everywhere

**Cons:**
- More verbose for simple checks
- Breaking change

**Effort:** 30 minutes

**Risk:** Medium (breaking change)

---

### Option 2: Keep Sync Functions Simple, Async Use Result

**Approach:** 
- Sync functions (`isBeadsInitialized`) return direct values
- Async functions return `BeadsClientResult`
- Keep `execBeads` as internal (not exported)

**Pros:**
- Less verbose for simple checks
- Still consistent for main API

**Cons:**
- Still two patterns
- `isBeadsAvailable` is async but not using Result

**Effort:** 15 minutes

**Risk:** Low

---

### Option 3: Document Current Patterns

**Approach:** Add JSDoc explaining when each pattern is used.

```javascript
/**
 * Check if beads CLI is available
 * @returns Simple boolean (not Result pattern for convenience)
 */
```

**Pros:**
- No code change

**Cons:**
- Inconsistency remains
- Harder for agents

**Effort:** 5 minutes

**Risk:** None

## Recommended Action

**Option 2** - Balance between consistency and convenience. Make `execBeads` internal-only (prefix with `_` or don't export).

## Technical Details

**Affected files:**
- `scripts/beads-client.mjs:14-22` - `isBeadsAvailable`
- `scripts/beads-client.mjs:27-29` - `isBeadsInitialized`
- `scripts/beads-client.mjs:37-61` - `execBeads`

**Decision:**
- Make `execBeads` private (not exported or prefixed with `_`)
- Convert `isBeadsAvailable` to return `BeadsClientResult<boolean>`
- Keep `isBeadsInitialized` as sync direct return

## Acceptance Criteria

- [ ] All exported async functions return `BeadsClientResult<T>`
- [ ] `execBeads` is not exported or marked private
- [ ] JSDoc documents return types clearly
- [ ] Existing callers still work (or migration documented)

## Work Log

### 2026-02-19 - Code Review Discovery

**By:** Agent Native Reviewer

**Actions:**
- Identified three different return patterns
- Analyzed impact on agent usability
- Proposed standardization approach

**Learnings:**
- Consistent patterns reduce cognitive load
- Discriminated unions are agent-friendly
- Internal helpers can differ from public API
