@echo off
title Syntropy - Deploiement en Ligne (Firebase Hosting)
color 0B

echo =====================================================================
echo                SYNTROPY OS - DEPLOIEMENT EN LIGNE
echo =====================================================================
echo.
echo  Projet Firebase : second-brain-os-e6a83
echo  Dossier source  : c:\PROJET ASSISTANT - JARVIS
echo.
echo ---------------------------------------------------------------------

cd /d "c:\PROJET ASSISTANT - JARVIS"

echo [1/4] Verification de l'environnement & Synchronisation des dossiers...
where node >nul 2>&1
if %errorlevel% neq 0 goto :no_node

echo Synchronisation miroir automatique vers second-brain-os...
powershell -NoProfile -Command "Copy-Item -Path 'src\*' -Destination 'second-brain-os\src' -Recurse -Force; Copy-Item -Path 'patchnote.txt' -Destination 'second-brain-os\patchnote.txt' -Force"

echo.
echo [2/4] Compilation du projet (Production Next.js)...
if exist ".next" rmdir /s /q ".next"
call npm run build
if %errorlevel% neq 0 goto :build_error

echo.
echo [3/4] Envoi sur les serveurs Firebase Hosting...
call npx --yes firebase deploy --only hosting
if %errorlevel% neq 0 goto :deploy_error

echo.
echo [4/4] Sauvegarde de l'historique Git...
git -C "second-brain-os" add -A >nul 2>&1
git -C "second-brain-os" commit -m "deploy: synchro en ligne" >nul 2>&1

echo.
echo =====================================================================
echo   SUCCES ! Votre site Syntropy est en ligne et a jour !
echo =====================================================================
echo.
echo  URL officielle : https://second-brain-os-e6a83.web.app
echo  URL miroir     : https://second-brain-os-e6a83.firebaseapp.com
echo.
echo Ouverture du site dans votre navigateur...
start "" "https://second-brain-os-e6a83.web.app"
goto :end

:no_node
echo.
echo [ERREUR] Node.js n'a pas ete trouve dans le PATH.
goto :end

:build_error
echo.
echo [ERREUR] La compilation (npm run build) a echoue.
goto :end

:deploy_error
echo.
echo [ERREUR] Le deploiement Firebase a echoue.
echo.
echo Si Firebase vous demande de vous authentifier, tapez dans le terminal :
echo   npx firebase login
echo.
goto :end

:end
echo.
pause
