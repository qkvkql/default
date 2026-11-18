@echo off
setlocal
cd /d "%~dp0"

echo Starting Color-coded Isotherm Map server...
echo Open http://127.0.0.1:5000 in your browser.
echo.

start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; $paths=@((Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'), (Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'), (Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe')); $chrome=$paths | Where-Object { Test-Path $_ } | Select-Object -First 1; if ($chrome) { Start-Process -FilePath $chrome -ArgumentList 'http://127.0.0.1:5000' } else { Start-Process chrome 'http://127.0.0.1:5000' }"

if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" app.py
) else (
    python app.py
)

if errorlevel 1 (
    echo.
    echo The server stopped with an error. Check the message above.
    echo If Python or project dependencies are missing, install them first.
    pause
)
endlocal
