@echo off
chcp 65001 > nul
title Syntropy OS - Synchronisation & Deploiement (V2.6.8)
color 0A

echo =====================================================================
echo           SYNTROPY OS - SYNCHRONISATION COMPLETE (V2.6.8)
echo =====================================================================
echo.
echo  Dossier : %~dp0
echo  Version : 2.6.8
echo.
echo  Cette commande va :
echo   1. Fermer les instances en cours pour liberer les fichiers
echo   2. Compiler la derniere version Web pour la production (out/)
echo   3. Deployer sur Firebase Hosting (version en ligne pour navigateur)
echo   4. Packager l'executable officiel Windows (.exe)
echo.
echo ---------------------------------------------------------------------

cd /d "%~dp0"

echo [0/3] Liberation des fichiers verrouilles...
taskkill /F /IM "Syntropy OS.exe" >nul 2>&1
taskkill /F /IM "electron.exe" >nul 2>&1
if exist "dist\builder-debug.yml" del /f /q "dist\builder-debug.yml" >nul 2>&1

echo.
echo [1/3] Compilation Web en cours...
call npm run build
if %errorlevel% neq 0 (
    echo [ERREUR] Echec de la compilation Web.
    pause
    exit /b 1
)

echo.
echo [2/3] Deploiement sur Firebase Hosting (navigateur)...
call npm run deploy
if %errorlevel% neq 0 (
    echo [ATTENTION] Le deploiement Firebase a echoue. Verifiez votre connexion ou 'firebase login'.
)

echo.
echo [3/3] Packaging de l'executable officiel Windows...
call npm run build:win
if %errorlevel% neq 0 (
    echo [ATTENTION] Le packaging Windows a echoue.
)

echo.
echo =====================================================================
echo   Synchronisation terminee avec succes pour la version 2.6.8 !
echo =====================================================================
echo.
pause
