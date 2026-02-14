# Agent Orchestrator Roadmap

## Overview

Roadmap for compound engineering workflow automation.

---

## Completed ✓

### v0.1 — Core Workflow

- [x] `/ao-start` — Brainstorm → Plan → PRD pipeline with swarm research
- [x] `/ao-run` — Execution with verify step (Antfarm pattern)
- [x] `/ao-continue` — Resume with validation and checkpoints
- [x] Validation swarm (code vs PRD, git sync, tag accuracy)
- [x] Checkpoint system with `[ao-checkpoint]` prefix
- [x] Configurable severe drift handling

---

## In Progress 🚧

- [ ] Integration with compound-engineering-plugin agents
- [ ] `/ao-human` — Human escalation handler
- [ ] Metrics collection and logging

---

## Planned 📋

### v0.2 — Enhanced Recovery

- [ ] **Rollback System**
  - [ ] `/ao-rollback --to <checkpoint>` command
  - [ ] Rollback to specific story state
  - [ ] Rollback to last checkpoint
  - [ ] Rollback with artifact preservation
  - [ ] Dry-run mode: `--dry-run`
  
  ```bash
  # Examples:
  /ao-rollback --to last-checkpoint
  /ao-rollback --to auth-003
  /ao-rollback --to abc1234
  /ao-rollback --keep-artifacts  # Keep brainstorm/plan, reset PRD
  ```

- [ ] **State Snapshots**
  - [ ] Periodic auto-snapshots during /ao-run
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

### 2026-02-14

- Added `/ao-start` with brainstorm → plan → PRD phases
- Added `/ao-run` with verify step (inspired by Antfarm)
- Added `/ao-continue` with validation and checkpoints
- Added `--from <phase>` flag for explicit resume point
- Removed external plugin dependencies (uses built-in agents)
- Added `WORKFLOW_DIAGRAMS.md` for visual reference
- Added license attribution for compound-engineering-plugin (MIT)
