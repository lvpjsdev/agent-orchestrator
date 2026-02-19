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
