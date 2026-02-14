name: ui-design-system

# UI Design System

Guidelines for working within established design systems.

## Principles

- Use design tokens for colors, spacing, typography
- Compose with existing components first
- Follow naming conventions
- Maintain visual consistency

## Token Usage

```css
/* Use tokens, not hardcoded values */
color: var(--color-primary);
padding: var(--spacing-md);
font-size: var(--font-size-body);
```

## Component Patterns

- Prefer composition over new components
- Extend via props, not duplication
- Document variations with stories
- Test accessibility

## When Creating New

1. Check if existing component can be extended
2. Follow established patterns
3. Use design tokens only
4. Add to component library
5. Create documentation

## Common Systems

- Material UI
- Chakra UI
- Radix UI
- Custom token-based systems
