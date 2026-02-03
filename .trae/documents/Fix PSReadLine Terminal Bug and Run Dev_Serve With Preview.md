## Diagnose Terminal Issue
- Identify PSReadLine as the source of PowerShell exceptions (SetCursorPosition errors) during command entry.
- Confirm current terminals: one dev/serve idle, one running `npx vite preview`. Note the environment auto-loads PSReadLine.

## Quick Workarounds (No Code Changes)
- Start commands in a clean PowerShell session without profiles: `powershell -NoLogo -NoProfile -Command "npm run dev"`.
- Or run via cmd shell for scripts: set npm to use cmd: `npm config set script-shell "C:\\Windows\\System32\\cmd.exe"`, then `npm run dev`.
- Temporarily disable PSReadLine in the current session before running commands: `Remove-Module PSReadLine; Set-PSReadLineOption -PredictionSource None`.
- For production, avoid serve CLI by using Vite preview: `npx vite preview` after build.

## Permanent Fixes (Code/Config)
- Adjust package.json scripts to avoid interactive shells:
  - dev: `node node_modules/@react-router/dev/dist/cli.js dev`
  - start: `node node_modules/@react-router/serve/dist/cli.js ./build/server/index.js`
- Add a dedicated PowerShell script `scripts/run-dev.ps1` that runs with `-NoProfile` and calls the dev CLI directly; update `npm run dev` to invoke it.
- Optionally set project-local npm config to use cmd: `.npmrc` with `script-shell=C:\\Windows\\System32\\cmd.exe`.

## Router Package Alignment
- Update to a compatible set to resolve runtime export mismatches when serving:
  - `react-router@latest @react-router/node@latest @react-router/dev@latest @react-router/serve@latest`
- Rebuild and re-run serve.

## Start Server and Preview
- Kill the running `npx vite preview`.
- Start dev with no profile and capture the URL (expect `http://localhost:5173/`).
- If using serve, rebuild and start; capture `http://localhost:3000/`.
- Open the preview URL.

## Smoke Test Brainstorm → Builder → Preview
- /login: sign in or sign up, then sign in.
- /brainstorm: generate ideas in auto provider; select a title and continue.
- /builder: verify prefilled session data; generate book and auto-redirect.
- /preview: verify TOC, humanize chapter, and export to PDF/EPUB/Markdown.

## Reporting
- Provide the final preview URL and summary of outcomes.
- Note any residual warnings (large client chunks) and propose code-splitting follow-ups.

## Contingencies
- If PSReadLine still loads, run commands through a subshell with `-NoProfile` or switch `script-shell` to cmd.
- If package updates fail due to peer conflicts, upgrade `react-router` in lockstep and retry or use `--legacy-peer-deps` temporarily, then correct versions.