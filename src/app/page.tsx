'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  LayoutGrid,
  Save,
  RotateCcw,
  SlidersHorizontal,
  Check,
  Search,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import {
  DashboardWidgetConfig,
  DEFAULT_DASHBOARD_LAYOUT,
  WidgetId,
  WidgetSize,
} from '@/types/dashboard';
import DashboardGrid from '@/components/dashboard/DashboardGrid';
import WidgetDrawer from '@/components/dashboard/WidgetDrawer';
import WidgetSettingsModal from '@/components/dashboard/WidgetSettingsModal';

const MAX_WIDGETS = 10;
const STORAGE_KEY = 'syntropy_dashboard_widgets_v1_17';

export default function DashboardPage() {
  const { user } = useAuth();
  const { settings } = useSettings();

  const userFirstName =
    settings.greetingName?.trim() ||
    (user?.displayName ? user.displayName.split(' ')[0] : 'Nathan');

  // Salutation dynamique selon l'heure
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bon matin';
    if (hour >= 12 && hour < 18) return 'Bon après-midi';
    if (hour >= 18 && hour < 23) return 'Bonsoir';
    return 'Bonne nuit';
  }, []);

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  // État des widgets
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(DEFAULT_DASHBOARD_LAYOUT);
  const [isEditing, setIsEditing] = useState(false);
  const [showGridLines, setShowGridLines] = useState(false);
  const [selectedDrawerSize, setSelectedDrawerSize] = useState<WidgetSize>('small');
  const [saveToast, setSaveToast] = useState(false);
  const [activeSettingsConfig, setActiveSettingsConfig] =
    useState<DashboardWidgetConfig | null>(null);

  // Chargement depuis localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWidgets(parsed);
        }
      }
    } catch (e) {
      console.warn('Erreur chargement widgets dashboard', e);
    }
  }, []);

  // Sauvegarde
  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2000);
      setIsEditing(false);
    } catch (e) {
      console.warn('Erreur sauvegarde widgets', e);
    }
  };

  // Réinitialiser à la disposition d'origine de la maquette
  const handleReset = () => {
    setWidgets(DEFAULT_DASHBOARD_LAYOUT);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DASHBOARD_LAYOUT));
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2000);
    } catch (e) {
      console.warn('Erreur réinitialisation widgets', e);
    }
  };

  // Ajouter un widget
  const handleAddWidget = (widgetId: WidgetId, size: WidgetSize) => {
    if (widgets.length >= MAX_WIDGETS) return;
    const newConfig: DashboardWidgetConfig = {
      id: `w-${widgetId}-${Date.now()}`,
      widgetId,
      size,
      order: widgets.length,
    };
    const updated = [...widgets, newConfig];
    setWidgets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Supprimer un widget
  const handleRemoveWidget = (id: string) => {
    const updated = widgets.filter((w) => w.id !== id);
    setWidgets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Mettre à jour la taille
  const handleUpdateWidgetSize = (id: string, size: WidgetSize) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, size } : w));
    setWidgets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Réordonner les widgets par drag & drop
  const handleReorderWidgets = (startIndex: number, endIndex: number) => {
    const updated = [...widgets];
    const [moved] = updated.splice(startIndex, 1);
    updated.splice(endIndex, 0, moved);
    // Réassigner les index
    const reindexed = updated.map((item, idx) => ({ ...item, order: idx }));
    setWidgets(reindexed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reindexed));
  };

  // Mettre à jour les réglages spécifiques d'un widget
  const handleUpdateWidgetSettings = (id: string, newSettings: Record<string, any>) => {
    const updated = widgets.map((w) =>
      w.id === id
        ? {
            ...w,
            settings: {
              ...(w.settings || {}),
              ...newSettings,
            },
          }
        : w
    );
    setWidgets(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 1500);
    } catch (e) {
      console.warn('Erreur sauvegarde réglages widget', e);
    }
  };

  const activeWidgetIds = widgets.map((w) => w.widgetId);

  return (
    <div className="w-full h-full lg:h-[calc(100vh-1rem)] flex flex-col justify-between p-3 sm:p-5 lg:p-6 overflow-x-hidden animate-in fade-in duration-300">
      {/* 1. Barre d'En-tête Dashboard (Bandeau spacieux avec Logo Officiel & Recherche) */}
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 py-3 sm:py-4 mb-3 border-b flex-shrink-0 ${
        settings.uiStyle === 'cyberpunk'
          ? 'border-[#FCEE0A]/20 bg-[#070a14]/60 backdrop-blur-md px-4 rounded-xl relative cyber-corner-brackets'
          : 'border-zinc-200 dark:border-zinc-800/80'
      }`}>
        <div className="flex items-center gap-3.5 sm:gap-4">
          {/* Logo Officiel Syntropy */}
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden flex items-center justify-center p-1 group hover:scale-105 transition-all flex-shrink-0 relative ${
            settings.uiStyle === 'cyberpunk'
              ? 'border border-[#FCEE0A]/40 bg-[#070a14] shadow-lg shadow-[#FCEE0A]/10'
              : settings.uiStyle === 'nothing'
              ? 'border border-white/20 bg-black shadow-none'
              : 'border border-purple-500/30 shadow-lg shadow-purple-500/20 bg-zinc-950'
          }`}>
            <img
              src="/logo.png"
              alt="Syntropy Logo"
              className="w-full h-full object-cover rounded-xl"
            />
            {settings.uiStyle !== 'nothing' && settings.uiStyle !== 'cyberpunk' && (
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-purple-400/20 pointer-events-none" />
            )}
          </div>

          <div>
            <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-0.5 ${
              settings.uiStyle === 'cyberpunk'
                ? 'text-[#00F0FF] font-mono'
                : settings.uiStyle === 'nothing'
                ? 'text-zinc-400 font-ndot'
                : 'text-purple-600 dark:text-purple-400'
            }`}>
              {settings.uiStyle === 'cyberpunk' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse shadow-[0_0_8px_#00F0FF]" />
                  <span className="tracking-widest">:: BUREAU // SYNTROPY OS</span>
                </>
              ) : settings.uiStyle === 'nothing' ? (
                <>
                  <span className="nothing-red-dot" />
                  <span className="text-zinc-300 font-ndot tracking-widest">NOTHING OS // DASHBOARD</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                  <span>SYNTROPY • TABLEAU DE BORD V2</span>
                </>
              )}
            </div>
            {settings.uiStyle === 'cyberpunk' ? (
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2 font-mono uppercase">
                <span>BONJOUR,</span>
                <span className="text-[#FCEE0A] drop-shadow-[0_0_12px_rgba(252,238,10,0.5)]">
                  {userFirstName}
                </span>
              </h1>
            ) : settings.uiStyle === 'nothing' ? (
              <h1 className="text-2xl sm:text-3xl lg:text-4xl tracking-wider text-zinc-900 dark:text-white font-ndot uppercase">
                {greeting}, {userFirstName}
              </h1>
            ) : (
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
                <span>{greeting},</span>
                <span className="bg-gradient-to-r from-purple-600 via-indigo-500 to-indigo-600 dark:from-purple-400 dark:via-indigo-300 dark:to-indigo-400 bg-clip-text text-transparent">
                  {userFirstName}
                </span>
              </h1>
            )}
            <p className={`text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 ${
              settings.uiStyle === 'cyberpunk'
                ? 'font-mono text-[11px] text-[#00F0FF]/80 flex items-center gap-2'
                : settings.uiStyle === 'nothing'
                ? 'font-ndot uppercase tracking-widest text-[11px]'
                : 'capitalize font-mono'
            }`}>
              <span>{todayFormatted}</span>
              {settings.uiStyle === 'cyberpunk' && (
                <>
                  <span className="text-zinc-600">|</span>
                  <span className="text-[#00F0FF] font-bold">● SYSTÈME SYNCHRONISÉ</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Contrôles Dashboard à droite */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Bouton de recherche rapide & palette universelle */}
          <button
            type="button"
            data-search-trigger="true"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('open-command-palette'));
              }
            }}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-all shadow-xs cursor-pointer group ${
              settings.uiStyle === 'cyberpunk'
                ? 'rounded-lg bg-[#070a14] border border-[#FCEE0A]/30 hover:border-[#FCEE0A] text-zinc-300 hover:text-white font-mono shadow-[0_0_10px_rgba(252,238,10,0.1)]'
                : settings.uiStyle === 'nothing'
                ? 'rounded-full bg-zinc-950 border border-white/10 hover:border-white/30 text-zinc-300 hover:text-white font-ndot uppercase tracking-wider'
                : 'rounded-xl glass-card hover:border-purple-500/40 text-zinc-700 dark:text-zinc-300'
            }`}
            title="Ouvrir la palette universelle (Ctrl+K)"
          >
            <Search className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${
              settings.uiStyle === 'cyberpunk'
                ? 'text-[#FCEE0A]'
                : settings.uiStyle === 'nothing'
                ? 'text-[#D71920]'
                : 'text-indigo-500'
            }`} />
            <span className="hidden sm:inline">{settings.uiStyle === 'nothing' ? 'SEARCH...' : 'Recherche...'}</span>
            <kbd className={`px-1.5 py-0.5 text-[10px] rounded border ${
              settings.uiStyle === 'cyberpunk'
                ? 'font-mono bg-black text-[#FCEE0A] border-[#FCEE0A]/40'
                : settings.uiStyle === 'nothing'
                ? 'font-ndot bg-black text-zinc-400 border-white/10'
                : 'font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
            }`}>
              ⌘K
            </kbd>
          </button>

          {/* Compteur de widgets */}
          <div className={`px-3 py-1.5 text-xs shadow-xs ${
            settings.uiStyle === 'cyberpunk'
              ? 'rounded-lg bg-[#070a14] border border-[#FCEE0A]/30 text-zinc-300 font-mono'
              : settings.uiStyle === 'nothing'
              ? 'rounded-full bg-zinc-950 border border-white/10 text-zinc-400 font-ndot tracking-wider'
              : 'rounded-xl glass-card text-zinc-600 dark:text-zinc-400 font-mono'
          }`}>
            <span className={
              settings.uiStyle === 'cyberpunk'
                ? 'text-[#FCEE0A] font-bold'
                : settings.uiStyle === 'nothing'
                ? 'text-white font-bold'
                : 'text-zinc-900 dark:text-zinc-200 font-bold'
            }>{widgets.length}</span>
            <span> / {MAX_WIDGETS} {settings.uiStyle === 'nothing' ? 'WIDGETS' : 'widgets'}</span>
          </div>

          {/* Bouton d'ouverture / fermeture du panneau de modification des widgets */}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
              settings.uiStyle === 'cyberpunk'
                ? 'btn-cyber-yellow rounded-lg border border-[#FCEE0A]'
                : settings.uiStyle === 'nothing'
                ? isEditing
                  ? 'rounded-full bg-white text-black font-ndot uppercase tracking-wider shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                  : 'rounded-full bg-zinc-950 text-zinc-300 hover:text-white border border-white/10 hover:border-white/30 font-ndot uppercase tracking-wider'
                : isEditing
                ? 'rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-600/30 ring-1 ring-purple-400'
                : 'rounded-xl glass-card hover:border-purple-500/40 text-zinc-700 dark:text-zinc-200'
            }`}
          >
            <SlidersHorizontal className={`w-4 h-4 ${
              settings.uiStyle === 'cyberpunk'
                ? 'text-black'
                : settings.uiStyle === 'nothing'
                ? isEditing ? 'text-black' : 'text-white'
                : 'text-purple-600 dark:text-purple-400'
            }`} />
            <span>
              {settings.uiStyle === 'cyberpunk'
                ? isEditing ? ':: FERMER ÉDITION' : ':: MODIFIER LES WIDGETS'
                : settings.uiStyle === 'nothing'
                ? isEditing ? 'CLOSE EDIT' : 'EDIT WIDGETS'
                : isEditing ? "Fermer l'édition" : 'Modifier widgets'}
            </span>
          </button>
        </div>
      </header>

      {/* 2. Zone Principale : Grille de Widgets qui s'adapte sans être cachée */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        <main
          className={`flex-1 min-h-0 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
            isEditing ? 'pr-0 lg:pr-[380px] xl:pr-[420px]' : ''
          }`}
        >
          <DashboardGrid
            widgets={widgets}
            isEditing={isEditing}
            showGridLines={showGridLines}
            onRemoveWidget={handleRemoveWidget}
            onUpdateWidgetSize={handleUpdateWidgetSize}
            onReorderWidgets={handleReorderWidgets}
            onOpenWidgetSettings={(config) => setActiveSettingsConfig(config)}
          />
        </main>

        {/* 3. Tiroir / Menu des Widgets Latéral avec commandes et prévisualisation */}
        <WidgetDrawer
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          activeWidgetIds={activeWidgetIds}
          onAddWidget={handleAddWidget}
          selectedSize={selectedDrawerSize}
          onSelectSize={setSelectedDrawerSize}
          maxWidgets={MAX_WIDGETS}
          showGridLines={showGridLines}
          onToggleGridLines={() => setShowGridLines(!showGridLines)}
          onReset={handleReset}
          onSave={handleSave}
          saveToast={saveToast}
        />
      </div>

      {/* 4. Modal de personnalisation avancée des réglages du widget */}
      <WidgetSettingsModal
        isOpen={!!activeSettingsConfig}
        onClose={() => setActiveSettingsConfig(null)}
        config={activeSettingsConfig}
        onSaveSettings={handleUpdateWidgetSettings}
      />
    </div>
  );
}
