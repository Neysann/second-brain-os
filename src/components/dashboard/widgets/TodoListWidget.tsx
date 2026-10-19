'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CheckSquare, Plus, ChevronRight, Check, Settings } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useSettings } from '@/context/SettingsContext';
import { TodoListWidgetSettings } from '@/types/dashboard';

interface TodoListWidgetProps {
  settings?: TodoListWidgetSettings;
  onOpenSettings?: () => void;
}

export const TodoListWidget: React.FC<TodoListWidgetProps> = ({
  settings,
  onOpenSettings,
}) => {
  const { settings: appSettings } = useSettings();
  const isNothing = appSettings?.uiStyle === 'nothing';
  const { tasks, toggleTaskStatus, addTask } = useData();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filter = settings?.filter || 'all';
  const hideCompleted = settings?.hideCompleted ?? false;
  const maxItems = settings?.maxItems || 4;

  // Filtrer et trier les tâches selon les préférences
  const displayedTasks = useMemo(() => {
    const priorityWeights: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };

    let filtered = [...tasks];
    if (filter === 'urgent') {
      filtered = filtered.filter((t) => t.priority === 'urgent');
    } else if (filter === 'high') {
      filtered = filtered.filter((t) => t.priority === 'urgent' || t.priority === 'high');
    }

    if (hideCompleted) {
      filtered = filtered.filter((t) => t.status !== 'done');
    }

    const pending = filtered
      .filter((t) => t.status !== 'done')
      .sort((a, b) => (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0));
    const completed = filtered.filter((t) => t.status === 'done');

    return [...pending, ...completed].slice(0, maxItems);
  }, [tasks, filter, hideCompleted, maxItems]);

  const pendingCount = useMemo(() => tasks.filter((t) => t.status !== 'done').length, [tasks]);

  const handleQuickAdd = async () => {
    if (!newTitle.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addTask({
        title: newTitle.trim(),
        status: 'todo',
        priority: filter === 'urgent' ? 'urgent' : 'high',
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
    if (isNothing) {
      switch (priority) {
        case 'urgent':
        case 'high':
          return (
            <span className="px-2 py-0.5 rounded-full text-[8px] font-ndot uppercase tracking-wider bg-[#D71920]/20 text-[#D71920] border border-[#D71920]/40">
              {priority === 'urgent' ? 'URGENT' : 'HIGH'}
            </span>
          );
        case 'medium':
          return (
            <span className="px-2 py-0.5 rounded-full text-[8px] font-ndot uppercase tracking-wider bg-white/10 text-zinc-300 border border-white/20">
              MED
            </span>
          );
        default:
          return (
            <span className="px-2 py-0.5 rounded-full text-[8px] font-ndot uppercase tracking-wider bg-zinc-900 text-zinc-500 border border-white/10">
              LOW
            </span>
          );
      }
    }

    switch (priority) {
      case 'urgent':
      case 'high':
        return (
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
            {priority === 'urgent' ? 'Urgent' : 'Haute'}
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
    <div className={`flex flex-col h-full justify-between p-3 select-none group/widget ${isNothing ? 'font-ntype' : ''}`}>
      {/* En-tête */}
      <div className={`flex items-center justify-between text-[11px] font-semibold mb-2 ${isNothing ? 'font-ndot text-zinc-400 tracking-wider' : 'text-zinc-500 dark:text-zinc-400'}`}>
        <span className="flex items-center gap-1.5">
          {isNothing ? (
            <span className="nothing-red-dot" />
          ) : (
            <CheckSquare className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          )}
          <span className={isNothing ? 'text-zinc-200 uppercase' : 'text-zinc-800 dark:text-zinc-200'}>
            {isNothing ? 'TASKS // LIST' : 'To-do list'}
          </span>
          <span className={`text-[10px] ${isNothing ? 'font-ndot text-zinc-400' : 'font-mono text-zinc-400 dark:text-zinc-500'}`}>
            ({pendingCount})
          </span>
        </span>
        <div className="flex items-center gap-1.5">
          <Link
            href="/tasks"
            className={`text-[10px] transition-colors flex items-center gap-0.5 ${
              isNothing
                ? 'font-ndot uppercase tracking-wider text-zinc-400 hover:text-white'
                : 'text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400'
            }`}
          >
            {isNothing ? 'VIEW ALL' : 'Voir tout'} <ChevronRight className="w-2.5 h-2.5" />
          </Link>
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className={`p-0.5 rounded opacity-60 hover:opacity-100 transition-opacity cursor-pointer ${
                isNothing ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-indigo-500'
              }`}
              title="Options des tâches"
            >
              <Settings className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* Liste des tâches */}
      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[140px] pr-1 scrollbar-thin">
        {displayedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-400 text-xs py-4 text-center">
            <Check className={`w-6 h-6 mb-1 ${isNothing ? 'text-white' : 'text-emerald-500/60'}`} />
            <span className={isNothing ? 'font-ndot uppercase text-[10px] tracking-wider' : ''}>
              {isNothing ? 'ALL TASKS COMPLETED' : `Aucune tâche ${filter !== 'all' ? `(${filter})` : 'à faire'} !`}
            </span>
          </div>
        ) : (
          displayedTasks.map((task) => {
            const isDone = task.status === 'done';
            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-1.5 rounded-xl transition-colors group ${
                  isNothing
                    ? 'bg-zinc-950 hover:bg-zinc-900 border border-white/10 hover:border-white/20'
                    : 'bg-zinc-50/90 dark:bg-zinc-950/60 hover:bg-zinc-100/90 dark:hover:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800/80'
                }`}
              >
                <div className="flex items-center gap-2 truncate mr-2">
                  <button
                    type="button"
                    onClick={() => toggleTaskStatus(task.id)}
                    className={`w-4 h-4 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                      isNothing
                        ? isDone
                          ? 'rounded-md bg-[#D71920] text-white border border-[#D71920] shadow-[0_0_8px_rgba(215,25,32,0.5)]'
                          : 'rounded-md border border-white/20 hover:border-white/50 bg-black'
                        : isDone
                        ? 'rounded-full bg-purple-600 text-white shadow-xs'
                        : 'rounded-full border border-zinc-300 dark:border-zinc-700 hover:border-purple-500'
                    }`}
                    title={isDone ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
                  >
                    {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </button>
                  <Link
                    href="/tasks"
                    className={`text-xs truncate font-medium ${
                      isDone
                        ? 'line-through text-zinc-500'
                        : isNothing
                        ? 'text-zinc-200 hover:text-white'
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
            placeholder={isNothing ? "NEW TASK..." : "Nouvelle tâche..."}
            autoFocus
            className={`flex-1 rounded-lg px-2.5 py-1 text-xs focus:outline-none ${
              isNothing
                ? 'bg-zinc-950 border border-white/20 text-white placeholder:text-zinc-600 focus:border-white font-ntype'
                : 'bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-indigo-500'
            }`}
          />
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isSubmitting || !newTitle.trim()}
            className={`p-1 rounded-lg text-white cursor-pointer shadow-xs disabled:opacity-50 ${
              isNothing
                ? 'bg-white text-black hover:bg-zinc-200'
                : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className={`mt-2 py-1 px-2.5 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer w-fit shadow-xs ${
            isNothing
              ? 'rounded-full font-ndot uppercase tracking-wider text-zinc-300 hover:text-white bg-zinc-950 hover:bg-zinc-900 border border-white/10 hover:border-white/30'
              : 'rounded-xl text-zinc-700 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900/40 hover:bg-zinc-200 dark:hover:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800/60'
          }`}
        >
          <Plus className="w-3 h-3" />
          <span>{isNothing ? 'ADD TASK' : 'Nouvelle tâche'}</span>
        </button>
      )}
    </div>
  );
};

export default TodoListWidget;
