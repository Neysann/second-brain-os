@echo off
chcp 65001 > nul
title Second Brain OS — Lanceur Rapide
color 0B

echo =====================================================================
echo                 🧠 SECOND BRAIN OS (V2.6.3)
echo =====================================================================
echo.
echo  Projet  : Second Brain OS (Méthode PARA, Kanban, Notes Markdown)
echo  Dossier : c:\PROJET ASSISTANT - JARVIS
echo.
echo ---------------------------------------------------------------------

cd /d "c:\PROJET ASSISTANT - JARVIS"

echo [1/3] Vérification de l'environnement...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'a pas été trouvé dans le PATH.
    echo Veuillez vérifier votre installation de Node.js.
    pause
    exit /b 1
)

echo [2/3] Préparation de l'ouverture automatique du navigateur dès que le serveur est prêt...
start /b "" powershell -NoProfile -Command "while (-not (Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -InformationLevel Quiet)) { Start-Sleep -Milliseconds 600 }; Start-Process 'http://localhost:3000'"

echo [3/3] Démarrage du serveur de développement Next.js...
echo.
echo =====================================================================
echo   L'application est en cours d'exécution !
echo   Pour arrêter le serveur, fermez cette fenêtre ou faites Ctrl + C.
echo =====================================================================
echo.

call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo ⚠️ Tentative alternative dans le sous-dossier second-brain-os...
    cd /d "c:\PROJET ASSISTANT - JARVIS\second-brain-os"
    call npm run dev
)

pause
