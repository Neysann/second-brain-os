const { contextBridge, ipcRenderer } = require('electron');

let appVersion = '2.6.5';
try {
  const pkg = require('../package.json');
  if (pkg && pkg.version) appVersion = pkg.version;
} catch (e) {}

/**
 * API Electron sécurisée exposée au renderer Next.js
 */
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
  version: appVersion,

  // Fenêtre & Contrôles
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  quitApp: () => ipcRenderer.invoke('quit-app'),

  // Capture Rapide Alt+Espace
  openQuickCapture: () => ipcRenderer.invoke('open-quick-capture'),
  hideQuickCapture: () => ipcRenderer.invoke('hide-quick-capture'),

  // Démarrage automatique Windows (LoginItemSettings)
  getAutoStart: () => ipcRenderer.invoke('get-auto-start'),
  setAutoStart: (enabled) => ipcRenderer.invoke('set-auto-start', enabled),

  // Notifications natives Windows Toast interactives
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),
  onNotificationAction: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('notification-action', subscription);
    return () => ipcRenderer.removeListener('notification-action', subscription);
  },

  // Système de fichiers local & Sauvegardes
  selectBackupFolder: () => ipcRenderer.invoke('select-backup-folder'),
  saveLocalBackup: (folderPath, fileName, content) =>
    ipcRenderer.invoke('save-local-backup', { folderPath, fileName, content }),
  exportNotesMarkdown: (folderPath, notesList) =>
    ipcRenderer.invoke('export-notes-markdown', { folderPath, notesList }),

  // Actions déclenchées depuis le System Tray
  onTrayAction: (callback) => {
    const subscription = (_event, action) => callback(action);
    ipcRenderer.on('tray-action', subscription);
    return () => ipcRenderer.removeListener('tray-action', subscription);
  },

  // Moteur de Mises à Jour Automatiques (electron-updater)
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  startUpdateDownload: () => ipcRenderer.invoke('start-update-download'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
  restartAndInstallUpdate: () => ipcRenderer.invoke('restart-and-install-update'),
  onUpdateStatus: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('update-status', subscription);
    return () => ipcRenderer.removeListener('update-status', subscription);
  },

  // Vérification de sécurité session admin
  verifyAdminSession: (userProfile) =>
    ipcRenderer.invoke('verify-admin-session', userProfile),

  // Ouvrir l'emplacement du binaire compilé
  openDistFolder: () => ipcRenderer.invoke('open-dist-folder'),
});
