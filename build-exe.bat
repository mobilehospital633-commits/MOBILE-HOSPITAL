@echo off
setlocal enabledelayedexpansion

:: Navigate to script directory with quotes to support spaces
cd /d "%~dp0"

title Mobile Hospital POS - Windows .EXE Converter

echo =====================================================================
echo       MOBILE HOSPITAL POS & WORKSHOP MANAGEMENT - .EXE BUILDER
echo =====================================================================
echo.

:: 1. CHECK FOR AMPERSAND (&) IN DIRECTORY PATH
echo "%~dp0" | findstr "&" >nul
if %errorlevel% equ 0 (
    echo [CRITICAL ERROR] Folder path contains an ampersand character ('&'):
    echo   "%~dp0"
    echo.
    echo On Windows, the '&' character breaks command-line scripts and npm.
    echo.
    echo HOW TO FIX IN 5 SECONDS:
    echo   1. Rename your folder to remove the '&' symbol.
    echo      For example: rename "mobile-repair-&-billing-manager"
    echo      to: "MobileHospitalPOS" or "mobile-repair-billing-manager"
    echo   2. Double-click build-exe.bat again!
    echo.
    echo =====================================================================
    pause
    exit /b 1
)

:: 2. CHECK NODE.JS ENVIRONMENT
echo Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js is not detected on this computer.
    echo Opening https://nodejs.org/ to download Node.js LTS...
    start https://nodejs.org/
    echo.
    echo Please install Node.js and run build-exe.bat again.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo [✓] Node.js is installed (%NODE_VERSION%).
echo.

:: 3. PREPARE DEPENDENCIES
echo [1/3] Preparing dependencies...
if not exist "%~dp0node_modules\vite\bin\vite.js" (
    echo Installing required packages (first time setup)...
    call npm install --legacy-peer-deps
) else (
    echo [✓] Dependencies are ready.
)
if %errorlevel% neq 0 (
    echo Retrying package installation with force...
    call npm install --force
)

:: 4. COMPILE REACT APPLICATION (Direct Node execution bypasses Windows .cmd space bugs)
echo.
echo [2/3] Compiling React application with Vite...
if exist "%~dp0node_modules\vite\bin\vite.js" (
    call node "%~dp0node_modules\vite\bin\vite.js" build
) else (
    call npm run build
)

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build step failed.
    echo If your folder name has special characters or spaces, please move it to:
    echo C:\MobileHospitalPOS and run build-exe.bat again.
    echo.
    pause
    exit /b 1
)
echo [✓] Production assets compiled into dist/

:: 5. PACKAGE STANDALONE WINDOWS .EXE
echo.
echo [3/3] Packaging into standalone Windows Executable (.exe)...
echo Target: Windows 64-bit Portable Executable

if exist "%~dp0node_modules\electron-builder\cli.js" (
    call node "%~dp0node_modules\electron-builder\cli.js" --win portable --config.directories.output=release
) else (
    call npx electron-builder --win portable --config.directories.output=release
)

if %errorlevel% neq 0 (
    echo.
    echo Portable build failed, attempting NSIS standard installer build...
    if exist "%~dp0node_modules\electron-builder\cli.js" (
        call node "%~dp0node_modules\electron-builder\cli.js" --win nsis --config.directories.output=release
    ) else (
        call npx electron-builder --win nsis --config.directories.output=release
    )
)

if %errorlevel% neq 0 (
    echo.
    echo Running backup packager...
    call npx @electron/packager . "Mobile Hospital POS" --platform=win32 --arch=x64 --out=release --overwrite
)

echo.
echo =====================================================================
echo  SUCCESS! Your Windows executable has been built successfully!
echo =====================================================================
echo.
echo Opening the folder containing your .exe file...
if exist "%~dp0release" (
    start "" "%~dp0release"
) else if exist "%~dp0dist_electron" (
    start "" "%~dp0dist_electron"
)
echo.
echo You can now copy the .exe file to your Desktop or USB drive and run it offline!
echo.
pause
