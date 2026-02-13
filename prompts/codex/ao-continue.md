---
description: Resume interrupted workflow with state validation and checkpoints
argument-hint: "[--validate-only] [--from <phase>] [--no-checkpoint]"
---

# AO Continue — Resume with Validation and Checkpoints

Resume an interrupted compound engineering workflow. Creates restore point before any state modifications.

## Input
- `--validate-only` — Only validate state, don't resume (no checkpoint needed)
- `--from <phase>` — Force resume from specific phase
- `--no-checkpoint` — Skip checkpoint creation (not recommended)

## Configuration

```json
// .agents/config.json
{
  "continue": {
    "severe_drift_action": "ask",
    "auto_checkpoint": true,
    "checkpoint_prefix": "[ao-checkpoint]"
  }
}
```

**`severe_drift_action` options:**
- `"ask"` — Always ask user (default)
- `"restart"` — Automatically restart workflow
- `"force-continue"` — Continue despite issues

## Checkpoint System

### When Checkpoints Are Created

| Situation | Checkpoint? | Why |
|-----------|-------------|-----|
| `--validate-only` | No | Read-only, no changes |
| Drift detected, fixing | Yes | Before modifying PRD |
| Severe drift, restart | Yes | Before cleaning state |
| Normal resume | Yes | Before continuing |

### Checkpoint Format

```bash
git add -A
git commit -m "[ao-checkpoint] Pre-continue validation snapshot

State at checkpoint:
- Phase: run
- Stories done: 4/7
- Drift detected: yes (2 stories)
- Action: fix-drift-and-continue

This checkpoint can be used to restore state if continue goes wrong.
Find with: git log --grep='[ao-checkpoint]'
Squash with: git rebase -i <before-this-commit>"
```

### Checkpoint Commands

```bash
# Find all checkpoints
git log --oneline --grep='\[ao-checkpoint\]'

# Restore to last checkpoint
git reset --hard $(git log --grep='\[ao-checkpoint\]' -n 1 --format=%H)

# Restore to specific checkpoint
git reset --hard <sha>

# Squash checkpoints after feature complete
git rebase -i develop
# Mark checkpoint commits as 'squash' or 'fixup'
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        COMPOUND ENGINEERING WORKFLOW                             │
│                                                                                  │
│        "Each unit of work should make subsequent units easier"                  │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  /ao-start ──► /ao-run ──► COMPOUND ──► (next iteration is easier)             │
│      │              │           │                                               │
│      ▼              ▼           ▼                                               │
│   PLAN          EXECUTE      LEARN                                              │
│   (WHAT/HOW)    (BUILD)      (COMPOUND)                                         │
│                                                                                  │
│                  ▲                                                               │
│                  │                                                               │
│           /ao-continue ──► resume from any point                               │
│                  │                                                               │
│                  ▼                                                               │
│           VALIDATE & RECOVER                                                     │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  /ao-continue RECOVERY PIPELINE                                                 │
│  ─────────────────────────────────                                               │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  1. DETECT: Where did we stop?                                          │    │
│  │     • Check artifacts (brainstorm, plan, PRD)                           │    │
│  │     • Check git state (branch, uncommitted changes)                     │    │
│  │     • Check story status in PRD                                         │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                              │                                                   │
│                              ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  2. VALIDATE: Is state consistent?                                      │    │
│  │     • Swarm: repo-research-analyst (code vs PRD sync)                   │    │
│  │     • Swarm: git-history-analyzer (recent changes)                      │    │
│  │     • Swarm: pattern-recognition-specialist (tag accuracy)              │    │
│  │                                                                          │    │
│  │     Uses learnings from docs/solutions/ to detect known drift patterns  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                              │                                                   │
│                              ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  3. CHECKPOINT: Create restore point (if changes needed)                │    │
│  │     • Format: [ao-checkpoint] Pre-continue validation snapshot          │    │
│  │     • Find: git log --grep='[ao-checkpoint]'                            │    │
│  │     • Restore: git reset --hard <sha>                                   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                              │                                                   │
│                              ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  4. REPORT: Show state summary                                          │    │
│  │     • What's done, what's in progress                                   │    │
│  │     • Drift findings (if any)                                           │    │
│  │     • Recommended action based on config                                │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                              │                                                   │
│                              ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  5. RESUME: Continue from validated point                               │    │
│  │     • Hand off to /ao-run from appropriate story                        │    │
│  │     • Or restart from /ao-start if severe drift                         │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  RECOVERY POINTS IN WORKFLOW                                                     │
│  ───────────────────────────────                                                 │
│                                                                                  │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐          │
│  │ BRAINSTORM │───►│   PLAN     │───►│    PRD     │───►│  /ao-run   │          │
│  │    .md     │    │    .md     │    │   .json    │    │   loop     │          │
│  └────────────┘    └────────────┘    └────────────┘    └────────────┘          │
│        │                 │                 │                 │                   │
│        ▼                 ▼                 ▼                 ▼                   │
│   resume from        resume from       resume from      resume from            │
│   Phase 1            Phase 2           Phase 3          specific story         │
│   (brainstorm)       (plan)            (prd)            (checkpoint)            │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  COMPOUND FEEDBACK IN RECOVERY                                                   │
│  ─────────────────────────────                                                   │
│                                                                                  │
│  Validation swarm uses past learnings to detect drift:                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                          │    │
│  │   docs/solutions/ ────► pattern-recognition-specialist                 │    │
│  │        │                        │                                        │    │
│  │        │                        ▼                                        │    │
│  │   known gotchas ──────► "This pattern caused issues before"            │    │
│  │        │                        │                                        │    │
│  │        │                        ▼                                        │    │
│  │   drift patterns ─────► "Similar drift happened in feature X"          │    │
│  │                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ═══════════════════════════════════════════════════════════════════════════    │
│  RECOVERY IS FASTER with compound engineering (learnings help validate)         │
│  ═══════════════════════════════════════════════════════════════════════════    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Execution

### Phase 0: State Detection

**Goal:** Figure out where we are in the workflow.

```bash
# Check artifacts existence
BRAINSTORM=$(ls -t docs/brainstorms/*.md 2>/dev/null | head -1)
PLAN=$(ls -t docs/plans/*-plan.md 2>/dev/null | head -1)
PRD=".agents/tasks/prd.json"

echo "Artifacts found:"
echo "  Brainstorm: $([ -f "$BRAINSTORM" ] && echo "$BRAINSTORM" || echo 'NONE')"
echo "  Plan: $([ -f "$PLAN" ] && echo "$PLAN" || echo 'NONE')"
echo "  PRD: $([ -f "$PRD" ] && echo "$PRD" || echo 'NONE')"

# Check git state
CURRENT_BRANCH=$(git branch --show-current)
UNCOMMITTED=$(git status --porcelain)

echo "Git state:"
echo "  Branch: $CURRENT_BRANCH"
echo "  Uncommitted: $([ -z "$UNCOMMITTED" ] && echo 'CLEAN' || echo 'DIRTY')"

# Check PRD story status
if [ -f "$PRD" ]; then
  TOTAL=$(jq '.stories | length' "$PRD")
  DONE=$(jq '[.stories[] | select(.status == "done")] | length' "$PRD")
  PENDING=$(jq '[.stories[] | select(.status == "pending" or .status == null)] | length' "$PRD")
  IN_PROGRESS=$(jq '[.stories[] | select(.status == "in_progress")] | length' "$PRD")
  
  echo "PRD status: $DONE/$TOTAL done, $IN_PROGRESS in progress, $PENDING pending"
fi
```

**Phase detection logic:**

| Condition | Phase | Action |
|-----------|-------|--------|
| No brainstorm | `start` | Run `/ao-start` |
| Brainstorm exists, no plan | `plan` | Run planning phase |
| Plan exists, no PRD | `prd` | Run `ralph prd` |
| PRD exists, stories pending | `run` | Resume `/ao-run` |
| All stories done | `complete` | Run compound or finish |

### Phase 1: Validation Swarm

**Create validation team:**
```javascript
Teammate({ 
  operation: "spawnTeam", 
  team_name: "state-validation",
  description: "Validating workflow state consistency"
})
```

**Spawn validators (parallel):**

```javascript
Task({
  team_name: "state-validation",
  name: "code-vs-prd",
  subagent_type: "compound-engineering:research:repo-research-analyst",
  prompt: `
    Validate code consistency with PRD.
    
    PRD location: .agents/tasks/prd.json
    
    Tasks:
    1. Read PRD stories marked as "done"
    2. For each done story, check:
       - Do the files mentioned actually exist?
       - Does the code implement what acceptance criteria say?
       - Any obvious gaps or regressions?
    
    3. Check for untracked changes:
       - Code that exists but isn't in any story
       - Stories marked done but code is incomplete
    
    Output format:
    CONSISTENCY: consistent | drifted | unknown
    
    DONE_STORIES_VALIDATED:
    - <story-id>: VALID | INVALID - <reason>
    
    DRIFT_FINDINGS:
    - <finding 1>
    - <finding 2>
    
    UNTRACKED_CODE:
    - <file>: <what it does>
    
    Send findings to team-lead.
  `,
  run_in_background: true
})

Task({
  team_name: "state-validation",
  name: "git-sync",
  subagent_type: "compound-engineering:research:git-history-analyzer",
  prompt: `
    Analyze recent git history for state validation.
    
    Tasks:
    1. Check commits since PRD was created
    2. Identify:
       - Commits with story references (good)
       - Commits without story references (potential drift)
       - Any manual changes not from agents
    
    3. Check branch state:
       - Is current branch ahead/behind develop?
       - Any merge conflicts?
    
    Output format:
    GIT_STATE: clean | uncommitted | diverged
    
    COMMITS_WITH_STORIES: [list]
    COMMITS_WITHOUT_STORIES: [list]
    
    BRANCH_STATUS: <ahead/behind count>
    
    Send findings to team-lead.
  `,
  run_in_background: true
})

Task({
  team_name: "state-validation",
  name: "tag-validator",
  subagent_type: "compound-engineering:review:pattern-recognition-specialist",
  prompt: `
    Validate story tags match reality.
    
    PRD location: .agents/tasks/prd.json
    
    For each story, check if status is accurate:
    - "done" → verify actually complete
    - "blocked" → verify blocker still exists
    - "in_progress" → verify work is actually happening
    - "@human" tag → verify needs human attention
    
    Also check:
    - Dependencies: Are all listed dependencies real?
    - Files_likely: Do predicted files match reality?
    
    Output format:
    TAG_ACCURACY: accurate | drifted
    
    TAG_ISSUES:
    - <story-id>: <tag> should be <correct-tag> - <reason>
    
    DEPENDENCY_ISSUES:
    - <story-id>: dependency <dep-id> doesn't exist
    
    Send findings to team-lead.
  `,
  run_in_background: true
})
```

**Wait for results:**
```bash
cat ~/.claude/teams/state-validation/inboxes/team-lead.json
```

### Phase 2: Determine Validation Result

```
VALIDATION_RESULT:
- CONSISTENT    → No drift, safe to continue
- DRIFTED       → Minor issues, can be auto-fixed
- SEVERE_DRIFT  → Major issues, needs decision
```

### Phase 3: Create Checkpoint (if changes needed)

**If validation found issues AND NOT `--validate-only`:**

```bash
# Load config
SEVERE_ACTION=$(jq -r '.continue.severe_drift_action // "ask"' .agents/config.json)
CHECKPOINT_PREFIX=$(jq -r '.continue.checkpoint_prefix // "[ao-checkpoint]"' .agents/config.json)

# Create checkpoint
git add -A
git commit -m "${CHECKPOINT_PREFIX} Pre-continue validation snapshot

State at checkpoint:
- Phase: $(detect_phase)
- Stories done: ${DONE}/${TOTAL}
- Validation: ${VALIDATION_RESULT}
- Drift findings: ${DRIFT_COUNT} issues
- Planned action: ${PLANNED_ACTION}

Drift details:
$(for issue in "${DRIFT_ISSUES[@]}"; do echo "- $issue"; done)

Restore: git reset --hard $(git rev-parse HEAD)
Find checkpoints: git log --grep='${CHECKPOINT_PREFIX}'"

echo "✓ Checkpoint created: $(git rev-parse --short HEAD)"
```

### Phase 4: Handle Result

#### Case A: CONSISTENT

```
═══════════════════════════════════════════════════════════════
AO Continue — State Validation

STATE: CONSISTENT ✓

All stories match code reality.

Stories: 4/7 done
Resume from: auth-005 (next pending story)

Proceeding with /ao-run...
═══════════════════════════════════════════════════════════════
```

#### Case B: DRIFTED

```
═══════════════════════════════════════════════════════════════
AO Continue — State Validation

STATE: DRIFTED ⚠️

Found 2 drift issues:
1. auth-003: marked done but missing error handling
2. auth-005: in_progress but no recent changes

Checkpoint: abc1234 (restore if needed)

Auto-fixing drift:
✓ auth-003 → status: pending
✓ auth-005 → status: pending

Post-fix checkpoint: def5678

Resuming from auth-003 (first drifted story)...
═══════════════════════════════════════════════════════════════
```

#### Case C: SEVERE_DRIFT

```
═══════════════════════════════════════════════════════════════
AO Continue — State Validation

STATE: SEVERE_DRIFT 🚨

Critical issues found:
- 4 stories marked done but code missing
- PRD is 3 weeks old
- Branch diverged significantly

Checkpoint: abc1234 (restore if needed)
═══════════════════════════════════════════════════════════════
```

**Check config for action:**

```bash
case $SEVERE_ACTION in
  "ask")
    # Use AskUserQuestion tool
    ;;
  "restart")
    echo "Config set to auto-restart. Starting fresh..."
    # Clean and run /ao-start
    ;;
  "force-continue")
    echo "Config set to force-continue. Proceeding anyway..."
    ;;
esac
```

**If asking user:**

```
Question: "Severe drift detected. How would you like to proceed?"

Options:
1. Start fresh (Recommended)
   - Checkpoint already created
   - Run /ao-start with same request
   - Preserves existing code as reference
   
2. Force continue
   - Accept current state as-is
   - May lead to inconsistencies
   
3. Manual resolution
   - Exit and let human investigate
   - Return with /ao-continue when ready
```

### Phase 5: Apply Fixes (if drifted)

```bash
# Update PRD based on validation findings
for issue in "${DRIFT_ISSUES[@]}"; do
  STORY_ID=$(echo "$issue" | jq -r '.story_id')
  CORRECT_STATUS=$(echo "$issue" | jq -r '.correct_status')
  DRIFT_NOTE=$(echo "$issue" | jq -r '.note')
  
  jq --arg id "$STORY_ID" \
     --arg status "$CORRECT_STATUS" \
     --arg note "$DRIFT_NOTE" \
     '(.stories[] | select(.id == $id)) |= . + {status: $status, drift_note: $note}' \
     .agents/tasks/prd.json > .agents/tasks/prd.json.tmp
  mv .agents/tasks/prd.json.tmp .agents/tasks/prd.json
  
  echo "✓ $STORY_ID → $CORRECT_STATUS"
done

# Post-fix checkpoint
git add .agents/tasks/prd.json
git commit -m "[ao-checkpoint] Drift fixes applied

Fixed stories:
$(for issue in "${DRIFT_ISSUES[@]}"; do echo "- ${issue.story_id}: ${issue.action}"; done)

Restore: git reset --hard $(git rev-parse HEAD)"
```

### Phase 6: Resume

```bash
# Determine starting story
if [ "$VALIDATION_RESULT" = "DRIFTED" ]; then
  START_STORY=$(echo "${DRIFT_ISSUES[0]}" | jq -r '.story_id')
else
  START_STORY=$(jq -r '.stories[] | select(.status == "pending") | select(.depends_on | all(. as $dep | .. | select(.id == $dep) | .status == "done")) | .id' .agents/tasks/prd.json | head -1)
fi

echo "Resuming from: $START_STORY"

# Cleanup validation team
Teammate({ operation: "requestShutdown", target_agent_id: "code-vs-prd" })
Teammate({ operation: "requestShutdown", target_agent_id: "git-sync" })
Teammate({ operation: "requestShutdown", target_agent_id: "tag-validator" })
Teammate({ operation: "cleanup" })

# Hand off to /ao-run
```

## --validate-only Output

```
═══════════════════════════════════════════════════════════════
AO Continue — Validation Report (Read-Only)
═══════════════════════════════════════════════════════════════

No checkpoint created (--validate-only)

STATE: DRIFTED ⚠️

Story Progress: 4/7
├── auth-001: done ✓
├── auth-002: done ✓
├── auth-003: done ⚠️ (DRIFT: missing error handling)
├── auth-004: done ✓
├── auth-005: in_progress ⚠️ (DRIFT: no recent changes)
├── auth-006: pending
└── auth-007: blocked (@human)

Drift Issues: 2
├── auth-003: Should be pending
│   Reason: Acceptance "Handle invalid OAuth" not met
│
└── auth-005: Should be pending
    Reason: No commits in 2 days, no code changes

Untracked Code: 1
└── lib/oauth_helper.rb (not in any story)

Recommendations:
1. Run /ao-continue (will create checkpoint and fix drift)
2. Or manually update PRD before continuing

To resume: /ao-continue
═══════════════════════════════════════════════════════════════
```

## Edge Cases

### No Artifacts Found

```
STATE: No workflow in progress

No artifacts found. This project hasn't started a workflow yet.

Run /ao-start to begin.
```

### All Stories Done

```
STATE: Workflow complete

All 7 stories marked as done.

Options:
1. Run compound phase (document learnings)
2. Create PR
3. Start new feature with /ao-start
```

## Status Protocol

```
VALIDATION: consistent   → Resume normally
VALIDATION: drifted      → Fix drift or accept and continue
VALIDATION: severe_drift → Ask/restart/force based on config
```

## Output Summary

```
═══════════════════════════════════════════════════════════════
AO Continue — Resuming Workflow
═══════════════════════════════════════════════════════════════

State: Validated (minor drift fixed)
Checkpoint: def5678

Resuming:
├── From: auth-003
├── Remaining: 3 stories
└── Estimated: 1.5 hours

Checkpoint commands:
├── Find all: git log --grep='[ao-checkpoint]'
├── Restore:  git reset --hard def5678
└── Squash:   git rebase -i def5678~1

Handing off to /ao-run...
═══════════════════════════════════════════════════════════════
```
