---
inclusion: always
---

# AI Integration Patterns

## Provider Abstraction
All AI providers implement the same interface through `AIService`. Use consistent patterns:

### Standard AI Request
```typescript
const request: AIRequest = {
  provider: "openai", // or "auto" for best available
  model: "gpt-4-turbo",
  prompt: "Generate content...",
  apiKey: await apiKeyService.getApiKey(userId, provider),
  maxTokens: 2000,
  temperature: 0.7
};

const response = await aiService.generateContent(request);
```

### Error Handling Pattern
```typescript
try {
  const response = await aiService.generateContent(request);
  // Handle success
} catch (error) {
  if (error.message.includes('API key')) {
    // Redirect to settings
  } else if (error.message.includes('rate limit')) {
    // Show retry option
  } else {
    // Generic error handling
  }
}
```

### Auto Provider Selection
When provider is "auto", the service tries providers in preference order:
1. OpenAI (most reliable)
2. Anthropic (high quality)
3. xAI (fast)
4. Google (cost-effective)
5. DeepSeek (fallback)

### Model Selection Guidelines
- **Long-form content**: GPT-4, Claude-3-Opus
- **Creative writing**: GPT-4-Turbo, Claude-3-5-Sonnet
- **Technical content**: GPT-4, Gemini-1.5-Pro
- **Fast generation**: GPT-3.5-Turbo, Gemini-1.5-Flash
- **Cost-effective**: DeepSeek, Gemini-Flash

## Content Generation Patterns

### Brainstorming
```typescript
const results = await aiService.brainstorm(
  topic, 
  provider, 
  model, 
  apiKey
);
// Returns: { titles: string[], outline: BookOutline }
```

### Chapter Generation
```typescript
const chapter = await aiService.generateChapter({
  chapterTitle,
  chapterNumber,
  outline,
  tone,
  audience,
  wordCount,
  provider,
  model,
  apiKey
});
```

### Humanization (4-Phase Process)
```typescript
const humanized = await aiService.humanizeContent(
  content,
  provider,
  model,
  apiKey
);
// Removes AI patterns, improves flow, adds personality
```

## State Management
Use React Router's loader/action pattern for data flow:

```typescript
// In route loader
export async function loader({ params }) {
  const outline = await getOutlineFromStorage(params.id);
  return { outline };
}

// In route action  
export async function action({ request }) {
  const formData = await request.formData();
  const result = await aiService.generateContent(formData);
  return redirect(`/preview/${result.id}`);
}
```

## API Key Management
Always retrieve keys securely:

```typescript
// Check if key exists
const hasKey = await apiKeyService.hasApiKey(userId, provider);

// Get key for AI request
const apiKey = await apiKeyService.getApiKey(userId, provider);

// Save new key (encrypted)
await apiKeyService.saveApiKey(userId, provider, rawKey);
```