## Vercel Connection

* Create `react-router.config.ts` with `adapter: 'vercel'` and `ssr: true` to emit Vercel Build Output.

* Add `vercel.json` only if needed (defaults handled by the adapter) with env aliases and output version.

* Configure Vercel project:

  * Framework: React Router

  * Build Command: `react-router build`

  * Output: auto from adapter

  * Set environment variables in Vercel (Production & Preview):

    * `SUPABASE_PROJECT_URL`

    * `SUPABASE_API_KEY`

    * `ENCRYPTION_KEY` (64-hex)

## Supabase Setup

* Create Supabase project; retrieve Project URL and anon API key.

* In Supabase SQL editor, apply `api_keys` table migration (schema conforms to current code).

* In Dashboard → Settings → API, copy `SUPABASE_PROJECT_URL` and `SUPABASE_API_KEY` into Vercel.

* Optional: enable RLS policies and create service role if we later need server-side operations.

## Frontend SSR Fixes

* Standardize server imports across route files:

  * Import `json` from `@react-router/node` only.

  * Import `redirect` from `react-router` only.

* Audit and update all `app/routes/*.tsx` and `app/routes/*.ts` to remove `json` from `react-router`.

* Verify dev server starts cleanly (no HMR overlay complaining about import names).

## E2E Stability

* Ensure Playwright browsers are installed in CI and local: `npx playwright install chromium`.

* Start dev server with required env (`SUPABASE_*`, `ENCRYPTION_KEY`) and run smoke tests.

* If auth gating blocks pages, add a controlled bypass for non-prod:

  * Respect `VITE_AUTH_BYPASS=1` (client) or `AUTH_BYPASS=1` (server) to allow `ProtectedRoute` to render in dev/e2e.

## Deliverables

* `react-router.config.ts` configured for Vercel.

* Verified SSR build + Vercel deploy.

* Supabase credentials set and schema ready.

* Clean dev server, passing E2E on local and CI.

