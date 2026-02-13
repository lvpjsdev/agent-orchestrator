---
description: Continue interrupted Ralph development cycle
argument-hint: "[iterations]"
---

# AO Continue

Continue interrupted cycle using existing PRD/task state and Ralph loop.

**Input**: Optional number of iterations to run now (default `1`).

**Steps**

1) Check that PRD exists (default):

```bash
test -f .agents/tasks/prd.json
```

If missing, stop and ask to run `/ao-start` first.

1) Run one or more iterations to resume:

```bash
ralph build <iterations>
```

Use default `1` when not provided.

1) Summarize result from latest run metadata/log:
- story handled this iteration
- status (`done`, reset to `open`, or blocked)
- key fail reasons if blocked (tests/review/skill gate)
- whether escalation tag is present
- whether PRD/specs drift was detected (`@spec-drift`)

1) If a story is stuck across attempts, propose escalation with `@human` tag and show it via `/ao-human`.

**Guardrails**
- Continue from existing state; do not rewrite PRD unless user asks
- Respect iteration caps from config (`MAX_ITERATIONS`) and project policy
- PRD JSON is the execution source; specs are reference checks for drift only
