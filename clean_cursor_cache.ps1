# Скрипт для очистки ненужных файлов Cursor из AppData\Roaming\Cursor
# ВНИМАНИЕ: Удаляет только кеш и временные файлы, НЕ трогает настройки!

$cursorPath = "C:\Users\Admin\AppData\Roaming\Cursor"

if (-not (Test-Path $cursorPath)) {
    Write-Host "❌ Папка Cursor не найдена: $cursorPath" -ForegroundColor Red
    exit
}

Write-Host "🔍 Очистка папки Cursor..." -ForegroundColor Cyan
Write-Host ""

$totalFreed = 0

# Папки для очистки (кеш и временные файлы)
$foldersToClean = @(
    "Cache",
    "Code Cache",
    "GPUCache",
    "ShaderCache",
    "Crashpad",
    "logs"  # только папка logs, не Logs (если есть)
)

# Файлы для очистки
$patternsToClean = @(
    "*.tmp",
    "*.temp",
    "*.log",
    "*.backup",
    "*.bak",
    "*~"
)

foreach ($folder in $foldersToClean) {
    $folderPath = Join-Path $cursorPath $folder
    if (Test-Path $folderPath) {
        $size = (Get-ChildItem $folderPath -Recurse -ErrorAction SilentlyContinue | 
                 Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
        
        if ($size -gt 0) {
            $sizeMB = [math]::Round($size / 1MB, 2)
            Write-Host "🗑️  Удаление: $folder ($sizeMB MB)" -ForegroundColor Yellow
            
            Remove-Item $folderPath -Recurse -Force -ErrorAction SilentlyContinue
            $totalFreed += $size
            
            if (Test-Path $folderPath) {
                Write-Host "   ⚠️  Не удалось полностью удалить" -ForegroundColor Red
            } else {
                Write-Host "   ✅ Удалено" -ForegroundColor Green
            }
        }
    }
}

# Удаление временных файлов по паттернам
Write-Host ""
Write-Host "🔍 Поиск временных файлов..." -ForegroundColor Cyan

foreach ($pattern in $patternsToClean) {
    $files = Get-ChildItem $cursorPath -Recurse -Include $pattern -ErrorAction SilentlyContinue
    if ($files) {
        $filesSize = ($files | Measure-Object -Property Length -Sum).Sum
        $filesSizeMB = [math]::Round($filesSize / 1MB, 2)
        Write-Host "🗑️  Удаление $pattern ($filesSizeMB MB, $($files.Count) файлов)" -ForegroundColor Yellow
        
        $files | Remove-Item -Force -ErrorAction SilentlyContinue
        $totalFreed += $filesSize
        Write-Host "   ✅ Удалено" -ForegroundColor Green
    }
}

# Старые логи (старше 30 дней)
Write-Host ""
Write-Host "🔍 Поиск старых логов (старше 30 дней)..." -ForegroundColor Cyan
$cutoffDate = (Get-Date).AddDays(-30)
$logFiles = Get-ChildItem $cursorPath -Recurse -Include "*.log" -ErrorAction SilentlyContinue | 
            Where-Object { $_.LastWriteTime -lt $cutoffDate }

if ($logFiles) {
    $logSize = ($logFiles | Measure-Object -Property Length -Sum).Sum
    $logSizeMB = [math]::Round($logSize / 1MB, 2)
    Write-Host "🗑️  Удаление старых логов ($logSizeMB MB, $($logFiles.Count) файлов)" -ForegroundColor Yellow
    
    $logFiles | Remove-Item -Force -ErrorAction SilentlyContinue
    $totalFreed += $logSize
    Write-Host "   ✅ Удалено" -ForegroundColor Green
}

# Итоги
Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
$totalFreedMB = [math]::Round($totalFreed / 1MB, 2)
$totalFreedGB = [math]::Round($totalFreed / 1GB, 2)

if ($totalFreed -gt 0) {
    Write-Host "✅ Очистка завершена!" -ForegroundColor Green
    Write-Host "💾 Освобождено места: $totalFreedMB MB ($totalFreedGB GB)" -ForegroundColor Yellow
} else {
    Write-Host "ℹ️  Нечего удалять (все уже чисто)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📁 Текущий размер папки Cursor:" -ForegroundColor Cyan
$currentSize = (Get-ChildItem $cursorPath -Recurse -ErrorAction SilentlyContinue | 
               Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
$currentSizeMB = [math]::Round($currentSize / 1MB, 2)
$currentSizeGB = [math]::Round($currentSize / 1GB, 2)
Write-Host "   $currentSizeMB MB ($currentSizeGB GB)" -ForegroundColor White
