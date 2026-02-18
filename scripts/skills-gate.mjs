#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_NAME_RE = /^name:\s*([^\n]+)$/m;
const QUOTES_TRIM_RE = /^["']|["']$/g;

function parseArgs(argv) {
  const out = {
    matrix: '',
    stage: '',
    agent: '',
    log: '',
    policies: '',
    swarmAgent: '',
    swarmSkill: '',
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--matrix') {
      out.matrix = argv[i + 1] ?? '';
      i += 1;
    } else if (arg === '--stage') {
      out.stage = argv[i + 1] ?? '';
      i += 1;
    } else if (arg === '--agent') {
      out.agent = argv[i + 1] ?? '';
      i += 1;
    } else if (arg === '--log') {
      out.log = argv[i + 1] ?? '';
      i += 1;
    } else if (arg === '--policies') {
      out.policies = argv[i + 1] ?? '';
      i += 1;
    } else if (arg === '--swarm-agent') {
      out.swarmAgent = argv[i + 1] ?? '';
      i += 1;
    } else if (arg === '--swarm-skill') {
      out.swarmSkill = argv[i + 1] ?? '';
      i += 1;
    }
  }
  return out;
}

function getSkillDirs() {
  const codeXHome = process.env.CODEX_HOME ?? join(homedir(), '.codex');
  const cwd = process.cwd();
  return [
    ...new Set([
      join(codeXHome, 'skills'),
      join(homedir(), '.codex', 'skills'),
      join(cwd, '.codex', 'skills'),
      join(cwd, '.agents', 'skills'),
      join(cwd, '.ruler', 'skills'),
    ]),
  ];
}

function getSkillNameFromDir(pathname) {
  const skillFile = join(pathname, 'SKILL.md');
  if (!existsSync(skillFile)) {
    return basename(pathname);
  }
  const raw = readFileSync(skillFile, 'utf8');
  const match = raw.match(SKILL_NAME_RE);
  if (match?.[1]) {
    return match[1].trim().replace(QUOTES_TRIM_RE, '');
  }
  return basename(pathname);
}

function collectInstalledSkills() {
  const skills = new Set();
  for (const dir of getSkillDirs()) {
    if (!existsSync(dir)) {
      continue;
    }
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      let isDir = false;
      try {
        isDir = statSync(full).isDirectory();
      } catch {
        isDir = false;
      }
      if (!isDir) {
        continue;
      }
      const skill = getSkillNameFromDir(full);
      if (skill) {
        skills.add(skill);
      }
    }
  }
  return [...skills].sort();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detectSkillsUsed(logText, knownSkills) {
  const used = new Set();
  for (const skill of knownSkills) {
    const pattern = new RegExp(`(?:\\$|\\\`)?${escapeRegExp(skill)}\\b`, 'g');
    if (pattern.test(logText)) {
      used.add(skill);
    }
  }
  return [...used].sort();
}

function failWithUsage() {
  console.error(
    'Usage: skills-gate --matrix <path> --stage <stage> [--agent <name>] [--log <path>] [--policies <csv>] [--swarm-agent <name>] [--swarm-skill <name>]',
  );
  process.exit(2);
}

export function readMatrixFile(matrixPath) {
  if (!existsSync(matrixPath)) {
    const error = new Error(`Matrix not found: ${matrixPath}`);
    error.code = 'MATRIX_NOT_FOUND';
    throw error;
  }
  try {
    return JSON.parse(readFileSync(matrixPath, 'utf8'));
  } catch (error) {
    const parseError = new Error(`Failed to parse matrix file: ${matrixPath}`);
    parseError.code = 'MATRIX_PARSE_ERROR';
    parseError.cause = error;
    throw parseError;
  }
}

function loadMatrix(matrixPath) {
  try {
    return readMatrixFile(matrixPath);
  } catch (error) {
    console.error(error.message);
    if (error.code === 'MATRIX_NOT_FOUND') {
      process.exit(2);
    }
    process.exit(1);
  }
}

function getStageSkills(stage) {
  return {
    requiredSkills: Array.isArray(stage.requiredSkills) ? stage.requiredSkills : [],
    optionalSkills: Array.isArray(stage.optionalSkills) ? stage.optionalSkills : [],
    forbiddenSkills: Array.isArray(stage.forbiddenSkills) ? stage.forbiddenSkills : [],
    requiredPolicies: Array.isArray(stage.requiredPolicies) ? stage.requiredPolicies : [],
  };
}

function parseCsv(value) {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function checkSwarmConstraints(stage, args) {
  const violations = [];
  const constraints = stage?.agentConstraints || {};

  if (args.swarmSkill && args.agent) {
    const forbiddenSkills = constraints.forbiddenSwarmSkills?.[args.agent] || [];
    if (forbiddenSkills.includes(args.swarmSkill)) {
      violations.push(
        `agent '${args.agent}' cannot use swarm skill '${args.swarmSkill}' on stage '${args.stage}'`,
      );
    }
  }

  if (args.swarmAgent && args.agent) {
    const forbiddenAgents = constraints.forbiddenSwarmAgents?.[args.agent] || [];
    if (forbiddenAgents.includes(args.swarmAgent)) {
      violations.push(
        `agent '${args.agent}' cannot spawn swarm agent '${args.swarmAgent}' on stage '${args.stage}'`,
      );
    }
  }

  return violations;
}

function collectReasons(requiredSkills, requiredPolicies, installedSkills, stage, args) {
  const reasons = [];
  const skillsMissing = requiredSkills.filter((name) => !installedSkills.includes(name));
  if (skillsMissing.length > 0) {
    reasons.push(`missing required skills: ${skillsMissing.join(', ')}`);
  }

  const allowedAgents = Array.isArray(stage?.agentConstraints?.allowedAgents)
    ? stage.agentConstraints.allowedAgents
    : [];
  if (allowedAgents.length > 0) {
    if (!args.agent) {
      reasons.push(
        `agent is required for stage '${args.stage}' (allowed: ${allowedAgents.join(', ')})`,
      );
    } else if (!allowedAgents.includes(args.agent)) {
      reasons.push(`agent '${args.agent}' is not allowed for stage '${args.stage}'`);
    }
  }

  const providedPolicies = parseCsv(args.policies);
  const policiesMissing = requiredPolicies.filter((name) => !providedPolicies.includes(name));
  if (policiesMissing.length > 0) {
    reasons.push(`missing required policies: ${policiesMissing.join(', ')}`);
  }
  return { reasons, skillsMissing, providedPolicies, policiesMissing };
}

export function evaluateSkillsGate({
  matrix,
  stageName,
  args,
  installedSkills = [],
  logExists = false,
  logText = '',
}) {
  const stage = matrix?.stages?.[stageName];
  if (!stage) {
    const error = new Error(`Stage not found in matrix: ${stageName}`);
    error.code = 'STAGE_NOT_FOUND';
    throw error;
  }

  const { requiredSkills, optionalSkills, forbiddenSkills, requiredPolicies } =
    getStageSkills(stage);
  const { reasons, skillsMissing, providedPolicies, policiesMissing } = collectReasons(
    requiredSkills,
    requiredPolicies,
    installedSkills,
    stage,
    { ...args, stage: stageName },
  );

  const swarmViolations = checkSwarmConstraints(stage, args);
  reasons.push(...swarmViolations);

  const warnings = [];
  const allKnownSkills = [
    ...new Set([...installedSkills, ...requiredSkills, ...optionalSkills, ...forbiddenSkills]),
  ];
  let skillsUsed = [];
  let forbiddenSkillsUsed = [];

  if (!args.log) {
    if (forbiddenSkills.length > 0) {
      warnings.push('forbidden skills usage check skipped: pass --log <path> to enable detection');
    }
  } else if (logExists) {
    skillsUsed = detectSkillsUsed(logText, allKnownSkills);
    forbiddenSkillsUsed = skillsUsed.filter((name) => forbiddenSkills.includes(name));
    if (forbiddenSkillsUsed.length > 0) {
      reasons.push(`forbidden skills used: ${forbiddenSkillsUsed.join(', ')}`);
    }
  } else {
    warnings.push(`log file not found: ${args.log}; forbidden skills usage check skipped`);
  }

  const status = reasons.length === 0 ? 'pass' : 'blocked';
  const result = {
    matrixVersion: matrix?.version ?? 1,
    stage: stageName,
    label: stage.label ?? stageName,
    agent: args.agent || '',
    status,
    skillGateStatus: status,
    requiredSkills,
    optionalSkills,
    forbiddenSkills,
    requiredPolicies,
    providedPolicies,
    policiesMissing,
    skillsMissing,
    skillsUsed,
    forbiddenSkillsUsed,
    installedSkills,
    swarmAgent: args.swarmAgent || '',
    swarmSkill: args.swarmSkill || '',
    swarmViolations,
    agentConstraints: stage?.agentConstraints || {},
    reasons,
    warnings,
  };

  return { result, exitCode: status === 'pass' ? 0 : 1 };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!(args.matrix && args.stage)) {
    failWithUsage();
  }

  const matrixPath = resolve(args.matrix);
  const matrix = loadMatrix(matrixPath);
  const installedSkills = collectInstalledSkills();
  const logExists = Boolean(args.log && existsSync(args.log));
  const logText = logExists ? readFileSync(args.log, 'utf8') : '';

  let evaluation;
  try {
    evaluation = evaluateSkillsGate({
      matrix,
      stageName: args.stage,
      args,
      installedSkills,
      logExists,
      logText,
    });
  } catch (error) {
    console.error(error.message);
    if (error.code === 'STAGE_NOT_FOUND') {
      process.exit(2);
    }
    process.exit(1);
  }
  const { result, exitCode } = evaluation;

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`, () => {
    process.exit(exitCode);
  });
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] === scriptPath) {
  main();
}

export {
  parseArgs,
  getSkillDirs,
  getSkillNameFromDir,
  collectInstalledSkills,
  detectSkillsUsed,
  checkSwarmConstraints,
  collectReasons,
  getStageSkills,
  loadMatrix,
};
