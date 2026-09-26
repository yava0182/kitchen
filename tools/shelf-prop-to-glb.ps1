<#
.SYNOPSIS
  Архив/FBX/OBJ с сайтов (без GLB) → один GLB в public/models/shelf-props/

.EXAMPLE
  .\tools\shelf-prop-to-glb.ps1 "C:\Users\Admin\Downloads\folded-things-1.rar"

.EXAMPLE
  .\tools\shelf-prop-to-glb.ps1 "C:\Users\Admin\Downloads\model.zip" -Name my-stack -Decimate 0.2

.NOTES
  Нужны: 7-Zip, Blender 5.x. Каталог / полки не трогает — только файл GLB.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$InputPath,

  [string]$Name = "",

  [string]$OutDir = "",

  [string]$MapsDir = "",

  [ValidateRange(0.0, 1.0)]
  [double]$Decimate = 0.0,

  [int]$JpegQuality = 82,

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
$blenderScript = Join-Path $repoTools "shelf-prop-to-glb-blender.py"
if (-not (Test-Path -LiteralPath $blenderScript)) {
  throw "Missing blender script: $blenderScript"
}

if (-not $OutDir) {
  $OutDir = Join-Path $repoRoot "public\models\shelf-props"
}
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$seven = Resolve-Tool $SevenZipExe @(
  "C:\Program Files\7-Zip\7z.exe",
  "C:\Program Files (x86)\7-Zip\7z.exe"
)
$blender = Resolve-Tool $BlenderExe @(
  "C:\Program Files\Blender Foundation\Blender 5.0\blender.exe",
  "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe",
  "C:\Program Files\Blender Foundation\Blender 4.4\blender.exe",
  "C:\Program Files\Blender Foundation\Blender 4.3\blender.exe",
  "C:\Program Files\Blender Foundation\Blender 4.2\blender.exe"
)
if (-not $blender) { throw "Blender not found. Pass -BlenderExe" }
if (-not (Test-Path -LiteralPath $InputPath)) { throw "Input not found: $InputPath" }

$InputPath = (Resolve-Path -LiteralPath $InputPath).Path
$ext = [IO.Path]::GetExtension($InputPath).ToLowerInvariant()
$workRoot = Join-Path $env:TEMP ("cld-shelf-prop-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
New-Item -ItemType Directory -Path $workRoot | Out-Null

$modelPath = $null

try {
  if ($ext -in @(".rar", ".zip", ".7z")) {
    if (-not $seven) { throw "7-Zip not found. Pass -SevenZipExe (needed for archives)" }
    Write-Host "Extract: $InputPath"
    & $seven x $InputPath "-o$workRoot" -y | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "7-Zip failed with code $LASTEXITCODE" }
  }
  elseif ($ext -in @(".fbx", ".obj", ".gltf", ".glb")) {
    $modelPath = $InputPath
  }
  elseif ((Get-Item -LiteralPath $InputPath).PSIsContainer) {
    $workRoot = $InputPath
  }
  else {
    throw "Unsupported input: $ext (use .rar/.zip/.7z/.fbx/.obj/.glb or a folder)"
  }

  if (-not $modelPath) {
    $prefer = @("*.fbx", "*.obj", "*.gltf", "*.glb")
    foreach ($pat in $prefer) {
      $hit = Get-ChildItem -LiteralPath $workRoot -Recurse -File -Filter $pat |
        Where-Object { $_.FullName -notmatch '\\max\\' } |
        Sort-Object Length -Descending |
        Select-Object -First 1
      if ($hit) {
        $modelPath = $hit.FullName
        break
      }
    }
    if (-not $modelPath) { throw "No FBX/OBJ/GLTF found inside: $workRoot" }
  }

  # Blender 5: FBX version < 7100 не импортируется → соседний OBJ.
  if ($modelPath -match '\.fbx$') {
    $fbxVer = $null
    try {
      $bytes = [IO.File]::ReadAllBytes($modelPath)
      $asciiHead = [Text.Encoding]::ASCII.GetString($bytes, 0, [Math]::Min(48, $bytes.Length))
      if ($asciiHead.StartsWith("Kaydara FBX Binary")) {
        $fbxVer = [BitConverter]::ToInt32($bytes, 23)
      }
    } catch { $fbxVer = $null }
    if ($fbxVer -ne $null -and $fbxVer -lt 7100) {
      $objSibling = [IO.Path]::ChangeExtension($modelPath, ".obj")
      if (-not (Test-Path -LiteralPath $objSibling)) {
        $dir = Split-Path $modelPath -Parent
        $objSibling = Get-ChildItem -LiteralPath $dir -Filter "*.obj" -File -ErrorAction SilentlyContinue |
          Sort-Object Length -Descending |
          Select-Object -First 1 -ExpandProperty FullName
      }
      if ($objSibling -and (Test-Path -LiteralPath $objSibling)) {
        Write-Host "FBX version $fbxVer < 7100 (Blender unsupported) → OBJ: $objSibling"
        $modelPath = $objSibling
      } else {
        throw "FBX version $fbxVer unsupported by Blender (need 7100+). No OBJ next to it."
      }
    }
  }

  # Auto-detect maps/ next to model (export/../maps) if -MapsDir not passed
  if (-not $MapsDir) {
    $modelDir = Split-Path $modelPath -Parent
    $parentDir = Split-Path $modelDir -Parent
    foreach ($cand in @(
      (Join-Path $modelDir "maps"),
      (Join-Path $modelDir "Maps"),
      (Join-Path $parentDir "maps"),
      (Join-Path $parentDir "Maps")
    )) {
      if (Test-Path -LiteralPath $cand) {
        $nImg = @(Get-ChildItem -LiteralPath $cand -Recurse -File -Include *.jpg,*.jpeg,*.png,*.webp,*.tga,*.tif,*.tiff,*.bmp -ErrorAction SilentlyContinue).Count
        if ($nImg -gt 0) {
          $MapsDir = $cand
          Write-Host "Maps  : $MapsDir ($nImg images)"
          break
        }
      }
    }
  }

  if (-not $Name) {
    if ($ext -in @(".rar", ".zip", ".7z")) {
      $Name = [IO.Path]::GetFileNameWithoutExtension($InputPath)
    }
    else {
      $Name = [IO.Path]::GetFileNameWithoutExtension($modelPath)
    }
  }
  $safe = ($Name -replace '[^\w\-]+', '-').Trim('-').ToLowerInvariant()
  if (-not $safe) { $safe = "shelf-prop" }
  $outGlb = Join-Path $OutDir ($safe + ".glb")

  Write-Host "Model : $modelPath"
  Write-Host "Out   : $outGlb"
  if ($Decimate -gt 0) { Write-Host "Decimate: $Decimate" }

  $argList = @(
    "--background",
    "--python", $blenderScript,
    "--",
    "--input", $modelPath,
    "--output", $outGlb,
    "--jpeg-quality", "$JpegQuality"
  )
  if ($MapsDir) {
    if (-not (Test-Path -LiteralPath $MapsDir)) { throw "MapsDir not found: $MapsDir" }
    $argList += @("--maps", (Resolve-Path -LiteralPath $MapsDir).Path)
  }
  if ($Decimate -gt 0) {
    $argList += @("--decimate", ("{0:0.###}" -f $Decimate))
  }

  # Blender пишет warnings в stderr — не валим скрипт из‑за DeprecationWarning
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $blender @argList
  $blendExit = $LASTEXITCODE
  $ErrorActionPreference = $prevEap
  if ($blendExit -ne 0) { throw "Blender failed with code $blendExit" }
  if (-not (Test-Path -LiteralPath $outGlb)) { throw "GLB was not written: $outGlb" }
  $ageSec = [DateTime]::UtcNow.Subtract((Get-Item -LiteralPath $outGlb).LastWriteTimeUtc).TotalSeconds
  if ($ageSec -gt 120) { throw "GLB looks stale (not updated by this run): $outGlb" }

  $len = (Get-Item -LiteralPath $outGlb).Length
  Write-Host ("DONE  {0}  ({1:N2} MB)" -f $outGlb, ($len / 1MB))
  Write-Host "Next: open in viewer → if OK, ask to wire catalog card."
  return $outGlb
}
finally {
  if ($ext -in @(".rar", ".zip", ".7z") -and (Test-Path -LiteralPath $workRoot)) {
    Remove-Item -LiteralPath $workRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}
