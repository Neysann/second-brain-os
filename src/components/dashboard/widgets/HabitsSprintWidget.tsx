'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, Zap, RotateCcw } from 'lucide-react';
import { useDailyLife } from '@/context/DailyLifeContext';

export const HabitsSprintWidget: React.FC = () => {
  const { habits, activeCycle, toggleHabitDay } = useDailyLife();

  // Jour actuel calculé dynamiquement par rapport à la date de début du sprint
  const currentDayIndex = useMemo(() => {
    if (!activeCycle) return 1;
    const start = new Date(activeCycle.startDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(10, Math.max(1, diffDays));
  }, [activeCycle]);

  const activeHabits = useMemo(() => {
    if (!activeCycle) return habits.slice(0, 4);
    return habits.filter((h) => activeCycle.habitIds.includes(h.id));
  }, [habits, activeCycle]);

  // Compter combien d'habitudes sont faites aujourd'hui
  const checkedTodayCount = useMemo(() => {
    if (!activeCycle) return 0;
    return activeHabits.filter((h) => activeCycle.completions[h.id]?.[currentDayIndex] === true).length;
  }, [activeCycle, activeHabits, currentDayIndex]);

  const percent = activeHabits.length > 0
    ? Math.round((checkedTodayCount / activeHabits.length) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full justify-between p-3 select-none">
      {/* En-tête */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5 truncate">
          <Zap className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span className="truncate text-zinc-800 dark:text-zinc-200">
            Sprint 10 Jours {activeCycle ? `(J${currentDayIndex})` : ''}
          </span>
        </span>
        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">
          {checkedTodayCount}/{activeHabits.length}
        </span>
      </div>

      {/* Barre de progression aujourd'hui */}
      <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden my-1">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Liste des habitudes du jour ou État sans cycle */}
      {!activeCycle ? (
        <div className="my-auto text-center p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
          <p className="text-zinc-700 dark:text-zinc-300 text-[11px] mb-1.5">
            Aucun sprint de 10 jours en cours.
          </p>
          <Link
            href="/habits"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold shadow-xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Démarrer un sprint</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-1.5 my-auto overflow-y-auto max-h-[140px] scrollbar-thin pr-1">
          {activeHabits.slice(0, 4).map((habit) => {
            const isDone = !!activeCycle.completions[habit.id]?.[currentDayIndex];

            return (
              <div
                key={habit.id}
                onClick={() => {
                  toggleHabitDay(activeCycle.id, habit.id, currentDayIndex);
                }}
                className={`flex items-center justify-between p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  isDone
                    ? 'bg-purple-500/15 border-purple-500/30 text-purple-900 dark:text-purple-200'
                    : 'bg-zinc-50/90 dark:bg-zinc-950/40 border-zinc-200/90 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
                title={`Cliquer pour ${isDone ? 'décocher' : 'valider'} pour le Jour ${currentDayIndex}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-sm">{habit.icon}</span>
                  <span className={`text-[11px] font-medium truncate ${isDone ? 'line-through opacity-75' : ''}`}>
                    {habit.name}
                  </span>
                </div>
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isDone
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'border-zinc-300 dark:border-zinc-700 hover:border-purple-400'
                  }`}
                >
                  {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pied : Lien Sprint complet */}
      <div className="text-center pt-1 border-t border-zinc-200 dark:border-zinc-800/80">
        <Link
          href="/habits"
          className="text-[10px] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium flex items-center justify-center gap-0.5 transition-colors"
        >
          <span>Tableau du sprint</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};

export default HabitsSprintWidget;
