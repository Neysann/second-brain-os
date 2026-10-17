@echo off
chcp 65001 > nul
title Syntropy OS Desktop (V2.6.4)
color 05

echo =====================================================================
echo                  SYNTROPY OS - APPLICATION DESKTOP
echo =====================================================================
echo.
echo Dossier : c:\PROJET ASSISTANT - JARVIS
echo Version : 2.6.4
echo.
echo ---------------------------------------------------------------------

cd /d "c:\PROJET ASSISTANT - JARVIS"

echo [1/1] Demarrage de Syntropy OS Desktop...
echo.

if exist "node_modules\electron\dist\electron.exe" (
    start "" "node_modules\electron\dist\electron.exe" "electron/main.js"
    exit /b 0
)

call npm run dev:desktop

if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] Impossible de demarrer l application.
    pause
)
