'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Calendar as CalendarIcon,
  Search,
  Sun,
  Moon,
  Cloud,
  HardDrive,
  User as UserIcon,
  Settings as SettingsIcon,
  ShieldAlert,
  LogOut,
  Power,
} from 'lucide-react';
import Sidebar from './Sidebar';
import CommandPaletteModal from './CommandPaletteModal';
import AuthModal from './AuthModal';
import WhatsNewModal from './WhatsNewModal';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { isSiteAdmin } from '@/lib/admin';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isFirebaseConnected, stats } = useData();
  const { user, isLoading, logout } = useAuth();
  const { settings } = useSettings();
  const pathname = usePathname();
  const router = useRouter();

  // Écouteur universel clavier (Ctrl+K / Cmd+K) et événements personnalisés
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    const handleOpenCommandPalette = () => setIsSearchOpen(true);
    const handleCloseCommandPalette = () => setIsSearchOpen(false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpenCommandPalette);
    window.addEventListener('close-command-palette', handleCloseCommandPalette);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpenCommandPalette);
      window.removeEventListener('close-command-palette', handleCloseCommandPalette);
    };
  }, []);

  // Écouteur des actions déclenchées depuis le System Tray Desktop
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const electron = (window as any).electronAPI;
    if (!electron?.onTrayAction) return;

    const cleanup = electron.onTrayAction((action: { type: string }) => {
      if (action.type === 'view-tasks') {
        router.push('/tasks');
      } else if (action.type === 'toggle-pomodoro') {
        window.dispatchEvent(new CustomEvent('toggle-pomodoro'));
      }
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [router]);

  const hasRedirectedRef = React.useRef(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasRedirectedRef.current) return;
    if (pathname === '/' && settings.startupView && settings.startupView !== '/') {
      const hasVisited = sessionStorage.getItem('syntropy_session_started');
      if (!hasVisited) {
        sessionStorage.setItem('syntropy_session_started', 'true');
        hasRedirectedRef.current = true;
        router.push(settings.startupView);
      }
    }
  }, [pathname, settings.startupView, router]);

  // Si on est sur la mini-fenêtre de capture rapide (Alt+Espace), afficher directement sans coquille
  if (pathname === '/quick-capture') {
    return <>{children}</>;
  }

  const normalizePath = (p: string) => {
    if (!p) return '/';
    const trimmed = p.replace(/\/+$/, '');
    return trimmed === '' ? '/' : trimmed;
  };

  const isMobileLinkActive = (href: string) => {
    const [path] = href.split('?');
    return normalizePath(pathname) === normalizePath(path);
  };

  const totalNotes = (stats as any).totalNotesCount ?? stats.notesCount ?? 0;

  const mobileNavItems = [
    {
      name: 'Accueil',
      href: '/',
      icon: LayoutDashboard,
      badge: null,
      accent: 'indigo',
    },
    {
      name: 'Tâches',
      href: '/tasks',
      icon: CheckSquare,
      badge: stats.pendingTasksCount > 0 ? stats.pendingTasksCount : null,
      accent: 'indigo',
    },
    {
      name: 'Notes',
      href: '/notes',
      icon: BookOpen,
      badge: totalNotes > 0 ? totalNotes : null,
      accent: 'indigo',
    },
    {
      name: 'Calendrier',
      href: '/calendar',
      icon: CalendarIcon,
      badge: null,
      accent: 'indigo',
    },
  ];

  // 1. Écran de chargement pendant l'initialisation de l'authentification
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-100 flex-col gap-4 select-none">
        <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-purple-500/40 shadow-2xl shadow-purple-900/50 flex items-center justify-center bg-zinc-950 animate-pulse">
          <img src="/logo.png" alt="Syntropy Logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg tracking-tight">Syntropy OS</span>
          <span className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
            Connexion au Second Brain...
          </span>
        </div>
      </div>
    );
  }

  // 2. Obligation stricte de connexion avant d'accéder au site
  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-100 relative overflow-hidden select-none">
        {/* Cercles néon en arrière-plan */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal d'authentification obligatoire (non dismissible) */}
        <AuthModal
          isOpen={true}
          canDismiss={false}
        />
      </div>
    );
  }

  // 3. Vérification de Sécurité Desktop au Lancement (V2.5.0) :
  // Si l'application tourne dans Electron natif et que le compte n'est pas administrateur, verrouiller l'accès.
  const isDesktop = typeof window !== 'undefined' && Boolean((window as any).electronAPI?.isDesktop);
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin' || (user?.email && isSiteAdmin(user.email)));

  if (isDesktop && !isAdmin) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-100 relative overflow-hidden select-none p-4">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md p-8 rounded-3xl border border-rose-500/40 bg-zinc-900/90 shadow-2xl shadow-rose-950/40 backdrop-blur-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/10">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
              Accès Réservé aux Administrateurs
            </span>
            <h1 className="text-xl font-black tracking-tight text-zinc-100">
              Syntropy OS Desktop (V2.5.0)
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Cette application Windows native (.exe) nécessite des droits d'administrateur système pour démarrer sur ce poste.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-left space-y-1">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Compte connecté</div>
            <div className="text-xs font-mono font-medium text-zinc-200 truncate">{user.email || user.displayName || user.uid}</div>
            <div className="flex items-center gap-1.5 pt-1 text-[10px] text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              <span>Rôle détecté : <strong className="font-mono">{user.role || 'user'}</strong> (non-administrateur)</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => logout()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Se connecter avec un compte Administrateur</span>
            </button>

            <button
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).electronAPI?.quitApp) {
                  (window as any).electronAPI.quitApp();
                } else {
                  window.close();
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Power className="w-4 h-4 text-zinc-400" />
              <span>Quitter l'application</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden ${
        theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
      }`}
    >
      {/* Sidebar de navigation latérale (Écrans Desktop et Tablettes >= md) */}
      <Sidebar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Conteneur principal */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden relative">
        {/* Barre d'en-tête mobile (< md) */}
        <header
          className={`flex md:hidden items-center justify-between px-3 sm:px-4 py-2 border-b z-20 select-none flex-shrink-0
            ${
              theme === 'dark'
                ? 'bg-zinc-950/95 border-zinc-800/80 text-zinc-100'
                : 'bg-white/95 border-zinc-200 text-zinc-900'
            } backdrop-blur-md`}
        >
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-purple-500/30 shadow-sm shadow-purple-500/20 bg-zinc-950 flex items-center justify-center flex-shrink-0 p-0.5">
              <img src="/logo.png" alt="Syntropy Logo" className="w-full h-full object-cover rounded-md" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                Syntropy
                <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 font-mono border border-purple-500/30 font-semibold">
                  OS
                </span>
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {user?.isAdmin && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                👑<span className="hidden sm:inline"> Admin</span>
              </span>
            )}

            {/* Statut Firebase */}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-mono border
                ${
                  isFirebaseConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              title={isFirebaseConnected ? 'Connecté à Cloud Firestore' : 'Mode Local'}
            >
              {isFirebaseConnected ? (
                <>
                  <Cloud className="w-3 h-3 text-emerald-400 flex-shrink-0 animate-pulse" />
                  <span className="hidden sm:inline">Cloud</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="hidden sm:inline">Local</span>
                </>
              )}
            </div>

            {/* Bouton recherche mobile */}
            <button
              data-search-trigger="true"
              onClick={() => setIsSearchOpen(true)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'border-zinc-700/60 bg-zinc-900/60 hover:bg-zinc-850 text-zinc-300'
                  : 'border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
              aria-label="Recherche rapide et palette de commandes"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Bouton Paramètres (affiché sur tablettes / petits écrans sm, mais dans la barre basse sur mobile) */}
            <Link
              href="/settings"
              className={`hidden sm:flex p-1.5 rounded-lg border transition-colors cursor-pointer ${
                pathname === '/settings'
                  ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                  : theme === 'dark'
                  ? 'border-zinc-700/60 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                  : 'border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
              title="Paramètres"
              aria-label="Accéder aux paramètres"
            >
              <SettingsIcon className="w-4 h-4" />
            </Link>

            {/* Profil utilisateur / Connexion mobile */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center cursor-pointer ${
                theme === 'dark'
                  ? 'border-zinc-700/60 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                  : 'border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
              title={user ? `Connecté : ${user.displayName || user.email}` : 'Se connecter'}
              aria-label="Profil ou connexion"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-4 h-4 rounded-md object-cover" />
              ) : user ? (
                <div className="w-4 h-4 rounded-md bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-[9px] flex items-center justify-center">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              ) : (
                <UserIcon className="w-4 h-4 text-zinc-400" />
              )}
            </button>
          </div>
        </header>

        {/* Zone de contenu principale */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          {children}
        </main>

        {/* Barre de navigation basse pour smartphone (< md) - 5 onglets réguliers et équilibrés */}
        <nav
          className={`flex md:hidden fixed bottom-0 left-0 right-0 z-30 border-t px-1 sm:px-3 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] items-center justify-around select-none
            ${
              theme === 'dark'
                ? 'bg-zinc-950/95 border-zinc-800/90 text-zinc-400'
                : 'bg-white/95 border-zinc-200 text-zinc-600'
            } backdrop-blur-xl shadow-2xl`}
        >
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isMobileLinkActive(item.href);
            const isPurple = item.accent === 'purple';
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 max-w-[72px] flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer relative
                  ${
                    isActive
                      ? isPurple
                        ? theme === 'dark' ? 'text-purple-400 font-bold' : 'text-purple-600 font-bold'
                        : theme === 'dark' ? 'text-indigo-400 font-semibold' : 'text-indigo-600 font-bold'
                      : isPurple
                      ? theme === 'dark' ? 'text-purple-300/70 hover:text-purple-200' : 'text-purple-700/70 hover:text-purple-900'
                      : theme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
              >
                <div className="relative pointer-events-none">
                  <Icon
                    className={`w-5 h-5 ${
                      isActive
                        ? isPurple
                          ? theme === 'dark' ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'text-purple-600'
                          : theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'
                        : isPurple
                        ? 'text-purple-400/70'
                        : ''
                    } transition-colors`}
                  />
                  {item.badge !== null && item.badge > 0 && (
                    <span
                      className={`absolute -top-1 -right-2 min-w-[15px] h-3.5 px-0.5 rounded-full text-[8px] font-mono font-bold flex items-center justify-center text-white ${
                        isPurple ? 'bg-purple-600' : 'bg-indigo-600'
                      }`}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 truncate max-w-full text-center pointer-events-none tracking-tight">
                  {item.name}
                </span>
                {isActive && (
                  <span
                    className={`w-1 h-1 rounded-full absolute bottom-0.5 pointer-events-none ${
                      isPurple ? 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.8)]' : 'bg-indigo-500'
                    }`}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Palette universelle de commandes et recherche rapide (Cmd/Ctrl + K) */}
      <CommandPaletteModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Modal d'authentification (Connexion / Inscription / Google) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        canDismiss={true}
      />

      {/* Pop-up Nouveautés de version (quand l'utilisateur est connecté) */}
      <WhatsNewModal />
    </div>
  );
};

export default AppShell;
