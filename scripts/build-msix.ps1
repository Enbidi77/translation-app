<#
.SYNOPSIS
    Builds an MSIX / AppX package for Microsoft Store Partner Center submission.

.DESCRIPTION
    This script compiles the application (Vite renderer + Electron main) and runs
    electron-builder targeting Windows AppX/MSIX with the required Microsoft Store
    Package Identity parameters.

.PARAMETER IdentityName
    The Package/Identity/Name from Microsoft Partner Center
    (Product Management > Product Identity > Package/Identity/Name).
    Example: "12345DeveloperName.PolyglotDesktop"

.PARAMETER Publisher
    The Package/Identity/Publisher from Microsoft Partner Center.
    Must start with CN= (e.g. "CN=A1B2C3D4-5678-90AB-CDEF-1234567890AB").

.PARAMETER PublisherDisplayName
    The Publisher display name as registered in Partner Center.
    Example: "My Company LLC"

.PARAMETER Arch
    Architecture to target. Defaults to "x64". Can be "x64", "arm64", or "ia32".

.PARAMETER SkipCompile
    If passed, skips 'npm run build' and only packages the existing dist files.

.EXAMPLE
    .\scripts\build-msix.ps1 -IdentityName "12345MyName.PolyglotDesktop" -Publisher "CN=ABCDEF12-3456-7890-ABCD-EF1234567890" -PublisherDisplayName "My Company"

.EXAMPLE
    npm run dist:msix
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $false)]
    [string]$IdentityName = $env:MS_STORE_IDENTITY_NAME,

    [Parameter(Mandatory = $false)]
    [string]$Publisher = $env:MS_STORE_PUBLISHER,

    [Parameter(Mandatory = $false)]
    [string]$PublisherDisplayName = $env:MS_STORE_PUBLISHER_DISPLAY_NAME,

    [Parameter(Mandatory = $false)]
    [ValidateSet("x64", "arm64", "ia32")]
    [string]$Arch = "x64",

    [Parameter(Mandatory = $false)]
    [switch]$SkipCompile
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Polyglot Desktop - MSIX / AppX Builder for MS Store   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Fallback & validation for Partner Center values
if (-not $IdentityName) {
    $IdentityName = "PolyglotDesktop"
    Write-Warning "No -IdentityName provided. Using default '$IdentityName'. For production store submission, set this to the Package Identity Name from Partner Center."
}

if (-not $Publisher) {
    $Publisher = "CN=PolyglotDesktopDev"
    Write-Warning "No -Publisher provided. Using dummy '$Publisher'. Partner Center will validate this against your account."
}

if (-not $PublisherDisplayName) {
    $PublisherDisplayName = "Polyglot Desktop"
}

Write-Host "Configuration:" -ForegroundColor Green
Write-Host "  - Package Identity Name : $IdentityName"
Write-Host "  - Publisher             : $Publisher"
Write-Host "  - Publisher Display Name: $PublisherDisplayName"
Write-Host "  - Architecture          : $Arch"
Write-Host ""

# 2. Check Node & dependencies
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm is not found in PATH. Please install Node.js."
    exit 1
}

# 3. Compile sources if not skipped
if (-not $SkipCompile) {
    # Ensure app icons are generated
    if (-not (Test-Path (Join-Path $PSScriptRoot "..\assets\icon.ico"))) {
        Write-Host "Generating application icons from assets/logo.png..." -ForegroundColor DarkCyan
        & (Join-Path $PSScriptRoot "generate-icons.ps1")
    }

    Write-Host "[1/3] Building renderer and electron bundles (npm run build)..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed. Check compiler errors above."
        exit $LASTEXITCODE
    }
} else {
    Write-Host "[1/3] Skipping compilation step as requested (-SkipCompile)." -ForegroundColor DarkGray
}

# 4. Run electron-builder targeting appx
Write-Host "[2/3] Packaging AppX / MSIX package with electron-builder..." -ForegroundColor Yellow

$archFlag = "--$Arch"
$builderArgs = @(
    "electron-builder",
    "--win", "appx",
    $archFlag,
    "-c.win.target=appx",
    "-c.win.icon=assets/icon.ico",
    "-c.appx.identityName=$IdentityName",
    "-c.appx.publisher=$Publisher",
    "-c.appx.publisherDisplayName=$PublisherDisplayName",
    "-c.appx.applicationId=PolyglotDesktop",
    "-c.appx.displayName=Polyglot Desktop"
)

npx @builderArgs
if ($LASTEXITCODE -ne 0) {
    Write-Error "electron-builder failed with exit code $LASTEXITCODE."
    exit $LASTEXITCODE
}

# 5. Check generated files in release/
Write-Host "[3/3] Locating built package..." -ForegroundColor Yellow
$releaseDir = Join-Path $PSScriptRoot "..\release"
if (-not (Test-Path $releaseDir)) {
    $releaseDir = "release"
}

$packageFiles = Get-ChildItem -Path $releaseDir -Filter "*.appx" -ErrorAction SilentlyContinue
$msixFiles = Get-ChildItem -Path $releaseDir -Filter "*.msix" -ErrorAction SilentlyContinue

$allPackages = @($packageFiles) + @($msixFiles) | Sort-Object LastWriteTime -Descending

if ($allPackages.Count -gt 0) {
    $latestPkg = $allPackages[0]
    
    # If electron-builder output an .appx, create a .msix copy for convenience if not already present
    if ($latestPkg.Extension -eq ".appx") {
        $msixEquivalent = [System.IO.Path]::ChangeExtension($latestPkg.FullName, ".msix")
        Copy-Item -Path $latestPkg.FullName -Destination $msixEquivalent -Force
        Write-Host "Created MSIX copy: $msixEquivalent" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host " SUCCESS! Built package ready for Partner Center:" -ForegroundColor Green
    Write-Host "  Path: $($latestPkg.FullName)" -ForegroundColor Cyan
    Write-Host "  Size: $([math]::Round($latestPkg.Length / 1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps for Microsoft Store Partner Center:" -ForegroundColor Magenta
    Write-Host "  1. Sign in to https://partner.microsoft.com/dashboard"
    Write-Host "  2. Go to your app > 'Packages' section"
    Write-Host "  3. Drag and drop the .msix or .appx file into the upload box"
    Write-Host "  4. Partner Center will validate the package identity and sign it with Microsoft's store key"
} else {
    Write-Warning "Could not find .appx or .msix file in $releaseDir. Check electron-builder output above."
}
