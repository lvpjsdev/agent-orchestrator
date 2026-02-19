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
