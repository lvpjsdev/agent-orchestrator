---
name: burlaki-rollback
description: Rollback to a previous checkpoint with safety checks
---

# Burlaki Rollback

Rollback the workflow to a previous checkpoint, story state, or specific commit.

**Input**: `--to <target> [--dry-run] [--yes]`

**Targets:**
- `last-checkpoint` — Most recent `[burlaki-checkpoint]` commit
- `<story-id>` — Checkpoint for specific story (e.g., `auth-003`)
- `<sha>` — Direct commit SHA

**Steps**

1) Validate target exists and resolve to SHA:

```bash
# For last-checkpoint
TARGET_SHA=$(git log --grep='\[burlaki-checkpoint\]' -n 1 --format=%H)

# For story-id
TARGET_SHA=$(git log --grep='\[burlaki-checkpoint\]' --grep="<story-id>" --all-match -n 1 --format=%H)

# For SHA
git rev-parse --verify "<sha>^{commit}"
```

2) Check working directory is clean:

```bash
git status --porcelain
```

If dirty, stop and ask user to commit/stash first.

3) Preview changes:

```bash
COMMITS=$(git rev-list --count HEAD "^$TARGET_SHA")
git log --oneline HEAD "^$TARGET_SHA"
```

4) If `--dry-run`, show preview and exit.

5) Confirm with user (skip if `--yes`).

6) Execute rollback:

```bash
git reset --hard "$TARGET_SHA"
```

7) Verify PRD is valid JSON:

```bash
jq empty .agents/tasks/prd.json
```

8) Show recovery command: `git reset --hard ORIG_HEAD`

**Guardrails**
- Block rollback if working directory has uncommitted changes
- Always show preview before executing
- Provide recovery command after completion
