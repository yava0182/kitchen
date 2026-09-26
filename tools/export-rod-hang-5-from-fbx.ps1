<#
.SYNOPSIS
  FBX/RAR → rod-hang-5.glb (5 пар как в сцене + maps).

.EXAMPLE
  .\tools\export-rod-hang-5-from-fbx.ps1 "C:\Users\Admin\Downloads\collection-clothing.rar"
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$InputPath,
  [string]$BlenderExe = "",
  [string]$SevenZipExe = ""
)

$ErrorActionPreference = "Stop"
$repoTools = $PSScriptRoot
$repoRoot = Split-Path $repoTools -Parent
$blenderScript = Join-Path $repoTools "export-rod-hang-5-from-fbx-blender.py"

function Resolve-Tool([string]$explicit, [string[]]$candidates) {
  if ($explicit -and (Test-Path -LiteralPath $explicit)) { return $explicit }
  foreach ($c in $candidates) {
    if (Test-Path -LiteralPath $c) { return $c }
  }
  return $null
}

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
if (-not (Test-Path -LiteralPath $blenderScript)) { throw "Missing $blenderScript" }

$InputPath = (Resolve-Path -LiteralPath $InputPath).Path
$ext = [IO.Path]::GetExtension($InputPath).ToLowerInvariant()
$workRoot = Join-Path $env:TEMP ("cld-hang5-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
New-Item -ItemType Directory -Path $workRoot | Out-Null

try {
  $modelPath = $null
  $mapsPath = ""

  if ($ext -in @(".rar", ".zip", ".7z")) {
    if (-not $seven) { throw "7-Zip required" }
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

  Write-Host "FBX:  $modelPath"
  Write-Host "Maps: $mapsPath"

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
    "--input", $modelPath
  )
  if ($mapsPath) {
    $argList += @("--maps", $mapsPath)
  }
  & $blender @argList
  if ($LASTEXITCODE -ne 0) { throw "Blender exit $LASTEXITCODE" }

  $out = Join-Path $repoRoot "public\models\lifestyle-props\collection-clothing\rod\rod-hang-5.glb"
  Write-Host "OUT: $out"
  if (-not (Test-Path $out)) { throw "Output GLB missing" }
  Write-Host "BYTES:" (Get-Item $out).Length
}
finally {
  if (Test-Path $workRoot) {
    Remove-Item -LiteralPath $workRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}
