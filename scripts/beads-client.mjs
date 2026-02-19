import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const BEADS_TIMEOUT_MS = 30000;
const BEADS_TASK_ID_RE = /(bd-[a-z0-9]+)/i;

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

/**
 * List ready tasks (no open blockers)
 * @param {{ cwd?: string }} options 
 * @returns {Promise<import('../src/index.ts').BeadsClientResult<import('../src/index.ts').BeadsTask[]>>}
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
 * @returns {Promise<import('../src/index.ts').BeadsClientResult<import('../src/index.ts').BeadsTask>>}
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
  const idMatch = result.stdout.match(BEADS_TASK_ID_RE);
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
 * @returns {Promise<import('../src/index.ts').BeadsClientResult<boolean>>}
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
 * @returns {Promise<import('../src/index.ts').BeadsClientResult<import('../src/index.ts').BeadsTask>>}
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
