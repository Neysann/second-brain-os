// ==============================================================================
// SYNTROPY OS — GESTIONNAIRE DE LA DYNAMIC ISLAND DESKTOP (Electron / Windows)
// ==============================================================================
// Fenêtre dédiée transparente + click-through, visibilité intelligente, détection
// plein écran, presse-papiers (20 éléments texte/lien/code, mémoire uniquement),
// stats CPU/RAM, pont SMTC (via island-native.js) et IPC dédiés.

const os = require('os');
const path = require('path');
const { BrowserWindow, screen, ipcMain, clipboard, shell, app } = require('electron');
const islandNative = require('./island-native');

const ISLAND_WIDTH = 560;
const ISLAND_HEIGHT = 420;
const CLIPBOARD_MAX = 20;
const FS_POLL_MS = 3000;
const CLIP_POLL_MS = 1200;

function createIslandManager({ getMainWindow, loadConfig, saveConfig, getAppUrl }) {
  let islandWindow = null;
  let previewMode = false;
  let previewTimer = null;
  let forceShow = false; // Quick-Capture déployé : l'Island reste visible
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

  function notifyVisibility(visible) {
    if (lastVisible === visible) return;
    lastVisible = visible;
    const w = win();
    if (w) w.webContents.send('island-action', 'visibility', visible);
  }

  function updateVisibility() {
    const w = win();
    if (!w) return;
    const cfg = loadConfig();

    const hide = () => {
      if (w.isVisible()) w.hide();
      notifyVisibility(false);
    };
    const show = () => {
      if (!w.isVisible()) w.showInactive();
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
    islandWindow = new BrowserWindow({
      ...getBounds(),
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
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
      updateVisibility();
    });
    islandWindow.on('closed', () => {
      islandWindow = null;
      lastVisible = null;
    });
  }

  function destroyIslandWindow() {
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
    if (t.includes('\n') && /[{};]\s*$|^\s*(const|let|var|function|import|export|class|def|public|SELECT|<\w+)/m.test(t)) return 'code';
    return 'text';
  }

  function pushClipboardItem(item) {
    clipboardItems = clipboardItems.filter((i) => i.key !== item.key || i.pinned);
    clipboardItems.unshift(item);
    const pinned = clipboardItems.filter((i) => i.pinned);
    const rest = clipboardItems.filter((i) => !i.pinned).slice(0, Math.max(0, CLIPBOARD_MAX - pinned.length));
    clipboardItems = [...pinned, ...rest].sort((a, b) => b.at - a.at);
    const w = win();
    if (w) w.webContents.send('island-action', 'clipboard-updated');
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
      pushClipboardItem({
        id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        key,
        type: classifyText(clipped),
        content: clipped,
        preview: clipped.slice(0, 160),
        pinned: false,
        at: Date.now(),
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
    let cpu = 0;
    if (lastCpu) {
      const dTotal = snap.total - lastCpu.total;
      const dIdle = snap.idle - lastCpu.idle;
      cpu = dTotal > 0 ? Math.round((1 - dIdle / dTotal) * 100) : 0;
    }
    lastCpu = snap;
    const total = os.totalmem();
    const used = total - os.freemem();
    return { cpu: Math.max(0, Math.min(100, cpu)), ram: Math.round((used / total) * 100) };
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
    if (w) w.webContents.send('island-action', 'config-changed', cfg);
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
    whenReady(w, () => {
      updateVisibility();
      w.setFocusable(true);
      w.focus();
      w.webContents.send('island-action', 'open-tab', 'capture');
    });
    return true;
  }

  function previewIsland() {
    previewMode = true;
    createIslandWindow();
    const w = win();
    if (!w) return { success: false };
    updateVisibility();
    whenReady(w, () => w.webContents.send('island-action', 'preview'));
    if (previewTimer) clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      previewMode = false;
      applyConfig();
    }, 12000);
    return { success: true };
  }

  function registerIpc() {
    if (ipcRegistered) return;
    ipcRegistered = true;

    ipcMain.on('set-island-ignore-mouse', (_e, ignore) => {
      const w = win();
      if (!w) return;
      if (ignore) w.setIgnoreMouseEvents(true, { forward: true });
      else w.setIgnoreMouseEvents(false);
    });

    ipcMain.on('set-island-focusable', (_e, focusable) => {
      const w = win();
      if (!w) return;
      w.setFocusable(Boolean(focusable));
      if (focusable) w.focus();
    });

    ipcMain.on('island-capture-closed', () => {
      forceShow = false;
      const w = win();
      if (w) w.setFocusable(false);
      applyConfig();
    });

    ipcMain.handle('open-main-app-route', (_e, route) => {
      const main = getMainWindow();
      if (!main || main.isDestroyed()) return { success: false };
      const safe = typeof route === 'string' && route.startsWith('/') ? route : '/';
      if (main.isMinimized()) main.restore();
      main.show();
      main.focus();
      main.webContents.send('navigate-to-route', safe);
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

    ipcMain.handle('get-clipboard-history', () => clipboardItems.map(({ key, ...rest }) => rest));
    ipcMain.handle('copy-clipboard-item', (_e, id) => {
      const item = clipboardItems.find((i) => i.id === id);
      if (!item) return { success: false };
      selfCopyKey = item.key;
      clipboard.writeText(item.content);
      return { success: true };
    });
    ipcMain.handle('pin-clipboard-item', (_e, id) => {
      const item = clipboardItems.find((i) => i.id === id);
      if (item) item.pinned = !item.pinned;
      return { success: Boolean(item) };
    });
    ipcMain.handle('delete-clipboard-item', (_e, id) => {
      clipboardItems = clipboardItems.filter((i) => i.id !== id);
      return { success: true };
    });
    ipcMain.handle('clear-clipboard-history', () => {
      clipboardItems = clipboardItems.filter((i) => i.pinned);
      return { success: true };
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

