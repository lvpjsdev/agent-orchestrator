---
status: complete
priority: p2
issue_id: 006
tags: [code-review, roadmap, yagni, architecture]
dependencies: []
created: 2026-02-15
---

# v0.2.5 Foundational Pieces Appears to be YAGNI

## Problem Statement

v0.2.5 "Foundational Pieces" (lines 197-241) adds infrastructure before proving need. This violates YAGNI (You Aren't Gonna Need It) principle.

## Findings

**Location:** ROADMAP_full.md lines 197-241

**Items flagged as YAGNI:**

| Item | Why It's YAGNI |
|------|----------------|
| Event Store (`.agents/events.jsonl`) | What events? Build when you have events to store |
| Story-Level Lock Resources | Premature optimization for parallel execution that doesn't exist yet |
| Unified Metrics Schema | No metrics being collected yet |

**Counter-argument:**
PRD Schema Versioning is NOT YAGNI - it's needed immediately (moved to separate P1 finding).

**DHH Principle Quote:**
> "Git already has reflog, ORIG_HEAD. Stop duplicating."

Apply the "75% reduction" lesson: Start with MVP, add infrastructure when needed.

## Proposed Solutions

### Option 1: Delete v0.2.5 entirely (Aggressive)
Move PRD schema versioning to v0.1.5, delete rest.
- **Pros:** Maximum simplicity, follows YAGNI strictly
- **Cons:** May need to rebuild later
- **Effort:** Small
- **Risk:** Medium (might need later)

### Option 2: Defer to when needed (Moderate - Recommended)
Keep items but move to "Future Considerations" as potential needs.
- **Pros:** Documents thinking without committing
- **Cons:** Still adds noise
- **Effort:** Small
- **Risk:** Low

### Option 3: Keep but document as "proactive" (Conservative)
Add rationale for why these are built ahead of time.
- **Pros:** Preserves planning
- **Cons:** Still YAGNI
- **Effort:** Small
- **Risk:** Low

## Recommended Action

Option 2: Move v0.2.5 items (except PRD schema versioning) to Future Considerations as "Potential Infrastructure Needs".

## Technical Details

**Affected Files:**
- ROADMAP_full.md (lines 197-241)

**Changes:**
- Move PRD Schema Versioning to v0.1.5 (separate P1 finding)
- Rename v0.2.5 to "Optional Infrastructure" or move to Future Considerations

## Acceptance Criteria

- [ ] v0.2.5 either removed or moved to Future Considerations
- [ ] PRD Schema Versioning handled separately (P1 finding)
- [ ] Rationale documented if keeping any items

## Work Log

| Date | Action | Result |
|------|--------|--------|
| 2026-02-15 | Code review identified issue | Finding documented |

## Resources

- YAGNI principle
- DHH "75% reduction" principle from rollback implementation
