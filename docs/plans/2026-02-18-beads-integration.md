# Beads Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Beads CLI as primary state management layer with graceful degradation to JSON fallback.

**Architecture:** CLI wrapper module that invokes `bd` commands via child_process, with fallback to in-memory/JSON state when beads unavailable. Beads stores tasks in `.beads/` directory using extended schema (prd/task/subtask types with stage metadata).

**Tech Stack:** Node.js ESM, child_process for CLI invocation, existing JSON fallback patterns

---

## Task 1: Add Beads Types and Interfaces

**Files:**
- Modify: `src/index.ts`
- Test: `tests/unit/beads.test.mjs`

**Step 1: Add Beads types to src/index.ts**

Add to end of `src/index.ts`:

```typescript
export type BeadsIssueType = 'prd' | 'task' | 'subtask' | 'message';
export type BeadsRelationship = 'blocks' | 'supersedes' | 'relates_to' | 'replies_to';
export type BeadsStage = 'manager' | 'coder' | 'tester' | 'reviewer' | 'devops';
export type BeadsPriority = 'P0' | 'P1' | 'P2' | 'P3';

export type BeadsTask = {
  id: string;
  title: string;
  description?: string;
  type: BeadsIssueType;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  stage?: BeadsStage;
  assignee?: string;
  priority?: BeadsPriority;
  dependencies?: string[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type BeadsClientResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: string; fallback: boolean };

export type BeadsClientConfig = {
  cwd?: string;
  fallbackToMemory?: boolean;
  timeout?: number;
};
```

**Step 2: Run build to verify types compile**

Run: `pnpm build`
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add BeadsTask types and interfaces"
```

---

## Task 2: Create Beads CLI Wrapper Module

**Files:**
- Create: `scripts/beads-client.mjs`
- Test: `tests/unit/beads-client.test.mjs`

**Step 1: Create beads-client.mjs with CLI detection**

```javascript
#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const BEADS_TIMEOUT_MS = 30000;

/**
 * Check if beads CLI is available in PATH
 * @returns {Promise<boolean>}
 */
export async function isBeadsAvailable() {
  return new Promise((resolve) => {
    const proc = spawn('which', ['bd'], { timeout: 5000 });
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

/**
 * Check if .beads directory exists in project
 * @param {string} cwd 
 * @returns {boolean}
 */
export function isBeadsInitialized(cwd = process.cwd()) {
  return existsSync(join(cwd, '.beads'));
}

/**
 * Execute a beads CLI command
 * @param {string[]} args 
 * @param {{ cwd?: string, timeout?: number }} options 
 * @returns {Promise<{ ok: boolean, stdout: string, stderr: string, code: number }>}
 */
export async function execBeads(args, options = {}) {
  const { cwd = process.cwd(), timeout = BEADS_TIMEOUT_MS } = options;
  
  return new Promise((resolve) => {
    const proc = spawn('bd', args, {
      cwd,
      timeout,
      env: { ...process.env, NO_COLOR: '1' },
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });
    
    proc.on('close', (code) => {
      resolve({ ok: code === 0, stdout, stderr, code: code ?? 1 });
    });
    
    proc.on('error', (err) => {
      resolve({ ok: false, stdout: '', stderr: err.message, code: 1 });
    });
  });
}
```

**Step 2: Add task operations to beads-client.mjs**

Append to file:

```javascript
/**
 * List ready tasks (no open blockers)
 * @param {{ cwd?: string }} options 
 * @returns {Promise<import('../src/index.js').BeadsClientResult<import('../src/index.js').BeadsTask[]>>}
 */
export async function listReadyTasks(options = {}) {
  const result = await execBeads(['ready', '--json'], options);
  
  if (!result.ok) {
    return { 
      ok: false, 
      error: result.stderr || `bd exited with code ${result.code}`,
      fallback: true 
    };
  }
  
  try {
    const tasks = JSON.parse(result.stdout);
    return { ok: true, data: Array.isArray(tasks) ? tasks : [] };
  } catch (e) {
    return { ok: false, error: `Failed to parse beads output: ${e.message}`, fallback: true };
  }
}

/**
 * Create a new task
 * @param {string} title 
 * @param {{ type?: string, priority?: string, stage?: string, cwd?: string }} options 
 * @returns {Promise<import('../src/index.js').BeadsClientResult<import('../src/index.js').BeadsTask>>}
 */
export async function createTask(title, options = {}) {
  const args = ['create', title];
  
  if (options.priority) {
    args.push('-p', options.priority.replace('P', ''));
  }
  if (options.type) {
    args.push('--type', options.type);
  }
  
  const result = await execBeads(args, { cwd: options.cwd });
  
  if (!result.ok) {
    return { 
      ok: false, 
      error: result.stderr || `bd create failed with code ${result.code}`,
      fallback: true 
    };
  }
  
  // Parse task ID from output (e.g., "Created task bd-a1b2")
  const idMatch = result.stdout.match(/(bd-[a-z0-9]+)/i);
  const taskId = idMatch ? idMatch[1] : '';
  
  return { 
    ok: true, 
    data: { 
      id: taskId, 
      title, 
      type: options.type || 'task',
      status: 'todo',
      priority: options.priority,
      stage: options.stage,
    } 
  };
}

/**
 * Update a task
 * @param {string} taskId 
 * @param {{ status?: string, assignee?: string, cwd?: string }} updates 
 * @returns {Promise<import('../src/index.js').BeadsClientResult<boolean>>}
 */
export async function updateTask(taskId, updates = {}) {
  const args = ['update', taskId];
  
  if (updates.status) {
    args.push('--status', updates.status);
  }
  if (updates.assignee) {
    args.push('--assignee', updates.assignee);
  }
  
  const result = await execBeads(args, { cwd: updates.cwd });
  
  if (!result.ok) {
    return { 
      ok: false, 
      error: result.stderr || `bd update failed with code ${result.code}`,
      fallback: true 
    };
  }
  
  return { ok: true, data: true };
}

/**
 * Show task details
 * @param {string} taskId 
 * @param {{ cwd?: string }} options 
 * @returns {Promise<import('../src/index.js').BeadsClientResult<import('../src/index.js').BeadsTask>>}
 */
export async function showTask(taskId, options = {}) {
  const result = await execBeads(['show', taskId, '--json'], options);
  
  if (!result.ok) {
    return { 
      ok: false, 
      error: result.stderr || `bd show failed with code ${result.code}`,
      fallback: true 
    };
  }
  
  try {
    const task = JSON.parse(result.stdout);
    return { ok: true, data: task };
  } catch (e) {
    return { ok: false, error: `Failed to parse task: ${e.message}`, fallback: true };
  }
}
```

**Step 3: Run lint check**

Run: `pnpm lint`
Expected: No errors (or fixable warnings)

**Step 4: Commit**

```bash
git add scripts/beads-client.mjs
git commit -m "feat: add beads CLI wrapper module"
```

---

## Task 3: Create JSON Fallback State Manager

**Files:**
- Create: `scripts/beads-fallback.mjs`
- Test: `tests/unit/beads-fallback.test.mjs`

**Step 1: Create in-memory/JSON fallback module**

```javascript
#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const FALLBACK_DIR = '.burlaki';
const FALLBACK_FILE = 'tasks.json';

/**
 * In-memory task store for fallback when beads unavailable
 */
class FallbackStateStore {
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
    this.tasks = new Map();
    this.filePath = join(cwd, FALLBACK_DIR, FALLBACK_FILE);
    this.loaded = false;
  }

  /**
   * Load tasks from JSON file if exists
   */
  load() {
    if (this.loaded) return;
    
    if (existsSync(this.filePath)) {
      try {
        const data = JSON.parse(readFileSync(this.filePath, 'utf8'));
        if (Array.isArray(data.tasks)) {
          for (const task of data.tasks) {
            this.tasks.set(task.id, task);
          }
        }
      } catch (e) {
        console.error(`Warning: Failed to load fallback state: ${e.message}`);
      }
    }
    this.loaded = true;
  }

  /**
   * Save tasks to JSON file
   */
  save() {
    const dir = join(this.cwd, FALLBACK_DIR);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    const data = {
      version: 1,
      fallback: true,
      updatedAt: new Date().toISOString(),
      tasks: [...this.tasks.values()],
    };
    
    writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  /**
   * List all tasks
   * @returns {import('../src/index.js').BeadsTask[]}
   */
  listTasks() {
    this.load();
    return [...this.tasks.values()];
  }

  /**
   * List ready tasks (not blocked)
   * @returns {import('../src/index.js').BeadsTask[]}
   */
  listReadyTasks() {
    this.load();
    return [...this.tasks.values()].filter(t => 
      t.status !== 'done' && 
      (!t.dependencies || t.dependencies.length === 0)
    );
  }

  /**
   * Create a new task
   * @param {string} title 
   * @param {object} options 
   * @returns {import('../src/index.js').BeadsTask}
   */
  createTask(title, options = {}) {
    this.load();
    
    const id = `fallback-${Date.now().toString(36)}`;
    const task = {
      id,
      title,
      type: options.type || 'task',
      status: 'todo',
      stage: options.stage,
      assignee: options.assignee,
      priority: options.priority,
      dependencies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.tasks.set(id, task);
    this.save();
    
    return task;
  }

  /**
   * Update a task
   * @param {string} taskId 
   * @param {object} updates 
   * @returns {boolean}
   */
  updateTask(taskId, updates) {
    this.load();
    
    const task = this.tasks.get(taskId);
    if (!task) return false;
    
    Object.assign(task, updates, { 
      updatedAt: new Date().toISOString() 
    });
    
    this.tasks.set(taskId, task);
    this.save();
    
    return true;
  }

  /**
   * Get a task by ID
   * @param {string} taskId 
   * @returns {import('../src/index.js').BeadsTask | null}
   */
  getTask(taskId) {
    this.load();
    return this.tasks.get(taskId) || null;
  }
}

export { FallbackStateStore };
```

**Step 2: Commit**

```bash
git add scripts/beads-fallback.mjs
git commit -m "feat: add JSON fallback state store"
```

---

## Task 4: Create Unified Beads Client with Graceful Degradation

**Files:**
- Create: `scripts/beads-unified.mjs`

**Step 1: Create unified client that tries beads first, falls back to JSON**

```javascript
#!/usr/bin/env node

import { isBeadsAvailable, isBeadsInitialized, listReadyTasks as beadsList, createTask as beadsCreate, updateTask as beadsUpdate, showTask as beadsShow } from './beads-client.mjs';
import { FallbackStateStore } from './beads-fallback.mjs';

/**
 * Unified beads client with graceful degradation
 */
export class BeadsUnifiedClient {
  constructor(config = {}) {
    this.cwd = config.cwd || process.cwd();
    this.fallbackStore = new FallbackStateStore(this.cwd);
    this._beadsAvailable = null;
    this._beadsInitialized = null;
  }

  /**
   * Check if beads is available and initialized
   * @returns {Promise<{ available: boolean, initialized: boolean }>}
   */
  async checkBeads() {
    if (this._beadsAvailable === null) {
      this._beadsAvailable = await isBeadsAvailable();
    }
    if (this._beadsInitialized === null) {
      this._beadsInitialized = isBeadsInitialized(this.cwd);
    }
    return { 
      available: this._beadsAvailable, 
      initialized: this._beadsInitialized 
    };
  }

  /**
   * Log warning when using fallback
   * @param {string} operation 
   * @param {string} reason 
   */
  _logFallback(operation, reason) {
    console.error(`Warning: Using fallback storage for ${operation}: ${reason}`);
  }

  /**
   * List ready tasks
   * @returns {Promise<import('../src/index.js').BeadsClientResult<import('../src/index.js').BeadsTask[]>>}
   */
  async listReadyTasks() {
    const { available, initialized } = await this.checkBeads();
    
    if (!available || !initialized) {
      this._logFallback('listReadyTasks', available ? 'beads not initialized' : 'beads CLI not found');
      return { ok: true, data: this.fallbackStore.listReadyTasks() };
    }
    
    const result = await beadsList({ cwd: this.cwd });
    
    if (!result.ok && result.fallback) {
      this._logFallback('listReadyTasks', result.error);
      return { ok: true, data: this.fallbackStore.listReadyTasks() };
    }
    
    return result;
  }

  /**
   * Create a task
   * @param {string} title 
   * @param {object} options 
   * @returns {Promise<import('../src/index.js').BeadsClientResult<import('../src/index.js').BeadsTask>>}
   */
  async createTask(title, options = {}) {
    const { available, initialized } = await this.checkBeads();
    
    if (!available || !initialized) {
      this._logFallback('createTask', available ? 'beads not initialized' : 'beads CLI not found');
      const task = this.fallbackStore.createTask(title, options);
      return { ok: true, data: task };
    }
    
    const result = await beadsCreate(title, { ...options, cwd: this.cwd });
    
    if (!result.ok && result.fallback) {
      this._logFallback('createTask', result.error);
      const task = this.fallbackStore.createTask(title, options);
      return { ok: true, data: task };
    }
    
    return result;
  }

  /**
   * Update a task
   * @param {string} taskId 
   * @param {object} updates 
   * @returns {Promise<import('../src/index.js').BeadsClientResult<boolean>>}
   */
  async updateTask(taskId, updates = {}) {
    const { available, initialized } = await this.checkBeads();
    
    if (!available || !initialized) {
      this._logFallback('updateTask', available ? 'beads not initialized' : 'beads CLI not found');
      const success = this.fallbackStore.updateTask(taskId, updates);
      return { ok: true, data: success };
    }
    
    const result = await beadsUpdate(taskId, { ...updates, cwd: this.cwd });
    
    if (!result.ok && result.fallback) {
      this._logFallback('updateTask', result.error);
      const success = this.fallbackStore.updateTask(taskId, updates);
      return { ok: true, data: success };
    }
    
    return result;
  }

  /**
   * Show task details
   * @param {string} taskId 
   * @returns {Promise<import('../src/index.js').BeadsClientResult<import('../src/index.js').BeadsTask>>}
   */
  async showTask(taskId) {
    const { available, initialized } = await this.checkBeads();
    
    if (!available || !initialized) {
      this._logFallback('showTask', available ? 'beads not initialized' : 'beads CLI not found');
      const task = this.fallbackStore.getTask(taskId);
      if (!task) {
        return { ok: false, error: `Task not found: ${taskId}`, fallback: false };
      }
      return { ok: true, data: task };
    }
    
    const result = await beadsShow(taskId, { cwd: this.cwd });
    
    if (!result.ok && result.fallback) {
      this._logFallback('showTask', result.error);
      const task = this.fallbackStore.getTask(taskId);
      if (!task) {
        return { ok: false, error: `Task not found: ${taskId}`, fallback: false };
      }
      return { ok: true, data: task };
    }
    
    return result;
  }
}

export function createBeadsClient(config = {}) {
  return new BeadsUnifiedClient(config);
}
```

**Step 2: Commit**

```bash
git add scripts/beads-unified.mjs
git commit -m "feat: add unified beads client with graceful degradation"
```

---

## Task 5: Add Unit Tests for Beads Modules

**Files:**
- Create: `tests/unit/beads-fallback.test.mjs`

**Step 1: Create test file for fallback store**

```javascript
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FallbackStateStore } from '../../scripts/beads-fallback.mjs';

describe('FallbackStateStore', () => {
  let testDir;
  let store;

  beforeEach(() => {
    testDir = join(tmpdir(), `beads-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    store = new FallbackStateStore(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('creates a task with generated ID', () => {
    const task = store.createTask('Test task');
    
    assert.ok(task.id.startsWith('fallback-'));
    assert.strictEqual(task.title, 'Test task');
    assert.strictEqual(task.status, 'todo');
    assert.strictEqual(task.type, 'task');
  });

  it('persists tasks to JSON file', () => {
    store.createTask('First task');
    store.createTask('Second task');
    
    // Create new store to verify persistence
    const store2 = new FallbackStateStore(testDir);
    const tasks = store2.listTasks();
    
    assert.strictEqual(tasks.length, 2);
  });

  it('updates task status', () => {
    const task = store.createTask('Test task');
    const updated = store.updateTask(task.id, { status: 'in_progress' });
    
    assert.strictEqual(updated, true);
    const fetched = store.getTask(task.id);
    assert.strictEqual(fetched.status, 'in_progress');
  });

  it('lists ready tasks excluding done', () => {
    store.createTask('Task 1');
    const task2 = store.createTask('Task 2');
    store.updateTask(task2.id, { status: 'done' });
    
    const ready = store.listReadyTasks();
    assert.strictEqual(ready.length, 1);
    assert.strictEqual(ready[0].title, 'Task 1');
  });
});
```

**Step 2: Run tests**

Run: `node --test tests/unit/beads-fallback.test.mjs`
Expected: All tests pass

**Step 3: Commit**

```bash
git add tests/unit/beads-fallback.test.mjs
git commit -m "test: add unit tests for fallback state store"
```

---

## Task 6: Update Exports in src/index.ts

**Files:**
- Modify: `src/index.ts`

**Step 1: Export beads modules**

No changes needed to src/index.ts - the beads modules are standalone ESM files.

However, update package.json exports if you want to expose beads functionality:

```json
// Add to "exports" in package.json:
"./beads": "./dist/scripts/beads-unified.mjs"
```

**Step 2: Build and verify**

Run: `pnpm build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add beads module export to package.json"
```

---

## Task 7: Update Documentation

**Files:**
- Modify: `README.md`
- Create: `docs/BEADS_INTEGRATION.md`

**Step 1: Add beads section to README.md**

Add after existing sections:

```markdown
## Beads Integration

Burlaki integrates with [Beads](https://github.com/steveyegge/beads) for persistent task tracking across agent sessions.

### Quick Setup

1. Install beads CLI: `curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash`
2. Initialize in your project: `bd init`
3. Burlaki will automatically use beads for task storage

### Graceful Degradation

If beads CLI is not available or `.beads/` is not initialized, Burlaki falls back to JSON storage in `.burlaki/tasks.json` with a warning log.

See [docs/BEADS_INTEGRATION.md](docs/BEADS_INTEGRATION.md) for detailed usage.
```

**Step 2: Create detailed integration doc**

```markdown
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
```

**Step 3: Commit**

```bash
git add README.md docs/BEADS_INTEGRATION.md
git commit -m "docs: add beads integration documentation"
```

---

## Task 8: Add Migration Script (Optional - Future Use)

**Files:**
- Create: `scripts/migrate-to-beads.mjs`

**Step 1: Create migration script**

```javascript
#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execBeads, isBeadsAvailable, isBeadsInitialized } from './beads-client.mjs';

const FALLBACK_FILE = join(process.cwd(), '.burlaki', 'tasks.json');

async function migrate() {
  // Check prerequisites
  const available = await isBeadsAvailable();
  if (!available) {
    console.error('Error: beads CLI not found. Install with: curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash');
    process.exit(1);
  }

  const initialized = isBeadsInitialized();
  if (!initialized) {
    console.error('Error: beads not initialized. Run: bd init');
    process.exit(1);
  }

  if (!existsSync(FALLBACK_FILE)) {
    console.log('No fallback tasks to migrate.');
    process.exit(0);
  }

  // Load fallback tasks
  const data = JSON.parse(readFileSync(FALLBACK_FILE, 'utf8'));
  const tasks = data.tasks || [];

  if (tasks.length === 0) {
    console.log('No tasks in fallback storage.');
    process.exit(0);
  }

  console.log(`Migrating ${tasks.length} tasks to beads...`);

  // Create each task in beads
  for (const task of tasks) {
    const args = ['create', task.title];
    if (task.priority) args.push('-p', task.priority.replace('P', ''));
    if (task.type) args.push('--type', task.type);
    
    const result = await execBeads(args);
    if (result.ok) {
      console.log(`  ✓ Migrated: ${task.title}`);
    } else {
      console.error(`  ✗ Failed: ${task.title} - ${result.stderr}`);
    }
  }

  console.log('\nMigration complete!');
  console.log('You can safely delete .burlaki/tasks.json after verifying the migration.');
}

migrate().catch(console.error);
```

**Step 2: Add to package.json scripts**

```json
"beads:migrate": "node scripts/migrate-to-beads.mjs"
```

**Step 3: Commit**

```bash
git add scripts/migrate-to-beads.mjs package.json
git commit -m "feat: add migration script from fallback to beads"
```

---

## Summary

After completing all tasks:

1. **Type definitions** added to `src/index.ts`
2. **Beads CLI wrapper** in `scripts/beads-client.mjs`
3. **JSON fallback store** in `scripts/beads-fallback.mjs`
4. **Unified client** with graceful degradation in `scripts/beads-unified.mjs`
5. **Unit tests** for fallback store
6. **Documentation** in README and `docs/BEADS_INTEGRATION.md`
7. **Migration script** for future use

**Verification:**
```bash
pnpm build   # Build succeeds
pnpm test    # Tests pass
pnpm lint    # No lint errors
```

→ Use `superpowers:executing-plans` to implement task-by-task.
