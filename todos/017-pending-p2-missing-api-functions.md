---
status: pending
priority: p2
issue_id: "017"
tags: [code-review, api-design, agent-native]
dependencies: []
---

# Add Missing Task Management Functions

The module is missing `listAllTasks()` and `deleteTask()` functions needed for complete task lifecycle management.

## Problem Statement

Current API provides:
- ✅ List ready tasks (`listReadyTasks`)
- ✅ Create task (`createTask`)
- ✅ Update task (`updateTask`)
- ✅ Show task (`showTask`)
- ❌ List ALL tasks (not just ready)
- ❌ Delete task

This prevents agents from:
- Getting complete view of task state
- Cleaning up tasks or correcting mistakes
- Full CRUD operations

## Findings

- **Agent-Native Score:** 5/10 capabilities are agent-accessible
- Missing functions would follow same pattern as existing ones
- `listAllTasks` likely maps to `bd list --json`
- `deleteTask` likely maps to `bd delete <id>`

## Proposed Solutions

### Option 1: Add Both Functions

**Approach:** Implement `listAllTasks` and `deleteTask` following existing patterns.

```javascript
/**
 * List all tasks
 * @param {{ cwd?: string }} options
 * @returns {Promise<BeadsClientResult<BeadsTask[]>>}
 */
export async function listAllTasks(options = {}) {
  const result = await execBeads(['list', '--json'], options);
  
  if (!result.ok) {
    return { 
      ok: false, 
      error: result.stderr || `bd list failed with code ${result.code}`,
      fallback: true 
    };
  }
  
  try {
    const tasks = JSON.parse(result.stdout);
    return { ok: true, data: Array.isArray(tasks) ? tasks : [] };
  } catch (e) {
    return { ok: false, error: `Failed to parse beads output: ${e.message}`, fallback: true };
  }
}

/**
 * Delete a task
 * @param {string} taskId
 * @param {{ cwd?: string }} options
 * @returns {Promise<BeadsClientResult<boolean>>}
 */
export async function deleteTask(taskId, options = {}) {
  const result = await execBeads(['delete', taskId], { cwd: options.cwd });
  
  if (!result.ok) {
    return { 
      ok: false, 
      error: result.stderr || `bd delete failed with code ${result.code}`,
      fallback: true 
    };
  }
  
  return { ok: true, data: true };
}
```

**Pros:**
- Complete CRUD API
- Better agent usability
- Consistent with existing patterns

**Cons:**
- More code to maintain
- Assumes beads CLI supports these commands

**Effort:** 20 minutes

**Risk:** Low (if beads CLI supports commands)

---

### Option 2: Add Only listAllTasks

**Approach:** Add list function but skip delete (may be intentionally omitted).

**Pros:**
- Addresses most common gap
- Lower risk

**Cons:**
- Incomplete API
- Can't clean up tasks

**Effort:** 10 minutes

**Risk:** Low

---

### Option 3: Document as Known Limitation

**Approach:** Add JSDoc noting what's not implemented.

**Pros:**
- No code change

**Cons:**
- Doesn't solve the problem
- Poor agent experience

**Effort:** 5 minutes

**Risk:** None

## Recommended Action

**Option 1** - Add both functions for complete API. Verify beads CLI commands first.

## Technical Details

**Affected files:**
- `scripts/beads-client.mjs` - Add new exports

**New functions:**
- `listAllTasks(options)` - calls `bd list --json`
- `deleteTask(taskId, options)` - calls `bd delete <id>`

**Verification needed:**
- [ ] Check if `bd list --json` exists
- [ ] Check if `bd delete` exists
- [ ] Verify output format

## Acceptance Criteria

- [ ] `listAllTasks()` returns all tasks
- [ ] `deleteTask(taskId)` removes task
- [ ] Both follow Result pattern
- [ ] JSDoc types are correct
- [ ] Functions exported from module

## Work Log

### 2026-02-19 - Code Review Discovery

**By:** Agent Native Reviewer

**Actions:**
- Identified missing CRUD operations
- Scored agent-native accessibility at 5/10
- Proposed function implementations

**Learnings:**
- Complete API surfaces improve agent effectiveness
- Missing delete prevents cleanup operations
