## Steps
- Reset Playwright config to default bundled browsers (remove `channel: 'chrome'`).
- Install Playwright browsers: `npx playwright install chromium` (retry with `npx playwright install` if needed).
- Start dev server: `npm run dev` (non-blocking) and verify it’s serving on `http://localhost:5173/`.
- Run E2E smoke tests: `npx playwright test -c playwright.config.ts`.

## Outcome
- Dev server running.
- Playwright uses downloaded Chromium instead of system Chrome.
- E2E tests execute against local server and pass.