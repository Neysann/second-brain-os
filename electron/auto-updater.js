const { app, Notification, ipcMain, shell } = require('electron');
const { autoUpdater } = require('electron-updater');

let isUpdaterConfigured = false;

/**
 * Nettoie les messages d'erreur d'electron-updater pour éviter d'exposer
 * des URLs de redirection pré-signées de 600 caractères (tokens Azure / AWS).
 */
function sanitizeUpdateError(err) {
  const msg = err?.message || String(err || '');
  if (
    msg.includes('release-assets.githubusercontent.com') ||
    msg.includes('Cannot download') ||
    msg.includes('pr=https') ||
    msg.includes('rscd=') ||
    msg.includes('sig=') ||
    msg.includes('jwt=')
  ) {
    return "Le téléchargement automatique via GitHub a rencontré un délai d'attente ou une coupure réseau. Cliquez sur « Télécharger via le navigateur » pour obtenir l'installateur officiel sans blocage.";
  }
  if (msg.includes('504')) {
    return "Délai d'attente dépassé (Erreur 504) sur les serveurs GitHub. Veuillez réessayer ou télécharger manuellement.";
  }
  return msg || "Erreur lors de la communication avec le canal de mise à jour";
}

/**
 * Configure et initialise le moteur de mise à jour automatique electron-updater
 * @param {import('electron').BrowserWindow} mainWindow Fenêtre principale
 * @param {Function} getAppIcon Fonction renvoyant le chemin de l'icône de l'application
 */
function setupAutoUpdater(mainWindow, getAppIcon) {
  if (isUpdaterConfigured) return autoUpdater;

  // Configuration par défaut : confirmation utilisateur avant téléchargement
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;

  // DÉSACTIVATION ESSENTIELLE du téléchargement différentiel .blockmap :
  // Sur GitHub Releases, les requêtes HTTP Range échouent fréquemment sur les redirections
  // release-assets.githubusercontent.com (Azure Blob Storage), provoquant l'erreur "Cannot download ..."
  autoUpdater.disableDifferentialDownload = true;
  autoUpdater.disableWebInstaller = true;

  // Configuration explicite et robuste du canal GitHub Releases
  try {
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'Neysann',
      repo: 'second-brain-os',
    });
  } catch (err) {
    console.warn('[AutoUpdater] Avertissement setFeedURL:', err?.message || err);
  }

  // Journalisation des étapes dans la console
  autoUpdater.logger = console;

  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] 🔍 Vérification des releases GitHub...');
    mainWindow?.webContents?.send('update-status', {
      status: 'checking',
      currentVersion: app.getVersion(),
    });
  });

  autoUpdater.on('update-available', (info) => {
    console.log(`[AutoUpdater] ⚡ Mise à jour disponible : v${info.version}`);
    mainWindow?.webContents?.send('update-status', {
      status: 'available',
      version: info.version,
      currentVersion: app.getVersion(),
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
    });

    // Notification Windows Toast si l'application est en arrière-plan
    if (Notification.isSupported() && !mainWindow?.isFocused()) {
      new Notification({
        title: 'Syntropy OS — Nouvelle version disponible',
        body: `La mise à jour v${info.version} est disponible au téléchargement.`,
        icon: getAppIcon ? getAppIcon() : undefined,
      }).show();
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    const activeVersion = info?.version || app.getVersion();
    console.log(`[AutoUpdater] 🟢 Syntropy OS est à jour (v${activeVersion})`);
    mainWindow?.webContents?.send('update-status', {
      status: 'not-available',
      version: activeVersion,
      currentVersion: app.getVersion(),
    });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents?.send('update-status', {
      status: 'downloading',
      percent: progressObj.percent,
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total,
      currentVersion: app.getVersion(),
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log(`[AutoUpdater] 🎉 Mise à jour v${info.version} téléchargée avec succès !`);
    mainWindow?.webContents?.send('update-status', {
      status: 'downloaded',
      version: info.version,
      currentVersion: app.getVersion(),
    });

    if (Notification.isSupported()) {
      const updateNotif = new Notification({
        title: 'Syntropy OS — Mise à jour prête',
        body: `La version ${info.version} est prête. Cliquez pour redémarrer et appliquer la mise à jour.`,
        icon: getAppIcon ? getAppIcon() : undefined,
        actions: [{ type: 'button', text: 'Redémarrer et Installer' }],
      });

      updateNotif.on('action', (_event, index) => {
        if (index === 0) {
          autoUpdater.quitAndInstall();
        }
      });

      updateNotif.on('click', () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      });

      updateNotif.show();
    }
  });

  autoUpdater.on('error', (err) => {
    console.warn('[AutoUpdater] ⚠️ Erreur :', err?.message || err);
    mainWindow?.webContents?.send('update-status', {
      status: 'error',
      message: sanitizeUpdateError(err),
      rawError: err?.message || String(err),
      currentVersion: app.getVersion(),
    });
  });

  isUpdaterConfigured = true;
  return autoUpdater;
}

/**
 * Enregistre les gestionnaires IPC pour les interactions frontend
 * @param {boolean} isDev Indique si l'application est en mode développement
 */
function registerAutoUpdaterIpc(isDev) {
  // 1. Obtenir la version actuelle de l'application
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // 2. Vérification manuelle des mises à jour
  ipcMain.handle('check-for-updates', async () => {
    try {
      if (isDev) {
        return {
          status: 'dev-mode',
          message: 'Les mises à jour automatiques sont désactivées en mode développement.',
          version: app.getVersion(),
        };
      }
      const checkResult = await autoUpdater.checkForUpdates();
      return {
        success: true,
        updateInfo: checkResult?.updateInfo,
        version: app.getVersion(),
      };
    } catch (err) {
      console.warn('[AutoUpdater IPC] Erreur check-for-updates:', err?.message || err);
      return {
        success: false,
        error: sanitizeUpdateError(err),
      };
    }
  });

  // 3. Lancer le téléchargement de la mise à jour
  ipcMain.handle('start-update-download', async () => {
    try {
      if (isDev) {
        return { success: false, error: 'Impossible de télécharger en mode développement.' };
      }
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (err) {
      console.warn('[AutoUpdater IPC] Erreur downloadUpdate:', err?.message || err);
      return { success: false, error: sanitizeUpdateError(err) };
    }
  });

  // 3.1 Ouvrir le téléchargement direct dans le navigateur par défaut
  ipcMain.handle('open-direct-download', async (_event, version) => {
    try {
      const targetVersion = version || app.getVersion();
      const downloadUrl = `https://github.com/Neysann/second-brain-os/releases/download/v${targetVersion}/Syntropy-OS-Setup-${targetVersion}.exe`;
      await shell.openExternal(downloadUrl);
      return { success: true };
    } catch (err) {
      console.warn('[AutoUpdater IPC] Erreur open-direct-download:', err);
      // Fallback vers la page générale des releases
      try {
        await shell.openExternal('https://github.com/Neysann/second-brain-os/releases/latest');
        return { success: true };
      } catch (e) {
        return { success: false, error: err?.message || String(err) };
      }
    }
  });

  // 4. Quitter et installer immédiatement la mise à jour
  const handleQuitAndInstall = () => {
    try {
      autoUpdater.quitAndInstall();
    } catch (err) {
      console.error('[AutoUpdater IPC] Erreur quitAndInstall:', err);
    }
  };

  ipcMain.handle('quit-and-install', handleQuitAndInstall);
  ipcMain.handle('restart-and-install-update', handleQuitAndInstall);
}

module.exports = {
  setupAutoUpdater,
  registerAutoUpdaterIpc,
  autoUpdater,
};
