---
name: ao-human
description: Show tasks escalated to a human (tag-based)
---

# AO Human

Find escalated stories/tasks by tag in Ralph PRD files.

Default tag: `@human`

**Steps**

1) Parse args from user input:
   - Optional `--tag <tag>` (default `@human`)

2) Search in PRD/task artifacts (only include paths that exist):
```bash
rg -nF -- "<tag>" .agents/tasks/*.json .ralph/progress*.md .ralph/errors.log
```
If `.agents/tasks` or `.ralph` is missing, report what is unavailable and omit those paths from the search.

3) Summarize grouped by task/story when possible:
   - PRD file
   - story/task id/title (if present)
   - lines that include the tag

If no matches, say none are escalated for that tag.
