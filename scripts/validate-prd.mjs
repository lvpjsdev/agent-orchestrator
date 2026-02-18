#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const DEFAULT_PATH = '.agents/tasks/prd.json';
const VALID_STATUS_VALUES = new Set(['pending', 'in-progress', 'done', 'blocked']);

function printHelp() {
  process.stdout.write('Usage: node scripts/validate-prd.mjs [options]\n');
  process.stdout.write('\n');
  process.stdout.write('Options:\n');
  process.stdout.write('  --path <path>    Path to PRD JSON (default: .agents/tasks/prd.json)\n');
  process.stdout.write('  --json           Output JSON payload with status & reasons\n');
  process.stdout.write('  --help, -h       Show this help\n');
}

function parseArgs(argv) {
  const parsed = { path: DEFAULT_PATH, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--path') {
      i += 1;
      if (i >= argv.length) {
        console.error('Missing path after --path');
        printHelp();
        process.exit(2);
      }
      parsed.path = argv[i];
    } else if (arg === '--json') {
      parsed.json = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Unknown option: ${arg}`);
      printHelp();
      process.exit(2);
    }
  }
  return parsed;
}

function validatePrd(data) {
  const reasons = [];
  if (typeof data !== 'object' || data === null) {
    reasons.push('PRD JSON must be an object at the top level');
    return reasons;
  }

  if (!('version' in data)) {
    reasons.push('Missing required field: version');
  } else if (typeof data.version !== 'string') {
    reasons.push('Field version must be a string');
  }

  if (!('stories' in data)) {
    reasons.push('Missing required field: stories');
  } else if (!Array.isArray(data.stories)) {
    reasons.push('Field stories must be an array');
  }

  if (!Array.isArray(data.stories)) {
    return reasons;
  }

  const storyIds = new Set();
  const dependencies = new Map();

  for (let index = 0; index < data.stories.length; index += 1) {
    const story = data.stories[index];
    if (typeof story !== 'object' || story === null) {
      reasons.push(`Story at index ${index} must be an object`);
      continue;
    }

    const id = story.id;
    if (typeof id !== 'string' || id.trim() === '') {
      reasons.push(`Story at index ${index} is missing a valid id`);
    } else if (storyIds.has(id)) {
      reasons.push(`Duplicate story id found: ${id}`);
    } else {
      storyIds.add(id);
    }

    if (typeof story.title !== 'string' || story.title.trim() === '') {
      reasons.push(`Story ${id || `at index ${index}`} is missing a valid title`);
    }

    if (typeof story.status !== 'string' || story.status.trim() === '') {
      reasons.push(`Story ${id || `at index ${index}`} is missing a valid status`);
    } else if (!VALID_STATUS_VALUES.has(story.status)) {
      reasons.push(`Story ${id || `at index ${index}`} has invalid status: ${story.status}`);
    }

    const dependsOn = story.depends_on;
    if (dependsOn === undefined) {
      dependencies.set(id, []);
    } else if (!Array.isArray(dependsOn)) {
      reasons.push(`Story ${id || `at index ${index}`} depends_on must be an array`);
      dependencies.set(id, []);
    } else {
      const cleaned = [];
      for (let depIndex = 0; depIndex < dependsOn.length; depIndex += 1) {
        const dependency = dependsOn[depIndex];
        if (typeof dependency !== 'string' || dependency.trim() === '') {
          reasons.push(
            `Story ${id || `at index ${index}`} has invalid depends_on entry at index ${depIndex}`,
          );
          continue;
        }
        cleaned.push(dependency);
      }
      dependencies.set(id, cleaned);
    }
  }

  for (const [storyId, deps] of dependencies.entries()) {
    for (const dep of deps) {
      if (!storyIds.has(dep)) {
        reasons.push(`Story ${storyId} depends on unknown story ${dep}`);
      }
    }
  }

  const cycleReason = detectCycle(dependencies);
  if (cycleReason) {
    reasons.push(cycleReason);
  }

  return reasons;
}

function detectCycle(dependencies) {
  const visiting = new Set();
  const visited = new Set();
  const stack = [];

  function visit(node) {
    if (visited.has(node)) {
      return null;
    }
    if (visiting.has(node)) {
      const cycleStart = stack.indexOf(node);
      const cyclePath = stack.slice(cycleStart).concat(node);
      return `Circular dependency detected: ${cyclePath.join(' -> ')}`;
    }

    visiting.add(node);
    stack.push(node);
    const next = dependencies.get(node) || [];
    for (const dep of next) {
      const found = visit(dep);
      if (found) {
        return found;
      }
    }
    visiting.delete(node);
    visited.add(node);
    stack.pop();
    return null;
  }

  for (const node of dependencies.keys()) {
    const cycle = visit(node);
    if (cycle) {
      return cycle;
    }
  }
  return null;
}

function reportResult(path, valid, reasons, options) {
  if (options.json) {
    const payload = { status: valid ? 'success' : 'error', path, reasons };
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  if (valid) {
    process.stdout.write(`PRD validation succeeded: ${path}\n`);
    return;
  }

  console.error(`PRD validation failed: ${path}`);
  for (const reason of reasons) {
    console.error(`- ${reason}`);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!existsSync(options.path)) {
    console.error(`PRD file not found: ${options.path}`);
    process.exit(2);
  }

  let contents;
  try {
    contents = readFileSync(options.path, 'utf8');
  } catch (error) {
    console.error(`Failed to read PRD file: ${error.message}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(contents);
  } catch (error) {
    console.error(`Failed to parse JSON: ${error.message}`);
    process.exit(1);
  }

  const reasons = validatePrd(data);
  const valid = reasons.length === 0;
  reportResult(options.path, valid, reasons, options);
  process.exit(valid ? 0 : 1);
}

main();
