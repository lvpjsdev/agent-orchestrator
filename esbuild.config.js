import { build } from "esbuild";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const distDir = resolve("dist");

async function main() {
  await build({
    entryPoints: {
      index: "src/index.ts"
    },
    outdir: distDir,
    bundle: true,
    format: "esm",
    platform: "node",
    target: ["node18"],
    sourcemap: true
  });

  const assets = [
    {
      from: "agent-skills-matrix.json",
      to: "agent-skills-matrix.json"
    },
    {
      from: "scripts/skills-gate.mjs",
      to: "scripts/skills-gate.mjs"
    },
    {
      from: "scripts/install-codex-prompts.mjs",
      to: "scripts/install-codex-prompts.mjs"
    }
  ];

  for (const asset of assets) {
    const target = resolve(distDir, asset.to);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(resolve(asset.from), target);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
