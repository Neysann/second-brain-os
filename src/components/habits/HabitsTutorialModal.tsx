'use client';

import React from 'react';
import { X, Flame, CheckCircle2, Target, Plus, Zap, Award, Sparkles } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface HabitsTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HabitsTutorialModal: React.FC<HabitsTutorialModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[88vh] transition-all relative ${
          theme === 'dark'
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100 shadow-purple-950/20'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-inherit flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                Tutoriel : Page Habitude
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-semibold">
                  Guide Pratique
                </span>
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Comment tirer le meilleur parti de vos rituels quotidiens, sprints et flamme de régularité.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin text-xs sm:text-sm">
          {/* Étape 1 : Rituels & Suivi Quotidien */}
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-2">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>1. Vos Rituels & Validation Quotidienne</span>
            </div>
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-xs">
              Chaque habitude dispose de son identité visuelle et d'actions rapides :
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-400 text-xs">
              <li>
                <strong className="text-zinc-900 dark:text-white">Validation du jour :</strong> Cliquez sur le bouton <span className="font-semibold text-emerald-600 dark:text-emerald-400">« Valider aujourd'hui »</span> ou <span className="font-semibold">« Tout valider »</span> pour cocher en un instant.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-white">Bandeau des 7 jours :</strong> Cliquez directement sur n'importe quel jour de la semaine pour régulariser une journée passée.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-white">Statistiques en direct :</strong> Le taux d'adhérence (%) et la flamme se mettent à jour automatiquement.
              </li>
            </ul>
          </div>

          {/* Étape 2 : Méthode Sprint 10 Jours */}
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold">
              <Zap className="w-4 h-4" />
              <span>2. La Méthode des Sprints de 10 Jours</span>
            </div>
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-xs">
              Découper vos routines en cycles courts de 10 jours élimine la lassitude mentale et garantit un engagement maximal.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-400 text-xs">
              <li>Cochez vos cases au fil des 10 jours dans le tableau de sprint actif.</li>
              <li>À la fin des 10 jours, cliquez sur <strong className="text-zinc-900 dark:text-white">« Nouveau Cycle (10j) »</strong> pour renouveler vos objectifs ou ajuster vos habitudes.</li>
            </ul>
          </div>

          {/* Étape 3 : Flamme Duolingo */}
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
              <Award className="w-4 h-4" />
              <span>3. Série Consécutive (Flamme de Régularité)</span>
            </div>
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-xs">
              La flamme compte vos jours d'accomplissement ininterrompus. Validez au moins une habitude par jour pour maintenir votre flamme allumée et battre votre record personnel.
            </p>
          </div>

          {/* Étape 4 : Personnalisation */}
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-2">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold">
              <Plus className="w-4 h-4" />
              <span>4. Créer vos Propres Habitudes</span>
            </div>
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-xs">
              Utilisez le bouton <strong className="text-zinc-900 dark:text-white">« Nouvelle Habitude »</strong> pour choisir un intitulé personnalisé, un émoji représentatif, une catégorie et une couleur dédiée.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-inherit flex items-center justify-end bg-zinc-50 dark:bg-zinc-950/80">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
          >
            J'ai compris, commencer !
          </button>
        </div>
      </div>
    </div>
  );
};

export default HabitsTutorialModal;
