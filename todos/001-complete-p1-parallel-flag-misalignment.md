---
status: complete
priority: p1
issue_id: 001
tags: [code-review, roadmap, misalignment, cli]
dependencies: []
created: 2026-02-15
---
# Parallel Flag Code/Roadmap Misalignment

## Problem Statement
The `--parallel` flag is documented in `burlaki-run.md` (lines 4, 402-425) but roadmap shows v0.4 Parallel Execution as "not started". Users may expect parallel execution to work when it doesn't.

## Findings
**Location:**
- `prompts/codex/burlaki-run.md` — `--parallel` flag in argument-hint and documentation
- `ROADMAP_full.md` — v0.4 Parallel Execution marked as "not started"

**Evidence:**
- Parallel feature documented in prompts but not implemented
- This violates principle of documented behavior matching implementation

## Proposed Solutions
### Option 1: Remove flag until implemented (Recommended)
- **Pros:** Clean separation of shipped vs planned features
- **Cons:** Loses documentation of planned feature
- **Effort:** Small
- **Risk:** Low

### Option 2: Add "reserved" note
```text
--parallel N    # (Reserved for v0.4) Currently ignored
```
- **Pros:** Documents intent without promising functionality
- **Cons:** Users might still try to use it
- **Effort:** Small
- **Risk:** Low

### Option 3: Move to roadmap only
Remove from command docs, document only in roadmap as planned feature.
- **Pros:** Clear separation
- **Cons:** Less discoverable
- **Effort:** Small
- **Risk:** Low

## Recommended Action
Option 1: Remove `--parallel` from `burlaki-run.md` argument-hint and documentation until v0.4 is actively developed.

## Technical Details
**Affected Files:**
- `prompts/codex/burlaki-run.md` (lines 4, 272, 402-425)
- `ROADMAP_full.md` (removed entire v0.4.0 section lines 183-228)

## Acceptance Criteria
- [x] Remove `--parallel` from argument-hint in all burlaki-run docs
- [x] Remove or comment out parallel execution section (lines 402-425)
- [x] Roadmap accurately reflects implementation status

## Work Log
| Date | Action | Result |
|------|--------|--------|
| 2026-02-18 | Direct execution completed | Removed --parallel from burlaki-run.md and deleted v0.4.0 section from roadmap |

## Resources
- Related: ROADMAP_full.md v0.4 Parallel Execution section
