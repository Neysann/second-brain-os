'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Calendar as CalendarIcon, Plus, ChevronRight, Clock, CheckSquare, CalendarDays } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { WidgetSize } from '@/types/dashboard';

interface DisplayEventItem {
  id: string;
  time: string;
  title: string;
  duration?: string;
  color: string;
  type: 'event' | 'task';
  category?: string;
  source?: string;
}

interface CalendarWidgetProps {
  size?: WidgetSize;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ size = 'medium' }) => {
  const { events, tasks, addEvent } = useData();
  const [activeTab, setActiveTab] = useState<'all' | 'perso' | 'travail' | 'google'>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('11:00');

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);
  const todayDate = today.getDate();
  const todayDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(today).toUpperCase();
  const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(today);

  // Consolider les événements du calendrier et les tâches échues aujourd'hui
  const consolidatedEvents: DisplayEventItem[] = useMemo(() => {
    const list: DisplayEventItem[] = [];

    // 1. Événements du calendrier
    events.forEach((ev) => {
      const isDateMatching = ev.startDate && ev.startDate.startsWith(todayStr);
      let timeStr = 'Tte journée';
      if (ev.startDate && ev.startDate.includes('T')) {
        timeStr = ev.startDate.split('T')[1].substring(0, 5);
      }

      if (isDateMatching) {
        list.push({
          id: ev.id,
          time: timeStr,
          title: ev.title,
          color: ev.color || '#a855f7',
          type: 'event',
          category: ev.category || 'event',
          source: ev.source || 'manual',
        });
      }
    });

    // 2. Tâches pour aujourd'hui
    tasks.forEach((t) => {
      if (t.dueDate === todayStr && t.status !== 'done') {
        list.push({
          id: `task-${t.id}`,
          time: 'Échéance',
          title: t.title,
          color: t.priority === 'urgent' || t.priority === 'high' ? '#f43f5e' : '#6366f1',
          type: 'task',
          category: t.category,
        });
      }
    });

    if (list.length === 0) {
      const upcoming = events
        .filter((ev) => ev.startDate && ev.startDate >= todayStr)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, 5);

      upcoming.forEach((ev) => {
        const datePart = ev.startDate.split('T')[0];
        let timeStr = datePart === todayStr ? 'Auj' : datePart.substring(5);
        if (ev.startDate.includes('T')) {
          timeStr += ` ${ev.startDate.split('T')[1].substring(0, 5)}`;
        }
        list.push({
          id: ev.id,
          time: timeStr,
          title: ev.title,
          color: ev.color || '#a855f7',
          type: 'event',
          category: ev.category || 'event',
          source: ev.source || 'manual',
        });
      });
    }

    return list.sort((a, b) => a.time.localeCompare(b.time));
  }, [events, tasks, todayStr]);

  const filteredEvents = useMemo(() => {
    if (activeTab === 'all') return consolidatedEvents;
    if (activeTab === 'google') {
      return consolidatedEvents.filter((e) => e.source === 'google' || e.source === 'ical');
    }
    if (activeTab === 'perso') {
      return consolidatedEvents.filter(
        (e) => e.category === 'area' || e.category === 'resource' || e.category === 'event'
      );
    }
    if (activeTab === 'travail') {
      return consolidatedEvents.filter((e) => e.category === 'project');
    }
    return consolidatedEvents;
  }, [consolidatedEvents, activeTab]);

  const handleAddEvent = async () => {
    if (!newTitle.trim()) return;

    const startDate = `${todayStr}T${newTime}:00`;
    const color = activeTab === 'perso' ? '#10b981' : activeTab === 'google' ? '#f59e0b' : '#a855f7';
    const category = activeTab === 'travail' ? 'project' : 'event';

    try {
      await addEvent({
        title: newTitle.trim(),
        startDate,
        color,
        category,
        source: activeTab === 'google' ? 'google' : 'manual',
      });
      setNewTitle('');
      setIsAddOpen(false);
    } catch (err) {
      console.error("Erreur lors de l'ajout de l'événement:", err);
    }
  };

  // Mini grille des jours du mois pour format large
  const daysInMonth = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Lundi = 0
    return { totalDays, firstDayIndex };
  }, [today]);

  // =========================================================================
  // 1. AFFICHAGE SMALL (1x1) : Date du Jour & Événement Principal
  // =========================================================================
  if (size === 'small') {
    const nextEvent = filteredEvents[0];
    return (
      <div className="flex flex-col h-full justify-between p-3 select-none">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-purple-500" />
            <span>Aujourd'hui</span>
          </span>
          <Link href="/calendar" className="text-zinc-400 hover:text-purple-400">
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-center gap-3 my-auto">
          <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-purple-500/10 border border-purple-500/20 w-12 h-12 flex-shrink-0">
            <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider">{todayDay}</span>
            <span className="text-lg font-black font-mono leading-none text-zinc-900 dark:text-zinc-100">{todayDate}</span>
          </div>
          <div className="min-w-0 flex-1">
            {nextEvent ? (
              <>
                <span className="text-[10px] font-mono font-semibold text-purple-500 dark:text-purple-400 block truncate">
                  {nextEvent.time}
                </span>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                  {nextEvent.title}
                </h4>
              </>
            ) : (
              <span className="text-xs text-zinc-500 italic block">Aucun événement</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono px-0.5">
          <span>{filteredEvents.length} prévu(s)</span>
          <button
            onClick={() => setIsAddOpen(true)}
            className="text-purple-500 hover:underline font-medium cursor-pointer"
          >
            + Ajouter
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. AFFICHAGE MEDIUM (2x1) : Filtres de Catégories & Agenda du Jour
  // =========================================================================
  if (size === 'medium') {
    return (
      <div className="flex flex-col h-full justify-between p-3.5 select-none space-y-2">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
            <CalendarIcon className="w-4 h-4 text-purple-500" />
            <span>Calendriers & Échéances</span>
          </div>

          <Link
            href="/calendar"
            className="text-[11px] text-zinc-400 hover:text-purple-400 transition-colors flex items-center gap-0.5"
          >
            Planning <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Onglets et bouton add */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {(['all', 'perso', 'travail', 'google'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer capitalize ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {tab === 'all' ? 'Tous' : tab}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setIsAddOpen(!isAddOpen)}
            className="p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer ml-auto"
            title="Ajouter un événement"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Formulaire ajout rapide */}
        {isAddOpen && (
          <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-purple-500/30 flex items-center gap-1.5 animate-in fade-in">
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-1.5 py-0.5 text-xs text-zinc-900 dark:text-zinc-200"
            />
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Titre de l'événement..."
              className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAddEvent}
              className="px-2.5 py-0.5 rounded bg-purple-600 text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              OK
            </button>
          </div>
        )}

        <div className="flex items-start gap-2.5 flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex-shrink-0 w-12">
            <span className="text-[9px] font-bold text-zinc-400 tracking-wider">{todayDay}</span>
            <span className="text-lg font-black text-zinc-900 dark:text-white font-mono leading-none mt-0.5">
              {todayDate}
            </span>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[110px] pr-1 scrollbar-thin">
            {filteredEvents.length === 0 ? (
              <div className="text-zinc-500 text-xs italic py-2">
                Aucun événement prévu aujourd'hui
              </div>
            ) : (
              filteredEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between p-1.5 rounded-xl bg-zinc-50/90 dark:bg-zinc-900/50 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800/60 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate mr-1">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                    <span className="text-[10px] font-mono text-zinc-400">{ev.time}</span>
                    <span className="text-xs text-zinc-800 dark:text-zinc-200 truncate font-semibold">{ev.title}</span>
                  </div>
                  {ev.type === 'task' ? (
                    <CheckSquare className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                  ) : (
                    <Clock className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. AFFICHAGE LARGE & FULL (2x2 ou 4x1) : Calendrier Mensuel + Agenda Latéral
  // =========================================================================
  return (
    <div className="flex flex-col h-full p-4 select-none space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold capitalize">{monthName}</h3>
            <p className="text-[11px] text-zinc-400 font-mono">
              {filteredEvents.length} événement(s) aujourd'hui
            </p>
          </div>
        </div>

        <Link
          href="/calendar"
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
        >
          <span>Ouvrir l'agenda complet</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Grille Mensuelle Miniature */}
        <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-400 mb-2">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs flex-1">
            {Array.from({ length: daysInMonth.firstDayIndex }).map((_, i) => (
              <span key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth.totalDays }).map((_, i) => {
              const dayNum = i + 1;
              const isToday = dayNum === todayDate;
              return (
                <div
                  key={`day-${dayNum}`}
                  className={`flex items-center justify-center rounded-lg text-[11px] font-mono h-6 transition-all ${
                    isToday
                      ? 'bg-purple-600 text-white font-extrabold shadow-sm'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  {dayNum}
                </div>
              );
            })}
          </div>
        </div>

        {/* Liste des Événements Complète */}
        <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <span className="text-xs font-bold text-zinc-400 block mb-2">Agenda & Échéances PARA</span>
          <div className="space-y-1.5 overflow-y-auto max-h-[175px] pr-1 scrollbar-thin flex-1">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-2 rounded-xl bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                  <div>
                    <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{ev.title}</h5>
                    <span className="text-[10px] text-zinc-500 font-mono">{ev.time} • {ev.category || 'Événement'}</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;
