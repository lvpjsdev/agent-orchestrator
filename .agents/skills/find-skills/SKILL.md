---
name: find-skills
---

# Find Skills

Discover and install agent skills from external sources.

## Purpose

Help agents locate and install specialized capabilities.

## Usage

```bash
# Search for skills
npx skills search <keyword>

# Install a skill
npx skills add <source> -g -y

# List installed skills
npx skills list
```

## Common Sources

- `obra/superpowers@<skill>` - Superpowers skill pack
- Local: `./path/to/skill`
- GitHub: `user/repo#skill`

## When to Use

- Before starting a new stage requiring specific skills
- When agent reports missing required skills
- For discovering available capabilities
