# agent-orchestrator

Operational orchestration utilities for agent workflow governance.

## Source of truth

- `agent-skills-matrix.json` - required/optional/forbidden skills per stage.
- `.agents/skills/` - local skill definitions.

## CLI

```bash
pnpm skills:gate -- --matrix ./agent-skills-matrix.json --stage coder --agent claude
```

Optional flags:

- `--log <path>`: enables detection of actually used/forbidden skills from run logs.
- `--policies <csv>`: passes satisfied policy checks (needed for stages with `requiredPolicies`).

## Local Skills

All required skills are included in `.agents/skills/`:

| Stage | Required Skills |
|-------|-----------------|
| manager | brainstorming, prd |
| coder | coding-agent, react-best-practices, typescript-advanced-types |
| tester | e2e-testing-patterns, playwright |
| reviewer | (none) |
| devops | (none) |

## Codex prompts (slash commands)

Prompts located in `prompts/codex/*.md`. Install to `~/.codex/prompts`:

```bash
pnpm prompts:install
```

Overwrite existing files:

```bash
pnpm prompts:install -- --force
```

Main workflow prompts:

- `/ao-start` - manager stage: run brainstorming first, then create/clarify PRD and task plan.
- `/ao-run` - start coder loop after PRD approval (default 5 iterations).
- `/ao-continue` - resume an interrupted loop (default 1 iteration).
- `/ao-human` - list tasks tagged for human escalation (default tag `@human`).
- `/ao-gate` - run skills gate validation.

## Workflow source-of-truth policy

- PRD JSON (`.agents/tasks/prd.json`) is the primary execution source for the loop.
- Specs are a secondary reference for anti-drift checks.
- If PRD and specs diverge, execution follows approved PRD and drift is tagged (recommended: `@spec-drift`).

## Git flow policy

- `main`: protected production branch, no direct pushes.
- `develop`: integration branch for test-stand deploy.
- `feature/<story-id>-<slug>`: one branch per story/task.
- Each new feature branch must be created with a dedicated worktree.
- Recommended command:
  `git worktree add .codex/worktrees/<story-id> -b feature/<story-id>-<slug> develop`
