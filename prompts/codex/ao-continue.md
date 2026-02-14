---
description: Resume interrupted workflow with state validation and checkpoints
argument-hint: "[--validate-only] [--from <phase>] [--no-checkpoint]"
---

# AO Continue — Resume with Validation and Checkpoints

Resume an interrupted compound engineering workflow. Creates restore point before any state modifications.

## Input
- `--validate-only` — Only validate state, don't resume (no checkpoint needed)
- `--from <phase>` — Force resume from specific phase: `brainstorm`, `plan`, `prd`, `run`
- `--no-checkpoint` — Skip checkpoint creation (not recommended)

## Architecture Overview

See [docs/WORKFLOW_DIAGRAMS.md](../../docs/WORKFLOW_DIAGRAMS.md) for visual reference.

**Recovery pipeline:** DETECT → VALIDATE → CHECKPOINT → REPORT → RESUME

## Configuration

```json
// .agents/config.json (optional)
{
  "continue": {
    "severe_drift_action": "ask",
    "checkpoint_prefix": "[ao-checkpoint]"
  }
}
```

**`severe_drift_action` options:**
- `"ask"` — Always ask user (default)
- `"restart"` — Automatically restart workflow from brainstorm
- `"force-continue"` — Continue despite issues

## Execution

### Phase 0: State Detection

**Goal:** Figure out where we are in the workflow.

```bash
# Check artifacts
BRAINSTORM=$(ls -t docs/brainstorms/*.md 2>/dev/null | head -1)
PLAN=$(ls -t docs/plans/*-plan.md 2>/dev/null | head -1)
PRD=".agents/tasks/prd.json"

echo "Artifacts:"
[ -f "$BRAINSTORM" ] && echo "  ✓ Brainstorm: $BRAINSTORM" || echo "  ✗ Brainstorm: NONE"
[ -f "$PLAN" ] && echo "  ✓ Plan: $PLAN" || echo "  ✗ Plan: NONE"
[ -f "$PRD" ] && echo "  ✓ PRD: $PRD" || echo "  ✗ PRD: NONE"

# Check git state
BRANCH=$(git branch --show-current)
DIRTY=$(git status --porcelain)
echo "Git: branch=$BRANCH, working_dir=$([ -z "$DIRTY" ] && echo 'clean' || echo 'dirty')"

# Check PRD story status
if [ -f "$PRD" ]; then
  TOTAL=$(jq '.stories | length' "$PRD" 2>/dev/null || echo 0)
  DONE=$(jq '[.stories[] | select(.status == "done")] | length' "$PRD" 2>/dev/null || echo 0)
  echo "Stories: $DONE/$TOTAL done"
fi
```

**Phase detection logic:**

| Condition | Detected Phase | Action |
|-----------|----------------|--------|
| No brainstorm file | `start` | Run `/ao-start` |
| Brainstorm exists, no plan | `plan` | Run planning phase |
| Plan exists, no PRD | `prd` | Run PRD generation |
| PRD exists, stories pending | `run` | Resume `/ao-run` |
| All stories done | `complete` | Run compound or finish |

**If `--from <phase>` is specified:** Override detection and start from that phase.

### Phase 1: Validation

**Goal:** Verify state consistency between artifacts and reality.

Run validation checks (can be parallel):

**1.1 Code vs PRD consistency:**

```javascript
Task({
  subagent_type: "Explore",
  description: "Validate code vs PRD",
  prompt: `
    Validate code consistency with PRD.
    
    PRD: .agents/tasks/prd.json
    
    Tasks:
    1. Read stories marked as "done"
    2. For each done story, verify:
       - Files mentioned exist
       - Code implements acceptance criteria
       - No obvious gaps
    
    3. Check for untracked code:
       - Files changed but not in any story
       - Stories marked done but incomplete
    
    Output:
    CONSISTENCY: consistent | drifted | unknown
    
    DONE_STORIES_CHECK:
    - <story-id>: VALID | INVALID - <reason>
    
    DRIFT_ISSUES:
    - <issue description>
    
    UNTRACKED_FILES:
    - <file>: <note>
  `
})
```

**1.2 Git state check:**

```bash
# Check recent commits
echo "Recent commits:"
git log --oneline -10

# Check for commits with story references vs without
WITH_REFS=$(git log --oneline --grep='Story:' | wc -l)
WITHOUT_REFS=$(git log --oneline | head -20 | wc -l)
echo "Commits with story refs: $WITH_REFS"

# Branch status vs develop
AHEAD=$(git rev-list --count origin/develop..HEAD 2>/dev/null || echo "?")
BEHIND=$(git rev-list --count HEAD..origin/develop 2>/dev/null || echo "?")
echo "Branch vs develop: ahead=$AHEAD, behind=$BEHIND"
```

**1.3 Tag/status accuracy:**

Check that story statuses in PRD match reality:
- `done` stories should have corresponding commits
- `in_progress` stories should have recent activity
- `blocked` stories should have blocker documented

### Phase 2: Checkpoint (if changes needed)

**Create checkpoint if:**
- Validation found drift issues, OR
- Resuming with `--from` override, OR
- Not using `--validate-only`

```bash
CHECKPOINT_MSG="[ao-checkpoint] Pre-continue snapshot

State:
- Phase: $DETECTED_PHASE
- Stories: $DONE/$TOTAL done
- Drift: $DRIFT_STATUS
- Action: $PLANNED_ACTION

Restore: git reset --hard \$(git rev-parse HEAD)"

git add -A
git commit -m "$CHECKPOINT_MSG"

CHECKPOINT_SHA=$(git rev-parse --short HEAD)
echo "✓ Checkpoint: $CHECKPOINT_SHA"
```

### Phase 3: Report

**Consolidate and present findings:**

```
═══════════════════════════════════════════════════════════════
AO Continue — State Report
═══════════════════════════════════════════════════════════════

DETECTED STATE
Phase: run (4/7 stories complete)
Branch: feature/auth
Git: clean

Artifacts:
├── Brainstorm: docs/brainstorms/2026-02-14-auth.md ✓
├── Plan: docs/plans/2026-02-14-feat-auth-plan.md ✓
└── PRD: .agents/tasks/prd.json ✓

VALIDATION
├── Code vs PRD: CONSISTENT ✓
├── Git state: CLEAN ✓
└── Tags: ACCURATE ✓

DRIFT ISSUES: 0
Checkpoint: abc1234

Ready to resume from: auth-005
═══════════════════════════════════════════════════════════════
```

**If drift found:**

```
VALIDATION
├── Code vs PRD: DRIFTED ⚠️
├── Git state: CLEAN ✓
└── Tags: DRIFTED ⚠️

DRIFT ISSUES: 2
├── auth-003: marked done but missing error handling
│   → Recommend: reset to pending
└── auth-005: in_progress but no recent changes
    → Recommend: reset to pending

Checkpoint: abc1234
```

### Phase 4: User Decision

**If drift found, use AskUserQuestion:**

```
Question: "Drift detected. How to proceed?"

Options:
1. Fix drift and continue (Recommended)
   - Reset drifted stories to pending
   - Resume from first drifted story
   
2. Continue as-is
   - Accept current state
   - Resume from next pending story
   
3. Restart from beginning
   - Start fresh with /ao-start
   - Preserves existing code
```

**If no drift:**

```
Question: "State validated. Ready to resume?"

Options:
1. Resume from auth-005 (Recommended)
2. Force restart from different phase
3. Cancel
```

### Phase 5: Apply Fixes (if chosen)

```bash
# Update PRD for drifted stories
for story in "${DRIFTED_STORIES[@]}"; do
  jq --arg id "$story" \
     --arg status "pending" \
     --arg note "Reset due to drift" \
     '(.stories[] | select(.id == $id)) |= . + {status: $status, drift_note: $note}' \
     .agents/tasks/prd.json > .agents/tasks/prd.json.tmp && \
  mv .agents/tasks/prd.json.tmp .agents/tasks/prd.json
  
  echo "✓ Reset: $story → pending"
done

# Post-fix checkpoint
git add .agents/tasks/prd.json
git commit -m "[ao-checkpoint] Drift fixes applied

Reset stories:
- auth-003 → pending (missing error handling)
- auth-005 → pending (stale in_progress)"
```

### Phase 6: Resume

**Determine starting point:**

```bash
if [ -n "$FROM_PHASE" ]; then
  # User specified --from
  case "$FROM_PHASE" in
    brainstorm)  START="Phase 1: Brainstorm" ;;
    plan)        START="Phase 2: Plan" ;;
    prd)         START="Phase 3: PRD" ;;
    run)         START="Next story" ;;
  esac
elif [ "$VALIDATION" = "DRIFTED" ] && [ "$FIX_DRIFT" = true ]; then
  # Start from first drifted story
  START_STORY="${DRIFTED_STORIES[0]}"
else
  # Start from first pending story with satisfied deps
  START_STORY=$(jq -r '.stories[] | select(.status == "pending") | select(.depends_on | length == 0 or all(. as $dep | .. | select(.id == $dep) | .status == "done")) | .id' .agents/tasks/prd.json | head -1)
fi
```

**Hand off to appropriate command:**

| Starting Point | Action |
|----------------|--------|
| Phase 1: Brainstorm | Run `/ao-start` (fresh) |
| Phase 2: Plan | Run planning from `/ao-start` |
| Phase 3: PRD | Generate PRD from existing plan |
| Next story | Run `/ao-run` from that story |

### Phase 7: Cleanup

```bash
echo "Resuming from: ${START_STORY:-$START}"
echo "Checkpoint: $CHECKPOINT_SHA"
echo ""
echo "To restore: git reset --hard $CHECKPOINT_SHA"
echo "To squash later: git rebase -i develop"
```

## --validate-only Output

When using `--validate-only`, output detailed report and exit:

```
═══════════════════════════════════════════════════════════════
AO Continue — Validation Report (Read-Only)
═══════════════════════════════════════════════════════════════

No checkpoint created (--validate-only)

STATE: DRIFTED ⚠️

Story Progress: 4/7
├── auth-001: done ✓
├── auth-002: done ✓
├── auth-003: done ⚠️ DRIFT: missing error handling
├── auth-004: done ✓
├── auth-005: in_progress ⚠️ DRIFT: no recent changes
├── auth-006: pending
└── auth-007: blocked (@human)

Drift Issues: 2
├── auth-003: Should be pending (acceptance not met)
└── auth-005: Should be pending (stale)

Recommendations:
1. Run /ao-continue to fix drift and resume
2. Or manually update PRD

═══════════════════════════════════════════════════════════════
```

## Edge Cases

### No Artifacts Found

```
STATE: no-workflow

No artifacts found. This project hasn't started a workflow yet.

Run /ao-start to begin.
```

### All Stories Done

```
STATE: complete

All 7 stories marked as done.

Options:
1. Run compound phase to document learnings
2. Create PR
3. Start new feature with /ao-start
```

### Severe Drift

When drift is severe (e.g., PRD weeks old, major inconsistencies):

Check config for `severe_drift_action`:
- `ask` → Use AskUserQuestion
- `restart` → Auto-start fresh
- `force-continue` → Proceed despite issues

## Status Protocol

```
VALIDATION: consistent   → Resume normally
VALIDATION: drifted      → Fix or accept and continue
VALIDATION: severe_drift → Ask/restart/force based on config
```

## Checkpoint Commands Reference

```bash
# Find all checkpoints
git log --oneline --grep='\[ao-checkpoint\]'

# Restore to last checkpoint
git reset --hard $(git log --grep='\[ao-checkpoint\]' -n 1 --format=%H)

# Restore to specific checkpoint
git reset --hard <sha>

# Squash checkpoints after feature complete
git rebase -i develop
# Mark checkpoint commits as 'fixup' or 'squash'
```

## Output Summary

```
═══════════════════════════════════════════════════════════════
AO Continue — Resuming Workflow
═══════════════════════════════════════════════════════════════

State: Validated ✓
Checkpoint: abc1234

Resuming:
├── From: auth-005
├── Remaining: 3 stories
└── Estimated: 1.5 hours

Checkpoint commands:
├── Find: git log --grep='[ao-checkpoint]'
├── Restore: git reset --hard abc1234
└── Squash: git rebase -i abc1234~1

Handing off to /ao-run...
═══════════════════════════════════════════════════════════════
```
