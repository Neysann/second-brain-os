'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Target, ChevronRight, RefreshCw, Folder, CheckCircle2, Clock } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { WidgetSize } from '@/types/dashboard';

interface ProjectProgressWidgetProps {
  size?: WidgetSize;
}

export const ProjectProgressWidget: React.FC<ProjectProgressWidgetProps> = ({ size = 'small' }) => {
  const { projects, tasks } = useData();
  const [selectedProjIndex, setSelectedProjIndex] = useState(0);

  // Filtrer les projets actifs en priorité
  const availableProjects = useMemo(() => {
    return projects.filter((p) => p.status !== 'archived');
  }, [projects]);

  const activeProject = availableProjects[selectedProjIndex % Math.max(1, availableProjects.length)];

  // Calcul des statistiques réelles pour le projet actif
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

  // ==========================================
  // VUE 1 : FORMAT SMALL (1x1) - COMPACT GAUGE
  // ==========================================
  if (size === 'small') {
    return (
      <div className="flex flex-col h-full justify-between p-3 select-none">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5 truncate">
            <Target className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
            <span className="truncate">{stats.title}</span>
          </span>
          {availableProjects.length > 1 && (
            <button
              type="button"
              onClick={handleNextProject}
              className="p-1 rounded text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer"
              title="Changer de projet"
            >
              <RefreshCw className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Jauge centrale */}
        <div className="relative flex items-center justify-center my-auto">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="30"
              className="stroke-zinc-200 dark:stroke-zinc-800"
              strokeWidth="5"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r="30"
              className="stroke-purple-600 dark:stroke-purple-500 transition-all duration-700 ease-out"
              strokeWidth="5"
              strokeDasharray={2 * Math.PI * 30}
              strokeDashoffset={2 * Math.PI * 30 - (stats.percent / 100) * (2 * Math.PI * 30)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-mono text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              {stats.percent}%
            </span>
          </div>
        </div>

        <div className="text-center text-[10px] text-zinc-500 font-mono">
          {stats.done}/{stats.total} tâches
        </div>
      </div>
    );
  }

  // ==========================================
  // VUE 2 : FORMAT LARGE / FULL (2x2 ou 4x1) - MULTI-PROJECTS DASHBOARD
  // ==========================================
  if (size === 'large' || size === 'full') {
    const projectProgressList = availableProjects.map((p) => {
      const pTasks = tasks.filter((t) => t.projectId === p.id);
      const total = pTasks.length;
      const done = pTasks.filter((t) => t.status === 'done').length;
      const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
      return { project: p, total, done, percent };
    });

    const totalAllTasks = tasks.length;
    const doneAllTasks = tasks.filter((t) => t.status === 'done').length;
    const globalPercent = totalAllTasks > 0 ? Math.round((doneAllTasks / totalAllTasks) * 100) : 0;

    return (
      <div className="flex flex-col h-full justify-between p-3.5 select-none gap-3">
        {/* En-tête large */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <span>Avancement Multi-Projets</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400">
                  Global : {globalPercent}% ({doneAllTasks}/{totalAllTasks})
                </span>
              </div>
              <div className="text-[10px] text-zinc-400">
                Suivi de vos objectifs et jalons en cours d&apos;exécution
              </div>
            </div>
          </div>

          <Link
            href="/tasks"
            className="text-[10px] font-medium px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1"
          >
            <span>Gestion des tâches</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Grille des projets avec barres de progression */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto max-h-[220px] scrollbar-thin pr-1">
          {projectProgressList.map(({ project, total, done, percent }) => (
            <div
              key={project.id}
              className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between hover:border-purple-500/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                    {project.title}
                  </span>
                  <span className="text-xs font-mono font-extrabold text-purple-600 dark:text-purple-400">
                    {percent}%
                  </span>
                </div>
                {project.description && (
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mb-2">
                    {project.description}
                  </p>
                )}
              </div>

              <div>
                <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                  <span>{done} / {total} complétées</span>
                  <span>{total - done} restantes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // VUE 3 : FORMAT MEDIUM (2x1) - CIRCLE GAUGE & STATS
  // ==========================================
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
