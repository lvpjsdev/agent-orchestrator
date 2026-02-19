---
status: complete
priority: p1
issue_id: "011"
tags: [code-review, typescript, jsdoc]
dependencies: []
---

# Fix Invalid JSDoc Type Import Paths

JSDoc imports reference `../src/index.js` but the actual file is `../src/index.ts`, breaking TypeScript/JSDoc type checking.

## Problem Statement

The `beads-client.mjs` module uses JSDoc type imports that point to non-existent `.js` files instead of the actual TypeScript source files. This breaks:
- IDE type hints and autocomplete
- TypeScript language server integration
- AI agent understanding of return types

## Findings

- **Location:** Lines 66, 91, 134, 163 in `scripts/beads-client.mjs`
- Current: `@returns {Promise<import('../src/index.js').BeadsClientResult<...>>}`
- Actual file: `src/index.ts`
- Impact: All 4 function return type annotations are broken

## Proposed Solutions

### Option 1: Change Extension to .ts

**Approach:** Update all JSDoc imports to reference `.ts` extension.

```javascript
@returns {Promise<import('../src/index.ts').BeadsClientResult<...>>}
```

**Pros:**
- Minimal change
- Accurate reference

**Cons:**
- Non-standard (JSDoc typically references .js)
- May confuse some tooling

**Effort:** 5 minutes

**Risk:** Low

---

### Option 2: Create Types Re-export File

**Approach:** Create a `src/types.js` with JSDoc typedefs that mirrors the TypeScript types.

**Pros:**
- Standard JSDoc pattern
- Clean separation

**Cons:**
- Duplication of types
- Maintenance burden

**Effort:** 30 minutes

**Risk:** Low

---

### Option 3: Use Relative Path Without Extension

**Approach:** Omit extension entirely in imports.

```javascript
@returns {Promise<import('../src/index').BeadsClientResult<...>>}
```

**Pros:**
- Works with module resolution
- Cleaner

**Cons:**
- May not work with all tooling

**Effort:** 5 minutes

**Risk:** Low

## Recommended Action

**Option 1 or 3** - Change to `.ts` or omit extension. Quick fix with minimal risk.

## Technical Details

**Affected files:**
- `scripts/beads-client.mjs:66` - `listReadyTasks` return type
- `scripts/beads-client.mjs:91` - `createTask` return type
- `scripts/beads-client.mjs:134` - `updateTask` return type
- `scripts/beads-client.mjs:163` - `showTask` return type

## Acceptance Criteria

- [ ] All JSDoc imports resolve correctly
- [ ] IDE shows proper type hints for all functions
- [ ] No TypeScript/JSDoc errors reported

## Work Log

### 2026-02-19 - Code Review Discovery

**By:** Code Review Agents

**Actions:**
- Identified broken type imports during kieran-typescript-reviewer audit
- Confirmed by agent-native-reviewer as blocking agent usage
- Documented fix options

**Learnings:**
- Multiple agents flagged this as critical for type safety
