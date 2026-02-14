# @lvpjsdev/burlaki

Operational orchestration utilities for agent workflow governance.

## Installation

```bash
npm install @lvpjsdev/burlaki
```

## Usage

```js
import matrix from '@lvpjsdev/burlaki';

console.log(matrix.stages.coder.requiredSkills);
```

Or import the matrix directly:

```js
import matrix from '@lvpjsdev/burlaki/matrix';
```

## Compound Engineering Workflow

This project implements a compound engineering workflow where each unit of work makes subsequent units easier.

**Core cycle:** PLAN → WORK → LEARN → (repeat with learnings)

See [WORKFLOW_DIAGRAMS.md](docs/WORKFLOW_DIAGRAMS.md) for visual reference.

### Commands

| Command | Phase | Purpose | Output |
|---------|-------|---------|--------|
| `/burlaki-start` | PLAN | Brainstorm → Plan → PRD decomposition | `docs/brainstorms/`, `docs/plans/`, `.agents/tasks/prd.json` |
| `/burlaki-run` | WORK | Execute stories with verify step | Code, tests, commits |
| `/burlaki-run` (end) | LEARN | Extract patterns, document gotchas | `docs/solutions/<category>/` |
| `/burlaki-continue` | RECOVER | Resume with validation and checkpoints | Checkpoints, state fixes |
| `/burlaki-human` | ESCALATE | List tasks tagged for human review | Tasks with `@human` tag |

### Compound Feedback Loop

```
/burlaki-run ──► COMPOUND ──► docs/solutions/ ──► next /burlaki-start (uses learnings)
```

## Source of Truth

- `agent-skills-matrix.json` - required/optional/forbidden skills per stage
- `.agents/skills/` - local skill definitions

## CLI

```bash
npx burlaki-skills-gate --matrix ./agent-skills-matrix.json --stage coder --agent claude
```

Optional flags:

- `--log <path>`: enables detection of actually used/forbidden skills from run logs
- `--policies <csv>`: passes satisfied policy checks (needed for stages with `requiredPolicies`)

## Local Skills

All required skills are included in `.agents/skills/`:

| Stage | Required Skills |
|-------|-----------------|
| manager | brainstorming, prd |
| coder | coding-agent, react-best-practices, typescript-advanced-types |
| tester | e2e-testing-patterns, playwright |
| reviewer | (none) |
| devops | (none) |

## Agent prompts/skills

This repo ships shared prompts and skills for multiple AI coding tools:

- `prompts/codex/*.md` - Codex slash commands
- `prompts/opencode/*/SKILL.md` - OpenCode skills
- `prompts/claude/*/SKILL.md` - Claude Code skills

### Local install (default)

Installs into project directory:

```bash
# Codex → .codex/prompts/
pnpm prompts:install:codex

# OpenCode → .opencode/skills/
pnpm prompts:install:opencode

# Claude Code → .claude/skills/
pnpm prompts:install:claude

# All at once
pnpm prompts:install
```

### Global install

Installs into home directory:

```bash
# Codex → ~/.codex/prompts/
pnpm prompts:install:codex:global

# OpenCode → ~/.config/opencode/skills/
pnpm prompts:install:opencode:global

# Claude Code → ~/.claude/skills/
pnpm prompts:install:claude:global

# All at once
pnpm prompts:install:global
```

### Overwrite existing

Add `--force` flag:

```bash
# Local
pnpm prompts:install:codex -- --force
pnpm prompts:install:opencode -- --force
pnpm prompts:install:claude -- --force

# Global
pnpm prompts:install:codex:global -- --force
pnpm prompts:install:opencode:global -- --force
pnpm prompts:install:claude:global -- --force
```

## Workflow Policies

### Source of Truth

- PRD JSON (`.agents/tasks/prd.json`) is the primary execution source
- Specs are a secondary reference for anti-drift checks
- If PRD and specs diverge, execution follows approved PRD and drift is tagged (`@spec-drift`)

### Git Flow

- `main`: protected production branch, no direct pushes
- `develop`: integration branch for test-stand deploy
- `feature/<story-id>-<slug>`: one branch per story/task
- Each new feature branch must use a dedicated worktree:

```bash
git worktree add .codex/worktrees/<story-id> -b feature/<story-id>-<slug> develop
```

### Checkpoints

Recovery checkpoints use `[burlaki-checkpoint]` prefix:

```bash
# Find checkpoints
git log --grep='[burlaki-checkpoint]'

# Restore
git reset --hard <checkpoint-sha>
```

## Roadmap

See [ROADMAP.md](ROADMAP.md) for planned features.

## Acknowledgments & License Attribution

This project's workflow was inspired by the following sources:

### Antfarm Patterns

**Article:** [Antfarm Patterns: Orchestrating Specialized Agent Teams](https://www.vincirufus.com/posts/antfarm-patterns-orchestrating-specialized-agent-teams/) by Vinci Rufus

Key concepts adapted:
- Fresh context per step
- Verifier agent (separate from developer)
- Status protocols
- Checkpoint systems
- Metrics tracking

### Ralph Loop

**Article:** [The Ralph Loop: Autonomous AI Agent Pattern](https://www.vincirufus.com/posts/ralph-loop-compound-engineering-future-software-development/) by Vinci Rufus

Key concepts adapted:
- Iterative development with fresh contexts
- Anti-drift patterns

### compound-engineering-plugin

**Repository:** [EveryInc/compound-engineering-plugin](https://github.com/EveryInc/compound-engineering-plugin) by Every

**License:** MIT License

```
MIT License

Copyright (c) 2025 Every

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

Key concepts adapted:
- Review agent patterns
- Research agent patterns
- Multi-agent swarm orchestration
- Compound documentation patterns

---

This project is used non-commercially. All derivative work maintains attribution to original authors.
