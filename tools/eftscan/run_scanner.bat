@echo off
cd /d "%~dp0"
python scanner.py run
if errorlevel 1 pause
