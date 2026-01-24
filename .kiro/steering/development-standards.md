---
inclusion: always
---

# Development Standards

## Code Style
- Use TypeScript strict mode
- Prefer async/await over Promises
- Use CSS Modules for styling
- Follow React Router v7 patterns

## Component Patterns
```typescript
// Route component structure
export default function RouteName() {
  const { data } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  
  const isSubmitting = navigation.state === "submitting";
  
  return (
    <div className={styles.container}>
      {/* Component content */}
    </div>
  );
}

export async function loader({ params, request }) {
  // Data loading logic
}

export async function action({ request }) {
  // Form submission logic
}
```

## Error Handling
- Always wrap AI calls in try/catch
- Provide user-friendly error messages
- Log errors for debugging
- Implement retry logic for transient failures

## Security Guidelines
- Never expose API keys to client
- Use server-side encryption for sensitive data
- Validate all user inputs
- Implement rate limiting
- Use Supabase RLS policies

## Testing Approach
- Unit tests for services and utilities
- Integration tests for AI provider calls
- E2E tests for critical user flows
- Mock external APIs in tests

## Performance Considerations
- Lazy load components where possible
- Implement loading states for AI operations
- Cache frequently used data
- Optimize bundle size with code splitting

## Database Patterns
```typescript
// Always use RLS policies
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId); // RLS handles this automatically

// Use transactions for related operations
const { data, error } = await supabase.rpc('create_ebook_with_chapters', {
  ebook_data: ebookData,
  chapters_data: chaptersData
});
```

## Environment Management
- Use .env for local development
- Never commit secrets to git
- Use different configs for dev/staging/prod
- Validate required environment variables on startup

## Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] API keys tested
- [ ] Error monitoring enabled
- [ ] Performance monitoring enabled
- [ ] Backup strategy implemented