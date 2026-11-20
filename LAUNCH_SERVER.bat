@echo off
REM Kitchen playground launcher. Keep this file ASCII-only (cmd breaks on UTF-8 Cyrillic in IF blocks).
chcp 65001 >nul
echo ========================================
echo   Kitchen playground (Clodis-Kitchen)
echo   Folder: D:\Clodis-Kitchen
echo   Ports:  Vite 8100 / API 8101
echo   Wardrobes 8000/8001 are NOT touched
echo ========================================
echo.

cd /d "%~dp0"

echo Stopping processes on 8100 and 8101 only...
call "%~dp0scripts\kill-ports.bat" 8100 8101
timeout /t 1 >nul

echo Checking dependencies...
if not exist "node_modules\" (
    echo [INSTALL] npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
)

echo.
echo Starting:
echo   Frontend (Vite):   http://localhost:8100/
echo   Backend (API):     http://localhost:8101/
echo   Admin:             http://localhost:8100/admin-new.html
echo.
echo If 8100 is busy, Vite will FAIL (will not silently use 8102).
echo Wardrobes: separate LAUNCH in D:\Clodis-Wardrobes (8000/8001).
echo.
echo Press Ctrl+C to stop
echo.

npm run dev:all

pause
