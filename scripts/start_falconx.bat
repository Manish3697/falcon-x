@echo off
title FALCON-X Launcher
echo ========================================================
echo FALCON-X - Affordable Linux-Based IoT Cybersecurity Platform
echo Team: Vision X
echo ========================================================
echo.
echo Launching Backend and Frontend services...
echo.

start "FALCON-X Backend" cmd /k "cd /d %~dp0..\backend && python app.py"
timeout /t 2 >nul
start "FALCON-X Frontend" cmd /k "cd /d %~dp0..\frontend && npm run dev"

echo Services launched!
echo Backend: http://127.0.0.1:5000
echo Frontend: http://localhost:5173
echo.
