@echo off
chcp 65001 > nul
title Syntropy OS Desktop (V2.6.15)
color 05

echo =====================================================================
echo                  SYNTROPY OS - APPLICATION OFFICIELLE (V2.6.15)
echo =====================================================================
echo.
echo  Dossier : %~dp0
echo  Version : 2.6.15
echo.
echo ---------------------------------------------------------------------

cd /d "%~dp0"

echo [1/1] Recherche de l'application officielle Syntropy OS...
echo.

rem Nettoyage préventif de tout démarrage intempestif de l'environnement de dev
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "com.syntropy.os" /f >nul 2>&1
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "electron" /f >nul 2>&1
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "Electron" /f >nul 2>&1
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Electron.lnk" (
    del /f /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Electron.lnk" >nul 2>&1
)

rem 1. Verification de la version installee sur le systeme Windows
if exist "%LOCALAPPDATA%\Programs\Syntropy OS\Syntropy OS.exe" (
    echo [OK] Lancement de Syntropy OS - Version installee...
    start "" "%LOCALAPPDATA%\Programs\Syntropy OS\Syntropy OS.exe"
    goto :success
)

rem 2. Verification de la version autonome officielle packagée
if exist "dist\win-unpacked\Syntropy OS.exe" (
    echo [OK] Lancement de Syntropy OS - Executable officiel autonome...
    start "" "dist\win-unpacked\Syntropy OS.exe"
    goto :success
)

rem 3. Verification de la presence de l'installateur officiel
if exist "dist\Syntropy-OS-Setup-2.6.13.exe" (
    echo [INFO] Lancement de l'installateur Syntropy OS 2.6.13...
    start "" "dist\Syntropy-OS-Setup-2.6.13.exe"
    goto :success
)

rem 4. Si aucune version n'est presente, compiler officiellement
echo [INFO] Application officielle non encore compilee.
echo [INFO] Compilation de la veritable application Windows en cours...
call npm run build:win

if exist "dist\win-unpacked\Syntropy OS.exe" (
    echo [OK] Compilation terminee, lancement de Syntropy OS...
    start "" "dist\win-unpacked\Syntropy OS.exe"
    goto :success
)

echo.
echo =====================================================================
echo [ERREUR] Impossible de trouver ou compiler Syntropy OS.exe.
echo Executez : npm run build:win
echo =====================================================================
echo.
pause
exit /b 1

:success
echo.
echo =====================================================================
echo   Syntropy OS officiel est en cours d execution !
echo   Cette fenetre se fermera automatiquement dans 3 secondes.
echo =====================================================================
ping 127.0.0.1 -n 3 > nul
exit /b 0
