'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { FolderGit2, ChevronRight, Folder, Plus } from 'lucide-react';
import { useData } from '@/context/DataContext';

export const ProjectsOverviewWidget: React.FC = () => {
  const { projects, tasks } = useData();

  // Projets réels avec calcul strict de leurs tâches
  const displayProjects = useMemo(() => {
    return projects.slice(0, 2).map((p, idx) => {
      const projTasks = tasks.filter((t) => t.projectId === p.id);
      const total = projTasks.length;
      const done = projTasks.filter((t) => t.status === 'done').length;
      const inProgress = projTasks.filter((t) => t.status === 'in_progress').length;
      const todo = projTasks.filter((t) => t.status === 'todo').length;
      const progress = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

      return {
        ...p,
        title: p.title || `Projet #${idx + 1}`,
        subtitle: p.description || (total > 0 ? `${total} tâches planifiées` : 'Aucune tâche assignée'),
        total,
        done,
        inProgress,
        todo,
        progress,
      };
    });
  }, [projects, tasks]);

  return (
    <div className="flex flex-col h-full justify-between p-3 select-none">
      {/* En-tête */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
        <span className="flex items-center gap-1.5">
          <FolderGit2 className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
          <span className="text-zinc-800 dark:text-zinc-200">Projets & tâches</span>
          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
            ({projects.length})
          </span>
        </span>
        <Link
          href="/tasks"
          className="text-[10px] text-zinc-500 hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-400 transition-colors flex items-center gap-0.5"
        >
          Voir tous <ChevronRight className="w-2.5 h-2.5" />
        </Link>
      </div>

      {/* Liste des Projets ou État vide */}
      {displayProjects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 my-auto">
          <Folder className="w-6 h-6 text-purple-400/60 mb-1" />
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            Aucun projet actif
          </span>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 max-w-[180px] mt-0.5">
            Créez vos projets dans la section Tâches pour suivre leur avancée.
          </p>
          <Link
            href="/tasks"
            className="mt-2 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-purple-600 text-white hover:bg-purple-500 transition-colors flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3 h-3" />
            <span>Nouveau projet</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-2 flex-1 justify-center flex flex-col">
          {displayProjects.map((proj, idx) => (
            <Link
              key={proj.id || idx}
              href="/tasks"
              className="p-2.5 rounded-xl bg-zinc-50/90 dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800/80 hover:border-purple-500/40 transition-all flex flex-col gap-2 group"
            >
              {/* Ligne 1 : Icône, Titre, Tâches et Pourcentage */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                      idx === 0
                        ? 'bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {proj.title}
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                      {proj.subtitle}
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 whitespace-nowrap">
                  <div className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {proj.done}/{proj.total} tâches
                  </div>
                  <div className="font-mono text-[11px] font-bold text-purple-600 dark:text-purple-400">
                    {proj.progress}%
                  </div>
                </div>
              </div>

              {/* Barre de Progression */}
              <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    idx === 0
                      ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${proj.progress}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsOverviewWidget;
