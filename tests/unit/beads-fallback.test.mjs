import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { existsSync, rmSync, mkdirSync } from 'node:fs';
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
