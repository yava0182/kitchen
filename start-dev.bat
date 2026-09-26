@echo off
chcp 65001 >nul
echo ========================================
echo   Запуск Vite (фронтенд) на порту 8000
echo ========================================
echo.
cd /d "%~dp0"
npm run dev
pause
