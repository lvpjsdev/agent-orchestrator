import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DIST_DIR = resolve('dist');

const ASSETS = [
  {
    from: 'agent-skills-matrix.json',
    to: 'agent-skills-matrix.json',
  },
  {
    from: 'scripts/skills-gate.mjs',
    to: 'scripts/skills-gate.mjs',
  },
  {
    from: 'scripts/install-prompts.mjs',
    to: 'scripts/install-prompts.mjs',
  },
];

async function main() {
  await build({
    entryPoints: {
      index: 'src/index.ts',
    },
    outdir: DIST_DIR,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: ['node18'],
    sourcemap: true,
  });

  for (const asset of ASSETS) {
    const target = resolve(DIST_DIR, asset.to);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(resolve(asset.from), target);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
