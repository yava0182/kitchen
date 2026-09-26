# Clean Cursor cache - frees ~5+ GB
# Run with Cursor CLOSED

Write-Host "=== Cursor cache cleanup ===" -ForegroundColor Cyan
Write-Host ""

$cursorPath = "C:\Users\Admin\AppData\Roaming\Cursor"
$totalFreed = 0

# 1. Remove DB backup files (5+ GB)
Write-Host "1. Removing DB backups..." -ForegroundColor Yellow
$backupFiles = Get-ChildItem "$cursorPath\User\globalStorage" -Filter "*.backup" -Recurse -ErrorAction SilentlyContinue
foreach ($file in $backupFiles) {
    $size = [math]::Round($file.Length / 1GB, 2)
    Write-Host "   Deleting: $($file.Name) ($size GB)" -ForegroundColor Gray
    Remove-Item $file.FullName -Force -ErrorAction SilentlyContinue
    $totalFreed += $file.Length
}

# 2. Clear AI cache (checkpoints)
Write-Host "2. Clearing AI cache (checkpoints)..." -ForegroundColor Yellow
$checkpointsPath = "$cursorPath\User\globalStorage\anysphere.cursor-retrieval\checkpoints"
if (Test-Path $checkpointsPath) {
    $checkpointsSize = (Get-ChildItem $checkpointsPath -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $checkpointsSizeGB = [math]::Round($checkpointsSize / 1GB, 2)
    Write-Host "   Cache size: $checkpointsSizeGB GB" -ForegroundColor Gray
    Remove-Item "$checkpointsPath\*" -Recurse -Force -ErrorAction SilentlyContinue
    $totalFreed += $checkpointsSize
    Write-Host "   Done" -ForegroundColor Green
}

# 3. Clear logs (220+ MB)
Write-Host "3. Clearing logs..." -ForegroundColor Yellow
$logsPath = "$cursorPath\logs"
if (Test-Path $logsPath) {
    $logsSize = (Get-ChildItem $logsPath -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $logsSizeMB = [math]::Round($logsSize / 1MB, 2)
    Write-Host "   Logs size: $logsSizeMB MB" -ForegroundColor Gray
    Remove-Item "$logsPath\*" -Recurse -Force -ErrorAction SilentlyContinue
    $totalFreed += $logsSize
    Write-Host "   Done" -ForegroundColor Green
}

# 4. Clear CachedData (214 MB)
Write-Host "4. Clearing CachedData..." -ForegroundColor Yellow
$cachedDataPath = "$cursorPath\CachedData"
if (Test-Path $cachedDataPath) {
    $cacheSize = (Get-ChildItem $cachedDataPath -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $cacheSizeMB = [math]::Round($cacheSize / 1MB, 2)
    Write-Host "   Cache size: $cacheSizeMB MB" -ForegroundColor Gray
    Remove-Item "$cachedDataPath\*" -Recurse -Force -ErrorAction SilentlyContinue
    $totalFreed += $cacheSize
    Write-Host "   Done" -ForegroundColor Green
}

# 5. Clear GPU cache
Write-Host "5. Clearing GPU cache..." -ForegroundColor Yellow
$gpuCachePath = "$cursorPath\GPUCache"
if (Test-Path $gpuCachePath) {
    Remove-Item "$gpuCachePath\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   Done" -ForegroundColor Green
}

# Summary
$totalFreedGB = [math]::Round($totalFreed / 1GB, 2)
Write-Host ""
Write-Host "=== Complete ===" -ForegroundColor Green
Write-Host "Freed: $totalFreedGB GB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Restart Cursor after cleanup." -ForegroundColor Yellow
