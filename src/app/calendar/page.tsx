'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  FolderGit2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  Filter,
  Layers,
  ArrowUpRight,
  ListFilter,
  Grid,
  RefreshCw,
  MapPin,
  Globe,
  FileText,
  CalendarCheck,
  CheckSquare,
  Trash2,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { Project, Task, ParaCategory, CalendarEvent } from '@/types';
import ProjectModal from '@/components/ProjectModal';
import { EventModal } from '@/components/EventModal';
import { CalendarSyncModal } from '@/components/CalendarSyncModal';

export default function CalendarPage() {
  const { projects, tasks, events, icalFeeds, deleteAllEvents } = useData();
  const { theme } = useTheme();
  const { settings } = useSettings();

  // Mode de vue : 'grid' (grille mensuelle) ou 'agenda' (liste chronologique)
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');

  // Mois courant
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Filtres
  const [categoryFilter, setCategoryFilter] = useState<ParaCategory | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'events' | 'projects' | 'tasks'>('all');

  // Modals
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Prise en charge de action=new depuis la palette universelle
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'new') {
        setEventToEdit(null);
        setIsEventModalOpen(true);
      }
    }
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = useMemo(() => {
    return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate);
  }, [currentDate]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Filtrage des projets
  const filteredProjects = useMemo(() => {
    if (typeFilter === 'events' || typeFilter === 'tasks') return [];
    return projects.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      return true;
    });
  }, [projects, categoryFilter, typeFilter]);

  // Filtrage des événements simples
  const filteredEvents = useMemo(() => {
    if (typeFilter === 'projects' || typeFilter === 'tasks') return [];
    return events.filter((ev) => {
      if (categoryFilter !== 'all' && ev.category && ev.category !== 'event' && ev.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [events, categoryFilter, typeFilter]);

  // Filtrage des tâches
  const filteredTasks = useMemo(() => {
    if (typeFilter === 'projects' || typeFilter === 'events') return [];
    return tasks;
  }, [tasks, typeFilter]);

  // Construction de la grille mensuelle
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek =
      settings.firstDayOfWeek === 'sunday'
        ? firstDayOfMonth.getDay()
        : firstDayOfMonth.getDay() === 0
        ? 6
        : firstDayOfMonth.getDay() - 1;

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: CalendarEvent[];
      projects: Project[];
      tasks: Task[];
    }[] = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Jours du mois précédent
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = prevDate.toISOString().split('T')[0];

      const dayEvents = filteredEvents.filter((e) => {
        const start = e.startDate.split('T')[0];
        const end = (e.endDate || e.startDate).split('T')[0];
        return dateStr >= start && dateStr <= end;
      });
      const projs = filteredProjects.filter((p) => p.deadline && p.deadline.startsWith(dateStr));
      const t = filteredTasks.filter((task) => task.dueDate && task.dueDate.startsWith(dateStr));

      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: dayEvents,
        projects: projs,
        tasks: t,
      });
    }

    // Jours du mois courant
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const d = new Date(year, month, day);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const dayEvents = filteredEvents.filter((e) => {
        const start = e.startDate.split('T')[0];
        const end = (e.endDate || e.startDate).split('T')[0];
        return dateStr >= start && dateStr <= end;
      });
      const projs = filteredProjects.filter((p) => p.deadline && p.deadline.startsWith(dateStr));
      const t = filteredTasks.filter((task) => task.dueDate && task.dueDate.startsWith(dateStr));

      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        events: dayEvents,
        projects: projs,
        tasks: t,
      });
    }

    // Compléter la dernière semaine
    const remaining = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextDate = new Date(year, month + 1, day);
      const dateStr = nextDate.toISOString().split('T')[0];

      const dayEvents = filteredEvents.filter((e) => {
        const start = e.startDate.split('T')[0];
        const end = (e.endDate || e.startDate).split('T')[0];
        return dateStr >= start && dateStr <= end;
      });
      const projs = filteredProjects.filter((p) => p.deadline && p.deadline.startsWith(dateStr));
      const t = filteredTasks.filter((task) => task.dueDate && task.dueDate.startsWith(dateStr));

      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: dayEvents,
        projects: projs,
        tasks: t,
      });
    }

    return days;
  }, [year, month, filteredProjects, filteredEvents, filteredTasks, settings.firstDayOfWeek]);

  // Éléments de la date sélectionnée
  const selectedDateEvents = useMemo(() => {
    return filteredEvents.filter((e) => {
      const start = e.startDate.split('T')[0];
      const end = (e.endDate || e.startDate).split('T')[0];
      return selectedDateStr >= start && selectedDateStr <= end;
    });
  }, [filteredEvents, selectedDateStr]);

  const selectedDateProjects = useMemo(() => {
    return filteredProjects.filter((p) => p.deadline && p.deadline.startsWith(selectedDateStr));
  }, [filteredProjects, selectedDateStr]);

  const selectedDateTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.dueDate && t.dueDate.startsWith(selectedDateStr));
  }, [filteredTasks, selectedDateStr]);

  // Liste unifiée chronologique pour la vue Agenda
  const agendaItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    type UnifiedAgendaItem = {
      id: string;
      title: string;
      dateStr: string;
      timeStr?: string;
      type: 'event' | 'project' | 'task';
      color?: string;
      location?: string;
      source?: string;
      category?: string;
      diffDays: number;
      original: CalendarEvent | Project | Task;
    };

    const items: UnifiedAgendaItem[] = [];

    // 1. Événements
    filteredEvents.forEach((ev) => {
      const dStr = ev.startDate.split('T')[0];
      const timeStr = ev.allDay
        ? 'Journée entière'
        : ev.startDate.includes('T')
        ? ev.startDate.split('T')[1].substring(0, 5)
        : undefined;

      const itemDate = new Date(dStr + 'T00:00:00');
      const diffDays = Math.ceil((itemDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      items.push({
        id: `ev-${ev.id}`,
        title: ev.title,
        dateStr: dStr,
        timeStr,
        type: 'event',
        color: ev.color || '#6366f1',
        location: ev.location,
        source: ev.source,
        category: ev.category,
        diffDays,
        original: ev,
      });
    });

    // 2. Projets avec deadline
    filteredProjects.forEach((proj) => {
      if (!proj.deadline) return;
      const dStr = proj.deadline.split('T')[0];
      const itemDate = new Date(dStr + 'T00:00:00');
      const diffDays = Math.ceil((itemDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      items.push({
        id: `proj-${proj.id}`,
        title: `[Projet] ${proj.title}`,
        dateStr: dStr,
        type: 'project',
        color: proj.color || '#6366f1',
        category: proj.category,
        diffDays,
        original: proj,
      });
    });

    // 3. Tâches avec dueDate
    filteredTasks.forEach((t) => {
      if (!t.dueDate) return;
      const dStr = t.dueDate.split('T')[0];
      const itemDate = new Date(dStr + 'T00:00:00');
      const diffDays = Math.ceil((itemDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      items.push({
        id: `task-${t.id}`,
        title: `[Tâche] ${t.title}`,
        dateStr: dStr,
        type: 'task',
        color: t.status === 'done' ? '#10b981' : '#f59e0b',
        diffDays,
        original: t,
      });
    });

    return items.sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime());
  }, [filteredEvents, filteredProjects, filteredTasks]);

  const weekdays = useMemo(() => {
    return settings.firstDayOfWeek === 'sunday'
      ? ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
      : ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  }, [settings.firstDayOfWeek]);

  const openNewEventOnDate = (dateStr: string) => {
    setEventToEdit(null);
    setSelectedDateStr(dateStr);
    setIsEventModalOpen(true);
  };

  const openEditEvent = (ev: CalendarEvent) => {
    setEventToEdit(ev);
    setIsEventModalOpen(true);
  };

  const openNewProjectOnDate = (dateStr: string) => {
    setProjectToEdit(null);
    setIsProjectModalOpen(true);
  };

  const openEditProject = (p: Project) => {
    setProjectToEdit(p);
    setIsProjectModalOpen(true);
  };

  return (
    <div className="p-3 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Titre */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b transition-colors ${
          theme === 'dark' ? 'border-zinc-800/80' : 'border-zinc-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-1">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Planification, Événements & Synchronisation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Calendrier & Agenda</h1>
          <p className={`text-xs sm:text-sm mt-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Gérez vos événements, échéances de projets et synchronisez vos calendriers Google & Apple (.ics).
          </p>
        </div>

        {/* Boutons d'action rapides */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bascule Grille / Agenda */}
          <div
            className={`flex items-center p-0.5 rounded-xl border text-xs ${
              theme === 'dark' ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-zinc-100'
            }`}
          >
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Mois</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'agenda'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>
          </div>

          {/* Synchronisation iCal / Google */}
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              theme === 'dark'
                ? 'border-zinc-700 bg-zinc-850 hover:bg-zinc-800 text-zinc-200'
                : 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 shadow-xs'
            }`}
            title="Importer ou synchroniser avec Google Agenda et fichiers .ics"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
            <span>Synchroniser</span>
            {icalFeeds.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
            )}
          </button>

          {/* Nouvel Événement */}
          <button
            onClick={() => openNewEventOnDate(selectedDateStr)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Événement</span>
          </button>

          {/* Nouveau Projet */}
          <button
            onClick={() => {
              setProjectToEdit(null);
              setIsProjectModalOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              theme === 'dark'
                ? 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
                : 'border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Projet</span>
          </button>

          {/* Supprimer tous les événements */}
          {events.length > 0 && (
            <button
              onClick={async () => {
                if (
                  confirm(
                    `Êtes-vous sûr de vouloir supprimer TOUS les événements (${events.length} au total) ? Cette action est irréversible.`
                  )
                ) {
                  await deleteAllEvents();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
              title="Supprimer tous les événements du calendrier"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vider ({events.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Barre d'outils : Navigation de Mois & Filtres */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
          theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-xs'
        }`}
      >
        {/* Navigation Mois / Année */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-xl hover:bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Mois précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-xl hover:bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Mois suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-lg font-bold capitalize tracking-tight min-w-[180px]">
            {monthName}
          </h2>

          <button
            onClick={goToToday}
            className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-colors ${
              theme === 'dark'
                ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-750'
                : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            Aujourd'hui
          </button>
        </div>

        {/* Filtres Type & Catégorie */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Afficher :
            </span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium focus:outline-none transition-colors ${
                theme === 'dark'
                  ? 'border-zinc-700 bg-zinc-800 text-zinc-200'
                  : 'border-zinc-300 bg-white text-zinc-800 shadow-xs'
              }`}
            >
              <option value="all">Tout (Événements, Projets, Tâches)</option>
              <option value="events">Événements uniquement</option>
              <option value="projects">Projets uniquement</option>
              <option value="tasks">Tâches uniquement</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ParaCategory | 'all')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium focus:outline-none transition-colors ${
                theme === 'dark'
                  ? 'border-zinc-700 bg-zinc-800 text-zinc-200'
                  : 'border-zinc-300 bg-white text-zinc-800 shadow-xs'
              }`}
            >
              <option value="all">Toutes les catégories</option>
              <option value="project">Projets (P)</option>
              <option value="area">Domaines (A)</option>
              <option value="resource">Ressources (R)</option>
              <option value="archive">Archives (A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Vue Grille Mensuelle */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Grille du calendrier (8 colonnes sur lg) */}
          <div
            className={`lg:col-span-8 p-2 sm:p-4 md:p-6 rounded-2xl border transition-all ${
              theme === 'dark'
                ? 'bg-zinc-900/60 border-zinc-800/80 shadow-md shadow-black/20'
                : 'bg-white border-zinc-200 shadow-xs'
            }`}
          >
            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 text-center text-[10px] sm:text-xs font-bold text-zinc-500 pb-2 sm:pb-3 border-b border-inherit">
              {weekdays.map((wd) => (
                <span key={wd} className="truncate">
                  <span className="md:hidden">{wd.slice(0, 3)}</span>
                  <span className="hidden md:inline">{wd}</span>
                </span>
              ))}
            </div>

            {/* Cases des jours */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-2 sm:pt-3">
              {calendarDays.map((item, idx) => {
                const isSelected = item.dateStr === selectedDateStr;
                const totalItems = item.events.length + item.projects.length + item.tasks.length;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDateStr(item.dateStr)}
                    onDoubleClick={() => openNewEventOnDate(item.dateStr)}
                    className={`min-h-[74px] sm:min-h-[96px] md:min-h-[116px] p-1 sm:p-2 rounded-lg sm:rounded-xl border flex flex-col justify-between cursor-pointer transition-all relative group ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-600/10 ring-2 ring-indigo-500/50'
                        : item.isToday
                        ? theme === 'dark'
                          ? 'border-indigo-500/60 bg-zinc-800/50'
                          : 'border-indigo-400 bg-indigo-50/50'
                        : item.isCurrentMonth
                        ? theme === 'dark'
                          ? 'border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-850/60 hover:border-zinc-700'
                          : 'border-zinc-200 bg-zinc-50/70 hover:bg-zinc-100 hover:border-zinc-300'
                        : theme === 'dark'
                        ? 'border-transparent bg-zinc-950/20 text-zinc-600'
                        : 'border-transparent bg-zinc-100/40 text-zinc-400'
                    }`}
                  >
                    {/* Numéro du jour */}
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-[11px] ${
                          item.isToday
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : isSelected
                            ? 'text-indigo-400 font-bold'
                            : 'text-inherit'
                        }`}
                      >
                        {item.dayNumber}
                      </span>

                      {/* Indicateurs rapides */}
                      <div className="flex items-center gap-1">
                        {item.events.length > 0 && (
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.events[0].color || '#6366f1' }}
                            title={`${item.events.length} événement(s)`}
                          />
                        )}
                        {item.projects.length > 0 && (
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-semibold">
                            {item.projects.length}p
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Liste miniature des événements & projets du jour */}
                    <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                      {/* Événements du jour */}
                      {item.events.slice(0, 2).map((ev) => {
                        const time = ev.allDay
                          ? ''
                          : ev.startDate.includes('T')
                          ? ev.startDate.split('T')[1].substring(0, 5) + ' '
                          : '';

                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditEvent(ev);
                            }}
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold truncate flex items-center gap-1 border shadow-xs hover:opacity-80 transition-opacity"
                            style={{
                              backgroundColor: `${ev.color || '#6366f1'}20`,
                              borderColor: `${ev.color || '#6366f1'}40`,
                              color: ev.color || '#6366f1',
                            }}
                            title={`Événement : ${time}${ev.title}`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: ev.color || '#6366f1' }}
                            />
                            <span className="truncate">{time}{ev.title}</span>
                          </div>
                        );
                      })}

                      {/* Projets */}
                      {item.projects.slice(0, Math.max(0, 2 - item.events.length)).map((p) => (
                        <div
                          key={p.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditProject(p);
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold truncate flex items-center gap-1 border shadow-xs hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: `${p.color || '#6366f1'}20`,
                            borderColor: `${p.color || '#6366f1'}40`,
                            color: p.color || '#6366f1',
                          }}
                          title={`Projet : ${p.title}`}
                        >
                          <FolderGit2 className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{p.title}</span>
                        </div>
                      ))}

                      {totalItems > 2 && (
                        <span className="text-[9px] text-zinc-500 font-medium block">
                          +{totalItems - 2} autre(s)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Volet Détails du jour sélectionné (4 colonnes sur lg) */}
          <div
            className={`lg:col-span-4 p-6 rounded-2xl border space-y-6 transition-all ${
              theme === 'dark'
                ? 'bg-zinc-900/60 border-zinc-800/80 shadow-md shadow-black/20'
                : 'bg-white border-zinc-200 shadow-xs'
            }`}
          >
            <div>
              {/* En-tête date */}
              <div className="flex items-center justify-between pb-3 border-b border-inherit">
                <div>
                  <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">
                    Journée sélectionnée
                  </span>
                  <h3 className="text-lg font-bold capitalize mt-0.5">
                    {new Intl.DateTimeFormat('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }).format(new Date(selectedDateStr + 'T00:00:00'))}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openNewEventOnDate(selectedDateStr)}
                    className="p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
                    title="Ajouter un événement ce jour"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 1. Événements du jour */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Événements ({selectedDateEvents.length})</span>
                  </h4>
                  <button
                    onClick={() => openNewEventOnDate(selectedDateStr)}
                    className="text-[11px] font-medium text-indigo-500 hover:underline"
                  >
                    + Ajouter
                  </button>
                </div>

                {selectedDateEvents.length === 0 ? (
                  <div
                    className={`p-4 rounded-xl border text-center text-xs space-y-2 ${
                      theme === 'dark'
                        ? 'border-zinc-800/80 bg-zinc-950/40 text-zinc-500'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-500'
                    }`}
                  >
                    <p>Aucun événement planifié pour ce jour.</p>
                    <button
                      onClick={() => openNewEventOnDate(selectedDateStr)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                    >
                      + Nouvel événement
                    </button>
                  </div>
                ) : (
                  selectedDateEvents.map((ev) => {
                    const timeRange = ev.allDay
                      ? 'Toute la journée'
                      : ev.startDate.includes('T')
                      ? `${ev.startDate.split('T')[1].substring(0, 5)}${
                          ev.endDate && ev.endDate.includes('T')
                            ? ' - ' + ev.endDate.split('T')[1].substring(0, 5)
                            : ''
                        }`
                      : 'Journée entière';

                    return (
                      <div
                        key={ev.id}
                        onClick={() => openEditEvent(ev)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
                          theme === 'dark'
                            ? 'bg-zinc-950/70 border-zinc-800 hover:border-indigo-500/50'
                            : 'bg-zinc-50 border-zinc-200 hover:border-indigo-400 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: ev.color || '#6366f1' }}
                            />
                            <h5 className="font-bold text-sm truncate">{ev.title}</h5>
                          </div>
                          {ev.source && ev.source !== 'manual' && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 capitalize flex-shrink-0">
                              {ev.source}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-400 mb-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            {timeRange}
                          </span>
                          {ev.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                              <span className="truncate">{ev.location}</span>
                            </span>
                          )}
                        </div>

                        {ev.description && (
                          <p className={`text-xs line-clamp-2 mt-1.5 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            {ev.description}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* 2. Projets de ce jour */}
              <div className="mt-6 space-y-3">
                <h4 className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Projets avec échéance ce jour ({selectedDateProjects.length})</span>
                  </span>
                  <button
                    onClick={() => openNewProjectOnDate(selectedDateStr)}
                    className="text-[11px] font-medium text-indigo-500 hover:underline"
                  >
                    + Ajouter
                  </button>
                </h4>

                {selectedDateProjects.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Aucun projet avec échéance ce jour.</p>
                ) : (
                  selectedDateProjects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => openEditProject(p)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
                        theme === 'dark'
                          ? 'bg-zinc-950/70 border-zinc-800 hover:border-indigo-500/50'
                          : 'bg-zinc-50 border-zinc-200 hover:border-indigo-400 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: p.color || '#6366f1' }}
                          />
                          <h5 className="font-bold text-xs truncate">{p.title}</h5>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 capitalize">
                          {p.category}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 3. Tâches de ce jour */}
              {selectedDateTasks.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tâches à faire ({selectedDateTasks.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {selectedDateTasks.map((t) => (
                      <div
                        key={t.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          theme === 'dark'
                            ? 'bg-zinc-950/40 border-zinc-800/60 text-zinc-300'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                        }`}
                      >
                        <span className="truncate">{t.title}</span>
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          {t.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Vue Agenda / Liste Chronologique */}
      {viewMode === 'agenda' && (
        <div
          className={`p-6 rounded-2xl border transition-all ${
            theme === 'dark'
              ? 'bg-zinc-900/60 border-zinc-800/80 shadow-md shadow-black/20'
              : 'bg-white border-zinc-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-inherit mb-6">
            <div>
              <h3 className="text-base font-bold">Agenda & Échéancier complet</h3>
              <p className="text-xs text-zinc-500">
                Liste ordonnée de tous vos événements, dates clés et objectifs planifiés.
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 font-bold">
              {agendaItems.length} élément(s) planifié(s)
            </span>
          </div>

          {agendaItems.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-sm space-y-2">
              <CalendarIcon className="w-10 h-10 mx-auto text-zinc-700 mb-2 opacity-50" />
              <p>Aucun événement ni échéance dans l'agenda.</p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => openNewEventOnDate(selectedDateStr)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  + Créer un événement
                </button>
                <button
                  onClick={() => setIsSyncModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                >
                  Importer via iCal / Google
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {agendaItems.map((item) => {
                const isLate = item.diffDays < 0;
                const isToday = item.diffDays === 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.type === 'event') {
                        openEditEvent(item.original as CalendarEvent);
                      } else if (item.type === 'project') {
                        openEditProject(item.original as Project);
                      }
                    }}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-all hover:scale-[1.01] ${
                      theme === 'dark'
                        ? 'bg-zinc-950/60 border-zinc-800 hover:border-indigo-500/50'
                        : 'bg-zinc-50 border-zinc-200 hover:border-indigo-400 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start md:items-center gap-3.5 truncate">
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-1 md:mt-0"
                        style={{ backgroundColor: item.color || '#6366f1' }}
                      />
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm md:text-base truncate">{item.title}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold bg-zinc-800 text-zinc-400">
                            {item.type}
                          </span>
                          {item.source && item.source !== 'manual' && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 capitalize">
                              {item.source}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                          {item.timeStr && <span>⏰ {item.timeStr}</span>}
                          {item.location && <span>📍 {item.location}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0 justify-between md:justify-end">
                      <div className="text-right">
                        <span className="text-xs font-semibold block text-zinc-300 dark:text-zinc-200">
                          {new Intl.DateTimeFormat('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          }).format(new Date(item.dateStr + 'T00:00:00'))}
                        </span>
                      </div>

                      <span
                        className={`text-xs font-mono px-3 py-1 rounded-xl font-bold flex-shrink-0 ${
                          isLate
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : isToday
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}
                      >
                        {isLate
                          ? `Il y a ${Math.abs(item.diffDays)} j`
                          : isToday
                          ? "Aujourd'hui"
                          : `Dans ${item.diffDays} j`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEventToEdit(null);
        }}
        eventToEdit={eventToEdit}
        defaultDate={selectedDateStr}
      />

      <CalendarSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        projectToEdit={projectToEdit}
      />
    </div>
  );
}
