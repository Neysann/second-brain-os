'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CheckSquare, Plus, ChevronRight, Check, Settings, ListTodo, Flame } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useSettings } from '@/context/SettingsContext';
import { TodoListWidgetSettings, WidgetSize } from '@/types/dashboard';

interface TodoListWidgetProps {
  size?: WidgetSize;
  settings?: TodoListWidgetSettings;
  onOpenSettings?: () => void;
}

export const TodoListWidget: React.FC<TodoListWidgetProps> = ({
  size = 'medium',
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
  const maxItems = size === 'small' ? 3 : size === 'large' || size === 'full' ? 12 : 5;

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
  const doneCount = useMemo(() => tasks.filter((t) => t.status === 'done').length, [tasks]);

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
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300/40 dark:border-zinc-700/40">
            Basse
          </span>
        );
    }
  };

  // =========================================================================
  // 1. AFFICHAGE SMALL (1x1) : Top Tâches d'Urgence & Compteur Restant
  // =========================================================================
  if (size === 'small') {
    return (
      <div className="flex flex-col h-full justify-between p-3 select-none">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
            <span>À Faire</span>
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-500/15 text-indigo-400 font-bold">
            {pendingCount}
          </span>
        </div>

        <div className="space-y-1.5 my-auto overflow-hidden">
          {displayedTasks.slice(0, 2).map((task) => {
            const isDone = task.status === 'done';
            return (
              <div
                key={task.id}
                onClick={() => toggleTaskStatus(task.id)}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 cursor-pointer hover:border-indigo-500/40 transition-all"
              >
                <div
                  className={`w-3.5 h-3.5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                    isDone ? 'bg-indigo-600 text-white' : 'border border-zinc-400 dark:border-zinc-600'
                  }`}
                >
                  {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span className={`text-xs truncate ${isDone ? 'line-through text-zinc-500' : 'text-zinc-800 dark:text-zinc-200 font-medium'}`}>
                  {task.title}
                </span>
              </div>
            );
          })}
          {displayedTasks.length === 0 && (
            <span className="text-xs text-zinc-500 italic block py-1">Toutes les tâches terminées 🎉</span>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-200 dark:border-zinc-800">
          <span>{doneCount} achevée(s)</span>
          <Link href="/tasks" className="text-indigo-500 hover:underline font-semibold flex items-center gap-0.5">
            Voir tout <ChevronRight className="w-2.5 h-2.5" />
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. AFFICHAGE MEDIUM (2x1) : Liste de Travail Rapide & Saisie Directe
  // =========================================================================
  if (size === 'medium') {
    return (
      <div className="flex flex-col h-full justify-between p-3.5 select-none space-y-2">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
            <CheckSquare className="w-4 h-4 text-indigo-500" />
            <span>To-Do List</span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-indigo-500/15 text-indigo-400 font-bold">
              {pendingCount} restantes
            </span>
          </div>

          <Link href="/tasks" className="text-[11px] text-zinc-400 hover:text-indigo-400 transition-colors flex items-center gap-0.5">
            Kanban <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[140px] pr-1 scrollbar-thin">
          {displayedTasks.map((task) => {
            const isDone = task.status === 'done';
            return (
              <div
                key={task.id}
                className="flex items-center justify-between p-1.5 rounded-xl bg-zinc-50/90 dark:bg-zinc-900/50 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800/60 transition-colors"
              >
                <div className="flex items-center gap-2 truncate mr-1">
                  <button
                    onClick={() => toggleTaskStatus(task.id)}
                    className={`w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${
                      isDone ? 'bg-indigo-600 text-white shadow-xs' : 'border border-zinc-300 dark:border-zinc-700 hover:border-indigo-500'
                    }`}
                  >
                    {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </button>
                  <span className={`text-xs truncate font-medium ${isDone ? 'line-through text-zinc-500' : 'text-zinc-800 dark:text-zinc-200'}`}>
                    {task.title}
                  </span>
                </div>
                {getPriorityBadge(task.priority)}
              </div>
            );
          })}
        </div>

        {isAdding ? (
          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nouvelle tâche..."
              autoFocus
              className="flex-1 rounded-xl px-2.5 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleQuickAdd}
              disabled={isSubmitting || !newTitle.trim()}
              className="p-1 rounded-xl bg-indigo-600 text-white cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-indigo-400 cursor-pointer w-fit shadow-xs transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Nouvelle tâche</span>
          </button>
        )}
      </div>
    );
  }

  // =========================================================================
  // 3. AFFICHAGE LARGE & FULL (2x2 ou 4x1) : Mini Kanban Multi-Colonnes
  // =========================================================================
  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <div className="flex flex-col h-full p-4 select-none space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ListTodo className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <span>Gestion des Tâches</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-semibold">
                {pendingCount} en attente • {doneCount} terminées
              </span>
            </h3>
          </div>
        </div>

        <Link
          href="/tasks"
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          <span>Tableau Kanban complet</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 min-h-0">
        {/* Colonne 1 : À Faire */}
        <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400">À FAIRE ({todoTasks.length})</span>
            <button onClick={() => setIsAdding(true)} className="text-indigo-400 hover:text-indigo-300">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1.5 overflow-y-auto max-h-[170px] pr-1 scrollbar-thin flex-1">
            {todoTasks.slice(0, 5).map((t) => (
              <div
                key={t.id}
                onClick={() => toggleTaskStatus(t.id)}
                className="p-2 rounded-xl bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between cursor-pointer"
              >
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{t.title}</span>
                {getPriorityBadge(t.priority)}
              </div>
            ))}
          </div>
        </div>

        {/* Colonne 2 : En Cours */}
        <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <span className="text-xs font-bold text-amber-500 block mb-2">EN COURS ({inProgressTasks.length})</span>
          <div className="space-y-1.5 overflow-y-auto max-h-[170px] pr-1 scrollbar-thin flex-1">
            {inProgressTasks.slice(0, 5).map((t) => (
              <div
                key={t.id}
                onClick={() => toggleTaskStatus(t.id)}
                className="p-2 rounded-xl bg-white dark:bg-zinc-950/40 border border-amber-500/30 flex items-center justify-between cursor-pointer"
              >
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{t.title}</span>
                {getPriorityBadge(t.priority)}
              </div>
            ))}
          </div>
        </div>

        {/* Colonne 3 : Terminées */}
        <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <span className="text-xs font-bold text-emerald-500 block mb-2">TERMINÉES ({doneTasks.length})</span>
          <div className="space-y-1.5 overflow-y-auto max-h-[170px] pr-1 scrollbar-thin flex-1">
            {doneTasks.slice(0, 5).map((t) => (
              <div
                key={t.id}
                onClick={() => toggleTaskStatus(t.id)}
                className="p-2 rounded-xl bg-white dark:bg-zinc-950/40 border border-emerald-500/20 flex items-center justify-between cursor-pointer opacity-75"
              >
                <span className="text-xs font-semibold line-through text-zinc-500 truncate">{t.title}</span>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoListWidget;
