# Dependency Verification and Installation for Testing

## Audit Dependencies
- Inspect current dev dependencies in `project/package.json` (vitest present; coverage and Playwright not yet).
- Verify packages via commands:
  - `npm ls vitest @vitest/coverage-v8 @playwright/test`

## Install Missing Testing Tooling
- Add coverage provider:
  - `npm i -D @vitest/coverage-v8`
- Add Playwright test runner:
  - `npm i -D @playwright/test`
- Install Playwright browsers:
  - `npx playwright install --with-deps`

## Run Coverage and E2E
- Coverage report:
  - `npm run test:coverage`
- Start dev server (non-blocking):
  - `npm run dev`
- In another terminal, run e2e:
  - `npx playwright test -c playwright.config.ts`

## Expected Outcome
- Coverage report generated without errors (uses `@vitest/coverage-v8`).
- Dev server available at `http://localhost:5173/`.
- Playwright smoke tests run and pass against local server.