@echo off
REM Kill only processes listening on the given ports. Does not kill other node.exe.
REM Usage: kill-ports.bat 8100 8101
setlocal EnableExtensions
for %%P in (%*) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
    if not "%%A"=="0" (
      echo   stop PID %%A on port %%P
      taskkill /F /PID %%A >nul 2>&1
    )
  )
)
endlocal
