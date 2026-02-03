@echo off
setlocal
cd /d "%~dp0project" || exit /b 1
npm run preview
