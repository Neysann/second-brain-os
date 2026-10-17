@echo off
chcp 65001 > nul
title Syntropy OS - Nettoyage du Demarrage Windows
color 0C

echo =====================================================================
echo       NETTOYAGE DU DEMARRAGE AUTOMATIQUE WINDOWS (V2.6.8)
echo =====================================================================
echo.
echo Ce script supprime tout lancement residuel de l'environnement
echo brut "electron.exe" au demarrage de votre session Windows.
echo.
echo ---------------------------------------------------------------------

echo [1/3] Suppression de la cle de registre utilisateur...
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "com.syntropy.os" /f >nul 2>&1
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "electron" /f >nul 2>&1
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "Electron" /f >nul 2>&1

echo [2/3] Verification du dossier de demarrage Startup...
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\electron.lnk" (
    del /f /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\electron.lnk" >nul 2>&1
)
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Electron.lnk" (
    del /f /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Electron.lnk" >nul 2>&1
)

echo [3/3] Fermeture des fenetres Electron residuelles...
taskkill /F /IM "electron.exe" >nul 2>&1

echo.
echo =====================================================================
echo   [SUCCES] L'environnement brut Electron a ete supprime
echo   du demarrage automatique de votre PC !
echo =====================================================================
echo.
echo Vous pouvez desormais demarrer votre PC en toute tranquilite.
echo.
pause
