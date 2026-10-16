'use client';

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Search,
  ExternalLink,
  Laptop,
  Globe,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export interface UpdateInfoState {
  status:
    | 'idle'
    | 'checking'
    | 'available'
    | 'downloading'
    | 'downloaded'
    | 'not-available'
    | 'dev-mode'
    | 'error';
  version?: string;
  currentVersion?: string;
  releaseDate?: string;
  releaseNotes?: string | any[];
  percent?: number;
  bytesPerSecond?: number;
  transferred?: number;
  total?: number;
  message?: string;
}

interface AdminUpdateSectionProps {
  isDark: boolean;
  onNotification?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onLogAction?: (
    action: string,
    details?: string,
    operatorEmail?: string,
    category?: 'system' | 'auth' | 'database' | 'backup',
    status?: 'error' | 'success' | 'info' | 'warning'
  ) => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 Mo';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} Mo`;
}

function formatSpeed(bytesPerSecond?: number): string {
  if (!bytesPerSecond || bytesPerSecond === 0) return '';
  const kb = bytesPerSecond / 1024;
  if (kb < 1000) return `${kb.toFixed(0)} Ko/s`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} Mo/s`;
}

export default function AdminUpdateSection({
  isDark,
  onNotification,
  onLogAction,
}: AdminUpdateSectionProps) {
  const [currentAppVersion, setCurrentAppVersion] = useState<string>('2.6.1');
  const [isDesktopApp, setIsDesktopApp] = useState<boolean>(false);
  const [updateState, setUpdateState] = useState<UpdateInfoState>({
    status: 'idle',
    currentVersion: '2.6.1',
  });
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Initialisation et écoute des événements IPC Electron
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const electron = (window as any).electronAPI;

    if (electron) {
      setIsDesktopApp(true);

      // Récupération de la version réelle de l'application
      if (electron.getAppVersion) {
        electron.getAppVersion().then((ver: string) => {
          if (ver) {
            setCurrentAppVersion(ver);
            setUpdateState((prev) => ({ ...prev, currentVersion: ver }));
          }
        }).catch(() => {});
      }

      // Écoute des statuts en provenance du processus principal
      if (electron.onUpdateStatus) {
        const unsubscribe = electron.onUpdateStatus((data: UpdateInfoState) => {
          if (!data) return;
          setUpdateState((prev) => ({
            ...prev,
            ...data,
          }));

          if (data.status === 'checking') {
            setIsChecking(true);
          } else {
            setIsChecking(false);
          }

          if (data.status === 'downloading') {
            setIsDownloading(true);
          } else if (data.status === 'downloaded' || data.status === 'error') {
            setIsDownloading(false);
          }

          if (data.status === 'downloaded') {
            onNotification?.(
              `Mise à jour v${data.version || ''} téléchargée avec succès ! Redémarrer pour appliquer.`,
              'success'
            );
            onLogAction?.(
              'Mise à jour téléchargée',
              `La version ${data.version} a été téléchargée en arrière-plan`,
              undefined,
              'system',
              'success'
            );
          } else if (data.status === 'error') {
            onNotification?.(
              `Mise à jour : ${data.message || 'Erreur inconnue'}`,
              'error'
            );
          }
        });

        return () => {
          if (typeof unsubscribe === 'function') unsubscribe();
        };
      }
    }
  }, [onNotification, onLogAction]);

  // Déclencher la recherche manuelle de mise à jour
  const handleCheckForUpdates = async () => {
    setIsChecking(true);
    setUpdateState((prev) => ({ ...prev, status: 'checking' }));

    const electron = (window as any).electronAPI;

    if (!electron || !electron.checkForUpdates) {
      setTimeout(() => {
        setIsChecking(false);
        setUpdateState({
          status: 'not-available',
          currentVersion: currentAppVersion,
          version: currentAppVersion,
          message:
            'En session Web : Syntropy OS fonctionne avec la dernière version cloud synchronisée.',
        });
        onNotification?.('Syntropy OS Web est à jour !', 'info');
      }, 700);
      return;
    }

    try {
      const res = await electron.checkForUpdates();
      if (res?.status === 'dev-mode') {
        setUpdateState({
          status: 'dev-mode',
          message: res.message,
          currentVersion: res.version || currentAppVersion,
        });
        onNotification?.('Mode Développement Desktop : auto-updater inactif.', 'info');
      } else if (res?.success === false) {
        setUpdateState({
          status: 'error',
          message: res.error,
          currentVersion: currentAppVersion,
        });
        onNotification?.(`Recherche de mise à jour : ${res.error}`, 'error');
      }
      onLogAction?.(
        'Vérification des mises à jour',
        'Recherche manuelle de release GitHub initiée',
        undefined,
        'system',
        'info'
      );
    } catch (err: any) {
      setUpdateState({
        status: 'error',
        message: err?.message || 'Erreur réseau ou indisponibilité du canal GitHub',
        currentVersion: currentAppVersion,
      });
      onNotification?.('Impossible de contacter le serveur de mises à jour.', 'error');
    } finally {
      setIsChecking(false);
    }
  };

  // Lancer le téléchargement de la mise à jour disponible
  const handleStartDownload = async () => {
    const electron = (window as any).electronAPI;
    if (!electron?.startUpdateDownload) {
      onNotification?.('Action disponible uniquement sur l\'application Desktop.', 'info');
      return;
    }

    setIsDownloading(true);
    setUpdateState((prev) => ({ ...prev, status: 'downloading', percent: 0 }));

    try {
      const res = await electron.startUpdateDownload();
      if (res?.success === false) {
        setUpdateState((prev) => ({
          ...prev,
          status: 'error',
          message: res.error || 'Échec du téléchargement',
        }));
        setIsDownloading(false);
      } else {
        onNotification?.('Téléchargement de la mise à jour démarré en arrière-plan...', 'info');
        onLogAction?.(
          'Téléchargement Mise à Jour',
          `Téléchargement de la version ${updateState.version} initié`,
          undefined,
          'system',
          'info'
        );
      }
    } catch (err: any) {
      setUpdateState((prev) => ({
        ...prev,
        status: 'error',
        message: err?.message || 'Erreur de téléchargement',
      }));
      setIsDownloading(false);
    }
  };

  // Quitter et installer immédiatement
  const handleQuitAndInstall = () => {
    const electron = (window as any).electronAPI;
    if (electron?.quitAndInstall || electron?.restartAndInstallUpdate) {
      onLogAction?.(
        'Installation Mise à Jour',
        `Redémarrage pour application de la version ${updateState.version || currentAppVersion}`,
        undefined,
        'system',
        'success'
      );
      if (electron.quitAndInstall) {
        electron.quitAndInstall();
      } else {
        electron.restartAndInstallUpdate();
      }
    }
  };

  return (
    <div
      className={`p-5 sm:p-6 rounded-2xl border relative overflow-hidden transition-all shadow-sm ${
        isDark
          ? 'bg-zinc-950/80 border-cyan-500/30 text-zinc-100 shadow-inner'
          : 'bg-white border-cyan-200 text-zinc-900'
      }`}
    >
      {/* Halo lumineux d'arrière-plan */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 relative z-10">
        {/* Titre & Informations générales */}
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            </div>
            <h4 className="text-sm font-bold tracking-tight">
              Moteur de Mises à Jour Automatiques (electron-updater)
            </h4>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              Canal GitHub Releases
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border ${
                isDesktopApp
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              {isDesktopApp ? <Laptop className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
              {isDesktopApp ? 'Session Desktop' : 'Session Web Cloud'}
            </span>
          </div>

          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'} leading-relaxed`}>
            Vérification silencieuse automatique au démarrage. Si une nouvelle version de Syntropy OS est
            détectée sur GitHub Releases, elle est téléchargée en tâche de fond sans interrompre votre
            travail, puis prête à être installée en un clic.
          </p>

          {/* Cartouche d'état dynamique */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isDark ? 'bg-zinc-900/70 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Statut textuel & badge */}
              <div className="flex items-center gap-2.5">
                {/* 1. Statut Initial / Prêt */}
                {updateState.status === 'idle' && (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                    </span>
                    <span className="text-xs font-mono text-zinc-300">
                      Prêt pour la vérification • Version installée :{' '}
                      <strong className="text-white">v{currentAppVersion}</strong>
                    </span>
                  </>
                )}

                {/* 2. Recherche en cours */}
                {updateState.status === 'checking' && (
                  <>
                    <Search className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="text-xs font-mono text-cyan-300">
                      Recherche de mises à jour sur GitHub Releases...
                    </span>
                  </>
                )}

                {/* 3. Nouvelle version disponible */}
                {updateState.status === 'available' && (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-400 animate-bounce" />
                    <span className="text-xs font-mono font-bold text-purple-300">
                      ⚡ Nouvelle version v{updateState.version} disponible !
                    </span>
                  </>
                )}

                {/* 4. Téléchargement en cours */}
                {updateState.status === 'downloading' && (
                  <div className="space-y-1.5 w-full">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-amber-400 flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5 animate-bounce" />
                        Téléchargement en cours : {(updateState.percent || 0).toFixed(0)}%
                      </span>
                      <span className="text-zinc-400 text-[11px]">
                        {formatBytes(updateState.transferred)} / {formatBytes(updateState.total)}{' '}
                        {updateState.bytesPerSecond ? `(${formatSpeed(updateState.bytesPerSecond)})` : ''}
                      </span>
                    </div>
                    {/* Barre de progression Tailwind */}
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 transition-all duration-300 ease-out"
                        style={{ width: `${Math.min(100, Math.max(0, updateState.percent || 0))}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 5. Prêt à installer */}
                {updateState.status === 'downloaded' && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      🎉 Mise à jour v{updateState.version || '2.6.1'} prête à être installée !
                    </span>
                  </>
                )}

                {/* 6. Application à jour */}
                {updateState.status === 'not-available' && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono text-emerald-300">
                      🟢 Syntropy OS est à jour (v{currentAppVersion})
                    </span>
                  </>
                )}

                {/* 7. Mode Dev */}
                {updateState.status === 'dev-mode' && (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                    <span className="text-xs font-mono text-amber-300">
                      Mode Développement (Mises à jour simulées)
                    </span>
                  </>
                )}

                {/* 8. Erreur */}
                {updateState.status === 'error' && (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span className="text-xs font-mono text-rose-300 max-w-md truncate">
                      {updateState.message || 'Erreur lors de la communication de mise à jour'}
                    </span>
                  </>
                )}
              </div>

              {/* Bouton d'action contextuel secondaire si disponible */}
              {updateState.status === 'available' && !isDownloading && (
                <button
                  type="button"
                  onClick={handleStartDownload}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger la v{updateState.version}</span>
                </button>
              )}

              {updateState.status === 'downloaded' && (
                <button
                  type="button"
                  onClick={handleQuitAndInstall}
                  className="px-4 py-2 rounded-xl text-xs font-black tracking-wide bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer animate-pulse flex-shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Redémarrer et Installer</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bouton principal de vérification */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleCheckForUpdates}
            disabled={isChecking || isDownloading}
            className={`px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2.5 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
              isChecking || isDownloading
                ? 'opacity-60 cursor-not-allowed bg-zinc-800 text-zinc-400 border border-zinc-700'
                : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-600/25'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Vérification...' : '🔄 Vérifier les mises à jour'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
