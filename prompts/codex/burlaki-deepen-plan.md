---
description: Deepen plan sections with compound research and validation
argument-hint: "<plan-file> [--strict] [--no-skills-gate]"
---

# Burlaki Deepen Plan — Compound Plan Enhancement

Orchestrate an in-depth plan refinement before coding: validate the PRD, discover compound artifacts, run research/review agents, and update plan files with backups and clear contexts.

## Input & Parameters
- Required `<plan-file>` (relative path under `.agents/tasks` or `plans/`)
- Optional `--strict` to fail on any validation warning
- Optional `--no-skills-gate` to skip skills-gate integration

### Parameter Table
| Parameter | Behavior |
| --- | --- |
| `<plan-file>` | JSON/YAML plan to deepen; validated for schema + status fields |
| `--strict` | Reject missing docs/solutions entries or agent failures |
| `--no-skills-gate` | Skip `pnpm skills:gate` check when tooling is unavailable |

## Workflow Steps

### 1. Parse and Analyze Plan Structure
- Validate plan path exists and is well-formed (backup first, fail gracefully if malformed)
- Backup plan file: copy to `.agents/backups/<timestamp>-<basename>` before modifications
- Enumerate sections consistently (1.1, 1.2, …) and record IDs for later context stitching
- Example: parse `plans/feature-login.json` → sections `1.1 Authentication`, `1.2 Recovery`
- Output suffix: always append `_enhanced` to new plan drafts so consumers know they are post-merge
- Error handling: stop with structured JSON if parsing/backup fails

### 2. Discover and Apply Available Skills
- Load `agent-skills-matrix.json` and prefer compound-engineering skills (fixes compound discovery)
- Apply new filtering rule: include only agents tagged `compound-engineering` once the plan describes multi-step flows
- If no skills found, fall back to general-purpose agents but log the reason
- Example: discover `codex` skill with stages `[coder, verifier]` for `feature-login`

### 3. Discover and Apply Learnings/Solutions
- If `docs/solutions/` is empty, initialize placeholder directory (handles empty docs/solutions/ scenario)
- Harvest recent learnings (via filenames, metadata) and inject summaries into sections requiring reinforcement
- Example: append insight from `docs/solutions/authentication-patterns-learnings.md` into Authentication section

### 4. Launch Per-Section Research Agents
- For each section, spawn agent(s) with context-managed prompts; after each agent finish, drop its context before next launch
- Context management strategy: stash section snippet, agent inputs, and retrieved sources; purge caches after agent completion to avoid bleed-over
- Show example command structure for agent launching per section

### 5. Discover and Run ALL Review Agents
- Identify review agents via `agent-skills-matrix.json` (security, performance, accessibility, compliance)
- Ensure compound-engineering agent filtering rule still applies so only relevant reviewers run
- Launch agents in parallel, capturing failure/success for each; on failure, tag section for retries (error handling for agent failures)
- Example: run `security-reviewer`, `performance-reviewer`, and `code-quality-reviewer` agents and aggregate verdicts

### 6. Wait for ALL Agents and Synthesize Everything
- Poll agent outputs with timeouts and structured retries; keep combined summaries per section
- Apply output suffix convention `_enhanced` while generating logs and partial results to keep downstream tools consistent
- Example: wait for research + review agents for section 1.1 and combine notes into bullet list

### 7. Enhance Plan Sections
- Merge agent insights back into plan sections, adding action items, risks, and follow-ups
- Ensure consistent enumeration and that each section references backup files and verification checks
- Example modification snippet for section `1.1 Authentication`: add `Risks`, `Next Steps`, `QA notes` fields

### 8. Add Enhancement Summary
- Summarize what changed per section, any new learnings, agent outcomes, skills validated, and docs created/updated
- Example summary bullet: `Section 1.2 Recovery: Learned token expiration best practice from security reviewer.`

### 9. Update Plan File
- Write enhanced plan to `<plan-file>.enhanced` or replace original depending on `--strict`
- Append metadata: `enhanced_at`, `enhanced_by`, `skills_gate_status`
- Plan file validation: re-run schema check to ensure modifications remain valid JSON/YAML
- If `--strict`, fail when validation warnings exist
- Integration with skills-gate: unless `--no-skills-gate`, run `pnpm skills:gate --matrix agent-skills-matrix.json --stage coder --agent claude` and record status

## Behaviors & Quality Guards
- **Plan validation:** Always check for `status`, `priority`, `sections`; fail with context if missing
- **Backup strategy:** Copy plan before edits to `.agents/backups`; record path in summary
- **Context management:** Clear cached contexts between agents, limit to 4 sections at a time
- **Agent failures:** Capture errors; retry once per failure, then flag section
- **Empty docs/solutions:** Auto-bootstrap README warning file when directory is empty
- **Skills-gate integration:** Run gate and include pass/fail in enhancement summary; `--no-skills-gate` skips and logs reason

## Quality Checks
- Validate lint of enhanced plan (JSON/YAML). Example command: `pnpm skills:gate --matrix agent-skills-matrix.json --stage coder --agent claude` after plan validation
- Ensure all review agents returned `approved | changes_requested`; escalate if `changes_requested`
- Confirm `docs/solutions/` has been touched or intentionally stubbed

## Post-Enhancement Options
1. `--dry-run`: Re-run prompt to inspect changes without persisting
2. `burlaki-run`: Trigger execution cycle now that plan is fleshed out
3. `burlaki-human`: Ask human reviewer to sanity-check the enhanced plan

## Integration with `skills-matrix.json`
- Align discovered skills with `agent-skills-matrix.json` entries; add new capabilities if plan demands (e.g., `compound-engineering` skill tag)
- Sample integration block in plan:

```
skills:
  - name: compound-engineering
    stage: coder
    required: true
    note: "Needed for multi-step research + review coordination"
```

## Examples by Task
- **Parsing & backup:** `cp plans/checkout.json .agents/backups/2025-11-23-checkout.json` before parsing
- **Skills discovery:** Query matrix → prefer `compound-engineering` and exclude others
- **Learnings injection:** Write excerpt from `docs/solutions/auth-patterns.md` into plan section
- **Research agents:** `Task({ prompt: "Research best token refresh", section: 1.1 })`
- **Review agents:** Run security + performance + QA and capture outputs
- **Synthesis:** Combine outputs and tag section with `_enhanced` suffix
- **Plan update:** Output new file `plans/checkout.complex_enhanced.json` and run `pnpm skills:gate` to confirm

## Error Handling & Output Convention
- Failures from agents are logged with `AGENT_FAILURE_SECTION_<id>`; retries happen once before marking section for manual review
- Outputs include `_enhanced` suffix to distinguish from original artifacts
- Structured exit example:

```
{
  "status": "completed",
  "plan": "plans/checkout_enhanced.json",
  "errors": []
}
```

## Final Notes
- Ensure documentation updates are surfaced via `docs/solutions/` even when creating empty placeholders
- Always reference the backup file path when reporting
- Use consistent enumeration (1.1, 1.2) across all generated sections
