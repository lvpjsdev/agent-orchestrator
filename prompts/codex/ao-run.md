---
description: Run execution cycle with verify step (per-story loop)
argument-hint: "[iterations] [--no-commit] [--parallel]"
---

# AO Run — Execution with Verification

Execute PRD stories through orchestrated agent pipeline with fresh contexts.

## Input
- Optional `iterations` (default: 5)
- Optional `--no-commit` for dry run
- Optional `--parallel` for independent stories

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
├─────────────────────────────────────────────────────────────────────────────────┤
│  PER-STORY LOOP (fresh contexts)                                                │
│  ────────────────────────────────                                                │
│                                                                                  │
│  ┌─────────────┐                                                                │
│  │   SETUP     │  worktree, dependencies                                        │
│  │  (fresh)    │  STATUS: done → implement                                      │
│  └──────┬──────┘                                                                │
│         ↓                                                                        │
│  ┌─────────────┐                                                                │
│  │ IMPLEMENT   │  CoderAgent (FRESH context per story!)                        │
│  │  (fresh)    │  STATUS: done → verify | retry → implement                    │
│  └──────┬──────┘                                                                │
│         ↓                                                                        │
│  ┌─────────────┐                                                                │
│  │   VERIFY    │  VerifierAgent (FRESH, skeptical QA) ◄── Antfarm pattern      │
│  │  (fresh)    │  STATUS: done → test | retry → implement                      │
│  └──────┬──────┘                                                                │
│         ↓                                                                        │
│  ┌─────────────┐                                                                │
│  │    TEST     │  TestEngineer (fresh context)                                 │
│  │  (fresh)    │  STATUS: done → review | retry → implement                    │
│  └──────┬──────┘                                                                │
│         ↓                                                                        │
│  ┌─────────────┐                                                                │
│  │   REVIEW    │  Review swarm (parallel: security, performance, simplicity)   │
│  │  (swarm)    │  STATUS: approved → commit | changes_requested → implement    │
│  └──────┬──────┘                                                                │
│         ↓                                                                        │
│  ┌─────────────┐                                                                │
│  │   COMMIT    │  Git commit with story reference                              │
│  │             │  STATUS: done → next story or COMPOUND                        │
│  └──────┬──────┘                                                                │
│         │                                                                        │
│         ├──── more stories? ────► return to SETUP                               │
│         │                                                                        │
│         └──── all stories done? ──► COMPOUND PHASE                              │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  COMPOUND PHASE (after all stories complete)                                     │
│  ────────────────────────────────────────                                        │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  COMPOUND — Document Learnings                                           │    │
│  │                                                                          │    │
│  │  Tasks:                                                                  │    │
│  │  - Review entire feature implementation                                  │    │
│  │  - Extract reusable patterns                                             │    │
│  │  - Document gotchas and solutions                                        │    │
│  │  - Note metrics for future reference                                     │    │
│  │                                                                          │    │
│  │  Output: docs/solutions/<category>/<topic>-learnings.md                  │    │
│  │                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                              │                                                   │
│                              ▼                                                   │
│                       docs/solutions/                                            │
│                              │                                                   │
│                              │                                                   │
│                              └──────────────────────────────────────────┐       │
│                                                                         │       │
│                              FEEDS INTO NEXT ITERATION                  │       │
│                                                                         ▼       │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                          │    │
│  │   NEXT /ao-start                                                         │    │
│  │        │                                                                 │    │
│  │        ▼                                                                 │    │
│  │   learnings-researcher finds past solutions                             │    │
│  │        │                                                                 │    │
│  │        ▼                                                                 │    │
│  │   Plan includes proven patterns, avoids past mistakes                    │    │
│  │                                                                          │    │
│  │   ══════════════════════════════════════════════════════════             │    │
│  │   NEXT ITERATION IS EASIER (compound engineering achieved!)              │    │
│  │   ══════════════════════════════════════════════════════════             │    │
│  │                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  LEARNINGS FEEDBACK LOOP:                                                        │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐          │
│  │  /ao-run   │───►│  COMPOUND  │───►│ docs/      │───►│ next       │          │
│  │  executes  │    │  extracts  │    │ solutions/ │    │ /ao-start  │          │
│  │  stories   │    │  patterns  │    │ learnings  │    │ uses them  │          │
│  └────────────┘    └────────────┘    └────────────┘    └────────────┘          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Pre-flight Check

1. **Validate PRD exists:**
   ```bash
   test -f .agents/tasks/prd.json
   ```
   If missing: Stop and suggest `/ao-start`

2. **Ensure worktree:**
   ```bash
   git worktree list | grep -q ".codex/worktrees"
   ```
   If missing: Create worktree for feature branch

## Execution Loop

### Step 0: Select Next Story

```bash
# Get next pending story with satisfied dependencies
cat .agents/tasks/prd.json | jq '.stories[] | select(.status == "pending") | select(.depends_on | all(. as $dep | .[].stories[] | select(.id == $dep) | .status == "done"))'
```

If `--parallel`:
```bash
# Get ALL pending stories with satisfied dependencies
cat .agents/tasks/prd.json | jq '.stories[] | select(.status == "pending") | select(.depends_on | length == 0 or all(...))'
```

### Step 1: SETUP (per story)

**Agent:** setup (fresh context)

**Tasks:**
- Ensure clean workspace
- Install dependencies if needed
- Create feature branch if not exists

**Output:**
```
STATUS: done
WORKSPACE: ready
```

### Step 2: IMPLEMENT (per story)

**Agent:** CoderAgent (FRESH context — no memory of previous stories)

**Input:**
- Story: {{story}}
- Plan: {{plan}} (relevant section only)
- Patterns: From repo research

**Prompt:**
```
Implement story: <story_id> - <title>

Acceptance Criteria:
- [ ] <criterion 1>
- [ ] <criterion 2>
- [ ] <criterion 3>

Plan Context:
<relevant plan section>

Follow project patterns from:
- CLAUDE.md
- Existing similar code

Run typecheck and lint before marking done.

Output format:
FILES_CHANGED: [list of modified files]
STATUS: done | retry
```

**Output:**
```
FILES_CHANGED: [app/models/user.rb, db/migrate/xxx_create_users.rb]
STATUS: done
```

**If STATUS: retry:**
```
RETRY_REASON: <specific issue>
FEEDBACK: <what to fix>
```

### Step 3: VERIFY (per story) — CRITICAL STEP

**Agent:** verifier (FRESH context — different session from developer!)

**Persona:**
```markdown
# Verifier Agent

You are a senior QA engineer with a skeptical mindset.
Your ONLY job is to say "NO" until the work is truly complete.

## Guidelines
- Check EVERY acceptance criterion from the story
- Run the code yourself if possible
- Verify edge cases are handled
- Don't accept "works on my machine" without evidence
- Be MORE critical than the developer would be
- You are the quality gate — do not let sloppy work through

## Anti-patterns
- Don't just read the code — VERIFY it works
- Don't trust the developer's word — VERIFY claims
- Don't skip edge cases — they're where bugs hide
```

**Input:**
- Story: {{story}}
- Implementation: {{FILES_CHANGED}}
- Acceptance criteria from story

**Prompt:**
```
VERIFY implementation for story: <story_id>

Implementation files:
<list of files with content>

Acceptance Criteria to verify:
- [ ] <criterion 1>
- [ ] <criterion 2>  
- [ ] <criterion 3>

For each criterion:
1. Check if the code ACTUALLY implements it
2. Look for edge cases
3. Verify no regressions

Output format:
VERIFIED: true | false

ACCEPTANCE_STATUS:
- [x| ] Criterion 1: PASSED | FAILED - <reason>
- [x| ] Criterion 2: PASSED | FAILED - <reason>
- [x| ] Criterion 3: PASSED | FAILED - <reason>

FEEDBACK: [if not verified, specific issues to fix]

STATUS: done | retry
```

**Output if verified:**
```
VERIFIED: true
ACCEPTANCE_STATUS:
- [x] User table exists: PASSED
- [x] Email is unique: PASSED  
- [x] Password is hashed: PASSED
STATUS: done → proceed to test
```

**Output if NOT verified:**
```
VERIFIED: false
ACCEPTANCE_STATUS:
- [x] User table exists: PASSED
- [ ] Email is unique: FAILED - no unique index
- [x] Password is hashed: PASSED
FEEDBACK: Add unique index on email column in migration
STATUS: retry → back to IMPLEMENT
```

### Step 4: TEST (per story)

**Agent:** TestEngineer (fresh context)

**Tasks:**
- Run existing test suite
- Add regression tests for new feature
- Ensure all tests pass

**Prompt:**
```
Test implementation for story: <story_id>

Files changed:
<list>

Acceptance criteria to test:
<criteria>

Tasks:
1. Run existing test suite
2. Add tests for acceptance criteria
3. Add edge case tests
4. Ensure all tests pass

Output format:
TESTS: passed | failed
TEST_FILES: [list of test files created/modified]
COVERAGE: <approximate coverage>
FAILED_TESTS: [if any, with failure reasons]

STATUS: done | retry
```

**Output:**
```
TESTS: passed
TEST_FILES: [spec/models/user_spec.rb, spec/requests/sessions_spec.rb]
COVERAGE: ~85%
STATUS: done → proceed to review
```

### Step 5: REVIEW (per story or batch)

**Agent:** reviewer swarm (parallel reviewers with fresh contexts)

**Spawn review swarm:**
```javascript
Task({
  subagent_type: "compound-engineering:review:security-sentinel",
  description: "Security review",
  prompt: `
    Review implementation for security issues.
    Files: {{FILES_CHANGED}}
    
    Focus on:
    - SQL injection
    - XSS
    - Auth bypass
    - Data exposure
    
    Output: APPROVED | CHANGES_REQUESTED: [...]
  `,
  run_in_background: true
})

Task({
  subagent_type: "compound-engineering:review:performance-oracle",
  description: "Performance review",
  prompt: `
    Review implementation for performance issues.
    Files: {{FILES_CHANGED}}
    
    Focus on:
    - N+1 queries
    - Missing indexes
    - Memory leaks
    
    Output: APPROVED | CHANGES_REQUESTED: [...]
  `,
  run_in_background: true
})

Task({
  subagent_type: "compound-engineering:review:code-simplicity-reviewer",
  description: "Simplicity review",
  prompt: `
    Review implementation for unnecessary complexity.
    Files: {{FILES_CHANGED}}
    
    Focus on:
    - YAGNI violations
    - Over-engineering
    - Premature abstraction
    
    Output: APPROVED | CHANGES_REQUESTED: [...]
  `,
  run_in_background: true
})
```

**Consolidate results:**
```
SECURITY: APPROVED
PERFORMANCE: APPROVED
SIMPLICITY: CHANGES_REQUESTED - extract method in User#authenticate

OVERALL: CHANGES_REQUESTED
STATUS: changes_requested → back to IMPLEMENT
```

### Step 6: COMMIT (per story)

**After STATUS: approved:**

```bash
git add <FILES_CHANGED>
git commit -m "feat(<module>): <story title>

Story: <story_id>
Acceptance:
- <criterion 1>
- <criterion 2>
- <criterion 3>

Verified by: verifier agent
Tested by: test agent
Reviewed by: security, performance, simplicity agents"
```

**Update story status:**
```bash
# Mark story as done in PRD
jq '.stories[] | select(.id == "<story_id>") | .status = "done"' .agents/tasks/prd.json
```

### Step 7: NEXT STORY or COMPOUND

**If more stories:**
- Return to Step 0

**If all stories done:**
- Proceed to COMPOUND phase

### Step 8: COMPOUND (after all stories)

**Agent:** manager

**Tasks:**
- Review entire feature implementation
- Document learnings
- Identify patterns for reuse
- Note gotchas for future

**Output:**
```bash
mkdir -p docs/solutions/<category>
```

```markdown
---
title: <Feature> Implementation Learnings
category: <category>
tags: [tag1, tag2, tag3]
module: <module>
date: YYYY-MM-DD
stories: [story-id-1, story-id-2]
---

# <Feature> Implementation Learnings

## Summary
Brief description of what was built.

## Key Decisions
- Decision 1: Rationale
- Decision 2: Rationale

## Patterns That Worked
- Pattern 1: Description
- Pattern 2: Description

## Gotchas
- Gotcha 1: How to avoid
- Gotcha 2: How to avoid

## Metrics
- Stories completed: X
- Cycle time per story: avg Y min
- First-pass success rate: Z%
- Human interventions: N

## References
- Brainstorm: docs/brainstorms/...
- Plan: docs/plans/...
- PR: #XXX
```

## Parallel Execution Mode

When `--parallel` flag is set:

1. Identify all stories with:
   - Status: pending
   - Dependencies: satisfied or empty

2. Spawn multiple IMPLEMENT agents simultaneously:
   ```javascript
   // Stories auth-001, auth-002, auth-003 have no dependencies
   Task({ subagent_type: "CoderAgent", prompt: "Story auth-001...", run_in_background: true })
   Task({ subagent_type: "CoderAgent", prompt: "Story auth-002...", run_in_background: true })
   Task({ subagent_type: "CoderAgent", prompt: "Story auth-003...", run_in_background: true })
   ```

3. Each story proceeds through its own pipeline
4. VERIFY, TEST, REVIEW run per story
5. Stories with dependencies wait for dependencies to complete

## Metrics Tracking

```json
{
  "workflow_id": "auth-feature-2026-02-14",
  "started": "2026-02-14T10:00:00Z",
  "stories": [
    {
      "id": "auth-001",
      "started": "2026-02-14T10:05:00Z",
      "implement_duration_min": 25,
      "verify_passed_first_try": true,
      "test_duration_min": 10,
      "review_passed_first_try": true,
      "completed": "2026-02-14T10:40:00Z",
      "human_interventions": 0
    }
  ],
  "totals": {
    "stories_completed": 7,
    "total_cycle_time_min": 180,
    "first_pass_success_rate": 0.85,
    "human_touch_rate": 0.14,
    "escalation_rate": 0.0
  }
}
```

## Guardrails

- **Fresh context per step:** Each agent gets clean session
- **Verifier must be separate:** Never same session as developer
- **No skipping steps:** implement → verify → test → review is mandatory
- **Human approval** for escalations
- **Iteration cap:** Stop after N iterations, escalate to human

## Escalation Triggers

- Story fails VERIFY 3+ times
- Story fails TEST 3+ times
- REVIEW returns CHANGES_REQUESTED 3+ times
- Human intervention requested via `@human` tag

## Status Protocol

```
STATUS: done              → Proceed to next step
STATUS: retry             → Repeat current step with feedback
STATUS: approved          → Proceed to commit
STATUS: changes_requested → Back to IMPLEMENT with feedback
STATUS: blocked           → Escalate to human
```

## Output Summary

After all iterations:

```
═══════════════════════════════════════════════════════════════
AO Run Complete

Stories Processed: 7/7
├── Completed: 6
├── Blocked: 0
└── Escalated: 1 (@human tag)

Metrics:
├── Total time: 3h 15m
├── Avg cycle time: 28m/story
├── First-pass success: 71%
├── Human touch rate: 14%
└── Escalation rate: 14%

Artifacts:
├── PRD: .agents/tasks/prd.json
├── Learnings: docs/solutions/auth/authentication-learnings.md
└── Metrics: .agents/metrics/auth-feature-2026-02-14.json

Escalated Stories:
└── auth-005: Complex OAuth flow - needs human judgment
    → Run /ao-human to review

Next Steps:
1. Review escalated story with /ao-human
2. Run /ao-continue after resolution
3. Create PR: gh pr create --title "..."
═══════════════════════════════════════════════════════════════
```
