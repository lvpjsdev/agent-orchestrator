---
name: burlaki-run
description: Run coder cycle after PRD approval (Ralph loop)
---

# Burlaki Run

Run the development cycle after PRD/tasks are approved by a human.

**Input**
- Optional `iterations` (default `5`)
- Optional `--no-commit` for dry run

**Steps**

1) Validate PRD exists:

```bash
test -f .agents/tasks/prd.json
```

If missing, stop and suggest `/burlaki-start`.

1) Ensure execution happens in a dedicated worktree for the current feature branch.
   Recommended pattern:

```bash
git worktree add .codex/worktrees/<story-id> -b feature/<story-id>-<slug> develop
```

1) Start coder loop:

```bash
ralph build <iterations>
```

Use `5` by default.
When `--no-commit` is requested, run:

```bash
ralph build <iterations> --no-commit
```

1) After run, report:
   - processed stories/tasks
   - completed vs reopened tasks
   - test/review blockers
   - stories tagged for escalation (`@human`)
   - potential PRD vs specs drift findings (tag as `@spec-drift`)

1) If iteration cap is reached and tasks still fail, ensure they are tagged `@human` and direct user to `/burlaki-human`.

**Guardrails**
- Do not start run before human approval of PRD/tasks
- Keep each run bounded by explicit iteration count
- Each feature branch must run in its own git worktree
- PRD JSON remains the primary execution source
- Use specs as secondary reference to detect drift, not to override approved PRD
