---
status: pending
priority: p2
issue_id: "015"
tags: [code-review, security, environment]
dependencies: []
---

# Use Environment Variable Allowlist

Current implementation inherits all environment variables, potentially leaking sensitive credentials to the beads CLI process.

## Problem Statement

Line 44 spreads all of `process.env` into the spawned process:
```javascript
env: { ...process.env, NO_COLOR: '1' },
```

This includes potentially sensitive values like `API_KEY`, `DATABASE_URL`, `AWS_SECRET_ACCESS_KEY`, etc. If the beads CLI logs or exposes environment variables, credentials could leak.

## Findings

- **Location:** Line 44 in `execBeads`
- All parent process environment variables inherited
- No filtering or allowlist
- Common in CLI tools but risky for production use

## Proposed Solutions

### Option 1: Minimal Allowlist

**Approach:** Only pass essential environment variables.

```javascript
env: {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  NO_COLOR: '1',
  // Only beads-specific vars if needed
  ...(process.env.BEADS_API_KEY && { BEADS_API_KEY: process.env.BEADS_API_KEY }),
},
```

**Pros:**
- Strong security boundary
- Explicit about what's exposed

**Cons:**
- May break if beads CLI needs unexpected env vars
- Requires knowledge of beads CLI requirements

**Effort:** 15 minutes

**Risk:** Medium (may break functionality)

---

### Option 2: Blocklist Sensitive Patterns

**Approach:** Filter out known sensitive variable patterns.

```javascript
const SENSITIVE_PATTERNS = [/KEY/i, /SECRET/i, /PASSWORD/i, /TOKEN/i, /CREDENTIAL/i];

function filterEnv(env) {
  const filtered = {};
  for (const [key, value] of Object.entries(env)) {
    if (!SENSITIVE_PATTERNS.some(p => p.test(key))) {
      filtered[key] = value;
    }
  }
  return filtered;
}

// Usage:
env: { ...filterEnv(process.env), NO_COLOR: '1' },
```

**Pros:**
- Less likely to break functionality
- Catches common patterns

**Cons:**
- May miss non-standard names
- Still passes more than needed

**Effort:** 20 minutes

**Risk:** Low

---

### Option 3: Document and Accept Risk

**Approach:** Add JSDoc warning about env inheritance.

```javascript
/**
 * Execute a beads CLI command
 * WARNING: Inherits all environment variables from parent process
 * @param {string[]} args
 * ...
 */
```

**Pros:**
- No implementation change

**Cons:**
- Risk remains
- Security debt

**Effort:** 2 minutes

**Risk:** High (doesn't fix the issue)

## Recommended Action

**Option 1** - Start with minimal allowlist. Test to verify beads CLI works. Add vars as needed.

## Technical Details

**Affected files:**
- `scripts/beads-client.mjs:44` - spawn options

**Environment variables likely needed:**
- `PATH` - to find executables
- `HOME` - for user config
- `NO_COLOR` - already set
- `BEADS_*` - any beads-specific configuration

## Acceptance Criteria

- [ ] Sensitive env vars (API_KEY, SECRET, etc.) not passed to beads
- [ ] Essential vars (PATH, HOME) still available
- [ ] beads CLI functions correctly
- [ ] Document which vars are passed

## Work Log

### 2026-02-19 - Code Review Discovery

**By:** Security Sentinel

**Actions:**
- Identified environment variable leak as P2 security issue
- Analyzed credential exposure risk
- Proposed allowlist and blocklist approaches

**Learnings:**
- Environment inheritance is common but risky
- Allowlist is safer than blocklist for security
