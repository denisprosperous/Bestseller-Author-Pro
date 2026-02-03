## Terminal & Server Startup
- Stop the existing dev process and launch a fresh terminal without interactive PSReadLine prompts (new terminal, no profile).
- Start the app with `npm run dev` (React Router + Vite) from the project root.
- If the same shell bug appears, start via a non-interactive runner (`npx react-router dev` or `node node_modules/@react-router/dev/dist/cli.js dev`).
- As a fallback, run production server locally: `npm run build` then `npm start` to verify SSR routing.

## Preview URL
- Capture the local URL from server logs (expected http://localhost:5173/ for dev or http://localhost:3000/ for serve).
- Open the URL and confirm the root page renders with navigation.

## Auth Preparation
- Navigate to /login and sign in using a test account (Supabase auth).
- If sign-in fails, create a new account via the same form, then sign in.

## Smoke Test: Brainstorm
- Go to /brainstorm.
- Enter a realistic idea (e.g., "Mindfulness for Busy Professionals").
- Leave provider as "auto"; verify model auto-selects.
- Submit and confirm: titles render, outline shows, error banners are absent.
- Click a title and choose "Use This Outline" to advance to Builder.

## Smoke Test: Builder
- Confirm topic/provider/model/outline prefilled from session.
- Adjust word count, tone, audience; leave "Improve outline" checked.
- Submit "Generate Book"; watch progress steps update; confirm no API key error.
- After completion, auto-redirect to /preview with ebook query param.

## Smoke Test: Preview
- Validate TOC sidebar, book title/subtitle, current chapter content.
- Click Humanize Content; ensure a humanized preview appears and can be accepted.
- Export flows: open dialog, choose PDF/EPUB/Markdown, and download.

## Evidence & Reporting
- Provide the preview URL.
- Summarize outcomes: pages loaded, generation/humanization/export success, any warnings.
- Note any residuals (e.g., large chunk warnings) and propose follow-ups (code-splitting or manualChunks).

## Contingencies
- If dev server ports conflict, retry on an available port.
- If auth blocks pages in dev, briefly toggle to production serve for validation, or sign in before route loads.
- If AI keys missing, set a provider with a known working key in Settings.