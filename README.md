# agent-orchestrator

Operational orchestration utilities for agent workflow governance.

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

Main workflow prompts:

- `/ao-start` - manager stage: run brainstorming first, then create/clarify PRD and task plan.
- `/ao-run` - start coder loop after PRD approval (default 5 iterations).
- `/ao-continue` - resume an interrupted loop (default 1 iteration).
- `/ao-human` - list tasks tagged for human escalation (default tag `@human`).

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
