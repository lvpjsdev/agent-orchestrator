# agent-orchestrator

Operational orchestration utilities for agent workflow governance.

## Inspiration & References

This project's compound engineering workflow was significantly influenced by:

- **[Antfarm Patterns: Orchestrating Specialized Agent Teams](https://www.vincirufus.com/posts/antfarm-patterns-orchestrating-specialized-agent-teams/)** by Vinci Rufus — Key insights on fresh contexts per step, verifier agents, status protocols, and checkpoint systems.
- **[The Ralph Loop: Autonomous AI Agent Pattern](https://www.vincirufus.com/posts/ralph-loop-compound-engineering-future-software-development/)** by Vinci Rufus — Iterative development loop with fresh context per iteration.
- **[compound-engineering-plugin](https://github.com/EveryInc/compound-engineering-plugin)** by Every — Research agents, review swarms, and orchestration patterns.

## Source of truth

- `agent-skills-matrix.json` - required/optional/forbidden skills per stage.

## CLI

```bash
pnpm -C packages/agent-orchestrator skills:gate -- --matrix ./agent-skills-matrix.json --stage coder --agent claude
```

Optional flags:

- `--log <path>`: enables detection of actually used/forbidden skills from run logs.
- `--policies <csv>`: passes satisfied policy checks (needed for stages with `requiredPolicies`).

## Manager stage dependency

- `brainstorming` skill is required before `/ao-start` PRD creation.
- Install command:

```bash
npx skills add obra/superpowers@brainstorming -g -y
```

## Codex prompts (slash commands)

This repo ships shared Codex prompt files (slash commands) under:

- `packages/agent-orchestrator/prompts/codex/*.md`

Install them into your local Codex prompt directory (usually `~/.codex/prompts`):

```bash
pnpm -C packages/agent-orchestrator prompts:install
```

Overwrite existing files:

```bash
pnpm -C packages/agent-orchestrator prompts:install -- --force
```

Main workflow prompts:

- `/ao-start` - manager stage: brainstorm → plan → PRD decomposition.
- `/ao-run` - execution loop: implement → verify → test → review → commit → compound.
- `/ao-continue` - resume interrupted workflow with validation and checkpoints.
- `/ao-human` - list tasks tagged for human escalation (default tag `@human`).

## Compound Engineering Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        COMPOUND ENGINEERING CYCLE                                │
│                                                                                  │
│        "Each unit of work should make subsequent units easier"                  │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                          │   │
│   │     /ao-start          /ao-run              COMPOUND                     │   │
│   │         │                  │                    │                        │   │
│   │         ▼                  ▼                    ▼                        │   │
│   │     ┌──────┐          ┌──────┐            ┌──────┐                       │   │
│   │     │ PLAN │ ───────► │ WORK │ ────────► │LEARN │                       │   │
│   │     └──────┘          └──────┘            └──────┘                       │   │
│   │                                              │                           │   │
│   │                                              │                           │   │
│   │                                              ▼                           │   │
│   │                                       docs/solutions/                    │   │
│   │                                              │                           │   │
│   │                                              │                           │   │
│   │               ┌──────────────────────────────┘                           │   │
│   │               │                                                           │   │
│   │               ▼                                                           │   │
│   │        NEXT ITERATION IS EASIER                                           │   │
│   │        (learnings-researcher finds past solutions)                        │   │
│   │                                                                           │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Workflow Phases

| Command | Phase | Purpose | Output |
|---------|-------|---------|--------|
| `/ao-start` | PLAN | WHAT to build, HOW to build it | `docs/brainstorms/`, `docs/plans/`, `.agents/tasks/prd.json` |
| `/ao-run` | WORK | Execute atomic stories with verify step | Code, tests, commits |
| `/ao-run` (end) | LEARN | Extract patterns, document gotchas | `docs/solutions/<category>/` |
| `/ao-continue` | RECOVER | Resume with validation | Checkpoints, state fixes |

### Compound Feedback Loop

```
docs/solutions/ ──► learnings-researcher (in /ao-start) ──► better plans
      │
      └──► pattern-recognition-specialist (in /ao-continue) ──► faster recovery
```

Workflow source-of-truth policy:

- PRD JSON is the primary execution source for the loop.
- Specs are a secondary reference for anti-drift checks.
- If PRD and specs diverge, execution follows approved PRD and drift is tagged (recommended: `@spec-drift`).

Git flow policy:

- `main`: protected production branch, no direct pushes.
- `develop`: integration branch for test-stand deploy.
- `feature/<story-id>-<slug>`: one branch per story/task.
- Each new feature branch must be created with a dedicated worktree.
- Recommended command:
  `git worktree add .codex/worktrees/<story-id> -b feature/<story-id>-<slug> develop`
