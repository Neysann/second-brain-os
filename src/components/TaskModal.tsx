'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Calendar, Tag, Trash2, AlertCircle } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, ParaCategory } from '@/types';
import { useData } from '@/context/DataContext';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultCategory?: ParaCategory;
  defaultStatus?: TaskStatus;
  defaultPriority?: TaskPriority;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultCategory = 'project',
  defaultStatus = 'todo',
  defaultPriority,
}) => {
  const { addTask, updateTask, deleteTask, projects } = useData();
  const { theme } = useTheme();
  const { settings } = useSettings();

  const fallbackPriority: TaskPriority = defaultPriority || settings.defaultTaskPriority || 'medium';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>(fallbackPriority);
  const [category, setCategory] = useState<ParaCategory>(defaultCategory);
  const [projectId, setProjectId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setCategory(taskToEdit.category);
      setProjectId(taskToEdit.projectId || '');
      setDueDate(taskToEdit.dueDate || '');
      setTagsInput(taskToEdit.tags?.join(', ') || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority(fallbackPriority);
      setCategory(defaultCategory);
      setProjectId('');
      setDueDate('');
      setTagsInput('');
    }
  }, [taskToEdit, defaultCategory, defaultStatus, fallbackPriority, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (taskToEdit) {
        await updateTask({
          ...taskToEdit,
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          category,
          projectId: projectId || undefined,
          dueDate: dueDate || undefined,
          tags,
          completedAt:
            status === 'done'
              ? taskToEdit.completedAt || new Date().toISOString()
              : undefined,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await addTask({
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          category,
          projectId: projectId || undefined,
          dueDate: dueDate || undefined,
          tags,
        });
      }
      onClose();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la tâche :', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!taskToEdit) return;
    if (confirm('Voulez-vous vraiment supprimer cette tâche ?')) {
      await deleteTask(taskToEdit.id);
      onClose();
    }
  };

  const inputClasses = `w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-indigo-500 transition-colors ${
    theme === 'dark'
      ? 'border-zinc-700/80 bg-zinc-950/50 text-zinc-100 placeholder:text-zinc-500'
      : 'border-zinc-300 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400'
  }`;

  const labelClasses = `block text-xs font-semibold mb-1.5 uppercase tracking-wider ${
    theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden
          ${
            theme === 'dark'
              ? 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-zinc-950/80'
              : 'bg-white border-zinc-200 text-zinc-900 shadow-xl'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-inherit">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <h2 className="text-base font-semibold">
              {taskToEdit ? 'Modifier la tâche' : 'Nouvelle tâche'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClasses}>
              Titre de la tâche *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Rédiger le rapport d'étape..."
              className={inputClasses}
              autoFocus
            />
          </div>

          <div>
            <label className={labelClasses}>
              Description / Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails, liens ou contexte..."
              className={`${inputClasses} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClasses}>
                Statut
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className={inputClasses}
              >
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="done">Terminé</option>
              </select>
            </div>

            <div>
              <label className={labelClasses}>
                Priorité
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className={inputClasses}
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente 🔥</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClasses}>
                Méthode PARA
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ParaCategory)}
                className={inputClasses}
              >
                <option value="project">Projet</option>
                <option value="area">Domaine</option>
                <option value="resource">Ressource</option>
                <option value="archive">Archive</option>
              </select>
            </div>

            <div>
              <label className={labelClasses}>
                Projet Associé
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className={inputClasses}
              >
                <option value="">Aucun projet lié</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`${labelClasses} flex items-center gap-1`}>
                <Calendar className="w-3.5 h-3.5" /> Échéance
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClasses}
              />
            </div>

            <div>
              <label className={`${labelClasses} flex items-center gap-1`}>
                <Tag className="w-3.5 h-3.5" /> Tags
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="dev, urgent, ui"
                className={inputClasses}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-inherit">
            {taskToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-3 py-2 rounded-xl hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Enregistrement...' : taskToEdit ? 'Mettre à jour' : 'Créer la tâche'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
