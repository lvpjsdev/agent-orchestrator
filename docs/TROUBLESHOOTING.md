# Burlaki Troubleshooting Guide

This guide mirrors the structure and tone of `AGENTS.md`, focusing on actionable steps for debugging Burlaki orchestration workflows. Keep it nearby when executing `/burlaki-*` commands or debugging skill gating.

## Common issues and solutions

### Skills gate failures
- **Symptom:** `pnpm skills:gate` exits with a non-zero status or prints missing skill rows.
- **Fix:** Verify `agent-skills-matrix.json` includes the required skill for the stage you run; ensure your branch has the matching `agentConstraints` (e.g., stage `coder` needs `coding-agent`). Re-run with `pnpm skills:gate -- --matrix ./agent-skills-matrix.json --stage coder`. If the script still fails, inspect the CLI output for `missingSkill` entries and align skill definitions in `.agents/skills/`.

```bash
pnpm skills:gate -- --matrix ./agent-skills-matrix.json --stage coder --agent claude
```

### PRD validation errors
- **Symptom:** `/burlaki-start` or `/burlaki-run` reports `prd.json` syntax or requirement violations.
- **Fix:** Open `.agents/tasks/prd.json`, validate JSON with `node -e "JSON.parse(require('fs').readFileSync('./.agents/tasks/prd.json','utf8'))"`, then check that every required field (like `mission`, `constraints`, `deliverables`) is populated. Missing skills or stage mismatches can also manifest here; compare against the spec documented in the repo.

### Workflow phase failures
- **Symptom:** One of `/burlaki-start`, `/burlaki-run`, `/burlaki-continue` stops mid-phase with `phase failure` or `skill unmet`.
- **Fix:** Inspect the terminal output for the `phase` identifier. Replay that phase in isolation using the same command with `--phase <name>` if the prompt supports it or rerun the workflow after resolving errors in the preceding step. Check `logs/` (if configured) or capture stdout/stderr when rerunning to trace the failing module.

### Git/commit issues
- **Symptom:** `git status` shows conflicts, or `git commit` hooks fail.
- **Fix:** Merge/rebase conflicts with the standard Git flow (`git fetch`, `git merge`, resolve, `git add`). If hooks reject commits, inspect `.git/hooks`. For pre-commit checks like linters, run them manually (`pnpm lint`). Use `git commit --no-verify` only when absolutely sure hooks are noisy and documented.

## File permission problems
- **Symptom:** `EACCES` errors when reading/writing skill definitions, prompts, or logs.
- **Fix:** Run `ls -l` on the affected files to verify ownership, then set correct permissions (typically `rw-r--r--` for tracked files, `chmod 644 <file>`). For directories requiring execution, use `chmod 755`. If a command writes to a location like `~/.codex`, ensure both the folder and parent allow your user and adjust ownership with `chown $USER ~/.codex` if needed.

## Environment variable issues
- **Symptom:** Commands fail because expected env vars (e.g., `CODON_AGENT`, `CLAIUDE_API_KEY`) are missing or outdated.
- **Fix:** Document necessary variables in your shell profile (`~/.zshrc`/`~/.bashrc`). Export them manually before running workflows, e.g., `export CLAUDE_API_KEY=xxx`. Use `env | grep -i claude` to confirm. If a workflow sources `.env`, ensure it is present and readable.

## Integration issues with other tools

### Codex
- Check that prompts in `prompts/codex/` match the required YAML frontmatter. Run `pnpm prompts:install` to sync local prompts with `~/.codex/prompts`. If prompts still fail, compare against the repo fallback and ensure `--force` is used only when renewing outdated versions.

### Claude
- Ensure you are on the right stage with `agentConstraints` (e.g., Claude as the stage agent for `coder`). Validate the Claude API key: `node -e "console.log(process.env.CLAUDE_API_KEY ? 'set' : 'missing')"`.

### OpenCode
- OpenCode relies on local CLI helpers. Confirm `node scripts/skills-gate.mjs` and associated scripts are executable (`chmod +x node scripts/skills-gate.mjs`), and run them directly (`node scripts/skills-gate.mjs ...`) to isolate issues from wrappers.

## Performance issues
- **Symptom:** Workflows stall, take excessively long, or emit `timeout` warnings.
- **Fix:** Identify the slow stage (look at command runtime). Some checks, like `pnpm skills:gate`, nail hundreds of files—run them selectively against the problematic stage. Increase Node's heap if needed: `NODE_OPTIONS='--max-old-space-size=4096' pnpm skills:gate ...`. Monitor CPU/memory via `top` or `htop`. Ensure you have latest Node version compatible with the project (check `.nvmrc` if provided).

## Debugging tips

### Enable verbose logging
Set `DEBUG=*` or a more specific namespace before running a command, e.g.,

```bash
DEBUG=agent-orchestrator node scripts/skills-gate.mjs -- --matrix ./agent-skills-matrix.json --stage coder
```

Some workflows may already expose `--verbose`; check the CLI help (`--help`).

### Test individual phases
If `/burlaki-run` supports `--phase`, target the failing phase:

```bash
./scripts/run-phase.mjs --phase research
```

If no dedicated script exists, isolate by running the subcommand associated with that phase (e.g., skills gate, prompt installer, etc.).

### Recover from errors
1. Re-run the failing command while redirecting output to a log file for post-mortem: `pnpm skills:gate ... 2>&1 | tee /tmp/skills-gate.log`.
2. Roll back partial changes (`git checkout -- path`) only for the files you modified locally; do not disturb unrelated working tree items.
3. When in doubt, clean your workspace and rerun from scratch: `rm -rf node_modules && pnpm install` followed by the workflow command.

Keep this guide close during debugging sessions and update it as new common failures appear.
