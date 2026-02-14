name: screenshot

# Screenshot

Capture and analyze UI screenshots.

## Purpose

Visual verification and documentation of UI state.

## Capabilities

- Capture full page screenshots
- Capture specific elements
- Compare before/after states
- Detect visual regressions

## Playwright Screenshots

```typescript
// Full page
await page.screenshot({ path: 'full.png', fullPage: true });

// Element only
await page.locator('.card').screenshot({ path: 'card.png' });

// With options
await page.screenshot({
  path: 'screenshot.png',
  animations: 'disabled',
  mask: [page.locator('.ads')],
});
```

## Use Cases

- Visual regression testing
- Bug documentation
- Design review
- Documentation generation
