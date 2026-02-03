## Actions
- Clean install all dependencies with `npm ci` to ensure a reproducible setup.
- Verify test tooling presence post-install: `npm ls vitest @vitest/coverage-v8 @playwright/test`.
- Re-run coverage: `npm run test:coverage`.
- Attempt e2e again with system Chrome channel: `npx playwright test -c playwright.config.ts`.

## Notes
- `npm ci` removes `node_modules` and reinstalls based on lockfile.
- If Playwright browsers are still required and network blocks downloads, we’ll keep e2e optional as previously agreed.

## Outcome
- Dependencies reinstalled cleanly.
- Coverage report generated.
- E2E runs if system Chrome is available; otherwise documented fallback.