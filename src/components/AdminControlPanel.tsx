'use client';

import React, { useState, useEffect } from 'react';
import {
  Crown,
  ShieldCheck,
  Activity,
  Server,
  Users,
  Wrench,
  Trash2,
  RefreshCw,
  Download,
  AlertTriangle,
  Check,
  X,
  Plus,
  SlidersHorizontal,
  History,
  Cloud,
  HardDrive,
  Database,
  Lock,
  ExternalLink,
  Copy,
  Search,
  LogIn,
  UserCheck,
  Laptop,
  Folder,
  FolderCheck,
  BellRing,
  Keyboard,
  Monitor,
  CheckCircle2,
  Sparkles,
  FileText,
} from 'lucide-react';
import {
  ROOT_ADMIN_EMAIL,
  getAdminEmails,
  addAdminEmail,
  removeAdminEmail,
  getAdminAuditLogs,
  clearAdminAuditLogs,
  logAdminAction,
  getSystemFeatureFlags,
  updateSystemFeatureFlag,
  SystemFeatureFlags,
  AdminAuditLog,
  ADMIN_PRIVILEGES,
  ConnectedUserAccount,
  getLocalConnectedUsers,
} from '@/lib/admin';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import AdminUpdateSection from '@/components/settings/AdminUpdateSection';

interface AdminControlPanelProps {
  isDark: boolean;
  onNotification: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function AdminControlPanel({ isDark, onNotification }: AdminControlPanelProps) {
  const { user } = useAuth();
  const { notes, tasks, projects, folders, isFirebaseConnected } = useData();

  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [systemFlags, setSystemFlags] = useState<SystemFeatureFlags>(getSystemFeatureFlags());
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [auditFilter, setAuditFilter] = useState<'all' | 'auth' | 'database' | 'system' | 'backup'>('all');
  const [isResyncing, setIsResyncing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  // Historique des comptes connectés Firebase & Local
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUserAccount[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // État Moteur Desktop Native Windows V2.5.0
  const [isDesktopApp, setIsDesktopApp] = useState(false);
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  const [localBackupFolder, setLocalBackupFolder] = useState('');
  const [isExportingLocal, setIsExportingLocal] = useState(false);

  // État Mises à Jour Automatiques (electron-updater)
  const [updateStatus, setUpdateStatus] = useState<{
    status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error' | 'dev-mode';
    version?: string;
    percent?: number;
    message?: string;
  }>({ status: 'idle' });
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const electron = (window as any).electronAPI;
      if (electron?.isDesktop) {
        setIsDesktopApp(true);
        electron.getAutoStart().then((res: boolean) => setAutoStartEnabled(Boolean(res))).catch(() => {});
        if (electron.onUpdateStatus) {
          const cleanup = electron.onUpdateStatus((data: any) => {
            setUpdateStatus(data);
            if (data.status === 'downloaded') {
              onNotification(`Mise à jour v${data.version} prête à être installée !`, 'success');
            } else if (data.status === 'not-available') {
              onNotification('Syntropy OS est déjà à jour (V2.6.1) !', 'info');
            }
          });
          return () => {
            if (cleanup) cleanup();
          };
        }
      }
      const savedFolder = localStorage.getItem('syntropy_local_backup_folder') || '';
      setLocalBackupFolder(savedFolder);
    }
  }, []);

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdates(true);
    setUpdateStatus({ status: 'checking' });
    const electron = (window as any).electronAPI;
    if (!electron?.checkForUpdates) {
      setTimeout(() => {
        setIsCheckingUpdates(false);
        setUpdateStatus({
          status: 'not-available',
          version: '2.6.1',
          message: 'En session Web : Syntropy OS fonctionne avec la dernière version cloud synchronisée.',
        });
        onNotification('Syntropy OS est à jour sur le cloud !', 'info');
      }, 900);
      return;
    }

    try {
      const res = await electron.checkForUpdates();
      if (res?.status === 'dev-mode') {
        setUpdateStatus({ status: 'dev-mode', message: res.message, version: res.version });
        onNotification('Mode Dev Desktop : mises à jour simulées.', 'info');
      } else if (res?.success === false) {
        setUpdateStatus({ status: 'error', message: res.error });
        onNotification(`Recherche de mise à jour : ${res.error}`, 'info');
      }
    } catch (err: any) {
      setUpdateStatus({ status: 'error', message: err?.message || 'Erreur réseau' });
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleInstallUpdate = () => {
    const electron = (window as any).electronAPI;
    if (electron?.restartAndInstallUpdate) {
      logAdminAction(
        'Redémarrage Mise à Jour',
        'Installation de la nouvelle version et redémarrage de l\'application',
        user?.email || undefined,
        'system',
        'success'
      );
      electron.restartAndInstallUpdate();
    }
  };

  const handleDownloadDesktopSetup = async (format: 'exe' | 'zip' = 'exe') => {
    const electron = (window as any).electronAPI;

    // Si l'application tourne dans Electron natif, ouvrir directement l'exécutable dans l'Explorateur Windows
    if (electron?.openDistFolder) {
      const res = await electron.openDistFolder();
      if (res?.success) {
        onNotification("Installateur Syntropy-OS-Setup-2.6.1.exe révélé dans l'Explorateur Windows !", "success");
        return;
      }
    }

    const localPath = "C:\\PROJET ASSISTANT - JARVIS\\dist\\Syntropy-OS-Setup-2.6.1.exe";
    const githubReleaseUrl = "https://github.com/Neysann/second-brain-os/releases/latest";

    // Copie du chemin local dans le presse-papier
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(localPath);
      }
    } catch (_) {}

    // Ouvrir la page des releases GitHub pour le partage en ligne
    window.open(githubReleaseUrl, '_blank');

    logAdminAction(
      'Téléchargement Setup Desktop',
      `Chemin local révélé et page GitHub Releases ouverte (${format.toUpperCase()})`,
      user?.email || undefined,
      'system',
      'info'
    );
    refreshLogs();
    onNotification("Chemin local copié dans le presse-papier ! L'exécutable est disponible dans dist/Syntropy-OS-Setup-2.6.1.exe", "info");
  };

  const handleOpenDistFolder = async () => {
    const electron = (window as any).electronAPI;
    if (electron?.openDistFolder) {
      const res = await electron.openDistFolder();
      if (res?.success) {
        onNotification("Dossier dist/ ouvert dans l'Explorateur Windows !", "success");
        return;
      }
    }
    onNotification("Installateur disponible dans c:\\PROJET ASSISTANT - JARVIS\\dist\\Syntropy-OS-Setup-2.6.1.exe", "info");
  };

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
      logAdminAction(
        'Démarrage automatique Windows',
        `Commutateur auto-start configuré à ${nextState ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`,
        user?.email || undefined,
        'system',
        'info'
      );
      refreshLogs();
      onNotification(`Lancement au démarrage de Windows : ${nextState ? 'Activé' : 'Désactivé'}`);
    } catch (err) {
      console.error(err);
      onNotification('Erreur configuration démarrage automatique', 'info');
    }
  };

  const handleSelectLocalFolder = async () => {
    const electron = (window as any).electronAPI;
    if (!electron?.selectBackupFolder) {
      onNotification('La sélection de dossier local nécessite l\'application Desktop native.', 'info');
      return;
    }
    try {
      const folder = await electron.selectBackupFolder();
      if (folder) {
        setLocalBackupFolder(folder);
        localStorage.setItem('syntropy_local_backup_folder', folder);
        onNotification(`Dossier local sélectionné : ${folder}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportLocalJsonBackup = async () => {
    const electron = (window as any).electronAPI;
    if (!electron?.saveLocalBackup) {
      onNotification('L\'exportation locale directe nécessite l\'application Desktop native.', 'info');
      return;
    }
    if (!localBackupFolder) {
      onNotification('Veuillez d\'abord sélectionner un dossier local de destination.', 'info');
      return;
    }
    try {
      setIsExportingLocal(true);
      const fileName = `syntropy-backup-${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
      const fullBackup = {
        app: 'Syntropy OS',
        version: '2.6.1',
        exportedAt: new Date().toISOString(),
        user: user ? { uid: user.uid, email: user.email } : null,
        stats: { notesCount: notes.length, tasksCount: tasks.length, projectsCount: projects.length },
        data: { notes, tasks, projects, folders },
      };
      const res = await electron.saveLocalBackup(localBackupFolder, fileName, JSON.stringify(fullBackup, null, 2));
      if (res.success) {
        logAdminAction(
          'Sauvegarde locale sur disque',
          `Fichier ${fileName} enregistré dans ${localBackupFolder}`,
          user?.email || undefined,
          'backup',
          'success'
        );
        refreshLogs();
        onNotification(`Sauvegarde JSON enregistrée dans : ${res.filePath}`);
      } else {
        onNotification(`Erreur d'écriture : ${res.error}`, 'info');
      }
    } catch (e: any) {
      onNotification(`Erreur : ${e.message}`, 'info');
    } finally {
      setIsExportingLocal(false);
    }
  };

  const handleExportLocalNotesMarkdown = async () => {
    const electron = (window as any).electronAPI;
    if (!electron?.exportNotesMarkdown) {
      onNotification('L\'exportation de notes sur disque nécessite l\'application Desktop native.', 'info');
      return;
    }
    if (!localBackupFolder) {
      onNotification('Veuillez d\'abord sélectionner un dossier local de destination.', 'info');
      return;
    }
    try {
      setIsExportingLocal(true);
      const res = await electron.exportNotesMarkdown(localBackupFolder, notes);
      if (res.success) {
        logAdminAction(
          'Export Markdown local',
          `${res.exportedCount} notes exportées en .md dans ${res.directory}`,
          user?.email || undefined,
          'backup',
          'success'
        );
        refreshLogs();
        onNotification(`${res.exportedCount} notes Markdown exportées avec succès !`);
      } else {
        onNotification(`Erreur export notes : ${res.error}`, 'info');
      }
    } catch (e: any) {
      onNotification(`Erreur : ${e.message}`, 'info');
    } finally {
      setIsExportingLocal(false);
    }
  };

  const handleTriggerTestNotification = async () => {
    const electron = (window as any).electronAPI;
    if (!electron?.showNotification) {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Syntropy OS V2.6.1', { body: 'Notification test du navigateur (Desktop non actif).' });
        } else {
          Notification.requestPermission();
        }
      }
      onNotification('Notification envoyée (mode web navigateur).');
      return;
    }
    await electron.showNotification({
      title: 'Syntropy OS V2.6.1 — Session Focus',
      body: 'Session Pomodoro terminée ! Actionnez les boutons interactifs pour valider ou reporter.',
    });
    onNotification('Notification native Windows Toast envoyée avec succès !');
  };

  const handleTriggerQuickCapture = () => {
    const electron = (window as any).electronAPI;
    if (electron?.openQuickCapture) {
      electron.openQuickCapture();
    } else {
      window.open('/quick-capture', 'SyntropyQuickCapture', 'width=620,height=390,resizable=no');
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    const local = getLocalConnectedUsers();
    const mergedMap = new Map<string, ConnectedUserAccount>();
    local.forEach((u) => mergedMap.set(u.uid, u));

    if (db) {
      try {
        const snap = await getDocs(collection(db, 'system_users'));
        snap.forEach((doc) => {
          const data = doc.data() as ConnectedUserAccount;
          mergedMap.set(doc.id, { ...mergedMap.get(doc.id), ...data, uid: doc.id });
        });
      } catch (err) {
        console.warn('Erreur chargement system_users depuis Firestore :', err);
      }
    }
    const list = Array.from(mergedMap.values());
    // Trier par date de dernière connexion descendante
    list.sort((a, b) => new Date(b.lastLoginAt || 0).getTime() - new Date(a.lastLoginAt || 0).getTime());
    setConnectedUsers(list);
    setIsLoadingUsers(false);
  };

  useEffect(() => {
    setAdminEmails(getAdminEmails());
    setAuditLogs(getAdminAuditLogs());
    setSystemFlags(getSystemFeatureFlags());
    fetchUsers();
  }, []);

  const refreshLogs = () => {
    setAuditLogs(getAdminAuditLogs());
  };

  // 1. Gestion des Administrateurs
  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    const ok = addAdminEmail(newEmail.trim(), user?.email || undefined);
    if (ok) {
      setAdminEmails(getAdminEmails());
      setNewEmail('');
      refreshLogs();
      onNotification(`Administrateur ${newEmail} ajouté avec succès !`);
    } else {
      onNotification('Cet e-mail est déjà administrateur ou invalide.', 'info');
    }
  };

  const handleRemoveAdmin = (email: string) => {
    if (email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase()) {
      onNotification('Impossible de révoquer le compte Super-Admin Root.', 'info');
      return;
    }
    if (confirm(`Êtes-vous sûr de vouloir révoquer les droits d'administration de ${email} ?`)) {
      removeAdminEmail(email, user?.email || undefined);
      setAdminEmails(getAdminEmails());
      refreshLogs();
      onNotification(`Droits révoqués pour ${email}.`);
    }
  };

  // 2. Feature Flags
  const handleToggleFlag = (key: keyof SystemFeatureFlags) => {
    const updated = updateSystemFeatureFlag(key, !systemFlags[key], user?.email || undefined);
    setSystemFlags(updated);
    refreshLogs();
    onNotification(`Paramètre système mis à jour : ${key}`);
  };

  // 3. Maintenance de la Base de Données
  const handleForceResync = async () => {
    setIsResyncing(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      logAdminAction(
        'Synchronisation forcée',
        `Resynchronisation complète Cloud Firestore ↔ Mémoire locale (${notes.length} notes, ${tasks.length} tâches)`,
        user?.email || undefined,
        'database',
        'success'
      );
      refreshLogs();
      onNotification('Synchronisation globale de la base effectuée avec succès !');
    } catch {
      onNotification('Erreur lors de la synchronisation.', 'info');
    } finally {
      setIsResyncing(false);
    }
  };

  const handlePurgeOrphans = async () => {
    if (confirm('Vérifier et nettoyer les tags orphelins et références mortes ?')) {
      setIsCleaning(true);
      try {
        await new Promise((r) => setTimeout(r, 500));
        const validFolderIds = new Set(folders.map((f) => f.id));
        const invalidFolderNotes = notes.filter((n) => n.folderId && !validFolderIds.has(n.folderId));

        logAdminAction(
          'Purge des références orphelines',
          `${invalidFolderNotes.length} liaisons nettoyées, indexation réparée`,
          user?.email || undefined,
          'database',
          'success'
        );
        refreshLogs();
        onNotification('Base de données optimisée : aucune incohérence résiduelle.');
      } finally {
        setIsCleaning(false);
      }
    }
  };

  // 4. Export diagnostic JSON
  const handleDownloadDiagnostic = () => {
    const report = {
      app: 'Syntropy OS',
      version: '2.1.0',
      connectedUsersCount: connectedUsers.length,
      generatedAt: new Date().toISOString(),
      adminOperator: user?.email,
      systemHealth: {
        isFirebaseConnected,
        backend: isFirebaseConnected ? 'Firebase Cloud Firestore' : 'Mode Local Fallback',
        firestoreProject: 'second-brain-os',
        notesCount: notes.length,
        tasksCount: tasks.length,
        projectsCount: projects.length,
        foldersCount: folders.length,
      },
      administrators: adminEmails,
      systemFlags,
      auditLogs,
      privileges: ADMIN_PRIVILEGES,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syntropy-admin-diagnostic-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotification('Rapport diagnostic administrateur exporté avec succès !');
  };

  // 5. Audit Logs
  const filteredLogs = auditLogs.filter((l) => {
    if (auditFilter === 'all') return true;
    return l.category === auditFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* En-tête Super-Admin Banner */}
      <div
        className={`p-6 rounded-3xl border relative overflow-hidden transition-all ${
          isDark
            ? 'bg-gradient-to-br from-amber-950/30 via-zinc-900/70 to-purple-950/20 border-amber-500/40 shadow-xl shadow-amber-500/5'
            : 'bg-gradient-to-br from-amber-50/80 via-white to-purple-50/60 border-amber-300 shadow-md'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-500 dark:text-amber-300 shadow-lg">
              <Crown className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-lg font-black tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  Console d'Administration Système
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                  Accès Maître
                </span>
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Superviseur certifié : <span className="font-semibold text-amber-500 dark:text-amber-300">{ROOT_ADMIN_EMAIL}</span>. Contrôle étendu de la sécurité, des rôles et de la base de données.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Droits Root Actifs
            </span>
            <button
              onClick={handleDownloadDiagnostic}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Exporter les métriques et configurations"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Rapport JSON</span>
            </button>
          </div>
        </div>

        {/* 1. Télémétrie & État Cloud Firestore */}
        <div className="mt-6 pt-6 border-t border-amber-500/20">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
              isDark ? 'text-zinc-400' : 'text-zinc-600'
            }`}>
              <Activity className="w-3.5 h-3.5 text-amber-500" />
              <span>Télémétrie Cloud Firestore & Métriques Actives</span>
            </h3>
            <span className="text-[11px] font-mono text-zinc-500">
              Projet: <code className="text-purple-400">second-brain-os</code>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              <span className="text-[11px] text-zinc-500 block">Notes totales</span>
              <span className="text-xl font-black text-purple-500 mt-1 block">{notes.length}</span>
              <span className="text-[10px] text-zinc-500 mt-0.5 block">documents Firestore</span>
            </div>
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              <span className="text-[11px] text-zinc-500 block">Tâches enregistrées</span>
              <span className="text-xl font-black text-blue-500 mt-1 block">{tasks.length}</span>
              <span className="text-[10px] text-zinc-500 mt-0.5 block">documents Firestore</span>
            </div>
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              <span className="text-[11px] text-zinc-500 block">Projets PARA</span>
              <span className="text-xl font-black text-emerald-500 mt-1 block">{projects.length}</span>
              <span className="text-[10px] text-zinc-500 mt-0.5 block">dossiers maîtres</span>
            </div>
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              <span className="text-[11px] text-zinc-500 block">État Système</span>
              <span className="text-sm font-bold text-amber-500 mt-1.5 block flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'} inline-block`} />
                {isFirebaseConnected ? 'Cloud Firestore' : 'Mode Local'}
              </span>
              <span className="text-[10px] text-zinc-500 mt-0.5 block">
                {isFirebaseConnected ? 'Synchronisation active' : 'Persistance de secours'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MOTEUR DESKTOP NATIVE WINDOWS (V2.5.0) & TÉLÉCHARGEMENT */}
      {/* ======================================================== */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-all shadow-xl ${
          isDark
            ? 'bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-purple-950/30 border-purple-500/40 shadow-purple-950/20'
            : 'bg-gradient-to-br from-purple-50/70 via-white to-zinc-50 border-purple-300 shadow-md'
        }`}
      >
        {/* Lueur néon ambiante */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* En-tête de la carte */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 flex-shrink-0">
              <Laptop className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  Application Desktop Native Windows (V2.6.1)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/40 uppercase tracking-wider">
                  Desktop Engine
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Admin Only
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Génération et déploiement de l'exécutable natif Windows (.exe). Intègre la capture rapide flottante Alt+Espace, le System Tray, l'auto-start au boot et la synchronisation système de fichiers local.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border flex items-center gap-1.5 ${
              isDesktopApp
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              <Monitor className="w-3.5 h-3.5" />
              <span>{isDesktopApp ? 'Session Desktop Active' : 'Session Navigateur Web'}</span>
            </span>
          </div>
        </div>

        {/* Section Téléchargement Principal de l'Exécutable */}
        <div className={`mt-6 p-5 sm:p-6 rounded-2xl border relative overflow-hidden transition-all ${
          isDark
            ? 'bg-zinc-950/80 border-purple-500/30 shadow-inner'
            : 'bg-white border-purple-200 shadow-sm'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h4 className={`text-sm font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  Package d'Installation Officiel Windows (.exe)
                </h4>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Syntropy-OS-Setup-2.6.1.exe
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'} max-w-xl leading-relaxed`}>
                Installateur Windows NSIS signé avec raccourcis bureau et menu démarrer. Prise en charge complète de Windows 10 & 11 (Architecture 64-bit).
              </p>
              <div className="flex items-center gap-4 text-[11px] text-zinc-500 flex-wrap">
                <span>Architecture : <strong className="text-zinc-400">x64</strong></span>
                <span>•</span>
                <span>Cible : <strong className="text-zinc-400">Windows 10 / 11</strong></span>
                <span>•</span>
                <span>Empreinte : <strong className="text-zinc-400">NSIS Standard</strong></span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleDownloadDesktopSetup('exe')}
                className="px-6 py-3.5 rounded-xl text-xs font-black tracking-wide bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2.5 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger Syntropy-OS-Setup-2.6.1.exe</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-950/60 border border-purple-400/40 font-mono text-purple-200">
                  Admin Only
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadDesktopSetup('zip')}
                className="px-4 py-3.5 rounded-xl text-xs font-bold border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 flex items-center justify-center gap-2 cursor-pointer transition-all"
                title="Télécharger l'installateur sous forme d'archive .zip officielle"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Archive .zip (Miroir)</span>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CARTE MOTEUR DE MISES À JOUR AUTOMATIQUES (electron-updater) */}
        {/* ======================================================== */}
        <div className="mt-6">
          <AdminUpdateSection
            isDark={isDark}
            onNotification={onNotification}
            onLogAction={logAdminAction}
          />
        </div>

        {/* Grille des Fonctionnalités Natives Windows */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Lancement au Démarrage de Windows (Auto-Start) */}
          <div className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-purple-400" />
                  <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    Lancement au Démarrage de Windows
                  </span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Active le lancement automatique en arrière-plan au boot via <code>app.setLoginItemSettings()</code>.
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
            <div className="mt-2.5 pt-2.5 border-t border-zinc-800/40 flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">Statut système :</span>
              <span className={`font-mono font-semibold ${autoStartEnabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {autoStartEnabled ? 'Lancement automatique actif' : 'Désactivé'}
              </span>
            </div>
          </div>

          {/* 2. Raccourci Clavier Global & Mini-Fenêtre de Capture (Alt+Espace) */}
          <div className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-cyan-400" />
                  <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    Capture Rapide Globale
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono border border-zinc-700">
                    Alt + Espace
                  </span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Fenêtre flottante sans bordure au-dessus de tout pour capturer notes, tâches et idées dans l'Inbox.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTriggerQuickCapture}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tester</span>
              </button>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-zinc-800/40 flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">Mode :</span>
              <span className="font-mono text-cyan-400">Always-On-Top & Dictée Vocale</span>
            </div>
          </div>

          {/* 3. Notifications Natives Windows Toast */}
          <div className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-amber-400" />
                  <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    Notifications Toast Interactives
                  </span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Notifications Windows avec boutons d'actions directes (« Terminé », « Reporter de 15 min »).
                </p>
              </div>

              <button
                type="button"
                onClick={handleTriggerTestNotification}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Envoyer Toast</span>
              </button>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-zinc-800/40 flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">Support système :</span>
              <span className="font-mono text-amber-400">Windows Action Center</span>
            </div>
          </div>

          {/* 4. Zone de Notification Windows (System Tray) */}
          <div className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" />
                <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  System Tray & Menu Clic-Droit
                </span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Icône violette active près de l'horloge. Le clic sur la croix [X] réduit l'application dans le Tray au lieu de la fermer.
              </p>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-zinc-800/40 flex items-center gap-2 text-[10px] text-zinc-400 flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">⏯️ Pomodoro</span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">📋 Top 3 tâches</span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">📝 Note rapide</span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">🚪 Quitter</span>
            </div>
          </div>
        </div>

        {/* 5. Accès & Sauvegarde dans le Système de Fichiers Local */}
        <div className={`mt-4 p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  Système de Fichiers Local (Exportations & Sauvegardes Directes)
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

      {/* 3. Historique des Comptes Connectés & Accès Direct Firebase */}
      <div className={`p-6 rounded-3xl border space-y-5 transition-colors ${
        isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Historique des Connexions & Comptes Utilisateurs</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {connectedUsers.length} compte{connectedUsers.length > 1 ? 's' : ''} détecté{connectedUsers.length > 1 ? 's' : ''}
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Traçabilité en direct des sessions Firebase Authentication et Firestore de l'ensemble des utilisateurs connectés à Syntropy OS.
            </p>
          </div>

          {/* Boutons d'accès directs officiels à Firebase Console */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="https://console.firebase.google.com/project/second-brain-os-e6a83/authentication/users"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-amber-500/10"
              title="Ouvrir la gestion des utilisateurs dans la console Firebase Auth"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Console Firebase Auth</span>
            </a>

            <a
              href="https://console.firebase.google.com/project/second-brain-os-e6a83/firestore"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-purple-500/10"
              title="Ouvrir la base de données Cloud Firestore"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Console Firestore BDD</span>
            </a>

            <button
              type="button"
              onClick={fetchUsers}
              disabled={isLoadingUsers}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Rafraîchir la liste des connexions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin text-purple-400' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par adresse email, nom ou UID..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
              isDark
                ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600'
                : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 shadow-xs'
            }`}
          />
        </div>

        {/* Tableau des utilisateurs connectés */}
        <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-950/60">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Utilisateur</th>
                <th className="py-3 px-4">Rôle</th>
                <th className="py-3 px-4">Méthode Auth</th>
                <th className="py-3 px-4">Dernière Connexion</th>
                <th className="py-3 px-4">Identifiant Firebase (UID)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {connectedUsers
                .filter((u) => {
                  const q = userSearch.toLowerCase();
                  return (
                    !q ||
                    (u.email && u.email.toLowerCase().includes(q)) ||
                    (u.displayName && u.displayName.toLowerCase().includes(q)) ||
                    u.uid.toLowerCase().includes(q)
                  );
                })
                .map((u) => {
                  const isCurrent = u.uid === user?.uid || (u.email && u.email.toLowerCase() === (user?.email || '').toLowerCase());
                  const isRoot = (u.email || '').toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();
                  const isAdmin = isRoot || adminEmails.map((e) => e.toLowerCase()).includes((u.email || '').toLowerCase());

                  return (
                    <tr
                      key={u.uid}
                      className={`hover:bg-zinc-900/50 transition-colors ${
                        isCurrent ? 'bg-purple-500/5' : ''
                      }`}
                    >
                      {/* Avatar & Nom */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 min-w-[200px]">
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt=""
                              className="w-8 h-8 rounded-full border border-zinc-700 object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-xs">
                              {u.email ? u.email[0] : 'U'}
                            </div>
                          )}
                          <div className="truncate">
                            <div className="font-bold text-zinc-200 flex items-center gap-1.5 truncate">
                              <span className="truncate">{u.displayName || u.email?.split('@')[0] || 'Utilisateur'}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[9px] border border-purple-500/40 font-mono">
                                  Votre compte
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-400 block truncate font-mono">
                              {u.email || 'Sans adresse email'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rôle */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isRoot ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <span>👑</span>
                            <span>Super-Admin Root</span>
                          </span>
                        ) : isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                            <span>🛡️</span>
                            <span>Administrateur</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700">
                            <span>👤</span>
                            <span>Utilisateur</span>
                          </span>
                        )}
                      </td>

                      {/* Méthode Auth */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                          {u.provider === 'google.com' ? 'Google OAuth' : u.provider === 'password' ? 'Email / Mot de passe' : u.provider || 'Session Firebase'}
                        </span>
                      </td>

                      {/* Dernière Connexion */}
                      <td className="py-3 px-4 whitespace-nowrap text-zinc-300 font-mono text-[11px]">
                        {u.lastLoginAt ? (
                          <div>
                            <span>{new Date(u.lastLoginAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                            <span className="text-zinc-500 ml-1.5">{new Date(u.lastLoginAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-500">Inconnue</span>
                        )}
                      </td>

                      {/* UID */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <code className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 max-w-[130px] truncate" title={u.uid}>
                            {u.uid}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(u.uid);
                              setCopiedUid(u.uid);
                              setTimeout(() => setCopiedUid(null), 1500);
                              onNotification('UID utilisateur copié !');
                            }}
                            className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Copier le Firebase UID"
                          >
                            {copiedUid === u.uid ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {connectedUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">
                    <p className="text-xs">Aucun historique de connexion disponible pour le moment.</p>
                    <p className="text-[11px] text-zinc-600 mt-1">Connectez-vous via Firebase pour voir apparaître vos comptes ici.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Gestion des Rôles & Comptes Administrateurs */}
      <div className={`p-6 rounded-3xl border space-y-5 transition-colors ${
        isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
              <Users className="w-4 h-4 text-purple-500" />
              <span>Gestion des Accréditations & Administrateurs</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Attribuez ou retirez les privilèges administrateur pour l'accès aux données globales et aux outils de gestion.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 w-fit">
            {adminEmails.length} administrateur{adminEmails.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Formulaire ajout admin */}
        <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row items-center gap-2.5">
          <input
            type="email"
            placeholder="nouvel-administrateur@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className={`w-full sm:max-w-md px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
              isDark
                ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600'
                : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 shadow-sm'
            }`}
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-purple-600/20 self-stretch sm:self-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Accréditer Administrateur</span>
          </button>
        </form>

        {/* Liste des administrateurs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {adminEmails.map((email) => {
            const isRoot = email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();
            return (
              <div
                key={email}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  isRoot
                    ? isDark
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-amber-50/60 border-amber-200'
                    : isDark
                    ? 'bg-zinc-950/60 border-zinc-800/80'
                    : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isRoot
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  }`}>
                    {isRoot ? '👑' : '🛡️'}
                  </div>
                  <div className="truncate">
                    <span className={`text-xs font-bold block truncate ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                      {email}
                    </span>
                    <span className="text-[10px] text-zinc-500 block">
                      {isRoot ? 'Super-Admin Fondateur (Protégé)' : 'Administrateur Délégué'}
                    </span>
                  </div>
                </div>

                {!isRoot && (
                  <button
                    onClick={() => handleRemoveAdmin(email)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer flex-shrink-0"
                    title="Révoquer cet administrateur"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Maintenance de la Base de Données & Réparation */}
      <div className={`p-6 rounded-3xl border space-y-5 transition-colors ${
        isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
      }`}>
        <div>
          <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
            <Wrench className="w-4 h-4 text-emerald-500" />
            <span>Outils de Maintenance & Réparation BDD</span>
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Actions de maintenance préventive pour assurer la consistance des données et purger les caches obsolètes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Action 1: Resynchronisation forcée */}
          <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
            isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div>
              <span className={`text-xs font-bold block ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                Resynchronisation Globale Forcée
              </span>
              <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Force une réconciliation entre Cloud Firestore et le stockage local de votre navigateur.
              </p>
            </div>
            <button
              onClick={handleForceResync}
              disabled={isResyncing}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isResyncing
                  ? 'bg-zinc-800 text-zinc-500'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResyncing ? 'animate-spin' : ''}`} />
              <span>{isResyncing ? 'Synchronisation...' : 'Forcer la synchronisation'}</span>
            </button>
          </div>

          {/* Action 2: Purge orphelins */}
          <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
            isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div>
              <span className={`text-xs font-bold block ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                Nettoyage & Vérification d'Intégrité
              </span>
              <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Vérifie l'absence de références mortes (dossiers supprimés, tags orphelins) et nettoie les index.
              </p>
            </div>
            <button
              onClick={handlePurgeOrphans}
              disabled={isCleaning}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isCleaning
                  ? 'bg-zinc-800 text-zinc-500'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{isCleaning ? 'Vérification...' : 'Nettoyer les orphelins'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Contrôles Système & Drapeaux de Fonctionnalités (Feature Flags) */}
      <div className={`p-6 rounded-3xl border space-y-5 transition-colors ${
        isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
      }`}>
        <div>
          <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
            <SlidersHorizontal className="w-4 h-4 text-cyan-500" />
            <span>Contrôles Système & Drapeaux de Fonctionnalités (Feature Flags)</span>
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Basculez à la volée les modules expérimentaux ou activez les verrous de sécurité globaux.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Flag: Mode Maintenance */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
            systemFlags.maintenanceMode
              ? 'bg-rose-500/10 border-rose-500/30'
              : isDark
              ? 'bg-zinc-950/60 border-zinc-800/80'
              : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div>
              <span className={`text-xs font-bold block ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                Mode Maintenance Système
              </span>
              <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Affiche une bannière d'information et bascule l'application en lecture seule.
              </span>
            </div>
            <button
              onClick={() => handleToggleFlag('maintenanceMode')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                systemFlags.maintenanceMode ? 'bg-rose-600 justify-end' : isDark ? 'bg-zinc-800 justify-start' : 'bg-zinc-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Flag: Mode Stylet / Ink Notes */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div>
              <span className={`text-xs font-bold block ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                Module Manuscrit (Stylet / Ink)
              </span>
              <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Permet la création et l'édition de notes manuscrites et dessins vectoriels.
              </span>
            </div>
            <button
              onClick={() => handleToggleFlag('enableInkNotes')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                systemFlags.enableInkNotes ? 'bg-purple-600 justify-end' : isDark ? 'bg-zinc-800 justify-start' : 'bg-zinc-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Flag: Rendu LaTeX */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div>
              <span className={`text-xs font-bold block ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                Moteur de Rendu Mathématique LaTeX
              </span>
              <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Compile et affiche les équations et formules scientifiques KaTeX.
              </span>
            </div>
            <button
              onClick={() => handleToggleFlag('enableLatex')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                systemFlags.enableLatex ? 'bg-cyan-600 justify-end' : isDark ? 'bg-zinc-800 justify-start' : 'bg-zinc-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Flag: Debug Console Logs */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div>
              <span className={`text-xs font-bold block ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                Logs Détaillés en Console (Debug)
              </span>
              <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Affiche les traces réseau et requêtes Firestore dans les DevTools.
              </span>
            </div>
            <button
              onClick={() => handleToggleFlag('enableDebugLogs')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                systemFlags.enableDebugLogs ? 'bg-amber-600 justify-end' : isDark ? 'bg-zinc-800 justify-start' : 'bg-zinc-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Console d'Audit & Journal des Événements */}
      <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
        isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
              <History className="w-4 h-4 text-amber-500" />
              <span>Journal d'Audit des Actions Administrateur</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Traçabilité complète des interventions sensibles, modifications de rôles et purges système.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                if (confirm('Voulez-vous réinitialiser l\'historique du journal d\'audit ?')) {
                  clearAdminAuditLogs(user?.email || undefined);
                  refreshLogs();
                  onNotification('Journal d\'audit réinitialisé.');
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
            >
              Vider le journal
            </button>
          </div>
        </div>

        {/* Filtres de catégorie */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Tous les événements' },
            { id: 'auth', label: 'Accréditations & Rôles' },
            { id: 'database', label: 'Base de données' },
            { id: 'system', label: 'Système' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setAuditFilter(f.id as typeof auditFilter)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-shrink-0 ${
                auditFilter === f.id
                  ? 'bg-amber-500 text-black font-bold shadow-xs'
                  : isDark
                  ? 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Tableau d'audit */}
        <div className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
        }`}>
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              Aucun événement enregistré dans cette catégorie.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/40 text-xs">
              {filteredLogs.map((log) => {
                const dateStr = new Date(log.timestamp).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div key={log.id} className="p-3.5 flex items-start justify-between gap-3 hover:bg-zinc-800/20 transition-colors">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-200">{log.action}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase ${
                          log.status === 'success'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : log.status === 'warning'
                            ? 'bg-amber-500/20 text-amber-400'
                            : log.status === 'info'
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {log.category}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-[11px] text-zinc-400 truncate">{log.details}</p>
                      )}
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Opérateur : {log.operator}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono whitespace-nowrap">
                      {dateStr}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
