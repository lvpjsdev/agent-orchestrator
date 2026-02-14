---
name: react-best-practices
---

# React Best Practices

Guidelines for writing idiomatic, performant React components.

## Core Principles

### Component Structure

- One component per file
- Named exports for components
- Props interface at top of file
- Keep components focused and small

### Hooks

- Follow rules of hooks strictly
- Prefer custom hooks for reusable logic
- Use `useCallback` for functions passed to children
- Use `useMemo` for expensive computations

### State Management

- Lift state only as high as needed
- Prefer local state when possible
- Use context sparingly
- Consider server state separately from UI state

### Performance

- Avoid unnecessary re-renders
- Lazy load components when beneficial
- Use React.memo judiciously
- Virtualize long lists

### Patterns to Avoid

- Prop drilling beyond 2 levels
- useEffect for derived state
- Stale closures in async operations
- Direct DOM manipulation
