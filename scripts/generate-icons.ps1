<#
.SYNOPSIS
    Generates multi-resolution application icons (.ico, .png, AppX assets) from assets/logo.png
#>

[CmdletBinding()]
param ()

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function CreateRoundedRectanglePath([System.Drawing.RectangleF]$rect, [float]$radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $radius * 2

    $path.AddArc($rect.X, $rect.Y, $diameter, $diameter, 180, 90)
    $path.AddLine($rect.X + $radius, $rect.Y, $rect.Right - $radius, $rect.Y)
    $path.AddArc($rect.Right - $diameter, $rect.Y, $diameter, $diameter, 270, 90)
    $path.AddLine($rect.Right, $rect.Y + $radius, $rect.Right, $rect.Bottom - $radius)
    $path.AddArc($rect.Right - $diameter, $rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $path.AddLine($rect.Right - $radius, $rect.Bottom, $rect.X + $radius, $rect.Bottom)
    $path.AddArc($rect.X, $rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $path.AddLine($rect.X, $rect.Bottom - $radius, $rect.X, $rect.Y + $radius)
    $path.CloseFigure()
    return $path
}

function Resize-Bitmap([System.Drawing.Bitmap]$source, [int]$targetWidth, [int]$targetHeight) {
    $dest = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $g.DrawImage($source, 0, 0, $targetWidth, $targetHeight)
    $g.Dispose()
    return $dest
}

function Build-Ico([System.Drawing.Bitmap]$baseImg, [int[]]$sizes, [string]$outIcoPath) {
    $pngStreams = @()
    foreach ($sz in $sizes) {
        $resized = Resize-Bitmap $baseImg $sz $sz
        $ms = New-Object System.IO.MemoryStream
        $resized.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $pngStreams += @{
            Size = $sz
            Bytes = $ms.ToArray()
        }
        $ms.Dispose()
        $resized.Dispose()
    }

    $fs = [System.IO.File]::Create($outIcoPath)
    $bw = New-Object System.IO.BinaryWriter($fs)

    # 1. ICONDIR
    $bw.Write([uint16]0) # Reserved
    $bw.Write([uint16]1) # Type (1 = Icon)
    $bw.Write([uint16]$pngStreams.Count) # Count

    # Calculate offset
    $headerSize = 6 + ($pngStreams.Count * 16)
    $currentOffset = $headerSize

    # 2. ICONDIRENTRY array
    foreach ($item in $pngStreams) {
        $sz = $item.Size
        $bWidth = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }
        $bHeight = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }
        
        $bw.Write($bWidth)                    # Width
        $bw.Write($bHeight)                   # Height
        $bw.Write([byte]0)                    # Color count (0 = >=8bpp)
        $bw.Write([byte]0)                    # Reserved
        $bw.Write([uint16]1)                  # Planes
        $bw.Write([uint16]32)                 # Bits per pixel
        $bw.Write([uint32]$item.Bytes.Length) # Image size
        $bw.Write([uint32]$currentOffset)     # Image offset

        $currentOffset += $item.Bytes.Length
    }

    # 3. Image payloads
    foreach ($item in $pngStreams) {
        $bw.Write($item.Bytes)
    }

    $bw.Flush()
    $bw.Close()
    $fs.Close()
    Write-Host "Generated ICO at $outIcoPath with $($pngStreams.Count) sizes: $($sizes -join ', ')"
}

$rootDir = (Get-Item $PSScriptRoot).Parent.FullName
$rawPath = Join-Path $rootDir "assets/logo.png"

if (-not (Test-Path $rawPath)) {
    Write-Error "Source logo file not found at: $rawPath"
    exit 1
}

$rawImg = [System.Drawing.Bitmap]::FromFile($rawPath)

# Crop squircle area centered at (512, 279)
$cropSize = 416
$rect = New-Object System.Drawing.Rectangle(304, 71, $cropSize, $cropSize)
$cropped = $rawImg.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Apply smooth squircle mask with transparent background
$masked = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($masked)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

$maskRect = New-Object System.Drawing.RectangleF(8, 8, 496, 496)
$path = CreateRoundedRectanglePath $maskRect 110.0

$g.SetClip($path)
$g.DrawImage($cropped, 0, 0, 512, 512)
$g.ResetClip()
$g.Dispose()

# Save master 512x512 icon PNG in assets/
$assetsDir = Join-Path $rootDir "assets"
$iconPngPath = Join-Path $assetsDir "icon.png"
$masked.Save($iconPngPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved 512x512 master icon to: $iconPngPath"

# Build multi-res Windows ICO
$iconIcoPath = Join-Path $assetsDir "icon.ico"
$sizes = @(16, 24, 32, 48, 64, 128, 256)
Build-Ico $masked $sizes $iconIcoPath

# Build directory (electron-builder convention)
$buildDir = Join-Path $rootDir "build"
if (-not (Test-Path $buildDir)) {
    New-Item -ItemType Directory -Path $buildDir -Force | Out-Null
}
Copy-Item -Path $iconIcoPath -Destination (Join-Path $buildDir "icon.ico") -Force
Copy-Item -Path $iconPngPath -Destination (Join-Path $buildDir "icon.png") -Force

# Public directory (Vite dev & static assets)
$publicDir = Join-Path $rootDir "public"
if (-not (Test-Path $publicDir)) {
    New-Item -ItemType Directory -Path $publicDir -Force | Out-Null
}
Copy-Item -Path $iconPngPath -Destination (Join-Path $publicDir "logo.png") -Force
Copy-Item -Path $iconPngPath -Destination (Join-Path $publicDir "icon.png") -Force
Copy-Item -Path $iconIcoPath -Destination (Join-Path $publicDir "favicon.ico") -Force

# AppX / MSIX tile assets
$appxSizes = @(
    @{ Name = "Square44x44Logo.png"; W = 44; H = 44 },
    @{ Name = "Square71x71Logo.png"; W = 71; H = 71 },
    @{ Name = "Square150x150Logo.png"; W = 150; H = 150 },
    @{ Name = "Square310x310Logo.png"; W = 310; H = 310 },
    @{ Name = "StoreLogo.png"; W = 50; H = 50 }
)
foreach ($item in $appxSizes) {
    $res = Resize-Bitmap $masked $item.W $item.H
    $targetBuildPath = Join-Path $buildDir $item.Name
    $res.Save($targetBuildPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $targetAssetPath = Join-Path $assetsDir $item.Name
    $res.Save($targetAssetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $res.Dispose()
    Write-Host "Generated AppX asset: $($item.Name)"
}

$masked.Dispose()
$cropped.Dispose()
$rawImg.Dispose()
Write-Host "Icon generation completed successfully!" -ForegroundColor Green
