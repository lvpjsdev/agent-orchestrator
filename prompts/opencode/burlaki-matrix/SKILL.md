---
name: burlaki-matrix
description: Inspect the burlaki skill matrix for a stage
---

# AO Matrix

Inspect `packages/burlaki/agent-skills-matrix.json` and summarize the constraints for the requested stage.

1) Parse user input as `stage`.
   - If missing/ambiguous, ask the user which stage they mean and show available stage keys from the matrix.

2) Read the matrix and output:
   - stage label (if present)
   - `requiredSkills`, `optionalSkills`, `forbiddenSkills`
   - `requiredPolicies`
   - `agentConstraints.allowedAgents` (if present)

3) If the stage is missing, explain that and list available stage keys.
