# Simple progress checker for refactoring
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Refactoring Progress Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check main.js
Write-Host "Source Code Analysis:" -ForegroundColor Yellow
$mainJsPath = "js\main.js"
if (Test-Path $mainJsPath) {
    $mainLines = (Get-Content $mainJsPath | Measure-Object -Line).Lines
    $mainSize = [math]::Round((Get-Item $mainJsPath).Length / 1KB, 2)
    Write-Host "  main.js: $mainLines lines ($mainSize KB)" -ForegroundColor White
}
Write-Host ""

# Check modules
Write-Host "Created Modules:" -ForegroundColor Yellow
$modules = @(
    "utils\state.js",
    "core\init.js",
    "core\renderer.js",
    "core\camera.js",
    "events\mouse-handler.js",
    "ui\scene-icons.js",
    "ui\markers.js",
    "ui\ui-helpers.js",
    "sections\section-manager.js",
    "sections\section-ghost.js",
    "furniture\furniture-manager.js",
    "furniture\furniture-ghost.js"
)

$totalModules = $modules.Count
$existingModules = 0
$totalLines = 0

foreach ($module in $modules) {
    $path = "js\$module"
    if (Test-Path $path) {
        $lines = (Get-Content $path | Measure-Object -Line).Lines
        $size = [math]::Round((Get-Item $path).Length / 1KB, 2)
        $totalLines += $lines
        $existingModules++
        
        $content = Get-Content $path -Raw
        if ($content -match "TODO:|заглушка") {
            Write-Host "  [STUB] $module - $lines lines" -ForegroundColor Yellow
        } else {
            Write-Host "  [DONE] $module - $lines lines" -ForegroundColor Green
        }
    } else {
        Write-Host "  [TODO] $module - NOT CREATED" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Statistics:" -ForegroundColor Yellow
Write-Host "  Modules created: $existingModules / $totalModules" -ForegroundColor White
Write-Host "  Total lines in modules: $totalLines" -ForegroundColor White

$progress = [math]::Round(($existingModules / $totalModules) * 100)
Write-Host "  Progress: $progress%" -ForegroundColor Cyan

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Tell AI: 'Continue refactoring - extract ui/scene-icons.js'" -ForegroundColor White
Write-Host "  2. Read README_REFACTORING.md for details" -ForegroundColor White
Write-Host ""
