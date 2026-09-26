@echo off
chcp 65001 >nul
echo ========================================
echo   Запуск всех серверов
echo ========================================
echo.
cd /d "%~dp0"
start "Сервер API (3001)" cmd /k "node server-db.js"
timeout /t 2 /nobreak >nul
start "Vite Dev Server (8000)" cmd /k "npm run dev"
echo.
echo Серверы запущены в отдельных окнах!
echo.
echo API сервер: http://localhost:3001
echo Фронтенд:   http://localhost:8000
echo.
pause
