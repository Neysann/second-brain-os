'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CheckSquare, Plus, ChevronRight, Check } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Task } from '@/types';

export const TodoListWidget: React.FC = () => {
  const { tasks, toggleTaskStatus, addTask } = useData();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trier les tâches : les tâches à faire d'abord par priorité, puis les terminées
  const displayedTasks = useMemo(() => {
    const priorityWeights: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
    const pending = tasks
      .filter((t) => t.status !== 'done')
      .sort((a, b) => (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0));
    const completed = tasks.filter((t) => t.status === 'done');

    return [...pending, ...completed].slice(0, 4);
  }, [tasks]);

  const pendingCount = useMemo(() => tasks.filter((t) => t.status !== 'done').length, [tasks]);
  const doneCount = useMemo(() => tasks.filter((t) => t.status === 'done').length, [tasks]);

  const handleQuickAdd = async () => {
    if (!newTitle.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addTask({
        title: newTitle.trim(),
        status: 'todo',
        priority: 'high',
        category: 'project',
        tags: [],
      });
      setNewTitle('');
      setIsAdding(false);
    } catch (err) {
      console.error("Erreur lors de l'ajout de la tâche:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuickAdd();
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return (
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
            Haute
          </span>
        );
      case 'medium':
        return (
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            Moyenne
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            Basse
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full justify-between p-3 select-none">
      {/* En-tête */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
        <span className="flex items-center gap-1.5">
          <CheckSquare className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span className="text-zinc-800 dark:text-zinc-200">To-do list</span>
          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
            ({pendingCount} à faire)
          </span>
        </span>
        <Link
          href="/tasks"
          className="text-[10px] text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors flex items-center gap-0.5"
        >
          Voir tout <ChevronRight className="w-2.5 h-2.5" />
        </Link>
      </div>

      {/* Liste des tâches */}
      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[140px] pr-1 scrollbar-thin">
        {displayedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-400 text-xs py-4 text-center">
            <Check className="w-6 h-6 text-emerald-500/60 mb-1" />
            <span>Toutes vos tâches sont terminées !</span>
          </div>
        ) : (
          displayedTasks.map((task) => {
            const isDone = task.status === 'done';
            return (
              <div
                key={task.id}
                className="flex items-center justify-between p-1.5 rounded-xl bg-zinc-50/90 dark:bg-zinc-950/60 hover:bg-zinc-100/90 dark:hover:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800/80 transition-colors group"
              >
                <div className="flex items-center gap-2 truncate mr-2">
                  <button
                    type="button"
                    onClick={() => toggleTaskStatus(task.id)}
                    className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                      isDone
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'border border-zinc-300 dark:border-zinc-700 hover:border-purple-500'
                    }`}
                    title={isDone ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
                  >
                    {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </button>
                  <Link
                    href="/tasks"
                    className={`text-xs truncate font-medium ${
                      isDone
                        ? 'line-through text-zinc-400 dark:text-zinc-600'
                        : 'text-zinc-800 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    {task.title}
                  </Link>
                </div>
                <div className="flex-shrink-0">{getPriorityBadge(task.priority)}</div>
              </div>
            );
          })
        )}
      </div>

      {/* Ajout rapide ou bouton */}
      {isAdding ? (
        <div className="mt-2 flex items-center gap-1.5 animate-in fade-in duration-150">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nouvelle tâche..."
            autoFocus
            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isSubmitting || !newTitle.trim()}
            className="p-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="mt-2 py-1 px-2.5 rounded-xl text-xs font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900/40 hover:bg-zinc-200 dark:hover:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800/60 transition-all flex items-center gap-1.5 cursor-pointer w-fit shadow-xs"
        >
          <Plus className="w-3 h-3" />
          <span>Nouvelle tâche</span>
        </button>
      )}
    </div>
  );
};

export default TodoListWidget;
