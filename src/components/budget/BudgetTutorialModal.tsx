'use client';

import React from 'react';
import { X, Wallet, PieChart, Target, Plus, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface BudgetTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetTutorialModal: React.FC<BudgetTutorialModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[88vh] transition-all relative ${
          theme === 'dark'
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100 shadow-emerald-950/30'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-inherit flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                Tutoriel : Page Budget
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-semibold">
                  Guide Financier
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Prenez le contrôle de vos finances personnelles simplement et visuellement.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin text-xs sm:text-sm">
          {/* Étape 1 : Solde Net & KPI */}
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ArrowDownLeft className="w-4 h-4" />
              <span>1. Solde Net & Équilibre Mensuel</span>
            </div>
            <p className="text-zinc-300 leading-relaxed text-xs">
              Le système calcule en temps réel vos entrées et sorties pour vous indiquer votre trésorerie nette :
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400 text-xs">
              <li>
                <strong className="text-emerald-400">Total Revenus :</strong> Somme de vos salaires, ventes ou rentrées d'argent.
              </li>
              <li>
                <strong className="text-rose-400">Total Dépenses :</strong> Somme de toutes vos sorties du mois.
              </li>
              <li>
                <strong className="text-white">Solde Net :</strong> Si le chiffre est vert, vous épargnez. S'il est rouge, vous êtes en déficit.
              </li>
            </ul>
          </div>

          {/* Étape 2 : Plafond Mensuel */}
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <Target className="w-4 h-4" />
              <span>2. Plafond Alloué & Jauge de Consommation</span>
            </div>
            <p className="text-zinc-300 leading-relaxed text-xs">
              Définissez votre budget cible à ne pas dépasser via le bouton <strong className="text-white">« Plafond Mensuel »</strong>. La jauge s'adapte automatiquement :
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400 text-xs">
              <li><strong className="text-emerald-400">Verte :</strong> Dépenses sous contrôle (&lt; 80% du plafond).</li>
              <li><strong className="text-amber-400">Orange :</strong> Vigilance requise (entre 80% et 100%).</li>
              <li><strong className="text-rose-400">Rouge :</strong> Dépassement de budget (&gt; 100%).</li>
            </ul>
          </div>

          {/* Étape 3 : Camembert SVG */}
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-2">
            <div className="flex items-center gap-2 text-teal-400 font-bold">
              <PieChart className="w-4 h-4" />
              <span>3. Camembert Interactif des Dépenses</span>
            </div>
            <p className="text-zinc-300 leading-relaxed text-xs">
              Visualisez instantanément la répartition de vos dépenses :
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400 text-xs">
              <li>Chaque catégorie possède son code couleur distinct (Alimentation, Logement, Transports, Loisirs, etc.).</li>
              <li><strong className="text-white">Survol interactif :</strong> Passez la souris sur un quartier pour voir le détail et le montant au centre du camembert.</li>
              <li><strong className="text-white">Filtrage instantané :</strong> Cliquez sur une catégorie pour filtrer automatiquement le tableau des opérations.</li>
            </ul>
          </div>

          {/* Étape 4 : Ajout d'opérations */}
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold">
              <Plus className="w-4 h-4" />
              <span>4. Enregistrer des Opérations</span>
            </div>
            <p className="text-zinc-300 leading-relaxed text-xs">
              Cliquez sur <strong className="text-white">« Nouvelle Opération »</strong> pour saisir le montant, le type (Dépense ou Revenu), la catégorie et la date. L'opération apparaît immédiatement dans l'historique et recalcule tous les graphiques.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-inherit flex items-center justify-end bg-zinc-950/80">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            J'ai compris, gérer mon budget !
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetTutorialModal;
