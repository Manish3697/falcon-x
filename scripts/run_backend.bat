@echo off
echo Starting FALCON-X Backend Server (Flask + SQLite)...
cd /d "%~dp0..\backend"
python app.py
pause
