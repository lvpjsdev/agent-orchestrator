---
date: 2026-02-15
topic: cli-improvements-v0.2.0
---

# CLI Improvements for v0.2.0

## What We're Building

Implement two CLI improvements to enhance automation capabilities and developer experience:

1. **`--no-input` flag** - Disable all interactive prompts for CI/CD automation
2. **`burlaki status` command** - Show current workflow state:
   - Current stage (brainstorm/plan/coder/tester/reviewer)
   - Pending stories count
   - Last checkpoint SHA and timestamp
   - Blocked stories (if any)

Shell completion (bash/zsh/fish) is deferred to v0.2.1 to keep scope minimal.

## Why This Approach

**Approach A: Minimal MVP** was selected over complete package (B) and automation-only (C).

**Rationale:**
- `--no-input` unlocks CI/CD automation immediately
- `status` provides essential developer visibility
- Shell completion is nice-to-have but not blocking
- Follows DHH principle: start simple, add complexity only when needed
- Can ship v0.2.0 faster and iterate

**Trade-offs accepted:**
- No shell completion in v0.2.0
- Slightly less polished DX initially

## Key Decisions

- **Flag parsing:** Continue manual parser pattern (no external library)
- **Exit codes:** Already standardized in ROADMAP (0-7), implement consistently
- **`--no-input` behavior:** Skip all prompts, fail with exit code 2 if input required
- **`--no-input` scope:** Commands affected: rollback (confirmation), continue (checkpoint selection), run (story selection)
- **`status` output:** JSON when `--json` flag present, human-readable table otherwise
- **Status data source:** Parse `.agents/tasks/prd.json` and git log for checkpoints
- **Status "stage":** Current workflow phase from PRD or last checkpoint
- **No breaking changes:** All existing commands work unchanged

## Resolved Questions

1. **Status command format:** Context-dependent - table for humans, key-value with `--json` ✓
2. **Error handling with `--no-input`:** Exit code 2 (usage error) for missing required args ✓
3. **Status refresh frequency:** Real-time git check by default, cached with `--watch` flag ✓

## Open Questions

None - all questions resolved.

## Deferred to v0.2.1

- Shell completion scripts (bash, zsh, fish)
- `--json` output for all commands (broader scope)
- PRD Schema Versioning (separate concern)

## Next Steps

→ `/workflows:plan` for implementation details
