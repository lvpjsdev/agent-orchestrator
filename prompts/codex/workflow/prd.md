---
description: PRD phase guidance for compound workflow
argument-hint: "<product request>"
---

# PRD Phase — DECOMPOSE

## Execution

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
     "schema_version": "1.0.0",
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
     "schema_version": "1.0.0",
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

## Original Orchestrator

Derived from `prompts/codex/burlaki-start.md`
