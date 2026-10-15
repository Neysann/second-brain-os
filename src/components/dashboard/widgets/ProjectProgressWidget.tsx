'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Target, ChevronRight, RefreshCw, Folder } from 'lucide-react';
import { useData } from '@/context/DataContext';

export const ProjectProgressWidget: React.FC = () => {
  const { projects, tasks } = useData();
  const [selectedProjIndex, setSelectedProjIndex] = useState(0);

  // Filtrer les projets actifs en priorité
  const availableProjects = useMemo(() => {
    return projects.filter((p) => p.status !== 'archived');
  }, [projects]);

  const activeProject = availableProjects[selectedProjIndex % Math.max(1, availableProjects.length)];

  // Calcul des statistiques réelles
  const stats = useMemo(() => {
    if (activeProject) {
      const projTasks = tasks.filter((t) => t.projectId === activeProject.id);
      const total = projTasks.length;
      const done = projTasks.filter((t) => t.status === 'done').length;
      const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
      return {
        title: activeProject.title,
        total,
        done,
        percent,
        isGlobal: false,
      };
    } else {
      // Si aucun projet n'est créé, afficher la progression globale de toutes les tâches
      const total = tasks.length;
      const done = tasks.filter((t) => t.status === 'done').length;
      const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
      return {
        title: 'Tâches globales',
        total,
        done,
        percent,
        isGlobal: true,
      };
    }
  }, [activeProject, tasks]);

  // Cercle SVG circonférence
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (stats.percent / 100) * circumference;

  const handleNextProject = () => {
    if (availableProjects.length > 1) {
      setSelectedProjIndex((prev) => (prev + 1) % availableProjects.length);
    }
  };

  return (
    <div className="flex flex-col h-full justify-between p-3 select-none">
      {/* En-tête */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
          <span className="text-zinc-800 dark:text-zinc-200">Progression projet</span>
        </span>
        {availableProjects.length > 1 && (
          <button
            type="button"
            onClick={handleNextProject}
            className="text-[10px] text-zinc-500 hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-400 transition-colors flex items-center gap-0.5 cursor-pointer"
            title="Changer de projet"
          >
            <span>Suivant</span>
            <RefreshCw className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {/* Jauge circulaire SVG */}
      <div className="relative flex items-center justify-center my-auto">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="stroke-zinc-200 dark:stroke-zinc-800"
            strokeWidth="6"
            fill="transparent"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="stroke-purple-600 dark:stroke-purple-500 transition-all duration-700 ease-out"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Texte au centre de la jauge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-mono text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {stats.percent}%
          </span>
          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">
            Terminé
          </span>
        </div>
      </div>

      {/* Bas : Titre du projet et Lien */}
      <div className="text-center pt-1">
        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate px-1">
          {stats.title}
        </div>
        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mb-1">
          {stats.done} sur {stats.total} tâches
        </div>
        <Link
          href="/tasks"
          className="text-[10px] text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors font-medium inline-flex items-center gap-0.5"
        >
          <span>Voir détails</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};

export default ProjectProgressWidget;
