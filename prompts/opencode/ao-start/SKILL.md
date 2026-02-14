---
name: ao-start
description: Start workflow from PRD and task planning (manager stage)
---

# AO Start

Start workflow via Ralph manager stage: collect requirements, create PRD, and prepare a compact task list for coder loop.

**Input**: The user's request describes the product request.

**Steps**

1) If request is missing or ambiguous, ask focused clarifying questions and provide around 3 options per question plus free-form input.
1) Run a short pre-PRD ideation pass with `brainstorming` skill:
   - produce candidate solution directions, key trade-offs, and unknowns
   - convert output to concrete PRD inputs (scope boundaries and decisions to confirm)
   - if skill is missing, stop and suggest installation:

```bash
npx skills add obra/superpowers@brainstorming -g -y
```

1) Run manager stage with Ralph PRD flow:

```bash
ralph prd
```

Or pass a direct prompt when supported by your local Ralph setup.

1) Ensure output PRD path is known (default):

```bash
.agents/tasks/prd.json
```

If a different PRD path is used, mention it explicitly.

1) Validate that PRD includes:
   - scope and unknowns (no assumptions without confirmation)
   - architecture direction
   - compact tasks with acceptance criteria
   - context links for coder

1) If relevant specs exist, link them in task context as reference artifacts.
   Specs are advisory anti-drift guidance, not the primary execution source.

**Output**

Summarize:
- PRD location
- number of planned tasks/stories
- tasks marked for human attention (if any)
- readiness to start coder cycle with `/ao-run`

**Guardrails**
- Do NOT jump into coding before human approval of PRD/tasks
- PRD JSON is the primary execution source of truth
- Specs are secondary reference for anti-drift checks
- If PRD and specs diverge, execute by PRD and add a follow-up tagged `@spec-drift`
- Keep context compact for coder
- Tag escalations explicitly (default tag: `@human`)
