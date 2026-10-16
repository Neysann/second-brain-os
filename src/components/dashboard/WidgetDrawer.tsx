'use client';

import React, { useState } from 'react';
import {
  X,
  Search,
  Plus,
  Check,
  GripVertical,
  Calendar,
  Clock,
  CloudSun,
  FileText,
  CheckSquare,
  FolderGit2,
  Target,
  Quote,
  Timer,
  Music,
  Rss,
  Newspaper,
  Sparkles,
  Image as ImageIcon,
  Flame,
  CheckCircle2,
  Wallet,
  LayoutGrid,
  RotateCcw,
  Save,
} from 'lucide-react';
import { WIDGET_CATALOG, WidgetMeta, WidgetSize, WidgetId } from '@/types/dashboard';

interface WidgetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeWidgetIds: WidgetId[];
  onAddWidget: (widgetId: WidgetId, size: WidgetSize) => void;
  selectedSize: WidgetSize;
  onSelectSize: (size: WidgetSize) => void;
  maxWidgets: number;
  showGridLines?: boolean;
  onToggleGridLines?: () => void;
  onReset?: () => void;
  onSave?: () => void;
  saveToast?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Calendar,
  Clock,
  CloudSun,
  FileText,
  CheckSquare,
  FolderGit2,
  Target,
  Quote,
  Timer,
  Music,
  Rss,
  Newspaper,
  Sparkles,
  Image: ImageIcon,
  Flame,
  CheckCircle2,
  Wallet,
};

// Miniatures visuelles fidèles pour prévisualiser chaque widget avant l'ajout
const WidgetMiniPreview: React.FC<{ widgetId: WidgetId }> = ({ widgetId }) => {
  switch (widgetId) {
    case 'clock':
      return (
        <div className="w-full h-16 rounded-xl bg-zinc-100/90 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center relative overflow-hidden group-hover:border-purple-500/40 transition-colors">
          <svg viewBox="0 0 40 40" className="w-9 h-9">
            <circle cx="20" cy="20" r="18" fill="none" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1.5" />
            <line x1="20" y1="20" x2="20" y2="9" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="20" y1="20" x2="27" y2="20" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="20" y1="20" x2="16" y2="26" stroke="#f43f5e" strokeWidth="1" strokeLinecap="round" />
            <circle cx="20" cy="20" r="1.5" fill="#a855f7" />
          </svg>
          <div className="ml-2 font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-200">14:32</div>
        </div>
      );
    case 'weather':
      return (
        <div className="w-full h-16 rounded-xl bg-zinc-100/90 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-3 relative overflow-hidden">
          <CloudSun className="w-7 h-7 text-amber-500 dark:text-amber-400 drop-shadow-sm animate-pulse" />
          <div className="text-right">
            <span className="font-mono text-sm font-black text-zinc-900 dark:text-white">18°</span>
            <span className="block text-[8px] text-zinc-500 dark:text-zinc-400">Paris • Ensoleillé</span>
          </div>
        </div>
      );
    case 'calendar':
      return (
        <div className="w-full h-16 rounded-xl bg-zinc-100/90 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-3">
          <div className="w-8 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex flex-col items-center justify-center">
            <span className="text-[7px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">OCT</span>
            <span className="text-xs font-black text-zinc-900 dark:text-white font-mono">07</span>
          </div>
          <div className="space-y-1 text-right">
            <div className="w-14 h-1.5 rounded-full bg-indigo-500/60" />
            <div className="w-10 h-1.5 rounded-full bg-purple-500/60" />
          </div>
        </div>
      );
    case 'quick_notes':
      return (
        <div className="w-full h-16 rounded-xl bg-zinc-100/90 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 p-2 flex flex-col justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-[9px] font-semibold text-zinc-700 dark:text-zinc-300">Idées rapides</span>
          </div>
          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-800" />
            <div className="w-3/4 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-800" />
          </div>
        </div>
      );
    case 'tasks':
      return (
        <div className="w-full h-16 rounded-xl bg-zinc-100/90 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 p-2 flex flex-col justify-around">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-purple-600 flex items-center justify-center text-[7px] text-white">✓</div>
            <div className="w-16 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border border-zinc-300 dark:border-zinc-700" />
            <div className="w-20 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      );
    case 'projects_overview':
      return (
        <div className="w-full h-16 rounded-xl bg-zinc-100/90 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 p-2 flex flex-col justify-between">
          <div className="flex justify-between text-[9px] text-zinc-600 dark:text-zinc-400">
            <span>Syntropy OS</span>
            <span className="text-purple-600 dark:text-purple-400 font-mono">75%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div className="w-3/4 h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" />
          </div>
        </div>
      );
    case 'project_progress':
      return (
        <div className="w-full h-16 rounded-xl bg-zinc-100/90 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-2">
          <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
            <circle cx="18" cy="18" r="14" fill="none" className="stroke-zinc-300 dark:stroke-zinc-800" strokeWidth="3" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="#a855f7" strokeWidth="3" strokeDasharray="88" strokeDashoffset="22" strokeLinecap="round" />
          </svg>
          <span className="font-mono text-xs font-black text-zinc-900 dark:text-white">75%</span>
        </div>
      );
    case 'focus_timer':
      return (
        <div className="w-full h-16 rounded-xl bg-zinc-100/90 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-around px-2">
          <Timer className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-pulse" />
          <span className="font-mono text-sm font-black text-purple-600 dark:text-purple-300">25:00</span>
        </div>
      );
    case 'daily_quote':
      return (
        <div className="w-full h-16 rounded-xl bg-purple-50/60 dark:bg-gradient-to-r dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-500/20 p-2 flex flex-col justify-between">
          <Quote className="w-3 h-3 text-purple-600 dark:text-purple-400" />
          <div className="w-full h-1 rounded-full bg-purple-400/40" />
          <span className="text-[8px] text-zinc-500 dark:text-zinc-400 italic">« Inspiration du jour »</span>
        </div>
      );
    case 'audio_player':
      return (
        <div className="w-full h-16 rounded-xl bg-zinc-100/90 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-3">
          <Music className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div className="flex items-end gap-0.5 h-6">
            <div className="w-1 bg-indigo-500 h-3 rounded-full animate-bounce" />
            <div className="w-1 bg-purple-500 h-5 rounded-full animate-bounce delay-75" />
            <div className="w-1 bg-indigo-400 h-2 rounded-full animate-bounce delay-150" />
            <div className="w-1 bg-purple-400 h-4 rounded-full animate-bounce delay-100" />
          </div>
        </div>
      );
    case 'rss_feed':
      return (
        <div className="w-full h-16 rounded-xl bg-zinc-100/90 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 p-2 flex flex-col justify-between">
          <div className="flex items-center gap-1.5">
            <Rss className="w-3 h-3 text-amber-500" />
            <span className="text-[9px] font-bold text-zinc-700 dark:text-zinc-300">Veille Tech</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-800" />
        </div>
      );
    case 'news':
      return (
        <div className="w-full h-16 rounded-xl bg-zinc-100/90 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 p-2 flex flex-col justify-between">
          <div className="flex items-center gap-1.5">
            <Newspaper className="w-3 h-3 text-sky-500 dark:text-sky-400" />
            <span className="text-[9px] font-bold text-zinc-700 dark:text-zinc-300">Actualités</span>
          </div>
          <div className="w-4/5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-800" />
        </div>
      );
    case 'interactive':
      return (
        <div className="w-full h-16 rounded-xl bg-zinc-100/90 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 p-2 grid grid-cols-4 gap-1 items-center">
          {['1', '2', '3', '+', '4', '5', '6', '='].map((k) => (
            <div key={k} className="h-2.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[6px] font-mono flex items-center justify-center text-zinc-700 dark:text-zinc-300">
              {k}
            </div>
          ))}
        </div>
      );
    case 'meme':
      return (
        <div className="w-full h-16 rounded-xl bg-gradient-to-tr from-amber-500/10 to-rose-500/10 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-1.5">
          <span className="text-xl">🐱</span>
          <span className="text-[9px] font-bold text-zinc-700 dark:text-zinc-300">Meme du jour</span>
        </div>
      );
    case 'streak_duo':
      return (
        <div className="w-full h-16 rounded-xl bg-amber-50/60 dark:bg-gradient-to-r dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-500/20 flex items-center justify-between px-3">
          <div className="flex items-center gap-1.5">
            <Flame className="w-6 h-6 text-amber-500 animate-pulse" />
            <div>
              <span className="font-mono text-sm font-black text-amber-600 dark:text-amber-300">12j</span>
              <span className="block text-[8px] text-amber-600/80 dark:text-amber-400/80">Série active</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-0.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-[1px] bg-purple-500" />
            ))}
          </div>
        </div>
      );
    case 'habits_sprint':
      return (
        <div className="w-full h-16 rounded-xl bg-zinc-100/90 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 p-2 flex flex-col justify-between">
          <div className="flex justify-between text-[8px] text-indigo-600 dark:text-indigo-400 font-semibold">
            <span>Sprint 10 Jours</span>
            <span>J4/10</span>
          </div>
          <div className="flex gap-1 justify-between">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
              <div
                key={d}
                className={`w-2 h-2 rounded-[2px] ${
                  d <= 4 ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>
      );
    case 'budget_mini':
      return (
        <div className="w-full h-16 rounded-xl bg-zinc-100/90 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-around px-2">
          {/* Mini Camembert SVG */}
          <svg viewBox="0 0 36 36" className="w-9 h-9">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#3b82f6" strokeWidth="5" strokeDasharray="30 70" strokeDashoffset="25" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="5" strokeDasharray="25 75" strokeDashoffset="-5" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="5" strokeDasharray="20 80" strokeDashoffset="-30" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="#f43f5e" strokeWidth="5" strokeDasharray="15 85" strokeDashoffset="-50" />
          </svg>
          <div className="text-right">
            <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">+1 450 €</span>
            <span className="block text-[8px] text-zinc-500 dark:text-zinc-400">Solde mensuel</span>
          </div>
        </div>
      );
    default:
      return null;
  }
};

export const WidgetDrawer: React.FC<WidgetDrawerProps> = ({
  isOpen,
  onClose,
  activeWidgetIds,
  onAddWidget,
  selectedSize,
  onSelectSize,
  maxWidgets,
  showGridLines = false,
  onToggleGridLines,
  onReset,
  onSave,
  saveToast = false,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredCatalog = WIDGET_CATALOG.filter((w) => {
    const q = search.toLowerCase();
    return w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q);
  });

  const isFull = activeWidgetIds.length >= maxWidgets;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm sm:max-w-md glass-surface border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 select-none">
      {/* 1. En-tête */}
      <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Menu des widgets</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 dark:border-purple-500/30 font-mono">
              {activeWidgetIds.length}/{maxWidgets}
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Personnalisez et réorganisez vos widgets en direct
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          title="Fermer le menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Barre d'Actions de Modification */}
      <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/40 flex items-center justify-between gap-2">
        {/* Toggle Grille */}
        {onToggleGridLines && (
          <button
            type="button"
            onClick={onToggleGridLines}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
              showGridLines
                ? 'bg-purple-100 dark:bg-purple-600/20 border-purple-300 dark:border-purple-500 text-purple-700 dark:text-purple-300'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
            title="Afficher/masquer les repères de grille"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Grille</span>
            <span
              className={`w-2 h-2 rounded-full ${
                showGridLines ? 'bg-purple-500 dark:bg-purple-400 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-600'
              }`}
            />
          </button>
        )}

        {/* Réinitialiser */}
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
            title="Rétablir la disposition par défaut de la maquette"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        )}

        {/* Enregistrer */}
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-600/25 cursor-pointer ml-auto"
          >
            {saveToast ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Enregistré !</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 3. Barre de Recherche */}
      <div className="p-3 sm:p-4 border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un widget..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* 4. Catalogue de Widgets avec Prévisualisation Visuelle */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 scrollbar-thin">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredCatalog.map((widget) => {
            const Icon = ICON_MAP[widget.iconName] || Sparkles;
            const isAdded = activeWidgetIds.includes(widget.id);

            return (
              <div
                key={widget.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    'text/plain',
                    JSON.stringify({ widgetId: widget.id, size: selectedSize })
                  );
                }}
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 cursor-grab active:cursor-grabbing group ${
                  isAdded
                    ? 'bg-zinc-100/80 dark:bg-zinc-900/40 border-purple-400/30 dark:border-purple-500/20 opacity-80'
                    : 'bg-zinc-50/80 dark:bg-zinc-900/70 border-zinc-200 dark:border-zinc-800 hover:border-purple-400/50 hover:bg-white dark:hover:bg-zinc-900 shadow-xs'
                }`}
              >
                {/* Prévisualisation visuelle miniature du widget */}
                <WidgetMiniPreview widgetId={widget.id} />

                {/* Nom & Description */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {widget.name}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                    {widget.description}
                  </div>
                </div>

                {/* Bouton d'ajout */}
                <button
                  type="button"
                  onClick={() => onAddWidget(widget.id, selectedSize)}
                  disabled={isFull && !isAdded}
                  className={`w-full py-1.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-50 dark:bg-zinc-800/80 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : isFull
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-xs'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Déjà ajouté</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span>Ajouter</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Pied : Choix de la taille du widget & Astuce */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/90 space-y-3">
        <div>
          <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">
            Taille du widget à insérer
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => onSelectSize('small')}
              className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                selectedSize === 'small'
                  ? 'bg-purple-50 dark:bg-purple-600/15 border-purple-500 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500'
                  : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="Format 1x1 (1 colonne x 1 rangée)"
            >
              <div className="w-4 h-4 rounded border border-current" />
              <span className="text-[10px] font-medium">Carré (1x1)</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSize('medium')}
              className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                selectedSize === 'medium'
                  ? 'bg-purple-50 dark:bg-purple-600/15 border-purple-500 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500'
                  : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="Format 2x1 (2 colonnes x 1 rangée)"
            >
              <div className="w-7 h-4 rounded border border-current" />
              <span className="text-[10px] font-medium">Rect (2x1)</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSize('large')}
              className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                selectedSize === 'large'
                  ? 'bg-purple-50 dark:bg-purple-600/15 border-purple-500 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500'
                  : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="Format 2x2 (2 colonnes x 2 rangées)"
            >
              <div className="w-7 h-6 rounded border border-current" />
              <span className="text-[10px] font-medium">Grand (2x2)</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSize('full')}
              className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                selectedSize === 'full'
                  ? 'bg-purple-50 dark:bg-purple-600/15 border-purple-500 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500'
                  : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="Format Pleine Largeur (prend 100% de la largeur de la feuille)"
            >
              <div className="w-10 h-4 rounded border border-current" />
              <span className="text-[10px] font-medium truncate">Plein (4x1)</span>
            </button>
          </div>
        </div>

        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <span>Glissez-déposez un widget dans la grille ou cliquez sur Ajouter</span>
        </div>
      </div>
    </div>
  );
};

export default WidgetDrawer;
