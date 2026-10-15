'use client';

import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  DollarSign,
  PieChart,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Search,
  X,
  Target,
  Edit2,
  Calendar,
  Layers,
  Sparkles,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { useDailyLife } from '@/context/DailyLifeContext';
import { useTheme } from '@/context/ThemeContext';
import { BudgetCategory, TransactionType, BudgetTransaction } from '@/types/dailyLife';
import { BudgetTutorialModal } from '@/components/budget/BudgetTutorialModal';

const CATEGORY_CONFIG: Record<
  BudgetCategory,
  { label: string; icon: string; color: string; barColor: string; hex: string }
> = {
  logement: { label: 'Logement & Charges', icon: '🏠', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', barColor: 'bg-blue-500', hex: '#3b82f6' },
  alimentation: { label: 'Alimentation & Courses', icon: '🥑', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', barColor: 'bg-emerald-500', hex: '#10b981' },
  transport: { label: 'Transports & Déplacements', icon: '🚆', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', barColor: 'bg-amber-500', hex: '#f59e0b' },
  loisirs: { label: 'Loisirs & Sorties', icon: '🍿', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', barColor: 'bg-rose-500', hex: '#f43f5e' },
  abonnements: { label: 'Abonnements & SaaS', icon: '⚡', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30', barColor: 'bg-indigo-500', hex: '#6366f1' },
  sante: { label: 'Santé & Bien-être', icon: '🧘', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30', barColor: 'bg-teal-500', hex: '#14b8a6' },
  epargne: { label: 'Épargne & Investissement', icon: '🌱', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', barColor: 'bg-purple-500', hex: '#a855f7' },
  autre: { label: 'Autre / Divers', icon: '📦', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30', barColor: 'bg-zinc-500', hex: '#71717a' },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function BudgetPage() {
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    resetBudgetData,
    budgetGoal,
    setBudgetGoal,
    budgetStats,
  } = useDailyLife();
  const { theme } = useTheme();

  // Modales
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);

  // Formulaire nouvelle transaction
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [txCategory, setTxCategory] = useState<BudgetCategory>('alimentation');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

  // Formulaire modifier objectif
  const [newGoalInput, setNewGoalInput] = useState(String(budgetGoal));

  // Filtres
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [hoveredCategory, setHoveredCategory] = useState<BudgetCategory | null>(null);

  // Calculs pour le graphique Camembert (Donut)
  const pieSlices = useMemo(() => {
    const total = budgetStats.totalExpenses;
    if (total <= 0) return [];

    const categories = Object.keys(CATEGORY_CONFIG) as BudgetCategory[];
    const radius = 60;
    const circumference = 2 * Math.PI * radius; // ~376.99
    let accumulatedOffset = 0;

    return categories
      .map((cat) => {
        const amount = budgetStats.categoryBreakdown[cat] || 0;
        const percent = (amount / total) * 100;
        const strokeLength = (percent / 100) * circumference;
        const slice = {
          category: cat,
          amount,
          percent: Math.round(percent),
          color: CATEGORY_CONFIG[cat].hex,
          strokeDasharray: `${strokeLength} ${circumference - strokeLength}`,
          strokeDashoffset: -accumulatedOffset,
        };
        accumulatedOffset += strokeLength;
        return slice;
      })
      .filter((s) => s.amount > 0);
  }, [budgetStats.categoryBreakdown, budgetStats.totalExpenses]);

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(txAmount);
    if (!txDesc.trim() || isNaN(val) || val <= 0) return;

    addTransaction({
      description: txDesc.trim(),
      amount: val,
      type: txType,
      category: txCategory,
      date: txDate,
    });

    setTxDesc('');
    setTxAmount('');
    setIsAddTxOpen(false);
  };

  const handleUpdateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newGoalInput);
    if (!isNaN(val) && val >= 0) {
      setBudgetGoal(val);
      setIsEditGoalOpen(false);
    }
  };

  // Filtrage des transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterType !== 'all' && tx.type !== filterType) return false;
      if (filterCategory !== 'all' && tx.category !== filterCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return tx.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [transactions, filterType, filterCategory, search]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 select-none">
      {/* 1. En-tête */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Budget
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 font-semibold font-mono">
                  Daily Life V2
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-0.5">
                Suivi des dépenses, équilibre mensuel et répartition par catégories
              </p>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Bouton Tutoriel */}
          <button
            onClick={() => setIsTutorialOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all flex items-center gap-2 cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300 shadow-sm"
            title="Guide pratique pour gérer votre Budget"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Tutoriel</span>
          </button>

          <button
            onClick={() => {
              setNewGoalInput(String(budgetGoal));
              setIsEditGoalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all flex items-center gap-2 cursor-pointer bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700 text-zinc-200 shadow-sm"
          >
            <Target className="w-4 h-4 text-emerald-400" />
            <span>Plafond Mensuel</span>
          </button>

          <button
            onClick={() => setIsAddTxOpen(true)}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Opération</span>
          </button>

          {/* Bouton Reset */}
          <button
            onClick={() => {
              if (window.confirm('Voulez-vous réinitialiser toutes les opérations budgétaires ?')) {
                resetBudgetData();
              }
            }}
            className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all flex items-center gap-1.5 cursor-pointer bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-rose-400 shadow-sm"
            title="Remettre le budget à zéro"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Solde Net */}
        <div
          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-emerald-950/20 border-zinc-800/80'
              : 'bg-white border-zinc-200 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Solde Net Mensuel
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                budgetStats.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(budgetStats.balance)}
            </div>
            <span className="text-xs text-zinc-400 mt-1 block">
              {budgetStats.balance >= 0 ? 'Épargne brute positive ✨' : 'Déficit ce mois-ci'}
            </span>
          </div>
        </div>

        {/* Revenus */}
        <div
          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            theme === 'dark'
              ? 'bg-zinc-900/60 border-zinc-800/80'
              : 'bg-white border-zinc-200 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Total Revenus
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-zinc-100 tracking-tight">
              {formatCurrency(budgetStats.totalIncome)}
            </div>
            <span className="text-xs text-zinc-400 mt-1 block">Entrées du mois</span>
          </div>
        </div>

        {/* Dépenses */}
        <div
          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            theme === 'dark'
              ? 'bg-zinc-900/60 border-zinc-800/80'
              : 'bg-white border-zinc-200 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Total Dépenses
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-400 tracking-tight">
              {formatCurrency(budgetStats.totalExpenses)}
            </div>
            <span className="text-xs text-zinc-400 mt-1 block">Sorties cumulées</span>
          </div>
        </div>

        {/* Objectif Mensuel / Jauge */}
        <div
          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            theme === 'dark'
              ? 'bg-zinc-900/60 border-zinc-800/80'
              : 'bg-white border-zinc-200 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Plafond Alloué
            </span>
            <button
              onClick={() => {
                setNewGoalInput(String(budgetGoal));
                setIsEditGoalOpen(true);
              }}
              className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Modifier le plafond"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-2 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-zinc-200">
                {formatCurrency(budgetGoal)}
              </span>
              <span
                className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                  budgetStats.percentUsed > 100
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : budgetStats.percentUsed > 80
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {budgetStats.percentUsed}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetStats.percentUsed > 100
                    ? 'bg-rose-500'
                    : budgetStats.percentUsed > 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, budgetStats.percentUsed)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Répartition & Camembert des Dépenses */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border transition-all space-y-6 ${
          theme === 'dark'
            ? 'bg-zinc-900/50 border-zinc-800/80'
            : 'bg-white border-zinc-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-400" />
            <span>Répartition & Camembert des Dépenses</span>
          </h2>
          <span className="text-xs text-zinc-400 font-mono">
            Total Dépenses : {formatCurrency(budgetStats.totalExpenses)}
          </span>
        </div>

        {/* Disposition split : Camembert à gauche, Détail des catégories à droite */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Camembert SVG interactif */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                {/* Cercle de fond */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  className="stroke-zinc-800/60"
                  strokeWidth="18"
                  fill="none"
                />

                {/* Slices du camembert */}
                {pieSlices.length > 0 ? (
                  pieSlices.map((slice) => {
                    const isHovered = hoveredCategory === slice.category;
                    return (
                      <circle
                        key={slice.category}
                        cx="80"
                        cy="80"
                        r="60"
                        fill="none"
                        stroke={slice.color}
                        strokeWidth={isHovered ? 24 : 18}
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredCategory(slice.category)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      />
                    );
                  })
                ) : (
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="18"
                    strokeDasharray="10 6"
                    className="opacity-20"
                  />
                )}
              </svg>

              {/* Centre du Camembert */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                {hoveredCategory && CATEGORY_CONFIG[hoveredCategory] ? (
                  <>
                    <span className="text-2xl mb-1">{CATEGORY_CONFIG[hoveredCategory].icon}</span>
                    <span className="text-[11px] font-bold text-zinc-300 truncate max-w-[120px]">
                      {CATEGORY_CONFIG[hoveredCategory].label}
                    </span>
                    <span className="text-sm font-extrabold font-mono text-zinc-100">
                      {formatCurrency(budgetStats.categoryBreakdown[hoveredCategory] || 0)}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {budgetStats.totalExpenses > 0
                        ? `${Math.round(
                            ((budgetStats.categoryBreakdown[hoveredCategory] || 0) /
                              budgetStats.totalExpenses) *
                              100
                          )}% du total`
                        : '0%'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                      Total Sorties
                    </span>
                    <span className="text-lg sm:text-xl font-black font-mono text-zinc-100 tracking-tight mt-0.5">
                      {formatCurrency(budgetStats.totalExpenses)}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {budgetStats.percentUsed}% du plafond
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Légende rapide sous le camembert */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 max-w-xs">
              {(Object.keys(CATEGORY_CONFIG) as BudgetCategory[])
                .filter((cat) => (budgetStats.categoryBreakdown[cat] || 0) > 0)
                .map((cat) => {
                  const conf = CATEGORY_CONFIG[cat];
                  const isHovered = hoveredCategory === cat;
                  return (
                    <button
                      key={cat}
                      onMouseEnter={() => setHoveredCategory(cat)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isHovered
                          ? 'bg-zinc-800 border-zinc-500 text-white shadow-sm'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: conf.hex }} />
                      <span>{conf.label}</span>
                    </button>
                  );
                })}
              {budgetStats.totalExpenses === 0 && (
                <span className="text-xs text-zinc-500 italic">
                  Aucune dépense enregistrée ce mois-ci
                </span>
              )}
            </div>
          </div>

          {/* Grille des catégories avec barres de progression */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(Object.keys(CATEGORY_CONFIG) as BudgetCategory[]).map((cat) => {
              const amount = budgetStats.categoryBreakdown[cat] || 0;
              const percent =
                budgetStats.totalExpenses > 0
                  ? Math.round((amount / budgetStats.totalExpenses) * 100)
                  : 0;
              const conf = CATEGORY_CONFIG[cat];
              const isHovered = hoveredCategory === cat;

              return (
                <div
                  key={cat}
                  onMouseEnter={() => setHoveredCategory(cat)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                    isHovered
                      ? 'bg-zinc-900 border-zinc-600 shadow-md ring-1 ring-zinc-600'
                      : theme === 'dark'
                      ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                      : 'bg-zinc-50 border-zinc-200'
                  }`}
                  onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{conf.icon}</span>
                      <span className="text-xs font-semibold text-zinc-200 truncate">
                        {conf.label}
                      </span>
                    </div>
                    <span className="text-xs font-bold font-mono text-zinc-400">{percent}%</span>
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="text-xs font-bold font-mono text-zinc-100">
                      {formatCurrency(amount)}
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, backgroundColor: conf.hex }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Historique des Transactions & Filtres */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border transition-all space-y-5 ${
          theme === 'dark'
            ? 'bg-zinc-900/60 border-zinc-800/80'
            : 'bg-white border-zinc-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Historique des Opérations ({filteredTransactions.length})</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Consultez, filtrez et gérez vos entrées et sorties
            </p>
          </div>

          {/* Recherche & Filtre type */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-emerald-500 w-36 sm:w-48"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Tous types</option>
              <option value="expense">Dépenses uniquement</option>
              <option value="income">Revenus uniquement</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Toutes catégories</option>
              {(Object.keys(CATEGORY_CONFIG) as BudgetCategory[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_CONFIG[c].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Liste des transactions */}
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            Aucune opération ne correspond à votre recherche.
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[600px] border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-800/80 text-xs text-zinc-400">
                  <th className="py-2.5 px-3 font-medium">Date</th>
                  <th className="py-2.5 px-3 font-medium">Description</th>
                  <th className="py-2.5 px-3 font-medium">Catégorie</th>
                  <th className="py-2.5 px-3 text-right font-medium">Montant</th>
                  <th className="py-2.5 px-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 text-sm">
                {filteredTransactions.map((tx) => {
                  const conf = CATEGORY_CONFIG[tx.category];
                  const isIncome = tx.type === 'income';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-zinc-800/30 transition-colors group"
                    >
                      <td className="py-3 px-3 text-xs text-zinc-400 font-mono">
                        {tx.date}
                      </td>
                      <td className="py-3 px-3 font-semibold text-zinc-200">
                        {tx.description}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 w-fit ${conf.color}`}
                        >
                          <span>{conf.icon}</span>
                          <span>{conf.label}</span>
                        </span>
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono font-bold ${
                          isIncome ? 'text-emerald-400' : 'text-zinc-200'
                        }`}
                      >
                        {isIncome ? `+ ${formatCurrency(tx.amount)}` : `- ${formatCurrency(tx.amount)}`}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => deleteTransaction(tx.id)}
                          className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Supprimer la transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal : Nouvelle Opération */}
      {isAddTxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-zinc-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Nouvelle Opération
              </h3>
              <button
                onClick={() => setIsAddTxOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTx} className="space-y-4">
              {/* Type (Dépense vs Revenu) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                    txType === 'expense'
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-sm'
                      : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Dépense
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                    txType === 'income'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                      : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  Revenu
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  Description / Intitulé
                </label>
                <input
                  type="text"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder="Ex : Courses Carrefour"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">
                    Montant (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="45.50"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  Catégorie
                </label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value as BudgetCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  {(Object.keys(CATEGORY_CONFIG) as BudgetCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTxOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal : Modifier le Plafond */}
      {isEditGoalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-zinc-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Plafond Budgétaire Mensuel
              </h3>
              <button
                onClick={() => setIsEditGoalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateGoal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  Budget Maximum Recommandé (€)
                </label>
                <input
                  type="number"
                  value={newGoalInput}
                  onChange={(e) => setNewGoalInput(e.target.value)}
                  placeholder="1400"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditGoalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tutoriel */}
      <BudgetTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </div>
  );
}
