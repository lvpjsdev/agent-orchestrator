---
status: complete
priority: p2
issue_id: 008
tags: [code-review, roadmap, versioning, semver]
dependencies: []
created: 2026-02-15
---

# Non-Standard Version Numbering Sequence

## Problem Statement

The version sequence v0.1 → v0.1.5 → v0.2 → v0.2.5 → v0.3 → v0.4 → v0.5 is non-standard and confusing. Standard semver uses MAJOR.MINOR.PATCH (e.g., 0.1.0, 0.2.0).

## Findings

**Location:** Throughout ROADMAP_full.md

**Current sequence:**
```
v0.1 → v0.1.5 → v0.2 → v0.2.5 → v0.3 → v0.4 → v0.5
```

**Issues:**
1. v0.1.5 implies a patch between v0.1 and v0.2, but it's a minor feature set
2. v0.2.5 exists between v0.2 and v0.3 - confusing for semver users
3. No patch version (X.Y.Z) used anywhere
4. Version reordering (v0.3/v0.4) adds confusion

**Best Practice (Semantic Versioning):**
- MAJOR.MINOR.PATCH (e.g., 0.1.0, 0.2.0)
- 0.x.x = initial development
- PATCH = backwards-compatible fixes
- MINOR = backwards-compatible features

## Proposed Solutions

### Option 1: Standardize to X.Y.Z (Recommended)
```
v0.1.0 → v0.2.0 → v0.3.0 → v0.4.0 → v0.5.0 → 1.0.0
```
Consolidate v0.1.5 into v0.2.0, v0.2.5 into v0.3.0.
- **Pros:** Industry standard, clear progression
- **Cons:** Requires renumbering document
- **Effort:** Medium
- **Risk:** Low

### Option 2: Keep current, add explanation
Add note explaining the non-standard numbering:
> "Note: Versions use feature-based numbering. v0.1.5 = 'between v0.1 and v0.2 features'"
- **Pros:** No renumbering needed
- **Cons:** Still non-standard, confusing
- **Effort:** Small
- **Risk:** Low

### Option 3: Use milestone names instead
```
Core → CLI Foundation → Enhanced Recovery → Learning System → Parallel → Multi-Project
```
- **Pros:** No version confusion
- **Cons:** Loses version ordering
- **Effort:** Medium
- **Risk:** Medium

## Recommended Action

Option 1: Standardize to semver X.Y.Z format:
- v0.1.0 (Core) - Complete
- v0.2.0 (Enhanced Recovery + CLI Foundation) - In Progress
- v0.3.0 (Learning System)
- v0.4.0 (Parallel Execution)
- v0.5.0 (Multi-Project)

## Technical Details

**Affected Files:**
- ROADMAP_full.md (all version headers)

## Acceptance Criteria

- [ ] All versions use X.Y.Z format
- [ ] Add semver compliance statement
- [ ] Version milestone table added

## Work Log

| Date | Action | Result |
|------|--------|--------|
| 2026-02-15 | Best practices review identified issue | Finding documented |

## Resources

- [Semantic Versioning 2.0.0](https://semver.org)
