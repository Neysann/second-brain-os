'use client';

import React, { useState, useEffect } from 'react';
import { X, FolderGit2, Trash2 } from 'lucide-react';
import { Project, ProjectStatus, ParaCategory } from '@/types';
import { useData } from '@/context/DataContext';
import { useTheme } from '@/context/ThemeContext';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: Project | null;
  defaultCategory?: ParaCategory;
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#71717a', // Zinc
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  projectToEdit,
  defaultCategory = 'project',
}) => {
  const { addProject, updateProject, deleteProject } = useData();
  const { theme } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ParaCategory>(defaultCategory);
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [color, setColor] = useState('#6366f1');
  const [deadline, setDeadline] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      setTitle(projectToEdit.title);
      setDescription(projectToEdit.description || '');
      setCategory(projectToEdit.category);
      setStatus(projectToEdit.status);
      setColor(projectToEdit.color || '#6366f1');
      setDeadline(projectToEdit.deadline || '');
      setTagsInput(projectToEdit.tags?.join(', ') || '');
    } else {
      setTitle('');
      setDescription('');
      setCategory(defaultCategory);
      setStatus('active');
      setColor('#6366f1');
      setDeadline('');
      setTagsInput('');
    }
  }, [projectToEdit, defaultCategory, isOpen]);

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
      if (projectToEdit) {
        await updateProject({
          ...projectToEdit,
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          status,
          color,
          deadline: deadline || undefined,
          tags,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await addProject({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          status,
          color,
          deadline: deadline || undefined,
          tags,
        });
      }
      onClose();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement du projet :', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!projectToEdit) return;
    if (confirm('Voulez-vous vraiment supprimer ce projet ?')) {
      await deleteProject(projectToEdit.id);
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
            <FolderGit2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <h2 className="text-base font-semibold">
              {projectToEdit ? 'Modifier le projet' : 'Nouveau projet PARA'}
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
              Nom du projet / Titre *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Refonte du système Syntropy..."
              className={inputClasses}
              autoFocus
            />
          </div>

          <div>
            <label className={labelClasses}>
              Objectif / Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Critères de succès, portée ou périmètre..."
              className={`${inputClasses} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClasses}>
                Catégorie PARA
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ParaCategory)}
                className={inputClasses}
              >
                <option value="project">Projet (Échéance fixe)</option>
                <option value="area">Domaine (Responsabilité)</option>
                <option value="resource">Ressource (Sujet)</option>
                <option value="archive">Archive (Inactif)</option>
              </select>
            </div>

            <div>
              <label className={labelClasses}>
                Statut
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className={inputClasses}
              >
                <option value="active">Actif</option>
                <option value="on_hold">En pause</option>
                <option value="completed">Terminé</option>
                <option value="archived">Archivé</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClasses}>
              Couleur d'identification
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-lg transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-indigo-500 shadow-lg' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClasses}>
                Date limite
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={inputClasses}
              />
            </div>

            <div>
              <label className={labelClasses}>
                Tags
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Next.js, dev, Q4"
                className={inputClasses}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-inherit">
            {projectToEdit ? (
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
                {isSubmitting ? 'Enregistrement...' : projectToEdit ? 'Mettre à jour' : 'Créer le projet'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
