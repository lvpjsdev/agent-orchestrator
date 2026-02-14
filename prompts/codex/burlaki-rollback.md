---
description: Rollback to a previous checkpoint with safety checks
argument-hint: "--to <target> [--dry-run] [--yes]"
---

# Burlaki Rollback — Revert to Previous Checkpoint

Rollback the workflow to a previous checkpoint, story state, or specific commit. Uses Git's built-in recovery mechanisms (ORIG_HEAD, reflog).

## Input

- `--to <target>` — Rollback target (required):
  - `last-checkpoint` — Most recent `[burlaki-checkpoint]` commit
  - `<story-id>` — Find checkpoint for specific story (e.g., `auth-003`)
  - `<sha>` — Direct commit SHA (7+ characters)
- `--dry-run` — Show preview without making changes
- `--yes` — Skip confirmation prompt (for automation)

## Architecture

**Pipeline:** DETECT → VALIDATE → PREVIEW → CONFIRM → EXECUTE → VERIFY

## Execution

### Phase 1: Detect Target

**Goal:** Resolve the target to a valid commit SHA.

```bash
TARGET="${1#--to=}"

# Validate target provided
if [ -z "$TARGET" ]; then
  echo "Error: --to <target> is required"
  echo ""
  echo "Usage: /burlaki-rollback --to <target>"
  echo ""
  echo "Targets:"
  echo "  last-checkpoint  Most recent checkpoint"
  echo "  <story-id>       Checkpoint for specific story"
  echo "  <sha>            Direct commit SHA"
  exit 2
fi

# Resolve target to SHA
case "$TARGET" in
  last-checkpoint)
    TARGET_SHA=$(git log --grep='\[burlaki-checkpoint\]' -n 1 --format=%H 2>/dev/null)
    if [ -z "$TARGET_SHA" ]; then
      echo "Error: No checkpoints found"
      echo ""
      echo "Create a checkpoint first by running /burlaki-continue"
      exit 1
    fi
    ;;
  *)
    # Check if it's a valid SHA (7+ hex characters)
    if [[ "$TARGET" =~ ^[0-9a-f]{7,}$ ]]; then
      TARGET_SHA=$(git rev-parse --verify "$TARGET^{commit}" 2>/dev/null)
      if [ -z "$TARGET_SHA" ]; then
        echo "Error: Commit not found: $TARGET"
        exit 1
      fi
    else
      # Treat as story ID - find checkpoint with story reference
      TARGET_SHA=$(git log --grep="\[burlaki-checkpoint\]" --grep="$TARGET" --all-match -n 1 --format=%H 2>/dev/null)
      if [ -z "$TARGET_SHA" ]; then
        echo "Error: No checkpoint found for story: $TARGET"
        echo ""
        # List available story IDs from PRD
        if [ -f ".agents/tasks/prd.json" ]; then
          echo "Available stories:"
          jq -r '.stories[].id' .agents/tasks/prd.json 2>/dev/null | sed 's/^/  - /'
        fi
        exit 1
      fi
    fi
    ;;
esac

TARGET_SHORT=$(git rev-parse --short "$TARGET_SHA")
echo "Target: $TARGET_SHORT"
```

### Phase 2: Validate

**Goal:** Ensure rollback is safe to perform.

```bash
# Check if already at target
CURRENT_SHA=$(git rev-parse HEAD)
if [ "$CURRENT_SHA" = "$TARGET_SHA" ]; then
  echo ""
  echo "Already at target checkpoint: $TARGET_SHORT"
  echo "No changes needed."
  exit 0
fi

# Check working directory
DIRTY=$(git status --porcelain)
if [ -n "$DIRTY" ]; then
  echo ""
  echo "Error: Working directory has uncommitted changes"
  echo ""
  echo "Uncommitted files:"
  echo "$DIRTY" | head -10 | sed 's/^/  /'
  echo ""
  echo "Options:"
  echo "  1. Commit or stash changes, then retry"
  echo "  2. Use --force to discard changes (not recommended)"
  exit 1
fi

echo "✓ Working directory clean"
```

### Phase 3: Preview

**Goal:** Show what will change.

```bash
# Count commits to be lost
COMMITS_TO_LOSE=$(git rev-list --count HEAD "^$TARGET_SHA")

# Get commit list
COMMITS=$(git log --oneline HEAD "^$TARGET_SHA" | head -10)

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Rollback Preview"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "From: $(git rev-parse --short HEAD) (current)"
echo "To:   $TARGET_SHORT (target)"
echo ""
echo "Commits to lose: $COMMITS_TO_LOSE"

if [ "$COMMITS_TO_LOSE" -gt 0 ]; then
  echo ""
  echo "Will discard these commits:"
  echo "$COMMITS" | sed 's/^/  /'
  if [ "$COMMITS_TO_LOSE" -gt 10 ]; then
    echo "  ... and $((COMMITS_TO_LOSE - 10)) more"
  fi
fi

# Show affected files
FILES_CHANGED=$(git diff --stat "$TARGET_SHA" HEAD | tail -1)
echo ""
echo "Files affected: $FILES_CHANGED"
```

### Phase 4: Confirm

**Goal:** Get user approval before destructive operation.

```bash
# Skip if --dry-run
if [ "$DRY_RUN" = true ]; then
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "DRY RUN — No changes made"
  echo "═══════════════════════════════════════════════════════════════"
  exit 0
fi

# Skip if --yes
if [ "$YES" != true ]; then
  echo ""
  echo "This will reset HEAD, index, and working tree to $TARGET_SHORT"
  echo ""
  
  # Use AskUserQuestion tool
  Question: "Proceed with rollback? This cannot be easily undone."
  
  Options:
  1. Yes, rollback to $TARGET_SHORT
  2. Cancel
  
  If user selects "Cancel":
    echo "Rollback cancelled."
    exit 0
fi
```

### Phase 5: Execute

**Goal:** Perform the git reset.

```bash
echo ""
echo "Rolling back to $TARGET_SHORT..."

# Execute reset
git reset --hard "$TARGET_SHA"

echo "✓ Git reset complete"
```

### Phase 6: Verify

**Goal:** Ensure state is valid after rollback.

```bash
PRD=".agents/tasks/prd.json"

# Verify PRD if it exists
if [ -f "$PRD" ]; then
  if jq empty "$PRD" 2>/dev/null; then
    echo "✓ PRD is valid JSON"
  else
    echo ""
    echo "⚠ Warning: PRD file may be corrupted"
    echo "File: $PRD"
    echo ""
    echo "Consider restoring from a previous checkpoint or recreating."
  fi
fi

# Show recovery info
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Rollback Complete"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Current: $TARGET_SHORT"
echo ""
echo "Recovery:"
echo "  Undo: git reset --hard ORIG_HEAD"
echo "  History: git reflog"
echo ""
```

## Edge Cases

### No Checkpoints Found

```
Error: No checkpoints found

Create a checkpoint first by running /burlaki-continue
```

### Story Not Found

```
Error: No checkpoint found for story: xyz-999

Available stories:
  - auth-001
  - auth-002
  - auth-003
```

### Already at Target

```
Already at target checkpoint: abc1234
No changes needed.
```

### Dirty Working Directory

```
Error: Working directory has uncommitted changes

Uncommitted files:
  M src/auth.rb
  ?? temp.txt

Options:
  1. Commit or stash changes, then retry
  2. Use --force to discard changes (not recommended)
```

### PRD Corrupted After Rollback

```
⚠ Warning: PRD file may be corrupted
File: .agents/tasks/prd.json

Consider restoring from a previous checkpoint or recreating.
```

## Recovery

Git provides automatic recovery mechanisms:

```bash
# Undo last rollback
git reset --hard ORIG_HEAD

# View recent HEAD changes
git reflog

# Find specific checkpoint
git log --grep='\[burlaki-checkpoint\]' --oneline
```

## Examples

```bash
# Rollback to most recent checkpoint
/burlaki-rollback --to last-checkpoint

# Preview without changes
/burlaki-rollback --to last-checkpoint --dry-run

# Rollback to specific story
/burlaki-rollback --to auth-003

# Rollback to specific commit
/burlaki-rollback --to abc1234

# Skip confirmation (automation)
/burlaki-rollback --to last-checkpoint --yes
```

## Output Summary

```
═══════════════════════════════════════════════════════════════
Rollback Complete
═══════════════════════════════════════════════════════════════

Current: abc1234

Recovery:
  Undo: git reset --hard ORIG_HEAD
  History: git reflog
```
