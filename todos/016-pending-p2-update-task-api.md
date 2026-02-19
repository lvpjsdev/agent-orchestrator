---
status: pending
priority: p2
issue_id: "016"
tags: [code-review, api-design, agent-native]
dependencies: []
---

# Fix updateTask Parameter Naming and Expand Fields

The `updateTask` function conflates task updates with execution options, and lacks support for all updatable fields.

## Problem Statement

1. The `updates` parameter includes `cwd` which is execution context, not a task property
2. Only `status` and `assignee` are supported - missing `stage`, `priority`, `title`
3. This limits what an agent can do with task management

## Findings

- **Location:** Lines 136-157
- `updates.cwd` is confusing - should be separate `options` parameter
- Missing fields: `stage`, `priority`, `title`, `description`

## Proposed Solutions

### Option 1: Split Parameters + Add Fields

**Approach:** Separate updates from options, support all fields.

```javascript
/**
 * Update a task
 * @param {string} taskId
 * @param {{ status?: string, assignee?: string, stage?: string, priority?: string, title?: string }} updates
 * @param {{ cwd?: string }} options
 * @returns {Promise<BeadsClientResult<boolean>>}
 */
export async function updateTask(taskId, updates = {}, options = {}) {
  const args = ['update', taskId];
  
  if (updates.status) args.push('--status', updates.status);
  if (updates.assignee) args.push('--assignee', updates.assignee);
  if (updates.stage) args.push('--stage', updates.stage);
  if (updates.priority) args.push('-p', updates.priority.replace('P', ''));
  if (updates.title) args.push('--title', updates.title);
  
  const result = await execBeads(args, { cwd: options.cwd });
  // ...
}
```

**Pros:**
- Clear API separation
- Full field support
- Better agent usability

**Cons:**
- Breaking change for callers

**Effort:** 30 minutes

**Risk:** Low

---

### Option 2: Add Fields Only (Keep cwd in updates)

**Approach:** Add missing fields but keep `cwd` in updates for backward compatibility.

```javascript
export async function updateTask(taskId, updates = {}) {
  const args = ['update', taskId];
  const { cwd, status, assignee, stage, priority, title } = updates;
  
  if (status) args.push('--status', status);
  if (assignee) args.push('--assignee', assignee);
  if (stage) args.push('--stage', stage);
  if (priority) args.push('-p', priority.replace('P', ''));
  if (title) args.push('--title', title);
  
  const result = await execBeads(args, { cwd });
  // ...
}
```

**Pros:**
- Backward compatible
- Adds missing fields

**Cons:**
- Still conflates concerns
- Less clear API

**Effort:** 20 minutes

**Risk:** Low

---

### Option 3: Document Current Limitation

**Approach:** Add JSDoc noting which fields are supported.

**Pros:**
- No code change

**Cons:**
- Doesn't improve API
- Agents can't update all fields

**Effort:** 5 minutes

**Risk:** None

## Recommended Action

**Option 1** - Clean API with parameter separation. Breaking change is acceptable for new module.

## Technical Details

**Affected files:**
- `scripts/beads-client.mjs:136-157` - `updateTask` function

**Fields to support:**
- `status` - already supported
- `assignee` - already supported  
- `stage` - ADD
- `priority` - ADD
- `title` - ADD

## Acceptance Criteria

- [ ] `updates` and `options` are separate parameters
- [ ] All common task fields can be updated
- [ ] JSDoc documents all parameters
- [ ] Backward compatibility considered or documented

## Work Log

### 2026-02-19 - Code Review Discovery

**By:** Code Review Agents

**Actions:**
- kieran-typescript-reviewer identified parameter naming issue
- agent-native-reviewer noted missing fields limit agent capability
- Documented complete fix approach

**Learnings:**
- API design affects agent usability significantly
- Early cleanup is easier than later migration
