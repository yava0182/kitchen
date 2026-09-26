# Скрипт для очистки диска C:
# Освобождает ~10+ ГБ места

Write-Host "=== Очистка диска C: ===" -ForegroundColor Cyan
Write-Host ""
$totalFreed = 0

# 1. Очистка временных файлов
Write-Host "1. Очистка временных файлов..." -ForegroundColor Yellow
$tempPaths = @(
    "C:\Users\Admin\AppData\Local\Temp\*",
    "C:\Windows\Temp\*"
)
foreach ($path in $tempPaths) {
    if (Test-Path (Split-Path $path -Parent)) {
        $size = (Get-ChildItem $path -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        $sizeMB = [math]::Round($size / 1MB, 2)
        if ($sizeMB -gt 0) {
            Write-Host "   Очистка: $path ($sizeMB МБ)" -ForegroundColor Gray
            Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
            $totalFreed += $size
        }
    }
}
Write-Host "   Готово!" -ForegroundColor Green

# 2. Очистка npm кэша (1.64 ГБ)
Write-Host "2. Очистка npm кэша..." -ForegroundColor Yellow
$npmCachePath = "C:\Users\Admin\AppData\Local\npm-cache"
if (Test-Path $npmCachePath) {
    $npmSize = (Get-ChildItem $npmCachePath -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $npmSizeGB = [math]::Round($npmSize / 1GB, 2)
    Write-Host "   Размер: $npmSizeGB ГБ" -ForegroundColor Gray
    Remove-Item "$npmCachePath\*" -Recurse -Force -ErrorAction SilentlyContinue
    $totalFreed += $npmSize
    Write-Host "   Готово!" -ForegroundColor Green
}

# 3. Очистка кэша Kaspersky (отчеты - 2.29 ГБ)
Write-Host "3. Очистка отчетов Kaspersky..." -ForegroundColor Yellow
$kasperskyReportPath = "C:\ProgramData\Kaspersky Lab\AVP21.3\Report"
if (Test-Path $kasperskyReportPath) {
    $kaspSize = (Get-ChildItem $kasperskyReportPath -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $kaspSizeGB = [math]::Round($kaspSize / 1GB, 2)
    Write-Host "   Размер отчетов: $kaspSizeGB ГБ" -ForegroundColor Gray
    Remove-Item "$kasperskyReportPath\*" -Recurse -Force -ErrorAction SilentlyContinue
    $totalFreed += $kaspSize
    Write-Host "   Готово!" -ForegroundColor Green
}

# 4. Очистка кэша браузера Kaspersky SafeBrowser (1.2 ГБ)
Write-Host "4. Очистка кэша Kaspersky SafeBrowser..." -ForegroundColor Yellow
$safeBrowserPath = "C:\ProgramData\Kaspersky Lab\SafeBrowser\Common"
if (Test-Path $safeBrowserPath) {
    $browserSize = (Get-ChildItem $safeBrowserPath -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $browserSizeGB = [math]::Round($browserSize / 1GB, 2)
    Write-Host "   Размер кэша: $browserSizeGB ГБ" -ForegroundColor Gray
    Write-Host "   ВНИМАНИЕ: Это очистит кэш браузера Kaspersky" -ForegroundColor Yellow
    Remove-Item "$safeBrowserPath\*\Chrome\*\Cache\*" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item "$safeBrowserPath\*\YandexBrowser\*\Cache\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   Готово!" -ForegroundColor Green
}

# 5. Очистка кэша Google Chrome (если есть)
Write-Host "5. Очистка кэша Google Chrome..." -ForegroundColor Yellow
$chromeCachePath = "C:\Users\Admin\AppData\Local\Google\Chrome\User Data\Default\Cache"
if (Test-Path $chromeCachePath) {
    $chromeSize = (Get-ChildItem $chromeCachePath -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $chromeSizeMB = [math]::Round($chromeSize / 1MB, 2)
    Write-Host "   Размер кэша: $chromeSizeMB МБ" -ForegroundColor Gray
    Remove-Item "$chromeCachePath\*" -Recurse -Force -ErrorAction SilentlyContinue
    $totalFreed += $chromeSize
    Write-Host "   Готово!" -ForegroundColor Green
}

# 6. Очистка кэша pip (Python пакеты)
Write-Host "6. Очистка кэша pip..." -ForegroundColor Yellow
$pipCachePath = "C:\Users\Admin\AppData\Local\pip\cache"
if (Test-Path $pipCachePath) {
    $pipSize = (Get-ChildItem $pipCachePath -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $pipSizeMB = [math]::Round($pipSize / 1MB, 2)
    Write-Host "   Размер: $pipSizeMB МБ" -ForegroundColor Gray
    Remove-Item "$pipCachePath\*" -Recurse -Force -ErrorAction SilentlyContinue
    $totalFreed += $pipSize
    Write-Host "   Готово!" -ForegroundColor Green
}

# 7. Очистка старых обновлений Windows (WinSxS - только через DISM)
Write-Host "7. Проверка старых обновлений Windows..." -ForegroundColor Yellow
Write-Host "   Для очистки WinSxS используйте: DISM /online /cleanup-image /startcomponentcleanup" -ForegroundColor Gray
Write-Host "   Или: Очистка диска -> Очистка системных файлов -> Обновления Windows" -ForegroundColor Gray

# Итоги
$totalFreedGB = [math]::Round($totalFreed / 1GB, 2)
Write-Host ""
Write-Host "=== Готово! ===" -ForegroundColor Green
Write-Host "Освобождено места: $totalFreedGB ГБ" -ForegroundColor Cyan
Write-Host ""
Write-Host "Дополнительные рекомендации:" -ForegroundColor Yellow
Write-Host "1. Запустите 'Очистку диска' Windows (cleanmgr) для очистки системных файлов" -ForegroundColor Gray
Write-Host "2. Проверьте папку Downloads (2.61 ГБ) - удалите ненужные файлы" -ForegroundColor Gray
Write-Host "3. Проверьте Android эмулятор (2.12 ГБ) - если не используете, можно удалить" -ForegroundColor Gray
Write-Host "4. Проверьте установленные программы в 'Программы и компоненты'" -ForegroundColor Gray




