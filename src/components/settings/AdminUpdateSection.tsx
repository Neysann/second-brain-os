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
import { APP_VERSION } from '@/lib/version';

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

/**
 * Nettoie et formate les messages d'erreur de téléchargement GitHub
 * pour éviter d'afficher des URLs pré-signées SAS/JWT illisibles de 600 caractères.
 */
function sanitizeUpdateErrorMessage(msg?: string): string {
  if (!msg) return 'Erreur lors de la communication avec le serveur de mise à jour';
  if (
    msg.includes('release-assets.githubusercontent.com') ||
    msg.includes('Cannot download') ||
    msg.includes('pr=https') ||
    msg.includes('rscd=') ||
    msg.includes('sig=') ||
    msg.includes('jwt=')
  ) {
    return "Le téléchargement automatique via GitHub a rencontré un délai d'attente ou une coupure réseau. Cliquez sur « Télécharger via le navigateur » ci-dessous pour installer la mise à jour.";
  }
  if (msg.includes('504')) {
    return "Délai d'attente dépassé (Erreur 504) sur les serveurs GitHub. Veuillez réessayer ou télécharger directement.";
  }
  return msg;
}

export default function AdminUpdateSection({
  isDark,
  onNotification,
  onLogAction,
}: AdminUpdateSectionProps) {
  const [currentAppVersion, setCurrentAppVersion] = useState<string>(APP_VERSION);
  const [isDesktopApp, setIsDesktopApp] = useState<boolean>(false);
  const [updateState, setUpdateState] = useState<UpdateInfoState>({
    status: 'idle',
    currentVersion: APP_VERSION,
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
          const cleanMessage = sanitizeUpdateErrorMessage(data.message);
          setUpdateState((prev) => ({
            ...prev,
            ...data,
            message: cleanMessage,
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
              `Mise à jour : ${cleanMessage}`,
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
        onNotification?.(`Syntropy OS Web est à jour (v${currentAppVersion}) !`, 'info');
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
        const cleanErr = sanitizeUpdateErrorMessage(res.error);
        setUpdateState({
          status: 'error',
          message: cleanErr,
          currentVersion: currentAppVersion,
        });
        onNotification?.(`Recherche de mise à jour : ${cleanErr}`, 'error');
      }
      onLogAction?.(
        'Vérification des mises à jour',
        'Recherche manuelle de release GitHub initiée',
        undefined,
        'system',
        'info'
      );
    } catch (err: any) {
      const cleanErr = sanitizeUpdateErrorMessage(err?.message);
      setUpdateState({
        status: 'error',
        message: cleanErr,
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
        const cleanErr = sanitizeUpdateErrorMessage(res.error);
        setUpdateState((prev) => ({
          ...prev,
          status: 'error',
          message: cleanErr,
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
      const cleanErr = sanitizeUpdateErrorMessage(err?.message);
      setUpdateState((prev) => ({
        ...prev,
        status: 'error',
        message: cleanErr,
      }));
      setIsDownloading(false);
    }
  };

  // Téléchargement direct officiel via le navigateur par défaut (fallback infaillible)
  const handleDirectBrowserDownload = async () => {
    const targetVer = updateState.version || currentAppVersion;
    const electron = (window as any).electronAPI;
    if (electron?.openDirectDownload) {
      await electron.openDirectDownload(targetVer);
    } else {
      const url = `https://github.com/Neysann/second-brain-os/releases/download/v${targetVer}/Syntropy-OS-Setup-${targetVer}.exe`;
      window.open(url, '_blank');
    }
    onNotification?.(
      `Téléchargement de Syntropy-OS-Setup-${targetVer}.exe ouvert dans votre navigateur !`,
      'info'
    );
    onLogAction?.(
      'Téléchargement Navigateur',
      `Ouverture du téléchargement direct de la version ${targetVer}`,
      undefined,
      'system',
      'info'
    );
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
                    <div className="text-[11px] text-zinc-500 pt-0.5 flex items-center gap-1.5">
                      <span>Téléchargement lent ou bloqué ?</span>
                      <button
                        type="button"
                        onClick={handleDirectBrowserDownload}
                        className="text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Télécharger directement dans le navigateur
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. Prêt à installer */}
                {updateState.status === 'downloaded' && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      🎉 Mise à jour v{updateState.version || currentAppVersion} prête à être installée !
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
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs font-mono text-rose-300 leading-relaxed">
                        {sanitizeUpdateErrorMessage(updateState.message)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={handleDirectBrowserDownload}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Télécharger (.exe) via le navigateur</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCheckForUpdates}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Réessayer</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton d'action contextuel secondaire si disponible */}
              {updateState.status === 'available' && !isDownloading && (
                <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleStartDownload}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                    title="Téléchargement automatique en arrière-plan"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Mettre à jour (v{updateState.version})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDirectBrowserDownload}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Télécharger l'installateur officiel directement via votre navigateur"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Télécharger (.exe) navigateur</span>
                  </button>
                </div>
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
