---
status: pending
priority: p2
issue_id: "013"
tags: [code-review, security, validation]
dependencies: []
---

# Add Input Validation to beads-client Functions

The module lacks input validation on critical parameters, allowing malformed data to reach the external CLI.

## Problem Statement

Multiple functions accept user input without validation:
- `createTask(title)` - no check for empty/malformed titles
- `options.priority` - unsafe `.replace()` on potentially non-string
- `taskId` parameters - no format validation
- `options.type`, `updates.status` - no enum validation

This creates potential for unexpected CLI behavior or errors.

## Findings

| Parameter | Location | Issue |
|-----------|----------|-------|
| `title` | Line 93 | No non-empty validation |
| `options.priority` | Line 97 | Unsafe string method |
| `taskId` | Lines 136, 165 | No format validation |
| `options.type` | Line 99 | No enum validation |
| `updates.status` | Line 139 | No enum validation |

**Attack Vectors:**
- `createTask('')` - empty title
- `createTask('--help')` - CLI flag injection (though spawn prevents shell interpretation)
- `updateTask('invalid-id', {...})` - malformed task ID

## Proposed Solutions

### Option 1: Guard Clauses at Function Entry

**Approach:** Add validation at the start of each function with early returns.

```javascript
const TASK_ID_RE = /^bd-[a-z0-9]{4,12}$/i;
const ALLOWED_TYPES = ['prd', 'task', 'subtask', 'message'];
const ALLOWED_STATUSES = ['todo', 'in_progress', 'done', 'blocked'];
const MAX_TITLE_LENGTH = 200;

export async function createTask(title, options = {}) {
  if (!title || typeof title !== 'string' || !title.trim()) {
    return { ok: false, error: 'Title is required', fallback: true };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return { ok: false, error: `Title exceeds ${MAX_TITLE_LENGTH} characters`, fallback: true };
  }
  if (options.type && !ALLOWED_TYPES.includes(options.type)) {
    return { ok: false, error: `Invalid type: ${options.type}`, fallback: true };
  }
  // ... rest of function
}

export async function updateTask(taskId, updates = {}) {
  if (!taskId || !TASK_ID_RE.test(taskId)) {
    return { ok: false, error: `Invalid taskId format: ${taskId}`, fallback: true };
  }
  if (updates.status && !ALLOWED_STATUSES.includes(updates.status)) {
    return { ok: false, error: `Invalid status: ${updates.status}`, fallback: true };
  }
  // ... rest of function
}
```

**Pros:**
- Defensive programming
- Clear error messages
- Fails fast

**Cons:**
- More code
- Must maintain allowed values list

**Effort:** 30 minutes

**Risk:** Low

---

### Option 2: Validation Helper Functions

**Approach:** Extract validation to reusable functions.

```javascript
function validateTaskId(taskId) {
  if (!taskId || !TASK_ID_RE.test(taskId)) {
    return { ok: false, error: `Invalid taskId format`, fallback: true };
  }
  return { ok: true };
}

function validateTitle(title) {
  if (!title?.trim()) {
    return { ok: false, error: 'Title is required', fallback: true };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return { ok: false, error: `Title exceeds ${MAX_TITLE_LENGTH} characters`, fallback: true };
  }
  return { ok: true };
}
```

**Pros:**
- Reusable
- Testable in isolation
- DRY

**Cons:**
- Additional abstraction layer

**Effort:** 45 minutes

**Risk:** Low

---

### Option 3: Minimal Validation Only

**Approach:** Add only the most critical validations: non-empty title, taskId format.

**Pros:**
- Smallest change
- Addresses highest risk

**Cons:**
- Incomplete coverage

**Effort:** 15 minutes

**Risk:** Low

## Recommended Action

**Option 1 or 2** - Full validation with guard clauses provides best protection. Option 2 preferred for maintainability.

## Technical Details

**Affected files:**
- `scripts/beads-client.mjs:93-127` - `createTask` function
- `scripts/beads-client.mjs:136-157` - `updateTask` function
- `scripts/beads-client.mjs:165-181` - `showTask` function

**Constants to add:**
- `TASK_ID_RE` - regex for task ID format
- `ALLOWED_TYPES` - valid issue types
- `ALLOWED_STATUSES` - valid task statuses
- `MAX_TITLE_LENGTH` - character limit

## Acceptance Criteria

- [ ] Empty title returns error
- [ ] Invalid taskId format returns error
- [ ] Invalid type/status returns error (if enum validation added)
- [ ] Valid inputs still work correctly
- [ ] Error messages are actionable

## Work Log

### 2026-02-19 - Code Review Discovery

**By:** Code Review Agents

**Actions:**
- security-sentinel identified missing input validation as security concern
- kieran-typescript-reviewer noted unsafe string method on optional property
- Documented attack vectors and remediation

**Learnings:**
- spawn() prevents shell injection but CLI itself may have parsing vulnerabilities
- Validation should happen at API boundary
