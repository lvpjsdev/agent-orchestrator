name: ui-skills

# UI Skills

General UI development capabilities and patterns.

## Core Capabilities

- HTML/CSS implementation
- Responsive design
- Accessibility (a11y)
- Form handling
- Layout systems

## Accessibility Checklist

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation
- Focus management
- Color contrast ratios
- Screen reader testing

## Responsive Patterns

```css
/* Mobile-first approach */
.container {
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}
```

## Form Patterns

- Validate on blur/submit
- Show inline errors
- Disable submit during loading
- Preserve user input
