'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { FolderGit2, ChevronRight, Folder, Plus, CheckCircle2, Clock, ListTodo } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { WidgetSize } from '@/types/dashboard';

interface ProjectsOverviewWidgetProps {
  size?: WidgetSize;
}

export const ProjectsOverviewWidget: React.FC<ProjectsOverviewWidgetProps> = ({ size = 'medium' }) => {
  const { projects, tasks } = useData();

  // Projets réels avec calcul de progression
  const displayProjects = useMemo(() => {
    return projects.map((p, idx) => {
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
        color: p.color || '#a855f7',
      };
    });
  }, [projects, tasks]);

  // Moyenne globale d'avancement
  const averageProgress = useMemo(() => {
    if (displayProjects.length === 0) return 0;
    const sum = displayProjects.reduce((acc, p) => acc + p.progress, 0);
    return Math.round(sum / displayProjects.length);
  }, [displayProjects]);

  // =========================================================================
  // 1. AFFICHAGE SMALL (1x1) : Métrique Globale & Projets Actifs
  // =========================================================================
  if (size === 'small') {
    return (
      <div className="flex flex-col h-full justify-between p-3 select-none">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <FolderGit2 className="w-3.5 h-3.5 text-purple-500" />
            <span>Projets</span>
          </span>
          <Link href="/tasks" className="text-zinc-400 hover:text-purple-400">
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-center gap-3 my-auto">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-base font-black font-mono leading-none text-purple-400">{averageProgress}%</span>
            <span className="text-[8px] font-semibold text-zinc-400 uppercase tracking-tighter mt-0.5">Global</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block truncate">
              {displayProjects[0]?.title || 'Aucun projet'}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">
              {displayProjects[0]?.done || 0}/{displayProjects[0]?.total || 0} tâches faites
            </span>
            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-500 transition-all duration-300"
                style={{ width: `${displayProjects[0]?.progress || 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono px-0.5">
          <span>{projects.length} projet(s) PARA</span>
          <span>{tasks.length} tâches</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. AFFICHAGE MEDIUM (2x1) : Liste de Projets avec Jauges Individuelles
  // =========================================================================
  if (size === 'medium') {
    return (
      <div className="flex flex-col h-full justify-between p-3.5 select-none space-y-2">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
            <FolderGit2 className="w-4 h-4 text-purple-500" />
            <span>Projets & Objectifs</span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-purple-500/15 text-purple-400 font-bold">
              {projects.length} actifs
            </span>
          </div>

          <Link href="/tasks" className="text-[11px] text-zinc-400 hover:text-purple-400 transition-colors flex items-center gap-0.5">
            Voir tous <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {displayProjects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800">
            <span className="text-xs text-zinc-400">Aucun projet en cours</span>
          </div>
        ) : (
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[140px] pr-1 scrollbar-thin">
            {displayProjects.slice(0, 2).map((proj) => (
              <Link
                key={proj.id}
                href="/tasks"
                className="p-2.5 rounded-xl bg-zinc-50/90 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60 hover:border-purple-500/40 transition-all flex flex-col gap-1.5 group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-purple-500 transition-colors">
                    {proj.title}
                  </span>
                  <span className="text-[10px] font-mono text-purple-400 font-bold">{proj.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                  <span>{proj.done}/{proj.total} tâches</span>
                  <span>{proj.inProgress} en cours</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 3. AFFICHAGE LARGE & FULL (2x2 ou 4x1) : Matrice Complète des Projets
  // =========================================================================
  return (
    <div className="flex flex-col h-full p-4 select-none space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <FolderGit2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <span>Vue d'ensemble des Projets</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-purple-500/15 text-purple-400 border border-purple-500/30 font-semibold">
                Progression globale : {averageProgress}%
              </span>
            </h3>
          </div>
        </div>

        <Link
          href="/tasks"
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
        >
          <span>Espace Projets & Kanban</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin">
        {displayProjects.map((proj) => (
          <Link
            key={proj.id}
            href="/tasks"
            className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between hover:border-purple-500/50 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-purple-400 transition-colors">
                  {proj.title}
                </span>
                <span className="font-mono text-purple-400 font-bold text-[11px]">{proj.progress}%</span>
              </div>
              <p className="text-[10px] text-zinc-400 line-clamp-1">{proj.subtitle}</p>
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${proj.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>{proj.done} terminées</span>
                <span>{proj.inProgress} en cours</span>
                <span>{proj.todo} à faire</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProjectsOverviewWidget;
