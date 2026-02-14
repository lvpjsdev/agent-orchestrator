# Burlaki Roadmap

## Overview

Roadmap for compound engineering workflow automation.

---

## Completed ✓

### v0.1 — Core Workflow

- [x] `/burlaki-start` — Brainstorm → Plan → PRD pipeline with swarm research
- [x] `/burlaki-run` — Execution with verify step (Antfarm pattern)
- [x] `/burlaki-continue` — Resume with validation and checkpoints
- [x] Validation swarm (code vs PRD, git sync, tag accuracy)
- [x] Checkpoint system with `[burlaki-checkpoint]` prefix
- [x] Configurable severe drift handling

---

## In Progress 🚧

- [ ] Integration with compound-engineering-plugin agents
- [ ] `/burlaki-human` — Human escalation handler
- [ ] Metrics collection and logging

---

## Planned 📋

### v0.2 — Enhanced Recovery

- [x] **Rollback System (MVP)**
  - [x] `/burlaki-rollback --to <checkpoint>` command
  - [x] Rollback to specific story state
  - [x] Rollback to last checkpoint
  - [x] Dry-run mode: `--dry-run`
  - [ ] Rollback with artifact preservation (`--keep-artifacts`)
  
  ```bash
  # Examples:
  /burlaki-rollback --to last-checkpoint
  /burlaki-rollback --to auth-003
  /burlaki-rollback --to abc1234
  /burlaki-rollback --to last-checkpoint --dry-run
  ```

- [ ] **State Snapshots**
  - [ ] Periodic auto-snapshots during /burlaki-run
  - [ ] Snapshot before each story start
  - [ ] Snapshot retention policy (configurable)
  - [ ] Snapshot diff view

### v0.3 — Parallel Execution

- [ ] **Parallel Story Execution**
  - [ ] Dependency graph visualization
  - [ ] Parallel swarm for independent stories
  - [ ] Merge conflict resolution strategy
  - [ ] Progress dashboard (CLI)

### v0.4 — Learning System

- [ ] **Compound Knowledge Base**
  - [ ] Auto-extract patterns from completed features
  - [ ] Pattern library for reuse across projects
  - [ ] Anti-pattern detection alerts
  - [ ] Team knowledge sync

### v0.5 — Multi-Project

- [ ] **Cross-Project Orchestration**
  - [ ] Shared pattern library
  - [ ] Multi-repo workflows
  - [ ] Dependency tracking across projects
  - [ ] Monorepo support

---

## Future Considerations 💭

- Web dashboard for workflow visualization
- IDE integration (VS Code, Cursor)
- CI/CD pipeline integration
- Team collaboration features
- Audit trail and compliance reporting
- Cost tracking (LLM API usage)

---

## Contributing

To add items to roadmap:
1. Create issue with `roadmap` label
2. Discuss in team sync
3. Add to appropriate version milestone

---

## Changelog

### 2026-02-15

- Added `/burlaki-rollback` command for checkpoint recovery (MVP)
  - `--to last-checkpoint`, `--to <story-id>`, `--to <sha>` targets
  - `--dry-run` for preview, `--yes` to skip confirmation
  - Uses Git's ORIG_HEAD for recovery (no custom backup system)

### 2026-02-14

- Added `/burlaki-start` with brainstorm → plan → PRD phases
- Added `/burlaki-run` with verify step (inspired by Antfarm)
- Added `/burlaki-continue` with validation and checkpoints
- Added `--from <phase>` flag for explicit resume point
- Removed external plugin dependencies (uses built-in agents)
- Added `WORKFLOW_DIAGRAMS.md` for visual reference
- Added license attribution for compound-engineering-plugin (MIT)
