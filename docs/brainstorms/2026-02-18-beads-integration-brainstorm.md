---
date: 2026-02-18
topic: beads-integration
---

# Beads Integration

## What We're Building

Integrate Beads (distributed, git-backed graph issue tracker for AI agents) as the primary state management layer for agent-orchestrator. This will replace ephemeral JSON-based state tracking with a persistent, dependency-aware task graph that supports long-horizon workflows, multi-agent collaboration, and cross-session continuity.

The integration focuses first on **basic persistence** — enabling agents to save and restore tasks between sessions via the `bd` CLI. Future phases will expand to full workflow orchestration (manager → coder → tester stages) and multi-agent conflict resolution.

## Why This Approach

We evaluated three integration approaches:

**Approach A: Beads as primary state layer** (chosen)
- Single source of truth for all agent state
- Native dependency tracking and task hierarchy
- Built-in multi-agent support and conflict resolution
- Best for long-term growth and team scalability

**Approach B: Beads as optional plugin**
- Minimal disruption, gradual adoption
- But: two sources of truth, sync complexity, diluted value

**Approach C: Hybrid (beads for long-term, JSON for session)**
- Right tool for each task
- But: complex sync layer, potential race conditions, architectural overhead

Approach A was selected because it solves all three target problems (persistence, workflow navigation, multi-agent readiness) comprehensively while minimizing technical debt. Since the project is still in development, this is the ideal time to establish a robust state foundation.

## Key Decisions

- **Beads as primary state layer**: All agent state stored in beads graph, replacing ephemeral JSON storage. Provides persistence, dependencies, and hierarchy out of the box.

- **Separate `.beads/` directory**: Use standard beads initialization (`.beads/`) rather than integrating into `.agents/`. This follows KISS principle, maintains isolation, and preserves upstream compatibility.

- **Phase 1 scope**: Focus on basic persistence first — agents can save/restore tasks via `bd` CLI between sessions. Full workflow orchestration and multi-agent features are deferred to future phases.

- **CLI-based integration**: agent-orchestrator invokes `bd` CLI as external tool rather than importing beads as dependency. Simpler, avoids Go/TS interop complexity, maintains clear separation of concerns.

- **Single developer context**: Initial design assumes single-developer usage, but architecture prepares for future team collaboration without refactoring.

## Resolved Questions

- **CLI error handling**: Graceful degradation. If `bd` CLI is not found in PATH or exits with error, agents fall back to JSON storage with warning logs. This allows development to continue while beads integration is optional for early adopters.

- **Migration strategy**: One-time migration. Script converts existing JSON state files to beads tasks. Simpler than dual-mode support and avoids maintaining two code paths.

- **Task schema mapping**: Extended schema with concrete types:
  - **Issue types**: `prd` (epic-level), `task` (implementation unit), `subtask` (granular work)
  - **Relationships**: `blocks` (dependencies), `supersedes` (replacements), `relates_to` (cross-references)
  - **Metadata**: `stage` (manager/coder/tester/reviewer), `assignee` (agent identifier), `priority` (P0-P3)

## Open Questions

- **Authentication/authorization**: For multi-agent scenarios, how to assign tasks to specific agents? Through beads metadata or separate tracking layer? (Deferred — single-developer context makes this less critical for Phase 1)

- **Performance impact**: Beads adds git operations overhead. Is this acceptable for interactive agent workflows, or do we need async/caching strategies? (To be validated in planning/implementation)

## Next Steps

→ `/workflows:plan` for implementation details (migration path, CLI integration, task schema, error handling)
