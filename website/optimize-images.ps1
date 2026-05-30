# Optimizes gallery photos in-place: downscales to a max longest edge and
# re-encodes JPEG at a sensible quality, baking in EXIF orientation.
# Safe to re-run: images already within the size limit are skipped.
#
#   powershell -File website/optimize-images.ps1
#
# Optional: -MaxEdge 1600 -Quality 82

param(
    [int]$MaxEdge = 1600,
    [int]$Quality = 82
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = $PSScriptRoot
$dirs = @(
    (Join-Path $root 'assets\gallery\2024'),
    (Join-Path $root 'assets\gallery\2025')
)

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' }

# EXIF orientation (tag 274) -> RotateFlip needed to display upright.
$orientMap = @{
    1 = [System.Drawing.RotateFlipType]::RotateNoneFlipNone
    2 = [System.Drawing.RotateFlipType]::RotateNoneFlipX
    3 = [System.Drawing.RotateFlipType]::Rotate180FlipNone
    4 = [System.Drawing.RotateFlipType]::Rotate180FlipX
    5 = [System.Drawing.RotateFlipType]::Rotate90FlipX
    6 = [System.Drawing.RotateFlipType]::Rotate90FlipNone
    7 = [System.Drawing.RotateFlipType]::Rotate270FlipX
    8 = [System.Drawing.RotateFlipType]::Rotate270FlipNone
}

$processed = 0; $skipped = 0; $before = 0L; $after = 0L

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) { continue }
    Get-ChildItem $dir -File | Where-Object { $_.Extension -match '^\.(jpg|jpeg|png)$' } | ForEach-Object {
        $file = $_
        $before += $file.Length
        $bytes = [IO.File]::ReadAllBytes($file.FullName)
        $ms = New-Object IO.MemoryStream(,$bytes)
        $img = [System.Drawing.Image]::FromStream($ms)

        # Apply EXIF orientation, then drop the tag.
        $orient = 1
        if ($img.PropertyIdList -contains 274) {
            $orient = [int]$img.GetPropertyItem(274).Value[0]
            if ($orientMap.ContainsKey($orient) -and $orient -ne 1) {
                $img.RotateFlip($orientMap[$orient])
            }
            try { $img.RemovePropertyItem(274) } catch {}
        }

        $w = $img.Width; $h = $img.Height
        $maxEdgeNow = [Math]::Max($w, $h)

        if ($maxEdgeNow -le $MaxEdge) {
            # Already small enough; leave the file untouched.
            $img.Dispose(); $ms.Dispose()
            $after += $file.Length
            $skipped++
            return
        }

        $scale = $MaxEdge / [double]$maxEdgeNow
        $nw = [int][Math]::Round($w * $scale)
        $nh = [int][Math]::Round($h * $scale)

        $bmp = New-Object System.Drawing.Bitmap($nw, $nh)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $g.DrawImage($img, 0, 0, $nw, $nh)
        $g.Dispose()

        $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
            [System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)

        $outMs = New-Object IO.MemoryStream
        $bmp.Save($outMs, $jpegCodec, $ep)
        $bmp.Dispose(); $img.Dispose(); $ms.Dispose(); $ep.Dispose()

        [IO.File]::WriteAllBytes($file.FullName, $outMs.ToArray())
        $outMs.Dispose()

        $after += (Get-Item $file.FullName).Length
        $processed++
    }
}

Write-Host ("Optimized: {0}  Skipped (already small): {1}" -f $processed, $skipped)
Write-Host ("Total size: {0} MB -> {1} MB" -f `
    [math]::Round($before/1MB,1), [math]::Round($after/1MB,1))
