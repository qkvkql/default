@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo Running generate_stations.py...
python "%~dp0generate_stations.py"
set "exitCode=%ERRORLEVEL%"

if not "%exitCode%"=="0" (
    echo.
    echo Script finished with an error. Check the messages above.
) else (
    echo.
    echo Script finished.
)
echo.
pause
exit /b %exitCode%