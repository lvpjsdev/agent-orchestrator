#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function parseArgs(argv) {
  const out = {
    force: false,
    target: "",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--force") {
      out.force = true;
    } else if (arg === "--target") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --target");
      }
      out.target = value;
      i += 1;
    }
  }
  return out;
}

function getDefaultTargetDir() {
  const codeXHome = process.env.CODEX_HOME?.trim() || join(homedir(), ".codex");
  return join(codeXHome, "prompts");
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const sourceDir = resolve(__dirname, "../prompts/codex");
  const targetDir = resolve(args.target || getDefaultTargetDir());

  if (!existsSync(sourceDir)) {
    console.error(`Source prompts directory not found: ${sourceDir}`);
    process.exit(2);
  }

  mkdirSync(targetDir, { recursive: true });

  const files = readdirSync(sourceDir).filter((name) => name.endsWith(".md"));
  if (files.length === 0) {
    console.error(`No .md prompts found in: ${sourceDir}`);
    process.exit(2);
  }

  const installed = [];
  const skipped = [];
  const failed = [];

  for (const name of files) {
    const from = join(sourceDir, name);
    const to = join(targetDir, name);
    if (existsSync(to) && !args.force) {
      skipped.push(name);
      continue;
    }
    try {
      copyFileSync(from, to);
      installed.push(name);
    } catch (error) {
      failed.push({
        name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        sourceDir,
        targetDir,
        installed,
        skipped,
        failed,
        note:
          skipped.length > 0
            ? "Some prompts already existed; re-run with --force to overwrite."
            : "",
      },
      null,
      2
    )}\n`
  );

  if (failed.length > 0) {
    process.exit(1);
  }
}

main();
