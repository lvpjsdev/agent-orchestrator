---
status: complete
priority: p1
issue_id: 002
tags: [code-review, roadmap, changelog, documentation]
dependencies: []
created: 2026-02-15
---

# Changelog Not Following Keep a Changelog Standards

## Problem Statement

The changelog in ROADMAP_full.md (lines 531-558) uses date-based headers instead of version-based headers, lacks change type categories (Added/Changed/Fixed/etc.), and doesn't follow industry-standard changelog format.

## Findings

**Location:** ROADMAP_full.md lines 531-558

**Current format:**
```markdown
### 2026-02-15 (Enhanced)
- Version reordering...
- New: v0.2.5 Foundational Pieces...
```

**Issues:**
1. No version headers (e.g., `[0.2.0]`)
2. No change type categories (Added, Changed, Fixed, Security)
3. Hard to correlate with releases
4. Missing comparison links

**Best Practice (Keep a Changelog):**
- Changelogs are for humans, not machines
- Entry for every single version
- Same types of changes grouped
- Latest version comes first

## Proposed Solutions

### Option 1: Full Keep a Changelog format (Recommended)
```markdown
## [0.2.0] - 2026-03-XX (Unreleased)

### Added
- /burlaki-rollback command with checkpoint recovery

### Changed
- Reordered roadmap versions

## [0.1.0] - 2026-02-14

### Added
- /burlaki-start, /burlaki-run, /burlaki-continue
```
- **Pros:** Industry standard, machine-parseable, clear
- **Cons:** More verbose
- **Effort:** Small
- **Risk:** Low

### Option 2: Add version headers only
Keep current format but add version headers.
- **Pros:** Minimal change
- **Cons:** Still missing change types
- **Effort:** Small
- **Risk:** Low

### Option 3: Move to CHANGELOG.md
Create separate CHANGELOG.md file, remove from roadmap.
- **Pros:** Follows convention, keeps roadmap focused
- **Cons:** Another file to maintain
- **Effort:** Medium
- **Risk:** Low

## Recommended Action

Option 1: Restructure changelog to follow Keep a Changelog format with version headers and change type categories.

## Technical Details

**Affected Files:**
- ROADMAP_full.md (lines 531-558)
- Consider: Create CHANGELOG.md

## Acceptance Criteria

- [ ] Changelog uses version headers (e.g., `## [0.2.0]`)
- [ ] Changes grouped by type (Added, Changed, Fixed, etc.)
- [ ] Add semver declaration at top
- [ ] Include comparison links (optional)

## Work Log

| Date | Action | Result |
|------|--------|--------|
| 2026-02-15 | Code review identified issue | Finding documented |

## Resources

- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
- [Semantic Versioning](https://semver.org)
