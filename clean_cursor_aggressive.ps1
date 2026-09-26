# Агрессивная очистка Cursor - освобождение до 3+ GB
$ErrorActionPreference = "SilentlyContinue"

$cursorPath = "C:\Users\Admin\AppData\Roaming\Cursor"

if (-not (Test-Path $cursorPath)) {
    Write-Host "Папка не найдена!" -ForegroundColor Red
    exit
}

Write-Host "=== АГРЕССИВНАЯ ОЧИСТКА CURSOR ===" -ForegroundColor Red
Write-Host ""

$totalFreed = 0

# Все возможные папки кеша
$cacheFolders = @(
    "Cache",
    "Code Cache", 
    "GPUCache",
    "ShaderCache",
    "Crashpad",
    "logs",
    "CachedData",
    "CachedExtensions",
    "CachedExtensionVSIXs",
    "blob_storage",
    "IndexedDB",
    "Local Storage",
    "Session Storage"
)

Write-Host "1. Удаление папок кеша..." -ForegroundColor Yellow
foreach ($folder in $cacheFolders) {
    $folderPath = Join-Path $cursorPath $folder
    if (Test-Path $folderPath) {
        $size = (Get-ChildItem $folderPath -Recurse -File -ErrorAction SilentlyContinue | 
                 Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
        
        if ($size -gt 0) {
            $sizeGB = [math]::Round($size / 1GB, 2)
            Write-Host "   Удаляю: $folder ($sizeGB GB)" -ForegroundColor Cyan
            Remove-Item $folderPath -Recurse -Force -ErrorAction SilentlyContinue
            $totalFreed += $size
        }
    }
}

# Очистка workspaceStorage - старые проекты
Write-Host ""
Write-Host "2. Очистка старых workspaceStorage (старше 30 дней)..." -ForegroundColor Yellow
$wsPath = Join-Path $cursorPath "User\workspaceStorage"
if (Test-Path $wsPath) {
    $cutoffDate = (Get-Date).AddDays(-30)
    $oldWorkspaces = Get-ChildItem $wsPath -Directory -ErrorAction SilentlyContinue | 
                    Where-Object { $_.LastWriteTime -lt $cutoffDate }
    
    foreach ($ws in $oldWorkspaces) {
        $size = (Get-ChildItem $ws.FullName -Recurse -File -ErrorAction SilentlyContinue | 
                 Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
        if ($size -gt 0) {
            $sizeGB = [math]::Round($size / 1GB, 2)
            Write-Host "   Удаляю workspace: $($ws.Name) ($sizeGB GB)" -ForegroundColor Cyan
            Remove-Item $ws.FullName -Recurse -Force -ErrorAction SilentlyContinue
            $totalFreed += $size
        }
    }
}

# Очистка логов в User
Write-Host ""
Write-Host "3. Очистка логов..." -ForegroundColor Yellow
$logPaths = @(
    (Join-Path $cursorPath "User\logs"),
    (Join-Path $cursorPath "logs")
)

foreach ($logPath in $logPaths) {
    if (Test-Path $logPath) {
        $logs = Get-ChildItem $logPath -Recurse -File -ErrorAction SilentlyContinue
        $logSize = ($logs | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
        if ($logSize -gt 0) {
            $logSizeMB = [math]::Round($logSize / 1MB, 2)
            Write-Host "   Удаляю логи ($logSizeMB MB)" -ForegroundColor Cyan
            Remove-Item $logPath -Recurse -Force -ErrorAction SilentlyContinue
            $totalFreed += $logSize
        }
    }
}

# Итоги
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
$totalGB = [math]::Round($totalFreed / 1GB, 2)
$totalMB = [math]::Round($totalFreed / 1MB, 2)

if ($totalFreed -gt 0) {
    Write-Host "ОСВОБОЖДЕНО: $totalGB GB ($totalMB MB)" -ForegroundColor Green
} else {
    Write-Host "Нечего удалять" -ForegroundColor Gray
}

# Текущий размер
$currentSize = (Get-ChildItem $cursorPath -Recurse -File -ErrorAction SilentlyContinue | 
               Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
$currentGB = [math]::Round($currentSize / 1GB, 2)
Write-Host "Текущий размер папки: $currentGB GB" -ForegroundColor Yellow

Write-Host ""
Write-Host "Нажмите любую клавишу для выхода..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
