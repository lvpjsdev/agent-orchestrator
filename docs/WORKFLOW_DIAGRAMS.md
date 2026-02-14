# Compound Engineering Workflow Diagrams

Visual reference for the agent-orchestrator workflow.

---

## Full Cycle

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        COMPOUND ENGINEERING CYCLE                                │
│                                                                                  │
│        "Each unit of work should make subsequent units easier"                  │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                          │   │
│   │     /ao-start          /ao-run              COMPOUND                     │   │
│   │         │                  │                    │                        │   │
│   │         ▼                  ▼                    ▼                        │   │
│   │     ┌──────┐          ┌──────┐            ┌──────┐                       │   │
│   │     │ PLAN │ ───────► │ WORK │ ────────► │LEARN │                       │   │
│   │     └──────┘          └──────┘            └──────┘                       │   │
│   │                                              │                           │   │
│   │                                              │                           │   │
│   │                                              ▼                           │   │
│   │                                       docs/solutions/                    │   │
│   │                                              │                           │   │
│   │                                              │                           │   │
│   │               ┌──────────────────────────────┘                           │   │
│   │               │                                                           │   │
│   │               ▼                                                           │   │
│   │        NEXT ITERATION IS EASIER                                           │   │
│   │        (learnings-researcher finds past solutions)                        │   │
│   │                                                                           │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## /ao-start Phases

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: BRAINSTORM (WHAT)                                      │
│  ────────────────────────────                                    │
│  Agent: manager                                                  │
│  Swarm: Explore (project context)                                │
│  Output: docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.md       │
│  Status: done → proceed | needs_clarification → ask user         │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 2: PLAN (HOW)                                             │
│  ────────────────────                                            │
│  Agent: planner                                                  │
│  Input: {{brainstorm}}, past learnings from docs/solutions/      │
│  Output: docs/plans/YYYY-MM-DD-<type>-<name>-plan.md             │
│  Status: done → proceed | retry → refine                         │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 3: PRD (DECOMPOSE)                                        │
│  ─────────────────────────────                                   │
│  Agent: planner                                                  │
│  Input: {{plan}}                                                 │
│  Output: .agents/tasks/prd.json (atomic stories, < 1 hour each)  │
│  Status: done → ready for /ao-run                                │
├─────────────────────────────────────────────────────────────────┤
│  HANDOFF CHAIN: {{brainstorm}} ──► {{plan}} ──► {{prd}}          │
└─────────────────────────────────────────────────────────────────┘
```

---

## /ao-run Per-Story Loop

```
┌─────────────────────────────────────────────────────────────────┐
│  PER-STORY LOOP (fresh contexts)                                │
│                                                                  │
│  ┌─────────────┐                                                │
│  │   SETUP     │  Verify workspace, check dependencies          │
│  │  (fresh)    │  STATUS: done → implement                      │
│  └──────┬──────┘                                                │
│         ↓                                                        │
│  ┌─────────────┐                                                │
│  │ IMPLEMENT   │  Write code for acceptance criteria            │
│  │  (fresh)    │  STATUS: done → verify | retry → implement     │
│  └──────┬──────┘                                                │
│         ↓                                                        │
│  ┌─────────────┐                                                │
│  │   VERIFY    │  Skeptical QA — separate from developer!       │
│  │  (fresh)    │  STATUS: done → test | retry → implement       │
│  └──────┬──────┘                                                │
│         ↓                                                        │
│  ┌─────────────┐                                                │
│  │    TEST     │  Run tests, add coverage                       │
│  │  (fresh)    │  STATUS: done → review | retry → implement     │
│  └──────┬──────┘                                                │
│         ↓                                                        │
│  ┌─────────────┐                                                │
│  │   REVIEW    │  Security, performance, quality checks         │
│  │  (swarm)    │  STATUS: approved → commit | changes → impl    │
│  └──────┬──────┘                                                │
│         ↓                                                        │
│  ┌─────────────┐                                                │
│  │   COMMIT    │  Git commit with story reference               │
│  │             │  STATUS: done → next story or COMPOUND         │
│  └──────┬──────┘                                                │
│         │                                                        │
│         ├── more stories? ──► return to SETUP                    │
│         │                                                        │
│         └── all done? ──────► COMPOUND PHASE                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## /ao-continue Recovery

```
┌─────────────────────────────────────────────────────────────────┐
│  RECOVERY PIPELINE                                               │
│                                                                  │
│  ┌─────────────┐                                                │
│  │   DETECT    │  Check artifacts, git state, PRD status         │
│  └──────┬──────┘                                                │
│         ↓                                                        │
│  ┌─────────────┐                                                │
│  │  VALIDATE   │  Code vs PRD, git sync, tag accuracy            │
│  │   (swarm)   │  Uses past learnings to detect drift patterns   │
│  └──────┬──────┘                                                │
│         ↓                                                        │
│  ┌─────────────┐                                                │
│  │ CHECKPOINT  │  Create [ao-checkpoint] commit if changes       │
│  └──────┬──────┘                                                │
│         ↓                                                        │
│  ┌─────────────┐                                                │
│  │   REPORT    │  Show state summary, drift findings             │
│  └──────┬──────┘                                                │
│         ↓                                                        │
│  ┌─────────────┐                                                │
│  │   RESUME    │  Continue from validated point                  │
│  └─────────────┘                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Compound Feedback Loop

```
┌─────────────────────────────────────────────────────────────────┐
│  LEARNINGS FEEDBACK LOOP                                         │
│                                                                  │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐             │
│  │  /ao-run   │───►│  COMPOUND  │───►│ docs/      │             │
│  │  executes  │    │  extracts  │    │ solutions/ │             │
│  │  stories   │    │  patterns  │    │ learnings  │             │
│  └────────────┘    └────────────┘    └─────┬──────┘             │
│                                            │                     │
│                                            │                     │
│              ┌─────────────────────────────┘                     │
│              │                                                   │
│              ▼                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  NEXT /ao-start                                             │ │
│  │       │                                                     │ │
│  │       ▼                                                     │ │
│  │  Phase 2 (PLAN) searches docs/solutions/                   │ │
│  │       │                                                     │ │
│  │       ▼                                                     │ │
│  │  Plan includes proven patterns, avoids past mistakes        │ │
│  │                                                             │ │
│  │  ═══════════════════════════════════════════════════════   │ │
│  │  NEXT ITERATION IS EASIER                                   │ │
│  │  ═══════════════════════════════════════════════════════   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Recovery Points

```
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│ BRAINSTORM │───►│   PLAN     │───►│    PRD     │───►│  /ao-run   │
│    .md     │    │    .md     │    │   .json    │    │   loop     │
└────────────┘    └────────────┘    └────────────┘    └────────────┘
      │                 │                 │                 │
      ▼                 ▼                 ▼                 ▼
 resume from       resume from       resume from      resume from
 Phase 1           Phase 2           Phase 3          story checkpoint
 (brainstorm)      (plan)            (prd)            [ao-checkpoint]
```

---

## Checkpoint Commands

```bash
# Find all checkpoints
git log --oneline --grep='\[ao-checkpoint\]'

# Restore to last checkpoint
git reset --hard $(git log --grep='\[ao-checkpoint\]' -n 1 --format=%H)

# Restore to specific checkpoint
git reset --hard <sha>

# Squash checkpoints after feature complete
git rebase -i develop
```
