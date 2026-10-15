'use client';

import React, { useState, useMemo } from 'react';
import { Check, CheckCircle2, Sparkles, Plus, Calendar, Flame, ChevronRight } from 'lucide-react';
import { useDailyLife } from '@/context/DailyLifeContext';
import { Habit } from '@/types/dailyLife';

interface HelloHabitStreaksViewProps {
  onAddHabitClick?: () => void;
  compact?: boolean;
}

export const HelloHabitStreaksView: React.FC<HelloHabitStreaksViewProps> = ({
  onAddHabitClick,
  compact = false,
}) => {
  const { habits, habitHistory, toggleHabitDate, getHabitStats } = useDailyLife();
  const [hoveredCell, setHoveredCell] = useState<{
    habitName: string;
    dateStr: string;
    completed: boolean;
  } | null>(null);

  // Génération des 28 dernières semaines (196 jours) pour un aperçu riche
  // Chaque colonne représente une semaine (7 jours du Lundi au Dimanche)
  const weeksData = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = (today.getDay() + 6) % 7; // 0 = Lundi, 6 = Dimanche

    const totalWeeks = compact ? 16 : 28;
    const columns: { weekIndex: number; days: { dateStr: string; dayIndex: number; isToday: boolean }[] }[] = [];

    // Remonter pour commencer un Lundi
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - currentDayOfWeek - (totalWeeks - 1) * 7);

    for (let w = 0; w < totalWeeks; w++) {
      const weekDays: { dateStr: string; dayIndex: number; isToday: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const cur = new Date(startDate);
        cur.setDate(startDate.getDate() + w * 7 + d);
        const dateStr = cur.toISOString().split('T')[0];
        const isToday = dateStr === today.toISOString().split('T')[0];
        weekDays.push({
          dateStr,
          dayIndex: d,
          isToday,
        });
      }
      columns.push({ weekIndex: w, days: weekDays });
    }

    return columns;
  }, [compact]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  return (
    <div className="w-full bg-[#0e0e11] text-zinc-100 rounded-2xl border border-zinc-800/80 p-3.5 sm:p-5 shadow-xl select-none space-y-4">
      {/* 1. En-tête officiel des Streaks */}
      <div className="text-center space-y-0.5">
        <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] font-semibold text-zinc-300 shadow-xs">
          <span className="font-extrabold tracking-tight text-white flex items-center gap-1">
            Habitudes
            <span className="w-3.5 h-3.5 rounded-full bg-purple-500 text-white flex items-center justify-center text-[9px] font-black">
              ✓
            </span>
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">Syntropy Streaks</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          2026 In-Review
        </h2>
        <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
          Matrice d'activité et régularité annuelle par habitude. Cliquez sur une case pour valider un jour.
        </p>
      </div>

      {/* 2. Liste compacte des Habitudes avec Matrice Individuelle */}
      <div className="space-y-2.5">
        {habits.map((habit) => {
          const stats = getHabitStats(habit.id);
          const habitMap = habitHistory[habit.id] || {};
          const isTodayDone = !!habitMap[todayStr];

          return (
            <div
              key={habit.id}
              className="p-2.5 sm:p-3 rounded-xl bg-[#141418] border border-zinc-800/70 hover:border-zinc-700/80 transition-all space-y-1.5 group"
            >
              {/* Ligne 1 : Checkbox coloré + Titre & Objectif + Pourcentage */}
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Bouton Checkbox circulaire stylisé */}
                  <button
                    type="button"
                    onClick={() => toggleHabitDate(habit.id, todayStr)}
                    className="w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0 border"
                    style={{
                      backgroundColor: isTodayDone ? habit.color : 'transparent',
                      borderColor: habit.color,
                    }}
                    title={isTodayDone ? "Décocher aujourd'hui" : "Cocher aujourd'hui"}
                  >
                    <Check
                      className={`w-3 h-3 stroke-[3] transition-transform ${
                        isTodayDone ? 'text-white scale-100' : 'text-transparent scale-75'
                      }`}
                    />
                  </button>

                  {/* Titre et description d'objectif */}
                  <div className="truncate">
                    <span className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5 truncate">
                      <span>{habit.name}</span>
                      <span>{habit.icon}</span>
                      {habit.goalDescription && (
                        <span className="text-[11px] font-normal text-zinc-400 truncate">
                          - {habit.goalDescription}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Pourcentage de réussite */}
                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-bold font-mono text-zinc-300">
                    {stats.percent}%
                  </span>
                </div>
              </div>

              {/* Ligne 2 : Grille de Heatmap Individuelle compacte (7 rangées x N colonnes) */}
              <div className="overflow-x-auto pb-0.5 scrollbar-thin">
                <div className="inline-flex gap-1 p-0.5 rounded-lg bg-[#0c0c0f] border border-zinc-900">
                  {weeksData.map((week) => (
                    <div key={week.weekIndex} className="flex flex-col gap-1">
                      {week.days.map((day) => {
                        const isDone = !!habitMap[day.dateStr];
                        return (
                          <div
                            key={day.dateStr}
                            onClick={() => toggleHabitDate(habit.id, day.dateStr)}
                            onMouseEnter={() =>
                              setHoveredCell({
                                habitName: habit.name,
                                dateStr: day.dateStr,
                                completed: isDone,
                              })
                            }
                            onMouseLeave={() => setHoveredCell(null)}
                            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2.5px] transition-all cursor-pointer relative ${
                              day.isToday ? 'ring-1 ring-white/80' : ''
                            }`}
                            style={{
                              backgroundColor: isDone ? habit.color : '#1c1c21',
                              boxShadow: isDone
                                ? `0 0 5px ${habit.color}55, 0 0 2px ${habit.color}88`
                                : 'none',
                              border: isDone ? `1px solid ${habit.color}` : '1px solid #272730',
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Infobulle dynamique de survol */}
      <div className="h-6 flex items-center justify-between text-xs text-zinc-400 px-1 border-t border-zinc-800/80 pt-3">
        {hoveredCell ? (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-200">{hoveredCell.habitName}</span>
            <span className="text-zinc-500">•</span>
            <span className="font-mono text-zinc-300">{hoveredCell.dateStr}</span>
            <span className="text-zinc-500">•</span>
            <span
              className={`font-semibold ${
                hoveredCell.completed ? 'text-emerald-400' : 'text-zinc-500'
              }`}
            >
              {hoveredCell.completed ? 'Validé ✓' : 'Non complété'}
            </span>
          </div>
        ) : (
          <span className="text-zinc-500 text-[11px]">
            Survolez ou cliquez sur une case pour afficher la date et modifier son état.
          </span>
        )}

        {onAddHabitClick && (
          <button
            type="button"
            onClick={onAddHabitClick}
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter une habitude</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default HelloHabitStreaksView;
