import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  evaluateSkillsGate,
  readMatrixFile,
} from '../../scripts/skills-gate.mjs';
import { FIXTURES_DIR } from '../setup.mjs';

const matrix = JSON.parse(
  readFileSync(join(FIXTURES_DIR, 'sample-prd.json'), 'utf8'),
);

test('throws when matrix file is missing', () => {
  const missingPath = join(FIXTURES_DIR, 'does-not-exist.json');
  assert.throws(
    () => readMatrixFile(missingPath),
    (error) => error.code === 'MATRIX_NOT_FOUND' && error.message.includes('Matrix not found'),
  );
});

test('flags missing required skills for stage', () => {
  const args = {
    stage: 'coder',
    agent: 'claude',
    policies: 'policy-a',
    log: '',
  };
  const { result, exitCode } = evaluateSkillsGate({
    matrix,
    stageName: 'coder',
    args,
    installedSkills: [],
  });

  assert.strictEqual(exitCode, 1);
  assert.strictEqual(result.status, 'blocked');
  assert.deepStrictEqual(result.skillsMissing, ['skill-a']);
  assert.ok(result.reasons.some((line) => line.includes('missing required skills')));
  assert.deepStrictEqual(result.providedPolicies, ['policy-a']);
});

test('produces stable JSON output structure', () => {
  const args = {
    stage: 'coder',
    agent: 'claude',
    policies: 'policy-a',
    log: '',
  };
  const { result } = evaluateSkillsGate({
    matrix,
    stageName: 'coder',
    args,
    installedSkills: ['skill-a'],
  });

  const output = JSON.stringify(result, null, 2);
  assert.ok(output.startsWith('{'));
  assert.match(output, /"skillGateStatus": "pass"/);
  assert.match(output, /"stage": "coder"/);
});
