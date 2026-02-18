---
description: Brainstorm phase guidance for compound workflow
argument-hint: "<product request>"
---

# Brainstorm Phase — WHAT

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
