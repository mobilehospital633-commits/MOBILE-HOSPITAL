# Mobile Hospital POS - Windows .EXE Converter (PowerShell)
[Console]::Title = "Mobile Hospital POS - Windows .EXE Converter"
Set-Location -Path $PSScriptRoot

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "     MOBILE HOSPITAL POS & WORKSHOP MANAGEMENT - PC .EXE BUILDER     " -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check for Ampersand in path
if ($PSScriptRoot -like "*&*") {
    Write-Host "[WARNING] Folder path contains an ampersand '&': $PSScriptRoot" -ForegroundColor Yellow
    Write-Host "Please rename the folder to remove '&' (e.g. MobileHospitalPOS) if you encounter any errors." -ForegroundColor Yellow
    Write-Host ""
}

# 2. Check for Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[!] Node.js is not installed on this PC." -ForegroundColor Red
    Write-Host "Opening https://nodejs.org to download Node.js (LTS)..." -ForegroundColor Yellow
    Start-Process "https://nodejs.org/"
    Write-Host "After installing Node.js, run this script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}

$nodeVer = (node -v)
Write-Host "[✓] Node.js detected ($nodeVer)" -ForegroundColor Green

Write-Host "`n[1/3] Checking dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "$PSScriptRoot/node_modules/vite/bin/vite.js")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install --legacy-peer-deps
} else {
    Write-Host "Dependencies ready." -ForegroundColor Gray
}

Write-Host "`n[2/3] Compiling web app..." -ForegroundColor Cyan
if (Test-Path "$PSScriptRoot/node_modules/vite/bin/vite.js") {
    & node "$PSScriptRoot/node_modules/vite/bin/vite.js" build
} else {
    npm run build
}

Write-Host "`n[3/3] Packaging into standalone Windows Executable (.exe)..." -ForegroundColor Cyan
if (Test-Path "$PSScriptRoot/node_modules/electron-builder/cli.js") {
    & node "$PSScriptRoot/node_modules/electron-builder/cli.js" --win portable --config.directories.output=release
} else {
    npx electron-builder --win portable --config.directories.output=release
}

if (Test-Path "$PSScriptRoot/release") {
    Write-Host "`n=====================================================================" -ForegroundColor Green
    Write-Host " SUCCESS! Standalone Windows .exe created in the 'release' folder!" -ForegroundColor Green
    Write-Host "=====================================================================" -ForegroundColor Green
    Start-Process "$PSScriptRoot/release"
} else {
    Write-Host "`nRunning alternative packager..." -ForegroundColor Yellow
    npx @electron/packager . "Mobile Hospital POS" --platform=win32 --arch=x64 --out=release --overwrite
    if (Test-Path "$PSScriptRoot/release") {
        Start-Process "$PSScriptRoot/release"
    }
}

Read-Host "`nPress Enter to finish..."
