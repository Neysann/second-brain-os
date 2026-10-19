'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  FolderGit2,
  Clock,
  ArrowUpRight,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { Project, CalendarEvent } from '@/types';

export const CalendarWidget: React.FC = () => {
  const { projects, tasks, events } = useData();
  const { theme } = useTheme();
  const { settings } = useSettings();

  // Date actuelle pour la navigation
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

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

  // Calcul des jours du mois selon le premier jour de la semaine
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
      projects: Project[];
      events: CalendarEvent[];
    }[] = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Jours du mois précédent pour combler la première semaine
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = prevDate.toISOString().split('T')[0];
      const projs = projects.filter((p) => p.deadline && p.deadline.startsWith(dateStr));
      const evs = (events || []).filter((e) => {
        const s = e.startDate.split('T')[0];
        const end = (e.endDate || e.startDate).split('T')[0];
        return dateStr >= s && dateStr <= end;
      });
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        projects: projs,
        events: evs,
      });
    }

    // Jours du mois courant
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const d = new Date(year, month, day);
      // Format YYYY-MM-DD avec padding
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const projs = projects.filter((p) => p.deadline && p.deadline.startsWith(dateStr));
      const evs = (events || []).filter((e) => {
        const s = e.startDate.split('T')[0];
        const end = (e.endDate || e.startDate).split('T')[0];
        return dateStr >= s && dateStr <= end;
      });

      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        projects: projs,
        events: evs,
      });
    }

    // Compléter la dernière semaine
    const remaining = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextDate = new Date(year, month + 1, day);
      const dateStr = nextDate.toISOString().split('T')[0];
      const projs = projects.filter((p) => p.deadline && p.deadline.startsWith(dateStr));
      const evs = (events || []).filter((e) => {
        const s = e.startDate.split('T')[0];
        const end = (e.endDate || e.startDate).split('T')[0];
        return dateStr >= s && dateStr <= end;
      });
      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        projects: projs,
        events: evs,
      });
    }

    return days;
  }, [year, month, projects, events, settings.firstDayOfWeek]);

  // Événements pour la date sélectionnée
  const selectedDateEvents = useMemo(() => {
    return (events || []).filter((e) => {
      const s = e.startDate.split('T')[0];
      const end = (e.endDate || e.startDate).split('T')[0];
      return selectedDateStr >= s && selectedDateStr <= end;
    });
  }, [events, selectedDateStr]);

  // Projets avec échéance pour la date sélectionnée
  const selectedDateProjects = useMemo(() => {
    return projects.filter((p) => p.deadline && p.deadline.startsWith(selectedDateStr));
  }, [projects, selectedDateStr]);

  // Tâches prévues pour la date sélectionnée
  const selectedDateTasks = useMemo(() => {
    return tasks.filter((t) => t.dueDate && t.dueDate.startsWith(selectedDateStr));
  }, [tasks, selectedDateStr]);

  // Prochaines échéances de projets globales
  const upcomingProjects = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return projects
      .filter((p) => Boolean(p.deadline))
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 4)
      .map((proj) => {
        const d = new Date(proj.deadline!);
        d.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...proj,
          diffDays,
        };
      });
  }, [projects]);

  const weekdays = useMemo(() => {
    return settings.firstDayOfWeek === 'sunday'
      ? ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
      : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  }, [settings.firstDayOfWeek]);

  const isNothing = settings.uiStyle === 'nothing';

  return (
    <div
      className={`p-6 rounded-2xl border transition-all duration-300 ${
        isNothing
          ? 'bg-black border-white/10 text-white shadow-none font-ntype'
          : theme === 'dark'
          ? 'bg-zinc-900/80 border-zinc-800/80 text-zinc-100 shadow-md shadow-black/20'
          : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'
      }`}
    >
      {/* Header du Widget */}
      <div className="flex items-center justify-between pb-4 border-b border-inherit mb-4">
        <div className="flex items-center gap-2">
          {isNothing ? (
            <span className="nothing-red-dot" />
          ) : (
            <CalendarIcon
              className="w-5 h-5 text-indigo-500 dark:text-indigo-400"
            />
          )}
          <h2 className={`text-base font-bold ${isNothing ? 'font-ndot tracking-widest uppercase text-white' : ''}`}>
            {isNothing ? 'CALENDAR // PROJECTS' : 'Calendrier des Projets'}
          </h2>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full ${
              isNothing
                ? 'bg-zinc-950 text-zinc-400 border border-white/10 font-ndot tracking-wider'
                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-semibold'
            }`}
          >
            {projects.filter((p) => p.deadline).length} {isNothing ? 'DEADLINES' : 'échéances'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors cursor-pointer ${
              isNothing
                ? 'border-white/10 bg-zinc-950 text-zinc-300 hover:text-white hover:border-white/30 font-ndot uppercase text-[10px]'
                : theme === 'dark'
                ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
                : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200'
            }`}
          >
            {isNothing ? 'TODAY' : "Aujourd'hui"}
          </button>
          <Link
            href="/calendar"
            className={`text-xs font-semibold flex items-center gap-1 ${
              isNothing
                ? 'text-zinc-400 hover:text-white font-ndot uppercase tracking-wider text-[10px]'
                : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-500'
            }`}
          >
            {isNothing ? 'FULL VIEW' : 'Vue complète'}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Grille Mensuelle (7 colonnes sur lg) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Navigation du mois */}
          <div className="flex items-center justify-between">
            <h3
              className={`${
                isNothing
                  ? 'text-sm font-ndot uppercase tracking-widest text-white'
                  : 'text-sm font-semibold capitalize tracking-tight text-zinc-300 dark:text-zinc-200'
              }`}
            >
              {monthName}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={goToPreviousMonth}
                className={`p-1 rounded-lg transition-colors ${
                  isNothing
                    ? 'hover:bg-zinc-900 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800'
                    : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
                title="Mois précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToNextMonth}
                className={`p-1 rounded-lg transition-colors ${
                  isNothing
                    ? 'hover:bg-zinc-900 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800'
                    : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
                title="Mois suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Jours de la semaine */}
          <div
            className={`grid grid-cols-7 text-center py-1 border-b border-inherit ${
              isNothing ? 'text-[10px] font-mono text-zinc-400' : 'text-[11px] font-semibold text-zinc-500'
            }`}
          >
            {weekdays.map((wd) => (
              <span key={wd}>{wd}</span>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, idx) => {
              const isSelected = item.dateStr === selectedDateStr;
              const hasProjects = item.projects.length > 0;
              const hasEvents = item.events.length > 0;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDateStr(item.dateStr)}
                  className={`min-h-[42px] p-1 rounded-xl flex flex-col items-center justify-between text-xs transition-all relative group
                    ${
                      isSelected
                        ? isNothing
                          ? 'bg-white text-black font-bold ring-1 ring-white shadow-none'
                          : 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/50'
                        : item.isToday
                        ? isNothing
                          ? 'bg-zinc-900 border border-[#D71920] text-white font-bold'
                          : theme === 'dark'
                          ? 'bg-zinc-800 border border-indigo-500/50 text-indigo-400 font-bold'
                          : 'bg-indigo-50 border border-indigo-400 text-indigo-700 font-bold'
                        : item.isCurrentMonth
                        ? isNothing
                          ? 'hover:bg-zinc-900 text-zinc-200'
                          : theme === 'dark'
                          ? 'hover:bg-zinc-800/60 text-zinc-300'
                          : 'hover:bg-zinc-100 text-zinc-800'
                        : isNothing
                        ? 'text-zinc-700 hover:bg-zinc-950/40'
                        : theme === 'dark'
                        ? 'text-zinc-600 hover:bg-zinc-850/30'
                        : 'text-zinc-400 hover:bg-zinc-100/50'
                    }`}
                >
                  <span className={`${isNothing ? 'font-ndot text-xs tracking-wider' : 'text-[11px]'}`}>
                    {item.dayNumber}
                  </span>
                  {isNothing && item.isToday && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] absolute top-1 right-1" />
                  )}

                  {/* Puces de couleur pour les événements et projets de ce jour */}
                  {(hasEvents || hasProjects) && (
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap justify-center">
                      {item.events.slice(0, 2).map((ev) => (
                        <span
                          key={ev.id}
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: isSelected ? '#ffffff' : ev.color || '#3b82f6',
                          }}
                          title={`Événement : ${ev.title}`}
                        />
                      ))}
                      {item.projects.slice(0, Math.max(0, 3 - item.events.length)).map((p) => (
                        <span
                          key={p.id}
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: isSelected ? '#ffffff' : p.color || '#6366f1',
                          }}
                          title={`Projet : ${p.title}`}
                        />
                      ))}
                      {(item.events.length + item.projects.length) > 3 && (
                        <span className="text-[8px] font-mono leading-none font-bold">
                          +{(item.events.length + item.projects.length) - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Détail de la date sélectionnée & Prochaines échéances (5 colonnes sur lg) */}
        <div className="lg:col-span-5 space-y-4 lg:border-l lg:pl-6 border-inherit">
          {/* Détail du jour sélectionné */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Planning du {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                {selectedDateEvents.length + selectedDateProjects.length} élément(s)
              </span>
            </div>

            {selectedDateEvents.length === 0 && selectedDateProjects.length === 0 && selectedDateTasks.length === 0 ? (
              <div
                className={`p-4 rounded-xl border text-center text-xs space-y-1 ${
                  theme === 'dark'
                    ? 'border-zinc-800/80 bg-zinc-950/40 text-zinc-500'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-500'
                }`}
              >
                <p>Aucun événement ou projet prévu pour ce jour.</p>
                <Link
                  href="/calendar"
                  className="text-indigo-400 hover:underline font-medium inline-block mt-1"
                >
                  Ouvrir le calendrier complet →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Événements simples */}
                {selectedDateEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      isNothing
                        ? 'bg-[#0b0b0d] border-zinc-800/90'
                        : theme === 'dark'
                        ? 'bg-zinc-950/60 border-zinc-800'
                        : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: isNothing ? '#ffffff' : (ev.color || '#3b82f6') }}
                      />
                      <div className="truncate">
                        <span className="font-semibold truncate block text-zinc-200 dark:text-zinc-100">
                          {ev.title}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {ev.allDay ? 'Journée entière' : ev.startDate.includes('T') ? ev.startDate.split('T')[1].substring(0, 5) : ''}
                          {ev.location ? ` • ${ev.location}` : ''}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        isNothing
                          ? 'bg-zinc-900 text-zinc-300 border border-zinc-800 uppercase text-[9px]'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      Événement
                    </span>
                  </div>
                ))}

                {/* Projets */}
                {selectedDateProjects.map((p) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      isNothing
                        ? 'bg-[#0b0b0d] border-zinc-800/90'
                        : theme === 'dark'
                        ? 'bg-zinc-950/60 border-zinc-800'
                        : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: isNothing ? '#D71920' : (p.color || '#6366f1') }}
                      />
                      <div className="truncate">
                        <span className="font-semibold truncate block text-zinc-200 dark:text-zinc-100">
                          {p.title}
                        </span>
                        <span className="text-[10px] text-zinc-500 capitalize">{p.category}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        isNothing
                          ? 'bg-zinc-900 text-zinc-300 border border-zinc-800 uppercase text-[9px]'
                          : 'bg-indigo-500/20 text-indigo-400'
                      }`}
                    >
                      Échéance
                    </span>
                  </div>
                ))}

                {/* Tâches */}
                {selectedDateTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      isNothing
                        ? 'bg-[#0b0b0d] border-zinc-800/80 text-zinc-300'
                        : theme === 'dark'
                        ? 'bg-zinc-950/40 border-zinc-800/60 text-zinc-400'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                    }`}
                  >
                    <span className="truncate">Tâche : {t.title}</span>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/50">
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prochaines échéances globales */}
          <div className="pt-2 border-t border-inherit">
            <h4 className="text-xs font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
              <Clock
                className={`w-3.5 h-3.5 ${isNothing ? 'text-[#D71920]' : 'text-amber-500'}`}
              />
              <span className={isNothing ? 'font-mono uppercase tracking-wider text-[11px]' : ''}>
                Prochaines livraisons de projets
              </span>
            </h4>

            {upcomingProjects.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">Aucune date limite définie sur vos projets.</p>
            ) : (
              <div className="space-y-2">
                {upcomingProjects.map((p) => {
                  const isLate = p.diffDays < 0;
                  const isToday = p.diffDays === 0;

                  return (
                    <div
                      key={p.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        isNothing
                          ? 'bg-[#0b0b0d] border-zinc-800/80 hover:border-zinc-700'
                          : theme === 'dark'
                          ? 'bg-zinc-950/30 border-zinc-800/70 hover:border-zinc-700'
                          : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: isNothing ? '#D71920' : (p.color || '#6366f1') }}
                        />
                        <span className="font-medium truncate text-zinc-300 dark:text-zinc-200">
                          {p.title}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold flex-shrink-0 ${
                          isLate
                            ? isNothing
                              ? 'bg-[#D71920]/20 text-[#D71920] border border-[#D71920]/40'
                              : 'bg-rose-500/20 text-rose-400'
                            : isToday
                            ? isNothing
                              ? 'bg-white/10 text-white border border-white/30'
                              : 'bg-amber-500/20 text-amber-400'
                            : isNothing
                            ? 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {isLate
                          ? `En retard (${Math.abs(p.diffDays)}j)`
                          : isToday
                          ? "Aujourd'hui"
                          : `Dans ${p.diffDays}j`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;
