## What’s Actually Broken (Root Cause)
- You’re running `npm run dev/build/preview` from `C:\BestSeller Author Pro\` where the root [package.json](file:///c:/BestSeller%20Author%20Pro/package.json) has no scripts, so npm correctly says “Missing script”.
- Your current [project/.env](file:///c:/BestSeller%20Author%20Pro/project/.env) is misconfigured for local dev (it sets NODE_ENV=production and ENCRYPTION_KEY is not valid hex / wrong length). Vite explicitly warns about NODE_ENV in .env.
- `npm start` fails because `@react-router/node@7.12.0` does not export `redirect/json` (confirmed in [node/dist/index.mjs](file:///c:/BestSeller%20Author%20Pro/project/node_modules/@react-router/node/dist/index.mjs#L231-L238)), but the generated server build imports them. This requires upgrading React Router packages in lockstep.
- PowerShell PSReadLine crashes are a terminal rendering bug; we can’t “fix PSReadLine” globally here, but we can make project commands run reliably by avoiding that interactive path.

## 1) Make Root Commands Work (so `npm run dev` works from C:\BestSeller Author Pro)
- Update root [package.json](file:///c:/BestSeller%20Author%20Pro/package.json) to include scripts that proxy to the actual app in `project/` using `npm --prefix project run <script>`:
  - dev, build, start, preview, test, typecheck.
- Optionally add `workspaces: ["project"]` to make future tooling cleaner.

## 2) Fix Project Scripts to be Robust
- Restore `project/package.json` scripts to use the official CLIs (`react-router dev`, `react-router build`, `react-router-serve ...`) or point to the correct bin entrypoints (bin.js), not the non-existent path that caused `MODULE_NOT_FOUND`.
- Add a `preview` script (already present) so smoke testing can run without SSR/serve.

## 3) Fix .env (misconfigured variables + security hardening)
- Split environment into:
  - `project/.env.example` (template only, no secrets)
  - `project/.env.local` (real secrets for local; ignored by git)
  - `project/.env.production` (optional template for hosting; no secrets committed)
- Specific corrections:
  - Remove `NODE_ENV` from `.env` files used by Vite (Vite will manage it; setting it in .env causes warnings).
  - Replace `ENCRYPTION_KEY` with a valid 64-char hex string (32 random bytes). The current value contains non-hex characters and will break AES.
  - Remove/rename unused vars like `API_BASE_URL` (it’s not referenced in code); keep only vars the app actually reads: `SUPABASE_PROJECT_URL`, `SUPABASE_API_KEY`, `ENCRYPTION_KEY`.
  - Move any service role key and provider API keys into `.env.local` only.

## 4) Fix `npm start` (React Router package alignment)
- Upgrade React Router packages together to the same version so server runtime exports match what the build expects:
  - `react-router`, `@react-router/dev`, `@react-router/node`, `@react-router/serve` (same version).
- If npm hits ERESOLVE, upgrade the entire set in one command.
- If npm hits network/ECONNRESET, retry with a clean command after switching to cmd-based script shell.

## 5) Defang PSReadLine for Commands
- Provide a no-PSReadLine way to run scripts:
  - add `scripts/dev.cmd`, `scripts/build.cmd`, `scripts/start.cmd` wrappers that `cd project` and run npm.
  - optionally set project `.npmrc` to use cmd as script-shell (project-local).

## 6) Verify End-to-End
- From repo root:
  - `npm run build`
  - `npm run preview` (expect http://localhost:4173) and smoke-test Brainstorm → Builder → Preview.
  - `npm run start` (expect http://localhost:3000) after router upgrade.
- Confirm no more “Missing script” errors from the root.

If you approve, I’ll implement all edits (root scripts, project scripts, env split + corrected key, dependency alignment), then run the build/preview/start and report the exact URLs and results.