---
name: typescript-advanced-types
---

# TypeScript Advanced Types

Patterns for leveraging TypeScript's type system effectively.

## Utility Types

```typescript
// Prefer built-in utilities
Partial<T>       // All properties optional
Required<T>      // All properties required
Readonly<T>      // Immutable properties
Pick<T, K>       // Subset of properties
Omit<T, K>       // Exclude properties
Record<K, V>     // Object with K keys and V values
```

## Type Guards

```typescript
// User-defined type guards
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}
```

## Generic Constraints

```typescript
// Constrain generics meaningfully
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

## Discriminated Unions

```typescript
type Result<T> = 
  | { success: true; value: T }
  | { success: false; error: string };
```

## Template Literal Types

```typescript
type EventName = `on${Capitalize<string>}`;
```

## Patterns

- Prefer `unknown` over `any`
- Use const assertions for literals
- Leverage inference, avoid redundant annotations
- Brand types for nominal typing
