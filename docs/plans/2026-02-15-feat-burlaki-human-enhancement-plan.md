---
title: Enhance /burlaki-human with Resolution Workflow
type: feat
date: 2026-02-15
---

# Enhance /burlaki-human with Resolution Workflow

## Overview

Transform `/burlaki-human` from a read-only search utility into a complete human escalation handler with resolution tracking, tag discovery, and improved output formatting.

## Problem Statement

Current `/burlaki-human` implementation only searches for `@human` tags in artifacts. It lacks:
- Ability to mark escalations as resolved
- Way to discover all escalation tags in use
- Resolution history tracking
- Better output formatting per project patterns

Per ROADMAP.md:26, `/burlaki-human` is listed as "In Progress" for integration with compound-engineering-plugin agents.

## Proposed Solution

Add three capabilities:
1. `--resolve <story-id>` - Mark blocked story as ready to retry
2. `--list-tags` - Show all escalation tags with counts
3. Enhanced output formatting following project patterns

## Technical Considerations

### State Transitions

When resolving, story status transitions:
- `blocked` → `pending` (full retry from SETUP phase)
- User explicitly runs `/burlaki-continue` after resolution

### Resolution Tracking

Store simple resolution note on the story when resolved:

```json
{
  "id": "auth-003",
  "status": "pending",
  "resolution_note": "Added missing null check"
}
```

The `blocked_reason` is cleared when resolved. History tracking is YAGNI for MVP.

### PRD Mutation Safety

Use atomic write pattern:
```bash
jq '...' .agents/tasks/prd.json > .agents/tasks/prd.json.tmp && \
mv .agents/tasks/prd.json.tmp .agents/tasks/prd.json
```

### Checkpoint Creation

Follow `/burlaki-continue` pattern - create checkpoint before PRD mutation:
```bash
git add -A && git commit -m "[burlaki-checkpoint] Resolved escalation: auth-003"
```

## Acceptance Criteria

### AC1: View Escalations (Enhanced)

- [ ] Default search uses `@human` tag
- [ ] `--tag <tag>` searches for custom tag
- [ ] Output groups by story with bordered box format
- [ ] Shows: story ID, title, blocked_reason, file locations
- [ ] Handles missing `.agents/tasks/` and `.ralph/` gracefully

### AC2: List Tags

- [ ] `--list-tags` shows all unique escalation tags in use
- [ ] Shows count of occurrences per tag
- [ ] Searches `.agents/tasks/*.json`, `.ralph/progress*.md`, `.ralph/errors.log`
- [ ] Tag pattern: `@[a-z-]+` (e.g., `@human`, `@reviewer`, `@security`)

### AC3: Resolve Escalation

- [ ] `--resolve <story-id>` updates story status to `pending`
- [ ] Validates story exists and is currently `blocked`
- [ ] Optional `--note "text"` adds resolution note
- [ ] Adds optional `resolution_note` field, clears `blocked_reason`
- [ ] Creates git checkpoint before mutation
- [ ] Atomic PRD write pattern
- [ ] Clear output: "Resolved auth-003 → pending. Run /burlaki-continue to resume."

### AC4: Error Handling

- [ ] Invalid story-id: exit 2, error "Story not found: <id>"
- [ ] Story not blocked: exit 2, error "Story <id> is not blocked (status: <status>)"
- [ ] Missing PRD: exit 2, error "No PRD found. Run /burlaki-start first."
- [ ] PRD parse error: exit 1, show error details

### AC5: Output Formatting

- [ ] Follow CLI patterns from AGENTS.md
- [ ] Consistent exit codes: 0=success, 1=error, 2=usage error

## Dependencies & Risks

### Dependencies

- Existing `/burlaki-run` creates escalations with `status: blocked`
- Existing `/burlaki-continue` resumes from pending stories
- PRD schema supports `status`, `blocked_reason`, `tags` fields

### Risks

| Risk | Mitigation |
|------|------------|
| PRD corruption from concurrent writes | Atomic write pattern with tmp file |
| User resolves wrong story | Clear confirmation output, checkpoint for recovery |

### Assumptions

- `rg` (ripgrep) available for tag searches
- Git configured for commits (checkpoints)

## Implementation

### Files to Update

| File | Changes |
|------|---------|
| `prompts/codex/burlaki-human.md` | Add --resolve, --list-tags logic |
| `prompts/opencode/burlaki-human/SKILL.md` | Mirror Codex changes |
| `prompts/claude/burlaki-human/SKILL.md` | Mirror Codex changes |

### Pseudocode: --resolve Flow

```
/burlaki-human --resolve <story-id> [--note "text"]

1. Validate PRD exists at .agents/tasks/prd.json
2. Parse PRD, find story by id
3. If not found: error, exit 2
4. If story.status != "blocked": error, exit 2
5. Create checkpoint:
   git add -A && git commit -m "[burlaki-checkpoint] Resolved escalation: <story-id>"
6. Update PRD:
   - Set status = "pending"
   - Add resolution_note if provided
   - Clear blocked_reason
7. Atomic write PRD
8. Output:
   ═══════════════════════════════════════════════════════
   Resolved: auth-003
   Status: blocked → pending
   Note: Added missing null check
   
   Run /burlaki-continue to resume execution.
   ═══════════════════════════════════════════════════════
```

### Pseudocode: --list-tags Flow

```
/burlaki-human --list-tags

1. Search for tag pattern @[a-z-]+ in:
   - .agents/tasks/*.json
   - .ralph/progress*.md (if exists)
   - .ralph/errors.log (if exists)
2. Extract unique tags with counts
3. Output:
   ═══════════════════════════════════════════════════════
   Escalation Tags
   
   @human      3 occurrences
   @reviewer   1 occurrence
   @security   1 occurrence
   ═══════════════════════════════════════════════════════
```

### Pseudocode: View Escalations (Enhanced)

```
/burlaki-human [--tag <tag>]

1. Default tag = @human
2. Search for tag in artifacts
3. Group by story when possible
4. Output:
   ═══════════════════════════════════════════════════════
   Burlaki Human — Escalations Report
   ═══════════════════════════════════════════════════════
   
   Tag: @human
   Found: 2 escalations
   
   Stories:
   ├── auth-003: Verify failed 3 times
   │   File: .agents/tasks/prd.json:145
   │   Reason: Missing edge case handling
   │
   └── auth-007: Explicit escalation
       File: .agents/tasks/prd.json:189
       Reason: Requires security review
   
   Actions:
   1. Review each story above
   2. Fix the underlying issue
   3. Run /burlaki-human --resolve <story-id>
   4. Run /burlaki-continue to resume
   ═══════════════════════════════════════════════════════
```

## Success Metrics

- Escalations can be viewed with clear, actionable output
- Resolutions are tracked with history
- All tags discoverable via --list-tags
- Zero PRD corruption incidents

## References & Research

### Internal References

- Command patterns: `prompts/codex/burlaki-run.md:467-484` (escalation triggers)
- Status protocol: `prompts/codex/burlaki-run.md:477-484`
- Checkpoint format: `prompts/codex/burlaki-continue.md:156-168`
- CLI conventions: `AGENTS.md:1-150`
- Current implementation: `prompts/codex/burlaki-human.md:1-29`

### Related Work

- ROADMAP.md:26 - /burlaki-human listed as In Progress
- Escalation triggers defined in /burlaki-run (VERIFY/TEST/REVIEW 3+ failures)
