# Run Coverage and E2E with Dependencies

## Actions
- Verify dev tooling versions via `npm ls vitest @vitest/coverage-v8 @playwright/test`.
- Install missing testing deps:
  - `npm i -D @vitest/coverage-v8`
  - `npm i -D @playwright/test`
- Install Playwright browsers (Chromium-only to reduce size):
  - `npx playwright install chromium`
- Generate coverage:
  - `npm run test:coverage`
- Start dev server (non-blocking) and capture preview URL:
  - `npm run dev`
- Run e2e smoke tests in a separate terminal:
  - `npx playwright test -c playwright.config.ts`

## Notes
- Use separate terminals to avoid interference with long-running installs.
- If browser install is blocked by network timeouts, retry once; otherwise proceed with coverage and defer e2e.
- No code changes; purely execution and reporting.

## Outcome
- Coverage report generated successfully.
- Dev server available at `http://localhost:5173/`.
- E2E smoke tests run against local server.