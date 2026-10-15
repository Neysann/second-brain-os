const { app, BrowserWindow, globalShortcut, Tray, Menu, Notification, ipcMain, dialog, nativeImage, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { setupAutoUpdater, registerAutoUpdaterIpc, autoUpdater } = require('./auto-updater');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const PORT = 38200;

let mainWindow = null;
let quickCaptureWindow = null;
let tray = null;
let isQuitting = false;
let localServer = null;

// Configuration de l'identifiant d'application Windows pour la barre des tâches
app.setAppUserModelId('com.syntropy.os');

// Vérification d'instance unique
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

/**
 * Serveur HTTP local autonome pour servir le build statique out/ en production
 */
function startStaticServer(callback) {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=utf-8',
  };

  const outDir = path.join(__dirname, '../out');

  localServer = http.createServer((req, res) => {
    try {
      const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
      let reqPath = decodeURIComponent(parsedUrl.pathname);

      if (reqPath === '/') {
        reqPath = '/index.html';
      }

      let filePath = path.join(outDir, reqPath);

      // Support des routes Next.js propres (ex: /notes -> /notes.html)
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        if (fs.existsSync(filePath + '.html')) {
          filePath = filePath + '.html';
        } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
          filePath = path.join(filePath, 'index.html');
        } else {
          filePath = path.join(outDir, '404.html');
        }
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found');
          return;
        }
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(content);
      });
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 Internal Server Error');
    }
  });

  localServer.listen(PORT, '127.0.0.1', () => {
    console.log(`[Syntropy OS Desktop] Serveur local démarré sur http://127.0.0.1:${PORT}`);
    callback(`http://127.0.0.1:${PORT}`);
  });

  localServer.on('error', (err) => {
    console.error('[Syntropy OS Desktop] Erreur serveur local:', err);
    // En cas de port déjà utilisé, essayer un port dynamique
    localServer.listen(0, '127.0.0.1', () => {
      const dynPort = localServer.address().port;
      callback(`http://127.0.0.1:${dynPort}`);
    });
  });
}

function getAppIcon() {
  const candidatePaths = [
    path.join(__dirname, 'icon.ico'),
    path.join(__dirname, 'icon.png'),
    path.join(__dirname, '../build/icon.ico'),
    path.join(__dirname, '../build/icon.png'),
    path.join(__dirname, '../out/icon.ico'),
    path.join(__dirname, '../out/logo.png'),
    path.join(__dirname, '../public/icon.ico'),
    path.join(__dirname, '../public/logo.png'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

/**
 * Création de la Fenêtre Principale de Syntropy OS
 */
function createMainWindow(appUrl) {
  const iconPath = getAppIcon();

  mainWindow = new BrowserWindow({
    title: 'Syntropy OS',
    width: 1400,
    height: 900,
    minWidth: 980,
    minHeight: 650,
    backgroundColor: '#09090b',
    icon: iconPath,
    show: false,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  mainWindow.removeMenu();

  mainWindow.loadURL(appUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Réduire dans la zone de notification au lieu de fermer si demandée
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();

      if (tray && Notification.isSupported()) {
        tray.displayBalloon?.({
          title: 'Syntropy OS',
          content: 'L\'application continue de tourner en arrière-plan.',
        });
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Création de la Mini-Fenêtre Flottante de Capture Rapide (Alt+Espace)
 */
function createQuickCaptureWindow(appUrl) {
  quickCaptureWindow = new BrowserWindow({
    title: 'Syntropy OS — Capture Rapide',
    width: 620,
    height: 390,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    resizable: false,
    show: false,
    center: true,
    backgroundColor: '#00000000',
    icon: getAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const captureUrl = `${appUrl}/quick-capture`;
  quickCaptureWindow.loadURL(captureUrl);

  quickCaptureWindow.on('blur', () => {
    // Masquer quand l'utilisateur clique ailleurs
    if (quickCaptureWindow && quickCaptureWindow.isVisible()) {
      quickCaptureWindow.hide();
    }
  });
}

function toggleQuickCaptureWindow() {
  if (!quickCaptureWindow) return;
  if (quickCaptureWindow.isVisible()) {
    quickCaptureWindow.hide();
  } else {
    quickCaptureWindow.center();
    quickCaptureWindow.show();
    quickCaptureWindow.focus();
  }
}


/**
 * Configuration du System Tray (Icône de notification violette)
 */
function setupSystemTray(appUrl) {
  const iconPath = getAppIcon();
  let trayImage;

  if (iconPath && fs.existsSync(iconPath)) {
    trayImage = nativeImage.createFromPath(iconPath).resize({ width: 18, height: 18 });
  } else {
    trayImage = nativeImage.createEmpty();
  }

  tray = new Tray(trayImage);
  tray.setToolTip('Syntropy OS V2.5.0 (Desktop Engine)');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '⚡ Ouvrir Syntropy OS',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: '📝 Nouvelle Note rapide (Alt+Espace)',
      click: () => {
        toggleQuickCaptureWindow();
      },
    },
    { type: 'separator' },
    {
      label: '⏯️ Démarrer / Pause Pomodoro',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('tray-action', { type: 'toggle-pomodoro' });
          mainWindow.show();
        }
      },
    },
    {
      label: '📋 Aperçu du Top 3 des tâches du jour',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('tray-action', { type: 'view-tasks' });
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: '🔄 Rechercher des mises à jour',
      click: async () => {
        if (isDev) {
          if (Notification.isSupported()) {
            new Notification({
              title: 'Syntropy OS Desktop',
              body: 'Mode Développement : auto-updater inactif.',
              icon: getAppIcon(),
            }).show();
          }
          return;
        }
        try {
          await autoUpdater.checkForUpdates();
        } catch (err) {
          console.warn('[AutoUpdater Tray]', err?.message || err);
        }
      },
    },
    { type: 'separator' },
    {
      label: '🚪 Quitter Syntropy OS',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

/**
 * Enregistrement des IPC Handlers
 */
function registerIpcHandlers() {
  // Fenêtre
  ipcMain.handle('minimize-window', () => mainWindow?.minimize());
  ipcMain.handle('maximize-window', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.handle('close-window', () => mainWindow?.close());
  ipcMain.handle('quit-app', () => {
    isQuitting = true;
    app.quit();
  });

  // Capture Rapide
  ipcMain.handle('open-quick-capture', () => toggleQuickCaptureWindow());
  ipcMain.handle('hide-quick-capture', () => quickCaptureWindow?.hide());

  // Auto-Start (Lancement au démarrage Windows)
  ipcMain.handle('get-auto-start', () => {
    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.handle('set-auto-start', (_event, enabled) => {
    app.setLoginItemSettings({
      openAtLogin: Boolean(enabled),
      openAsHidden: true,
      path: process.execPath,
    });
    return app.getLoginItemSettings().openAtLogin;
  });

  // Notifications natives Windows Toast interactives
  ipcMain.handle('show-notification', (_event, { title, body }) => {
    if (!Notification.isSupported()) return { success: false, reason: 'Notifications non supportées' };

    const notification = new Notification({
      title: title || 'Syntropy OS',
      body: body || '',
      icon: getAppIcon(),
      actions: [
        { type: 'button', text: 'Terminé' },
        { type: 'button', text: 'Reporter de 15 min' },
      ],
    });

    notification.on('action', (_event, index) => {
      mainWindow?.webContents.send('notification-action', { actionIndex: index, title });
    });

    notification.on('click', () => {
      mainWindow?.show();
      mainWindow?.focus();
    });

    notification.show();
    return { success: true };
  });

  // Sélection de dossier local
  ipcMain.handle('select-backup-folder', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Sélectionner le dossier de sauvegarde Syntropy OS',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  // Sauvegarde locale de fichier
  ipcMain.handle('save-local-backup', async (_event, { folderPath, fileName, content }) => {
    try {
      if (!folderPath || !fileName) throw new Error('Dossier ou nom de fichier manquant');
      const fullPath = path.join(folderPath, fileName);
      await fs.promises.writeFile(fullPath, content, 'utf8');
      return { success: true, filePath: fullPath };
    } catch (err) {
      console.error('[Syntropy OS Desktop] Erreur sauvegarde locale:', err);
      return { success: false, error: err.message };
    }
  });

  // Exportation des notes Markdown
  ipcMain.handle('export-notes-markdown', async (_event, { folderPath, notesList }) => {
    try {
      if (!folderPath || !Array.isArray(notesList)) throw new Error('Paramètres invalides');
      const targetDir = path.join(folderPath, `Syntropy_Notes_${new Date().toISOString().split('T')[0]}`);
      await fs.promises.mkdir(targetDir, { recursive: true });

      let count = 0;
      for (const note of notesList) {
        const safeTitle = (note.title || 'Sans titre').replace(/[/\\?%*:|"<>]/g, '_').trim();
        const notePath = path.join(targetDir, `${safeTitle}.md`);
        const fileContent = `---\ntitle: "${note.title}"\ncreatedAt: "${note.createdAt || ''}"\ntags: ${JSON.stringify(note.tags || [])}\n---\n\n${note.content || ''}`;
        await fs.promises.writeFile(notePath, fileContent, 'utf8');
        count++;
      }
      return { success: true, exportedCount: count, directory: targetDir };
    } catch (err) {
      console.error('[Syntropy OS Desktop] Erreur export notes:', err);
      return { success: false, error: err.message };
    }
  });

  // Contrôle de sécurité session admin
  ipcMain.handle('verify-admin-session', (_event, userProfile) => {
    const isAdmin = Boolean(userProfile?.role === 'admin' || userProfile?.isAdmin);
    return {
      allowed: isAdmin,
      user: userProfile?.email || null,
      timestamp: new Date().toISOString(),
    };
  });

  // Ouvrir l'emplacement du binaire dans l'Explorateur Windows
  ipcMain.handle('open-dist-folder', () => {
    const exePath = path.join(__dirname, '../dist/Syntropy-OS-Setup-2.5.0.exe');
    if (fs.existsSync(exePath)) {
      shell.showItemInFolder(exePath);
      return { success: true };
    }
    return { success: false, reason: 'Fichier non trouvé dans dist/' };
  });
}

// Initialisation globale de l'application
app.whenReady().then(() => {
  registerIpcHandlers();
  registerAutoUpdaterIpc(isDev);

  // Enregistrement du raccourci clavier global Alt+Espace
  const shortcutRegistered = globalShortcut.register('Alt+Space', () => {
    toggleQuickCaptureWindow();
  });

  if (!shortcutRegistered) {
    console.warn('[Syntropy OS Desktop] Impossible d\'enregistrer le raccourci global Alt+Space.');
  }

  const startApp = (appUrl) => {
    createMainWindow(appUrl);
    createQuickCaptureWindow(appUrl);
    setupSystemTray(appUrl);
    setupAutoUpdater(mainWindow, getAppIcon);

    // Vérification silencieuse de mise à jour au démarrage
    if (!isDev) {
      setTimeout(() => {
        try {
          autoUpdater.checkForUpdates().catch((err) => {
            console.log('[AutoUpdater] Vérification silencieuse au démarrage:', err?.message || err);
          });
        } catch (err) {
          console.log('[AutoUpdater] Exception au démarrage:', err);
        }
      }, 4000);
    }
  };

  if (isDev) {
    startApp('http://localhost:3000');
  } else {
    startStaticServer((appUrl) => {
      startApp(appUrl);
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const url = isDev ? 'http://localhost:3000' : `http://127.0.0.1:${PORT}`;
      createMainWindow(url);
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (localServer) {
    localServer.close();
  }
});
