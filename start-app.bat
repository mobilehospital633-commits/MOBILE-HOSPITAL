@echo off
setlocal enabledelayedexpansion

:: Navigate to script directory with quotes
cd /d "%~dp0"

title Mobile Hospital POS - Quick Launcher
echo =====================================================================
echo       MOBILE HOSPITAL POS & WORKSHOP MANAGEMENT - LAUNCHER
echo =====================================================================
echo.

if not exist "%~dp0dist\index.html" (
    echo Compiling application files...
    if exist "%~dp0node_modules\vite\bin\vite.js" (
        call node "%~dp0node_modules\vite\bin\vite.js" build
    ) else (
        call npm run build
    )
)

echo Starting local POS server...
if exist "%~dp0node_modules\vite\bin\vite.js" (
    call node "%~dp0node_modules\vite\bin\vite.js" preview --port 3000 --open
) else (
    call npx vite preview --port 3000 --open
)
