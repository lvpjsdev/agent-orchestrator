# TODO Items for Agent-Orchestrator

This directory collects tracked TODO items that document follow-up work, observations, and refinements for the agent-orchestrator project. Each file is a focused write-up that captures why the task matters, how it should behave, and any contextual notes from prior reviews.

## Overview
- **Why this directory exists:** TODO items surface gaps (feature follow-through, formatting rules, CLI behavior) that need dedicated attention before the change is considered complete.
- **Why `.agents` is ignored:** The root `.gitignore` explicitly ignores `.agents` because it contains generated agent context and tooling state that must never be checked in. This README lives in `todos/`, which is intentionally a committed, human-facing record of what remains to be addressed.
- **Ownership:** Treat this directory as a living log—when starting work, update the relevant TODO file (or add a new one) rather than leaving details in loose notes.

## File Naming Convention
`XXX-complete-PY-[short description].md`

| Section | Meaning |
| --- | --- |
| `XXX` | Incremental ID (001–010) that also sorts items chronologically. |
| `complete` | Indicates the TODO is a completed/closed item; future entries may use `open` or `draft` if needed. |
| `PY` | Priority (P1–P3) taken from the review notes: P1 = high, P2 = medium, P3 = low. |
| `[short description]` | Human-readable hook for the topic. |

## TODO Files
Each current file documents a completed item from the review backlog:

1. `001-complete-P1-parallel-flag-misalignment.md` – Adjusted parallel flag behavior so agents are aligned with the CLI expectations.
2. `002-complete-P1-changelog-format.md` – Updated changelog guidelines and formatting conventions for readability.
3. `003-complete-P1-prd-schema-versioning.md` – Clarified how PRD schema versions are tracked and validated.
4. `004-complete-P2-content-type-mixing.md` – Documented how mixed content types should be normalized in skill payloads.
5. `005-complete-P2-enhancement-summary-duplication.md` – Fixed duplicate enhancement summaries that caused confusion in release notes.
6. `006-complete-P2-yagni-foundational-pieces.md` – Captured YAGNI risks around foundational feature scope.
7. `007-complete-P2-missing-version-flag.md` – Added missing version flag references in related tooling.
8. `008-complete-P2-version-sequence.md` – Ensured version sequences remain monotonic for gate checks.
9. `009-complete-P2-inconsistent-command-format.md` – Resolved inconsistencies in how commands are formatted across docs.
10. `010-complete-P3-malformed-code-block.md` – Tidied up malformed code blocks that broke rendering in the docs.

## Status Tracking Approach
- **Status prefixes** describe where the work stands (e.g., `open-`, `draft-`, `complete-`). When work is in progress, copy an existing template file and update the prefix to `draft` or `open` until it is merged.
- **Priority tags** (`P0`–`P3`) live in the filename and describe the urgency based on review impact. Lower numbers = more critical. Use the same scale in the body for consistency.
- **Metadata** should always include at least these fields at the top of each TODO file:
  ```markdown
  Status: complete
  Priority: P2
  Owner: @username
  ```
  Adjust the values when work is still underway.

## Examples
1. **Discovering new work:** Suppose you find an accessibility gap during testing. Create `011-open-P2-accessibility-tabbable-focus.md`, populate it with the gap description, and link to supporting issues.
2. **Finishing a TODO:** Once a fix lands, update the `Status:` field to `complete`, rename the file to `012-complete-P2-...` if necessary, and summarize the resolution in the body.

## Guidelines for New TODOs
1. **Check for duplicates:** Search `todos/` to avoid overlapping write-ups. Reuse the same file if you can add new context without cluttering the history.
2. **Use descriptive summaries:** The short description should be clear enough that someone skimming the directory knows the topic.
3. **Keep entries actionable:** Include the problem, desired outcome, impacted areas, and links to references or issues.
4. **Link to concrete follow-ups:** When the TODO depends on other work (PRs, scripts, docs), add direct links or references so future contributors can trace the reasoning.
5. **Mind the priority:** Pick the `P` level that reflects how the review ranked the item; change it only if the urgency truly shifts.
6. **Status updates:** Every edit should either advance the status or clarify the scope; avoid once-only mentions without plan for next steps.

## Closing
Treat `todos/` as a lightweight knowledge base for unfinished work. Keeping these entries tidy ensures new contributors can see what still needs attention and why prior reviewers flagged it.
