'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Wallet, ChevronRight, ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useDailyLife } from '@/context/DailyLifeContext';
import { WidgetSize } from '@/types/dashboard';
import { BudgetCategory } from '@/types/dailyLife';

const CATEGORY_COLORS: Record<BudgetCategory, { label: string; icon: string; hex: string }> = {
  logement: { label: 'Logement', icon: '🏠', hex: '#3b82f6' },
  alimentation: { label: 'Courses', icon: '🥑', hex: '#10b981' },
  transport: { label: 'Transport', icon: '🚆', hex: '#f59e0b' },
  loisirs: { label: 'Loisirs', icon: '🍿', hex: '#f43f5e' },
  abonnements: { label: 'Abonnements', icon: '⚡', hex: '#6366f1' },
  sante: { label: 'Santé', icon: '🧘', hex: '#14b8a6' },
  epargne: { label: 'Épargne', icon: '🌱', hex: '#a855f7' },
  autre: { label: 'Divers', icon: '📦', hex: '#71717a' },
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(val);
};

interface BudgetMiniWidgetProps {
  size?: WidgetSize;
}

export const BudgetMiniWidget: React.FC<BudgetMiniWidgetProps> = ({ size = 'small' }) => {
  const { budgetStats } = useDailyLife();

  // Calcul des segments du Camembert (Donut)
  const donutSlices = useMemo(() => {
    const total = budgetStats.totalExpenses;
    const radius = size === 'small' ? 18 : 32;
    const circumference = 2 * Math.PI * radius;

    if (total <= 0) return [];

    const categories = Object.keys(CATEGORY_COLORS) as BudgetCategory[];
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
          color: CATEGORY_COLORS[cat].hex,
          strokeDasharray: `${strokeLength} ${circumference - strokeLength}`,
          strokeDashoffset: -accumulatedOffset,
        };
        accumulatedOffset += strokeLength;
        return slice;
      })
      .filter((s) => s.amount > 0);
  }, [budgetStats.categoryBreakdown, budgetStats.totalExpenses, size]);

  // Top 3 des catégories de dépenses pour les tailles medium/large
  const topCategories = useMemo(() => {
    const categories = Object.keys(CATEGORY_COLORS) as BudgetCategory[];
    return categories
      .map((cat) => ({
        category: cat,
        amount: budgetStats.categoryBreakdown[cat] || 0,
        ...CATEGORY_COLORS[cat],
      }))
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [budgetStats.categoryBreakdown]);

  // ==================== RENDU TAILLES MEDIUM & LARGE (ONEUI STYLE) ====================
  if (size === 'medium' || size === 'large') {
    return (
      <div className="flex flex-col h-full justify-between p-3.5 select-none bg-gradient-to-br from-zinc-50/90 via-white to-zinc-50/90 dark:from-zinc-950 dark:via-zinc-900/90 dark:to-zinc-950 rounded-2xl">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Budget</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                budgetStats.percentUsed > 100
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : budgetStats.percentUsed > 80
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              }`}
            >
              {budgetStats.percentUsed}% alloué
            </span>
          </div>
        </div>

        {/* Corps : Camembert à gauche + Solde & Top Catégories à droite */}
        <div className="grid grid-cols-12 gap-3 items-center my-auto py-1">
          {/* Camembert SVG */}
          <div className="col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  className="stroke-zinc-200 dark:stroke-zinc-800/80"
                  strokeWidth="10"
                  fill="none"
                />
                {donutSlices.length > 0 ? (
                  donutSlices.map((slice) => (
                    <circle
                      key={slice.category}
                      cx="40"
                      cy="40"
                      r="32"
                      fill="none"
                      stroke={slice.color}
                      strokeWidth="10"
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      strokeLinecap="round"
                    />
                  ))
                ) : (
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray="6 4"
                    className="opacity-25"
                  />
                )}
              </svg>

              {/* Centre du Camembert */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] font-black font-mono text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(budgetStats.totalExpenses)}
                </span>
                <span className="text-[8px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold tracking-wider">
                  Dépenses
                </span>
              </div>
            </div>
          </div>

          {/* Détails : Solde & Répartition */}
          <div className="col-span-7 space-y-2">
            <div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-medium block">
                Solde Net
              </span>
              <div
                className={`text-lg sm:text-xl font-black font-mono tracking-tight leading-tight ${
                  budgetStats.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatCurrency(budgetStats.balance)}
              </div>
            </div>

            {/* Top 3 catégories ou indicateur */}
            <div className="space-y-1">
              {topCategories.length > 0 ? (
                topCategories.map((cat) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between text-[10px] text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat.hex }}
                      />
                      <span className="truncate">{cat.label}</span>
                    </span>
                    <span className="font-mono font-semibold text-zinc-500 dark:text-zinc-400">
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-zinc-500 italic">
                  Aucune dépense ce mois-ci
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pied : Barre de plafond + Lien */}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
            <span>Plafond : {formatCurrency(budgetStats.budgetGoal)}</span>
          </div>

          <Link
            href="/budget"
            className="text-[10px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold flex items-center gap-0.5 transition-colors"
          >
            <span>Détail complet</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  // ==================== RENDU TAILLE SMALL (COMPACTE AVEC MINI CAMEMBERT) ====================
  return (
    <div className="flex flex-col h-full justify-between p-3 select-none">
      {/* En-tête */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>Budget</span>
        </span>
        <span
          className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded-full ${
            budgetStats.percentUsed > 100
              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
              : budgetStats.percentUsed > 80
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {budgetStats.percentUsed}%
        </span>
      </div>

      {/* Corps avec mini Camembert SVG + Solde Net */}
      <div className="my-auto py-1 flex items-center gap-2.5">
        {/* Mini Camembert SVG */}
        <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="18"
              className="stroke-zinc-200 dark:stroke-zinc-800"
              strokeWidth="6"
              fill="none"
            />
            {donutSlices.length > 0 ? (
              donutSlices.map((slice) => (
                <circle
                  key={slice.category}
                  cx="24"
                  cy="24"
                  r="18"
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="6"
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  strokeLinecap="round"
                />
              ))
            ) : (
              <circle
                cx="24"
                cy="24"
                r="18"
                fill="none"
                stroke="#10b981"
                strokeWidth="6"
                strokeDasharray="4 3"
                className="opacity-30"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[9px] font-black font-mono text-zinc-800 dark:text-zinc-300">
              {budgetStats.percentUsed}%
            </span>
          </div>
        </div>

        {/* Chiffres */}
        <div className="min-w-0 flex-1">
          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase font-medium block truncate">
            Solde Net
          </span>
          <div
            className={`text-base sm:text-lg font-black font-mono tracking-tight truncate leading-tight ${
              budgetStats.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(budgetStats.balance)}
          </div>
          <div className="text-[9px] text-zinc-500 font-mono truncate">
            Sorties : {formatCurrency(budgetStats.totalExpenses)}
          </div>
        </div>
      </div>

      {/* Pied : Lien Budget complet */}
      <div className="text-center pt-1 border-t border-zinc-200 dark:border-zinc-800/80">
        <Link
          href="/budget"
          className="text-[10px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium flex items-center justify-center gap-0.5 transition-colors"
        >
          <span>Gérer le budget</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};

export default BudgetMiniWidget;
