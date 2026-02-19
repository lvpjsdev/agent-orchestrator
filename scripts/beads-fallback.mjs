#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const FALLBACK_DIR = '.burlaki';
const FALLBACK_FILE = 'tasks.json';

/**
 * In-memory task store for fallback when beads unavailable
 */
class FallbackStateStore {
  #idCounter = 0;

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
    
    this.#idCounter += 1;
    const id = `fallback-${Date.now().toString(36)}-${this.#idCounter.toString(36)}`;
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
