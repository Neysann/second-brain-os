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
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  const [localBackupFolder, setLocalBackupFolder] = useState('');
  const [isExportingLocal, setIsExportingLocal] = useState(false);

  // Raccourci Clavier Global Quick-Capture
  const [quickCaptureShortcut, setQuickCaptureShortcut] = useState('Alt+Space');
  const [selectedShortcutOption, setSelectedShortcutOption] = useState('Alt+Space');
  const [customShortcutInput, setCustomShortcutInput] = useState('');
  const [isUpdatingShortcut, setIsUpdatingShortcut] = useState(false);

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
        if (electron.getQuickCaptureShortcut) {
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
      setLocalBackupFolder(savedFolder);
    }
  }, []);

  // 1. Démarrage Automatique (Auto-Start)
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

  // 3. Notification Native Windows Toast
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

  // 4. Système de fichiers local
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
      onNotification(`Dossier de sauvegarde sélectionné : ${folder}`, 'success');
    }
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

      {/* Grille Principale des Paramètres Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Lancement au Démarrage de Windows (Auto-Start) */}
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
                Démarre Syntropy OS silencieusement en arrière-plan dès le boot de Windows.
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
              {autoStartEnabled ? 'Lancement automatique actif' : 'Désactivé'}
            </span>
          </div>
        </div>

        {/* 2. Zone de Notification Windows (System Tray) */}
        <div
          className={`p-5 rounded-2xl border transition-colors ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" />
              <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                System Tray & Menu Barre des Tâches
              </span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Icône violette active près de l&apos;horloge. Le clic sur la croix [X] réduit l&apos;application dans le Tray au lieu de la fermer.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800/40 flex items-center gap-2 text-[10px] text-zinc-400 flex-wrap">
            <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700">⏯️ Pomodoro</span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700">📋 Top 3 tâches</span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700">📝 Note rapide</span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700">🚪 Quitter</span>
          </div>
        </div>
      </div>

      {/* 3. Carte Remappage Raccourci Clavier Global (Quick-Capture) */}
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
                Capture Rapide Globale (Fenêtre Flottante)
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-[11px] font-mono border border-cyan-500/30 flex items-center gap-1 font-semibold">
                <span>{quickCaptureShortcut}</span>
              </span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Fenêtre flottante sans bordure au-dessus de tout le système d&apos;exploitation pour capturer notes, tâches et idées dans l&apos;Inbox.
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

        {/* Sélecteur de Remappage */}
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

          {/* Champ personnalisé si custom sélectionné */}
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

        <div className="mt-2.5 pt-2.5 border-t border-zinc-800/40 flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">Mode d&apos;exécution :</span>
          <span className="font-mono text-cyan-400">Always-On-Top & Dictée Vocale</span>
        </div>
      </div>

      {/* 4. Mises à Jour Automatiques de l'Application (electron-updater) */}
      <div>
        <AdminUpdateSection isDark={isDark} onNotification={onNotification} />
      </div>

      {/* 5. Notifications Natives Windows Toast */}
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

      {/* 6. Sauvegardes & Accès au Système de Fichiers Local */}
      <div
        className={`p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                Système de Fichiers Local (Sauvegardes & Exports Directs)
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
      </div>
    </div>
  );
}
