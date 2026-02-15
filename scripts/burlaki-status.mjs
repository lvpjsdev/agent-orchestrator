#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const PRD_PATH = '.agents/tasks/prd.json';
const STORY_ID_RE = /Story:\s*([a-zA-Z0-9-]+)/;
const HELP_TEXT = `Burlaki Status - Show current workflow state

Usage: burlaki-status [options]

Options:
  --json    Output as JSON for programmatic use
  --help    Show this help message
  -h        Show this help message (short alias)

Output:
  - Current workflow stage
  - Story counts (pending, completed, total)
  - Last checkpoint (SHA, timestamp, story ID)
  - Blocked stories list (if any)

Exit codes:
  0  Success
  1  PRD not found or error
`;

function parseArgs(argv) {
  const out = { json: false, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') {
      out.json = true;
    } else if (arg === '--help' || arg === '-h') {
      out.help = true;
    }
  }
  return out;
}

function readPrd(path) {
  if (!existsSync(path)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.error(`Error parsing PRD: ${error.message}`);
    return null;
  }
}

function getLastCheckpoint() {
  try {
    const output = execSync(
      'git log --grep="\\[burlaki-checkpoint\\]" -n 1 --format="%H%x00%ci%x00%s"',
      {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    ).trim();

    if (!output) {
      return null;
    }

    const parts = output.split('\0');
    const sha = parts[0];
    const timestamp = parts[1];
    const subject = parts.slice(2).join('\0');
    const storyMatch = subject.match(STORY_ID_RE);

    return {
      sha: sha.substring(0, 7),
      fullSha: sha,
      timestamp: timestamp,
      storyId: storyMatch ? storyMatch[1] : null,
    };
  } catch (error) {
    // Git exits with 128 when no matching commits found (expected when no checkpoints exist)
    if (error.status !== 128) {
      console.error(`Warning: git log failed: ${error.message}`);
    }
    return null;
  }
}

function getBlockedStories(stories) {
  return stories
    .filter((s) => s.status === 'blocked')
    .map((s) => ({
      id: s.id,
      reason: s.blocked_reason ?? s.blockedReason ?? 'No reason specified',
    }));
}

function formatHuman(result) {
  const lines = [];

  lines.push('Burlaki Workflow Status');
  lines.push('');

  lines.push(`  Stage:       ${result.currentStage}`);
  lines.push('');
  lines.push('  Stories:');
  lines.push(`    Pending:   ${result.pendingStories}`);
  lines.push(`    Completed: ${result.completedStories}`);
  lines.push(`    Total:     ${result.totalStories}`);
  lines.push('');

  if (result.lastCheckpoint) {
    lines.push('  Last Checkpoint:');
    lines.push(`    SHA:       ${result.lastCheckpoint.sha}`);
    lines.push(`    Time:      ${result.lastCheckpoint.timestamp}`);
    if (result.lastCheckpoint.storyId) {
      lines.push(`    Story:     ${result.lastCheckpoint.storyId}`);
    }
  } else {
    lines.push('  Last Checkpoint: None');
  }
  lines.push('');

  if (result.blockedStories.length > 0) {
    lines.push('  Blocked Stories:');
    for (const story of result.blockedStories) {
      lines.push(`    - ${story.id}: ${story.reason}`);
    }
  }

  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    process.stdout.write(HELP_TEXT);
    process.exit(0);
  }

  const prd = readPrd(PRD_PATH);

  if (!prd) {
    const errorMsg = `No PRD found at ${PRD_PATH}. Run /burlaki-start first.`;
    if (args.json) {
      process.stdout.write(JSON.stringify({ status: 'error', error: errorMsg, code: 1 }) + '\n');
    } else {
      console.error(errorMsg);
    }
    process.exit(1);
  }

  const stories = prd.stories ?? [];
  const pending = stories.filter((s) => s.status === 'pending').length;
  const completed = stories.filter((s) => s.status === 'done').length;
  const total = stories.length;
  const blocked = getBlockedStories(stories);

  const result = {
    status: 'success',
    currentStage: prd.currentStage ?? prd.stage ?? 'unknown',
    pendingStories: pending,
    completedStories: completed,
    totalStories: total,
    lastCheckpoint: getLastCheckpoint(),
    blockedStories: blocked,
  };

  if (args.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else {
    process.stdout.write(formatHuman(result) + '\n');
  }

  process.exit(0);
}

main();
