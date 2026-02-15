---
status: complete
priority: p2
issue_id: 007
tags: [code-review, roadmap, cli, conventions]
dependencies: []
created: 2026-02-15
---

# Missing --version Flag in CLI Conventions

## Problem Statement

The CLI Conventions section (lines 75-107) lists standard flags but is missing the `--version` flag, which is a required standard flag per CLI best practices (clig.dev).

## Findings

**Location:** ROADMAP_full.md lines 79-86

**Current standard flags:**
```bash
--dry-run, -n     # Preview changes without executing
--json            # Machine-readable output for CI/CD
--no-input        # Disable all prompts (for automation)
--quiet, -q       # Minimal output
--verbose, -v     # Detailed output
--yes             # Skip confirmation prompts
```

**Missing:**
- `--version` - Show version number
- `--help, -h` - Show help (explicit, though often implicit)

**Best Practice (clig.dev):**
> "Every CLI should respond to --version and --help"

## Proposed Solutions

### Option 1: Add missing flags (Recommended)
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
- **Pros:** Complete, follows conventions
- **Cons:** None
- **Effort:** Small
- **Risk:** Low

### Option 2: Add note about implicit --help
Add: "Note: --help is available on all commands by default"
- **Pros:** Documents existing behavior
- **Cons:** Less explicit
- **Effort:** Small
- **Risk:** Low

## Recommended Action

Option 1: Add `--version` and `--help, -h` to standard flags list.

## Technical Details

**Affected Files:**
- ROADMAP_full.md (lines 79-86)

## Acceptance Criteria

- [ ] `--version` added to standard flags
- [ ] `--help, -h` added to standard flags (or documented as implicit)
- [ ] Alphabetical or logical ordering maintained

## Work Log

| Date | Action | Result |
|------|--------|--------|
| 2026-02-15 | Best practices review identified issue | Finding documented |

## Resources

- [clig.dev](https://clig.dev) - Command Line Interface Guidelines
