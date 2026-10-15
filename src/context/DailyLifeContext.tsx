'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Habit,
  HabitCycle,
  ActivityDayLog,
  BudgetTransaction,
  BudgetCategory,
  MonthlyBudgetStats,
} from '@/types/dailyLife';
import { useData } from './DataContext';

interface DailyLifeContextType {
  // Habitudes
  habits: Habit[];
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  deleteHabit: (id: string) => void;

  // Cycles / Sprints de 10 Jours
  cycles: HabitCycle[];
  activeCycle: HabitCycle | null;
  toggleHabitDay: (cycleId: string, habitId: string, dayIndex: number) => void;
  startNewCycle: (title: string, habitIds: string[]) => void;

  // Streaks & Grille d'Activité (GitHub / Duolingo)
  activityGrid: ActivityDayLog[];
  currentStreak: number;
  longestStreak: number;
  todayActionCount: number;

  // Streaks par Habitude (Matrice In-Review)
  habitHistory: Record<string, Record<string, boolean>>;
  toggleHabitDate: (habitId: string, dateStr: string) => void;
  getHabitStats: (habitId: string) => { totalCompleted: number; percent: number; streak: number };

  // Reset des données
  resetHabitsData: () => void;
  resetBudgetData: () => void;

  // Budget
  transactions: BudgetTransaction[];
  addTransaction: (tx: Omit<BudgetTransaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  budgetGoal: number;
  setBudgetGoal: (goal: number) => void;
  budgetStats: MonthlyBudgetStats;
}

const DailyLifeContext = createContext<DailyLifeContextType | undefined>(undefined);

const HABITS_STORAGE_KEY = 'syntropy_habits_v2';
const CYCLES_STORAGE_KEY = 'syntropy_habit_cycles_v2';
const BUDGET_STORAGE_KEY = 'syntropy_budget_v2';
const GOAL_STORAGE_KEY = 'syntropy_budget_goal_v2';
const HABIT_HISTORY_STORAGE_KEY = 'syntropy_habit_history_v2';
const RESET_PERFORMED_KEY = 'syntropy_v2_clean_reset_done_v4';

// 7 Modèles d'habitudes initiaux (historique 100% vierge, 0 coche)
const DEFAULT_HABITS: Habit[] = [
  {
    id: 'h-1',
    name: "Boire de l'eau",
    category: 'health',
    icon: '💧',
    color: '#38bdf8', // Blue
    targetDays: 10,
    goalDescription: '8 verres par jour',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'h-2',
    name: 'Réveil matinal',
    category: 'mindset',
    icon: '☀️',
    color: '#f59e0b', // Gold / Yellow
    targetDays: 10,
    goalDescription: 'Tous les jours à heure fixe',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'h-3',
    name: 'Lecture',
    category: 'learning',
    icon: '📚',
    color: '#f43f5e', // Rose / Salmon
    targetDays: 10,
    goalDescription: '15-30 min par jour',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'h-4',
    name: 'Marche & Pas',
    category: 'health',
    icon: '🚶',
    color: '#10b981', // Mint / Emerald
    targetDays: 10,
    goalDescription: '10 000 pas quotidiens',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'h-5',
    name: 'Étude & Focus',
    category: 'learning',
    icon: '🤓',
    color: '#6366f1', // Indigo / Periwinkle
    targetDays: 10,
    goalDescription: 'Sessions de concentration profonde',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'h-6',
    name: 'Méditation & Étirements',
    category: 'health',
    icon: '🧘',
    color: '#a855f7', // Purple
    targetDays: 10,
    goalDescription: '15 min de calme et souplesse',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'h-7',
    name: 'Journaling',
    category: 'mindset',
    icon: '📝',
    color: '#f97316', // Orange
    targetDays: 10,
    goalDescription: 'Bilan et gratitude du soir',
    createdAt: new Date().toISOString(),
  },
];

const generateInitialHistory = (habitList: Habit[]) => {
  const history: Record<string, Record<string, boolean>> = {};
  habitList.forEach((h) => {
    history[h.id] = {};
  });
  return history;
};

// Sprint initial actif (10 jours) avec cases vides prêtes à être cochées
const createInitialCycle = (): HabitCycle => {
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + 9);

  return {
    id: 'cycle-initial-1',
    title: 'Sprint #1 : Routine & Objectifs (10 Jours)',
    startDate: now.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
    status: 'active',
    habitIds: ['h-1', 'h-2', 'h-3', 'h-4', 'h-5', 'h-6', 'h-7'],
    completions: {
      'h-1': {},
      'h-2': {},
      'h-3': {},
      'h-4': {},
      'h-5': {},
      'h-6': {},
      'h-7': {},
    },
    createdAt: now.toISOString(),
  };
};

// Transactions budgétaires initiales (vierge pour un démarrage propre)
const DEFAULT_TRANSACTIONS: BudgetTransaction[] = [];

export const DailyLifeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tasks, notes } = useData();

  // 1. Habitudes
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [cycles, setCycles] = useState<HabitCycle[]>([createInitialCycle()]);
  const [habitHistory, setHabitHistory] = useState<Record<string, Record<string, boolean>>>(() =>
    generateInitialHistory(DEFAULT_HABITS)
  );

  // 2. Budget
  const [transactions, setTransactions] = useState<BudgetTransaction[]>(DEFAULT_TRANSACTIONS);
  const [budgetGoal, setBudgetGoal] = useState<number>(1400);

  // Chargement localStorage avec réinitialisation propre pour la v2
  useEffect(() => {
    try {
      // Si la migration vers la version réinitialisée n'a pas encore eu lieu dans ce navigateur
      const resetDone = localStorage.getItem(RESET_PERFORMED_KEY);
      if (!resetDone) {
        localStorage.removeItem(BUDGET_STORAGE_KEY);
        localStorage.removeItem(CYCLES_STORAGE_KEY);
        localStorage.removeItem(HABIT_HISTORY_STORAGE_KEY);
        localStorage.removeItem(HABITS_STORAGE_KEY);
        localStorage.setItem(RESET_PERFORMED_KEY, 'true');

        setHabits(DEFAULT_HABITS);
        localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(DEFAULT_HABITS));

        setTransactions([]);
        const cleanCycle = [createInitialCycle()];
        setCycles(cleanCycle);
        localStorage.setItem(CYCLES_STORAGE_KEY, JSON.stringify(cleanCycle));

        const cleanHistory = generateInitialHistory(DEFAULT_HABITS);
        setHabitHistory(cleanHistory);
        localStorage.setItem(HABIT_HISTORY_STORAGE_KEY, JSON.stringify(cleanHistory));
        return;
      }

      const savedHabits = localStorage.getItem(HABITS_STORAGE_KEY);
      const parsedHabits = savedHabits ? JSON.parse(savedHabits) : DEFAULT_HABITS;
      if (savedHabits) setHabits(parsedHabits);

      const savedCycles = localStorage.getItem(CYCLES_STORAGE_KEY);
      if (savedCycles) setCycles(JSON.parse(savedCycles));

      const savedBudget = localStorage.getItem(BUDGET_STORAGE_KEY);
      if (savedBudget) setTransactions(JSON.parse(savedBudget));

      const savedGoal = localStorage.getItem(GOAL_STORAGE_KEY);
      if (savedGoal) setBudgetGoal(Number(savedGoal));

      const savedHistory = localStorage.getItem(HABIT_HISTORY_STORAGE_KEY);
      if (savedHistory) {
        setHabitHistory(JSON.parse(savedHistory));
      } else {
        const initHistory = generateInitialHistory(parsedHabits);
        setHabitHistory(initHistory);
        localStorage.setItem(HABIT_HISTORY_STORAGE_KEY, JSON.stringify(initHistory));
      }
    } catch (e) {
      console.warn('Erreur chargement DailyLife', e);
    }
  }, []);

  // Cycle actif (premier cycle avec statut active)
  const activeCycle = useMemo(() => {
    return cycles.find((c) => c.status === 'active') || cycles[0] || null;
  }, [cycles]);

  // Actions Habitudes
  const addHabit = (habitData: Omit<Habit, 'id' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: `h-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...habits, newHabit];
    setHabits(updated);
    localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(updated));

    setHabitHistory((prev) => {
      const updatedHist = { ...prev, [newHabit.id]: {} };
      localStorage.setItem(HABIT_HISTORY_STORAGE_KEY, JSON.stringify(updatedHist));
      return updatedHist;
    });

    // Ajout au cycle actif si présent
    if (activeCycle) {
      const updatedCycles = cycles.map((c) =>
        c.id === activeCycle.id
          ? {
              ...c,
              habitIds: [...c.habitIds, newHabit.id],
              completions: { ...c.completions, [newHabit.id]: {} },
            }
          : c
      );
      setCycles(updatedCycles);
      localStorage.setItem(CYCLES_STORAGE_KEY, JSON.stringify(updatedCycles));
    }
  };

  const deleteHabit = (id: string) => {
    const updated = habits.filter((h) => h.id !== id);
    setHabits(updated);
    localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(updated));
  };

  // Cocher / Décocher une date pour une habitude (matrice annuelle)
  const toggleHabitDate = (habitId: string, dateStr: string) => {
    setHabitHistory((prev) => {
      const habitMap = prev[habitId] || {};
      const currentVal = !!habitMap[dateStr];
      const updated = {
        ...prev,
        [habitId]: {
          ...habitMap,
          [dateStr]: !currentVal,
        },
      };
      localStorage.setItem(HABIT_HISTORY_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Calcul des stats par habitude (taux de complétion et série)
  const getHabitStats = (habitId: string) => {
    const habitMap = habitHistory[habitId] || {};
    const days = Object.keys(habitMap);
    if (days.length === 0) return { totalCompleted: 0, percent: 0, streak: 0 };
    const totalCompleted = Object.values(habitMap).filter(Boolean).length;
    const percent = Math.round((totalCompleted / days.length) * 100);

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (habitMap[dateStr]) {
        streak++;
      } else {
        if (i === 0) continue;
        break;
      }
    }
    return { totalCompleted, percent, streak };
  };

  // Cocher / Décocher un jour (1 à 10) dans un cycle
  const toggleHabitDay = (cycleId: string, habitId: string, dayIndex: number) => {
    const updatedCycles = cycles.map((c) => {
      if (c.id !== cycleId) return c;
      const currentVal = c.completions?.[habitId]?.[dayIndex] || false;
      const habitCompletions = {
        ...(c.completions?.[habitId] || {}),
        [dayIndex]: !currentVal,
      };
      return {
        ...c,
        completions: {
          ...c.completions,
          [habitId]: habitCompletions,
        },
      };
    });
    setCycles(updatedCycles);
    localStorage.setItem(CYCLES_STORAGE_KEY, JSON.stringify(updatedCycles));
  };

  // Démarrer un nouveau cycle de 10 jours
  const startNewCycle = (title: string, habitIds: string[]) => {
    const now = new Date();
    const end = new Date(now);
    end.setDate(now.getDate() + 9);

    const initialCompletions: Record<string, Record<number, boolean>> = {};
    habitIds.forEach((id) => {
      initialCompletions[id] = {};
    });

    const newCycle: HabitCycle = {
      id: `cycle-${Date.now()}`,
      title: title || `Sprint #${cycles.length + 1} (10 Jours)`,
      startDate: now.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      status: 'active',
      habitIds,
      completions: initialCompletions,
      createdAt: now.toISOString(),
    };

    // Mettre les précédents en completed
    const updated = cycles.map((c) => ({ ...c, status: 'completed' as const }));
    const result = [newCycle, ...updated];
    setCycles(result);
    localStorage.setItem(CYCLES_STORAGE_KEY, JSON.stringify(result));
  };

  // Actions Budget
  const addTransaction = (txData: Omit<BudgetTransaction, 'id' | 'createdAt'>) => {
    const newTx: BudgetTransaction = {
      ...txData,
      id: `t-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteTransaction = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(updated));
  };

  const resetBudgetData = () => {
    setTransactions([]);
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify([]));
  };

  const resetHabitsData = () => {
    const cleanCycles = [createInitialCycle()];
    const cleanHistory = generateInitialHistory(habits);
    setCycles(cleanCycles);
    setHabitHistory(cleanHistory);
    localStorage.setItem(CYCLES_STORAGE_KEY, JSON.stringify(cleanCycles));
    localStorage.setItem(HABIT_HISTORY_STORAGE_KEY, JSON.stringify(cleanHistory));
  };

  const handleSetBudgetGoal = (val: number) => {
    setBudgetGoal(val);
    localStorage.setItem(GOAL_STORAGE_KEY, String(val));
  };

  // Statistiques Budgétaires
  const budgetStats: MonthlyBudgetStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    const catTotals: Record<BudgetCategory, number> = {
      logement: 0,
      alimentation: 0,
      transport: 0,
      loisirs: 0,
      abonnements: 0,
      sante: 0,
      epargne: 0,
      autre: 0,
    };

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
      catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amount;
    });

    const balance = income - expense;
    const percentUsed = budgetGoal > 0 ? Math.round((expense / budgetGoal) * 100) : 0;

    return {
      totalIncome: income,
      totalExpenses: expense,
      balance,
      budgetGoal,
      percentUsed,
      categoryBreakdown: catTotals,
    };
  }, [transactions, budgetGoal]);

  // Génération de la matrice d'activité (12 semaines = 84 jours)
  const activityGrid = useMemo<ActivityDayLog[]>(() => {
    const days: ActivityDayLog[] = [];
    const today = new Date();

    // 84 jours en arrière
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();

      // Compte d'habitudes cochées pour cette date spécifique dans habitHistory
      let habitsCount = 0;
      Object.values(habitHistory).forEach((hDates) => {
        if (hDates?.[dateStr]) habitsCount++;
      });

      // Actions terminées du jour
      const tasksCompleted = tasks.filter((t) => t.status === 'done').length;
      const notesCount = notes.length > 0 ? 1 : 0;

      // Score réel
      const score = Math.min(4, habitsCount);

      days.push({
        date: dateStr,
        dayOfWeek,
        habitsCount,
        tasksCount: Math.min(tasksCompleted, 3),
        notesCount,
        totalScore: score,
      });
    }

    return days;
  }, [tasks, notes, habitHistory]);

  // Calcul dynamique des Streaks (Jours consécutifs réels)
  const { currentStreak, longestStreak, todayActionCount } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Actions validées aujourd'hui
    let todayCount = 0;
    Object.values(habitHistory).forEach((hDates) => {
      if (hDates?.[todayStr]) todayCount++;
    });

    // Si aucune habitude n'a encore été cochée
    const totalAllChecks = Object.values(habitHistory).reduce(
      (sum, hDates) => sum + Object.values(hDates).filter(Boolean).length,
      0
    );
    if (totalAllChecks === 0) {
      return { currentStreak: 0, longestStreak: 0, todayActionCount: 0 };
    }

    // Calcul de la série active
    let streak = 0;
    const startIndex = todayCount > 0 ? 0 : 1; // Si pas encore coché aujourd'hui, on teste à partir d'hier
    for (let i = startIndex; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayHasCheck = Object.values(habitHistory).some((hDates) => !!hDates?.[dStr]);
      if (dayHasCheck) {
        streak++;
      } else {
        break;
      }
    }

    // Calcul du record
    let maxStreak = streak;
    let run = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayHasCheck = Object.values(habitHistory).some((hDates) => !!hDates?.[dStr]);
      if (dayHasCheck) {
        run++;
        if (run > maxStreak) maxStreak = run;
      } else {
        run = 0;
      }
    }

    return {
      currentStreak: streak,
      longestStreak: maxStreak,
      todayActionCount: todayCount,
    };
  }, [habitHistory]);

  return (
    <DailyLifeContext.Provider
      value={{
        habits,
        addHabit,
        deleteHabit,
        cycles,
        activeCycle,
        toggleHabitDay,
        startNewCycle,
        resetHabitsData,
        resetBudgetData,
        activityGrid,
        currentStreak,
        longestStreak,
        todayActionCount,
        habitHistory,
        toggleHabitDate,
        getHabitStats,
        transactions,
        addTransaction,
        deleteTransaction,
        budgetGoal,
        setBudgetGoal: handleSetBudgetGoal,
        budgetStats,
      }}
    >
      {children}
    </DailyLifeContext.Provider>
  );
};

export const useDailyLife = () => {
  const context = useContext(DailyLifeContext);
  if (!context) {
    throw new Error('useDailyLife must be used within a DailyLifeProvider');
  }
  return context;
};
