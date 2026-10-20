'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  PenTool,
  Calendar as CalendarIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Brain,
  FolderGit2,
  Layers,
  Archive,
  Compass,
  User as UserIcon,
  LogOut,
  LogIn,
  Settings as SettingsIcon,
  Flame,
  Wallet,
  Sparkles,
  Bot,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useDailyLife } from '@/context/DailyLifeContext';
import { CURRENT_VERSION } from '@/components/WhatsNewModal';

interface SidebarProps {
  onOpenSearch: () => void;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSearch, onOpenAuth }) => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { stats } = useData();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { currentStreak, budgetStats } = useDailyLife();
  const [showAssistantToast, setShowAssistantToast] = useState(false);

  useEffect(() => {
    if (showAssistantToast) {
      const timer = setTimeout(() => setShowAssistantToast(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [showAssistantToast]);

  const router = useRouter();

  const normalizePath = (p: string) => {
    if (!p) return '/';
    const trimmed = p.replace(/\/+$/, '');
    return trimmed === '' ? '/' : trimmed;
  };

  const isLinkActive = (href: string) => {
    const [path] = href.split('?');
    return normalizePath(pathname) === normalizePath(path);
  };

  const navLinks = [
    {
      name: 'Tableau de bord',
      href: '/',
      icon: LayoutDashboard,
      badge: null,
      accent: 'indigo',
    },
    {
      name: 'Projets & Tâches',
      href: '/tasks',
      icon: CheckSquare,
      badge: stats.pendingTasksCount > 0 ? stats.pendingTasksCount : null,
      accent: 'indigo',
    },
    {
      name: 'Notes',
      href: '/notes',
      icon: BookOpen,
      badge: (stats.totalNotesCount ?? stats.notesCount ?? 0) > 0 ? (stats.totalNotesCount ?? stats.notesCount) : null,
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

  const dailyLifeLinks = [
    {
      name: 'Habitude',
      href: '/habits',
      icon: Flame,
      badge: currentStreak > 0 ? `${currentStreak}🔥` : null,
      accent: 'indigo',
    },
    {
      name: 'Budget',
      href: '/budget',
      icon: Wallet,
      badge: budgetStats ? `${budgetStats.percentUsed}%` : null,
      accent: 'indigo',
    },
  ];

  const paraLinks = useMemo(() => {
    const list = [
      { name: 'Projets', category: 'project', icon: FolderGit2, count: stats.projectsCount },
      { name: 'Domaines', category: 'area', icon: Layers, count: stats.areasCount },
      { name: 'Ressources', category: 'resource', icon: Compass, count: stats.resourcesCount },
      { name: 'Archives', category: 'archive', icon: Archive, count: stats.archivesCount },
    ];
    if (settings.hideEmptyParaCategories) {
      return list.filter((item) => item.count > 0);
    }
    return list;
  }, [stats, settings.hideEmptyParaCategories]);

  return (
    <aside
      className={`hidden md:flex relative flex-col h-screen border-r transition-all duration-300 ease-in-out z-30 flex-shrink-0
        ${collapsed ? 'w-20' : 'w-64'}
        ${
          theme === 'dark'
            ? 'glass-surface border-zinc-800/80 text-zinc-300'
            : 'glass-surface border-zinc-200 text-zinc-700'
        }`}
    >
      {/* Header & Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center p-3' : 'justify-between p-4'} border-b border-inherit`}>
        <Link
          href="/"
          className="flex items-center gap-3 overflow-hidden group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-purple-500/30 shadow-md shadow-purple-500/15 bg-zinc-950 flex-shrink-0 flex items-center justify-center p-0.5 pointer-events-none transition-transform group-hover:scale-105">
            <img
              src="/logo.png"
              alt="Syntropy Logo"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate pointer-events-none">
              <span className={`font-bold text-base tracking-tight flex items-center gap-1.5 ${
                theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'
              }`}>
                {settings.uiStyle === 'cyberpunk' ? (
                  <span className="font-mono text-base tracking-wider flex items-center gap-1.5 text-white font-black">
                    Syntropy
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FCEE0A]/20 text-[#FCEE0A] font-mono border border-[#FCEE0A]/40 font-bold">
                      HUD
                    </span>
                  </span>
                ) : settings.uiStyle === 'nothing' ? (
                  <span className="font-ndot text-base tracking-wider flex items-center gap-1.5 text-zinc-900 dark:text-white">
                    SYNTROPY
                    <span className="nothing-red-dot ml-0.5" />
                  </span>
                ) : (
                  <>
                    Syntropy
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono border border-purple-500/30 font-semibold">
                      OS
                    </span>
                  </>
                )}
              </span>
              <span className="text-xs text-zinc-500 truncate font-mono">
                {settings.uiStyle === 'cyberpunk'
                  ? 'CYBERDECK // HUD'
                  : settings.uiStyle === 'nothing'
                  ? 'NOTHING EDITION • OS'
                  : 'Productivité & Savoir'}
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Bouton Recherche Globale */}
      <div className="p-3">
        <button
          data-search-trigger="true"
          onClick={onOpenSearch}
          className={`w-full flex items-center ${
            collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'
          } rounded-xl text-sm font-medium transition-colors border cursor-pointer
            ${
              theme === 'dark'
                ? 'bg-zinc-900/60 hover:bg-zinc-850 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 shadow-sm'
                : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-sm'
            }`}
          title="Palette de commandes & Recherche (Ctrl+K)"
        >
          <Search className="w-4 h-4 flex-shrink-0 text-indigo-500 dark:text-indigo-400 pointer-events-none" />
          {!collapsed && (
            <div className="flex items-center justify-between w-full pointer-events-none">
              <span className="truncate">Recherche rapide...</span>
              <kbd className={`hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded border ${
                theme === 'dark' ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-zinc-100 text-zinc-600 border-zinc-200'
              }`}>
                ⌘K
              </kbd>
            </div>
          )}
        </button>
      </div>

      {/* Navigation Principale */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-thin">
        <div className="space-y-1">
          {!collapsed && (
            <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 select-none">
              Espace de Travail
            </div>
          )}
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = isLinkActive(link.href);
            const isPurple = link.accent === 'purple';
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center ${
                  collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                } rounded-xl text-sm font-medium transition-all cursor-pointer group relative
                  ${
                    isActive
                      ? settings.uiStyle === 'cyberpunk'
                        ? 'bg-[#FCEE0A]/10 text-[#FCEE0A] font-bold border border-[#FCEE0A] shadow-[0_0_12px_rgba(252,238,10,0.25)] cyber-corner-brackets font-mono'
                        : settings.uiStyle === 'nothing'
                        ? 'bg-white text-black font-bold border border-white shadow-none font-ntype'
                        : isPurple
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 font-semibold ring-1 ring-purple-400/40'
                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                      : settings.uiStyle === 'cyberpunk'
                      ? 'text-zinc-400 hover:text-white hover:bg-[#FCEE0A]/5 border border-transparent font-mono'
                      : settings.uiStyle === 'nothing'
                      ? 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
                      : isPurple
                      ? theme === 'dark'
                        ? 'text-purple-300/80 hover:text-purple-200 hover:bg-purple-950/30'
                        : 'text-purple-700/80 hover:text-purple-900 hover:bg-purple-50'
                      : theme === 'dark'
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
                  }`}
                title={collapsed ? link.name : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 pointer-events-none transition-colors ${
                    isActive
                      ? settings.uiStyle === 'cyberpunk'
                        ? 'text-[#FCEE0A]'
                        : settings.uiStyle === 'nothing'
                        ? 'text-black'
                        : 'text-white'
                      : settings.uiStyle === 'cyberpunk'
                      ? 'text-zinc-400 group-hover:text-[#FCEE0A]'
                      : settings.uiStyle === 'nothing'
                      ? 'text-zinc-400 group-hover:text-white'
                      : isPurple
                      ? 'text-purple-400 group-hover:text-purple-300'
                      : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                />
                {!collapsed && (
                  <span className={`truncate flex-1 pointer-events-none ${settings.uiStyle === 'nothing' ? 'tracking-wide' : ''}`}>{link.name}</span>
                )}
                {!collapsed && link.badge !== null && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium pointer-events-none ${
                      isActive
                        ? settings.uiStyle === 'nothing'
                          ? 'bg-black text-white border border-black/40 font-ndot'
                          : isPurple
                          ? 'bg-purple-950/60 text-white border border-purple-400/40'
                          : 'bg-indigo-700 text-white'
                        : settings.uiStyle === 'nothing'
                        ? 'bg-zinc-900 text-zinc-300 border border-zinc-800 font-ndot'
                        : isPurple
                        ? theme === 'dark'
                          ? 'bg-purple-950/50 text-purple-300 border border-purple-800/60'
                          : 'bg-purple-100 text-purple-700 border border-purple-200'
                        : theme === 'dark'
                        ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        : 'bg-zinc-200 text-zinc-700 border border-zinc-300'
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
                {collapsed && link.badge !== null && (
                  <span
                    className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-zinc-950 ${
                      settings.uiStyle === 'nothing'
                        ? 'bg-[#D71920] shadow-[0_0_8px_#D71920]'
                        : isPurple
                        ? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                        : 'bg-indigo-500'
                    }`}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Section Daily Life */}
        <div className="space-y-1 pt-2 border-t border-inherit">
          {!collapsed && (
            <div className={`px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 select-none ${
              settings.uiStyle === 'nothing' ? 'font-ndot text-zinc-400' : ''
            }`}>
              Daily Life
            </div>
          )}
          {dailyLifeLinks.map((link) => {
            const Icon = link.icon;
            const isActive = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center ${
                  collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                } rounded-xl text-sm font-medium transition-all cursor-pointer group relative
                  ${
                    isActive
                      ? settings.uiStyle === 'nothing'
                        ? 'bg-white text-black font-bold border border-white shadow-none font-ntype'
                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                      : settings.uiStyle === 'nothing'
                      ? 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
                      : theme === 'dark'
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
                  }`}
                title={collapsed ? link.name : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 pointer-events-none transition-colors ${
                    isActive
                      ? settings.uiStyle === 'nothing'
                        ? 'text-black'
                        : 'text-white'
                      : settings.uiStyle === 'nothing'
                      ? 'text-zinc-400 group-hover:text-white'
                      : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                />
                {!collapsed && (
                  <span className={`truncate flex-1 pointer-events-none ${settings.uiStyle === 'nothing' ? 'tracking-wide' : ''}`}>{link.name}</span>
                )}
                {!collapsed && link.badge !== null && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium pointer-events-none ${
                      isActive
                        ? settings.uiStyle === 'nothing'
                          ? 'bg-black text-white border border-black/40 font-ndot'
                          : 'bg-indigo-700 text-white'
                        : settings.uiStyle === 'nothing'
                        ? 'bg-zinc-900 text-zinc-300 border border-zinc-800 font-ndot'
                        : theme === 'dark'
                        ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        : 'bg-zinc-200 text-zinc-700 border border-zinc-300'
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
                {collapsed && link.badge !== null && (
                  <span
                    className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-zinc-950 ${
                      settings.uiStyle === 'nothing'
                        ? 'bg-[#D71920] shadow-[0_0_8px_#D71920]'
                        : 'bg-indigo-500'
                    }`}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Section PARA */}
        {!collapsed && (
          <div className="space-y-1 pt-2 border-t border-inherit">
            <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 select-none">
              Méthode PARA
            </div>
            {paraLinks.map((para) => {
              const Icon = para.icon;
              return (
                <Link
                  key={para.category}
                  href={`/tasks?category=${para.category}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer
                    ${
                      theme === 'dark'
                        ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                >
                  <div className="flex items-center gap-2.5 truncate pointer-events-none">
                    <Icon className="w-4 h-4 text-zinc-500" />
                    <span className="truncate">{para.name}</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono pointer-events-none">
                    {para.count}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer & Réglages */}
      <div className={`p-3 border-t border-inherit space-y-2 ${collapsed ? 'flex flex-col items-center' : ''}`}>
        {/* Profil Utilisateur / Gestion de Compte */}
        {user ? (
          collapsed ? (
            <Link
              href="/settings?tab=profile"
              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                user.isAdmin
                  ? theme === 'dark'
                    ? 'border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300'
                    : 'border-amber-300 bg-amber-50 text-zinc-900'
                  : theme === 'dark'
                  ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 text-zinc-300'
                  : 'border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-800 shadow-sm'
              }`}
              title={user.isAdmin ? `Super-Admin : ${user.displayName || user.email} (Voir mon profil)` : `Mon Profil : ${user.displayName || user.email}`}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="w-7 h-7 rounded-lg object-cover"
                />
              ) : (
                <div className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center text-white ${
                  user.isAdmin
                    ? 'bg-gradient-to-tr from-amber-500 to-purple-600'
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                }`}>
                  {user.isAdmin ? '👑' : (user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
          ) : (
            <div
              className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                user.isAdmin
                  ? theme === 'dark'
                    ? 'bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-zinc-900/60 border-amber-500/40 text-zinc-100 shadow-sm shadow-amber-500/10'
                    : 'bg-gradient-to-r from-amber-50 via-purple-50 to-white border-amber-300 text-zinc-900 shadow-sm'
                  : theme === 'dark'
                  ? 'bg-zinc-900/60 border-zinc-800 text-zinc-200'
                  : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'
              }`}
            >
              <Link
                href="/settings?tab=profile"
                className="flex items-center gap-2.5 truncate cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0"
                title={user.isAdmin ? 'Super-Admin : Accéder aux réglages de profil' : 'Accéder aux réglages de mon profil'}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Avatar'}
                    className={`w-7 h-7 rounded-lg object-cover flex-shrink-0 ${
                      user.isAdmin ? 'ring-2 ring-amber-500/60' : 'ring-1 ring-purple-500/40'
                    }`}
                  />
                ) : (
                  <div className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm text-white ${
                    user.isAdmin
                      ? 'bg-gradient-to-tr from-amber-500 to-purple-600 ring-1 ring-amber-400/50'
                      : 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                  }`}>
                    {user.isAdmin ? '👑' : (user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-xs font-bold truncate">
                      {user.displayName || 'Utilisateur'}
                    </span>
                    {user.isAdmin && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-300 font-bold border border-amber-500/40 flex items-center gap-0.5 flex-shrink-0"
                        title="Compte Super-Administrateur"
                      >
                        👑 Admin
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 truncate">
                    {user.email || 'Connecté'}
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={logout}
                className={`p-1.5 rounded-lg transition-colors text-zinc-400 hover:text-rose-500 flex-shrink-0 ml-1 ${
                  theme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                }`}
                title="Se déconnecter"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        ) : (
          <button
            onClick={onOpenAuth}
            className={`${
              collapsed ? 'w-10 h-10 p-0 justify-center' : 'w-full py-2 px-3 justify-center'
            } rounded-xl text-xs font-semibold ${
              settings.uiStyle === 'nothing'
                ? 'bg-white text-black hover:bg-zinc-200 border border-white'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/20'
            } flex items-center gap-2 transition-all`}
            title="Se connecter ou créer un compte"
          >
            <UserIcon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Connexion / Compte</span>}
          </button>
        )}


        {/* Module Télémétrie HUD Cyberdeck (Inspiré de la maquette officielle) */}
        {settings.uiStyle === 'cyberpunk' && !collapsed && (
          <div className="cyber-telemetry-box rounded-xl p-3 text-left space-y-2 select-none my-2 font-mono">
            <div className="flex items-center gap-1.5 text-[10px] text-[#00F0FF] font-bold tracking-widest border-b border-[#FCEE0A]/20 pb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
              <span>SYSTÈME SYNCHRONISÉ</span>
            </div>
            <div className="space-y-1 text-[10px] text-zinc-400">
              <div className="flex justify-between">
                <span className="text-zinc-500">RÉSEAU</span>
                <span className="text-[#00F0FF] font-bold">EN LIGNE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">STOCKAGE</span>
                <span className="text-zinc-200 font-bold">68%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">PERFORMANCE</span>
                <span className="text-[#FCEE0A] font-bold">OPTIMAL</span>
              </div>
            </div>
            <div className="pt-1.5 border-t border-[#FCEE0A]/20 flex justify-between text-[8px] text-zinc-500 tracking-wider">
              <span>SNT-OS-1.2.0</span>
              <span>ID 7F3A-9C2D</span>
            </div>
          </div>
        )}

        {/* Futur Bouton Assistant IA */}
        {collapsed ? (
          <button
            onClick={() => setShowAssistantToast(true)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border cursor-pointer group ${
              settings.uiStyle === 'nothing'
                ? 'bg-zinc-900 border-zinc-800 text-white hover:border-zinc-700 hover:bg-zinc-800'
                : theme === 'dark'
                ? 'bg-purple-950/30 hover:bg-purple-950/60 border-purple-800/40 text-purple-300 hover:text-purple-200'
                : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
            }`}
            title="Assistant Syntropy (Bientôt disponible)"
          >
            <Bot className="w-5 h-5 transition-transform group-hover:scale-110" />
          </button>
        ) : (
          <button
            onClick={() => setShowAssistantToast(true)}
            className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all border cursor-pointer group ${
              settings.uiStyle === 'nothing'
                ? 'bg-zinc-900 border-zinc-800 text-white hover:border-zinc-700 hover:bg-zinc-800'
                : theme === 'dark'
                ? 'bg-purple-950/30 hover:bg-purple-950/60 border-purple-800/40 text-purple-300 hover:text-purple-200'
                : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
            }`}
            title="Assistant Syntropy (Bientôt disponible)"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Bot className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
              <span className={`truncate ${settings.uiStyle === 'nothing' ? 'font-mono' : ''}`}>
                Assistant
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono bg-purple-500/15 border border-purple-500/30 text-purple-300">
              Bientôt
            </span>
          </button>
        )}

        {/* Bouton Paramètres & Rétracter */}
        {collapsed ? (
          <div className="flex flex-col items-center gap-1.5 pt-1 w-full">
            <Link
              href="/settings"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                pathname === '/settings'
                  ? settings.uiStyle === 'nothing'
                    ? 'bg-white text-black font-bold'
                    : 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : settings.uiStyle === 'nothing'
                  ? 'hover:bg-zinc-900 text-zinc-400 hover:text-white'
                  : theme === 'dark'
                  ? 'hover:bg-zinc-900 text-zinc-400 hover:text-purple-400'
                  : 'hover:bg-zinc-200 text-zinc-600 hover:text-purple-600'
              }`}
              title="Accéder aux Paramètres"
            >
              <SettingsIcon className={`w-4 h-4 flex-shrink-0 ${pathname === '/settings' ? settings.uiStyle === 'nothing' ? 'text-black' : 'text-white' : ''}`} />
            </Link>

            <button
              onClick={() => setCollapsed(false)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  : 'hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900'
              }`}
              title="Agrandir la barre latérale"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1 pt-1">
            <Link
              href="/settings"
              className={`flex items-center justify-start p-2 rounded-xl transition-all flex-1 cursor-pointer
                ${
                  pathname === '/settings'
                    ? settings.uiStyle === 'nothing'
                      ? 'bg-white text-black font-bold'
                      : 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : settings.uiStyle === 'nothing'
                    ? 'hover:bg-zinc-900 text-zinc-400 hover:text-white'
                    : theme === 'dark'
                    ? 'hover:bg-zinc-900 text-zinc-400 hover:text-purple-400'
                    : 'hover:bg-zinc-200 text-zinc-600 hover:text-purple-600'
                }`}
              title="Accéder aux Paramètres"
            >
              <SettingsIcon className={`w-4 h-4 flex-shrink-0 ${pathname === '/settings' ? settings.uiStyle === 'nothing' ? 'text-black' : 'text-white' : ''}`} />
              <span className={`ml-2 text-xs font-medium ${pathname === '/settings' ? settings.uiStyle === 'nothing' ? 'text-black font-bold' : 'text-white font-semibold' : theme === 'dark' ? 'text-zinc-400' : 'text-zinc-700'}`}>
                Paramètres
              </span>
            </Link>

            <button
              onClick={() => setCollapsed(true)}
              className={`p-2 rounded-xl transition-colors cursor-pointer
                ${
                  theme === 'dark'
                    ? 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    : 'hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900'
                }`}
              title="Réduire la barre latérale"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Toast Notification Assistant */}
      {showAssistantToast && (
        <div
          className={`fixed bottom-6 left-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-auto ${
            settings.uiStyle === 'nothing'
              ? 'bg-black border-zinc-800 text-white font-mono'
              : 'bg-zinc-950/95 border-zinc-800 text-zinc-100'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              settings.uiStyle === 'nothing'
                ? 'bg-zinc-900 border border-zinc-700 text-white'
                : 'bg-purple-500/15 border border-purple-500/30 text-purple-400'
            }`}
          >
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left pr-2">
            <span className="text-xs font-semibold text-white">Assistant Syntropy</span>
            <span className="text-[11px] text-zinc-400">
              En cours de développement (Bientôt disponible)
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
