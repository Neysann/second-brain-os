const { contextBridge, ipcRenderer } = require('electron');

let appVersion = '2.6.17';
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

  // Capture Rapide & Raccourci Global
  openQuickCapture: () => ipcRenderer.invoke('open-quick-capture'),
  hideQuickCapture: () => ipcRenderer.invoke('hide-quick-capture'),
  getQuickCaptureShortcut: () => ipcRenderer.invoke('get-quick-capture-shortcut'),
  setQuickCaptureShortcut: (shortcut) => ipcRenderer.invoke('set-quick-capture-shortcut', shortcut),

  // Préférences & Maintenance Avancée Desktop
  getDesktopConfig: () => ipcRenderer.invoke('get-desktop-config'),
  setDesktopConfig: (patch) => ipcRenderer.invoke('set-desktop-config', patch),
  clearDesktopCache: () => ipcRenderer.invoke('clear-desktop-cache'),
  relaunchApp: () => ipcRenderer.invoke('relaunch-app'),

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
  openDirectDownload: (version) => ipcRenderer.invoke('open-direct-download', version),
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

  // Requête HTTP directe native sans restriction CORS (pour flux iCal, webcal, RSS, etc.)
  fetchUrl: (options) =>
    ipcRenderer.invoke('fetch-url', typeof options === 'string' ? { url: options } : options),

  // Détection & Contrôle Multimédia Windows SMTC (Spotify, YouTube Music, Deezer, etc.)
  getNowPlaying: () => ipcRenderer.invoke('get-now-playing'),
  controlMedia: (action) => ipcRenderer.invoke('control-media', action),
  selectMediaSession: (appId) => ipcRenderer.invoke('select-media-session', appId),

  // Dynamic Island Desktop
  setIslandIgnoreMouse: (ignore) => ipcRenderer.send('set-island-ignore-mouse', Boolean(ignore)),
  setIslandFocusable: (focusable) => ipcRenderer.send('set-island-focusable', Boolean(focusable)),
  notifyIslandCaptureClosed: () => ipcRenderer.send('island-capture-closed'),
  openMainAppRoute: (route) => ipcRenderer.invoke('open-main-app-route', route),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  previewIsland: () => ipcRenderer.invoke('preview-island'),
  getSystemStats: () => ipcRenderer.invoke('get-system-stats'),
  getClipboardHistory: () => ipcRenderer.invoke('get-clipboard-history'),
  copyClipboardItem: (id) => ipcRenderer.invoke('copy-clipboard-item', id),
  pinClipboardItem: (id) => ipcRenderer.invoke('pin-clipboard-item', id),
  deleteClipboardItem: (id) => ipcRenderer.invoke('delete-clipboard-item', id),
  clearClipboardHistory: () => ipcRenderer.invoke('clear-clipboard-history'),
  onIslandAction: (callback) => {
    const subscription = (_event, action, data) => callback(action, data);
    ipcRenderer.on('island-action', subscription);
    return () => ipcRenderer.removeListener('island-action', subscription);
  },
  onNavigateToRoute: (callback) => {
    const subscription = (_event, route) => callback(route);
    ipcRenderer.on('navigate-to-route', subscription);
    return () => ipcRenderer.removeListener('navigate-to-route', subscription);
  },
});
