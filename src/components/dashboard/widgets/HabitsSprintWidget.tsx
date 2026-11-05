'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, Zap, RotateCcw, Award } from 'lucide-react';
import { useDailyLife } from '@/context/DailyLifeContext';
import { WidgetSize } from '@/types/dashboard';

interface HabitsSprintWidgetProps {
  size?: WidgetSize;
}

export const HabitsSprintWidget: React.FC<HabitsSprintWidgetProps> = ({ size = 'small' }) => {
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

  const percentToday =
    activeHabits.length > 0 ? Math.round((checkedTodayCount / activeHabits.length) * 100) : 0;

  // Calcul du taux global de complétion du sprint sur les 10 jours
  const sprintStats = useMemo(() => {
    if (!activeCycle || activeHabits.length === 0) return { totalChecks: 0, maxPossible: 0, percent: 0 };
    let totalChecks = 0;
    activeHabits.forEach((h) => {
      const map = activeCycle.completions[h.id] || {};
      for (let d = 1; d <= 10; d++) {
        if (map[d]) totalChecks++;
      }
    });
    const maxPossible = activeHabits.length * 10;
    const percent = Math.round((totalChecks / maxPossible) * 100);
    return { totalChecks, maxPossible, percent };
  }, [activeCycle, activeHabits]);

  // ==========================================
  // VUE 1 : FORMAT SMALL (1x1) - TOP 2 HABITS EXPRESS
  // ==========================================
  if (size === 'small') {
    return (
      <div className="flex flex-col h-full justify-between p-3 select-none">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5 truncate">
            <Zap className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span className="truncate">Sprint J{currentDayIndex}</span>
          </span>
          <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
            {checkedTodayCount}/{activeHabits.length}
          </span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden my-1">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${percentToday}%` }}
          />
        </div>

        {activeHabits.length === 0 || !activeCycle ? (
          <div className="my-auto text-center text-xs text-zinc-500">
            <p className="text-[10px] mb-1">Aucun sprint actif</p>
            <Link href="/habits" className="text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold underline">
              Démarrer
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5 my-auto">
            {activeHabits.slice(0, 2).map((habit) => {
              const isDone = !!activeCycle.completions[habit.id]?.[currentDayIndex];
              return (
                <div
                  key={habit.id}
                  onClick={() => toggleHabitDay(activeCycle.id, habit.id, currentDayIndex)}
                  className={`flex items-center justify-between p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isDone
                      ? 'bg-purple-500/15 border-purple-500/30 text-purple-900 dark:text-purple-200'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span>{habit.icon}</span>
                    <span className={`text-[10px] font-medium truncate ${isDone ? 'line-through opacity-75' : ''}`}>
                      {habit.name}
                    </span>
                  </div>
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                      isDone ? 'bg-purple-600 border-purple-500 text-white' : 'border-zinc-300 dark:border-zinc-600'
                    }`}
                  >
                    {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center pt-0.5">
          <Link
            href="/habits"
            className="text-[9px] text-zinc-400 hover:text-indigo-500 transition-colors inline-flex items-center gap-0.5"
          >
            <span>Détails du sprint</span>
            <ChevronRight className="w-2.5 h-2.5" />
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // VUE 2 : FORMAT LARGE / FULL (2x2 ou 4x1) - FULL 10-DAY MATRIX SPRINT
  // ==========================================
  if (size === 'large' || size === 'full') {
    return (
      <div className="flex flex-col h-full justify-between p-3.5 select-none gap-3">
        {/* En-tête large */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <span>Matrice Complète du Sprint 10 Jours</span>
                {activeCycle && (
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold">
                    Jour {currentDayIndex} / 10
                  </span>
                )}
              </div>
              <div className="text-[10px] text-zinc-400">
                Performance globale : {sprintStats.percent}% ({sprintStats.totalChecks} / {sprintStats.maxPossible} checks)
              </div>
            </div>
          </div>

          <Link
            href="/habits"
            className="text-[10px] font-medium px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1"
          >
            <span>Gérer les habitudes</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Matrice des 10 jours */}
        {!activeCycle ? (
          <div className="my-auto text-center p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-xs text-zinc-700 dark:text-zinc-300 mb-2 font-medium">
              Aucun sprint de 10 jours n&apos;est actuellement en cours.
            </p>
            <Link
              href="/habits"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Démarrer un nouveau cycle 10 jours</span>
            </Link>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[220px] scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 font-mono">
                  <th className="py-1 px-2 font-semibold">Habitude</th>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
                    <th
                      key={d}
                      className={`py-1 px-1 text-center font-bold ${
                        d === currentDayIndex
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 rounded-t'
                          : ''
                      }`}
                    >
                      J{d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {activeHabits.map((habit) => (
                  <tr key={habit.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="py-1.5 px-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[130px]">
                      <span className="mr-1.5">{habit.icon}</span>
                      <span>{habit.name}</span>
                    </td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => {
                      const isDone = !!activeCycle.completions[habit.id]?.[d];
                      const isToday = d === currentDayIndex;
                      return (
                        <td
                          key={d}
                          className={`py-1 px-1 text-center ${
                            isToday ? 'bg-indigo-500/5' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleHabitDay(activeCycle.id, habit.id, d)}
                            className={`w-5 h-5 mx-auto rounded border flex items-center justify-center transition-all cursor-pointer ${
                              isDone
                                ? 'bg-purple-600 border-purple-500 text-white shadow-xs'
                                : isToday
                                ? 'border-indigo-400 dark:border-indigo-500 bg-white dark:bg-zinc-900'
                                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                            }`}
                            title={`Jour ${d} : ${isDone ? 'Validé' : 'Non fait'} (cliquer pour basculer)`}
                          >
                            {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VUE 3 : FORMAT MEDIUM (2x1) - CHECKLIST STANDARD
  // ==========================================
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
          style={{ width: `${percentToday}%` }}
        />
      </div>

      {/* Liste des habitudes du jour */}
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
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    isDone
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                  }`}
                >
                  {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bas : Lien vers la page Habitudes */}
      <div className="text-right pt-1">
        <Link
          href="/habits"
          className="text-[10px] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors font-medium inline-flex items-center gap-0.5"
        >
          <span>Gérer mes rituels</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};

export default HabitsSprintWidget;
