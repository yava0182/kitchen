<#
.SYNOPSIS
  collection-clothing.rar → отдельные GLB (вещи / коробки / плечики+одежда).
  Полки и штанги из пака НЕ экспортируются.

.EXAMPLE
  .\tools\collection-clothing-split.ps1 "C:\Users\Admin\Downloads\collection-clothing.rar"

.EXAMPLE
  .\tools\collection-clothing-split.ps1 "C:\Users\Admin\Downloads\collection-clothing.rar" -Decimate 0.2 -Only "rod-shirt01,shelf-box-white"
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$InputPath,

  [string]$OutDir = "",

  [ValidateRange(0.0, 1.0)]
  [double]$Decimate = 0.25,

  [int]$JpegQuality = 82,

  [string]$Only = "",

  [string]$BlenderExe = "",

  [string]$SevenZipExe = ""
)

$ErrorActionPreference = "Stop"

function Resolve-Tool([string]$explicit, [string[]]$candidates) {
  if ($explicit -and (Test-Path -LiteralPath $explicit)) { return $explicit }
  foreach ($c in $candidates) {
    if (Test-Path -LiteralPath $c) { return $c }
  }
  return $null
}

$repoTools = $PSScriptRoot
$repoRoot = Split-Path $repoTools -Parent
$blenderScript = Join-Path $repoTools "collection-clothing-split-blender.py"
if (-not (Test-Path -LiteralPath $blenderScript)) {
  throw "Missing: $blenderScript"
}

if (-not $OutDir) {
  $OutDir = Join-Path $repoRoot "public\models\lifestyle-props\collection-clothing"
}
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$seven = Resolve-Tool $SevenZipExe @(
  "C:\Program Files\7-Zip\7z.exe",
  "C:\Program Files (x86)\7-Zip\7z.exe"
)
$blender = Resolve-Tool $BlenderExe @(
  "C:\Program Files\Blender Foundation\Blender 5.0\blender.exe",
  "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe"
)
if (-not $blender) { throw "Blender not found" }
if (-not (Test-Path -LiteralPath $InputPath)) { throw "Input not found: $InputPath" }

$InputPath = (Resolve-Path -LiteralPath $InputPath).Path
$ext = [IO.Path]::GetExtension($InputPath).ToLowerInvariant()
$workRoot = Join-Path $env:TEMP ("cld-cloth-split-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
New-Item -ItemType Directory -Path $workRoot | Out-Null

try {
  $modelPath = $null
  $mapsPath = ""

  if ($ext -in @(".rar", ".zip", ".7z")) {
    if (-not $seven) { throw "7-Zip required for archives" }
    & $seven x $InputPath "-o$workRoot" -y | Out-Null
    $fbx = Get-ChildItem -LiteralPath $workRoot -Recurse -Filter "*.fbx" |
      Where-Object { $_.FullName -notmatch '\\max\\' } |
      Sort-Object Length -Descending |
      Select-Object -First 1
    if (-not $fbx) { throw "No FBX in archive" }
    $modelPath = $fbx.FullName
    $mapsHit = Get-ChildItem -LiteralPath $workRoot -Recurse -Directory |
      Where-Object { $_.Name -match '^(maps|Maps|textures|Textures)$' } |
      Select-Object -First 1
    if ($mapsHit) { $mapsPath = $mapsHit.FullName }
  }
  elseif ($ext -eq ".fbx") {
    $modelPath = $InputPath
    $parent = Split-Path $InputPath -Parent
    foreach ($cand in @(
        (Join-Path $parent "maps"),
        (Join-Path (Split-Path $parent -Parent) "maps")
      )) {
      if (Test-Path $cand) { $mapsPath = $cand; break }
    }
  }
  else {
    throw "Need .rar/.zip/.fbx"
  }

  Write-Host "Model: $modelPath"
  Write-Host "Maps:  $mapsPath"
  Write-Host "Out:   $OutDir"

  # Сжать maps до 1024 и убрать bump — иначе Blender 5 OOM на FBX (~4k jean/shirt/crate)
  if ($mapsPath -and (Test-Path -LiteralPath $mapsPath)) {
    Write-Host "Preprocess maps (max 1024, drop bump)..."
    python -c @"
from pathlib import Path
from PIL import Image
root = Path(r'$($mapsPath.Replace('\','\\'))')
skip = ('bump', 'opas', 'opacity', 'displacement', 'displace', 'refl', 'reflect')
for p in list(root.rglob('*')):
    if not p.is_file():
        continue
    low = p.name.lower()
    if any(s in low for s in skip):
        p.unlink(missing_ok=True)
        print('DROP', p.name)
        continue
    ext = p.suffix.lower()
    if ext not in ('.jpg', '.jpeg', '.png', '.tga', '.webp'):
        continue
    try:
        im = Image.open(p).convert('RGB')
    except Exception as e:
        print('BAD', p.name, e)
        p.unlink(missing_ok=True)
        continue
    w, h = im.size
    m = max(w, h)
    if m > 1024:
        sc = 1024 / float(m)
        im = im.resize((max(1, int(w*sc)), max(1, int(h*sc))), Image.Resampling.LANCZOS)
    out = p.with_suffix('.jpg')
    im.save(out, 'JPEG', quality=82, optimize=True)
    if out != p:
        p.unlink(missing_ok=True)
    print('OK', out.name, im.size)
"@
  }

  $argList = @(
    "--background",
    "--python", $blenderScript,
    "--",
    "--input", $modelPath,
    "--out-dir", $OutDir,
    "--decimate", "$Decimate",
    "--jpeg-quality", "$JpegQuality"
  )
  if ($mapsPath) {
    $argList += @("--maps", $mapsPath)
  }
  if ($Only) {
    $argList += @("--only", $Only)
  }

  & $blender @argList
  if ($LASTEXITCODE -ne 0) { throw "Blender failed: $LASTEXITCODE" }

  $man = Join-Path $OutDir "manifest.json"
  if (Test-Path $man) {
    Write-Host "DONE manifest: $man"
    Get-ChildItem (Join-Path $OutDir "rod") -Filter "*.glb" -ErrorAction SilentlyContinue |
      ForEach-Object { Write-Host ("  rod/  " + $_.Name + "  " + [math]::Round($_.Length / 1KB) + " KB") }
    Get-ChildItem (Join-Path $OutDir "shelf") -Filter "*.glb" -ErrorAction SilentlyContinue |
      ForEach-Object { Write-Host ("  shelf/" + $_.Name + "  " + [math]::Round($_.Length / 1KB) + " KB") }
  }
}
finally {
  if (Test-Path $workRoot) {
    Remove-Item -LiteralPath $workRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}
