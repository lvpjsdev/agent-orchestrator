# Beads Integration Guide

## Overview

Burlaki uses Beads as its primary task storage layer, providing:
- Persistent task tracking across sessions
- Dependency-aware task graphs
- Multi-agent conflict prevention

## Task Schema

Burlaki maps its task concepts to Beads as follows:

### Issue Types
- `prd` - Product requirement (epic-level)
- `task` - Implementation unit
- `subtask` - Granular work item
- `message` - Communication thread

### Relationships
- `blocks` - Dependency chain
- `supersedes` - Replacement tasks
- `relates_to` - Cross-references

### Metadata Fields
- `stage` - Workflow stage (manager/coder/tester/reviewer/devops)
- `assignee` - Agent identifier
- `priority` - P0-P3 priority levels

## CLI Usage

```javascript
import { createBeadsClient } from '@lvpjsdev/burlaki/beads';

const client = createBeadsClient({ cwd: process.cwd() });

// Create a task
const { data: task } = await client.createTask('Implement feature X', {
  type: 'task',
  priority: 'P0',
  stage: 'coder',
});

// List ready tasks
const { data: ready } = await client.listReadyTasks();

// Update task status
await client.updateTask(task.id, { status: 'in_progress', assignee: 'claude' });
```

## Fallback Mode

When beads is unavailable, Burlaki uses `.burlaki/tasks.json` for storage. This allows development to continue while beads integration remains optional.

Migration from fallback to beads can be done via `scripts/migrate-to-beads.mjs`.
