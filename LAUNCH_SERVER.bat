@echo off
chcp 65001 >nul
echo ========================================
echo   Запуск сервера разработки
echo ========================================
echo.

cd /d "%~dp0"

echo Останавливаю старые процессы Node.js...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo Проверяю зависимости...
if not exist "node_modules" (
    echo [УСТАНОВКА] Устанавливаю зависимости...
    call npm install
    if errorlevel 1 (
        echo [ОШИБКА] Не удалось установить зависимости
        pause
        exit /b 1
    )
)

echo.
echo Запускаю dev-серверы:
echo   Frontend (Vite):   http://localhost:8100/
echo   Backend (API):     http://localhost:8101/
echo.
echo Доступные конструкторы (через Vite на 8100):
echo   1. Основной:   http://localhost:8100/
echo.
echo Нажмите Ctrl+C для остановки сервера
echo.

npm run dev:all

pause

