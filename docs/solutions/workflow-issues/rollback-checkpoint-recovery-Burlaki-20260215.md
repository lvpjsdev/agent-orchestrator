---
module: Burlaki
date: 2026-02-15
problem_type: workflow_issue
component: tooling
symptoms:
  - Users must manually find checkpoints and run git commands
  - No automated way to revert to previous workflow states
  - Risk of data loss from uncommitted changes during manual rollback
root_cause: missing_tooling
resolution_type: tooling_addition
severity: medium
tags: [rollback, checkpoint, recovery, git, workflow]
---

# Troubleshooting: Rollback Checkpoint Recovery

## Problem

Users had no automated way to revert to previous checkpoints when a story implementation goes wrong, a phase produces incorrect artifacts, or drift is detected. Manual git operations were error-prone and could cause data loss.

## Environment

- Module: Burlaki Workflow System
- Affected Component: CLI tooling, workflow commands
- Date: 2026-02-15

## Symptoms

- Users must manually run `git log --grep "[burlaki-checkpoint]"` to find checkpoints
- Manual `git reset --hard` commands risk losing uncommitted work
- No preview of what commits will be lost before executing rollback
- No validation of PRD file integrity after rollback
- No built-in recovery path if rollback goes wrong

## What Didn't Work

**Attempted Solution 1: Custom backup system with `.burlaki/` directory**
- **Why it failed:** DHH review feedback: "Git already has reflog, ORIG_HEAD. Stop duplicating."

**Attempted Solution 2: Three-tier safety model with file locking**
- **Why it failed:** Architecture review: "Pipeline pattern is sound, but don't over-engineer. 75% reduction possible."

**Attempted Solution 3: Complex `RollbackTransaction` class with operation log**
- **Why it failed:** Over-engineered for the actual use case. Simpler solution exists using Git's built-in features.

## Solution

Created `/burlaki-rollback` command that wraps `git reset --hard` with safety checks and nice UX.

**Pipeline:** DETECT → VALIDATE → PREVIEW → CONFIRM → EXECUTE → VERIFY

**Usage:**
```bash
/burlaki-rollback --to <target> [--dry-run] [--yes]
```

Where `<target>` is:
- `last-checkpoint` - Most recent `[burlaki-checkpoint]` commit
- `<story-id>` - Find checkpoint for specific story (e.g., `auth-003`)
- `<sha>` - Direct commit SHA (7+ characters)

**Key implementation:**
```bash
# Resolve target to SHA
case "$TARGET" in
  last-checkpoint)
    TARGET_SHA=$(git log --grep='\[burlaki-checkpoint\]' -n 1 --format=%H)
    ;;
  *)
    if [[ "$TARGET" =~ ^[0-9a-f]{7,}$ ]]; then
      TARGET_SHA=$(git rev-parse --verify "$TARGET^{commit}")
    else
      TARGET_SHA=$(git log --grep="\[burlaki-checkpoint\]" --grep="$TARGET" --all-match -n 1 --format=%H)
    fi
    ;;
esac

# Block if dirty working directory
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: Working directory has uncommitted changes"
  exit 1
fi

# Execute with safety
git reset --hard "$TARGET_SHA"
```

## Why This Works

1. **Root cause:** Missing tooling for common rollback operations
2. **Solution approach:** Wrap Git's built-in reset with validation pipeline
3. **Key insight:** Git already provides ORIG_HEAD and reflog for recovery—no need for custom backup system

The solution leverages Git's built-in recovery mechanisms:
- `ORIG_HEAD` is automatically set by `git reset --hard` for undo
- `git reflog` provides full history of HEAD changes
- This eliminates need for custom `.burlaki/` backup directory

## Prevention

- Always run `--dry-run` first to preview changes
- Commit or stash changes before rollback (enforced by validation)
- Keep checkpoints frequent with `/burlaki-continue`
- Recovery command shown in output: `git reset --hard ORIG_HEAD`

## Related Issues

No related issues documented yet.

## References

- Checkpoint creation: `prompts/codex/burlaki-continue.md`
- Git reset: https://git-scm.com/docs/git-reset
- Git reflog: https://git-scm.com/docs/git-reflog
