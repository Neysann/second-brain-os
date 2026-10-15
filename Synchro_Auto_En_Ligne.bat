@echo off
title Syntropy OS — Surveillance & Synchro Auto En Ligne
color 0A

echo =====================================================================
echo           SYNTROPY OS — SYNCHRONISATION PERMANENTE EN DIRECT
echo =====================================================================
echo.
echo Lancement du module de surveillance en arriere-plan...
echo Toute modification de code sera automatiquement compilee et envoyee
echo sur votre serveur en ligne (https://second-brain-os-e6a83.web.app).
echo.
echo ---------------------------------------------------------------------

cd /d "c:\PROJET ASSISTANT - JARVIS"
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\watch-and-deploy.ps1"

pause
