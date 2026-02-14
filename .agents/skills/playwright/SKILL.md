name: playwright

# Playwright

End-to-end testing with Playwright browser automation.

## Setup

```bash
pnpm add -D @playwright/test
npx playwright install
```

## Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
});
```

## Basic Test

```typescript
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/App Name/);
});
```

## Key Locators

```typescript
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email')
page.getByPlaceholder('Enter email')
page.getByTestId('user-menu')
page.locator('.card >> text=Details')
```

## Debugging

```bash
# Debug mode
npx playwright test --debug

# UI mode
npx playwright test --ui

# Trace viewer
npx playwright test --trace on
```
