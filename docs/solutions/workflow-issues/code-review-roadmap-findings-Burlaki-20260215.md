---
module: Burlaki
date: 2026-02-15
problem_type: workflow_issue
component: tooling
symptoms:
  - CodeRabbit review flagged 10+ issues in ROADMAP_full.md
  - Version numbering inconsistent (v0.1, v0.1.5, v0.2 instead of semver)
  - Changelog not following Keep a Changelog format
  - Enhancement Summary duplicated Changelog content
  - Missing --version and --help flags in CLI conventions
  - No documented command format convention (/burlaki-* vs burlaki <cmd>)
  - PRD schema versioning in wrong version (v0.2.5 instead of v0.1.5)
  - v0.2.5 Foundational Pieces flagged as YAGNI
  - Malformed code blocks (nested triple backticks)
  - --parallel flag documented in prompts but roadmap showed "not started"
root_cause: inadequate_documentation
resolution_type: documentation_update
severity: medium
tags: [roadmap, documentation, code-review, conventions, semver, markdown]
---

# Troubleshooting: Code Review Findings for ROADMAP_full.md

## Problem

CodeRabbit automated code review flagged multiple documentation issues in ROADMAP_full.md during PR #11 review. These issues affected documentation quality, consistency, and searchability.

## Environment

- Module: Burlaki Workflow CLI
- Affected File: ROADMAP_full.md
- Date: 2026-02-15
- PR: #11

## Symptoms

**Observed during code review:**

1. **Version Numbering Inconsistency**
   - Using v0.1, v0.1.5, v0.2.5 instead of semver (0.1.0, 0.2.0)
   - Confusing for developers familiar with semver

2. **Changelog Format Issues**
   - Date-based headers instead of version-based
   - Missing change type categories (Added, Changed, Fixed)
   - No semver declaration

3. **Content Duplication**
   - Enhancement Summary section duplicated Changelog content
   - Same information in two places

4. **Missing CLI Conventions**
   - No --version flag documented
   - No --help flag documented
   - No command format convention (/burlaki-* vs burlaki <cmd>)

5. **Architecture Issues**
   - PRD schema versioning in wrong version (v0.2.5 vs v0.1.5)
   - v0.2.5 Foundational Pieces marked as YAGNI (You Aren't Gonna Need It)
   - Content mixing: roadmap + architecture + implementation details

6. **Code/Roadmap Misalignment**
   - --parallel flag in burlaki-run.md prompts
   - Roadmap showed v0.4 Parallel Execution as "not started"
   - Users might expect feature to work

7. **Markdown Formatting**
   - Malformed nested code blocks (triple backticks inside triple backticks)
   - Missing language hints on code fences
   - Missing blank lines around headings

## What Didn't Work

**Attempted fixes in isolation:**
- Fixing markdown only (didn't address content issues)
- Adding flags without documenting conventions
- Moving version numbers without standardizing format

## Solution

**Comprehensive documentation restructure:**

1. **Standardized Version Numbering**
   - Changed from v0.1 → v0.1.0, v0.2 → v0.2.0
   - Added Version Strategy section with semver declaration

2. **Changelog Reformatted**
   - Version-based headers: ## [0.2.0]
   - Change type categories: ### Added, ### Changed, ### Fixed
   - Added Keep a Changelog reference

3. **Removed Duplication**
   - Deleted Enhancement Summary section
   - Kept only Changelog at bottom

4. **Added CLI Conventions**
   - Added --version and --help flags
   - Documented command format convention:
     - /burlaki-* for agent prompts
     - burlaki <cmd> for CLI commands

5. **Fixed Version Placement**
   - Moved PRD schema versioning to v0.2.0 scope
   - Moved YAGNI items to Future Considerations

6. **Aligned Code with Roadmap**
   - Removed --parallel from burlaki-run.md
   - Added note: "Parallel execution planned for v0.4"

7. **Fixed Markdown**
   - Used 4-backtick fences for nested code blocks
   - Added language hints (```json, ```text, etc.)
   - Added blank lines around all headings

## Why This Works

1. **Root cause:** Inadequate documentation standards and conventions
2. **Solution approach:** Comprehensive restructure following industry standards
3. **Key insight:** Code review automation catches issues humans miss

The solution follows established conventions:
- Keep a Changelog for changelog format
- Semantic Versioning for version numbers
- clig.dev for CLI conventions

## Prevention

- Use CodeRabbit or similar linters in CI/CD
- Follow documentation standards before publishing
- Validate markdown with markdownlint
- Document conventions in AGENTS.md or README
- Keep roadmap focused (what/when) vs architecture (how)

## Related Issues

- Related: docs/solutions/workflow-issues/rollback-checkpoint-recovery-Burlaki-20260215.md (same module)

## References

- [Keep a Changelog](https://keepachangelog.com)
- [Semantic Versioning](https://semver.org)
- [clig.dev - Command Line Interface Guidelines](https://clig.dev)
- PR #11: https://github.com/lvpjsdev/burlaki/pull/11
