'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  CheckSquare,
  FolderGit2,
  BookOpen,
  ArrowRight,
  Tag,
  Flame,
  Wallet,
  Calendar as CalendarIcon,
  Settings as SettingsIcon,
  Plus,
  PenTool,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Sparkles,
  LayoutDashboard,
  Check,
  Clock,
  Layers,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Circle,
  FileText,
  Activity,
  Command,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useDailyLife } from '@/context/DailyLifeContext';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { CURRENT_VERSION } from '@/lib/version';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type CategoryFilter = 'all' | 'actions' | 'navigation' | 'notes' | 'tasks' | 'calendar' | 'habits';

interface PaletteItem {
  id: string;
  category: CategoryFilter;
  categoryLabel: string;
  title: string;
  subtitle?: string;
  tags?: string[];
  badge?: string;
  badgeColor?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  onSelect: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { tasks, projects, notes, events } = useData();
  const { habits } = useDailyLife();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();
  const isNothing = settings?.uiStyle === 'nothing';

  // Focus automatique à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setActiveCategory('all');
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  // Réinitialiser la sélection lors d'une nouvelle frappe ou changement d'onglet
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  // Gestion du plein écran
  const toggleFullscreen = () => {
    if (typeof document !== 'undefined') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
    onClose();
  };

  // Construction de tous les éléments possibles de la palette
  const allItems: PaletteItem[] = useMemo(() => {
    const list: PaletteItem[] = [];

    // 1. Actions Rapides
    list.push(
      {
        id: 'act-new-note',
        category: 'actions',
        categoryLabel: 'Actions Rapides',
        title: '+ Nouvelle note de synthèse',
        subtitle: 'Créer un nouveau document Markdown vierge dans la boîte de réception',
        badge: 'Éditeur',
        badgeColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
        icon: Plus,
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        iconBg: 'bg-indigo-500/10 border-indigo-500/30',
        onSelect: () => {
          router.push('/notes?action=new');
          onClose();
        },
      },
      {
        id: 'act-new-ink',
        category: 'actions',
        categoryLabel: 'Actions Rapides',
        title: '+ Nouveau mémo manuscrit (Ink)',
        subtitle: 'Ouvrir le carnet de croquis et stylet interactif',
        badge: 'Manuscrit',
        badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
        icon: PenTool,
        iconColor: 'text-purple-600 dark:text-purple-400',
        iconBg: 'bg-purple-500/10 border-purple-500/30',
        onSelect: () => {
          router.push('/notes?action=new-ink');
          onClose();
        },
      },
      {
        id: 'act-new-task',
        category: 'actions',
        categoryLabel: 'Actions Rapides',
        title: '+ Nouvelle tâche Kanban',
        subtitle: 'Ajouter une tâche à votre tableau de bord ou projet actif',
        badge: 'Productivité',
        badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        icon: CheckSquare,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        iconBg: 'bg-emerald-500/10 border-emerald-500/30',
        onSelect: () => {
          router.push('/tasks?action=new');
          onClose();
        },
      },
      {
        id: 'act-new-event',
        category: 'actions',
        categoryLabel: 'Actions Rapides',
        title: '+ Nouvel événement agenda',
        subtitle: 'Planifier une réunion, rendez-vous ou échéance clé',
        badge: 'Calendrier',
        badgeColor: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
        icon: CalendarIcon,
        iconColor: 'text-cyan-600 dark:text-cyan-400',
        iconBg: 'bg-cyan-500/10 border-cyan-500/30',
        onSelect: () => {
          router.push('/calendar?action=new');
          onClose();
        },
      },
      {
        id: 'act-new-habit',
        category: 'actions',
        categoryLabel: 'Actions Rapides',
        title: '+ Nouvelle habitude de vie',
        subtitle: 'Définir un nouveau rituel pour vos cycles quotidiens',
        badge: 'Habitudes',
        badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
        icon: Flame,
        iconColor: 'text-amber-600 dark:text-amber-400',
        iconBg: 'bg-amber-500/10 border-amber-500/30',
        onSelect: () => {
          router.push('/habits?action=new');
          onClose();
        },
      },
      {
        id: 'act-toggle-theme',
        category: 'actions',
        categoryLabel: 'Actions Rapides',
        title: theme === 'dark' ? 'Basculer en Thème Clair (Mode Jour)' : 'Basculer en Thème Sombre (Mode Nuit)',
        subtitle: `Apparence actuelle : ${theme === 'dark' ? 'Sombre OLED/Néon' : 'Clair épuré'}`,
        badge: 'Thème',
        badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
        icon: theme === 'dark' ? Sun : Moon,
        iconColor: theme === 'dark' ? 'text-amber-400' : 'text-purple-600',
        iconBg: theme === 'dark' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-purple-500/10 border-purple-500/30',
        onSelect: () => {
          toggleTheme();
          onClose();
        },
      },
      {
        id: 'act-fullscreen',
        category: 'actions',
        categoryLabel: 'Actions Rapides',
        title: 'Basculer Plein Écran (Immersion Totale)',
        subtitle: 'Agrandir la fenêtre Syntropy pour une concentration maximale sans distraction',
        badge: 'Affichage',
        badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
        icon: Maximize2,
        iconColor: 'text-blue-600 dark:text-blue-400',
        iconBg: 'bg-blue-500/10 border-blue-500/30',
        onSelect: toggleFullscreen,
      },
      {
        id: 'act-whats-new',
        category: 'actions',
        categoryLabel: 'Actions Rapides',
        title: `Nouveautés de Version & Patchnotes (V${CURRENT_VERSION})`,
        subtitle: 'Consulter les dernières améliorations du système et corrections',
        badge: 'Système',
        badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
        icon: Sparkles,
        iconColor: 'text-purple-600 dark:text-purple-400',
        iconBg: 'bg-purple-500/10 border-purple-500/30',
        onSelect: () => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('open-whats-new'));
          }
          onClose();
        },
      }
    );

    // 2. Navigation & Espaces
    list.push(
      {
        id: 'nav-dashboard',
        category: 'navigation',
        categoryLabel: 'Espaces & Modules',
        title: 'Tableau de bord principal',
        subtitle: 'Widgets interactifs, météo, horloges, minuteur et vue synoptique',
        badge: 'Accueil',
        badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
        icon: LayoutDashboard,
        iconColor: 'text-purple-600 dark:text-purple-400',
        iconBg: 'bg-purple-500/10 border-purple-500/30',
        onSelect: () => {
          router.push('/');
          onClose();
        },
      },
      {
        id: 'nav-notes',
        category: 'navigation',
        categoryLabel: 'Espaces & Modules',
        title: 'Notes & Connaissances (Classiques & Manuscrites)',
        subtitle: 'Éditeur Markdown, stylet Ink, équations LaTeX, arborescence et méthode PARA',
        badge: 'Savoirs',
        badgeColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
        icon: BookOpen,
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        iconBg: 'bg-indigo-500/10 border-indigo-500/30',
        onSelect: () => {
          router.push('/notes');
          onClose();
        },
      },
      {
        id: 'nav-tasks',
        category: 'navigation',
        categoryLabel: 'Espaces & Modules',
        title: 'Tâches, Projets & Kanban',
        subtitle: 'Gestion des priorités, colonnes de statut et catégories PARA',
        badge: 'Exécution',
        badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        icon: CheckSquare,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        iconBg: 'bg-emerald-500/10 border-emerald-500/30',
        onSelect: () => {
          router.push('/tasks');
          onClose();
        },
      },
      {
        id: 'nav-calendar',
        category: 'navigation',
        categoryLabel: 'Espaces & Modules',
        title: 'Calendrier & Synchronisation iCal / Google',
        subtitle: 'Vue mensuelle, mode agenda, flux distants et échéances',
        badge: 'Temps',
        badgeColor: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
        icon: CalendarIcon,
        iconColor: 'text-cyan-600 dark:text-cyan-400',
        iconBg: 'bg-cyan-500/10 border-cyan-500/30',
        onSelect: () => {
          router.push('/calendar');
          onClose();
        },
      },
      {
        id: 'nav-habits',
        category: 'navigation',
        categoryLabel: 'Espaces & Modules',
        title: 'Habitudes & Rituels Quotidiens',
        subtitle: 'Suivi des 7 jours, validation en 1 clic et séries actives',
        badge: 'Régularité',
        badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
        icon: Flame,
        iconColor: 'text-amber-600 dark:text-amber-400',
        iconBg: 'bg-amber-500/10 border-amber-500/30',
        onSelect: () => {
          router.push('/habits');
          onClose();
        },
      },
      {
        id: 'nav-budget',
        category: 'navigation',
        categoryLabel: 'Espaces & Modules',
        title: 'Gestion Financière & Budget Donut',
        subtitle: 'Suivi des revenus, dépenses catégorisées et solde net',
        badge: 'Finances',
        badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        icon: Wallet,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        iconBg: 'bg-emerald-500/10 border-emerald-500/30',
        onSelect: () => {
          router.push('/budget');
          onClose();
        },
      },
      {
        id: 'nav-settings',
        category: 'navigation',
        categoryLabel: 'Espaces & Modules',
        title: 'Paramètres du Système & Thèmes',
        subtitle: 'Couleurs d\'accentuation, options de police, vue par défaut et compte',
        badge: 'Configuration',
        badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
        icon: SettingsIcon,
        iconColor: 'text-purple-600 dark:text-purple-400',
        iconBg: 'bg-purple-500/10 border-purple-500/30',
        onSelect: () => {
          router.push('/settings');
          onClose();
        },
      }
    );

    // 3. Notes réelles
    notes.forEach((note) => {
      const excerpt = (note.content || '').replace(/[#*`_>\[\]]/g, ' ').slice(0, 100);
      const isInk = note.format === 'ink';
      list.push({
        id: `note-${note.id}`,
        category: 'notes',
        categoryLabel: 'Notes & Connaissances',
        title: note.title || 'Note sans titre',
        subtitle: excerpt || 'Document Markdown Syntropy',
        tags: note.tags || [],
        badge: isInk ? 'Manuscrit' : 'Texte',
        badgeColor:
          isInk
            ? 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30'
            : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
        icon: isInk ? PenTool : BookOpen,
        iconColor: isInk ? 'text-pink-600 dark:text-pink-400' : 'text-indigo-600 dark:text-indigo-400',
        iconBg: isInk ? 'bg-pink-500/10 border-pink-500/30' : 'bg-indigo-500/10 border-indigo-500/30',
        onSelect: () => {
          router.push(`/notes?id=${note.id}`);
          onClose();
        },
      });
    });

    // 4. Tâches réelles
    tasks.forEach((task) => {
      let statusLabel = 'À faire';
      let statusColor = 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/30';
      if (task.status === 'in_progress') {
        statusLabel = 'En cours';
        statusColor = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
      } else if (task.status === 'done') {
        statusLabel = 'Terminée';
        statusColor = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      }

      list.push({
        id: `task-${task.id}`,
        category: 'tasks',
        categoryLabel: 'Tâches & Projets',
        title: task.title,
        subtitle: task.description || `Priorité ${task.priority || 'normale'} • Catégorie : ${task.category || 'projet'}`,
        tags: task.tags || [],
        badge: statusLabel,
        badgeColor: statusColor,
        icon: CheckSquare,
        iconColor: task.status === 'done' ? 'text-emerald-500' : task.status === 'in_progress' ? 'text-amber-500' : 'text-zinc-400',
        iconBg: 'bg-zinc-500/10 border-zinc-500/30',
        onSelect: () => {
          router.push('/tasks');
          onClose();
        },
      });
    });

    // 5. Projets
    projects.forEach((proj) => {
      list.push({
        id: `proj-${proj.id}`,
        category: 'tasks',
        categoryLabel: 'Tâches & Projets',
        title: proj.title,
        subtitle: proj.description || `Projet actif sous ${proj.category || 'projet'}`,
        tags: proj.tags || [],
        badge: 'Projet',
        badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
        icon: FolderGit2,
        iconColor: 'text-purple-600 dark:text-purple-400',
        iconBg: 'bg-purple-500/10 border-purple-500/30',
        onSelect: () => {
          router.push(`/tasks?category=${proj.category}`);
          onClose();
        },
      });
    });

    // 6. Événements Calendrier
    events.forEach((ev) => {
      list.push({
        id: `event-${ev.id}`,
        category: 'calendar',
        categoryLabel: 'Calendrier & Événements',
        title: ev.title,
        subtitle: `${ev.startDate} • ${ev.description || 'Agenda'}`,
        badge: 'Événement',
        badgeColor: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
        icon: CalendarIcon,
        iconColor: 'text-cyan-600 dark:text-cyan-400',
        iconBg: 'bg-cyan-500/10 border-cyan-500/30',
        onSelect: () => {
          router.push('/calendar');
          onClose();
        },
      });
    });

    // 7. Habitudes
    habits.forEach((habit) => {
      list.push({
        id: `habit-${habit.id}`,
        category: 'habits',
        categoryLabel: 'Habitudes & Rituels',
        title: `${habit.icon || '✨'} ${habit.name}`,
        subtitle: habit.goalDescription || `Rituel récurrent (Sprint ${habit.targetDays || 10} jours)`,
        badge: 'Habitude',
        badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
        icon: Flame,
        iconColor: 'text-amber-600 dark:text-amber-400',
        iconBg: 'bg-amber-500/10 border-amber-500/30',
        onSelect: () => {
          router.push('/habits');
          onClose();
        },
      });
    });

    return list;
  }, [tasks, projects, notes, events, habits, theme, toggleTheme, router, onClose]);

  // Filtrage selon le texte saisi et l'onglet actif
  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();

    return allItems.filter((item) => {
      // Filtre catégorie par onglet
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }

      // Si aucune recherche texte, on affiche les actions et la navigation, puis un aperçu des notes/tâches
      if (!q) {
        return true;
      }

      // Recherche multi-champs
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubtitle = item.subtitle ? item.subtitle.toLowerCase().includes(q) : false;
      const matchBadge = item.badge ? item.badge.toLowerCase().includes(q) : false;
      const matchTags = item.tags ? item.tags.some((t) => t.toLowerCase().includes(q)) : false;

      return matchTitle || matchSubtitle || matchBadge || matchTags;
    });
  }, [allItems, query, activeCategory]);

  // Défilement automatique de l'élément sélectionné
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  // Gestion des touches du clavier (Navigation & Clôture)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredItems.length === 0 ? 0 : (prev + 1) % filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length === 0 ? 0 : (prev - 1 + filteredItems.length) % filteredItems.length
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].onSelect();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  const categoriesTabs: { id: CategoryFilter; label: string; count?: number }[] = [
    { id: 'all', label: 'Tout' },
    { id: 'actions', label: 'Actions' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'notes', label: 'Notes' },
    { id: 'tasks', label: 'Tâches' },
    { id: 'calendar', label: 'Calendrier' },
    { id: 'habits', label: 'Habitudes' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[82vh] transition-all transform animate-in zoom-in-95 duration-150 ${
          isNothing
            ? 'bg-black/95 border-white/20 text-white shadow-[0_0_50px_rgba(0,0,0,0.9)] font-ntype'
            : theme === 'dark'
            ? 'glass-surface border-zinc-800 text-zinc-100 shadow-zinc-950/90'
            : 'glass-surface border-zinc-200 text-zinc-900 shadow-2xl shadow-zinc-950/20'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Barre de saisie Universelle */}
        <div className={`flex items-center px-4 py-3.5 border-b gap-3 ${
          isNothing ? 'border-white/10 bg-black' : 'border-zinc-200 dark:border-zinc-800/80'
        }`}>
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${
            isNothing ? 'bg-zinc-950 border-white/10' : 'bg-purple-500/10 border-purple-500/30'
          }`}>
            <Search className={`w-4 h-4 ${isNothing ? 'text-[#D71920]' : 'text-purple-600 dark:text-purple-400'}`} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isNothing ? "SEARCH NOTES, TASKS, ACTIONS..." : "Rechercher une note, tâche, commande (ex: +note, thème, budget)..."}
            className={`w-full bg-transparent border-none outline-none text-base ${
              isNothing
                ? 'placeholder:text-zinc-600 text-white font-ntype'
                : 'placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100 font-medium'
            }`}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md transition-colors border cursor-pointer ${
              isNothing
                ? 'font-ndot bg-zinc-950 text-zinc-400 border-white/10 hover:text-white'
                : 'font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700'
            }`}
          >
            ESC
          </button>
        </div>

        {/* 2. Onglets de filtrage par module */}
        <div className={`flex items-center gap-1.5 px-3 py-2 border-b overflow-x-auto scrollbar-none flex-shrink-0 ${
          isNothing ? 'border-white/10 bg-black' : 'border-zinc-200 dark:border-zinc-800/60 bg-zinc-50/70 dark:bg-zinc-950/40'
        }`}>
          {categoriesTabs.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isNothing
                    ? isActive
                      ? 'rounded-full bg-white text-black font-ndot uppercase tracking-wider shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                      : 'rounded-full text-zinc-400 hover:text-white font-ndot uppercase tracking-wider hover:bg-zinc-900'
                    : isActive
                    ? 'rounded-lg bg-purple-600 text-white shadow-xs'
                    : 'rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* 3. Liste des résultats défilable */}
        <div
          ref={itemsContainerRef}
          className="overflow-y-auto p-2 sm:p-3 space-y-1 flex-1 scrollbar-thin"
        >
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <Search className={`w-8 h-8 mx-auto mb-2 ${isNothing ? 'text-zinc-600' : 'text-zinc-400 dark:text-zinc-600'}`} />
              <p className={`text-sm font-semibold ${isNothing ? 'text-zinc-300 font-ndot uppercase' : 'text-zinc-800 dark:text-zinc-200'}`}>
                {isNothing ? `NO RESULTS FOR "${query}"` : `Aucun résultat pour « ${query} »`}
              </p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {isNothing
                  ? 'TRY +NOTE, THEME, TASK, OR CALENDAR.'
                  : "Essayez d'autres mots-clés ou tapez des commandes directes comme +note, thème, tâche ou calendrier."}
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  onClick={() => item.onSelect()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                    isNothing
                      ? isSelected
                        ? 'bg-zinc-900/90 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.06)]'
                        : 'border-transparent hover:bg-zinc-950 text-zinc-300'
                      : isSelected
                      ? theme === 'dark'
                        ? 'bg-purple-950/40 border-purple-500/50 shadow-sm'
                        : 'bg-purple-50 border-purple-300 shadow-sm'
                      : 'border-transparent hover:bg-zinc-100/70 dark:hover:bg-zinc-850/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`p-2 rounded-xl border flex-shrink-0 transition-transform ${
                        isSelected ? 'scale-105' : ''
                      } ${
                        isNothing
                          ? isSelected
                            ? 'bg-zinc-950 border-white/30'
                            : 'bg-zinc-950/80 border-white/10'
                          : item.iconBg
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isNothing ? (isSelected ? 'text-white' : 'text-zinc-300') : item.iconColor}`} />
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold text-sm truncate ${
                            isNothing
                              ? isSelected ? 'text-white font-bold' : 'text-zinc-200'
                              : isSelected
                              ? theme === 'dark'
                                ? 'text-white'
                                : 'text-purple-950 font-bold'
                              : theme === 'dark'
                              ? 'text-zinc-100'
                              : 'text-zinc-900'
                          }`}
                        >
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border flex-shrink-0 ${
                              isNothing
                                ? 'bg-zinc-900 text-zinc-300 border-white/10 font-ndot uppercase text-[8px]'
                                : item.badgeColor ||
                                  (theme === 'dark'
                                    ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                    : 'bg-zinc-100 text-zinc-800 border-zinc-200')
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p
                          className={`text-xs mt-0.5 truncate ${
                            isNothing
                              ? isSelected ? 'text-zinc-300' : 'text-zinc-500'
                              : isSelected
                              ? theme === 'dark'
                                ? 'text-purple-200'
                                : 'text-purple-800'
                              : theme === 'dark'
                              ? 'text-zinc-400'
                              : 'text-zinc-600'
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Indicateur de validation à droite */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {item.tags && item.tags.length > 0 && (
                      <div className="hidden sm:flex items-center gap-1 mr-2">
                        {item.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                              isNothing
                                ? 'bg-zinc-950 text-zinc-400 border border-white/10'
                                : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <span
                      className={`text-xs flex items-center gap-1 px-1.5 py-0.5 rounded border transition-opacity ${
                        isSelected
                          ? isNothing
                            ? 'opacity-100 bg-[#D71920] text-white border-[#D71920] shadow-[0_0_8px_rgba(215,25,32,0.5)] font-ndot'
                            : 'opacity-100 bg-purple-600 text-white border-purple-500 shadow-xs'
                          : 'opacity-0 text-zinc-400 border-transparent'
                      }`}
                    >
                      <CornerDownLeft className="w-3 h-3" />
                      <span className="hidden sm:inline text-[10px] font-mono">
                        {isNothing ? 'ENTER' : 'Entrée'}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* 4. Barre de statut / Pied de page avec raccourcis */}
        <div className={`px-4 py-2.5 border-t flex items-center justify-between text-xs flex-shrink-0 ${
          isNothing
            ? 'border-white/10 bg-black text-zinc-400'
            : 'border-zinc-200 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 bg-zinc-50/80 dark:bg-zinc-950/60'
        }`}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className={`px-1 py-0.5 rounded text-[10px] border ${
                isNothing
                  ? 'font-ndot bg-zinc-950 text-zinc-300 border-white/10'
                  : 'font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
              }`}>
                ↑
              </kbd>
              <kbd className={`px-1 py-0.5 rounded text-[10px] border ${
                isNothing
                  ? 'font-ndot bg-zinc-950 text-zinc-300 border-white/10'
                  : 'font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
              }`}>
                ↓
              </kbd>
              <span className="hidden sm:inline">{isNothing ? 'NAVIGATE' : 'Naviguer'}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className={`px-1.5 py-0.5 rounded text-[10px] border ${
                isNothing
                  ? 'font-ndot bg-zinc-950 text-zinc-300 border-white/10'
                  : 'font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
              }`}>
                ↵
              </kbd>
              <span className="hidden sm:inline">{isNothing ? 'EXECUTE' : 'Exécuter'}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className={`px-1.5 py-0.5 rounded text-[10px] border ${
                isNothing
                  ? 'font-ndot bg-zinc-950 text-zinc-300 border-white/10'
                  : 'font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
              }`}>
                ESC
              </kbd>
              <span className="hidden sm:inline">{isNothing ? 'CLOSE' : 'Fermer'}</span>
            </span>
          </div>

          <div className={`${isNothing ? 'font-ndot tracking-wider' : 'font-mono'} text-[11px] text-zinc-400`}>
            {filteredItems.length} {isNothing ? 'RESULTS' : `résultat${filteredItems.length > 1 ? 's' : ''}`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPaletteModal;
