@echo off
chcp 65001 > nul
title Syntropy - Lanceur Rapide (V2.6.10)
color 0D

echo =====================================================================
echo                     SYNTROPY OS (V2.6.10)
echo =====================================================================
echo.
echo  Projet  : Syntropy (Systeme de Productivite & Connaissances)
echo  Dossier : %~dp0
echo  Version : 2.6.10
echo.
echo ---------------------------------------------------------------------

cd /d "%~dp0"

echo [1/3] Verification de l environnement...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n a pas ete trouve dans le PATH.
    echo Veuillez verifier votre installation de Node.js.
    pause
    exit /b 1
)

echo [2/3] Preparation de l ouverture automatique du navigateur...
start /b "" powershell -NoProfile -Command "while (-not (Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -InformationLevel Quiet)) { Start-Sleep -Milliseconds 600 }; Start-Process 'http://localhost:3000'"

echo [3/3] Demarrage du serveur de developpement Next.js...
echo.
echo =====================================================================
echo   Syntropy est en cours d execution !
echo   Pour arreter le serveur, fermez cette fenetre ou faites Ctrl + C.
echo =====================================================================
echo.

call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [!] Tentative alternative dans le sous-dossier second-brain-os...
    cd /d "%~dp0second-brain-os"
    call npm run dev
)

pause
