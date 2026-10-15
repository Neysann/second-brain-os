'use client';

import React, { useState } from 'react';
import {
  Flame,
  Plus,
  Check,
  RotateCcw,
  Target,
  Zap,
  HelpCircle,
  Award,
  X,
  Trash2,
} from 'lucide-react';
import { useDailyLife } from '@/context/DailyLifeContext';
import { useTheme } from '@/context/ThemeContext';
import { Habit } from '@/types/dailyLife';
import HabitsTrackerView from '@/components/habits/HabitsTrackerView';
import { HabitsTutorialModal } from '@/components/habits/HabitsTutorialModal';

const CATEGORY_LABELS: Record<Habit['category'], { label: string; color: string }> = {
  health: { label: 'Santé & Corps', color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  productivity: { label: 'Productivité', color: 'text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  mindset: { label: 'Mindset & Esprit', color: 'text-purple-700 dark:text-purple-400 bg-purple-500/10 border-purple-500/30' },
  learning: { label: 'Apprentissage', color: 'text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/30' },
  lifestyle: { label: 'Style de vie', color: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30' },
};

export default function HabitsPage() {
  const {
    habits,
    addHabit,
    cycles,
    activeCycle,
    toggleHabitDay,
    startNewCycle,
    resetHabitsData,
    currentStreak,
    longestStreak,
    todayActionCount,
  } = useDailyLife();
  const { theme } = useTheme();

  // Modales
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isNewCycleOpen, setIsNewCycleOpen] = useState(false);
  const [isNewHabitOpen, setIsNewHabitOpen] = useState(false);

  // Prise en charge de action=new depuis la palette universelle
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'new') {
        setHabitName('');
        setHabitGoal('');
        setIsNewHabitOpen(true);
      }
    }
  }, []);

  // Formulaire nouveau cycle
  const [cycleTitle, setCycleTitle] = useState('');
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);

  // Formulaire nouvelle habitude
  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] = useState<Habit['category']>('health');
  const [habitIcon, setHabitIcon] = useState('✨');
  const [habitColor, setHabitColor] = useState('#8b5cf6');
  const [habitGoal, setHabitGoal] = useState('');

  // Ouvrir modal nouveau cycle avec toutes les habitudes présélectionnées
  const handleOpenNewCycle = () => {
    setCycleTitle(`Sprint #${cycles.length + 1} : Routine & Objectifs`);
    setSelectedHabitIds(habits.map((h) => h.id));
    setIsNewCycleOpen(true);
  };

  const handleCreateCycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleTitle.trim() || selectedHabitIds.length === 0) return;
    startNewCycle(cycleTitle.trim(), selectedHabitIds);
    setIsNewCycleOpen(false);
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    addHabit({
      name: habitName.trim(),
      category: habitCategory,
      icon: habitIcon || '✨',
      color: habitColor,
      targetDays: 10,
      goalDescription: habitGoal.trim() || undefined,
    });
    setHabitName('');
    setHabitGoal('');
    setIsNewHabitOpen(false);
  };

  // Calcul du taux global pour le sprint actif
  const sprintStats = React.useMemo(() => {
    if (!activeCycle) return { totalChecks: 0, maxChecks: 0, percent: 0, currentDay: 1 };

    const habitCount = activeCycle.habitIds.length;
    const maxChecks = habitCount * 10;
    let totalChecks = 0;

    activeCycle.habitIds.forEach((hId) => {
      const days = activeCycle.completions[hId] || {};
      for (let d = 1; d <= 10; d++) {
        if (days[d]) totalChecks++;
      }
    });

    const percent = maxChecks > 0 ? Math.round((totalChecks / maxChecks) * 100) : 0;

    // Jour actuel estimé par rapport à la date de début
    const start = new Date(activeCycle.startDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const currentDay = Math.min(10, Math.max(1, diffDays));

    return { totalChecks, maxChecks, percent, currentDay };
  }, [activeCycle]);

  return (
    <div className="p-3.5 sm:p-5 lg:p-6 max-w-7xl mx-auto space-y-5 select-none">
      {/* 1. En-tête de la page */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                  Habitude
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold font-mono">
                  Daily Life V2
                </span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                Rituels quotidiens, sprints renouvelables de 10 jours et flamme de régularité
              </p>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Bouton Tutoriel */}
          <button
            onClick={() => setIsTutorialOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all flex items-center gap-2 cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-300 shadow-xs"
            title="Guide pratique pour utiliser la page Habitude"
          >
            <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Tutoriel</span>
          </button>

          <button
            onClick={() => setIsNewHabitOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all flex items-center gap-2 cursor-pointer bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-zinc-800 dark:border-zinc-700 text-white dark:text-zinc-200 shadow-xs"
          >
            <Plus className="w-4 h-4 text-purple-400" />
            <span>Nouvelle Habitude</span>
          </button>

          <button
            onClick={handleOpenNewCycle}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Nouveau Cycle (10j)</span>
          </button>

          {/* Bouton Reset */}
          <button
            onClick={() => {
              if (window.confirm('Voulez-vous réinitialiser toutes les données d\'habitudes (historique et cycles) ?')) {
                resetHabitsData();
              }
            }}
            className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all flex items-center gap-1.5 cursor-pointer bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 shadow-xs"
            title="Remettre les habitudes à zéro"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* 2. Cartes Hero : Flamme Duolingo, Objectifs & Sprint */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Flamme Duolingo */}
        <div
          className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-amber-950/20 border-zinc-800/80'
              : 'bg-white border-zinc-200 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-500">
                Série Active
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5">
                  {currentStreak}
                  <span className="text-2xl text-amber-500 font-semibold">jours</span>
                </span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/30 relative group">
              <Flame className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-zinc-950 animate-ping" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Record : <strong className="text-zinc-900 dark:text-zinc-200">{longestStreak} jours consécutifs</strong>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">En feu 🔥</span>
          </div>
        </div>

        {/* Actions du jour */}
        <div
          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            theme === 'dark'
              ? 'bg-zinc-900/70 border-zinc-800/80'
              : 'bg-white border-zinc-200 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Objectifs Aujourd'hui
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">
                  {todayActionCount}
                  <span className="text-xl text-zinc-500 dark:text-zinc-400 font-normal"> / {habits.length}</span>
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Target className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
              <span>Progression du jour</span>
              <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                {habits.length > 0 ? Math.round((todayActionCount / habits.length) * 100) : 0}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/50 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{
                  width: `${habits.length > 0 ? (todayActionCount / habits.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Philosophie 10-Day Sprint */}
        <div
          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-indigo-950/20 via-zinc-900/60 to-zinc-900/80 border-indigo-500/20'
              : 'bg-white border-zinc-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Méthode Sprint 10 Jours
            </span>
          </div>
          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed mt-2 font-medium">
            « Découper ses routines en cycles renouvelables de 10 jours élimine la lassitude mentale et garantit un taux d'adhérence maximal. »
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 pt-2 border-t border-inherit">
            <span>Cycle en cours</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-medium">
              Jour {sprintStats.currentDay} sur 10
            </span>
          </div>
        </div>
      </div>

      {/* 3. Nouveau Module Quotidien d'Habitudes (Remplace la grille Syntropy Streaks) */}
      <HabitsTrackerView onAddHabitClick={() => setIsNewHabitOpen(true)} />

      {/* 4. Tableau du Sprint 10 Jours Actif */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border transition-all space-y-6 ${
          theme === 'dark'
            ? 'bg-zinc-900/60 border-zinc-800/80'
            : 'bg-white border-zinc-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-inherit">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/30">
                Cycle Actif (10 Jours)
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {activeCycle ? activeCycle.title : 'Aucun cycle actif'}
              </h2>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              {activeCycle
                ? `Du ${activeCycle.startDate} au ${activeCycle.endDate} · Progressez un jour après l'autre`
                : 'Démarrez un premier cycle pour commencer le suivi'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Taux de réussite global</div>
              <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                {sprintStats.percent}%
              </div>
            </div>
            <button
              onClick={handleOpenNewCycle}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
            >
              Nouveau Cycle
            </button>
          </div>
        </div>

        {/* Tableau des habitudes et des 10 jours */}
        {activeCycle && (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-400">
                  <th className="py-3 px-3 font-semibold text-zinc-800 dark:text-zinc-300">Habitude</th>
                  <th className="py-3 px-2 font-semibold text-zinc-800 dark:text-zinc-300">Catégorie</th>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
                    <th
                      key={d}
                      className={`py-3 px-1.5 text-center font-mono ${
                        d === sprintStats.currentDay
                          ? 'text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 rounded-t-lg'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      J{d}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-right font-semibold text-zinc-800 dark:text-zinc-300">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/40 text-sm">
                {activeCycle.habitIds.map((hId) => {
                  const habit = habits.find((h) => h.id === hId);
                  if (!habit) return null;

                  const days = activeCycle.completions[hId] || {};
                  let completedCount = 0;
                  for (let d = 1; d <= 10; d++) {
                    if (days[d]) completedCount++;
                  }
                  const percent = Math.round((completedCount / 10) * 100);

                  return (
                    <tr
                      key={hId}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group"
                    >
                      {/* Nom & Icône */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl flex-shrink-0">{habit.icon}</span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{habit.name}</span>
                        </div>
                      </td>

                      {/* Catégorie */}
                      <td className="py-3 px-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                            CATEGORY_LABELS[habit.category]?.color || 'text-zinc-500'
                          }`}
                        >
                          {CATEGORY_LABELS[habit.category]?.label || habit.category}
                        </span>
                      </td>

                      {/* Cases des 10 jours */}
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => {
                        const isDone = !!days[d];
                        const isToday = d === sprintStats.currentDay;

                        return (
                          <td
                            key={d}
                            className={`py-3 px-1.5 text-center ${
                              isToday ? 'bg-amber-500/5' : ''
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleHabitDay(activeCycle.id, hId, d)}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer mx-auto ${
                                isDone
                                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                                  : isToday
                                  ? 'border-2 border-dashed border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                                  : 'border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950/60 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-500 dark:text-zinc-500'
                              }`}
                              title={`Jour ${d} : ${isDone ? 'Validé' : 'Cliquer pour valider'}`}
                            >
                              {isDone ? (
                                <Check className="w-4 h-4 stroke-[3]" />
                              ) : (
                                <span className="text-[10px] font-mono opacity-60">{d}</span>
                              )}
                            </button>
                          </td>
                        );
                      })}

                      {/* Score final */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-200">
                            {completedCount}/10
                          </span>
                          <div className="w-12 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal : Démarrer un nouveau cycle */}
      {isNewCycleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 text-zinc-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-500" />
                Nouveau Sprint de 10 Jours
              </h3>
              <button
                onClick={() => setIsNewCycleOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCycle} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Nom du Sprint
                </label>
                <input
                  type="text"
                  value={cycleTitle}
                  onChange={(e) => setCycleTitle(e.target.value)}
                  placeholder="Ex : Sprint #2 : Focus & Énergie"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-2">
                  Sélectionnez les habitudes à inclure (10 jours)
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {habits.map((h) => {
                    const isSelected = selectedHabitIds.includes(h.id);
                    return (
                      <div
                        key={h.id}
                        onClick={() => {
                          setSelectedHabitIds((prev) =>
                            isSelected ? prev.filter((id) => id !== h.id) : [...prev, h.id]
                          );
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200 font-semibold'
                            : 'bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{h.icon}</span>
                          <span className="text-xs">{h.name}</span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            isSelected
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'border-zinc-300 dark:border-zinc-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCycleOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={selectedHabitIds.length === 0}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  Lancer le Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal : Nouvelle habitude */}
      {isNewHabitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 text-zinc-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-500" />
                Nouvelle Habitude
              </h3>
              <button
                onClick={() => setIsNewHabitOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Nom de l'Habitude
                </label>
                <input
                  type="text"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  placeholder="Ex : Étirements du matin"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Description / Objectif (optionnel)
                </label>
                <input
                  type="text"
                  value={habitGoal}
                  onChange={(e) => setHabitGoal(e.target.value)}
                  placeholder="Ex : 15 min tous les matins au réveil"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Émoji / Icône
                  </label>
                  <input
                    type="text"
                    value={habitIcon}
                    onChange={(e) => setHabitIcon(e.target.value)}
                    placeholder="🧘"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-200 text-center focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Catégorie
                  </label>
                  <select
                    value={habitCategory}
                    onChange={(e) => setHabitCategory(e.target.value as Habit['category'])}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="health">Santé & Corps</option>
                    <option value="productivity">Productivité</option>
                    <option value="mindset">Mindset & Esprit</option>
                    <option value="learning">Apprentissage</option>
                    <option value="lifestyle">Style de vie</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Couleur d'accentuation
                </label>
                <div className="flex items-center gap-2">
                  {['#38bdf8', '#f59e0b', '#f43f5e', '#10b981', '#6366f1', '#a855f7', '#f97316'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setHabitColor(color)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        habitColor === color ? 'scale-125 ring-2 ring-zinc-900 dark:ring-white ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewHabitOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  Ajouter l'habitude
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tutoriel */}
      <HabitsTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </div>
  );
}
