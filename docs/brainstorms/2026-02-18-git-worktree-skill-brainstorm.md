---
date: 2026-02-18
topic: git-worktree-skill
---

# Git Worktree Management Skill

## What We're Building

Create a comprehensive `.agents/skills/git-worktree/SKILL.md` that centralizes all worktree operations (create, list/status, cleanup/prune, switch) and integrates seamlessly with existing `/burlaki-run` agent prompts. The skill enforces the one-worktree-per-feature-branch policy, automates worktree creation when missing, auto-corrects synchronization issues, and performs auto-cleanup after merges with optional manual prune commands.

## Why This Approach

We evaluated three integration approaches:

**Approach A: Agent-integrated skill with automation** (chosen)
- Single source of truth for all worktree operations
- Full automation without additional setup
- Compatible with existing workflow documentation (README.md, AGENTS.md)
- Minimal friction for agents running burlaki workflows

**Approach B: CLI tool with agent hooks**
- Clean separation of concerns (CLI vs agent layer)
- CLI usable standalone
- But: Additional abstraction layer, more code, potential logic drift

**Approach C: Minimal skill + agent-side logic**
- Minimal changes to existing prompts
- But: Logic distributed across multiple places, less value from unified skill, potential duplication

Approach A was selected because it provides the comprehensive solution requested (consolidation + enhancement + integration) in a single location while matching the current architecture pattern of skills in `.agents/skills/`.

## Key Decisions

- **Full automation**: Skill automatically creates worktrees when missing using standard pattern `.codex/worktrees/<story-id> -b feature/<story-id>-<slug> develop`. No manual intervention required.

- **Auto-correction**: If worktree exists but is stale or out of sync, skill automatically updates/refreshes it instead of failing.

- **Hybrid cleanup**: Auto-cleanup performed after feature branch merge (worktree removed), but also provides manual `prune` command for bulk cleanup of old worktrees.

- **Four core operations**:
  - **create**: Initialize worktree for new feature branch
  - **list/status**: Show all worktrees with branch name, commit count ahead/behind, and last update timestamp
  - **cleanup/prune**: Remove stale worktrees (auto after merge detection via `git branch --merged`, manual bulk operation)
  - **switch**: Navigate between worktrees and update git HEAD to associated branch

- **Agent integration**: Skill called from `/burlaki-run` prompts (Codex, OpenCode, Claude) to enforce worktree policy during workflow execution.

- **Consolidation**: Existing worktree logic from README.md, AGENTS.md, and prompt preflight checks moves into this single skill to eliminate duplication.

## Resolved Questions

- **Switch operation**: Directory + git HEAD. Operation changes directory to worktree and also updates git HEAD to the associated branch.
- **Worktree naming**: Strict enforcement. Must match `feature/<story-id>-<slug>` pattern, error if format differs.
- **Sync detection**: Multi-method. Combination of git branch status checks (`git rev-list --count`) and `git worktree prune -v` for robust detection of stale worktrees.
- **Multi-story support**: Auto-increment. If worktree already exists for story-id, automatically suffix with `-v2`, `-v3`, etc. (e.g., `feature/123-task-v2`).
- **Error recovery**: Fail fast. Return error code immediately; agent must handle creation failures (disk space, permissions). No fallback attempts.

## Open Questions

None. All questions resolved.

## Next Steps

→ `/workflows:plan` for implementation details (SKILL.md structure, command implementations, agent prompt integration)
