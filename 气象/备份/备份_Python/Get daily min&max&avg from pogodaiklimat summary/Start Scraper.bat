@echo off
title Pogodaiklimat Daily Weather Scraper
cd /d "%~dp0"
py "%~dp0web_console.py"
if errorlevel 1 (
    echo.
    echo The scraper could not start. Check that Python is installed and dependencies are available.
    pause
)
