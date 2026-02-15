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

The `--parallel` flag is documented in `burlaki-run.md` (lines 4, 402-425) but the roadmap shows v0.4 Parallel Execution as "not started". Users may expect parallel execution to work when it doesn't.

## Findings

**Location:**

- `prompts/codex/burlaki-run.md` — `--parallel` flag in argument-hint and documentation
- `ROADMAP_full.md` — v0.4 Parallel Execution marked as "not started"

**Evidence:**

- Parallel feature documented in prompts but not implemented
- This violates the principle of documented behavior matching implementation

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
- `prompts/codex/burlaki-run.md`
- `prompts/claude/burlaki-run/SKILL.md` (if exists)
- `prompts/opencode/burlaki-run/SKILL.md` (if exists)

## Acceptance Criteria

- [ ] Remove `--parallel` from argument-hint in all burlaki-run docs
- [ ] Remove or comment out parallel execution section (lines 402-425)
- [ ] Roadmap accurately reflects implementation status

## Work Log

| Date | Action | Result |
|------|--------|--------|
| 2026-02-15 | Code review identified issue | Finding documented |

## Resources

- Related: ROADMAP_full.md v0.4 Parallel Execution section
