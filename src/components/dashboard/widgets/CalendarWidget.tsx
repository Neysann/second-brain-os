'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Calendar as CalendarIcon, Plus, ChevronRight, Clock, CheckSquare } from 'lucide-react';
import { useData } from '@/context/DataContext';

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

export const CalendarWidget: React.FC = () => {
  const { events, tasks, addEvent } = useData();
  const [activeTab, setActiveTab] = useState<'all' | 'perso' | 'travail' | 'google'>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('11:00');

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);
  const todayDate = today.getDate();
  const todayDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(today).toUpperCase();

  // Consolider les événements du calendrier et les tâches échues aujourd'hui
  const consolidatedEvents: DisplayEventItem[] = useMemo(() => {
    const list: DisplayEventItem[] = [];

    // 1. Événements du calendrier
    events.forEach((ev) => {
      const isDateMatching = ev.startDate && ev.startDate.startsWith(todayStr);
      // Extraire l'heure si présente (ex: 2026-10-10T14:30)
      let timeStr = 'Tte journée';
      if (ev.startDate && ev.startDate.includes('T')) {
        timeStr = ev.startDate.split('T')[1].substring(0, 5);
      }

      // Si c'est aujourd'hui ou dans les 3 prochains jours si aucun aujourd'hui
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

    // Si aucun événement aujourd'hui, récupérer les 3 prochains événements à venir
    if (list.length === 0) {
      const upcoming = events
        .filter((ev) => ev.startDate && ev.startDate >= todayStr)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, 3);

      upcoming.forEach((ev) => {
        const datePart = ev.startDate.split('T')[0];
        let timeStr = datePart === todayStr ? "Auj" : datePart.substring(5);
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

  // Filtrage par onglet
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

  return (
    <div className="flex flex-col h-full justify-between p-3 select-none">
      {/* En-tête : Titre & Onglets */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
          <CalendarIcon className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
          <span>Calendriers</span>
        </div>

        <Link
          href="/calendar"
          className="text-[10px] text-zinc-500 hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-400 transition-colors flex items-center gap-0.5"
          title="Ouvrir le calendrier complet"
        >
          Ouvrir <ChevronRight className="w-2.5 h-2.5" />
        </Link>
      </div>

      {/* Onglets de filtrage */}
      <div className="flex items-center gap-1 mb-2 overflow-x-auto scrollbar-none">
        {(['all', 'perso', 'travail', 'google'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer capitalize ${
              activeTab === tab
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {tab === 'all' ? 'Tous' : tab}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setIsAddOpen(!isAddOpen)}
          className="p-1 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer ml-auto"
          title="Ajouter un événement"
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Formulaire d'ajout rapide inline */}
      {isAddOpen && (
        <div className="mb-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 animate-in fade-in duration-150">
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-1 text-[10px] text-zinc-800 dark:text-zinc-300"
          />
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Titre de l'événement..."
            className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-1.5 py-0.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400"
          />
          <button
            type="button"
            onClick={handleAddEvent}
            className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-semibold cursor-pointer shadow-xs"
          >
            OK
          </button>
        </div>
      )}

      {/* Contenu : Badge Date & Liste d'Événements */}
      <div className="flex items-start gap-2 flex-1 overflow-hidden">
        {/* Badge Date du jour */}
        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex-shrink-0 w-11">
          <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider">
            {todayDay}
          </span>
          <span className="text-base font-extrabold text-zinc-900 dark:text-white font-mono leading-none mt-0.5">
            {todayDate}
          </span>
        </div>

        {/* Liste des Événements */}
        <div className="flex-1 space-y-1 overflow-y-auto max-h-[110px] pr-0.5 scrollbar-thin">
          {filteredEvents.length === 0 ? (
            <div className="text-zinc-500 dark:text-zinc-400 text-[11px] italic py-2 flex flex-col gap-1">
              <span>Aucun événement aujourd'hui</span>
              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="text-purple-600 dark:text-purple-400 font-semibold text-[10px] text-left hover:underline"
              >
                + En programmer un
              </button>
            </div>
          ) : (
            filteredEvents.map((ev) => (
              <Link
                key={ev.id}
                href="/calendar"
                className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-50/90 dark:bg-zinc-900/50 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/60 border border-zinc-200/90 dark:border-zinc-800/60 transition-colors group"
              >
                <div className="flex items-center gap-2 truncate mr-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ev.color }}
                  />
                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                    {ev.time}
                  </span>
                  <span className="text-xs text-zinc-800 dark:text-zinc-200 truncate font-medium group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {ev.title}
                  </span>
                </div>
                {ev.type === 'task' ? (
                  <CheckSquare className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;
