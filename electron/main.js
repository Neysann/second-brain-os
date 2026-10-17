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
let currentAppUrl = null;

// Capture globale des exceptions pour éviter tout crash silencieux
process.on('uncaughtException', (err) => {
  try {
    const logPath = path.join(__dirname, 'electron-startup.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] Uncaught Exception: ${err?.stack || err}\n`);
  } catch (_) {}
  console.error('[Syntropy OS Desktop Exception]', err);
});

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
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.setAlwaysOnTop(true);
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(false);
  } else {
    const url = currentAppUrl || `http://127.0.0.1:${PORT}`;
    createMainWindow(url);
  }
});

/**
 * Localise intelligemment le dossier de build statique out/
 */
function resolveOutDir() {
  const candidates = [
    path.join(__dirname, '../out'),
    path.join(app.getAppPath(), 'out'),
    path.join(process.resourcesPath || '', 'out'),
    path.join(process.resourcesPath || '', 'app.asar/out'),
    path.join(__dirname, 'out'),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c) && fs.existsSync(path.join(c, 'index.html'))) {
        return c;
      }
    } catch (_) {}
  }
  return path.join(__dirname, '../out');
}

/**
 * Sonde HTTP rapide non-bloquante pour vérifier si un serveur local écoute
 */
function checkUrlAlive(targetUrl, timeoutMs = 800) {
  return new Promise((resolve) => {
    try {
      const u = new URL(targetUrl);
      const req = http.request(
        {
          hostname: u.hostname,
          port: u.port || 80,
          path: '/',
          method: 'HEAD',
          timeout: timeoutMs,
        },
        (res) => {
          resolve(res.statusCode >= 200 && res.statusCode < 500);
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch (_) {
      resolve(false);
    }
  });
}

/**
 * Génère une page d'attente stylée Syntropy OS lors d'une tentative de connexion
 */
function getLoadingHtml(retryUrl, message = "Initialisation du moteur Syntropy OS...") {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Syntropy OS</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #09090b;
      color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
      user-select: none;
      overflow: hidden;
    }
    .background-orb {
      position: absolute;
      width: 440px;
      height: 440px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, rgba(99, 102, 241, 0.06) 50%, transparent 70%);
      filter: blur(45px);
      z-index: 0;
      animation: float 5s ease-in-out infinite alternate;
    }
    @keyframes float {
      from { transform: translateY(-16px) scale(0.96); }
      to { transform: translateY(16px) scale(1.04); }
    }
    .card {
      position: relative;
      z-index: 1;
      background: rgba(24, 24, 27, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 36px 32px;
      max-width: 420px;
      width: 100%;
      backdrop-filter: blur(24px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 40px rgba(168, 85, 247, 0.2);
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .logo-pulse {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      background: linear-gradient(135deg, #a855f7, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      box-shadow: 0 0 28px rgba(168, 85, 247, 0.5);
      animation: pulse 2.2s infinite ease-in-out;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 24px rgba(168, 85, 247, 0.4); }
      50% { transform: scale(1.06); box-shadow: 0 0 38px rgba(168, 85, 247, 0.7); }
    }
    .logo-pulse svg {
      width: 32px;
      height: 32px;
      color: #ffffff;
    }
    h1 {
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
      color: #fafafa;
    }
    p {
      font-size: 13px;
      color: #a1a1aa;
      line-height: 1.5;
      margin-bottom: 22px;
    }
    .spinner {
      width: 22px;
      height: 22px;
      border: 2px solid rgba(168, 85, 247, 0.2);
      border-top-color: #a855f7;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 18px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .status {
      font-size: 12px;
      color: #71717a;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 20px;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #a855f7;
      animation: blink 1.2s infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
    button {
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(99, 102, 241, 0.2));
      border: 1px solid rgba(168, 85, 247, 0.4);
      color: #e4e4e7;
      padding: 9px 18px;
      font-size: 13px;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    button:hover {
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.35), rgba(99, 102, 241, 0.35));
      border-color: rgba(168, 85, 247, 0.7);
      color: #ffffff;
      transform: translateY(-1px);
    }
  </style>
</head>
<body>
  <div class="background-orb"></div>
  <div class="card">
    <div class="logo-pulse">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path>
        <path d="M12 6v6l4 2"></path>
      </svg>
    </div>
    <h1>Syntropy OS</h1>
    <p>${message}</p>
    <div class="spinner"></div>
    <div class="status">
      <span class="status-dot"></span>
      <span>Connexion en cours...</span>
    </div>
    <button onclick="window.location.href='${retryUrl}'">Recharger</button>
  </div>
  <script>
    setTimeout(() => {
      window.location.href = "${retryUrl}";
    }, 1800);
  </script>
</body>
</html>`;
}

/**
 * Serveur HTTP local autonome pour servir le build statique out/
 */
function startStaticServer(callback) {
  if (localServer && localServer.listening) {
    const addr = localServer.address();
    const activePort = typeof addr === 'object' && addr ? addr.port : PORT;
    callback(`http://127.0.0.1:${activePort}`);
    return;
  }

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

  const outDir = resolveOutDir();

  const handleRequest = (req, res) => {
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
  };

  localServer = http.createServer(handleRequest);

  localServer.once('error', (err) => {
    console.error('[Syntropy OS Desktop] Port principal occupé ou indisponible (38200):', err?.message || err);
    try {
      localServer.close();
    } catch (_) {}

    // En cas de port déjà utilisé, basculer proprement sur un port dynamique alloué par le système
    const fallbackServer = http.createServer(handleRequest);
    fallbackServer.listen(0, '127.0.0.1', () => {
      localServer = fallbackServer;
      const dynPort = fallbackServer.address().port;
      console.log(`[Syntropy OS Desktop] Serveur local de secours démarré sur http://127.0.0.1:${dynPort}`);
      callback(`http://127.0.0.1:${dynPort}`);
    });
    fallbackServer.on('error', (fatalErr) => {
      console.error('[Syntropy OS Desktop] Erreur fatale serveur local:', fatalErr);
    });
  });

  localServer.listen(PORT, '127.0.0.1', () => {
    console.log(`[Syntropy OS Desktop] Serveur local démarré sur http://127.0.0.1:${PORT}`);
    callback(`http://127.0.0.1:${PORT}`);
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
    show: true,
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

  // Gestionnaire de secours en cas d'échec de chargement réseau
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (errorCode === -3) return; // ERR_ABORTED (navigation annulée normale)

    console.warn(`[Syntropy OS Desktop] Échec du chargement de ${validatedURL} (${errorCode}: ${errorDescription})`);

    const outDir = resolveOutDir();
    const hasStaticBuild = fs.existsSync(path.join(outDir, 'index.html'));

    // Si on cherchait à charger localhost:3000 et qu'un build statique local est présent, basculer sans attendre
    if (validatedURL && validatedURL.includes('localhost:3000') && hasStaticBuild) {
      console.log('[Syntropy OS Desktop] Bascule de secours automatique vers le build statique out/...');
      startStaticServer((staticUrl) => {
        currentAppUrl = staticUrl;
        mainWindow.loadURL(staticUrl);
        if (quickCaptureWindow) {
          quickCaptureWindow.loadURL(`${staticUrl}/quick-capture`);
        }
      });
      return;
    }

    // Afficher l'écran d'attente Syntropy OS avec reconnexion automatique
    const retryHtml = getLoadingHtml(validatedURL || appUrl, "Connexion au serveur de l'application en cours...");
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(retryHtml));

    if (!mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.loadURL(appUrl);

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
  });

  // Sécurité supplémentaire : s'assurer que la fenêtre est immédiatement visible
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    }
  }, 400);

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

  quickCaptureWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (errorCode === -3) return;
    const retryHtml = getLoadingHtml(validatedURL || captureUrl, "Chargement de la Capture Rapide...");
    quickCaptureWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(retryHtml));
  });

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
  tray.setToolTip(`Syntropy OS v${app.getVersion()} (Desktop Engine)`);

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
    const distDir = path.join(__dirname, '../dist');
    if (fs.existsSync(distDir)) {
      const files = fs.readdirSync(distDir);
      const exe = files.find(f => f.startsWith('Syntropy-OS-Setup-') && f.endsWith('.exe'));
      if (exe) {
        shell.showItemInFolder(path.join(distDir, exe));
        return { success: true };
      }
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
    currentAppUrl = appUrl;
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

  const initApp = async () => {
    const outDir = resolveOutDir();
    const hasStaticBuild = fs.existsSync(path.join(outDir, 'index.html'));

    if (isDev) {
      // Tester rapidement si Next.js dev server répond sur http://127.0.0.1:3000
      const isNextDevRunning = await checkUrlAlive('http://127.0.0.1:3000', 350);
      if (isNextDevRunning) {
        console.log('[Syntropy OS Desktop] Serveur de dev actif détecté sur http://127.0.0.1:3000');
        startApp('http://127.0.0.1:3000');
        return;
      }

      // Si localhost:3000 n'est pas actif mais que out/index.html existe, lancer directement sur le build local !
      if (hasStaticBuild) {
        console.log('[Syntropy OS Desktop] Next.js dev inactif, lancement direct sur le build local statique out/');
        startStaticServer((appUrl) => {
          startApp(appUrl);
        });
        return;
      }

      // Ni dev ni static : lancer sur localhost:3000 (did-fail-load assurera l'écran stylé et la reconnexion automatique)
      console.log('[Syntropy OS Desktop] En attente du serveur de développement sur http://localhost:3000...');
      startApp('http://localhost:3000');
    } else {
      startStaticServer((appUrl) => {
        startApp(appUrl);
      });
    }
  };

  initApp();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const url = currentAppUrl || (isDev ? 'http://localhost:3000' : `http://127.0.0.1:${PORT}`);
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
