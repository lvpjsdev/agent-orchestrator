---
status: pending
priority: p3
issue_id: "019"
tags: [code-review, cleanup, documentation]
dependencies: []
---

# Minor Code Quality Improvements

Collection of minor issues that don't block merge but improve code quality.

## Problem Statement

Several minor issues identified during review:
1. Unnecessary shebang in library module
2. Missing `@throws`/error documentation in JSDoc
3. `fallback: true` property may be unused (YAGNI)
4. `stage` option accepted but not used in `createTask`
5. Repeated error construction could be DRY'd
6. Platform-specific `which` command

## Findings

| Issue | Location | Impact |
|-------|----------|--------|
| Shebang in library | Line 1 | Misleading |
| Missing error docs | Multiple | Poor discoverability |
| `fallback` flag | All error returns | Possible YAGNI |
| Unused `stage` option | Line 125 | YAGNI |
| DRY error results | 5 locations | Minor duplication |
| `which` command | Line 17 | Windows incompatible |

## Proposed Solutions

### Option 1: Fix All Issues

**Approach:** Address all 6 issues in one pass.

1. Remove shebang (line 1)
2. Add error documentation to JSDoc
3. Verify if `fallback` is consumed; remove if not
4. Remove or implement `stage` option
5. Add `errorResult()` helper
6. Use cross-platform CLI check

**Pros:**
- Complete cleanup
- Better maintainability

**Cons:**
- More changes to review

**Effort:** 30 minutes

**Risk:** Low

---

### Option 2: Fix Only Clear Issues

**Approach:** Fix items 1, 4, 5 (definite issues).

1. Remove shebang
2. Remove unused `stage` option
3. Add `errorResult()` helper

**Pros:**
- Smaller change set
- Clear improvements

**Cons:**
- Incomplete

**Effort:** 15 minutes

**Risk:** Low

---

### Option 3: Document for Future

**Approach:** Add comments noting issues for later.

**Pros:**
- No immediate change

**Cons:**
- Technical debt remains

**Effort:** 5 minutes

**Risk:** None

## Recommended Action

**Option 2** - Fix clear issues now, defer documentation and platform compatibility to follow-up.

## Technical Details

**Affected files:**
- `scripts/beads-client.mjs:1` - Remove shebang
- `scripts/beads-client.mjs:90,125` - Remove `stage` option
- `scripts/beads-client.mjs:71-76,105-111,148-154,168-174,179-181` - Add helper

**errorResult helper:**
```javascript
function errorResult(error) {
  return { ok: false, error, fallback: true };
}
```

## Acceptance Criteria

- [ ] No shebang in library module
- [ ] `stage` option removed or implemented
- [ ] Error result construction DRY'd
- [ ] Code still functions correctly

## Work Log

### 2026-02-19 - Code Review Discovery

**By:** Multiple Review Agents

**Actions:**
- kieran-typescript-reviewer: shebang, missing docs
- code-simplicity-reviewer: YAGNI issues, DRY opportunity
- security-sentinel: platform compatibility

**Learnings:**
- Multiple minor issues compound
- Early cleanup prevents accumulation
