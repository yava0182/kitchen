<#
.SYNOPSIS
  Архив/FBX/OBJ окон и дверей → отдельные GLB + текстуры из maps/
  Отдельно от стопок (shelf-prop-to-glb.ps1).

.EXAMPLE
  .\tools\opening-to-glb.ps1 "C:\Users\Admin\Downloads\windows.rar" -Type window

.EXAMPLE
  .\tools\opening-to-glb.ps1 "C:\Users\Admin\Downloads\door.rar" -Type door

.NOTES
  Нужны: 7-Zip, Blender 5.x.
  По умолчанию: разбивка набора на отдельные GLB + привязка maps/ + удаление сфер-хелперов.
  -Type window → public\models\windows
  -Type door   → public\models\doors
  -NoSplit     → один общий GLB (редко нужно)
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$InputPath,

  [ValidateSet("window", "door")]
  [string]$Type = "window",

  [string]$Name = "",

  [string]$OutDir = "",

  [string]$MapsDir = "",

  [ValidateRange(0.0, 1.0)]
  [double]$Decimate = 0.0,

  [int]$JpegQuality = 82,

  [switch]$NoSplit,

  [switch]$KeepHelpers,

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
$blenderScript = Join-Path $repoTools "opening-to-glb-blender.py"
$splitScript = Join-Path $repoTools "opening-to-glb-split-blender.py"
if (-not (Test-Path -LiteralPath $blenderScript)) {
  throw "Missing blender script: $blenderScript"
}

if (-not $OutDir) {
  $sub = if ($Type -eq "door") { "doors" } else { "windows" }
  $OutDir = Join-Path $repoRoot "public\models\$sub"
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
$workRoot = Join-Path $env:TEMP ("cld-opening-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
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
  if (-not $safe) { $safe = $Type }

  Write-Host "Type  : $Type"
  Write-Host "Model : $modelPath"
  Write-Host "OutDir: $OutDir"
  if ($Decimate -gt 0) { Write-Host "Decimate: $Decimate" }

  $doSplit = -not $NoSplit.IsPresent
  Write-Host ("Split : {0} (textures from maps/)" -f ($(if ($doSplit) { "yes" } else { "no" })))

  function Invoke-Blender([string[]]$ExtraArgs) {
    $argList = @(
      "--background",
      "--python", $ExtraArgs[0],
      "--"
    ) + $ExtraArgs[1..($ExtraArgs.Length - 1)]
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & $blender @argList
    $code = $LASTEXITCODE
    $ErrorActionPreference = $prevEap
    if ($code -ne 0) { throw "Blender failed with code $code" }
  }

  if ($doSplit) {
    if (-not (Test-Path -LiteralPath $splitScript)) {
      throw "Missing split script: $splitScript"
    }
    $blendArgs = @(
      $splitScript,
      "--input", $modelPath,
      "--out-dir", $OutDir,
      "--prefix", $safe,
      "--kind", $Type,
      "--jpeg-quality", "$JpegQuality"
    )
    if ($MapsDir) { $blendArgs += @("--maps", (Resolve-Path -LiteralPath $MapsDir).Path) }
    if ($Decimate -gt 0) { $blendArgs += @("--decimate", ("{0:0.###}" -f $Decimate)) }
    if ($KeepHelpers) { $blendArgs += "--keep-helpers" }
    Invoke-Blender $blendArgs
    Write-Host "DONE  split+textures → $OutDir"
    Get-ChildItem -LiteralPath $OutDir -Filter ($safe + "-*.glb") | ForEach-Object {
      Write-Host ("  {0}  ({1:N2} MB)" -f $_.Name, ($_.Length / 1MB))
    }
    return $OutDir
  }

  $outGlb = Join-Path $OutDir ($safe + ".glb")
  Write-Host "Out   : $outGlb"
  $blendArgs = @(
    $blenderScript,
    "--input", $modelPath,
    "--output", $outGlb,
    "--jpeg-quality", "$JpegQuality"
  )
  if ($MapsDir) { $blendArgs += @("--maps", (Resolve-Path -LiteralPath $MapsDir).Path) }
  if ($Decimate -gt 0) { $blendArgs += @("--decimate", ("{0:0.###}" -f $Decimate)) }
  if ($KeepHelpers) { $blendArgs += "--keep-helpers" }
  Invoke-Blender $blendArgs

  if (-not (Test-Path -LiteralPath $outGlb)) { throw "GLB was not written: $outGlb" }
  $ageSec = [DateTime]::UtcNow.Subtract((Get-Item -LiteralPath $outGlb).LastWriteTimeUtc).TotalSeconds
  if ($ageSec -gt 180) { throw "GLB looks stale (not updated by this run): $outGlb" }

  $len = (Get-Item -LiteralPath $outGlb).Length
  Write-Host ("DONE  {0}  ({1:N2} MB)" -f $outGlb, ($len / 1MB))
  Write-Host "Next: open in viewer → if OK, wire catalog card (modelUrl)."
  return $outGlb
}
finally {
  if ($ext -in @(".rar", ".zip", ".7z") -and (Test-Path -LiteralPath $workRoot)) {
    Remove-Item -LiteralPath $workRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}
