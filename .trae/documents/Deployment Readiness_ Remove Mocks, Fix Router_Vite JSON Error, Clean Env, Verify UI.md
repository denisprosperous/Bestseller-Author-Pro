## Explain the Frontend Error (react-router/json)
- Root cause: some route code imported `json` from `react-router` (not exported in RR v7), causing Vite SSR overlay: “requested module 'react-router' does not provide an export named 'json'”.
- Correct implementation:
  - Use Web Fetch API responses: `return Response.json(data)` and `return Response.redirect(url, 302)`.
  - Use RR runtime imports only for UI/hooks (`Form`, `useLoaderData`, `useActionData`, etc.) from `react-router`.
  - Use server types only (`import type { LoaderFunctionArgs, ActionFunctionArgs } from "@react-router/node"`).
- Add a guardrail: repo-wide grep check (or lint rule) that fails if `json` is imported from `react-router`.

## Start Frontend for UI Review
- Ensure you run commands from the repo root with the new proxy scripts.
- Start dev UI (preferred): `npm run dev` and open the printed localhost URL.
- If PowerShell PSReadLine crashes, run `dev.cmd` from the repo root (cmd wrapper) to start the frontend.

## Environment Cleanup (Production-safe)
- Remove committed secrets:
  - Delete `project/.env` from the repo and replace with `project/.env.example` only.
  - Rotate any leaked keys (Supabase service role, provider keys).
- Standardize env var usage:
  - Browser must read `VITE_SUPABASE_PROJECT_URL` + `VITE_SUPABASE_API_KEY`.
  - Server reads `SUPABASE_PROJECT_URL` + `SUPABASE_API_KEY` and a strong `ENCRYPTION_KEY`.
  - Remove `NODE_ENV` from `.env` files (Vite warns; hosting sets NODE_ENV).

## Remove All Mock/Placeholder Behavior
- Disable or remove unfinished modules that return mock URLs/data:
  - `ImageService` uses `demo-user-123` and `https://example.com/images/...`.
  - `TTSService` calls providers but returns `https://storage.example.com/...` mock URLs.
  - Other placeholder audio/image services.
- Choose one of two paths:
  - **Ship core only (recommended for immediate deploy):** hide/remove Audiobooks + Children’s Books routes and navigation links until they have real storage + auth.
  - **Ship everything real:** implement Supabase Storage uploads for generated audio/images, replace demo user ids with real auth user id, and persist to DB.

## Auth + Database Hardening
- Ensure every non-public route uses real auth (no demo user ids).
- Enforce auth checks server-side in loaders/actions (not just client ProtectedRoute).
- Validate database schema:
  - Confirm required tables: `users`, `ebooks`, `chapters`, `sessions`, `api_keys`, and any feature tables.
  - Remove/disable writing fake records (like demo user ids).

## Deployment Config Readiness
- Fix Vercel config:
  - Remove the incorrect `rewrites` mapping to `app/routes/*`.
  - Rely on React Router’s Vercel adapter (`react-router.config.ts` with `adapter: 'vercel'`).
- Confirm required Vercel env vars are set (no secrets in repo).

## Verification
- Run from repo root:
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
  - Start and open UI:
    - dev (`npm run dev`) and/or preview (`npm run preview`)
- Smoke test flows in browser:
  - Login → Settings (set API keys) → Brainstorm → Builder → Preview (export)

## Deliverables
- Frontend starts cleanly without Vite overlay errors.
- No demo ids / mock URLs in production codepaths.
- Secrets removed from repo; env setup documented.
- Vercel deploy produces a working SSR app with real Supabase backing.