'use client';

import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Monitor,
  Keyboard,
  BellRing,
  Folder,
  HardDrive,
  Database,
  FileText,
  Sparkles,
  Check,
  RotateCcw,
  LogOut,
  FolderOpen,
  Info,
  CheckCircle2,
  Zap,
  RefreshCw,
  Trash2,
  Sliders,
  Cpu,
  Clock,
  Power,
  Layers,
} from 'lucide-react';
import AdminUpdateSection from './AdminUpdateSection';
import { APP_VERSION } from '@/lib/version';

export const RECOMMENDED_SHORTCUTS = [
  { id: 'Alt+Space', label: 'Alt + Espace (Défaut standard Windows)' },
  { id: 'CommandOrControl+Alt+Space', label: 'Ctrl + Alt + Espace' },
  { id: 'CommandOrControl+Shift+Space', label: 'Ctrl + Shift + Espace' },
  { id: 'Alt+N', label: 'Alt + N (Note rapide)' },
  { id: 'CommandOrControl+Alt+N', label: 'Ctrl + Alt + N' },
  { id: 'CommandOrControl+Shift+N', label: 'Ctrl + Shift + N' },
  { id: 'Alt+Q', label: 'Alt + Q (Quick capture)' },
  { id: 'CommandOrControl+Alt+Q', label: 'Ctrl + Alt + Q' },
  { id: 'CommandOrControl+Shift+Q', label: 'Ctrl + Shift + Q' },
  { id: 'custom', label: '✨ Combinaison personnalisée...' },
];

interface DesktopSettingsSectionProps {
  isDark: boolean;
  onNotification: (msg: string, type?: 'success' | 'info' | 'error') => void;
  notes?: any[];
  tasks?: any[];
  projects?: any[];
  folders?: any[];
}

export default function DesktopSettingsSection({
  isDark,
  onNotification,
  notes = [],
  tasks = [],
  projects = [],
  folders = [],
}: DesktopSettingsSectionProps) {
  const [appVersion, setAppVersion] = useState<string>(APP_VERSION);
  const [isDesktopApp, setIsDesktopApp] = useState(false);

  // 1. Cycle de vie & Démarrage
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  const [closeToTray, setCloseToTray] = useState(true);

  // 2. Prise de Notes Rapides (Quick Capture)
  const [quickCaptureShortcut, setQuickCaptureShortcut] = useState('Alt+Space');
  const [selectedShortcutOption, setSelectedShortcutOption] = useState('Alt+Space');
  const [customShortcutInput, setCustomShortcutInput] = useState('');
  const [isUpdatingShortcut, setIsUpdatingShortcut] = useState(false);
  const [quickCaptureAutoClose, setQuickCaptureAutoClose] = useState(true);

  // 3. Barre des tâches & System Tray
  const [trayClickAction, setTrayClickAction] = useState<'toggle-app' | 'open-quick-capture'>('toggle-app');

  // 4. Performance, GPU & Maintenance
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);
  const [initialGpuSetting, setInitialGpuSetting] = useState(true);
  const [isClearingCache, setIsClearingCache] = useState(false);

  // 5. Sauvegardes Locales
  const [localBackupFolder, setLocalBackupFolder] = useState('');
  const [autoBackupInterval, setAutoBackupInterval] = useState<'disabled' | 'on_close' | 'daily'>('disabled');
  const [isExportingLocal, setIsExportingLocal] = useState(false);

  // 6. Dynamic Island Desktop (Nusa × Windows Dynamic Island × Syntropy)
  const [dynamicIslandEnabled, setDynamicIslandEnabled] = useState(false);
  const [dynamicIslandStyle, setDynamicIslandStyle] = useState<'pill' | 'notch'>('pill');
  const [dynamicIslandTrigger, setDynamicIslandTrigger] = useState<'hover' | 'click'>('hover');
  const [dynamicIslandAutoHideFullscreen, setDynamicIslandAutoHideFullscreen] = useState(true);
  const [dynamicIslandShortcutTarget, setDynamicIslandShortcutTarget] = useState<'island' | 'classic-window'>('island');
  const [dynamicIslandDefaultTab, setDynamicIslandDefaultTab] = useState<'media' | 'tasks' | 'focus' | 'habits' | 'shelf'>('media');
  const [dynamicIslandClipboardHistory, setDynamicIslandClipboardHistory] = useState(true);
  const [dynamicIslandSystemStats, setDynamicIslandSystemStats] = useState(true);

  // Chargement initial des préférences natives Desktop
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const electron = (window as any).electronAPI;
      if (electron?.isDesktop) {
        setIsDesktopApp(true);

        if (electron.getAppVersion) {
          electron
            .getAppVersion()
            .then((ver: string) => {
              if (ver) setAppVersion(ver);
            })
            .catch(() => {});
        }

        if (electron.getAutoStart) {
          electron
            .getAutoStart()
            .then((res: boolean) => setAutoStartEnabled(Boolean(res)))
            .catch(() => {});
        }

        if (electron.getDesktopConfig) {
          electron
            .getDesktopConfig()
            .then((cfg: any) => {
              if (cfg) {
                if (typeof cfg.closeToTray === 'boolean') setCloseToTray(cfg.closeToTray);
                if (cfg.trayClickAction) setTrayClickAction(cfg.trayClickAction);
                if (typeof cfg.hardwareAcceleration === 'boolean') {
                  setHardwareAcceleration(cfg.hardwareAcceleration);
                  setInitialGpuSetting(cfg.hardwareAcceleration);
                }
                if (typeof cfg.quickCaptureAutoClose === 'boolean') {
                  setQuickCaptureAutoClose(cfg.quickCaptureAutoClose);
                }
                if (cfg.autoBackupInterval) setAutoBackupInterval(cfg.autoBackupInterval);
                if (cfg.autoBackupFolder) setLocalBackupFolder(cfg.autoBackupFolder);

                if (typeof cfg.dynamicIslandEnabled === 'boolean') {
                  setDynamicIslandEnabled(cfg.dynamicIslandEnabled);
                }
                if (cfg.dynamicIslandStyle === 'pill' || cfg.dynamicIslandStyle === 'notch') {
                  setDynamicIslandStyle(cfg.dynamicIslandStyle);
                }
                if (cfg.dynamicIslandTrigger === 'hover' || cfg.dynamicIslandTrigger === 'click') {
                  setDynamicIslandTrigger(cfg.dynamicIslandTrigger);
                }
                if (typeof cfg.dynamicIslandAutoHideFullscreen === 'boolean') {
                  setDynamicIslandAutoHideFullscreen(cfg.dynamicIslandAutoHideFullscreen);
                }
                if (
                  cfg.dynamicIslandShortcutTarget === 'island' ||
                  cfg.dynamicIslandShortcutTarget === 'classic-window'
                ) {
                  setDynamicIslandShortcutTarget(cfg.dynamicIslandShortcutTarget);
                }
                if (cfg.dynamicIslandDefaultTab) {
                  setDynamicIslandDefaultTab(cfg.dynamicIslandDefaultTab);
                }
                if (typeof cfg.dynamicIslandClipboardHistory === 'boolean') {
                  setDynamicIslandClipboardHistory(cfg.dynamicIslandClipboardHistory);
                }
                if (typeof cfg.dynamicIslandSystemStats === 'boolean') {
                  setDynamicIslandSystemStats(cfg.dynamicIslandSystemStats);
                }

                if (cfg.shortcut) {
                  setQuickCaptureShortcut(cfg.shortcut);
                  const found = RECOMMENDED_SHORTCUTS.some((o) => o.id === cfg.shortcut);
                  if (found) {
                    setSelectedShortcutOption(cfg.shortcut);
                  } else {
                    setSelectedShortcutOption('custom');
                    setCustomShortcutInput(cfg.shortcut);
                  }
                }
              }
            })
            .catch(() => {});
        } else if (electron.getQuickCaptureShortcut) {
          electron
            .getQuickCaptureShortcut()
            .then((sc: string) => {
              if (sc) {
                setQuickCaptureShortcut(sc);
                const found = RECOMMENDED_SHORTCUTS.some((o) => o.id === sc);
                if (found) {
                  setSelectedShortcutOption(sc);
                } else {
                  setSelectedShortcutOption('custom');
                  setCustomShortcutInput(sc);
                }
              }
            })
            .catch(() => {});
        }
      }

      const savedFolder = localStorage.getItem('syntropy_local_backup_folder') || '';
      if (savedFolder && !localBackupFolder) setLocalBackupFolder(savedFolder);
    }
  }, []);

  // Helpers de persistance de configuration Electron
  const updateDesktopConfig = async (patch: Record<string, any>) => {
    const electron = (window as any).electronAPI;
    if (electron?.setDesktopConfig) {
      try {
        await electron.setDesktopConfig(patch);
      } catch (err) {
        console.error('Erreur setDesktopConfig:', err);
      }
    }
  };

  // 1. Cycle de vie & Démarrage
  const handleToggleAutoStart = async () => {
    const electron = (window as any).electronAPI;
    if (!electron?.setAutoStart) {
      onNotification('Le démarrage automatique nécessite l\'application Desktop native.', 'info');
      return;
    }
    try {
      const nextState = !autoStartEnabled;
      const res = await electron.setAutoStart(nextState);
      setAutoStartEnabled(Boolean(res));
      onNotification(
        res
          ? 'Syntropy OS se lancera désormais automatiquement au démarrage de Windows.'
          : 'Lancement automatique au démarrage de Windows désactivé.',
        'success'
      );
    } catch (err: any) {
      onNotification(`Erreur auto-start : ${err?.message || err}`, 'error');
    }
  };

  const handleToggleCloseToTray = async (value: boolean) => {
    setCloseToTray(value);
    await updateDesktopConfig({ closeToTray: value });
    onNotification(
      value
        ? 'Le clic sur la croix [X] réduira désormais Syntropy OS dans la barre d\'état (Tray).'
        : 'Le clic sur la croix [X] quittera désormais complètement l\'application.',
      'success'
    );
  };

  // 2. Remappage Raccourci Clavier Global
  const handleApplyShortcut = async (targetShortcut: string) => {
    const trimmed = targetShortcut.trim();
    if (!trimmed) {
      onNotification('Veuillez spécifier une combinaison de touches valide.', 'error');
      return;
    }
    const electron = (window as any).electronAPI;
    if (!electron?.setQuickCaptureShortcut) {
      onNotification('Le remappage du raccourci nécessite l\'application Desktop native.', 'info');
      return;
    }
    setIsUpdatingShortcut(true);
    try {
      const res = await electron.setQuickCaptureShortcut(trimmed);
      if (res?.success) {
        const confirmed = res.shortcut || trimmed;
        setQuickCaptureShortcut(confirmed);
        const found = RECOMMENDED_SHORTCUTS.some((o) => o.id === confirmed);
        if (found) {
          setSelectedShortcutOption(confirmed);
        } else {
          setSelectedShortcutOption('custom');
          setCustomShortcutInput(confirmed);
        }
        localStorage.setItem('syntropy_desktop_quick_capture_shortcut', confirmed);
        await updateDesktopConfig({ shortcut: confirmed });
        onNotification(`Raccourci de capture rapide mis à jour : ${confirmed}`, 'success');
      } else {
        onNotification(res?.error || 'Échec de la modification du raccourci.', 'error');
      }
    } catch (err: any) {
      onNotification(`Erreur : ${err?.message || err}`, 'error');
    } finally {
      setIsUpdatingShortcut(false);
    }
  };

  const handleTriggerQuickCapture = () => {
    const electron = (window as any).electronAPI;
    if (electron?.openQuickCapture) {
      electron.openQuickCapture();
    } else {
      window.open('/quick-capture', 'SyntropyQuickCapture', 'width=620,height=390,resizable=no');
    }
  };

  const handleToggleQuickCaptureAutoClose = async (value: boolean) => {
    setQuickCaptureAutoClose(value);
    localStorage.setItem('syntropy_desktop_auto_close_capture', value ? 'true' : 'false');
    await updateDesktopConfig({ quickCaptureAutoClose: value });
    onNotification(
      value
        ? 'La capture rapide se fermera automatiquement après chaque validation.'
        : 'La fenêtre de capture restera ouverte pour vous permettre d\'enchaîner vos saisies.',
      'success'
    );
  };

  // 3. Barre des tâches & Tray
  const handleChangeTrayClickAction = async (action: 'toggle-app' | 'open-quick-capture') => {
    setTrayClickAction(action);
    await updateDesktopConfig({ trayClickAction: action });
    onNotification(
      action === 'open-quick-capture'
        ? 'Le clic gauche sur l\'icône Tray ouvrira désormais la Capture Rapide.'
        : 'Le clic gauche sur l\'icône Tray affichera ou masquera l\'application principale.',
      'success'
    );
  };

  // 4. Performance, GPU & Maintenance
  const handleToggleHardwareAcceleration = async (value: boolean) => {
    setHardwareAcceleration(value);
    await updateDesktopConfig({ hardwareAcceleration: value });
    onNotification(
      `Accélération matérielle ${value ? 'activée' : 'désactivée'}. Veuillez redémarrer l'application.`,
      'info'
    );
  };

  const handleRelaunchApp = () => {
    const electron = (window as any).electronAPI;
    if (electron?.relaunchApp) {
      electron.relaunchApp();
    } else {
      window.location.reload();
    }
  };

  const handleClearDesktopCache = async () => {
    const electron = (window as any).electronAPI;
    if (!electron?.clearDesktopCache) {
      onNotification('Nettoyage du cache disponible sur l\'application Desktop native.', 'info');
      return;
    }
    setIsClearingCache(true);
    try {
      const res = await electron.clearDesktopCache();
      if (res?.success) {
        onNotification('Cache shaders, workers et stockage temporaire vidé avec succès !', 'success');
      } else {
        onNotification(`Erreur vidage cache : ${res?.error || 'Échec'}`, 'error');
      }
    } catch (err: any) {
      onNotification(`Erreur : ${err?.message || err}`, 'error');
    } finally {
      setIsClearingCache(false);
    }
  };

  // 5. Notification Native Windows Toast
  const handleTriggerTestNotification = async () => {
    const electron = (window as any).electronAPI;
    if (!electron?.showNotification) {
      onNotification('Notifications natives non disponibles dans cet environnement.', 'info');
      return;
    }
    await electron.showNotification({
      title: `Syntropy OS v${appVersion} — Session Focus`,
      body: 'Notification native de test ! Votre moteur de bureau Windows est opérationnel.',
    });
    onNotification('Notification native Windows Toast envoyée avec succès !', 'success');
  };

  // 6. Système de fichiers local & Sauvegardes
  const handleSelectLocalFolder = async () => {
    const electron = (window as any).electronAPI;
    if (!electron?.selectBackupFolder) {
      onNotification('La sélection de dossier nécessite l\'application Desktop.', 'info');
      return;
    }
    const folder = await electron.selectBackupFolder();
    if (folder) {
      setLocalBackupFolder(folder);
      localStorage.setItem('syntropy_local_backup_folder', folder);
      await updateDesktopConfig({ autoBackupFolder: folder });
      onNotification(`Dossier de sauvegarde sélectionné : ${folder}`, 'success');
    }
  };

  const handleChangeAutoBackupInterval = async (interval: 'disabled' | 'on_close' | 'daily') => {
    setAutoBackupInterval(interval);
    await updateDesktopConfig({ autoBackupInterval: interval });
    const labels = {
      disabled: 'Sauvegardes automatiques désactivées (manuelles uniquement).',
      on_close: 'Sauvegarde automatique activée à chaque fermeture de l\'application.',
      daily: 'Sauvegarde quotidienne locale activée.',
    };
    onNotification(labels[interval], 'success');
  };

  const handleExportLocalJsonBackup = async () => {
    const electron = (window as any).electronAPI;
    if (!electron?.saveLocalBackup) {
      onNotification('Export local disponible uniquement sur la version Desktop.', 'info');
      return;
    }
    if (!localBackupFolder) {
      onNotification('Veuillez d\'abord sélectionner un dossier cible avec "Parcourir...".', 'info');
      return;
    }
    setIsExportingLocal(true);
    try {
      const backupData = {
        version: appVersion,
        exportedAt: new Date().toISOString(),
        notes,
        tasks,
        projects,
        folders,
      };
      const fileName = `syntropy-backup-${new Date().toISOString().split('T')[0]}.json`;
      const res = await electron.saveLocalBackup(
        localBackupFolder,
        fileName,
        JSON.stringify(backupData, null, 2)
      );
      if (res?.success) {
        onNotification(`Sauvegarde enregistrée avec succès : ${res.filePath}`, 'success');
      } else {
        onNotification(`Erreur : ${res?.error}`, 'error');
      }
    } catch (e: any) {
      onNotification(`Erreur d'export : ${e?.message || e}`, 'error');
    } finally {
      setIsExportingLocal(false);
    }
  };

  const handleExportLocalNotesMarkdown = async () => {
    const electron = (window as any).electronAPI;
    if (!electron?.exportNotesMarkdown) {
      onNotification('Export Markdown disponible uniquement sur la version Desktop.', 'info');
      return;
    }
    if (!localBackupFolder) {
      onNotification('Veuillez d\'abord sélectionner un dossier cible avec "Parcourir...".', 'info');
      return;
    }
    setIsExportingLocal(true);
    try {
      const res = await electron.exportNotesMarkdown(localBackupFolder, notes);
      if (res?.success) {
        onNotification(
          `${res.count || notes.length} notes exportées en fichiers .md dans le dossier !`,
          'success'
        );
      } else {
        onNotification(`Erreur : ${res?.error}`, 'error');
      }
    } catch (e: any) {
      onNotification(`Erreur d'export Markdown : ${e?.message || e}`, 'error');
    } finally {
      setIsExportingLocal(false);
    }
  };

  const handleOpenDistFolder = async () => {
    const electron = (window as any).electronAPI;
    if (electron?.openDistFolder) {
      await electron.openDistFolder();
    }
  };

  const handleQuitApp = () => {
    const electron = (window as any).electronAPI;
    if (electron?.quitApp) {
      electron.quitApp();
    }
  };

  const hasGpuSettingChanged = hardwareAcceleration !== initialGpuSetting;

  return (
    <div className="space-y-6">
      {/* Bannière Header Desktop */}
      <div
        className={`p-6 rounded-3xl border transition-all ${
          isDark
            ? 'bg-gradient-to-br from-zinc-900/90 via-cyan-950/20 to-zinc-900/90 border-cyan-500/20 shadow-xl shadow-cyan-950/10'
            : 'bg-gradient-to-br from-white via-cyan-50/40 to-white border-cyan-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner flex-shrink-0">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  Syntropy OS Desktop (Application Officielle)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold">
                  v{appVersion}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Moteur Natif Actif
                </span>
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Paramètres exclusifs au runtime Windows (Electron 44, isolation double-fenêtre, accès système de fichiers et raccourcis globaux).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleOpenDistFolder}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-zinc-800/80 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                  : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
              }`}
              title="Ouvrir le dossier contenant les fichiers compilés"
            >
              <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dossier App</span>
            </button>
            <button
              type="button"
              onClick={handleQuitApp}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Fermer et quitter complètement Syntropy OS"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Quitter l&apos;App</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION DYNAMIC ISLAND DESKTOP (NUSA × WINDOWS DYNAMIC ISLAND × SYNTROPY) */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isDark
            ? 'bg-gradient-to-br from-zinc-900/90 via-purple-950/20 to-zinc-900/90 border-purple-500/30 shadow-lg shadow-purple-950/10'
            : 'bg-gradient-to-br from-white via-purple-50/40 to-white border-purple-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base">🏝️</span>
              <span className={`text-sm font-extrabold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                Dynamic Island Desktop (Windows Live Hub)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
                Nouveau v2.7
              </span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Pilule interactive en haut de votre écran Windows : contrôle média SMTC & paroles synchronisées, tâches prioritaires, Pomodoro, agenda visio 1-clic, habitudes, Dropzone Shelf et presse-papiers intelligent. Se masque automatiquement quand Syntropy OS est au premier plan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={async () => {
                const electron = (window as any).electronAPI;
                if (electron?.previewIsland) {
                  if (!dynamicIslandEnabled) {
                    setDynamicIslandEnabled(true);
                    await updateDesktopConfig({ dynamicIslandEnabled: true });
                  }
                  await electron.previewIsland();
                  onNotification(
                    'Aperçu de la Dynamic Island affiché en haut de votre écran pendant 4 secondes !',
                    'info'
                  );
                } else {
                  window.open('/dynamic-island', '_blank', 'width=560,height=340');
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tester en direct</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                const next = !dynamicIslandEnabled;
                setDynamicIslandEnabled(next);
                await updateDesktopConfig({ dynamicIslandEnabled: next });
                onNotification(
                  next
                    ? 'Dynamic Island activée ! Réduisez Syntropy OS pour la voir apparaître en haut de votre écran.'
                    : 'Dynamic Island désactivée.',
                  'success'
                );
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer flex-shrink-0 ${
                dynamicIslandEnabled
                  ? 'bg-purple-600 justify-end'
                  : isDark
                  ? 'bg-zinc-800 justify-start'
                  : 'bg-zinc-300 justify-start'
              }`}
              title="Activer / Désactiver la Dynamic Island"
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </div>

        {/* Options détaillées de la Dynamic Island */}
        <div
          className={`mt-4 pt-4 border-t ${
            isDark ? 'border-zinc-800/80' : 'border-zinc-200'
          } grid grid-cols-1 md:grid-cols-2 gap-3.5`}
        >
          {/* Style visuel : Pill Liquid Glass vs Living Notch */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            } space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                Style visuel de l&apos;encoche
              </span>
              <span className="text-[10px] font-mono text-purple-400">60 FPS Morphing</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={async () => {
                  setDynamicIslandStyle('pill');
                  await updateDesktopConfig({ dynamicIslandStyle: 'pill' });
                  onNotification('Style Pilule flottante Liquid Glass activé.', 'success');
                }}
                className={`p-2 rounded-lg text-xs border text-left transition-all cursor-pointer ${
                  dynamicIslandStyle === 'pill'
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 font-bold'
                    : isDark
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    : 'bg-white border-zinc-200 text-zinc-600'
                }`}
              >
                <div>💊 Pilule Flottante</div>
                <div className="text-[10px] text-zinc-500 font-normal">
                  Liquid Glass détachée (8px)
                </div>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setDynamicIslandStyle('notch');
                  await updateDesktopConfig({ dynamicIslandStyle: 'notch' });
                  onNotification('Style Living Notch collée en haut activé.', 'success');
                }}
                className={`p-2 rounded-lg text-xs border text-left transition-all cursor-pointer ${
                  dynamicIslandStyle === 'notch'
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 font-bold'
                    : isDark
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    : 'bg-white border-zinc-200 text-zinc-600'
                }`}
              >
                <div>⬛ Living Notch</div>
                <div className="text-[10px] text-zinc-500 font-normal">
                  Soudée au bord supérieur (y=0)
                </div>
              </button>
            </div>
          </div>

          {/* Mode d'ouverture & Onglet par défaut */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            } space-y-2.5`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                Déclencheur d&apos;expansion :
              </span>
              <div className="flex items-center gap-1.5">
                {(
                  [
                    { id: 'hover', label: 'Survol souris' },
                    { id: 'click', label: 'Clic uniquement' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={async () => {
                      setDynamicIslandTrigger(t.id);
                      await updateDesktopConfig({ dynamicIslandTrigger: t.id });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      dynamicIslandTrigger === t.id
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-200'
                        : isDark
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        : 'bg-white border-zinc-200 text-zinc-600'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                Onglet par défaut :
              </span>
              <select
                value={dynamicIslandDefaultTab}
                onChange={async (e) => {
                  const val = e.target.value as any;
                  setDynamicIslandDefaultTab(val);
                  await updateDesktopConfig({ dynamicIslandDefaultTab: val });
                }}
                className={`text-xs px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                    : 'bg-white border-zinc-300 text-zinc-800'
                }`}
              >
                <option value="media">🎵 Média Live & Paroles</option>
                <option value="tasks">✅ Tâches & Quick-Capture</option>
                <option value="focus">⏱️ Focus Pomodoro & Agenda</option>
                <option value="habits">🔥 Habitudes & Lecture</option>
                <option value="shelf">📥 Dropzone Shelf & Presse-papiers</option>
              </select>
            </div>
          </div>

          {/* Cible du raccourci Alt+Espace & Auto-hide Plein Écran */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            } space-y-2.5`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  Cible du raccourci ({quickCaptureShortcut})
                </div>
                <div className="text-[10px] text-zinc-500">
                  Ouvrir la saisie rapide dans l&apos;Island ou la fenêtre classique
                </div>
              </div>
              <select
                value={dynamicIslandShortcutTarget}
                onChange={async (e) => {
                  const val = e.target.value as 'island' | 'classic-window';
                  setDynamicIslandShortcutTarget(val);
                  await updateDesktopConfig({ dynamicIslandShortcutTarget: val });
                }}
                className={`text-xs px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                    : 'bg-white border-zinc-300 text-zinc-800'
                }`}
              >
                <option value="island">🏝️ Déployer la Dynamic Island</option>
                <option value="classic-window">🪟 Fenêtre Quick-Capture classique</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div>
                <div className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  Masquage auto en Plein Écran / Jeux
                </div>
                <div className="text-[10px] text-zinc-500">
                  Se masque automatiquement pendant vos vidéos et jeux plein écran
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const next = !dynamicIslandAutoHideFullscreen;
                  setDynamicIslandAutoHideFullscreen(next);
                  await updateDesktopConfig({ dynamicIslandAutoHideFullscreen: next });
                }}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer flex-shrink-0 ${
                  dynamicIslandAutoHideFullscreen
                    ? 'bg-purple-600 justify-end'
                    : isDark
                    ? 'bg-zinc-800 justify-start'
                    : 'bg-zinc-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow" />
              </button>
            </div>
          </div>

          {/* Presse-papiers intelligent & Télémétrie CPU/RAM */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            } space-y-2.5`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  Historique Presse-papiers (20 éléments)
                </div>
                <div className="text-[10px] text-zinc-500">
                  Mémorise textes, liens et extraits de code en mémoire vive
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const next = !dynamicIslandClipboardHistory;
                  setDynamicIslandClipboardHistory(next);
                  await updateDesktopConfig({ dynamicIslandClipboardHistory: next });
                }}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer flex-shrink-0 ${
                  dynamicIslandClipboardHistory
                    ? 'bg-purple-600 justify-end'
                    : isDark
                    ? 'bg-zinc-800 justify-start'
                    : 'bg-zinc-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div>
                <div className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  Moniteur Système CPU & RAM
                </div>
                <div className="text-[10px] text-zinc-500">
                  Affiche la charge processeur et mémoire en bas de l&apos;Island
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const next = !dynamicIslandSystemStats;
                  setDynamicIslandSystemStats(next);
                  await updateDesktopConfig({ dynamicIslandSystemStats: next });
                }}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer flex-shrink-0 ${
                  dynamicIslandSystemStats
                    ? 'bg-purple-600 justify-end'
                    : isDark
                    ? 'bg-zinc-800 justify-start'
                    : 'bg-zinc-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1 : CYCLE DE VIE & DÉMARRAGE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lancement au Démarrage de Windows */}
        <div
          className={`p-5 rounded-2xl border transition-colors ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-purple-400" />
                <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  Lancement au Démarrage de Windows
                </span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Démarre Syntropy OS silencieusement en arrière-plan dès le boot de votre ordinateur.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleAutoStart}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer flex-shrink-0 ${
                autoStartEnabled
                  ? 'bg-purple-600 justify-end'
                  : isDark
                  ? 'bg-zinc-800 justify-start'
                  : 'bg-zinc-300 justify-start'
              }`}
              title="Activer/Désactiver le démarrage automatique"
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800/40 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Statut système :</span>
            <span
              className={`font-mono font-semibold ${
                autoStartEnabled ? 'text-emerald-400' : 'text-zinc-500'
              }`}
            >
              {autoStartEnabled ? 'Actif au boot Windows' : 'Désactivé'}
            </span>
          </div>
        </div>

        {/* Action de fermeture de la croix [X] */}
        <div
          className={`p-5 rounded-2xl border transition-colors ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Power className="w-4 h-4 text-pink-400" />
                <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  Action du Bouton Fermer [X]
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">
                Cycle de vie
              </span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Comportement lors d&apos;un clic sur la croix [X] en haut à droite de la fenêtre.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleToggleCloseToTray(true)}
                className={`p-2 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer ${
                  closeToTray
                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 font-semibold'
                    : isDark
                    ? 'bg-zinc-800/50 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                    : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Réduire au Tray</span>
                </div>
                <div className="text-[10px] text-zinc-500 leading-tight">
                  Reste actif en arrière-plan près de l&apos;horloge
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleToggleCloseToTray(false)}
                className={`p-2 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer ${
                  !closeToTray
                    ? 'bg-red-500/15 border-red-500/40 text-red-300 font-semibold'
                    : isDark
                    ? 'bg-zinc-800/50 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                    : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>Quitter l&apos;App</span>
                </div>
                <div className="text-[10px] text-zinc-500 leading-tight">
                  Arrête immédiatement tous les processus
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 : PRISE DE NOTES RAPIDES (QUICK CAPTURE) */}
      <div
        className={`p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Keyboard className="w-4 h-4 text-cyan-400" />
              <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                Capture Rapide Globale (Fenêtre Flottante Dédiée)
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-[11px] font-mono border border-cyan-500/30 flex items-center gap-1 font-semibold">
                <span>{quickCaptureShortcut}</span>
              </span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Fenêtre flottante sans bordure au-dessus de tout Windows pour capturer notes, tâches et idées sans quitter votre flux de travail.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleTriggerQuickCapture}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Ouvrir immédiatement la fenêtre de capture rapide"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tester la fenêtre</span>
            </button>
          </div>
        </div>

        {/* Sélecteur de Raccourci Clavier */}
        <div className={`mt-3.5 pt-3.5 border-t ${isDark ? 'border-zinc-800/60' : 'border-zinc-100'} space-y-2.5`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              <span>Raccourci clavier assigné :</span>
            </label>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedShortcutOption}
                disabled={isUpdatingShortcut}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedShortcutOption(val);
                  if (val !== 'custom') {
                    handleApplyShortcut(val);
                  }
                }}
                className={`text-xs px-2.5 py-1.5 rounded-xl border font-mono outline-none transition-all cursor-pointer ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-700 text-zinc-200 focus:border-cyan-500'
                    : 'bg-zinc-50 border-zinc-300 text-zinc-800 focus:border-cyan-600'
                }`}
              >
                {RECOMMENDED_SHORTCUTS.map((opt) => (
                  <option
                    key={opt.id}
                    value={opt.id}
                    className={isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-900'}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>

              {quickCaptureShortcut !== 'Alt+Space' && (
                <button
                  type="button"
                  disabled={isUpdatingShortcut}
                  onClick={() => handleApplyShortcut('Alt+Space')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Réinitialiser sur Alt+Espace"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Réinitialiser</span>
                </button>
              )}
            </div>
          </div>

          {selectedShortcutOption === 'custom' && (
            <div
              className={`p-2.5 rounded-xl border ${
                isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              } flex flex-col sm:flex-row items-stretch sm:items-center gap-2`}
            >
              <input
                type="text"
                value={customShortcutInput}
                onChange={(e) => setCustomShortcutInput(e.target.value)}
                placeholder="Ex: CommandOrControl+Shift+J ou Alt+F11"
                className={`flex-1 text-xs px-3 py-1.5 rounded-lg border font-mono outline-none transition-all ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-cyan-500'
                    : 'bg-white border-zinc-300 text-zinc-900 focus:border-cyan-600'
                }`}
              />
              <button
                type="button"
                disabled={isUpdatingShortcut || !customShortcutInput.trim()}
                onClick={() => handleApplyShortcut(customShortcutInput)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Appliquer</span>
              </button>
            </div>
          )}
        </div>

        {/* Option Comportement après validation */}
        <div className={`mt-3.5 pt-3.5 border-t ${isDark ? 'border-zinc-800/60' : 'border-zinc-100'} flex items-center justify-between gap-3`}>
          <div>
            <div className={`text-xs font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
              Fermeture automatique après enregistrement
            </div>
            <div className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {quickCaptureAutoClose
                ? 'Ferme la fenêtre dès validation. Décochez pour enchaîner plusieurs notes sans rouvrir la fenêtre.'
                : 'La fenêtre reste ouverte après chaque note validée pour enchaîner vos saisies rapides.'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleToggleQuickCaptureAutoClose(!quickCaptureAutoClose)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer flex-shrink-0 ${
              quickCaptureAutoClose
                ? 'bg-cyan-500 justify-end'
                : isDark
                ? 'bg-zinc-800 justify-start'
                : 'bg-zinc-300 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>
      </div>

      {/* SECTION 3 : BARRE DES TÂCHES & SYSTEM TRAY */}
      <div
        className={`p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" />
              <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                Icône System Tray & Clic Gauche
              </span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Action déclenchée lors d&apos;un simple clic gauche sur l&apos;icône violette Syntropy OS près de l&apos;horloge Windows.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleChangeTrayClickAction('toggle-app')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                trayClickAction === 'toggle-app'
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 font-semibold'
                  : isDark
                  ? 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Afficher / Masquer l&apos;App
            </button>
            <button
              type="button"
              onClick={() => handleChangeTrayClickAction('open-quick-capture')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                trayClickAction === 'open-quick-capture'
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-semibold'
                  : isDark
                  ? 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Ouvrir Capture Rapide
            </button>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-zinc-800/40 flex items-center gap-2 text-[10px] text-zinc-400 flex-wrap">
          <span className="text-zinc-500">Menu contextuel (clic droit) :</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700">⏯️ Pomodoro</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700">📋 Top 3 tâches</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700">📝 Note rapide</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700">🚪 Quitter</span>
        </div>
      </div>

      {/* SECTION 4 : PERFORMANCE, GPU & MAINTENANCE DU CACHE */}
      <div
        className={`p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                Performance & Maintenance Desktop
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Chromium Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Accélération matérielle GPU */}
            <div
              className={`p-4 rounded-xl border ${
                isDark ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              } flex flex-col justify-between gap-3`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className={`text-xs font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                      Accélération Matérielle GPU
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleHardwareAcceleration(!hardwareAcceleration)}
                    className={`w-11 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer flex-shrink-0 ${
                      hardwareAcceleration
                        ? 'bg-amber-500 justify-end'
                        : isDark
                        ? 'bg-zinc-800 justify-start'
                        : 'bg-zinc-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow" />
                  </button>
                </div>
                <p className={`text-[11px] mt-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Exploite votre carte graphique pour un rendu ultra-fluide. Désactivez si vous observez des scintillements d&apos;écran ou une consommation anormale sur GPU intégré.
                </p>
              </div>

              {hasGpuSettingChanged && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-amber-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Redémarrage requis</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRelaunchApp}
                    className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-semibold text-[10px] transition-colors cursor-pointer"
                  >
                    Redémarrer
                  </button>
                </div>
              )}
            </div>

            {/* Vider le cache Desktop */}
            <div
              className={`p-4 rounded-xl border ${
                isDark ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              } flex flex-col justify-between gap-3`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Trash2 className="w-4 h-4 text-cyan-400" />
                  <span className={`text-xs font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    Cache Chromium & Shaders
                  </span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Purge le cache de rendu, les service workers et les shaders compilés sans perdre votre session ni vos données locales.
                </p>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  disabled={isClearingCache}
                  onClick={handleClearDesktopCache}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    isDark
                      ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-cyan-300'
                      : 'bg-white hover:bg-zinc-100 border-zinc-300 text-cyan-700'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isClearingCache ? 'animate-spin' : ''}`} />
                  <span>{isClearingCache ? 'Nettoyage...' : 'Vider le cache Desktop'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5 : MISES À JOUR AUTOMATIQUES (electron-updater) */}
      <div>
        <AdminUpdateSection isDark={isDark} onNotification={onNotification} />
      </div>

      {/* SECTION 6 : NOTIFICATIONS NATIVES WINDOWS TOAST */}
      <div
        className={`p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-400" />
              <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                Notifications Toast Windows Interactives
              </span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Notifications système intégrées au Centre de notifications Windows avec boutons d&apos;actions directes (ex: Pomodoro « Terminé », « Reporter »).
            </p>
          </div>

          <button
            type="button"
            onClick={handleTriggerTestNotification}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Envoyer Toast de test</span>
          </button>
        </div>
        <div className="mt-3 pt-3 border-t border-zinc-800/40 flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">Support système :</span>
          <span className="font-mono text-amber-400">Windows Action Center</span>
        </div>
      </div>

      {/* SECTION 7 : SYSTÈME DE FICHIERS LOCAL & SAUVEGARDES */}
      <div
        className={`p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  Système de Fichiers Local & Sauvegardes
                </span>
                <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Node.js fs / dialog
                </span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Sélectionnez un répertoire sur votre disque pour sauvegarder vos notes au format Markdown standard (.md) ou générer des copies JSON intégrales.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-zinc-500">Dossier cible :</span>
                <code className="text-[11px] font-mono text-purple-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 truncate max-w-sm">
                  {localBackupFolder || 'Aucun dossier sélectionné (Cliquez sur Parcourir)'}
                </code>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSelectLocalFolder}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Folder className="w-3.5 h-3.5 text-zinc-400" />
                <span>Parcourir...</span>
              </button>

              <button
                type="button"
                onClick={handleExportLocalJsonBackup}
                disabled={isExportingLocal}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Sauvegarder les données au format JSON dans le dossier local"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Sauvegarde JSON</span>
              </button>

              <button
                type="button"
                onClick={handleExportLocalNotesMarkdown}
                disabled={isExportingLocal}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Exporter toutes les notes en fichiers Markdown (.md)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Exporter Notes (.md)</span>
              </button>
            </div>
          </div>

          {/* Fréquence de sauvegarde automatique */}
          <div className={`pt-3.5 border-t ${isDark ? 'border-zinc-800/60' : 'border-zinc-100'} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
            <div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span className={`text-xs font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  Fréquence de sauvegarde automatique
                </span>
              </div>
              <div className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Enregistre une archive JSON automatique dans le dossier cible sélectionné.
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'disabled', label: 'Désactivé' },
                  { id: 'on_close', label: 'À la fermeture' },
                  { id: 'daily', label: 'Quotidienne' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => handleChangeAutoBackupInterval(mode.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    autoBackupInterval === mode.id
                      ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 font-semibold'
                      : isDark
                      ? 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
