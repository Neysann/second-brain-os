'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Kanban,
  List,
  Plus,
  Search,
  Filter,
  Calendar,
  Tag,
  FolderGit2,
  Check,
  Clock,
  Circle,
  MoreVertical,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Flame,
  AlertCircle,
  Layers,
  Compass,
  Archive,
  Edit2,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useTheme } from '@/context/ThemeContext';
import { Task, TaskPriority, TaskStatus, ParaCategory, Project } from '@/types';
import TaskModal from '@/components/TaskModal';
import ProjectModal from '@/components/ProjectModal';

export default function TasksPage() {
  const { tasks, projects, toggleTaskStatus, updateTask } = useData();
  const { theme } = useTheme();

  // Mode d'affichage : 'list' ou 'kanban'
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');

  // Filtres
  const [selectedCategory, setSelectedCategory] = useState<ParaCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<TaskStatus>('todo');

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  // Prise en charge des paramètres d'URL (action=new, category=...)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'new') {
        setTaskToEdit(null);
        setDefaultTaskStatus('todo');
        setIsTaskModalOpen(true);
      }
      const cat = params.get('category') as ParaCategory | null;
      if (cat && ['project', 'area', 'resource', 'archive'].includes(cat)) {
        setSelectedCategory(cat);
      }
    }
  }, []);

  // Filtrage des tâches
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Filtre PARA
      if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;
      // Filtre Statut
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      // Filtre Priorité
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      // Filtre Recherche
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(query);
        const matchDesc = task.description?.toLowerCase().includes(query) || false;
        const matchTag = task.tags?.some((t) => t.toLowerCase().includes(query)) || false;
        if (!matchTitle && !matchDesc && !matchTag) return false;
      }
      return true;
    });
  }, [tasks, selectedCategory, statusFilter, priorityFilter, searchQuery]);

  // Projets filtrés selon la catégorie PARA sélectionnée
  const currentProjects = useMemo(() => {
    if (selectedCategory === 'all') return projects;
    return projects.filter((p) => p.category === selectedCategory);
  }, [projects, selectedCategory]);

  // Colonnes Kanban
  const kanbanColumns: { id: TaskStatus; title: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'todo', title: 'À faire', icon: Circle },
    { id: 'in_progress', title: 'En cours', icon: Clock },
    { id: 'done', title: 'Terminé', icon: Check },
  ];

  // Actions de transition d'état Kanban
  const moveTaskStatus = async (task: Task, newStatus: TaskStatus) => {
    await updateTask({
      ...task,
      status: newStatus,
      completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  const openNewTaskForStatus = (status: TaskStatus) => {
    setTaskToEdit(null);
    setDefaultTaskStatus(status);
    setIsTaskModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const openEditProject = (proj: Project) => {
    setProjectToEdit(proj);
    setIsProjectModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Titre */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b transition-colors
          ${theme === 'dark' ? 'border-zinc-800/80' : 'border-zinc-200'}`}
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Syntropy • Organisation de Tâches</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>
            Projets & Tâches (PARA)
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Gérez vos actions par projets, responsabilités pérennes et ressources.
          </p>
        </div>

        {/* Boutons d'action : Nouveau Projet & Nouvelle Tâche */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              setProjectToEdit(null);
              setIsProjectModalOpen(true);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all
              ${
                theme === 'dark'
                  ? 'bg-zinc-900 hover:bg-zinc-850 border-zinc-700/80 text-zinc-300'
                  : 'bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-700'
              }`}
          >
            <FolderGit2 className="w-4 h-4 text-purple-400" />
            Nouveau Projet
          </button>

          <button
            onClick={() => {
              setTaskToEdit(null);
              setDefaultTaskStatus('todo');
              setIsTaskModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Tâche
          </button>
        </div>
      </div>

      {/* 2. Onglets PARA */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'Toutes les catégories', icon: CheckSquare },
          { id: 'project', label: 'Projets (P)', icon: FolderGit2 },
          { id: 'area', label: 'Domaines (A)', icon: Layers },
          { id: 'resource', label: 'Ressources (R)', icon: Compass },
          { id: 'archive', label: 'Archives (A)', icon: Archive },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as ParaCategory | 'all')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all
                ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-950 font-bold dark:bg-zinc-100 dark:text-zinc-950 shadow-md'
                    : theme === 'dark'
                    ? 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    : 'bg-zinc-200/60 text-zinc-600 hover:text-zinc-900 border border-zinc-200'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Section des Projets de la catégorie courante (si applicable) */}
      {currentProjects.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 flex items-center justify-between">
            <span>Dossiers & Projets ({currentProjects.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {currentProjects.map((p) => {
              const projTasks = tasks.filter((t) => t.projectId === p.id);
              const doneCount = projTasks.filter((t) => t.status === 'done').length;
              const percent = projTasks.length > 0 ? Math.round((doneCount / projTasks.length) * 100) : 0;
              return (
                <div
                  key={p.id}
                  onClick={() => openEditProject(p)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] group
                    ${
                      theme === 'dark'
                        ? 'bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
                        : 'bg-white hover:bg-zinc-50 border-zinc-200 shadow-sm'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-md flex-shrink-0"
                        style={{ backgroundColor: p.color || '#6366f1' }}
                      />
                      <span className={`font-semibold text-xs truncate group-hover:text-indigo-500 ${
                        theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'
                      }`}>
                        {p.title}
                      </span>
                    </div>
                    <Edit2 className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className={`flex items-center justify-between text-[11px] mb-1.5 ${
                    theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>
                    <span>
                      {doneCount}/{projTasks.length} tâches
                    </span>
                    <span className="font-mono">{percent}%</span>
                  </div>
                  <div className={`w-full h-1 rounded-full overflow-hidden ${
                    theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'
                  }`}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: p.color || '#6366f1',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Barre de Filtres et Commutateur de Vues (Liste / Kanban) */}
      <div
        className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3
          ${
            theme === 'dark'
              ? 'bg-zinc-900/70 border-zinc-800/80'
              : 'bg-white border-zinc-200'
          }`}
      >
        {/* Recherche textuelle */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border flex-1 min-w-[200px] max-w-sm transition-colors
            ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-300 bg-zinc-50'}`}
        >
          <Search className={`w-4 h-4 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer les tâches..."
            className={`w-full bg-transparent border-none outline-none text-xs ${
              theme === 'dark' ? 'text-zinc-100 placeholder:text-zinc-500' : 'text-zinc-900 placeholder:text-zinc-400'
            }`}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filtre Priorité */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
            className={`px-2.5 py-1.5 rounded-xl border text-xs focus:outline-none transition-colors
              ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900 text-zinc-300' : 'border-zinc-300 bg-white text-zinc-800'}`}
          >
            <option value="all">Toutes priorités</option>
            <option value="urgent">Urgente 🔥</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>

          {/* Filtre Statut (surtout pertinent en vue Liste) */}
          {viewMode === 'list' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
              className={`px-2.5 py-1.5 rounded-xl border text-xs focus:outline-none transition-colors
                ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900 text-zinc-300' : 'border-zinc-300 bg-white text-zinc-800'}`}
            >
              <option value="all">Tous statuts</option>
              <option value="todo">À faire</option>
              <option value="in_progress">En cours</option>
              <option value="done">Terminé</option>
            </select>
          )}

          {/* Commutateur de Vues (Liste / Kanban) */}
          <div className={`flex items-center p-1 rounded-xl border transition-colors ${
            theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
          }`}>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors
                ${
                  viewMode === 'list'
                    ? theme === 'dark'
                      ? 'bg-zinc-800 text-zinc-100 shadow'
                      : 'bg-white text-zinc-900 shadow-sm'
                    : theme === 'dark'
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              title="Vue Liste"
            >
              <List className="w-3.5 h-3.5" />
              <span>Liste</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors
                ${
                  viewMode === 'kanban'
                    ? theme === 'dark'
                      ? 'bg-zinc-800 text-zinc-100 shadow'
                      : 'bg-white text-zinc-900 shadow-sm'
                    : theme === 'dark'
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              title="Vue Kanban"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. VUE KANBAN */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            const ColIcon = col.icon;
            return (
              <div
                key={col.id}
                className={`rounded-2xl border p-4 flex flex-col min-h-[500px]
                  ${
                    theme === 'dark'
                      ? 'bg-zinc-900/50 border-zinc-800/80 shadow-md shadow-black/20'
                      : 'bg-zinc-100/60 border-zinc-200 shadow-sm'
                  }`}
              >
                {/* En-tête de la colonne */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-inherit">
                  <div className="flex items-center gap-2">
                    <ColIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    <h3 className={`font-bold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>{col.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                      theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-700'
                    }`}>
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openNewTaskForStatus(col.id)}
                    className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    title={`Ajouter dans ${col.title}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Cartes de tâches dans la colonne */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400 dark:text-zinc-600 text-xs">
                      Aucune tâche dans cette colonne
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const parentProject = projects.find((p) => p.id === task.projectId);
                      return (
                        <div
                          key={task.id}
                          className={`p-4 rounded-xl border transition-all group hover:border-indigo-500/40 cursor-pointer
                            ${
                              theme === 'dark'
                                ? 'bg-zinc-950/80 hover:bg-zinc-900 border-zinc-800/80 shadow-sm'
                                : 'bg-white hover:bg-zinc-50 border-zinc-200 shadow-sm'
                            }`}
                          onClick={() => openEditTask(task)}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold
                                ${
                                  task.priority === 'urgent'
                                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                    : task.priority === 'high'
                                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                    : task.priority === 'medium'
                                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                    : theme === 'dark'
                                    ? 'bg-zinc-800 text-zinc-400'
                                    : 'bg-zinc-200 text-zinc-700'
                                }`}
                            >
                              {task.priority}
                            </span>

                            {/* Actions de changement rapide de colonne */}
                            <div
                              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {col.id !== 'todo' && (
                                <button
                                  onClick={() =>
                                    moveTaskStatus(task, col.id === 'done' ? 'in_progress' : 'todo')
                                  }
                                  className={`p-1 rounded ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'}`}
                                  title="Déplacer vers la gauche"
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                </button>
                              )}
                              {col.id !== 'done' && (
                                <button
                                  onClick={() =>
                                    moveTaskStatus(task, col.id === 'todo' ? 'in_progress' : 'done')
                                  }
                                  className={`p-1 rounded ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'}`}
                                  title="Déplacer vers la droite"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          <h4
                            className={`text-sm font-semibold mb-1 ${
                              task.status === 'done'
                                ? 'line-through text-zinc-400 dark:text-zinc-500'
                                : theme === 'dark'
                                ? 'text-zinc-200'
                                : 'text-zinc-900'
                            }`}
                          >
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className={`text-xs line-clamp-2 mb-3 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                              {task.description}
                            </p>
                          )}

                          {/* Footer de la carte */}
                          <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
                            theme === 'dark' ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-500'
                          }`}>
                            {parentProject ? (
                              <div className="flex items-center gap-1.5 font-medium truncate max-w-[120px]">
                                <span
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: parentProject.color || '#6366f1' }}
                                />
                                <span className="truncate">{parentProject.title}</span>
                              </div>
                            ) : (
                              <span className="capitalize">{task.category}</span>
                            )}

                            {task.dueDate && (
                              <span className="flex items-center gap-1 text-zinc-400 font-mono">
                                <Calendar className="w-3 h-3" />
                                {task.dueDate}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. VUE LISTE */}
      {viewMode === 'list' && (
        <div
          className={`rounded-2xl border overflow-hidden
            ${
              theme === 'dark'
                ? 'bg-zinc-900/60 border-zinc-800/80 shadow-md'
                : 'bg-white border-zinc-200 shadow-sm'
            }`}
        >
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <CheckSquare className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
              <p className="text-sm font-medium">Aucune tâche ne correspond à vos filtres.</p>
            </div>
          ) : (
            <div className="divide-y divide-inherit">
              {filteredTasks.map((task) => {
                const parentProject = projects.find((p) => p.id === task.projectId);
                return (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-4 transition-colors group cursor-pointer
                      ${
                        theme === 'dark'
                          ? 'hover:bg-zinc-850/60'
                          : 'hover:bg-zinc-50'
                      }`}
                    onClick={() => openEditTask(task)}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskStatus(task.id);
                        }}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors flex-shrink-0
                          ${
                            task.status === 'done'
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : theme === 'dark'
                              ? 'border-zinc-700 hover:border-indigo-400'
                              : 'border-zinc-300 hover:border-indigo-500 bg-white'
                          }`}
                        title="Basculer statut"
                      >
                        {task.status === 'done' && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div className="truncate">
                        <span
                          className={`text-sm font-medium truncate block ${
                            task.status === 'done'
                              ? 'line-through text-zinc-400 dark:text-zinc-500'
                              : theme === 'dark'
                              ? 'text-zinc-200'
                              : 'text-zinc-900 font-semibold'
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.description && (
                          <p className={`text-xs truncate mt-0.5 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      {parentProject && (
                        <div className={`hidden sm:flex items-center gap-1.5 text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: parentProject.color || '#6366f1' }}
                          />
                          <span>{parentProject.title}</span>
                        </div>
                      )}

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold
                          ${
                            task.priority === 'urgent'
                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              : task.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : theme === 'dark'
                              ? 'bg-zinc-800 text-zinc-400'
                              : 'bg-zinc-200 text-zinc-700'
                          }`}
                      >
                        {task.priority}
                      </span>

                      {task.dueDate && (
                        <span className={`hidden md:flex items-center gap-1 text-xs font-mono ${
                          theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'
                        }`}>
                          <Calendar className="w-3.5 h-3.5" />
                          {task.dueDate}
                        </span>
                      )}

                      <ChevronRight className={`w-4 h-4 transition-colors ${
                        theme === 'dark'
                          ? 'text-zinc-600 group-hover:text-zinc-300'
                          : 'text-zinc-400 group-hover:text-zinc-800'
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals Tâche et Projet */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        defaultCategory={selectedCategory === 'all' ? 'project' : selectedCategory}
        defaultStatus={defaultTaskStatus}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        projectToEdit={projectToEdit}
        defaultCategory={selectedCategory === 'all' ? 'project' : selectedCategory}
      />
    </div>
  );
}
