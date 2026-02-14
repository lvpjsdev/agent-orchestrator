---
name: prd
---

# PRD (Product Requirements Document)

Creates structured product requirements documents with clear scope and acceptance criteria.

## Purpose

Transform product requests into actionable, developer-ready specifications.

## Structure

```json
{
  "title": "Feature name",
  "summary": "Brief description",
  "scope": {
    "in": ["what we build"],
    "out": ["what we don't build"]
  },
  "tasks": [
    {
      "id": "TASK-001",
      "title": "Task title",
      "acceptance": ["criteria 1", "criteria 2"],
      "tags": []
    }
  ],
  "unknowns": ["questions to resolve"]
}
```

## Output Location

Default: `.agents/tasks/prd.json`

## Process

1. Collect requirements from user
2. Define scope boundaries (in/out)
3. Break down into atomic tasks
4. Add acceptance criteria per task
5. Tag escalations (@human, @spec-drift)
