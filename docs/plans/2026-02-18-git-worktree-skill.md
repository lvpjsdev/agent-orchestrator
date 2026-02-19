# Git Worktree Management Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a comprehensive `.agents/skills/git-worktree/SKILL.md` that centralizes worktree operations (create, list/status, cleanup/prune, switch) and integrates with `/burlaki-run` prompts.

**Architecture:** Agent-integrated skill following existing `.agents/skills/` patterns with YAML frontmatter. Operations execute via `child_process` to git worktree commands. Auto-correction uses multi-method sync detection (git rev-list + worktree prune). Integration updates burlaki-run prompts to call skill.

**Tech Stack:** Node.js ESM, child_process for git commands, existing skill/prompt patterns

---

## Task 1: Create git-worktree skill directory

**Files:**
- Create: `.agents/skills/git-worktree/SKILL.md`

**Step 1: Create skill directory structure**

```bash
mkdir -p .agents/skills/git-worktree
```

**Step 2: Write initial SKILL.md with YAML frontmatter**

```markdown
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
- Auto-increment suffix (`-v2`, `-v3`) if worktree already exists for story-id
- Fail fast on errors (disk space, permissions) - no retry/fallback
- Use multi-method sync detection (git rev-list + git worktree prune -v)
```

**Step 3: Verify file created**

Run: `ls -la .agents/skills/git-worktree/SKILL.md`
Expected: File exists with content above

**Step 4: Commit**

```bash
git add .agents/skills/git-worktree/SKILL.md
git commit -m "feat: add git-worktree skill skeleton"
```

---

## Task 2: Add Process section to SKILL.md

**Files:**
- Modify: `.agents/skills/git-worktree/SKILL.md`

**Step 1: Append Process section to SKILL.md**

```markdown
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
```

**Step 2: Run lint check**

Run: `pnpm lint`
Expected: No errors (markdown formatting OK)

**Step 3: Commit**

```bash
git add .agents/skills/git-worktree/SKILL.md
git commit -m "docs: add Process section to git-worktree skill"
```

---

## Task 3: Update Codex burlaki-run prompt to use skill

**Files:**
- Modify: `prompts/codex/burlaki-run.md`

**Step 1: Replace inline worktree logic with skill reference**

Find section around line 48-58 (worktree preflight check) and replace with:

```markdown
1) Ensure execution happens in a dedicated worktree for the current feature branch.

Use the **@git-worktree** skill to create/verify worktree:

```bash
# Ask git-worktree skill to handle worktree
@git-worktree create --story-id <story-id> --slug <task-slug>
```

The skill will:
- Validate branch name format (`feature/<story-id>-<slug>`)
- Auto-create worktree at `.codex/worktrees/<story-id>` if missing
- Auto-increment if worktree already exists (`-v2`, `-v3`)
- Report worktree path and branch name
```

**Step 2: Verify update**

Run: `grep "@git-worktree" prompts/codex/burlaki-run.md`
Expected: Found @git-worktree reference

**Step 3: Commit**

```bash
git add prompts/codex/burlaki-run.md
git commit -m "feat: integrate git-worktree skill in Codex burlaki-run"
```

---

## Task 4: Update OpenCode burlaki-run SKILL to use git-worktree

**Files:**
- Modify: `prompts/opencode/burlaki-run/SKILL.md`

**Step 1: Update worktree enforcement section in Guardrails**

Find line 56-57 (worktree enforcement) and update:

```markdown
- Each feature branch must run in its own git worktree (enforced by @git-worktree skill)
- @git-worktree skill auto-creates worktrees with strict pattern enforcement and auto-correction
```

**Step 2: Update Steps section worktree part**

Find line 24-29 (worktree pattern) and replace with:

```markdown
1) Ensure execution happens in a dedicated worktree using @git-worktree skill:

```bash
@git-worktree create --story-id <story-id> --slug <task-slug>
```

The skill validates format and auto-creates/updates worktree at `.codex/worktrees/<story-id>`.
```

**Step 3: Verify updates**

Run: `grep "@git-worktree" prompts/opencode/burlaki-run/SKILL.md`
Expected: Found 2 references

**Step 4: Commit**

```bash
git add prompts/opencode/burlaki-run/SKILL.md
git commit -m "feat: integrate git-worktree skill in OpenCode burlaki-run"
```

---

## Task 5: Update Claude burlaki-run SKILL to use git-worktree

**Files:**
- Modify: `prompts/claude/burlaki-run/SKILL.md`

**Step 1: Update worktree enforcement**

Find line 56-57 and update:

```markdown
- Each feature branch must run in its own git worktree (enforced by @git-worktree skill)
- @git-worktree skill provides auto-creation, strict naming, and sync detection
```

**Step 2: Update Steps section worktree part**

Find line 24-29 and replace with:

```markdown
1) Ensure execution happens in a dedicated worktree using @git-worktree skill:

```bash
@git-worktree create --story-id <story-id> --slug <task-slug>
```

Skill handles worktree lifecycle with auto-increment and sync detection.
```

**Step 3: Verify updates**

Run: `grep "@git-worktree" prompts/claude/burlaki-run/SKILL.md`
Expected: Found 2 references

**Step 4: Commit**

```bash
git add prompts/claude/burlaki-run/SKILL.md
git commit -m "feat: integrate git-worktree skill in Claude burlaki-run"
```

---

## Task 6: Update documentation references

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`

**Step 1: Update README.md worktree section**

Find worktree section (around line 146-169) and add reference:

```markdown
**Worktree Management**

The `@git-worktree` skill centralizes all worktree operations (create, list, prune, switch) with automation:

- **Auto-creation**: Worktrees created automatically when missing
- **Strict naming**: Enforces `feature/<story-id>-<slug>` pattern
- **Auto-increment**: Handles duplicates with `-v2`, `-v3` suffix
- **Sync detection**: Multi-method detection of stale worktrees
- **Auto-cleanup**: Removes worktrees for merged branches

Use via `/burlaki-run` prompts or directly: `@git-worktree create --story-id <id> --slug <name>`

See `.agents/skills/git-worktree/SKILL.md` for detailed operations.
```

**Step 2: Update AGENTS.md worktree guidance**

Find worktree section (around line 184-214) and add:

```markdown
**Worktree Skill**

Use the **@git-worktree** skill for all worktree operations instead of manual commands:

```bash
@git-worktree create --story-id <id> --slug <name>
@git-worktree list
@git-worktree prune
@git-worktree switch --story-id <id>
```

The skill enforces one-worktree-per-branch policy, handles auto-increment, and provides sync status.
```

**Step 3: Verify documentation**

Run: `grep "@git-worktree" README.md AGENTS.md`
Expected: References in both files

**Step 4: Commit**

```bash
git add README.md AGENTS.md
git commit -m "docs: add git-worktree skill references"
```

---

## Task 7: Build and verify

**Files:**
- Test: All modified files

**Step 1: Run build**

Run: `pnpm build`
Expected: Build succeeds with no errors

**Step 2: Run lint**

Run: `pnpm lint`
Expected: No lint errors (markdown formatting OK)

**Step 3: Verify skill discovery**

Run: `grep -r "git-worktree" .agents/skills/ prompts/`
Expected: Found in multiple locations

**Step 4: Final commit**

```bash
git add .
git commit -m "chore: build verification complete"
```

---

## Summary

After completing all tasks:

1. **git-worktree skill** created at `.agents/skills/git-worktree/SKILL.md` with full Process section
2. **Agent integration** - All three `/burlaki-run` prompts (Codex, OpenCode, Claude) updated to use skill
3. **Documentation** - README.md and AGENTS.md updated with skill references
4. **Core operations** implemented (create, list, prune, switch)

**Verification:**
```bash
pnpm build   # Build succeeds
pnpm lint    # No lint errors
```

→ Use `superpowers:executing-plans` to implement task-by-task.
