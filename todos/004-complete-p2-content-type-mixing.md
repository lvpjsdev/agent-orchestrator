---
status: complete
priority: p2
issue_id: 004
tags: [code-review, roadmap, documentation, structure]
dependencies: []
created: 2026-02-15
---

# Implementation Details in Roadmap

## Problem Statement

ROADMAP_full.md mixes three different document types: roadmap (what/when), architecture doc (how/design), and implementation specs (code examples). This violates single-responsibility principle for documentation.

## Findings

**Location:** Throughout ROADMAP_full.md

**Content that belongs elsewhere:**

| Content | Lines | Belongs In |
|---------|-------|------------|
| Pipeline pattern tables | 35-44 | Architecture doc |
| Status protocol YAML | 47-59 | Spec doc |
| CLI flag conventions | 75-107 | README or CLI doc |
| JSON schemas | 142-240 | Spec files |
| Pattern extraction code | 259-310 | Design doc |
| Worker pool code | 339-405 | Implementation |
| OpenTelemetry configs | 476-490 | Observability plan |

**Issue:**
- Roadmap should define WHAT features to build and WHEN
- Implementation details should be in separate design/spec documents
- Current approach creates maintenance burden

## Proposed Solutions

### Option 1: Extract to separate docs (Recommended)
Create separate documentation files:
- `docs/architecture.md` - Architecture principles, patterns
- `docs/specs/cli.md` - CLI conventions, flags, exit codes
- `docs/specs/prd-schema.md` - PRD JSON schema
- `docs/design/learning-system.md` - Pattern extraction design
- `docs/design/parallel-execution.md` - Worker pool design

Roadmap keeps only: feature names, status, dependencies
- **Pros:** Clean separation, easier maintenance
- **Cons:** More files, context switching
- **Effort:** Large
- **Risk:** Low

### Option 2: Keep but reorganize
Add clear section separators and "See implementation details below" markers.
- **Pros:** Single file, less context switching
- **Cons:** Still conflates concerns
- **Effort:** Medium
- **Risk:** Low

### Option 3: Accept current structure
Document the hybrid approach, add table of contents.
- **Pros:** No work needed
- **Cons:** Technical documentation debt
- **Effort:** None
- **Risk:** Medium (maintainability)

## Recommended Action

Option 2 for now: Add clear section headers distinguishing roadmap items from implementation notes. Consider Option 1 before v1.0.0.

## Technical Details

**Affected Files:**
- ROADMAP_full.md (restructure or extract)

**Suggested structure:**
```markdown
# Burlaki Roadmap

[Status sections only]

---
# Appendix: Architecture Principles
[Move architecture content here]

---
# Appendix: Implementation Notes
[Move code examples here]
```

## Acceptance Criteria

- [ ] Roadmap sections clearly separated from implementation details
- [ ] Or: Content extracted to appropriate documentation files
- [ ] Table of contents updated if structure changes

## Work Log

| Date | Action | Result |
|------|--------|--------|
| 2026-02-15 | Code review identified issue | Finding documented |

## Resources

- DHH principle: "Start with MVP"
- Single Responsibility Principle applied to documentation
