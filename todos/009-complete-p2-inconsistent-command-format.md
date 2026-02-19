---
status: complete
priority: p2
issue_id: 009
tags: [code-review, roadmap, naming, conventions]
dependencies: []
created: 2026-02-15
---
# Document command format convention

## Problem Statement
Commands use two different formats without clear distinction: `/burlaki-*` (slash prefix) and `burlaki <subcommand>` (space-separated).

## Findings
**Location:** Throughout ROADMAP_full.md

**Current format:**
| Format | Locations | Examples |
|---------|-----------|----------|
| `/burlaki-*` (slash) | Lines 39-42, 114-118, 158, 168, 326-329 | `/burlaki-start`, `/burlaki-learn` |
| `burlaki <cmd>` (space) | Lines 132, 138, 141, 461-462, 509 | `burlaki status`, `burlaki gate` |

**Issue:**
- No documented rule for when to use which format
- Confusing for readers and implementers

## Proposed Solutions
### Option 1: Document convention (Recommended)
Add to CLI Conventions section:
```markdown
### Command Format Convention

- `/burlaki-*` — Agent-orchestrator prompts (Codex/Claude slash commands)
- `burlaki <subcommand>` — Native CLI commands
```
- **Pros:** Clear distinction, keeps both formats
- **Cons:** Two formats to maintain
- **Effort:** Small
- **Risk:** Low

### Option 2: Standardize to slash format
Convert all `burlaki <cmd>` to `/burlaki-<cmd>`.
- **Pros:** Single format
- **Cons:** May not match actual CLI behavior
- **Effort:** Medium
- **Risk:** Medium

### Option 3: Standardize to space format
Convert all `/burlaki-*` to `burlaki <cmd>`.
- **Pros:** Matches typical CLI conventions
- **Cons:** Doesn't match slash command interface
- **Effort:** Medium
- **Risk:** Medium

## Recommended Action
Option 1: Document convention distinguishing slash commands (agent prompts) from CLI commands (native).

## Technical Details
**Affected Files:**
- ROADMAP_full.md (add convention documentation)

## Acceptance Criteria
- [x] Convention documented in CLI Conventions section
- [x] All command references follow documented convention
- [x] No ambiguous command references

## Work Log
| Date | Action | Result |
|------|--------|--------|
| 2026-02-18 | Direct execution completed | Convention already documented, verified |

## Resources
- Related: Pattern-recognition-specialist findings
