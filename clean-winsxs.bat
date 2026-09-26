@echo off
echo ========================================
echo Очистка WinSxS (старые компоненты Windows)
echo ========================================
echo.
echo Это может занять несколько минут...
echo.

DISM /online /cleanup-image /startcomponentcleanup

echo.
echo ========================================
echo Очистка завершена!
echo ========================================
echo.
pause




