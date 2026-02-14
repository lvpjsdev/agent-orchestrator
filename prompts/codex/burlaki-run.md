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

See [README.md](../../README.md) for the full compound engineering cycle diagram.

**Per-story pipeline:** SETUP → IMPLEMENT → VERIFY → TEST → REVIEW → COMMIT

**Compound phase:** After all stories → document learnings to `docs/solutions/`

## Pre-flight Check

1. **Validate PRD exists:**
   ```bash
   test -f .agents/tasks/prd.json || { echo "Missing PRD. Run /burlaki-start first."; exit 1; }
   ```

2. **Ensure worktree (recommended):**
   ```bash
   git worktree list | grep -q ".codex/worktrees" || \
     echo "Consider creating a worktree: git worktree add .codex/worktrees/<id> -b feature/<id>-<slug> develop"
   ```

## Execution Loop

### Step 0: Select Next Story

```bash
# Get next pending story with satisfied dependencies
jq -r '.stories[] | select(.status == "pending") | select(.depends_on | length == 0 or all(. as $dep | .[].stories[]? | select(.id == $dep) | .status == "done")) | .id' .agents/tasks/prd.json | head -1
```

**If `--parallel`:** Get ALL pending stories with satisfied dependencies.

### Step 1: SETUP (per story)

**Goal:** Prepare clean workspace for this story.

**Tasks:**
- Verify clean git state (or warn)
- Check dependencies are installed
- Note the story being worked on

**Output:**
```
STORY: <story-id>
STATUS: ready
```

### Step 2: IMPLEMENT (per story)

**Goal:** Write code to satisfy acceptance criteria.

**Agent:** CoderAgent or general-purpose (fresh context per story)

**Input:**
- Story from PRD
- Relevant plan section
- Project patterns from CLAUDE.md/AGENTS.md

**Prompt template:**
```
Implement story: <story-id> - <title>

Acceptance Criteria:
- [ ] <criterion 1>
- [ ] <criterion 2>
- [ ] <criterion 3>

Plan Context:
<relevant plan section excerpt>

Likely files: <files_likely from PRD>

Guidelines:
- Follow project conventions (check CLAUDE.md/AGENTS.md)
- Run typecheck/lint before marking done
- Keep changes minimal and focused

Output format:
FILES_CHANGED: [list of modified/created files]
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

### Step 3: VERIFY (per story) — CRITICAL

**Goal:** Independent verification that acceptance criteria are met.

**Agent:** Verifier (FRESH context — different from developer!)

**Persona:**
```
You are a senior QA engineer with a skeptical mindset.
Your ONLY job is to say "NO" until the work is truly complete.

Guidelines:
- Check EVERY acceptance criterion from the story
- Verify edge cases are handled
- Don't accept "works on my machine" without evidence
- Be MORE critical than the developer would be
- You are the quality gate

Anti-patterns:
- Don't just read the code — VERIFY it works
- Don't trust the developer's word — VERIFY claims
- Don't skip edge cases — they're where bugs hide
```

**Input:**
- Story: `{{story}}`
- Implementation: `{{FILES_CHANGED}}`
- Acceptance criteria from PRD

**Prompt template:**
```
VERIFY implementation for story: <story-id>

Files changed:
<list files with key code excerpts>

Acceptance Criteria to verify:
- [ ] <criterion 1>
- [ ] <criterion 2>  
- [ ] <criterion 3>

For each criterion:
1. Check if the code ACTUALLY implements it
2. Look for edge cases
3. Verify no regressions introduced

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

**Goal:** Ensure tests exist and pass.

**Agent:** TestEngineer or general-purpose (fresh context)

**Tasks:**
- Run existing test suite
- Add tests for new acceptance criteria
- Add edge case tests
- Ensure all tests pass

**Prompt template:**
```
Test implementation for story: <story-id>

Files changed: <list>
Acceptance criteria: <list>

Tasks:
1. Run existing test suite
2. Add tests for each acceptance criterion
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

**Goal:** Multi-perspective code review.

**Approach:** Run review checks sequentially or spawn parallel agents.

**Review checklist:**

```javascript
// Security review
Task({
  subagent_type: "general-purpose",
  description: "Security review",
  prompt: `
    Review files for security issues: <FILES_CHANGED>
    
    Check for:
    - SQL injection
    - XSS vulnerabilities
    - Authentication/authorization bypass
    - Sensitive data exposure
    - Input validation gaps
    
    Output: APPROVED | CHANGES_REQUESTED: [specific issues]
  `,
  run_in_background: true
})

// Performance review
Task({
  subagent_type: "general-purpose",
  description: "Performance review",
  prompt: `
    Review files for performance issues: <FILES_CHANGED>
    
    Check for:
    - N+1 queries
    - Missing database indexes
    - Memory leaks
    - Inefficient algorithms
    
    Output: APPROVED | CHANGES_REQUESTED: [specific issues]
  `,
  run_in_background: true
})

// Code quality review
Task({
  subagent_type: "general-purpose",
  description: "Code quality review",
  prompt: `
    Review files for code quality: <FILES_CHANGED>
    
    Check for:
    - YAGNI violations
    - Over-engineering
    - Unclear naming
    - Missing error handling
    
    Output: APPROVED | CHANGES_REQUESTED: [specific issues]
  `,
  run_in_background: true
})
```

**Consolidate results:**
```
SECURITY: APPROVED
PERFORMANCE: APPROVED
CODE_QUALITY: CHANGES_REQUESTED - extract method in User#authenticate

OVERALL: CHANGES_REQUESTED
STATUS: changes_requested → back to IMPLEMENT
```

### Step 6: COMMIT (per story)

**After STATUS: approved:**

```bash
git add <FILES_CHANGED>

git commit -m "feat(<module>): <story title>

Story: <story-id>
Acceptance:
- <criterion 1>
- <criterion 2>

Verified: verifier agent
Tested: test agent
Reviewed: security, performance, quality agents"
```

**Update PRD:**
```bash
jq '(.stories[] | select(.id == "<story-id>") | .status) = "done"' \
  .agents/tasks/prd.json > .agents/tasks/prd.json.tmp && \
  mv .agents/tasks/prd.json.tmp .agents/tasks/prd.json
```

### Step 7: NEXT STORY or COMPOUND

**If more pending stories:**
- Return to Step 0

**If all stories done:**
- Proceed to COMPOUND phase

### Step 8: COMPOUND (after all stories)

**Goal:** Extract learnings for future iterations.

**Tasks:**
1. Review entire feature implementation
2. Extract reusable patterns
3. Document gotchas and solutions
4. Record metrics

**Output:**
```bash
mkdir -p docs/solutions/<category>
```

File: `docs/solutions/<category>/<topic>-learnings.md`

Structure:
```markdown
---
title: <Feature> Implementation Learnings
category: <category>
tags: [tag1, tag2, tag3]
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
### Pattern 1: <Name>
Description of the pattern and when to use it.

Example:
```
<code example>
```

## Gotchas
### Gotcha 1: <Issue>
- **Problem:** What went wrong
- **Solution:** How it was fixed
- **Prevention:** How to avoid in future

## Metrics
- Stories completed: X
- Avg cycle time: Y min/story
- First-pass success rate: Z%
- Human interventions: N

## References
- Brainstorm: docs/brainstorms/...
- Plan: docs/plans/...
```

## Parallel Execution Mode

When `--parallel` flag is set:

1. **Identify parallelizable stories:**
   - Status: pending
   - Dependencies: all satisfied

2. **Spawn multiple implementers:**
   ```javascript
   // Stories with no dependencies on each other
   parallel_stories.forEach(story => {
     Task({
       subagent_type: "CoderAgent",
       prompt: `Implement story ${story.id}...`,
       run_in_background: true
     })
   })
   ```

3. **Each story proceeds through its own pipeline**

4. **Stories with dependencies wait for dependencies to complete**

## Metrics Tracking

Log to `.agents/metrics/run-<workflow-id>.json`:

```json
{
  "workflow_id": "auth-feature-2026-02-14",
  "started": "2026-02-14T10:00:00Z",
  "completed": "2026-02-14T13:15:00Z",
  "stories": [
    {
      "id": "auth-001",
      "started": "2026-02-14T10:05:00Z",
      "implement_min": 25,
      "verify_min": 5,
      "test_min": 10,
      "review_min": 5,
      "total_min": 45,
      "verify_first_try": true,
      "review_first_try": true,
      "human_interventions": 0
    }
  ],
  "totals": {
    "stories_completed": 7,
    "total_time_min": 195,
    "avg_cycle_time_min": 28,
    "first_pass_success_rate": 0.71,
    "human_touch_rate": 0.14
  }
}
```

## Guardrails

- **Fresh context per step:** Each agent gets clean session
- **Verifier must be separate:** Never same session as developer
- **No skipping steps:** implement → verify → test → review is mandatory
- **Human approval** for escalations
- **Iteration cap:** Stop after N retries on same story, escalate

## Escalation Triggers

- Story fails VERIFY 3+ times
- Story fails TEST 3+ times  
- REVIEW returns CHANGES_REQUESTED 3+ times
- Explicit `@human` tag in story

**Escalated stories:** Mark with `status: "blocked"` and add `blocked_reason` field.

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

Stories: 7/7
├── Completed: 6
├── Blocked: 0
└── Escalated: 1 (@human tag)

Metrics:
├── Total time: 3h 15m
├── Avg cycle time: 28m/story
├── First-pass success: 71%
└── Human touch rate: 14%

Artifacts:
├── PRD: .agents/tasks/prd.json
├── Learnings: docs/solutions/<category>/<topic>-learnings.md
└── Metrics: .agents/metrics/run-<id>.json

Next Steps:
1. Review escalated stories with /burlaki-human
2. Run /burlaki-continue after resolution
3. Create PR: gh pr create --title "..."
═══════════════════════════════════════════════════════════════
```
