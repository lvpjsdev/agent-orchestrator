---
description: Start compound engineering workflow (brainstorm → plan → PRD)
argument-hint: "<product request>"
---

# AO Start — Compound Engineering Workflow

Multi-agent orchestrated workflow with fresh contexts and explicit handoffs.

## Input
The argument after `/ao-start` is the product request.

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
│  PHASE 1: BRAINSTORM (WHAT)                                                      │
│  ────────────────────────────                                                    │
│  Agent: manager + brainstorming skill                                           │
│  Swarm: repo-research-analyst (parallel context gathering)                      │
│  Output: docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.md                      │
│  Status: done → proceed | needs_clarification → ask user                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│  PHASE 2: PLAN (HOW)                                                             │
│  ────────────────────                                                            │
│  Agent: planner + research swarm                                                │
│  Swarm: learnings-researcher ◄── reads docs/solutions/ from past cycles        │
│         spec-flow-analyzer, framework-docs-researcher (if needed)               │
│  Input: {{brainstorm}}                                                          │
│  Output: docs/plans/YYYY-MM-DD-<type>-<name>-plan.md                            │
│  Status: done → proceed | retry → refine                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│  PHASE 3: PRD (DECOMPOSE)                                                        │
│  ─────────────────────────────                                                   │
│  Agent: planner (fresh context)                                                 │
│  Input: {{plan}}                                                                │
│  Output: .agents/tasks/prd.json (atomic stories, < 1 hour each)                 │
│  Status: done → ready for /ao-run                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  HANDOFF CHAIN: {{brainstorm}} ──► {{plan}} ──► {{prd}}                         │
│                                                                                  │
│  COMPOUND FEEDBACK LOOP:                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                          │    │
│  │   docs/solutions/ ◄── COMPOUND phase (after /ao-run completes)         │    │
│  │         │                                                                │    │
│  │         └──────────► learnings-researcher (in next /ao-start)           │    │
│  │                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Execution

### Phase 1: Brainstorm (WHAT)

**Goal:** Understand WHAT we're building and WHY.

**Steps:**

1. **If request is missing/ambiguous:**
   - Use AskUserQuestion tool with 3 focused options
   - Do not proceed until request is clear

2. **Spawn context gathering (parallel):**
   ```javascript
   Task({
     subagent_type: "compound-engineering:research:repo-research-analyst",
     description: "Gather project context",
     prompt: `
       Analyze repository for patterns relevant to: <product request>
       - Existing similar features
       - CLAUDE.md guidance
       - Architectural patterns in use
       Return findings for brainstorm context.
     `
   })
   ```

3. **Run brainstorming dialogue:**
   - Load `brainstorming` skill
   - Ask questions ONE AT A TIME
   - Explore 2-3 approaches with pros/cons
   - Lead with recommendation, explain why

4. **Write brainstorm document:**
   ```bash
   mkdir -p docs/brainstorms
   ```
   
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
   
   ## Context Sources
   - Repo research: [key findings]
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

1. **Create planning team:**
   ```javascript
   Teammate({ 
     operation: "spawnTeam", 
     team_name: "planning-<topic-slug>",
     description: "Planning: <topic>"
   })
   ```

2. **Spawn research swarm (parallel):**
   ```javascript
   // ALWAYS run these
   Task({
     team_name: "planning-<topic>",
     name: "learnings",
     subagent_type: "compound-engineering:research:learnings-researcher",
     prompt: `
       Search docs/solutions/ for relevant past solutions.
       Topic: <product request>
       
       Look for:
       - Similar problems solved before
       - Gotchas and lessons learned
       - Patterns to follow or avoid
       
       Send findings to team-lead via Teammate write.
     `,
     run_in_background: true
   })
   
   Task({
     team_name: "planning-<topic>",
     name: "spec-flow",
     subagent_type: "compound-engineering:workflow:spec-flow-analyzer",
     prompt: `
       Analyze user flows and identify gaps.
       Based on: <brainstorm content>
       
       Look for:
       - Edge cases not covered
       - Error scenarios
       - Missing acceptance criteria
       
       Send gap analysis to team-lead.
     `,
     run_in_background: true
   })
   
   // CONDITIONAL - if using frameworks
   Task({
     team_name: "planning-<topic>",
     name: "framework-docs",
     subagent_type: "compound-engineering:research:framework-docs-researcher",
     prompt: `
       Use Context7 MCP to get framework documentation.
       Frameworks: [detected from brainstorm]
       
       Get:
       - Implementation patterns
       - Best practices
       - API reference
       
       Send relevant docs to team-lead.
     `,
     run_in_background: true
   })
   ```

3. **Wait for research completion:**
   ```bash
   # Check inbox for all findings
   cat ~/.claude/teams/planning-<topic>/inboxes/team-lead.json
   ```

4. **Consolidate and write plan:**
   ```bash
   mkdir -p docs/plans
   ```
   
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
   [Executive summary]
   
   ## Proposed Solution
   [High-level approach]
   
   ## Technical Approach
   
   ### Architecture
   [Technical design]
   
   ### Implementation Phases
   
   #### Phase 1: <Name>
   - [ ] Task 1
   - [ ] Task 2
   - Acceptance Criteria:
     - [ ] Criterion 1
     - [ ] Criterion 2
   
   #### Phase 2: <Name>
   ...
   
   ## Edge Cases
   - [Edge case 1]: [How to handle]
   - [Edge case 2]: [How to handle]
   
   ## References
   - Learnings applied: [links to docs/solutions/]
   - Framework docs: [Context7 references]
   ```

5. **Cleanup team:**
   ```javascript
   Teammate({ operation: "requestShutdown", target_agent_id: "learnings" })
   Teammate({ operation: "requestShutdown", target_agent_id: "spec-flow" })
   Teammate({ operation: "requestShutdown", target_agent_id: "framework-docs" })
   // Wait for approvals...
   Teammate({ operation: "cleanup" })
   ```

6. **Handoff:**
   Use AskUserQuestion tool:
   ```
   Question: "Plan ready. What next?"
   Options:
   1. Proceed to PRD generation (Recommended)
   2. Review plan first
   3. Deepen plan with more research (/deepen-plan)
   ```

### Phase 3: PRD (DECOMPOSE)

**Goal:** Break plan into atomic, executable stories.

**Steps:**

1. **Generate PRD from plan:**
   ```bash
   ralph prd --from docs/plans/<plan-file>.md
   ```

2. **Decomposition rules (CRITICAL):**
   
   Each story MUST:
   - Be completable in < 1 hour
   - Have 1-3 testable acceptance criteria
   - List explicit dependencies on other stories
   - Reference source plan section
   
   Example:
   ```json
   {
     "stories": [
       {
         "id": "auth-001",
         "title": "Add User model with email/password",
         "plan_section": "Phase 1: Foundation",
         "acceptance": [
           "User table exists with email, password_digest columns",
           "Email is unique and validated",
           "Password is hashed with bcrypt"
         ],
         "depends_on": [],
         "estimate": "30min",
         "files_likely": ["app/models/user.rb", "db/migrate/xxx_create_users.rb"]
       },
       {
         "id": "auth-002",
         "title": "Create login API endpoint",
         "plan_section": "Phase 2: Authentication",
         "acceptance": [
           "POST /login accepts email + password",
           "Returns 200 with session token on success",
           "Returns 401 on invalid credentials"
         ],
         "depends_on": ["auth-001"],
         "estimate": "30min",
         "files_likely": ["app/controllers/sessions_controller.rb", "config/routes.rb"]
       }
     ]
   }
   ```

3. **Validate PRD:**
   - All stories have acceptance criteria
   - Dependencies form a DAG (no cycles)
   - No story > 1 hour estimate
   - All plan sections covered

4. **Output:**
   ```
   PRD generated: .agents/tasks/prd.json
   
   Summary:
   - Stories: X
   - Estimated time: Y hours
   - Parallel stories: Z (can run simultaneously)
   
   Ready for /ao-run
   ```

## Guardrails

- **Never skip phases:** brainstorm → plan → PRD is mandatory
- **Human approval required** before /ao-run
- **Fresh context per phase:** Each phase reads from artifacts, not memory
- **STATUS protocol:** Every phase outputs explicit status
- **Handoff chain:** {{brainstorm}} → {{plan}} → {{prd}}

## Status Protocol

```
STATUS: done           → Proceed to next phase
STATUS: retry          → Repeat current phase with feedback
STATUS: blocked        → Escalate to human
STATUS: needs_clarification → Return to user for input
```

## Metrics (Logged)

```
Phase 1 duration: X min
Phase 2 duration: Y min  
Phase 3 duration: Z min
Total planning time: T min
Stories generated: N
```
