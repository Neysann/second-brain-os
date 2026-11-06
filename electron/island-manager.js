// ==============================================================================
// SYNTROPY OS — GESTIONNAIRE DE LA DYNAMIC ISLAND DESKTOP (Electron / Windows)
// ==============================================================================
// - Hit-testing natif Main Process (screen.getCursorScreenPoint) => 100 % des clics
//   fonctionnent instantanément sans aucun faux mouvement ni perte de clic.
// - Visibilité intelligente (masquée quand Syntropy OS est au 1er plan ou jeu plein écran).
// - Presse-papiers intelligent en mémoire vive (20 entrées texte / lien / code).

const os = require('os');
const path = require('path');
const { BrowserWindow, screen, ipcMain, clipboard, shell, app } = require('electron');
const islandNative = require('./island-native');

const ISLAND_WIDTH = 520;
const ISLAND_HEIGHT = 340;
const CLIPBOARD_MAX = 20;
const FS_POLL_MS = 3000;
const CLIP_POLL_MS = 1200;
const CURSOR_POLL_MS = 16;

function createIslandManager({ getMainWindow, loadConfig, saveConfig, getAppUrl }) {
  let islandWindow = null;
  let previewMode = false;
  let previewTimer = null;
  let forceShow = false;
  let isCaptureActive = false;
  let isFocusable = false;
  let ignoringMouse = true;
  let cursorInside = false;
  let leaveTimer = null;
  let cursorTimer = null;
  let hitbox = { width: 150, height: 40, top: 0 };

  let isForegroundFullScreen = false;
  let fsTimer = null;
  let clipTimer = null;
  let lastClipKey = '';
  let selfCopyKey = '';
  let clipboardItems = [];
  let lastCpu = null;
  let lastVisible = null;
  let ipcRegistered = false;

  const win = () => (islandWindow && !islandWindow.isDestroyed() ? islandWindow : null);

  function getBounds() {
    const d = screen.getPrimaryDisplay();
    return {
      x: Math.round(d.bounds.x + (d.bounds.width - ISLAND_WIDTH) / 2),
      y: d.bounds.y,
      width: ISLAND_WIDTH,
      height: ISLAND_HEIGHT,
    };
  }

  function repositionIsland() {
    const w = win();
    if (w) w.setBounds(getBounds());
  }

  function setIgnoreMouseSafe(ignore) {
    const w = win();
    if (!w) return;
    if (ignoringMouse === ignore) return;
    ignoringMouse = ignore;
    try {
      if (ignore) {
        w.setIgnoreMouseEvents(true, { forward: true });
      } else {
        w.setIgnoreMouseEvents(false);
      }
    } catch (_) {}
  }

  function setFocusableSafe(focusable) {
    const w = win();
    if (!w) return;
    const next = Boolean(focusable);
    if (isFocusable === next) {
      if (next) {
        try { w.focus(); } catch (_) {}
      }
      return;
    }
    isFocusable = next;
    try {
      w.setFocusable(next);
      if (next) w.focus();
    } catch (_) {}
  }

  // ---- Surveillance native du curseur (0 clic perdu, 0 latence IPC) --------
  function pollCursor() {
    const w = win();
    if (!w || !w.isVisible()) return;

    if (isCaptureActive || forceShow) {
      if (leaveTimer) {
        clearTimeout(leaveTimer);
        leaveTimer = null;
      }
      setIgnoreMouseSafe(false);
      return;
    }

    let pt;
    let wb;
    try {
      pt = screen.getCursorScreenPoint();
      wb = w.getBounds();
    } catch (_) {
      return;
    }

    const centerX = wb.x + wb.width / 2;
    const halfW = Math.max(72, (hitbox.width || 150) / 2) + 16;
    const topY = wb.y - 6;
    const bottomY = wb.y + (hitbox.top || 0) + (hitbox.height || 40) + 14;

    const inside =
      pt.x >= centerX - halfW &&
      pt.x <= centerX + halfW &&
      pt.y >= topY &&
      pt.y <= bottomY;

    if (inside) {
      if (leaveTimer) {
        clearTimeout(leaveTimer);
        leaveTimer = null;
      }
      setIgnoreMouseSafe(false);
      if (!cursorInside) {
        cursorInside = true;
        w.webContents.send('island-hover', true);
      }
    } else if (cursorInside && !leaveTimer) {
      leaveTimer = setTimeout(() => {
        leaveTimer = null;
        cursorInside = false;
        const curWin = win();
        if (curWin) {
          curWin.webContents.send('island-hover', false);
        }
        setFocusableSafe(false);
        setIgnoreMouseSafe(true);
      }, 170);
    } else if (!cursorInside && !ignoringMouse) {
      setIgnoreMouseSafe(true);
    }
  }

  function startCursorWatcher() {
    if (cursorTimer) return;
    cursorTimer = setInterval(pollCursor, CURSOR_POLL_MS);
  }

  function stopCursorWatcher() {
    if (cursorTimer) clearInterval(cursorTimer);
    cursorTimer = null;
    if (leaveTimer) clearTimeout(leaveTimer);
    leaveTimer = null;
    cursorInside = false;
  }

  function notifyVisibility(visible) {
    if (lastVisible === visible) return;
    lastVisible = visible;
    const w = win();
    if (w) w.webContents.send('island-visibility', visible);
  }

  function updateVisibility() {
    const w = win();
    if (!w) return;
    const cfg = loadConfig();

    const hide = () => {
      if (w.isVisible()) w.hide();
      stopCursorWatcher();
      notifyVisibility(false);
    };
    const show = () => {
      if (!w.isVisible()) w.showInactive();
      startCursorWatcher();
      notifyVisibility(true);
    };

    if (previewMode || forceShow) return show();
    if (!cfg.dynamicIslandEnabled) return hide();

    const main = getMainWindow();
    if (main && !main.isDestroyed() && main.isVisible() && !main.isMinimized() && main.isFocused()) {
      return hide();
    }
    if (cfg.dynamicIslandAutoHideFullscreen && isForegroundFullScreen) return hide();
    return show();
  }

  function createIslandWindow() {
    if (win()) return;
    ignoringMouse = true;
    isFocusable = false;
    cursorInside = false;
    islandWindow = new BrowserWindow({
      ...getBounds(),
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      hasShadow: false,
      show: false,
      focusable: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        backgroundThrottling: false,
      },
    });
    islandWindow.setAlwaysOnTop(true, 'screen-saver');
    islandWindow.setIgnoreMouseEvents(true, { forward: true });
    islandWindow.loadURL(`${getAppUrl()}/dynamic-island`);
    islandWindow.webContents.on('did-finish-load', () => {
      lastVisible = null;
      const cfg = loadConfig();
      islandWindow.webContents.send('island-config-updated', cfg);
      updateVisibility();
    });
    islandWindow.on('closed', () => {
      stopCursorWatcher();
      islandWindow = null;
      lastVisible = null;
    });
  }

  function destroyIslandWindow() {
    stopCursorWatcher();
    const w = win();
    if (w) w.destroy();
    islandWindow = null;
    lastVisible = null;
  }

  // ---- Plein écran / jeux -------------------------------------------------
  function startFullscreenDetection() {
    if (fsTimer || process.platform !== 'win32') return;
    fsTimer = setInterval(async () => {
      const cfg = loadConfig();
      if (!cfg.dynamicIslandEnabled || !cfg.dynamicIslandAutoHideFullscreen) {
        if (isForegroundFullScreen) {
          isForegroundFullScreen = false;
          updateVisibility();
        }
        return;
      }
      const main = getMainWindow();
      if (main && !main.isDestroyed() && main.isFocused()) return;
      const r = await islandNative.getForegroundRect();
      if (!r || typeof r.l !== 'number') return;
      const ignored = ['Progman', 'WorkerW', 'Shell_TrayWnd', 'Shell_SecondaryTrayWnd'].includes(r.cls);
      const d = screen.getPrimaryDisplay();
      const full =
        !ignored &&
        r.r - r.l >= d.bounds.width - 2 &&
        r.b - r.t >= d.bounds.height - 2 &&
        r.l <= d.bounds.x + 2 &&
        r.t <= d.bounds.y + 2;
      if (full !== isForegroundFullScreen) {
        isForegroundFullScreen = full;
        updateVisibility();
      }
    }, FS_POLL_MS);
  }

  function stopFullscreenDetection() {
    if (fsTimer) clearInterval(fsTimer);
    fsTimer = null;
    isForegroundFullScreen = false;
  }

  // ---- Presse-papiers (texte / liens / code, mémoire uniquement) ----------
  function classifyText(text) {
    const t = text.trim();
    if (/^(https?:\/\/|www\.)\S+$/i.test(t)) return 'link';
    if (t.includes('\n') && /[{};]\s*$|^\s*(const|let|var|function|import|export|class|def|public|SELECT|<\w+)/m.test(t)) {
      return 'code';
    }
    return 'text';
  }

  function getSerializableClipboard() {
    return clipboardItems.map(({ key, at, ...rest }) => rest);
  }

  function pushClipboardItem(item) {
    clipboardItems = clipboardItems.filter((i) => i.key !== item.key || i.pinned);
    clipboardItems.unshift(item);
    const pinned = clipboardItems.filter((i) => i.pinned);
    const rest = clipboardItems
      .filter((i) => !i.pinned)
      .slice(0, Math.max(0, CLIPBOARD_MAX - pinned.length));
    clipboardItems = [...pinned, ...rest].sort((a, b) => b.at - a.at);
    const w = win();
    if (w) w.webContents.send('island-clipboard-updated', getSerializableClipboard());
  }

  function pollClipboard() {
    const cfg = loadConfig();
    if (!cfg.dynamicIslandEnabled || !cfg.dynamicIslandClipboardHistory) return;
    try {
      const text = clipboard.readText();
      if (!text || !text.trim()) return;
      const clipped = text.length > 20000 ? text.slice(0, 20000) : text;
      const key = `txt:${clipped.length}:${clipped.slice(0, 80)}:${clipped.slice(-40)}`;
      if (key === lastClipKey || key === selfCopyKey) return;
      lastClipKey = key;
      const now = Date.now();
      pushClipboardItem({
        id: `clip-${now}-${Math.random().toString(36).slice(2, 6)}`,
        key,
        kind: classifyText(clipped),
        text: clipped,
        pinned: false,
        copiedAt: new Date(now).toISOString(),
        at: now,
      });
    } catch (_) {}
  }

  function startClipboardWatcher() {
    if (clipTimer) return;
    clipTimer = setInterval(pollClipboard, CLIP_POLL_MS);
  }

  function stopClipboardWatcher() {
    if (clipTimer) clearInterval(clipTimer);
    clipTimer = null;
  }

  // ---- Stats système -----------------------------------------------------
  function cpuSnapshot() {
    return os.cpus().reduce(
      (acc, c) => {
        const t = c.times;
        acc.idle += t.idle;
        acc.total += t.user + t.nice + t.sys + t.idle + t.irq;
        return acc;
      },
      { idle: 0, total: 0 }
    );
  }

  function getSystemStats() {
    const snap = cpuSnapshot();
    let cpuPercent = 0;
    if (lastCpu) {
      const dTotal = snap.total - lastCpu.total;
      const dIdle = snap.idle - lastCpu.idle;
      cpuPercent = dTotal > 0 ? Math.round((1 - dIdle / dTotal) * 100) : 0;
    }
    lastCpu = snap;
    const total = os.totalmem();
    const used = total - os.freemem();
    return {
      cpuPercent: Math.max(0, Math.min(100, cpuPercent)),
      ramPercent: Math.round((used / total) * 100),
      ramUsedGb: Number((used / 1073741824).toFixed(1)),
      ramTotalGb: Number((total / 1073741824).toFixed(0)),
    };
  }

  // ---- Pilotage en direct -------------------------------------------------
  function applyConfig() {
    const cfg = loadConfig();
    if (cfg.dynamicIslandEnabled) {
      createIslandWindow();
      startFullscreenDetection();
      if (cfg.dynamicIslandClipboardHistory) startClipboardWatcher();
      else stopClipboardWatcher();
    } else if (!previewMode && !forceShow) {
      stopFullscreenDetection();
      stopClipboardWatcher();
      destroyIslandWindow();
    }
    const w = win();
    if (w) w.webContents.send('island-config-updated', cfg);
    updateVisibility();
  }

  function whenReady(w, fn) {
    if (w.webContents.isLoading()) w.webContents.once('did-finish-load', fn);
    else fn();
  }

  function showCaptureTab() {
    createIslandWindow();
    const w = win();
    if (!w) return false;
    forceShow = true;
    isCaptureActive = true;
    whenReady(w, () => {
      updateVisibility();
      setIgnoreMouseSafe(false);
      setFocusableSafe(true);
      w.webContents.send('activate-island-capture');
    });
    return true;
  }

  function previewIsland() {
    previewMode = true;
    createIslandWindow();
    const w = win();
    if (!w) return { success: false };
    updateVisibility();
    whenReady(w, () => {
      setIgnoreMouseSafe(false);
      w.webContents.send('island-preview');
    });
    const schedulePreviewEnd = (delayMs) => {
      if (previewTimer) clearTimeout(previewTimer);
      previewTimer = setTimeout(() => {
        if (cursorInside || isCaptureActive) {
          schedulePreviewEnd(1500);
          return;
        }
        previewMode = false;
        applyConfig();
      }, delayMs);
    };
    schedulePreviewEnd(6500);
    return { success: true };
  }

  function registerIpc() {
    if (ipcRegistered) return;
    ipcRegistered = true;

    ipcMain.on('set-island-hitbox', (_e, nextBox) => {
      if (nextBox && typeof nextBox.width === 'number' && typeof nextBox.height === 'number') {
        hitbox = {
          width: nextBox.width,
          height: nextBox.height,
          top: typeof nextBox.top === 'number' ? nextBox.top : 0,
        };
      }
    });

    ipcMain.on('set-island-ignore-mouse', (_e, ignore) => {
      if (!ignore) {
        if (leaveTimer) {
          clearTimeout(leaveTimer);
          leaveTimer = null;
        }
        setIgnoreMouseSafe(false);
      } else if (!cursorInside && !isCaptureActive) {
        setIgnoreMouseSafe(true);
      }
    });

    ipcMain.on('set-island-focusable', (_e, focusable) => {
      isCaptureActive = Boolean(focusable);
      if (focusable) {
        setIgnoreMouseSafe(false);
        setFocusableSafe(true);
      } else {
        forceShow = false;
        if (!cursorInside) {
          setFocusableSafe(false);
        }
      }
    });

    ipcMain.on('island-capture-closed', () => {
      forceShow = false;
      isCaptureActive = false;
      cursorInside = false;
      setFocusableSafe(false);
      setIgnoreMouseSafe(true);
      applyConfig();
    });

    ipcMain.handle('open-main-app-route', (_e, route) => {
      const main = getMainWindow();
      if (!main || main.isDestroyed()) return { success: false };
      const safe = typeof route === 'string' && route.startsWith('/') ? route : '/';
      forceShow = false;
      isCaptureActive = false;
      previewMode = false;
      setFocusableSafe(false);
      if (main.isMinimized()) main.restore();
      main.show();
      main.focus();
      main.webContents.send('navigate-to-route', safe);
      updateVisibility();
      return { success: true };
    });

    ipcMain.handle('open-external-url', (_e, url) => {
      try {
        const u = new URL(String(url));
        if (!['http:', 'https:'].includes(u.protocol)) return { success: false };
        shell.openExternal(u.toString());
        return { success: true };
      } catch (_) {
        return { success: false };
      }
    });

    ipcMain.handle('preview-island', () => previewIsland());

    ipcMain.handle('get-clipboard-history', () => getSerializableClipboard());
    ipcMain.handle('copy-clipboard-item', (_e, idOrText) => {
      const byId = clipboardItems.find((i) => i.id === idOrText);
      const textToWrite = byId ? byId.text : typeof idOrText === 'string' ? idOrText : '';
      if (!textToWrite) return { success: false };
      const clipped = textToWrite.length > 20000 ? textToWrite.slice(0, 20000) : textToWrite;
      selfCopyKey = `txt:${clipped.length}:${clipped.slice(0, 80)}:${clipped.slice(-40)}`;
      clipboard.writeText(textToWrite);
      return { success: true };
    });
    ipcMain.handle('pin-clipboard-item', (_e, id) => {
      const item = clipboardItems.find((i) => i.id === id);
      if (item) item.pinned = !item.pinned;
      clipboardItems = [
        ...clipboardItems.filter((i) => i.pinned),
        ...clipboardItems.filter((i) => !i.pinned),
      ];
      return getSerializableClipboard();
    });
    ipcMain.handle('delete-clipboard-item', (_e, id) => {
      clipboardItems = clipboardItems.filter((i) => i.id !== id);
      return getSerializableClipboard();
    });
    ipcMain.handle('clear-clipboard-history', () => {
      clipboardItems = clipboardItems.filter((i) => i.pinned);
      return getSerializableClipboard();
    });

    ipcMain.handle('get-system-stats', () => getSystemStats());

    ipcMain.handle('get-now-playing', () => islandNative.getNowPlaying());
    ipcMain.handle('control-media', (_e, action) => islandNative.controlMedia(action));
    ipcMain.handle('select-media-session', (_e, appId) => islandNative.selectMediaSession(appId));
  }

  function init() {
    islandNative.init(app.getPath('userData'));
    registerIpc();
    screen.on('display-metrics-changed', repositionIsland);
    screen.on('display-added', repositionIsland);
    screen.on('display-removed', repositionIsland);
    applyConfig();
  }

  function shutdown() {
    stopCursorWatcher();
    stopFullscreenDetection();
    stopClipboardWatcher();
    islandNative.stop();
  }

  return {
    init,
    shutdown,
    applyConfig,
    updateVisibility,
    showCaptureTab,
    toggleEnabled() {
      const next = !loadConfig().dynamicIslandEnabled;
      saveConfig({ dynamicIslandEnabled: next });
      applyConfig();
      return next;
    },
  };
}

module.exports = { createIslandManager };
