---
title: Consolidate Worktrees and Merge Feature Branches
type: chore
status: active
date: 2026-02-19
---

# Consolidate Worktrees and Merge Feature Branches

## Decision

| Question | Decision |
|----------|----------|
| Merge strategy | **Merge now** + security follow-up PR |
| Uncommitted changes | **Commit** before merge |
| Feature branch | **Keep** for reference after merge |
| Stale remote branches | **Keep** (no action needed) |

---

## Overview

План консолидации всех ongoing работ в `develop` и подготовки к push в `origin`. Включает приоритизацию pending TODOs и определение blocking vs non-blocking issues.

## Current State Analysis

### Git Topology

```
origin/develop ──────────────────────────────────────●
                                                      \
develop ───────────────────────────────────────────────●──● (2 commits ahead)
                                                        \
feature/2026-02-18-beads-integration ───────────────────●──●──●──●──●──●──● (7 commits ahead)
                                                         ^
                                                    worktree at .codex/worktrees/2026-02-18-beads-integration
```

### Branches Summary

| Branch | Location | Commits Ahead | Status |
|--------|----------|---------------|--------|
| `develop` | main repo | 2 ahead of origin | ⚠️ Uncommitted changes |
| `feature/2026-02-18-beads-integration` | worktree | 7 ahead of develop | ✅ Clean working tree |
| `master` | - | - | Protected |
| `remotes/origin/feat/next-feature` | remote | - | Stale? |
| `remotes/origin/feature/package-rename-burlaki` | remote | - | Stale? |

### Uncommitted Changes in develop

| File | Status |
|------|--------|
| `ROADMAP_full.md` | Modified |
| `prompts/codex/burlaki-run.md` | Modified |
| `todos/001-complete-p1-parallel-flag-misalignment.md` | Modified |
| `todos/009-complete-p2-inconsistent-command-format.md` | Modified |
| `todos/010-complete-p3-malformed-code-block.md` | Modified |

### Feature Branch Contains

**New files (7 commits):**
- `scripts/beads-client.mjs` - CLI wrapper
- `scripts/beads-fallback.mjs` - JSON fallback store
- `scripts/beads-unified.mjs` - Unified client
- `scripts/migrate-to-beads.mjs` - Migration helper
- `tests/unit/beads-fallback.test.mjs` - Unit tests
- `src/index.ts` - Type definitions (modified)
- `todos/011-019` - Code review findings

---

## TODO Priority Analysis

### Blocking vs Non-Blocking Classification

| ID | Priority | Issue | Blocks Merge? | Rationale |
|----|----------|-------|---------------|-----------|
| 013 | P2 | Input validation | ❌ No | Security, beads CLI handles validation |
| 014 | P2 | Path traversal (cwd) | ❌ No | Security, trusted execution environment |
| 015 | P2 | env inheritance | ❌ No | Security, low risk in agent context |
| 016 | P2 | updateTask API | ❌ No | API enhancement, not breaking |
| 017 | P2 | Missing API functions | ❌ No | Enhancement |
| 018 | P2 | Inconsistent result pattern | ❌ No | Refactor |
| 019 | P3 | Minor cleanup | ❌ No | Nice to have |

**Decision:** None of the TODOs block merge. Security items (013-015) will be addressed in follow-up PR.

**Merge Now Strategy:**
- P2 security issues (013-015) are **low risk** for initial integration
- The module gracefully degrades to fallback when beads unavailable
- Security hardening can follow in subsequent PRs
- This unblocks other development on develop branch

**Fix Before Merge Strategy:**
- Address 013-015 (security) before merge
- Higher confidence in production use
- More review cycles

---

## Proposed Solution

### Chosen Approach: Merge Now + Security Follow-up

**Rationale:**
1. Beads integration is additive (new module, no breaking changes)
2. Graceful degradation means fallback works even with issues
3. Security issues are P2 (not P0/P1) - important but not critical
4. Unblocking develop allows parallel work to continue

---

## Implementation Plan

### Phase 1: Pre-Merge Cleanup (in develop)

**Goal:** Clean working state before merge

**Tasks:**

1. **Commit or stash changes in develop**
   ```bash
   # Option A: Commit the changes
   git add -A
   git commit -m "docs: update roadmap, prompts, and todos"
   
   # Option B: Stash for later
   git stash push -m "WIP: roadmap and todo updates"
   ```

2. **Verify develop is clean**
   ```bash
   git status
   # Expected: "nothing to commit, working tree clean"
   ```

**Estimated effort:** 5 minutes

---

### Phase 2: Merge Feature Branch

**Goal:** Integrate beads work into develop

**Tasks:**

1. **Merge feature branch into develop**
   ```bash
   git checkout develop
   git merge feature/2026-02-18-beads-integration --no-ff
   # Commit message: "feat: add beads integration with graceful degradation"
   ```

2. **Verify merge succeeded**
   ```bash
   git log --oneline -10
   # Should show 7 new commits from feature branch
   ```

3. **Run build and basic tests**
   ```bash
   pnpm install
   pnpm build
   node --test tests/unit/beads-fallback.test.mjs
   ```

**Estimated effort:** 10 minutes

---

### Phase 3: Cleanup Worktree

**Goal:** Remove completed worktree

**Tasks:**

1. **Remove worktree**
   ```bash
   git worktree remove .codex/worktrees/2026-02-18-beads-integration
   ```

2. **Delete local feature branch** (optional, after push to origin)
   ```bash
   git branch -d feature/2026-02-18-beads-integration
   # Or keep for reference until verified in production
   ```

**Estimated effort:** 2 minutes

---

### Phase 4: Push to Origin

**Goal:** Sync with remote

**Tasks:**

1. **Push develop to origin**
   ```bash
   git push origin develop
   ```

2. **Push feature branch** (for reference)
   ```bash
   git push origin feature/2026-02-18-beads-integration
   # Branch already exists on remote, will update
   ```

3. **Verify remote state**
   ```bash
   git fetch --all
   git log origin/develop --oneline -5
   ```

**Estimated effort:** 3 minutes

---

### Phase 5: Create Follow-up Issues

**Goal:** Track security improvements

Create issues for P2 security TODOs:

1. **Issue: Add input validation to beads-client (TODO-013)**
   - Labels: security, P2
   - Milestone: v0.2.2

2. **Issue: Validate cwd for path traversal (TODO-014)**
   - Labels: security, P2
   - Milestone: v0.2.2

3. **Issue: Use env allowlist in beads-client (TODO-015)**
   - Labels: security, P2
   - Milestone: v0.2.2

4. **Issue: API improvements (TODOs 016-018)**
   - Labels: enhancement, P2
   - Milestone: v0.3.0

**Estimated effort:** 10 minutes

---

## System-Wide Impact

### Interaction Graph

```
Merge feature branch
  → Updates scripts/ (new beads modules)
  → Updates src/index.ts (new types)
  → Updates tests/ (new test file)
  → Updates todos/ (new tracking files)
  → No changes to existing workflow scripts (skills-gate, validate-prd, etc.)
```

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Merge conflicts | Low | Low | Feature branch is ahead, no overlap with develop changes |
| Build failure | Low | Medium | New module, isolated from existing code |
| Test failure | Low | Low | Tests exist for fallback store |
| Security exposure | Medium | Low | P2 issues tracked for follow-up |

---

## Acceptance Criteria

### Must Have (Blocking)
- [ ] develop has clean working tree before merge
- [ ] Feature branch merged into develop
- [ ] Build passes (`pnpm build`)
- [ ] Existing tests pass
- [ ] Worktree removed
- [ ] Changes pushed to origin

### Should Have (Non-Blocking)
- [ ] Follow-up issues created for P2 TODOs
- [ ] Local feature branch deleted
- [ ] Stale remote branches cleaned up

### Nice to Have
- [ ] P2 security issues addressed before merge
- [ ] API improvements (016-018) implemented

---

---

## Timeline

**Total:** ~30 minutes (5 sequential phases)

---

## Ready to Execute

All decisions made. Proceed with implementation phases.

---

## References & Research

### Internal References
- `AGENTS.md` - Git workflow conventions
- `docs/plans/2026-02-18-beads-integration.md` - Original feature plan
- `todos/013-019` - Code review findings

### Related Work
- Feature branch: `feature/2026-02-18-beads-integration`
- Worktree: `.codex/worktrees/2026-02-18-beads-integration`
