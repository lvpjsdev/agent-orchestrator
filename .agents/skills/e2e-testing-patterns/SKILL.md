name: e2e-testing-patterns

# E2E Testing Patterns

Patterns for writing reliable end-to-end tests.

## Principles

- Test user behavior, not implementation
- Each test should be independent
- Use meaningful test IDs sparingly
- Avoid testing third-party functionality

## Test Structure

```typescript
describe('Feature', () => {
  beforeEach(() => {
    // Setup: navigate, seed data, etc.
  });

  test('user can complete action', async () => {
    // Arrange: prepare test state
    // Act: perform user actions
    // Assert: verify expected outcome
  });

  afterEach(() => {
    // Cleanup if needed
  });
});
```

## Selectors

```typescript
// Prefer accessible selectors
await page.getByRole('button', { name: 'Submit' });
await page.getByLabel('Email');
await page.getByText('Welcome');

// Fallback to test ID
await page.getByTestId('submit-button');
```

## Wait Strategies

```typescript
// Wait for specific conditions
await expect(page.getByText('Loaded')).toBeVisible();
await page.waitForResponse('**/api/data');
```

## Anti-Patterns

- Arbitrary timeouts (use auto-waiting)
- Brittle CSS selectors
- Sharing state between tests
- Testing internal state
