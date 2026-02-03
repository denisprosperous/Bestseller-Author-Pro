# Execute Coverage and E2E Validation

## Steps
- Run coverage: `npm run test:coverage` and capture summary.
- Start dev server: `npm run dev` (port 5173) and verify preview URL.
- Run e2e: `npx playwright test -c playwright.config.ts` targeting `tests-e2e/smoke.spec.ts`.

## Notes
- Uses existing Playwright config (`project/playwright.config.ts`).
- BaseURL defaults to `http://localhost:5173`; overridden by `FRONTEND_URL` if set.
- No code changes; purely execution and reporting.

## Expected Outcome
- Coverage report generated and summarized.
- Dev server running with preview URL accessible.
- E2E smoke tests execute and pass on home, settings, and builder flow.