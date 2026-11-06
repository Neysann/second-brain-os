const { contextBridge, ipcRenderer } = require('electron');

let appVersion = '2.7.3';
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

  // Requête HTTP directe native sans restriction CORS
  fetchUrl: (options) =>
    ipcRenderer.invoke('fetch-url', typeof options === 'string' ? { url: options } : options),

  // Détection & Contrôle Multimédia Windows SMTC
  getNowPlaying: () => ipcRenderer.invoke('get-now-playing'),
  controlMedia: (action) => ipcRenderer.invoke('control-media', action),
  selectMediaSession: (appId) => ipcRenderer.invoke('select-media-session', appId),

  // Dynamic Island Desktop (Hitbox, Focus, Actions, Presse-papiers)
  setIslandHitbox: (box) => ipcRenderer.send('set-island-hitbox', box),
  setIslandIgnoreMouse: (ignore) => ipcRenderer.send('set-island-ignore-mouse', Boolean(ignore)),
  setIslandFocusable: (focusable) => ipcRenderer.send('set-island-focusable', Boolean(focusable)),
  islandCaptureClosed: () => ipcRenderer.send('island-capture-closed'),
  openMainAppRoute: (route) => ipcRenderer.invoke('open-main-app-route', route),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  previewIsland: () => ipcRenderer.invoke('preview-island'),
  getSystemStats: () => ipcRenderer.invoke('get-system-stats'),
  getClipboardHistory: () => ipcRenderer.invoke('get-clipboard-history'),
  copyClipboardItem: (idOrText) => ipcRenderer.invoke('copy-clipboard-item', idOrText),
  pinClipboardItem: (id) => ipcRenderer.invoke('pin-clipboard-item', id),
  deleteClipboardItem: (id) => ipcRenderer.invoke('delete-clipboard-item', id),
  clearClipboardHistory: () => ipcRenderer.invoke('clear-clipboard-history'),

  onIslandHover: (callback) => {
    const sub = (_e, hovered) => callback(Boolean(hovered));
    ipcRenderer.on('island-hover', sub);
    return () => ipcRenderer.removeListener('island-hover', sub);
  },
  onIslandConfigUpdated: (callback) => {
    const sub = (_e, cfg) => callback(cfg);
    ipcRenderer.on('island-config-updated', sub);
    return () => ipcRenderer.removeListener('island-config-updated', sub);
  },
  onActivateIslandCapture: (callback) => {
    const sub = () => callback();
    ipcRenderer.on('activate-island-capture', sub);
    return () => ipcRenderer.removeListener('activate-island-capture', sub);
  },
  onIslandPreview: (callback) => {
    const sub = () => callback();
    ipcRenderer.on('island-preview', sub);
    return () => ipcRenderer.removeListener('island-preview', sub);
  },
  onIslandVisibility: (callback) => {
    const sub = (_e, visible) => callback(Boolean(visible));
    ipcRenderer.on('island-visibility', sub);
    return () => ipcRenderer.removeListener('island-visibility', sub);
  },
  onClipboardUpdated: (callback) => {
    const sub = (_e, list) => callback(list);
    ipcRenderer.on('island-clipboard-updated', sub);
    return () => ipcRenderer.removeListener('island-clipboard-updated', sub);
  },
  onNavigateToRoute: (callback) => {
    const subscription = (_event, route) => callback(route);
    ipcRenderer.on('navigate-to-route', subscription);
    return () => ipcRenderer.removeListener('navigate-to-route', subscription);
  },
});
