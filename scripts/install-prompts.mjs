#!/usr/bin/env node

import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

function parseArgs(argv) {
  const out = {
    force: false,
    global: false,
    tool: "",
    target: "",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--force") {
      out.force = true;
    } else if (arg === "--global" || arg === "-g") {
      out.global = true;
    } else if (arg === "--target") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --target");
      }
      out.target = value;
      i += 1;
    } else if (arg === "--tool") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --tool");
      }
      out.tool = value;
      i += 1;
    }
  }
  return out;
}

function getLocalTargetDir(tool) {
  switch (tool) {
    case "codex":
      return ".codex/prompts";
    case "opencode":
      return ".opencode/skills";
    case "claude":
      return ".claude/skills";
    default:
      throw new Error(`Unknown tool: ${tool}. Supported: codex, opencode, claude`);
  }
}

function getGlobalTargetDir(tool) {
  switch (tool) {
    case "codex": {
      const codeXHome = process.env.CODEX_HOME?.trim() || join(homedir(), ".codex");
      return join(codeXHome, "prompts");
    }
    case "opencode":
      return join(homedir(), ".config", "opencode", "skills");
    case "claude":
      return join(homedir(), ".claude", "skills");
    default:
      throw new Error(`Unknown tool: ${tool}. Supported: codex, opencode, claude`);
  }
}

function installCodexPrompts(sourceDir, targetDir, force) {
  mkdirSync(targetDir, { recursive: true });

  const files = readdirSync(sourceDir).filter((name) => name.endsWith(".md"));
  if (files.length === 0) {
    return { installed: [], skipped: [], failed: [{ name: "none", error: "No .md prompts found" }] };
  }

  const installed = [];
  const skipped = [];
  const failed = [];

  for (const name of files) {
    const from = join(sourceDir, name);
    const to = join(targetDir, name);
    if (existsSync(to) && !force) {
      skipped.push(name);
      continue;
    }
    try {
      cpSync(from, to, { force: true });
      installed.push(name);
    } catch (error) {
      failed.push({
        name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { installed, skipped, failed };
}

function installSkills(sourceDir, targetDir, force, useSymlinks) {
  mkdirSync(targetDir, { recursive: true });

  const skillDirs = readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (skillDirs.length === 0) {
    return { installed: [], skipped: [], failed: [{ name: "none", error: "No skill directories found" }] };
  }

  const installed = [];
  const skipped = [];
  const failed = [];

  for (const skillName of skillDirs) {
    const skillSourceDir = join(sourceDir, skillName);
    const skillTargetDir = join(targetDir, skillName);

    const skillFile = join(skillSourceDir, "SKILL.md");
    if (!existsSync(skillFile)) {
      failed.push({ name: skillName, error: "No SKILL.md found" });
      continue;
    }

    const exists = existsSync(skillTargetDir);
    const isSymlink = exists && lstatSync(skillTargetDir).isSymbolicLink();

    if (exists && !force && !isSymlink) {
      skipped.push(skillName);
      continue;
    }

    try {
      if (exists) {
        rmSync(skillTargetDir, { recursive: true, force: true });
      }

      if (useSymlinks) {
        if (process.platform === 'win32') {
          symlinkSync(skillSourceDir, skillTargetDir, 'junction');
        } else {
          const relativePath = relative(targetDir, skillSourceDir);
          symlinkSync(relativePath, skillTargetDir, 'dir');
        }
      } else {
        cpSync(skillSourceDir, skillTargetDir, { recursive: true });
      }
      installed.push(skillName);
    } catch (error) {
      failed.push({
        name: skillName,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { installed, skipped, failed };
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }

  if (!args.tool) {
    console.error("Error: --tool is required. Use: codex, opencode, or claude");
    process.exit(2);
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const sourceDir = resolve(__dirname, `../prompts/${args.tool}`);
  const defaultTargetDir = args.global
    ? getGlobalTargetDir(args.tool)
    : getLocalTargetDir(args.tool);
  const targetDir = resolve(args.target || defaultTargetDir);

  if (!existsSync(sourceDir)) {
    console.error(`Source prompts directory not found: ${sourceDir}`);
    process.exit(2);
  }

  let result;
  if (args.tool === "codex") {
    result = installCodexPrompts(sourceDir, targetDir, args.force);
  } else {
    result = installSkills(sourceDir, targetDir, args.force, !args.global);
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        tool: args.tool,
        scope: args.global ? "global" : "local",
        sourceDir,
        targetDir,
        installed: result.installed,
        skipped: result.skipped,
        failed: result.failed,
        note:
          result.skipped.length > 0
            ? "Some items already existed; re-run with --force to overwrite."
            : "",
      },
      null,
      2
    )}\n`
  );

  if (result.failed.length > 0) {
    process.exit(1);
  }
}

main();
