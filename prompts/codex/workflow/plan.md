---
description: Planning phase guidance for compound workflow
argument-hint: "<product request>"
---

# Plan Phase — HOW

## Execution

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
