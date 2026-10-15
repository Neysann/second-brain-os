'use client';

import React, { useState, useMemo } from 'react';
import {
  Check,
  Plus,
  Flame,
  TrendingUp,
  Award,
  Sparkles,
  Calendar,
  Trash2,
  Filter,
  CheckCheck,
  Circle,
  Clock,
  Target,
} from 'lucide-react';
import { useDailyLife } from '@/context/DailyLifeContext';
import { useTheme } from '@/context/ThemeContext';
import { Habit } from '@/types/dailyLife';

interface HabitsTrackerViewProps {
  onAddHabitClick: () => void;
}

const CATEGORY_INFO: Record<Habit['category'], { label: string; badgeClass: string }> = {
  health: {
    label: 'Santé & Corps',
    badgeClass: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/30 dark:text-emerald-400',
  },
  productivity: {
    label: 'Productivité',
    badgeClass: 'text-indigo-700 bg-indigo-500/10 border-indigo-500/30 dark:text-indigo-400',
  },
  mindset: {
    label: 'Mindset & Esprit',
    badgeClass: 'text-purple-700 bg-purple-500/10 border-purple-500/30 dark:text-purple-400',
  },
  learning: {
    label: 'Apprentissage',
    badgeClass: 'text-blue-700 bg-blue-500/10 border-blue-500/30 dark:text-blue-400',
  },
  lifestyle: {
    label: 'Style de vie',
    badgeClass: 'text-amber-700 bg-amber-500/10 border-amber-500/30 dark:text-amber-400',
  },
};

export const HabitsTrackerView: React.FC<HabitsTrackerViewProps> = ({ onAddHabitClick }) => {
  const { habits, habitHistory, toggleHabitDate, getHabitStats, deleteHabit } = useDailyLife();
  const { theme } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Date du jour au format YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Génération des 7 derniers jours (du plus ancien au plus récent / aujourd'hui)
  const last7Days = useMemo(() => {
    const days: { dateStr: string; dayName: string; dayNumber: string; isToday: boolean }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(d);
      const dayNumber = d.getDate().toString().padStart(2, '0');
      days.push({
        dateStr,
        dayName: dayName.replace('.', '').toUpperCase(),
        dayNumber,
        isToday: i === 0,
      });
    }

    return days;
  }, []);

  // Filtrage des habitudes
  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      const matchesCategory = selectedCategory === 'all' || h.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.goalDescription && h.goalDescription.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [habits, selectedCategory, searchQuery]);

  // Tout cocher pour aujourd'hui
  const handleCheckAllToday = () => {
    filteredHabits.forEach((h) => {
      const habitMap = habitHistory[h.id] || {};
      if (!habitMap[todayStr]) {
        toggleHabitDate(h.id, todayStr);
      }
    });
  };

  const completedTodayCount = useMemo(() => {
    return habits.filter((h) => {
      const habitMap = habitHistory[h.id] || {};
      return !!habitMap[todayStr];
    }).length;
  }, [habits, habitHistory, todayStr]);

  return (
    <div
      className={`p-4 sm:p-6 rounded-2xl border transition-all space-y-5 select-none ${
        theme === 'dark'
          ? 'bg-zinc-900/60 border-zinc-800/80 shadow-lg'
          : 'bg-white border-zinc-200 shadow-sm'
      }`}
    >
      {/* 1. En-tête : Titre, Compteur & Boutons d'action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-inherit">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              Rituels & Habitudes Quotidiens
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-semibold font-mono">
                {habits.length} habitudes
              </span>
            </h2>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            Validez vos habitudes en un clic et observez votre régularité sur les 7 derniers jours.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {filteredHabits.length > 0 && (
            <button
              type="button"
              onClick={handleCheckAllToday}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-xs"
              title="Valider toutes les habitudes affichées pour aujourd'hui"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tout valider aujourd'hui</span>
            </button>
          )}

          <button
            type="button"
            onClick={onAddHabitClick}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-purple-600 dark:hover:bg-purple-500 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvelle Habitude</span>
          </button>
        </div>
      </div>

      {/* 2. Barre de Filtres par Catégorie */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${
              selectedCategory === 'all'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-xs'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            Toutes ({habits.length})
          </button>

          {(['health', 'productivity', 'mindset', 'learning', 'lifestyle'] as Habit['category'][]).map(
            (cat) => {
              const count = habits.filter((h) => h.category === cat).length;
              if (count === 0) return null;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                    isSelected
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-xs'
                      : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {CATEGORY_INFO[cat].label} ({count})
                </button>
              );
            }
          )}
        </div>

        {/* Badge récapitulatif du jour */}
        <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Aujourd'hui :{' '}
          <strong className="text-zinc-900 dark:text-white font-bold">
            {completedTodayCount} / {habits.length}
          </strong>{' '}
          complétées
        </div>
      </div>

      {/* 3. Liste des Cartes d'Habitudes */}
      {filteredHabits.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-200/60 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Aucune habitude trouvée
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'all'
                ? 'Aucune habitude ne correspond à vos filtres actuels.'
                : 'Commencez par ajouter vos routines quotidiennes pour suivre votre progression.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onAddHabitClick}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-purple-600 dark:hover:bg-purple-500 text-white shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Créer ma première habitude</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHabits.map((habit) => {
            const stats = getHabitStats(habit.id);
            const habitMap = habitHistory[habit.id] || {};
            const isTodayDone = !!habitMap[todayStr];

            return (
              <div
                key={habit.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 group ${
                  theme === 'dark'
                    ? 'bg-zinc-900/40 hover:bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700/80'
                    : 'bg-white hover:bg-zinc-50/80 border-zinc-200 hover:border-zinc-300 shadow-xs'
                }`}
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: habit.color || '#a855f7',
                }}
              >
                {/* Section Gauche : Identité & Description */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Icône personnalisée */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-xs transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${habit.color}15`,
                      border: `1px solid ${habit.color}35`,
                    }}
                  >
                    {habit.icon || '✨'}
                  </div>

                  {/* Nom, objectif & catégorie */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate">
                        {habit.name}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                          CATEGORY_INFO[habit.category]?.badgeClass || 'text-zinc-600'
                        }`}
                      >
                        {CATEGORY_INFO[habit.category]?.label || habit.category}
                      </span>
                    </div>

                    {habit.goalDescription && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium truncate">
                        {habit.goalDescription}
                      </p>
                    )}

                    {/* Statistiques rapides (streak & adhésion) */}
                    <div className="flex items-center gap-3 pt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                        <Flame className="w-3.5 h-3.5" />
                        <span>{stats.streak} j d'affilée</span>
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span className="font-mono font-medium">
                        {stats.percent}% de régularité
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">•</span>
                      <span className="hidden sm:inline">
                        {stats.totalCompleted} fois validé
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section Droite : Bouton du jour + Strip des 7 derniers jours + Supprimer */}
                <div className="flex items-center justify-between lg:justify-end gap-3.5 shrink-0 flex-wrap">
                  {/* Strip des 7 derniers jours (du plus ancien à aujourd'hui) */}
                  <div className="flex items-center gap-1 bg-zinc-100/80 dark:bg-zinc-950/60 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    {last7Days.map((d) => {
                      const isDone = !!habitMap[d.dateStr];
                      return (
                        <button
                          key={d.dateStr}
                          type="button"
                          onClick={() => toggleHabitDate(habit.id, d.dateStr)}
                          className={`flex flex-col items-center justify-center w-8 sm:w-9 py-1 rounded-lg transition-all cursor-pointer relative ${
                            d.isToday
                              ? 'ring-2 ring-purple-500 dark:ring-purple-400 bg-white dark:bg-zinc-900 shadow-xs'
                              : 'hover:bg-zinc-200/60 dark:hover:bg-zinc-900'
                          }`}
                          title={`${d.dateStr} (${d.dayName}) : ${
                            isDone ? 'Validé (cliquer pour décocher)' : 'Cliquer pour valider'
                          }`}
                        >
                          <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">
                            {d.isToday ? 'Auj' : d.dayName}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full mt-1 flex items-center justify-center transition-all ${
                              isDone ? 'text-white shadow-xs' : 'border border-zinc-300 dark:border-zinc-700'
                            }`}
                            style={{
                              backgroundColor: isDone ? habit.color : 'transparent',
                              borderColor: isDone ? habit.color : undefined,
                            }}
                          >
                            {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bouton de validation rapide aujourd'hui */}
                  <button
                    type="button"
                    onClick={() => toggleHabitDate(habit.id, todayStr)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                      isTodayDone
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25'
                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
                    }`}
                    title={isTodayDone ? "Décocher aujourd'hui" : "Valider aujourd'hui"}
                  >
                    {isTodayDone ? (
                      <>
                        <div className="w-4 h-4 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="font-bold">Fait !</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4 text-zinc-400" />
                        <span>À faire</span>
                      </>
                    )}
                  </button>

                  {/* Bouton supprimer */}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Supprimer l'habitude "${habit.name}" ?`)) {
                        deleteHabit(habit.id);
                      }
                    }}
                    className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Supprimer cette habitude"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HabitsTrackerView;
