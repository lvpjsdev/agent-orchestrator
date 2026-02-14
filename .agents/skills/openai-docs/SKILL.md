---
name: openai-docs
---

# OpenAI Documentation

Working with OpenAI APIs and models.

## Models

- `gpt-4o` - Latest multimodal
- `gpt-4-turbo` - High capability
- `gpt-3.5-turbo` - Fast, cost-effective
- `o1-preview` - Advanced reasoning

## Chat Completions

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'developer', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
  ],
  temperature: 0.7,
  max_tokens: 1000,
});
```

## Best Practices

- Use system prompts for context
- Set appropriate temperature
- Implement retry logic
- Stream for long responses
- Track token usage

## Error Handling

- Rate limits: exponential backoff
- Context length: truncate or summarize
- Content filters: adjust prompts
