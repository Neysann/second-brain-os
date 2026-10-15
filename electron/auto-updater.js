const { app, Notification, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

let isUpdaterConfigured = false;

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
      message: err?.message || 'Erreur lors de la communication avec le canal de mise à jour',
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
        error: err?.message || String(err),
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
      return { success: false, error: err?.message || String(err) };
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
