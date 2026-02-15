---
description: Handle human escalations (list tags, resolve, or report)
argument-hint: "[--tag <tag>] [--list-tags] [--resolve <story-id> --note \"text\"]"
---

# Burlaki Human

Handle escalated stories/tasks with tag search, tag discovery, and resolution.

Default tag: `@human`

**Steps**

1) Parse args from `$ARGUMENTS`. Support `--resolve <story-id>`, optional `--note "text"`, `--list-tags`, and optional `--tag <tag>` (default `@human`). If `--resolve` is provided, run the resolve flow. Else if `--list-tags` is provided, run the list-tags flow. Otherwise run the view escalations flow.

2) **Resolve flow** (`/burlaki-human --resolve <story-id> [--note "text"]`):
   1. Validate PRD exists at `.agents/tasks/prd.json`. If missing: exit 2 with `No PRD found. Run /burlaki-start first.`
   2. Parse PRD, find story by id. If parse error: exit 1 and show error details.
   3. If not found: exit 2 with `Story not found: <id>`.
   4. If story.status != `blocked`: exit 2 with `Story <id> is not blocked (status: <status>)`.
   5. Create checkpoint (allow empty if tree clean):
       `git add -A && git commit --allow-empty -m "[burlaki-checkpoint] Resolved escalation: <story-id>"`
   6. Atomic write PRD (update story fields):
       ```bash
       jq --arg id "<story-id>" --arg note "<resolution-note>" '
         (.stories[] | select(.id == $id)) |= (
           .status = "pending" |
           if $note != "" then .resolution_note = $note else . end |
           del(.blocked_reason)
         )
       ' .agents/tasks/prd.json > .agents/tasks/prd.json.tmp && \
       mv .agents/tasks/prd.json.tmp .agents/tasks/prd.json
       ```
   7. Output (bordered box format):

       ```text
       ═══════════════════════════════════════════════════════
       Resolved: auth-003
       Status: blocked → pending
       Note: Added missing null check
       
       Run /burlaki-continue to resume execution.
       ═══════════════════════════════════════════════════════
       ```

3) **List-tags flow** (`/burlaki-human --list-tags`):
   1. Search for tag pattern `@[a-z][-a-z]*` (letter start, optional hyphens) in:
      - `.agents/tasks/*.json`
      - `.ralph/progress*.md` (if exists)
      - `.ralph/errors.log` (if exists)
   2. Extract unique tags with counts.
   3. Output (bordered box format):

      ```text
      ═══════════════════════════════════════════════════════
      Escalation Tags
      
      @human      3 occurrences
      @reviewer   1 occurrence
      @security   1 occurrence
      ═══════════════════════════════════════════════════════
      ```

4) **View escalations flow** (`/burlaki-human [--tag <tag>]`):
   1. Default tag = `@human`.
   2. Search for tag in artifacts (only include paths that exist):

      ```bash
      rg -nF -- "<tag>" .agents/tasks/*.json .ralph/progress*.md .ralph/errors.log
      ```

      If `.agents/tasks` or `.ralph` is missing, report what is unavailable and omit those paths from the search.
   3. Summarize grouped by task/story when possible: PRD file, story/task id/title (if present), lines that include the tag.
   4. Output (bordered box format):

      ```text
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

      If no matches, say none are escalated for that tag.
