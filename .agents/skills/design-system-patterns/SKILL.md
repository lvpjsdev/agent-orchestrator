name: design-system-patterns

# Design System Patterns

Patterns for building and maintaining design systems.

## Architecture

```
design-system/
├── tokens/
│   ├── colors.css
│   ├── spacing.css
│   └── typography.css
├── components/
│   ├── Button/
│   ├── Input/
│   └── index.ts
└── primitives/
    ├── Box/
    └── Text/
```

## Token Structure

```typescript
const tokens = {
  colors: {
    primary: { 50: '#...', 500: '#...', 900: '#...' },
    neutral: { 50: '#...', 900: '#...' },
  },
  spacing: { 0: '0', 1: '0.25rem', 2: '0.5rem', ... },
  radii: { sm: '0.25rem', md: '0.5rem', lg: '1rem' },
};
```

## Component API

- Consistent prop interfaces
- Compose from primitives
- Support `as` polymorphism
- Accept className/style overrides

## Versioning

- Semantic versioning
- Document breaking changes
- Provide migration guides
