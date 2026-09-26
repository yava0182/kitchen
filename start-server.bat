@echo off
chcp 65001 >nul
echo ========================================
echo   Запуск сервера на порту 3001
echo ========================================
echo.
cd /d "%~dp0"
node server-db.js
pause
