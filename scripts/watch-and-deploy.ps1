# Syntropy OS — Surveillance & Synchronisation Automatique vers le Serveur en Ligne
$ErrorActionPreference = "Continue"

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "       SYNTROPY OS — SYNCHRONISATION EN DIRECT VERS LE SERVEUR" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Projet Firebase : second-brain-os-e6a83" -ForegroundColor Yellow
Write-Host "  URL en ligne    : https://second-brain-os-e6a83.web.app" -ForegroundColor Green
Write-Host ""
Write-Host "Mode surveillance actif : toute modification de code sera directement"
Write-Host "compilee et envoyee sur le serveur sans intervention manuelle !"
Write-Host "---------------------------------------------------------------------" -ForegroundColor DarkGray

$rootPath = "c:\PROJET ASSISTANT - JARVIS"
$srcPath = Join-Path $rootPath "src"
$mirrorPath = Join-Path $rootPath "second-brain-os\src"

function Deploy-Now {
    param([string]$reason = "Modification detectee")
    $timestamp = (Get-Date).ToString("HH:mm:ss")
    Write-Host "`n[$timestamp] 🚀 $reason — Synchronisation en cours..." -ForegroundColor Magenta

    # 1. Miroir vers second-brain-os
    Copy-Item -Path "$srcPath\*" -Destination $mirrorPath -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item -Path "$rootPath\patchnote.txt" -Destination "$rootPath\second-brain-os\patchnote.txt" -Force -ErrorAction SilentlyContinue

    # 2. Build Next.js
    Write-Host "[$timestamp] ⚙️  Compilation Next.js (Production)..." -ForegroundColor DarkCyan
    Push-Location $rootPath
    try {
        if (Test-Path ".next") {
            Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
        }
        $buildOutput = cmd.exe /c "npm run build 2>&1"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[$timestamp] ❌ Erreur de compilation : " -ForegroundColor Red
            $buildOutput | Select-Object -Last 10 | ForEach-Object { Write-Host "   $_" -ForegroundColor DarkRed }
            return
        }

        # 3. Deploy Firebase
        Write-Host "[$timestamp] ☁️  Envoi sur Firebase Hosting..." -ForegroundColor DarkCyan
        $deployOutput = cmd.exe /c "npx --yes firebase deploy --only hosting 2>&1"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[$timestamp] ✅ SYNCHRONISE AVEC SUCCES !" -ForegroundColor Green
            Write-Host "[$timestamp] 🌐 Disponible en direct sur : https://second-brain-os-e6a83.web.app" -ForegroundColor Green
            [console]::beep(800, 150)
        } else {
            Write-Host "[$timestamp] ⚠️ Échec du déploiement Firebase." -ForegroundColor Red
            $deployOutput | Select-Object -Last 5 | ForEach-Object { Write-Host "   $_" -ForegroundColor DarkRed }
        }
    } finally {
        Pop-Location
    }
}

# Déploiement initial au démarrage
Deploy-Now "Initialisation du watcher"

# Mise en place du FileSystemWatcher sur src\
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $srcPath
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]'FileName, LastWrite'

$lastDeployTime = [DateTime]::MinValue
$lock = New-Object System.Object

$action = {
    $path = $Event.SourceEventArgs.FullPath
    $changeType = $Event.SourceEventArgs.ChangeType
    $fileName = Split-Path $path -Leaf

    # Ignorer fichiers temporaires
    if ($fileName.StartsWith(".") -or $fileName.EndsWith("~") -or $fileName.EndsWith(".tmp")) {
        return
    }

    $now = [DateTime]::Now
    [System.Threading.Monitor]::Enter($lock)
    try {
        # Anti-rebond (debounce) de 3 secondes pour regrouper les sauvegardes multiples
        if (($now - $script:lastDeployTime).TotalSeconds -lt 3) {
            return
        }
        $script:lastDeployTime = $now
    } finally {
        [System.Threading.Monitor]::Exit($lock)
    }

    Start-Sleep -Milliseconds 800
    Deploy-Now "Modification de $fileName ($changeType)"
}

Register-ObjectEvent $watcher "Changed" -Action $action | Out-Null
Register-ObjectEvent $watcher "Created" -Action $action | Out-Null
Register-ObjectEvent $watcher "Deleted" -Action $action | Out-Null
Register-ObjectEvent $watcher "Renamed" -Action $action | Out-Null

Write-Host "`n👀 Surveillance active sur le dossier src\..." -ForegroundColor Cyan
Write-Host "Laissez cette fenêtre ouverte en arrière-plan pendant que vous codez." -ForegroundColor Yellow
Write-Host "Appuyez sur Ctrl + C pour arrêter la surveillance.`n" -ForegroundColor DarkGray

while ($true) {
    Start-Sleep -Seconds 1
}
