---
status: complete
priority: p3
issue_id: 010
tags: [code-review, roadmap, formatting, documentation]
dependencies: []
created: 2026-02-15
---

# Malformed Code Block in Event Store Section

## Problem Statement

Lines 203-211 contain a malformed code block structure where a file path appears in a code block without language hint, followed by JSONL content.

## Findings

**Location:** ROADMAP_full.md lines 203-211

**Current (problematic):**
```markdown
- [ ] **Event Store** — Append-only log for pattern extraction
  ```
  .agents/events.jsonl
  ```
  ```jsonl
  {"ts":"2026-02-15T10:00:00Z",...}
  ```
```

**Issues:**
1. First code block contains only a file path (misleading)
2. Not clear this is a path reference vs code

## Proposed Solutions

### Option 1: Fix formatting (Recommended)
```markdown
- [ ] **Event Store** — Append-only log for pattern extraction
  
  Path: `.agents/events.jsonl`
  
  ```jsonl
  {"ts":"2026-02-15T10:00:00Z","type":"story_started","story_id":"auth-001","agent":"coder"}
  ```
```
- **Pros:** Clear, well-formatted
- **Cons:** None
- **Effort:** Small
- **Risk:** Low

### Option 2: Remove path block
Just show JSONL content with inline path mention.
- **Pros:** Cleaner
- **Cons:** Less explicit
- **Effort:** Small
- **Risk:** Low

## Recommended Action

Option 1: Replace malformed code block with explicit "Path:" label and properly formatted JSONL block.

## Technical Details

**Affected Files:**
- ROADMAP_full.md (lines 203-211)

## Acceptance Criteria

- [ ] File path clearly labeled (not in code block or with proper hint)
- [ ] JSONL code block properly formatted
- [ ] No empty or misleading code blocks

## Work Log

| Date | Action | Result |
|------|--------|--------|
| 2026-02-15 | Pattern analysis identified issue | Finding documented |

## Resources

- Markdown best practices
