'use client';

import React, { useState } from 'react';
import {
  GripVertical,
  X,
  Maximize2,
  Minimize2,
  ArrowLeft,
  ArrowRight,
  Settings,
} from 'lucide-react';
import { DashboardWidgetConfig, WidgetSize } from '@/types/dashboard';
import { useSettings } from '@/context/SettingsContext';
import CalendarWidget from './widgets/CalendarWidget';
import ClockWidget from './widgets/ClockWidget';
import WeatherWidget from './widgets/WeatherWidget';
import QuickNotesWidget from './widgets/QuickNotesWidget';
import TodoListWidget from './widgets/TodoListWidget';
import ProjectsOverviewWidget from './widgets/ProjectsOverviewWidget';
import ProjectProgressWidget from './widgets/ProjectProgressWidget';
import FocusTimerWidget from './widgets/FocusTimerWidget';
import DailyQuoteWidget from './widgets/DailyQuoteWidget';
import AudioPlayerWidget from './widgets/AudioPlayerWidget';
import RssFeedWidget from './widgets/RssFeedWidget';
import NewsWidget from './widgets/NewsWidget';
import InteractiveCalcWidget from './widgets/InteractiveCalcWidget';
import MemeWidget from './widgets/MemeWidget';
import StreakWidget from './widgets/StreakWidget';
import HabitsSprintWidget from './widgets/HabitsSprintWidget';
import BudgetMiniWidget from './widgets/BudgetMiniWidget';

interface DashboardGridProps {
  widgets: DashboardWidgetConfig[];
  isEditing: boolean;
  showGridLines: boolean;
  onRemoveWidget: (id: string) => void;
  onUpdateWidgetSize: (id: string, size: WidgetSize) => void;
  onReorderWidgets: (startIndex: number, endIndex: number) => void;
  onOpenWidgetSettings?: (config: DashboardWidgetConfig) => void;
}

const CYBERPUNK_SERIALS: Record<string, string> = {
  calendar: 'CAL-001',
  clock: 'CLK-001',
  weather: 'WX-001',
  quick_notes: 'NOTE-001',
  tasks: 'TASK-001',
  projects_overview: 'PRJ-001',
  project_progress: 'PRG-001',
  daily_quote: 'QTE-001',
  focus_timer: 'FCS-001',
  audio_player: 'AUD-001',
  rss_feed: 'RSS-001',
  news: 'NWS-001',
  interactive: 'CLC-001',
  meme: 'MEM-001',
  streak_duo: 'STR-001',
  habits_sprint: 'HBT-001',
  budget_mini: 'BGT-001',
};

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  widgets,
  isEditing,
  showGridLines,
  onRemoveWidget,
  onUpdateWidgetSize,
  onReorderWidgets,
  onOpenWidgetSettings,
}) => {
  const { settings } = useSettings();
  const isNothing = settings?.uiStyle === 'nothing';
  const isCyberpunk = settings?.uiStyle === 'cyberpunk';
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{
    index: number;
    position: 'before' | 'after';
  } | null>(null);

  const renderWidgetContent = (config: DashboardWidgetConfig) => {
    const handleOpenSettings = onOpenWidgetSettings
      ? () => onOpenWidgetSettings(config)
      : undefined;

    switch (config.widgetId) {
      case 'calendar':
        return <CalendarWidget />;
      case 'clock':
        return (
          <ClockWidget
            size={config.size}
            settings={config.settings}
            onOpenSettings={handleOpenSettings}
          />
        );
      case 'weather':
        return (
          <WeatherWidget
            size={config.size}
            settings={config.settings}
            onOpenSettings={handleOpenSettings}
          />
        );
      case 'quick_notes':
        return (
          <QuickNotesWidget
            settings={config.settings}
            onOpenSettings={handleOpenSettings}
          />
        );
      case 'tasks':
        return (
          <TodoListWidget
            settings={config.settings}
            onOpenSettings={handleOpenSettings}
          />
        );
      case 'projects_overview':
        return <ProjectsOverviewWidget />;
      case 'project_progress':
        return <ProjectProgressWidget />;
      case 'focus_timer':
        return (
          <FocusTimerWidget
            settings={config.settings}
            onOpenSettings={handleOpenSettings}
          />
        );
      case 'daily_quote':
        return <DailyQuoteWidget isEditing={isEditing} />;
      case 'audio_player':
        return (
          <AudioPlayerWidget
            settings={config.settings}
            onOpenSettings={handleOpenSettings}
          />
        );
      case 'rss_feed':
        return <RssFeedWidget />;
      case 'news':
        return <NewsWidget />;
      case 'interactive':
        return <InteractiveCalcWidget />;
      case 'meme':
        return <MemeWidget />;
      case 'streak_duo':
        return <StreakWidget size={config.size} />;
      case 'habits_sprint':
        return <HabitsSprintWidget />;
      case 'budget_mini':
        return <BudgetMiniWidget size={config.size} />;
      default:
        return <div className="p-4 text-xs text-zinc-500">Widget non reconnu</div>;
    }
  };

  // Dimensions de widget : support 1, 2, 3 ou 4 colonnes (pleine largeur)
  const getSizeClasses = (config: DashboardWidgetConfig) => {
    if (config.customSize?.cols === 4) {
      return 'col-span-1 sm:col-span-2 lg:col-span-4 row-span-1';
    }
    if (config.customSize?.cols === 3) {
      return 'col-span-1 sm:col-span-2 lg:col-span-3 row-span-1';
    }
    if (config.customSize?.cols === 2) {
      return 'col-span-1 sm:col-span-1 lg:col-span-2 row-span-1';
    }

    switch (config.size) {
      case 'full':
        // Format Pleine Largeur : 4 colonnes sur 4 (100% de la largeur de la feuille)
        return 'col-span-1 sm:col-span-2 lg:col-span-4 row-span-1';
      case 'large':
        // Grand format : 2 colonnes x 2 rangées
        return 'col-span-1 sm:col-span-2 lg:col-span-2 row-span-2';
      case 'medium':
        // Format rectangle : 2 colonnes sur grand écran
        return 'col-span-1 sm:col-span-2 lg:col-span-2 row-span-1';
      case 'small':
      default:
        // Format carré : 1 colonne x 1 rangée
        return 'col-span-1 sm:col-span-1 lg:col-span-1 row-span-1';
    }
  };

  // Déplacement direct par boutons fléchés (garantie 100% de liberté de mouvement)
  const handleMoveWidget = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target >= 0 && target < widgets.length) {
      onReorderWidgets(index, target);
    }
  };

  // Gestion du Drag & Drop fluide avec repère visuel d'insertion
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const isLeft = e.clientX < rect.left + rect.width / 2;
    setDragOverInfo({ index, position: isLeft ? 'before' : 'after' });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    let destIndex = targetIndex;
    if (dragOverInfo) {
      if (dragOverInfo.position === 'after' && draggedIndex < targetIndex) {
        destIndex = targetIndex;
      } else if (dragOverInfo.position === 'after' && draggedIndex > targetIndex) {
        destIndex = targetIndex + 1;
      } else if (dragOverInfo.position === 'before' && draggedIndex < targetIndex) {
        destIndex = targetIndex - 1;
      } else if (dragOverInfo.position === 'before' && draggedIndex > targetIndex) {
        destIndex = targetIndex;
      }
    }
    destIndex = Math.max(0, Math.min(widgets.length - 1, destIndex));

    if (draggedIndex !== destIndex) {
      onReorderWidgets(draggedIndex, destIndex);
    }
    setDraggedIndex(null);
    setDragOverInfo(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverInfo(null);
  };

  const toggleSize = (config: DashboardWidgetConfig) => {
    const cycle: WidgetSize[] = ['small', 'medium', 'large', 'full'];
    const currentIdx = cycle.indexOf(config.size);
    const nextSize = cycle[(currentIdx + 1) % cycle.length] || 'small';
    onUpdateWidgetSize(config.id, nextSize);
  };

  return (
    <div
      className={`relative w-full flex-1 transition-all h-full overflow-hidden ${
        showGridLines ? 'dashboard-grid-pattern' : ''
      }`}
    >
      {/* Grille Principale 4 colonnes avec hauteur de ligne fixe (200px) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full h-full auto-rows-[200px] overflow-y-auto pb-6 scrollbar-thin">
        {widgets.map((config, index) => {
          const isDraggingThis = draggedIndex === index;
          const isOverThis = dragOverInfo?.index === index;
          const isInsertBefore = isOverThis && dragOverInfo?.position === 'before';
          const isInsertAfter = isOverThis && dragOverInfo?.position === 'after';

          return (
            <div
              key={config.id}
              draggable={isEditing}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden ${getSizeClasses(
                config
              )} ${
                isCyberpunk
                  ? 'cyber-corner-brackets bg-[#090d18]/90 border-[#FCEE0A]/30 hover:border-[#FCEE0A]/60 shadow-lg'
                  : isEditing
                  ? isNothing
                    ? 'border-white/50 glass-card shadow-[0_0_15px_rgba(255,255,255,0.08)] ring-1 ring-white/30'
                    : 'border-purple-500/50 hover:border-purple-400 glass-card shadow-lg ring-1 ring-purple-500/30'
                  : 'glass-card hover:border-zinc-300 dark:hover:border-zinc-700/80 shadow-xs'
              } ${isDraggingThis ? 'opacity-30 scale-95 border-dashed border-white/50' : ''}`}
            >
              {/* Tag de série technique Cyberpunk (CAL-001, CLK-001...) */}
              {isCyberpunk && !isEditing && (
                <div className="absolute top-2.5 right-3.5 z-10 pointer-events-none select-none font-mono text-[9px] font-bold tracking-widest text-[#FCEE0A]/70 uppercase">
                  {CYBERPUNK_SERIALS[config.widgetId] || `${config.widgetId.substring(0, 3).toUpperCase()}-001`}
                </div>
              )}

              {/* Ligne visuelle indiquant l'endroit exact de dépose (Nothing Red en Nothing OS, Cyberpunk Yellow en Cyberpunk) */}
              {isInsertBefore && !isDraggingThis && (
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-full z-30 animate-pulse ${
                  isCyberpunk
                    ? 'bg-[#FCEE0A] shadow-[0_0_12px_#FCEE0A] ring-1 ring-[#FCEE0A]'
                    : isNothing
                    ? 'bg-[#D71920] shadow-[0_0_12px_#D71920] ring-1 ring-[#D71920]'
                    : 'bg-gradient-to-b from-purple-400 to-indigo-500 shadow-lg shadow-purple-500/80 ring-2 ring-purple-300'
                }`} />
              )}
              {isInsertAfter && !isDraggingThis && (
                <div className={`absolute right-0 top-0 bottom-0 w-1.5 rounded-full z-30 animate-pulse ${
                  isCyberpunk
                    ? 'bg-[#FCEE0A] shadow-[0_0_12px_#FCEE0A] ring-1 ring-[#FCEE0A]'
                    : isNothing
                    ? 'bg-[#D71920] shadow-[0_0_12px_#D71920] ring-1 ring-[#D71920]'
                    : 'bg-gradient-to-b from-purple-400 to-indigo-500 shadow-lg shadow-purple-500/80 ring-2 ring-purple-300'
                }`} />
              )}

              {/* Barre de contrôle d'édition flottante avec déplacement libre */}
              {isEditing && (
                <div className={`absolute top-1.5 right-1.5 z-20 flex items-center gap-1 p-1 rounded-xl backdrop-blur-md shadow-xl ${
                  isNothing
                    ? 'bg-black/95 border border-white/20'
                    : 'bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-700'
                }`}>
                  {/* Boutons de déplacement direct gauche / droite pour un contrôle total */}
                  <button
                    type="button"
                    onClick={() => handleMoveWidget(index, 'left')}
                    disabled={index === 0}
                    className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Déplacer vers la gauche"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMoveWidget(index, 'right')}
                    disabled={index === widgets.length - 1}
                    className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Déplacer vers la droite"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  {/* Poignée de drag & drop tactile ou souris */}
                  <div
                    className={`p-1 cursor-grab active:cursor-grabbing ${
                      isNothing ? 'text-[#D71920] hover:text-white' : 'text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-white'
                    }`}
                    title="Glisser-déposer pour déplacer librement"
                  >
                    <GripVertical className="w-3 h-3" />
                  </div>

                  {/* Bouton de personnalisation des réglages du widget */}
                  {onOpenWidgetSettings && (
                    <button
                      type="button"
                      onClick={() => onOpenWidgetSettings(config)}
                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                        isNothing
                          ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                          : 'text-zinc-500 hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                      title="Personnaliser ce widget"
                    >
                      <Settings className="w-3 h-3" />
                    </button>
                  )}

                  {/* Redimensionnement */}
                  <button
                    type="button"
                    onClick={() => toggleSize(config)}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      isNothing
                        ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        : 'text-zinc-500 hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                    title={`Changer la taille (actuelle : ${config.size})`}
                  >
                    {config.size === 'small' ? (
                      <Maximize2 className="w-3 h-3" />
                    ) : (
                      <Minimize2 className="w-3 h-3" />
                    )}
                  </button>

                  {/* Supprimer */}
                  <button
                    type="button"
                    onClick={() => onRemoveWidget(config.id)}
                    className="p-1 rounded-md text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Supprimer ce widget"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Contenu du Widget (clics désactivés en mode édition pour ne pas interférer avec le déplacement) */}
              <div
                className={`flex-1 w-full h-full overflow-hidden ${
                  isEditing ? 'pointer-events-none select-none' : ''
                }`}
              >
                {renderWidgetContent(config)}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .dashboard-grid-pattern {
          background-image: ${isCyberpunk
            ? 'radial-gradient(rgba(252, 238, 10, 0.22) 1px, transparent 1px)'
            : isNothing
            ? 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)'
            : 'radial-gradient(rgba(168, 85, 247, 0.18) 1px, transparent 1px)'};
          background-size: 24px 24px;
        }
      `}</style>
    </div>
  );
};

export default DashboardGrid;
