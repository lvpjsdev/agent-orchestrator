name: chrome-devtools

# Chrome DevTools

Browser debugging and inspection capabilities.

## Key Features

- Elements panel: inspect DOM/CSS
- Console: JavaScript execution
- Network: request/response monitoring
- Sources: debugging with breakpoints
- Performance: profiling
- Application: storage inspection

## Debugging Workflow

1. Reproduce the issue
2. Open DevTools (F12 or Cmd+Option+I)
3. Check console for errors
4. Inspect network requests
5. Use breakpoints for logic issues

## Useful Commands

```javascript
// Console utilities
$0                      // Currently selected element
$('.selector')          // Query selector
$$('.selector')         // Query selector all
copy(object)            // Copy to clipboard
table(array)            // Display as table
```

## Performance

- Lighthouse audit
- Coverage panel for unused CSS/JS
- Network throttling
- CPU throttling
