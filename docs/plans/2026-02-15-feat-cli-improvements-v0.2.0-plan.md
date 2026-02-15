---
title: CLI Improvements for v0.2.0
type: feat
date: 2026-02-15
---

# CLI Improvements for v0.2.0

## Overview

Implement two CLI improvements to enhance automation capabilities and developer experience:

1. **`--no-input` flag** - Disable interactive prompts when agent prompts are called programmatically (via Claude Code/Codex CLI in CI/CD automation)
2. **`burlaki status` command** - Show current workflow state (stage, pending stories, last checkpoint)

**Important:** The burlaki commands (`rollback`, `continue`, `run`) are agent prompts (in `prompts/codex/`), not CLI scripts. The `--no-input` flag enables these prompts to run non-interactively when invoked via API/tool calls in automation contexts.

Shell completion deferred to v0.2.1 per brainstorm decision.

## Prerequisites: How Claude Code Passes Arguments to Prompts

**Key insight:** Agent prompts (markdown files in `prompts/codex/`) use the `$ARGUMENTS` string substitution pattern documented in Claude Code.

When a user invokes `/burlaki-rollback --no-input --to last-checkpoint`:
1. Claude Code replaces `$ARGUMENTS` with the literal string `--no-input --to last-checkpoint`
2. The LLM receives the fully-rendered prompt content
3. The LLM interprets the JavaScript pseudocode blocks as **behavioral guidelines**, not executable code

**Important:** JavaScript blocks in agent prompts are **instructional pseudocode** that the LLM interprets to determine its behavior. They are NOT executed by Node.js or any runtime.

**Reference:** [Claude Code Skills Documentation](https://docs.anthropic.com/en/docs/claude-code/slash-commands) - `$ARGUMENTS` is a documented string substitution.

## Problem Statement

**Current limitations:**
- Interactive prompts block CI/CD automation (commands require human input)
- No visibility into workflow state without reading PRD files manually
- Developers can't quickly check which stories are pending/blocked

**Why this matters:**
- Enables automated workflows in CI/CD pipelines
- Improves developer productivity with instant status visibility
- Aligns with roadmap v0.2.0 "CLI Foundation" milestone

## Proposed Solution

### Approach: Minimal MVP

Per brainstorm decision (Approach A), implement only `--no-input` and `status` command. Shell completion deferred.

**Rationale:**
- Unlocks automation use cases immediately
- Provides essential DX value with minimal scope
- Follows DHH principle: start simple, iterate

## Technical Considerations

### Architecture

**Flag Parsing:** Continue manual parser pattern (no external libraries)
- Pattern established in `scripts/skills-gate.mjs`
- Boolean flags: `--no-input` sets flag to true
- Value flags: `--to <target>` reads next argument

**Exit Codes:** Use standardized codes from ROADMAP
- `0` = Success
- `1` = General error
- `2` = Usage error (missing required args with `--no-input`)

**Output Patterns:**
- JSON: `process.stdout.write(JSON.stringify(result, null, 2) + '\n')`
- Human-readable: Formatted table (manual padding, no external libraries per DHH principle)
- Always end with newline

**Table Formatting:**
- Use manual string padding (no cli-table or similar libraries)
- Simple key-value alignment: `console.log(`  ${key.padEnd(12)} ${value}`)`
- Keep it minimal - focus on readability, not visual borders

### Research Insights

**From clig.dev best practices:**
- `--no-input` must fail immediately if required information is missing
- Tell users exactly which flag to use: "Error: --env required when using --no-input"
- Support environment variable fallback: `WORKFLOW_NON_INTERACTIVE=true`

**From agent-native patterns:**
- Single prompt supports both modes via conditional branching
- Non-interactive mode outputs structured STATUS with JSON
- Interactive mode uses AskUserQuestion tool
- All interactive prompts must have sensible defaults documented

**Configuration hierarchy:**
CLI flags > Environment variables > Config file > Safe defaults

### Implementation Details

**`--no-input` Flag Scope:**
Affected agent prompts and their interactive sections:
- `/burlaki-rollback` - Skip confirmation prompts when `--yes` behavior desired
- `/burlaki-continue` - Auto-select latest checkpoint, skip "which phase?" prompt
- `/burlaki-run` - Run all pending stories without per-story confirmation

**Relationship: `--no-input` implies `--yes`:**
- `--no-input` = Disable all interactive prompts, use defaults
- `--yes` = Skip confirmation prompts only (existing flag in rollback)
- When `--no-input` is set, treat it as if `--yes` is also set
- `--no-input` is the superset flag for full automation

**Implementation Approach:**
Agent prompts are markdown files processed by Claude Code/Codex CLI. To support `--no-input`:
1. Add flag detection in prompt frontmatter/documentation
2. Modify interactive YAML decision trees to check for `--no-input`
3. Use defaults instead of prompting when flag present
4. Return structured STATUS response instead of interactive prompts

**Example Flow Change:**
```yaml
# Current: Interactive
STATUS: ask_user
question: "Which checkpoint?"

# With --no-input: Automated
if: "--no-input flag present"
then:
  STATUS: done
  checkpoint: "latest"
else:
  STATUS: ask_user
  question: "Which checkpoint?"
```

**`burlaki status` Command:**
Data sources:
- `.agents/tasks/prd.json` - Current stage, stories array
- `git log --grep='\[burlaki-checkpoint\]'` - Last checkpoint SHA/timestamp

Output fields:
```json
{
  "currentStage": "coder",
  "pendingStories": 5,
  "completedStories": 3,
  "totalStories": 8,
  "lastCheckpoint": {
    "sha": "abc1234",
    "timestamp": "2026-02-15T10:30:00Z",
    "storyId": "auth-002"
  },
  "blockedStories": ["auth-003"]
}
```

Display formats:
- Human: Table layout with aligned columns
- JSON: Pretty-printed with `--json` flag

## Acceptance Criteria

### `--no-input` Flag (Agent Prompts)

- [ ] Add `--no-input` to `/burlaki-rollback` prompt
  - Document flag in frontmatter argument-hint
  - Add mode detection: check for `--no-input` or `--yes` or env var
  - Skip confirmation prompts when flag present
  - Use `--to` target directly without asking
  - Output structured JSON: `{status: "done", checkpoint: "...", auto_approved: true}`
  - Exit code 2 if `--to` not specified (following clig.dev)
- [ ] Add `--no-input` to `/burlaki-continue` prompt
  - Document flag in frontmatter argument-hint
  - Auto-detect phase or use latest checkpoint
  - Skip "which phase?" confirmation
  - Use defaults from `.agents/config.json` if available
  - Output structured STATUS with checkpoint details
- [ ] Add `--no-input` to `/burlaki-run` prompt
  - Document flag in frontmatter argument-hint
  - Run all pending stories without per-story confirmation
  - Auto-approve changes (equivalent to `--yes`)
  - Output progress as structured JSON lines
- [ ] Support environment variable: `WORKFLOW_NON_INTERACTIVE=true`
- [ ] All existing interactive behavior works unchanged without flag
- [ ] Document defaults in prompt: "When --no-input: uses latest checkpoint"
- [ ] Add error messages: "Error: --to <target> required when using --no-input"

### `burlaki status` Command

- [ ] Create `burlaki status` script at `scripts/burlaki-status.mjs`
- [ ] Display current workflow stage (from PRD)
- [ ] Show pending/completed/total story counts
- [ ] Show last checkpoint (SHA, timestamp, story ID)
- [ ] Show blocked stories list (if any)
- [ ] Support `--json` flag for programmatic output
- [ ] Support `--help` flag for usage info (clig.dev guideline)
- [ ] Human-readable table format by default
- [ ] Exit code 0 on success, 1 if PRD not found
- [ ] Graceful error message when PRD missing: "No PRD found at .agents/tasks/prd.json. Run /burlaki-start first."
- [ ] Add to package.json scripts

### Testing

- [ ] Test `--no-input` with each command in CI-like environment
- [ ] Verify `status` shows correct data after various operations
- [ ] Test JSON output parsing
- [ ] Verify exit codes are correct

## Success Metrics

- CI/CD pipelines can run commands without interactive prompts
- Developers can check workflow state in <2 seconds
- No breaking changes to existing workflows

## Dependencies & Risks

**Dependencies:**
- Existing PRD structure (`.agents/tasks/prd.json`)
- Git checkpoint convention (`[burlaki-checkpoint]` prefix)

**Risks:**
- **Low:** `--no-input` might skip important safety prompts
  - Mitigation: Only skip confirmation prompts, keep safety checks
- **Low:** Status command might show stale data
  - Mitigation: Real-time git check (no caching)

## Implementation Phases

### Phase 1: `--no-input` Flag (Agent Prompts)

**Files to modify:**
- `prompts/codex/burlaki-rollback.md` - Add flag support
- `prompts/codex/burlaki-continue.md` - Add flag support
- `prompts/codex/burlaki-run.md` - Add flag support

**Tasks:**
1. Update YAML frontmatter: add `--no-input` to argument-hint
2. Add mode detection section in prompt body
3. Modify decision trees: check for `--no-input` before interactive prompts
4. Add conditional branches: interactive vs non-interactive paths
5. Return `STATUS: done` with defaults instead of `STATUS: ask_user`
6. Add structured JSON output for non-interactive mode
7. Document defaults: "When --no-input: uses latest checkpoint, skips confirmation"
8. Add error handling: exit code 2 if required args missing with `--no-input`

**Implementation Pattern:**

> **Note:** JavaScript blocks below are **instructional pseudocode** that the LLM interprets as behavioral guidelines. They are NOT executed by Node.js. The LLM reads these patterns and follows the logic to determine its actions.

```markdown
## Mode Detection

Parse `$ARGUMENTS`:
```javascript
const isNonInteractive = args['--no-input'] || 
                         args['--yes'] ||
                         process.env.WORKFLOW_NON_INTERACTIVE === 'true';
```

## Execution

### If Non-Interactive Mode:
```javascript
if (isNonInteractive) {
  if (!args['--to']) {
    console.error('Error: --to <target> required when using --no-input');
    process.exit(2);
  }
  
  console.log(JSON.stringify({
    status: "done",
    checkpoint: args['--to'],
    auto_approved: true,
    reason: "--no-input flag set"
  }));
  
  STATUS: done
  checkpoint: args['--to']
}
```

### If Interactive Mode:
Use existing AskUserQuestion patterns...
```

**Configuration Support:**
Create `.agents/config.json` with non-interactive defaults:
```json
{
  "workflow": {
    "non_interactive_defaults": {
      "rollback_target": "last-checkpoint",
      "continue_phase": "auto-detect",
      "run_all_stories": true
    }
  }
}
```

**Estimated effort:** 2-3 hours

### Phase 2: `burlaki status` Command

**Files to create:**
- `scripts/burlaki-status.mjs` - Main command script

**Files to modify:**
- `package.json` - Add script entry

**Tasks:**
1. Create script with argument parsing
2. Implement PRD parser
3. Implement git checkpoint reader
4. Implement table formatter
5. Implement JSON output
6. Add help documentation

**Estimated effort:** 3-4 hours

## References & Research

### Internal References

- **CLI Patterns:** `scripts/skills-gate.mjs` - Flag parsing, JSON output
- **CLI Patterns:** `scripts/install-prompts.mjs` - Boolean flags, validation
- **Brainstorm:** `docs/brainstorms/2026-02-15-cli-improvements-v0.2.0-brainstorm.md`
- **Code Style:** `AGENTS.md` - ESM modules, naming conventions
- **Agent Prompts:** `prompts/codex/burlaki-rollback.md` - Existing --yes flag pattern
- **Agent Prompts:** `prompts/codex/burlaki-continue.md` - Decision tree structure
- **Status Protocol:** `prompts/codex/burlaki-start.md` - STATUS definitions

### External References

- **CLI Guidelines:** [clig.dev](https://clig.dev) - Exit codes, flag conventions
- **Exit Codes:** ROADMAP_full.md section "Exit Codes"
- **CLI Conventions:** ROADMAP_full.md section "CLI Conventions"
- **Agent SDK:** Claude Code Agent SDK - Mode-agnostic prompt design
- **GitHub CLI:** `gh` command patterns - Status command, --json output
- **AWS Claude Flow:** Decision tree YAML patterns

### Related Solutions

- **Rollback Pattern:** `docs/solutions/workflow-issues/rollback-checkpoint-recovery-Burlaki-20260215.md` - Pipeline pattern, git commands
- **CLI Conventions:** `docs/solutions/workflow-issues/code-review-roadmap-findings-Burlaki-20260215.md` - Flag documentation patterns

### Research Insights Applied

**From clig.dev:**
- Fail fast on missing args with `--no-input`
- Clear error messages: "Error: --flag required when using --no-input"
- Support TTY detection as fallback

**From Agent-Native Patterns:**
- Single prompt supports both modes (no duplication)
- Structured JSON output for programmatic consumption
- Configuration hierarchy: CLI > Env > Config > Defaults

**From Claude Code SDK:**
- Use STATUS protocol for agent communication
- Granular tools composable by agents
- Tool parity: any UI action achievable programmatically

## Configuration

### Non-Interactive Defaults

Create `.agents/config.json`:

```json
{
  "workflow": {
    "non_interactive_defaults": {
      "rollback": {
        "target": "last-checkpoint",
        "skip_confirmation": true
      },
      "continue": {
        "phase": "auto-detect",
        "use_latest_checkpoint": true
      },
      "run": {
        "all_stories": true,
        "auto_approve": true
      }
    }
  }
}
```

### Environment Variables

- `WORKFLOW_NON_INTERACTIVE=true` - Equivalent to `--no-input`

## Code Examples

### Flag Parsing Pattern

```javascript
// scripts/burlaki-status.mjs
function parseArgs(argv) {
  const out = { json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') {
      out.json = true;
    }
  }
  return out;
}
```

### Status Output Format (Human)

```
┌─ Burlaki Workflow Status ─────────────────┐
│ Stage: coder                              │
│                                           │
│ Stories:                                  │
│   Pending:    5                           │
│   Completed:  3                           │
│   Total:      8                           │
│                                           │
│ Last Checkpoint:                          │
│   SHA:        abc1234                     │
│   Story:      auth-002                    │
│   Time:       2026-02-15 10:30:00 UTC     │
│                                           │
│ Blocked: auth-003                         │
└───────────────────────────────────────────┘
```

### `--no-input` Error Handling

```javascript
if (args.noInput && !args.target) {
  console.error('Error: --to <target> required when using --no-input');
  process.exit(2);
}
```

## Open Questions

None - all resolved in brainstorm phase.

## Next Steps

→ Run `/workflows:work` to begin implementation
