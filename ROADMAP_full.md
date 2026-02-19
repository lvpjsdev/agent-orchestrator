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
--help, -h        # Show help
--version         # Show version number
--json            # Machine-readable output for CI/CD
--no-input        # Disable all prompts (for automation)
--quiet, -q       # Minimal output
--verbose, -v     # Detailed output
--yes             # Skip confirmation prompts
--version         # Show version number
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

### 0.2.0 — CLI Foundation & Enhanced Recovery

**CLI Improvements:**
- [ ] Add `--json` output to all commands
- [ ] Standardize exit codes (0-7)
- [ ] Add `--no-input` flag
- [ ] Add `burlaki status` command
- [ ] Shell completion (bash, zsh, fish)
- [x] **PRD Schema Versioning** — Added `schema_version` field to PRD files in v0.1.0

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

### 0.3.0 — Learning System

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

