// Types pour les extensions Daily Life : Habitudes, Streaks & Budget (V2 Preview)

export interface Habit {
  id: string;
  name: string;
  category: 'health' | 'productivity' | 'mindset' | 'learning' | 'lifestyle';
  icon: string;
  color: string;
  targetDays: number; // 10 jours par défaut
  goalDescription?: string; // Ex: "8 verres par jour", "200 pages par semaine"
  createdAt: string;
}

export interface HabitCycle {
  id: string;
  title: string; // Ex: "Sprint #1 : Routine Matinale & Énergie"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'active' | 'completed' | 'archived';
  habitIds: string[];
  // completions : habitId -> dayIndex (1..10) -> boolean
  completions: Record<string, Record<number, boolean>>;
  createdAt: string;
}

export interface ActivityDayLog {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Dimanche, 1 = Lundi, ...
  habitsCount: number;
  tasksCount: number;
  notesCount: number;
  totalScore: number; // 0 à 4+ pour l'intensité du violet GitHub
}

export type TransactionType = 'expense' | 'income';

export type BudgetCategory =
  | 'logement'
  | 'alimentation'
  | 'transport'
  | 'loisirs'
  | 'abonnements'
  | 'sante'
  | 'epargne'
  | 'autre';

export interface BudgetTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: BudgetCategory;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface MonthlyBudgetStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  budgetGoal: number;
  percentUsed: number;
  categoryBreakdown: Record<BudgetCategory, number>;
}
