@echo off
cd /d "%~dp0"
python station_editor.py
if errorlevel 1 pause
