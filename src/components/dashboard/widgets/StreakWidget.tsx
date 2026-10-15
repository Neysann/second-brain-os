'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Flame, Check, ChevronRight } from 'lucide-react';
import { useDailyLife } from '@/context/DailyLifeContext';
import { WidgetSize } from '@/types/dashboard';

interface StreakWidgetProps {
  size?: WidgetSize;
}

export const StreakWidget: React.FC<StreakWidgetProps> = ({ size = 'small' }) => {
  const { habits, habitHistory, toggleHabitDate, getHabitStats, currentStreak } = useDailyLife();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Génération des derniers jours pour l'affichage miniature
  const daysList = useMemo(() => {
    const list: string[] = [];
    const today = new Date();
    const count = size === 'small' ? 12 : 21;
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      list.push(d.toISOString().split('T')[0]);
    }
    return list;
  }, [size]);

  // Afficher jusqu'à 3 habitudes en small, et 4 en medium/large
  const displayedHabits = habits.slice(0, size === 'small' ? 3 : 4);

  return (
    <div className="flex flex-col h-full justify-between p-3 select-none">
      {/* En-tête officiel style Habitudes */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800/80 pb-1.5">
        <span className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
          <span className="font-extrabold text-zinc-900 dark:text-white flex items-center gap-1">
            Habitudes
            <span className="w-3.5 h-3.5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[8px] font-black">
              ✓
            </span>
          </span>
        </span>
        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold font-mono flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
          <Flame className="w-3 h-3 text-amber-500" />
          <span>{currentStreak}j</span>
        </span>
      </div>

      {/* Contenu : Lignes d'habitudes avec cases de heatmap individuelles */}
      <div className="space-y-2 my-auto py-1">
        {displayedHabits.map((habit) => {
          const stats = getHabitStats(habit.id);
          const habitMap = habitHistory[habit.id] || {};
          const isTodayDone = !!habitMap[todayStr];

          return (
            <div key={habit.id} className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleHabitDate(habit.id, todayStr)}
                    className="w-4 h-4 rounded-full flex items-center justify-center border transition-all cursor-pointer shrink-0"
                    style={{
                      backgroundColor: isTodayDone ? habit.color : 'transparent',
                      borderColor: habit.color,
                    }}
                    title={isTodayDone ? "Décocher aujourd'hui" : "Cocher aujourd'hui"}
                  >
                    <Check
                      className={`w-2.5 h-2.5 stroke-[3] ${
                        isTodayDone ? 'text-white' : 'text-transparent'
                      }`}
                    />
                  </button>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate">
                    {habit.name} {habit.icon}
                  </span>
                </div>
                <span className="font-mono text-zinc-500 dark:text-zinc-400 font-semibold">{stats.percent}%</span>
              </div>

              {/* Barre de points heatmap individuels */}
              <div className="flex items-center gap-1 pl-5">
                {daysList.map((dStr) => {
                  const isDone = !!habitMap[dStr];
                  const isToday = dStr === todayStr;
                  return (
                    <button
                      key={dStr}
                      type="button"
                      onClick={() => toggleHabitDate(habit.id, dStr)}
                      className={`w-2 h-2 rounded-[2px] transition-all cursor-pointer ${
                        isToday ? 'ring-1 ring-purple-500 dark:ring-white/70' : ''
                      }`}
                      style={{
                        backgroundColor: isDone ? habit.color : 'rgba(150, 150, 160, 0.2)',
                        boxShadow: isDone ? `0 0 4px ${habit.color}44` : 'none',
                      }}
                      title={`${dStr} : ${isDone ? 'Validé' : 'Non fait'}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pied : Lien direct */}
      <div className="text-center pt-1 border-t border-zinc-200 dark:border-zinc-800/80">
        <Link
          href="/habits"
          className="text-[10px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white font-medium flex items-center justify-center gap-0.5 transition-colors"
        >
          <span>Voir tous les rituels</span>
          <ChevronRight className="w-3 h-3 text-purple-500 dark:text-purple-400" />
        </Link>
      </div>
    </div>
  );
};

export default StreakWidget;
