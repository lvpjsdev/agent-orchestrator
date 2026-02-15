# Burlaki Roadmap

## Overview

Roadmap for compound engineering workflow automation.

**Last updated:** 2026-02-15

---

## Version Strategy

This project follows [Semantic Versioning 2.0.0](https://semver.org/).

| Version | Description | Status |
|---------|-------------|--------|
| **0.1.0** | Core Workflow | ✅ Released |
| **0.2.0** | Enhanced Recovery + CLI Foundation | 🚧 In Progress |
| **0.3.0** | Learning System | 📋 Planned |
| **0.4.0** | Parallel Execution | 📋 Planned |
| **0.5.0** | Multi-Project | 📋 Planned |
| **1.0.0** | Production Stable | 🔮 Future |

---

## Architecture Principles

### Pipeline Pattern (Universal)

Every command follows a multi-phase pipeline:

| Command | Pipeline |
|---------|----------|
| `/burlaki-start` | BRAINSTORM → PLAN → PRD |
| `/burlaki-run` | SETUP → IMPLEMENT → VERIFY → TEST → REVIEW → COMMIT |
| `/burlaki-continue` | DETECT → VALIDATE → CHECKPOINT → REPORT → RESUME |
| `/burlaki-rollback` | DETECT → VALIDATE → PREVIEW → CONFIRM → EXECUTE → VERIFY |

**Rule:** All future commands (v0.3-v0.5) must follow this pattern.

### Status Protocol

```yaml
STATUS: done              # Proceed to next step/phase
STATUS: retry             # Repeat with feedback
STATUS: blocked           # Escalate to human
STATUS: approved          # (run only) Proceed to commit
STATUS: changes_requested # (run only) Back to IMPLEMENT
```

**Future extensions:**
- `STATUS: parallel_ready` - Story can run in parallel
- `STATUS: pattern_learned` - Pattern extracted to knowledge base

### Fresh Context Principle

Each story gets a clean agent session. Parallel execution must ensure isolated contexts per agent.

### DHH Principle

> "Git already has reflog, ORIG_HEAD. Stop duplicating."

Apply the "75% reduction" lesson from rollback implementation:
- Start with MVP
- Use existing tools (git, jq, bash)
- Avoid custom infrastructure when built-in exists

---

## CLI Conventions

### Standard Flags (all commands)

```bash
--dry-run, -n     # Preview changes without executing
--help, -h        # Show help
--json            # Machine-readable output for CI/CD
--no-input        # Disable all prompts (for automation)
--quiet, -q       # Minimal output
--verbose, -v     # Detailed output
--version         # Show version number
--yes             # Skip confirmation prompts
```

### Exit Codes

```bash
0   # Success
1   # General error / blocked state
2   # Usage error (invalid arguments)
3   # Skill gate failure
4   # PRD validation failure
5   # Checkpoint/rollback error
6   # Network/API error
7   # Configuration error
```

### Flag Naming Convention

```bash
--no-<feature>      # Disable feature
--with-<feature>    # Enable optional feature
```

### Command Format Convention

- `/burlaki-*` — Agent-orchestrator prompts (Codex/Claude slash commands)
- `burlaki <subcommand>` — Native CLI commands

---

## Completed ✓

### v0.1.0 — Core Workflow

- [x] `/burlaki-start` — Brainstorm → Plan → PRD pipeline with swarm research
- [x] `/burlaki-run` — Execution with verify step (Antfarm pattern)
- [x] `/burlaki-continue` — Resume with validation and checkpoints
- [x] Validation swarm (code vs PRD, git sync, tag accuracy)
- [x] Checkpoint system with `[burlaki-checkpoint]` prefix
- [x] Configurable severe drift handling

---

## In Progress 🚧

### v0.2.0 — CLI Foundation & Enhanced Recovery

**CLI Improvements:**
- [ ] Add `--json` output to all commands
- [ ] Standardize exit codes (0-7)
- [ ] Add `--no-input` flag
- [ ] Add `burlaki status` command
- [ ] Shell completion (bash, zsh, fish)
- [ ] **PRD Schema Versioning** — Add `schema_version` field to PRD files

**Rollback System (Core):**
- [x] `/burlaki-rollback --to <checkpoint>` command
- [x] Rollback to specific story state
- [x] Rollback to last checkpoint
- [x] Dry-run mode: `--dry-run`

**Rollback System (Extended):**
- [ ] Rollback with artifact preservation (`--keep-artifacts`)
- [ ] Selective artifact preservation patterns

**State Snapshots:**
- [ ] Milestone-based snapshots (at workflow transitions)
- [ ] Configurable retention policy
- [ ] Snapshot diff view (`/burlaki-diff`)

---

## Planned 📋

### v0.3.0 — Learning System

**Rationale:** Learning system captures patterns from execution. Should exist before parallel execution to capture conflict resolution patterns.

- [ ] **Compound Knowledge Base**
  - [ ] Auto-extract patterns from completed stories
  - [ ] Pattern library with YAML schema
  - [ ] Anti-pattern detection
  - [ ] Tag taxonomy standardization

- [ ] **Team Knowledge Sync**
  - [ ] Git-based pattern sync with conflict resolution
  - [ ] Endorsement system for pattern quality
  - [ ] Cross-project pattern sharing

- [ ] **CLI Commands**
  ```bash
  /burlaki-learn extract --since="2 weeks ago"
  /burlaki-learn scan --staged
  /burlaki-learn sync
  /burlaki-learn search "error handling"
  ```

### v0.4.0 — Parallel Execution

**Rationale:** Learning system should exist first to capture conflict resolution patterns.

- [ ] **Dependency Graph**
  - [ ] Build project graph from PRD `depends_on` fields
  - [ ] Cycle detection and validation
  - [ ] Graph visualization (`/burlaki-matrix --graph`)

- [ ] **Parallel Story Execution**
  - [ ] Worker pool with configurable parallelism
  - [ ] Git worktree isolation per story
  - [ ] Failure isolation (one failure doesn't block siblings)
  - [ ] Configurable: `--parallel 4` flag

- [ ] **Merge Conflict Handling**
  - [ ] Pre-flight file conflict detection
  - [ ] Merge strategy config: `rebase|merge|squash`
  - [ ] Conflict resolution: `fail|ask|prefer-branch`

- [ ] **Progress Dashboard**
  - [ ] Multi-progress display with ANSI
  - [ ] Log aggregation with task prefixes
  - [ ] Real-time status updates

### v0.5.0 — Multi-Project

- [ ] **Project Manifest**
  - [ ] `.burlaki/project.json` for cross-repo coordination
  - [ ] Workspace detection (monorepo, multi-repo)
  - [ ] Dependency graph across projects

- [ ] **Shared Pattern Registry**
  - [ ] Federated pattern registry
  - [ ] Version locking with semver ranges
  - [ ] Computation caching (hash pattern + inputs)

- [ ] **Cross-Repo Workflows**
  ```bash
  burlaki run-many -t build test lint
  burlaki affected -t test --base main
  ```

- [ ] **Monorepo Support**
  - [ ] Workspace protocol (`workspace:*`)
  - [ ] Constraint tags for architecture boundaries
  - [ ] Affected command (only run what changed)

---

## Future Considerations 💭

### Potential Infrastructure (Deferred)

These items are documented for future consideration but deferred until actual need arises:

- **Event Store** — Append-only log (`.agents/events.jsonl`) for pattern extraction. Add when learning system needs structured event data.
  
- **Story-Level Lock Resources** — For parallel conflict detection. Add when parallel execution is implemented.

- **Unified Metrics Schema** — Standardized metrics format. Add when metrics collection is implemented.

### Observability

- OpenTelemetry integration for traces and metrics
- CI/CD pipeline integration with GitHub Actions

### Other Future

- Web dashboard for workflow visualization
- IDE integration (VS Code, Cursor)
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

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - TBD (Unreleased)

### Added
- PRD Schema Versioning requirement added to v0.2.0 scope
- `--version` and `--help` flags to CLI conventions
- Command format convention documentation (`/burlaki-*` vs `burlaki <cmd>`)

### Changed
- Removed `--parallel` flag documentation from burlaki-run.md (reserved for v0.4.0)
- Consolidated v0.1.5 and v0.2 into single v0.2.0 milestone
- Moved v0.2.5 infrastructure items to "Future Considerations" (YAGNI)
- Deleted Enhancement Summary section (duplicated Changelog)
- Standardized version numbering to semver format (0.1.0, 0.2.0, etc.)
- Reordered roadmap: Learning System (v0.3) now precedes Parallel Execution (v0.4)

### Fixed
- Fixed malformed code block in Event Store section

## [0.1.0] - 2026-02-14

### Added
- `/burlaki-start` with brainstorm → plan → PRD phases
- `/burlaki-run` with verify step (Antfarm pattern)
- `/burlaki-continue` with validation and checkpoints
- `/burlaki-rollback` command for checkpoint recovery (MVP)
  - `--to last-checkpoint`, `--to <story-id>`, `--to <sha>` targets
  - `--dry-run` for preview, `--yes` to skip confirmation
  - Uses Git's ORIG_HEAD for recovery (no custom backup system)
- Validation swarm (code vs PRD, git sync, tag accuracy)
- Checkpoint system with `[burlaki-checkpoint]` prefix
- Configurable severe drift handling
- `--from <phase>` flag for explicit resume point
- `WORKFLOW_DIAGRAMS.md` for visual reference
- License attribution for compound-engineering-plugin (MIT)

[0.2.0]: https://github.com/lvpjsdev/burlaki/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/lvpjsdev/burlaki/releases/tag/v0.1.0
