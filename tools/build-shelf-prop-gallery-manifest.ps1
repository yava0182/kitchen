# Regenerates tools/shelf-prop-gallery-manifest.json from disk + catalog kinds.
# Run from repo: .\tools\build-shelf-prop-gallery-manifest.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $root 'public\models'))) {
  $root = $PSScriptRoot + '\..'
  $root = (Resolve-Path $root).Path
}
$base = Join-Path $root 'public\models'
$catalogPath = Join-Path $root 'catalog_items\cabinet_model.json'

function Guess-Kind([string]$name, [string]$path) {
  $s = ($name + ' ' + $path).ToLowerInvariant()
  if ($s -match 'w5-shelf-hat|[\\/_-]hat|hat_classic') { return 'hat' }
  if ($s -match 'shoe|slipper|sneaker|jimmy|tamaris|lakai|choo') { return 'shoes' }
  if ($s -match 'w5-shelf-bag|bag|tote') { return 'bag' }
  if ($s -match 'w5-shelf-box|box|crate|rattan|cardboard') { return 'box' }
  if ($s -match 'rope') { return 'other' }
  if ($s -match 'w5-shelf-stack|fold|stack|tee|shirt|knit|sweater|clothes|denim|addition') { return 'stack' }
  return 'other'
}

$pathToMeta = @{}
if (Test-Path $catalogPath) {
  $cat = Get-Content -LiteralPath $catalogPath -Raw -Encoding UTF8 | ConvertFrom-Json
  foreach ($item in $cat) {
    $models = $item.data.params.models
    if (-not $models) { continue }
    foreach ($m in $models) {
      $url = ([string]$m.model).Replace('\', '/')
      if (-not $url) { continue }
      $pathToMeta[$url] = @{
        kind = ([string]$m.params.kind).ToLowerInvariant()
        catalogId = [string]$item.id
        catalogName = [string]$item.name
      }
    }
  }
}

$dirs = @(
  (Join-Path $base 'shelf-props'),
  (Join-Path $base 'lifestyle-props\collection-clothing\shelf'),
  (Join-Path $base 'lifestyle-props\wardrobe-5\shelf')
)

$items = New-Object System.Collections.Generic.List[object]
foreach ($d in $dirs) {
  if (-not (Test-Path $d)) { continue }
  Get-ChildItem -LiteralPath $d -Recurse -Filter *.glb -File | ForEach-Object {
    $rel = $_.FullName.Substring($base.Length).TrimStart('\').Replace('\', '/')
    $path = "/models/$rel"
    $meta = $pathToMeta[$path]
    $kind = if ($meta -and $meta.kind) { $meta.kind } else { Guess-Kind $_.Name $path }
    $items.Add([ordered]@{
      id           = if ($meta.catalogId) { $meta.catalogId } else { ($rel -replace '[^a-zA-Z0-9]+', '-').ToLowerInvariant() }
      path         = $path
      file         = $_.Name
      folder       = if ($rel -match 'wardrobe-5') { 'wardrobe-5/shelf' } elseif ($rel -match 'collection-clothing') { 'collection-clothing/shelf' } else { 'shelf-props' }
      kind         = $kind
      catalogId    = if ($meta) { $meta.catalogId } else { $null }
      catalogName  = if ($meta) { $meta.catalogName } else { $null }
      bytes        = $_.Length
      mb           = [math]::Round($_.Length / 1MB, 2)
    }) | Out-Null
  }
}

$manifest = [ordered]@{
  generated = (Get-Date).ToString('s')
  count     = $items.Count
  kinds     = @('stack', 'bag', 'shoes', 'box', 'hat', 'other')
  items     = $items
}
$out = Join-Path $root 'tools\shelf-prop-gallery-manifest.json'
($manifest | ConvertTo-Json -Depth 6) | Set-Content -LiteralPath $out -Encoding UTF8
Write-Host "Wrote $($items.Count) items -> $out"
$items | Group-Object kind | Sort-Object Name | ForEach-Object {
  Write-Host ("  {0,-8} {1}" -f $_.Name, $_.Count)
}
Write-Host "Open: tools/shelf-prop-gallery.html (через тот же сервер, что index.html)"
