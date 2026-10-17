@echo off
chcp 65001 > nul
title Syntropy OS Desktop (V2.6.5)
color 05

echo =====================================================================
echo                  SYNTROPY OS - APPLICATION DESKTOP (V2.6.5)
echo =====================================================================
echo.
echo  Dossier : %~dp0
echo  Version : 2.6.5
echo.
echo ---------------------------------------------------------------------

cd /d "%~dp0"

echo [1/1] Demarrage de Syntropy OS Desktop...
echo.

if exist "node_modules\electron\dist\electron.exe" (
    echo [INFO] Moteur Desktop detecte, lancement de l application...
    start "" "node_modules\electron\dist\electron.exe" "%~dp0."
    echo.
    echo =====================================================================
    echo   Syntropy OS Desktop a ete lance avec succes !
    echo   Cette fenetre se fermera automatiquement dans 3 secondes.
    echo =====================================================================
    ping 127.0.0.1 -n 3 > nul
    exit /b 0
)

echo [INFO] Moteur autonome non trouve, tentative via npm run dev:desktop...
call npm run dev:desktop

if %errorlevel% neq 0 (
    echo.
    echo =====================================================================
    echo [ERREUR] Impossible de demarrer l application Desktop.
    echo Verifiez vos dependances ou executez : npm install
    echo =====================================================================
    echo.
    pause
)
