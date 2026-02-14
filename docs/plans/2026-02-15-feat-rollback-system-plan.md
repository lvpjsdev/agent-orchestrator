---
title: feat: Rollback System (v0.2)
type: feat
date: 2026-02-15
---

# feat: Rollback System (v0.2)

## Overview

A simple rollback command that wraps `git reset --hard` with safety checks and nice UX. Uses Git's built-in recovery mechanisms (ORIG_HEAD, reflog) instead of building custom infrastructure.

## Problem Statement

Users need to revert to previous checkpoints when:
- A story implementation goes wrong
- A phase produces incorrect artifacts
- Drift is detected and reset is needed

Currently, users must manually find checkpoints and run git commands.

## Proposed Solution

```bash
/burlaki-rollback --to <target>
```

Where `<target>` is:
- `last-checkpoint` - Most recent `[burlaki-checkpoint]` commit
- `<story-id>` - Find checkpoint for specific story (e.g., `auth-003`)
- `<sha>` - Direct commit SHA

**Example:**
```bash
/burlaki-rollback --to last-checkpoint
/burlaki-rollback --to auth-003
/burlaki-rollback --to abc1234
/burlaki-rollback --to last-checkpoint --dry-run
```

## Technical Approach

### Pipeline

```text
DETECT → VALIDATE → PREVIEW → CONFIRM → EXECUTE → VERIFY
```

### Implementation

```bash
# 1. Resolve target to SHA
TARGET_SHA=$(git log --grep "[burlaki-checkpoint]" -n 1 --format=%H)  # or story-id/SHA

# 2. Check working directory
if ! git diff --quiet; then
  echo "Error: Working directory has uncommitted changes"
  echo "Commit or stash changes before rollback"
  exit 1
fi

# 3. Show preview
COMMITS_TO_LOSE=$(git rev-list --count HEAD ^$TARGET_SHA)
echo "Will reset from HEAD to $TARGET_SHA ($COMMITS_TO_LOSE commits will be lost)"

# 4. Confirm (skip with --yes)
echo "Continue? [y/N]"
read CONFIRM
if [[ "$CONFIRM" != "y" ]]; then
  exit 0
fi

# 5. Execute
git reset --hard $TARGET_SHA

# 6. Verify PRD
if ! jq empty .agents/tasks/prd.json 2>/dev/null; then
  echo "Warning: PRD file may be corrupted"
fi

echo "Rollback complete. Recovery: git reset --hard ORIG_HEAD"
```

### File to Create

```text
prompts/codex/burlaki-rollback.md
```

## Acceptance Criteria

### Core

- [ ] `/burlaki-rollback --to last-checkpoint` finds and rolls back to most recent checkpoint
- [ ] `/burlaki-rollback --to <story-id>` finds checkpoint mentioning story ID
- [ ] `/burlaki-rollback --to <sha>` rolls back to specific commit
- [ ] `--dry-run` shows preview without making changes

### Safety

- [ ] Blocks if working directory has uncommitted changes
- [ ] Shows confirmation prompt with commit count before executing
- [ ] `--yes` skips confirmation (for automation)

### Post-Rollback

- [ ] Verifies PRD file is valid JSON after rollback
- [ ] Error messages include recovery command (`git reset --hard ORIG_HEAD`)

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No checkpoints found | Error: "No checkpoints found. Create one with /burlaki-continue" |
| Already at target | No-op: "Already at target checkpoint" |
| Invalid story ID | Error: "Story 'xyz' not found. Available: auth-001, auth-002..." |
| PRD corrupted after rollback | Warning + suggest manual restore |

## Recovery

Git provides automatic recovery:
- `git reset --hard ORIG_HEAD` - Undo last rollback
- `git reflog` - View all recent HEAD changes

No custom backup system needed.

## Success Metrics

1. **Recovery Time**: Users can rollback in < 30 seconds
2. **Safety**: Zero data loss from working directory conflicts
3. **Simplicity**: Single command with clear output

## References

### Internal

- Checkpoint creation: `prompts/codex/burlaki-continue.md:149-172`
- Checkpoint discovery: `docs/WORKFLOW_DIAGRAMS.md:204-215`
- PRD structure: `prompts/codex/burlaki-start.md:241-264`

### External

- Git reset: https://git-scm.com/docs/git-reset
- Git reflog: https://git-scm.com/docs/git-reflog

## Review Notes

Simplified from original plan based on technical review feedback:
- **DHH**: "Git already has reflog, ORIG_HEAD. Stop duplicating."
- **Architecture**: "Pipeline pattern is sound, but don't over-engineer."
- **Simplicity**: "75% reduction possible. Start with MVP."

**Cut from original:**
- Custom `.burlaki/` directory structure
- `RollbackTransaction` class
- File locking
- Three-tier safety model
- `--keep-artifacts`
- `burlaki undo`
- `--recover`
- Custom operation log
- Phases 3 and 4
