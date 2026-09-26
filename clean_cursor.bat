@echo off
chcp 65001 >nul
echo ========================================
echo АГРЕССИВНАЯ ОЧИСТКА CURSOR
echo ========================================
echo.

set CURSOR_PATH=C:\Users\Admin\AppData\Roaming\Cursor

if not exist "%CURSOR_PATH%" (
    echo ОШИБКА: Папка не найдена!
    pause
    exit
)

echo Проверяю размер ДО очистки...
powershell -Command "$before = (Get-ChildItem '%CURSOR_PATH%' -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum; Write-Host ('Размер ДО: ' + [math]::Round($before / 1GB, 2) + ' GB')"
echo.

echo Удаляю папки кеша...
if exist "%CURSOR_PATH%\Cache" (
    echo   - Cache
    rd /s /q "%CURSOR_PATH%\Cache" 2>nul
)
if exist "%CURSOR_PATH%\Code Cache" (
    echo   - Code Cache
    rd /s /q "%CURSOR_PATH%\Code Cache" 2>nul
)
if exist "%CURSOR_PATH%\GPUCache" (
    echo   - GPUCache
    rd /s /q "%CURSOR_PATH%\GPUCache" 2>nul
)
if exist "%CURSOR_PATH%\ShaderCache" (
    echo   - ShaderCache
    rd /s /q "%CURSOR_PATH%\ShaderCache" 2>nul
)
if exist "%CURSOR_PATH%\Crashpad" (
    echo   - Crashpad
    rd /s /q "%CURSOR_PATH%\Crashpad" 2>nul
)
if exist "%CURSOR_PATH%\blob_storage" (
    echo   - blob_storage
    rd /s /q "%CURSOR_PATH%\blob_storage" 2>nul
)
if exist "%CURSOR_PATH%\IndexedDB" (
    echo   - IndexedDB
    rd /s /q "%CURSOR_PATH%\IndexedDB" 2>nul
)
if exist "%CURSOR_PATH%\logs" (
    echo   - logs
    rd /s /q "%CURSOR_PATH%\logs" 2>nul
)

echo.
echo Проверяю размер ПОСЛЕ очистки...
powershell -Command "$after = (Get-ChildItem '%CURSOR_PATH%' -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum; $before = (Get-ChildItem '%CURSOR_PATH%' -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum; Write-Host ('Размер ПОСЛЕ: ' + [math]::Round($after / 1GB, 2) + ' GB')"
echo.

echo ========================================
echo ОЧИСТКА ЗАВЕРШЕНА!
echo ========================================
echo.
pause
