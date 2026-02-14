---
description: Start compound engineering workflow (brainstorm → plan → PRD)
argument-hint: "<product request>"
---

# AO Start — Compound Engineering Workflow

Multi-agent orchestrated workflow with fresh contexts and explicit handoffs.

## Input
The argument after `/burlaki-start` is the product request.

## Architecture Overview

See [README.md](../../README.md) for the full compound engineering cycle diagram.

**Handoff chain:** `{{brainstorm}}` → `{{plan}}` → `{{prd}}`

**Compound feedback:** `docs/solutions/` → learnings feed into next iteration

## Execution

### Phase 1: Brainstorm (WHAT)

**Goal:** Understand WHAT we're building and WHY.

**Steps:**

1. **If request is missing/ambiguous:**
   - Use AskUserQuestion tool with 3 focused options
   - Do not proceed until request is clear

2. **Gather project context (parallel):**
   ```javascript
   Task({
     subagent_type: "Explore",
     description: "Gather project context",
     prompt: `
       Analyze repository for patterns relevant to: <product request>
       
       Look for:
       - Existing similar features
       - CLAUDE.md or AGENTS.md guidance
       - Architectural patterns in use
       - Technology stack
       
       Return structured findings for brainstorm context.
     `
   })
   ```

3. **Run brainstorming dialogue:**
   - Ask questions ONE AT A TIME using AskUserQuestion tool
   - Explore 2-3 approaches with pros/cons
   - Lead with recommendation, explain why
   - Apply YAGNI — prefer simpler solutions

4. **Write brainstorm document:**
   ```bash
   mkdir -p docs/brainstorms
   ```
   
   Filename: `docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.md`
   
   Structure:
   ```markdown
   ---
   date: YYYY-MM-DD
   topic: <kebab-case-topic>
   status: done
   ---
   
   # <Topic>
   
   ## What We're Building
   [1-2 paragraphs max]
   
   ## Why This Approach
   [Chosen approach and rationale]
   
   ## Key Decisions
   - [Decision 1]: [Rationale]
   - [Decision 2]: [Rationale]
   
   ## Approaches Considered
   ### Approach A (Chosen)
   - Pros: [...]
   - Cons: [...]
   
   ### Approach B
   - Pros: [...]
   - Cons: [...]
   
   ## Open Questions
   - [Any unresolved questions for planning phase]
   ```

5. **Handoff:**
   Use AskUserQuestion tool:
   ```
   Question: "Brainstorm captured. Ready to proceed?"
   Options:
   1. Proceed to planning (Recommended)
   2. Refine further
   3. Review document first
   ```

### Phase 2: Plan (HOW)

**Goal:** Define HOW to build it with implementation details.

**Steps:**

1. **Check for past learnings:**
   ```bash
   # Search for relevant past solutions
   find docs/solutions -name "*.md" -type f 2>/dev/null | head -20
   ```
   
   If found, read relevant learnings to inform planning.

2. **Analyze user flows and edge cases:**
   - Identify all user interactions
   - Map error scenarios
   - Find gaps in requirements

3. **Research if needed (conditional):**
   
   For unfamiliar technologies/frameworks:
   ```javascript
   Task({
     subagent_type: "general-purpose",
     description: "Research framework docs",
     prompt: `
       Research best practices for: <technology/framework>
       
       Focus on:
       - Implementation patterns
       - Common pitfalls
       - Security considerations
       
       Return actionable recommendations.
     `
   })
   ```

4. **Write plan document:**
   ```bash
   mkdir -p docs/plans
   ```
   
   Filename: `docs/plans/YYYY-MM-DD-<type>-<name>-plan.md`
   
   Structure:
   ```markdown
   ---
   title: <type>: <title>
   type: feat | fix | refactor
   status: active
   date: YYYY-MM-DD
   brainstorm: docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.md
   ---
   
   # <Title>
   
   ## Overview
   [Executive summary — 2-3 sentences]
   
   ## Proposed Solution
   [High-level approach]
   
   ## Technical Approach
   
   ### Architecture
   [Technical design — diagrams if needed]
   
   ### Implementation Phases
   
   #### Phase 1: <Name>
   Tasks:
   - [ ] Task 1
   - [ ] Task 2
   
   Acceptance Criteria:
   - [ ] Criterion 1
   - [ ] Criterion 2
   
   #### Phase 2: <Name>
   ...
   
   ## Edge Cases
   - [Edge case 1]: [How to handle]
   - [Edge case 2]: [How to handle]
   
   ## References
   - Past learnings: [links to docs/solutions/ if any]
   ```

5. **Handoff:**
   Use AskUserQuestion tool:
   ```
   Question: "Plan ready. What next?"
   Options:
   1. Proceed to PRD generation (Recommended)
   2. Review plan first
   3. Need more research
   ```

### Phase 3: PRD (DECOMPOSE)

**Goal:** Break plan into atomic, executable stories.

**Steps:**

1. **Read the plan document:**
   ```bash
   cat docs/plans/*-plan.md
   ```

2. **Decompose each plan phase into atomic stories:**
   
   **Decomposition rules (CRITICAL):**
   
   Each story MUST:
   - Be completable in **< 1 hour**
   - Have **1-3 testable acceptance criteria**
   - List **explicit dependencies** on other stories
   - Reference **source plan section**
   - List **likely files** to be modified

3. **Write PRD JSON:**
   
   ```bash
   mkdir -p .agents/tasks
   ```
   
   File: `.agents/tasks/prd.json`
   
   Structure:
   ```json
   {
     "version": 1,
     "created": "YYYY-MM-DDTHH:mm:ssZ",
     "plan": "docs/plans/YYYY-MM-DD-<type>-<name>-plan.md",
     "brainstorm": "docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.md",
     "stories": [
       {
         "id": "<module>-001",
         "title": "<Action verb> <noun>",
         "plan_section": "Phase 1: <Name>",
         "acceptance": [
           "<Testable criterion 1>",
           "<Testable criterion 2>",
           "<Testable criterion 3>"
         ],
         "depends_on": [],
         "estimate_min": 30,
         "files_likely": ["path/to/file1.ext", "path/to/file2.ext"],
         "status": "pending",
         "tags": []
       }
     ]
   }
   ```

   **Example:**
   ```json
   {
     "version": 1,
     "created": "2026-02-14T10:00:00Z",
     "plan": "docs/plans/2026-02-14-feat-user-auth-plan.md",
     "brainstorm": "docs/brainstorms/2026-02-14-auth-brainstorm.md",
     "stories": [
       {
         "id": "auth-001",
         "title": "Create User model with email/password",
         "plan_section": "Phase 1: Foundation",
         "acceptance": [
           "User table exists with email, password_digest columns",
           "Email is unique and validated",
           "Password is hashed with bcrypt"
         ],
         "depends_on": [],
         "estimate_min": 30,
         "files_likely": ["app/models/user.rb", "db/migrate/xxx_create_users.rb"],
         "status": "pending",
         "tags": ["model", "database"]
       },
       {
         "id": "auth-002",
         "title": "Implement login API endpoint",
         "plan_section": "Phase 2: Authentication",
         "acceptance": [
           "POST /login accepts email + password",
           "Returns 200 with session token on success",
           "Returns 401 on invalid credentials"
         ],
         "depends_on": ["auth-001"],
         "estimate_min": 30,
         "files_likely": ["app/controllers/sessions_controller.rb", "config/routes.rb"],
         "status": "pending",
         "tags": ["api", "controller"]
       },
       {
         "id": "auth-003",
         "title": "Add login form UI",
         "plan_section": "Phase 3: Frontend",
         "acceptance": [
           "Form has email and password fields",
           "Form calls /login API on submit",
           "Shows error message on failure"
         ],
         "depends_on": ["auth-002"],
         "estimate_min": 45,
         "files_likely": ["app/views/sessions/new.html.erb", "app/assets/stylesheets/"],
         "status": "pending",
         "tags": ["ui", "frontend"]
       }
     ]
   }
   ```

4. **Validate PRD:**
   - [ ] All stories have acceptance criteria
   - [ ] Dependencies form a DAG (no cycles)
   - [ ] No story > 60 minutes estimate
   - [ ] All plan sections covered
   - [ ] IDs are unique and follow pattern

5. **Output summary:**
   ```
   PRD generated: .agents/tasks/prd.json
   
   Summary:
   - Stories: X
   - Estimated time: Y hours Z minutes
   - Parallel stories: Z (no dependencies, can run simultaneously)
   - Critical path: [story-id chain]
   
   Ready for /burlaki-run
   ```

## Guardrails

- **Never skip phases:** brainstorm → plan → PRD is mandatory
- **Human approval required** before /burlaki-run
- **Fresh context per phase:** Each phase reads from artifacts, not memory
- **STATUS protocol:** Every phase outputs explicit status
- **Handoff chain:** `{{brainstorm}}` → `{{plan}}` → `{{prd}}`

## Status Protocol

```
STATUS: done           → Proceed to next phase
STATUS: retry          → Repeat current phase with feedback
STATUS: blocked        → Escalate to human
STATUS: needs_clarification → Return to user for input
```

## Metrics (Logged)

Log to `.agents/metrics/planning-<timestamp>.json`:
```json
{
  "workflow_id": "<topic>-YYYY-MM-DD",
  "phases": {
    "brainstorm": { "duration_min": X, "questions_asked": Y },
    "plan": { "duration_min": X, "research_tasks": Y },
    "prd": { "duration_min": X, "stories_generated": Y }
  },
  "total_planning_min": Z
}
```
