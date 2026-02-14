---
name: ao-gate
description: Run agent-orchestrator skills gate (matrix + optional log scan)
---

# AO Gate

Run the skill gate for this repo and summarize the result.

1) Parse command arguments from user input:
   - `stage`: required (e.g. `coder`, `reviewer`, `release`)
   - `agent`: optional unless required by the stage (e.g. `codex`, `claude`, `opencode`)
   - `--log <path>`: optional (enables forbidden-skill detection from logs)
   - `--policies <csv>`: optional (passes satisfied policy checks)

If `stage` is missing/ambiguous, ask the user for it.

2) Run:

```bash
pnpm agents:skills-gate -- \
  --matrix packages/agent-orchestrator/agent-skills-matrix.json \
  --stage "<stage>" \
  --agent "<agent>" \
  --log "<path-if-provided>" \
  --policies "<csv-if-provided>"
```

3) Output a short summary:
   - `status` + `reasons`
   - `skillsMissing`, `policiesMissing`
   - if `--log` was provided: `forbiddenSkillsUsed` (if any)

If blocked, suggest the smallest next action to unblock (install missing skills, pass required policies, or remove forbidden skill usage).
