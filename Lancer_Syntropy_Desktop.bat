@echo off
chcp 65001 > nul
title Syntropy OS Desktop (V2.6.3)
color 05

echo =====================================================================
echo                  ⚡ SYNTROPY OS — APPLICATION DESKTOP
echo =====================================================================
echo.
echo  Dossier : c:\PROJET ASSISTANT - JARVIS
echo  Version : 2.6.3
echo.
echo ---------------------------------------------------------------------

cd /d "c:\PROJET ASSISTANT - JARVIS"

if exist "dist\win-unpacked\Syntropy OS.exe" (
    echo [1/1] Lancement du binaire desktop compilé (Syntropy OS.exe)...
    start "" "dist\win-unpacked\Syntropy OS.exe"
    exit /b 0
)

echo [1/1] Lancement via le moteur Electron desktop...
call npm run dev:desktop
