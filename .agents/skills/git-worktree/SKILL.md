---
name: git-worktree
description: Manage git worktrees for feature branch development
---

# Git Worktree Management

Centralized worktree operations (create, list, prune, switch) enforcing one-worktree-per-feature policy.

## Purpose

Automate worktree lifecycle management for feature development, ensuring isolation and clean workspace hygiene.

## Capabilities

- Create worktree for new feature branches with auto-increment
- List all worktrees with sync status (branch name, ahead/behind, timestamp)
- Prune stale worktrees (auto after merge, manual bulk operation)
- Switch between worktrees with git HEAD update
- Detect and auto-correct out-of-sync worktrees

## Constraints

- Must use pattern: `.codex/worktrees/<story-id>` for worktree directory
- Must use pattern: `feature/<story-id>-<slug>` for branch naming (strict enforcement)
- Auto-increment suffix (`-v2`, `-v3`) if worktree already exists for scene-id
- Fail fast on errors (disk space, permissions) - no retry/fallback
- Use multi-method sync detection (git rev-list + git worktree prune -v)

## Process

### create - Initialize worktree for feature branch

**Input:** `story-id` (required), `slug` (required)

**Steps:**

1. Validate branch name format: `feature/<story-id>-<slug>`
2. Check if worktree already exists at `.codex/worktrees/<story-id>`
3. If exists, auto-increment suffix: `feature/<story-id>-<slug>-v2`, `-v3`, etc.
4. Ensure parent branch exists: `develop`
5. Create worktree:

```bash
git worktree add .codex/worktrees/<story-id> -b feature/<story-id>-<slug> develop
```

6. Return worktree path and branch name

**Error handling:** Fail fast with error code 1 on git errors (no retry)

### list - Show all worktrees with sync status

**Steps:**

1. List all worktrees:

```bash
git worktree list
```

2. For each worktree, check sync status:

```bash
cd <worktree-path>
git rev-list --count HEAD..@{u}  # behind commits
git rev-list --count @{u}..HEAD  # ahead commits
```

3. Format output: branch name, ahead/behind counts, last updated timestamp

### prune - Remove stale worktrees

**Steps:**

1. Detect merged branches:

```bash
git branch --merged develop
```

2. Remove worktrees for merged branches (auto-cleanup):

```bash
git worktree remove <worktree-path>
```

3. Optionally run bulk prune:

```bash
git worktree prune -v
```

### switch - Navigate between worktrees

**Input:** `worktree-path` or `story-id`

**Steps:**

1. Validate worktree exists
2. Change directory to worktree: `cd .codex/worktrees/<story-id>`
3. Update git HEAD to associated branch:

```bash
git checkout <branch-name>
```

4. Return success with current directory and branch
