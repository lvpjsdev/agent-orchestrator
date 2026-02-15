---
status: complete
priority: p1
issue_id: 003
tags: [code-review, roadmap, architecture, versioning]
dependencies: []
created: 2026-02-15
---

# PRD Schema Versioning in Wrong Version

## Problem Statement

PRD schema versioning is placed in v0.2.5 (lines 213-219) but should be in v0.1.5 or earlier. Without schema versioning from day one, you'll need migrations for existing PRDs.

## Findings

**Location:** ROADMAP_full.md lines 213-219

**Current placement:**
```markdown
### v0.2.5 — Foundational Pieces (NEW)
- [ ] **PRD Schema Versioning** — Prevent migration issues
```

**Issue:**
- v0.1 already creates PRD files (without versioning)
- Adding versioning later creates backward compatibility debt
- Migration cost increases with number of existing PRDs

**Recommended placement:**
```markdown
### v0.1.5 — CLI Foundation
- [ ] Add `--json` output to all commands
- [ ] **PRD Schema Versioning** ← MOVE HERE
- [ ] Add `burlaki status` command
```

## Proposed Solutions

### Option 1: Move to v0.1.5 (Recommended)
Add PRD schema versioning to CLI Foundation milestone.
- **Pros:** Prevents migration debt, done before PRDs proliferate
- **Cons:** Adds scope to v0.1.5
- **Effort:** Small (just roadmap change)
- **Risk:** Low

### Option 2: Create migration script in v0.2.5
Keep current placement but create migration for existing PRDs.
- **Pros:** Keeps v0.1.5 focused
- **Cons:** Technical debt, migration complexity
- **Effort:** Medium
- **Risk:** Medium

### Option 3: Version all new PRDs, migrate on-demand
Add version to new PRDs, migrate old ones when accessed.
- **Pros:** Lazy migration
- **Cons:** Inconsistent state, complexity
- **Effort:** Medium
- **Risk:** Medium

## Recommended Action

Option 1: Move PRD Schema Versioning from v0.2.5 to v0.1.5.

## Technical Details

**Affected Files:**
- ROADMAP_full.md (move content from lines 213-219 to v0.1.5 section)

**Schema change:**
```json
{
  "schema_version": "1.0.0",
  "version": 1,
  "stories": [...]
}
```

## Acceptance Criteria

- [ ] PRD schema versioning moved to v0.1.5 section
- [ ] v0.2.5 updated to remove duplicated item
- [ ] Schema version format documented

## Work Log

| Date | Action | Result |
|------|--------|--------|
| 2026-02-15 | Architecture review identified issue | Finding documented |

## Resources

- Related: Architecture-strategist review finding
