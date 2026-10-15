'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { Task, Project, Note, ParaStats, TaskStatus, NoteFolder, CalendarEvent, ICalSyncFeed } from '@/types';
import {
  subscribeToTasks,
  subscribeToProjects,
  subscribeToNotes,
  subscribeToFolders,
  subscribeToEvents,
  saveTask,
  deleteTaskById,
  saveProject,
  deleteProjectById,
  saveNote,
  deleteNoteById,
  saveFolder,
  deleteFolderById,
  saveEvent,
  saveEventsBatch,
  deleteEventById,
  deleteAllEvents,
  getLocalICalFeeds,
  saveLocalICalFeeds,
} from '@/lib/dataService';
import { fetchICalFromUrl, parseICal } from '@/lib/icalParser';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useAuth } from './AuthContext';

interface DataContextType {
  tasks: Task[];
  projects: Project[];
  notes: Note[];
  folders: NoteFolder[];
  events: CalendarEvent[];
  icalFeeds: ICalSyncFeed[];
  stats: ParaStats;
  isLoading: boolean;
  isFirebaseConnected: boolean;
  // Actions Tâches
  addTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskStatus: (taskId: string) => Promise<void>;
  // Actions Projets
  addProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  // Actions Notes
  addNote: (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  // Actions Dossiers
  addFolder: (name: string, color?: string, parentId?: string | null) => Promise<NoteFolder>;
  updateFolder: (folder: NoteFolder) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  // Actions Événements Calendrier
  addEvent: (data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CalendarEvent>;
  updateEvent: (event: CalendarEvent) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  deleteAllEvents: () => Promise<void>;
  importEvents: (events: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<number>;
  // Synchronisation iCal / Google Calendar
  addICalFeed: (name: string, url: string, color?: string) => Promise<ICalSyncFeed>;
  deleteICalFeed: (feedId: string) => Promise<void>;
  syncICalFeed: (feedId: string) => Promise<{ success: boolean; count: number; error?: string }>;
  syncAllICalFeeds: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const currentUserId = user?.uid;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [icalFeeds, setIcalFeeds] = useState<ICalSyncFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mémorise les identifiants supprimés localement pour éviter qu'ils ne réapparaissent lors de snapshots intermédiaires
  const deletedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setIsLoading(true);
    setIcalFeeds(getLocalICalFeeds());

    let tasksLoaded = false;
    let projectsLoaded = false;
    let notesLoaded = false;
    let foldersLoaded = false;
    let eventsLoaded = false;

    const checkAllLoaded = () => {
      if (tasksLoaded && projectsLoaded && notesLoaded && foldersLoaded && eventsLoaded) {
        setIsLoading(false);
      }
    };

    const unsubTasks = subscribeToTasks(currentUserId, (loadedTasks) => {
      setTasks((prev) => {
        const safeLoaded = loadedTasks || [];
        const loadedIds = new Set(safeLoaded.map((t) => t.id));
        const pendingLocals = prev.filter(
          (t) =>
            !loadedIds.has(t.id) &&
            !deletedIdsRef.current.has(t.id) &&
            Date.now() - new Date(t.createdAt).getTime() < 15000
        );
        return [...pendingLocals, ...safeLoaded];
      });
      tasksLoaded = true;
      checkAllLoaded();
    });

    const unsubProjects = subscribeToProjects(currentUserId, (loadedProjects) => {
      setProjects((prev) => {
        const safeLoaded = loadedProjects || [];
        const loadedIds = new Set(safeLoaded.map((p) => p.id));
        const pendingLocals = prev.filter(
          (p) =>
            !loadedIds.has(p.id) &&
            !deletedIdsRef.current.has(p.id) &&
            Date.now() - new Date(p.createdAt).getTime() < 15000
        );
        return [...pendingLocals, ...safeLoaded];
      });
      projectsLoaded = true;
      checkAllLoaded();
    });

    const unsubNotes = subscribeToNotes(currentUserId, (loadedNotes) => {
      setNotes((prev) => {
        const safeLoaded = loadedNotes || [];
        const loadedIds = new Set(safeLoaded.map((n) => n.id));
        const pendingLocals = prev.filter(
          (n) =>
            !loadedIds.has(n.id) &&
            !deletedIdsRef.current.has(n.id) &&
            Date.now() - new Date(n.createdAt).getTime() < 15000
        );
        return [...pendingLocals, ...safeLoaded];
      });
      notesLoaded = true;
      checkAllLoaded();
    });

    const unsubFolders = subscribeToFolders(currentUserId, (loadedFolders) => {
      setFolders((prev) => {
        const safeLoaded = loadedFolders || [];
        const loadedIds = new Set(safeLoaded.map((f) => f.id));
        const pendingLocals = prev.filter(
          (f) =>
            !loadedIds.has(f.id) &&
            !deletedIdsRef.current.has(f.id) &&
            Date.now() - new Date(f.createdAt).getTime() < 15000
        );
        return [...pendingLocals, ...safeLoaded];
      });
      foldersLoaded = true;
      checkAllLoaded();
    });

    const unsubEvents = subscribeToEvents(currentUserId, (loadedEvents) => {
      setEvents((prev) => {
        const safeLoaded = loadedEvents || [];
        const loadedIds = new Set(safeLoaded.map((e) => e.id));
        const pendingLocals = prev.filter(
          (e) =>
            !loadedIds.has(e.id) &&
            !deletedIdsRef.current.has(e.id) &&
            Date.now() - new Date(e.createdAt).getTime() < 15000
        );
        return [...pendingLocals, ...safeLoaded];
      });
      eventsLoaded = true;
      checkAllLoaded();
    });

    return () => {
      unsubTasks();
      unsubProjects();
      unsubNotes();
      unsubFolders();
      unsubEvents();
    };
  }, [currentUserId]);

  // Calcul des métriques statistiques globales
  const stats = useMemo<ParaStats>(() => {
    const projectsCount = projects.filter((p) => p.category === 'project').length;
    const areasCount = projects.filter((p) => p.category === 'area').length;
    const resourcesCount = projects.filter((p) => p.category === 'resource').length;
    const archivesCount = projects.filter((p) => p.category === 'archive').length;

    const completedTasksCount = tasks.filter((t) => t.status === 'done').length;
    const pendingTasksCount = tasks.filter((t) => t.status !== 'done').length;
    const totalNotesCount = notes.length;
    const classicNotesCount = notes.filter((n) => n.format !== 'ink').length;
    const inkNotesCount = notes.filter((n) => n.format === 'ink').length;

    return {
      projectsCount,
      areasCount,
      resourcesCount,
      archivesCount,
      completedTasksCount,
      pendingTasksCount,
      totalNotesCount,
      notesCount: totalNotesCount,
      classicNotesCount,
      inkNotesCount,
    };
  }, [tasks, projects, notes]);

  // Actions Tâches (Mise à jour optimiste instantanée + persistance)
  const addTask = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...data,
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      userId: currentUserId,
      createdAt: now,
      updatedAt: now,
    };
    // Mise à jour synchrone de l'UI (0ms de latence)
    setTasks((prev) => [newTask, ...prev.filter((t) => t.id !== newTask.id)]);
    await saveTask(newTask, currentUserId);
  };

  const updateTask = async (task: Task) => {
    const updated: Task = {
      ...task,
      userId: task.userId || currentUserId,
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    await saveTask(updated, currentUserId);
  };

  const deleteTask = async (taskId: string) => {
    deletedIdsRef.current.add(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await deleteTaskById(taskId, currentUserId);
  };

  const toggleTaskStatus = async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    let nextStatus: TaskStatus = 'todo';
    if (target.status === 'todo') nextStatus = 'in_progress';
    else if (target.status === 'in_progress') nextStatus = 'done';
    else nextStatus = 'todo';

    const updated: Task = {
      ...target,
      status: nextStatus,
      completedAt: nextStatus === 'done' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
      userId: target.userId || currentUserId,
    };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    await saveTask(updated, currentUserId);
  };

  // Actions Projets (Mise à jour optimiste instantanée + persistance)
  const addProject = async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newProject: Project = {
      ...data,
      id: 'proj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      userId: currentUserId,
      createdAt: now,
      updatedAt: now,
    };
    setProjects((prev) => [newProject, ...prev.filter((p) => p.id !== newProject.id)]);
    await saveProject(newProject, currentUserId);
  };

  const updateProject = async (project: Project) => {
    const updated: Project = {
      ...project,
      userId: project.userId || currentUserId,
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)));
    await saveProject(updated, currentUserId);
  };

  const deleteProject = async (projectId: string) => {
    deletedIdsRef.current.add(projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    await deleteProjectById(projectId, currentUserId);
  };

  // Actions Notes (Mise à jour optimiste instantanée + persistance)
  const addNote = async (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    const now = new Date().toISOString();
    const newNote: Note = {
      ...data,
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      userId: currentUserId,
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [newNote, ...prev.filter((n) => n.id !== newNote.id)]);
    await saveNote(newNote, currentUserId);
    return newNote;
  };

  const updateNote = async (note: Note) => {
    const updated: Note = {
      ...note,
      userId: note.userId || currentUserId,
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
    await saveNote(updated, currentUserId);
  };

  const deleteNote = async (noteId: string) => {
    deletedIdsRef.current.add(noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    await deleteNoteById(noteId, currentUserId);
  };

  // Actions Dossiers (Mise à jour optimiste instantanée + persistance)
  const addFolder = async (
    name: string,
    color: string = '#6366f1',
    parentId?: string | null
  ): Promise<NoteFolder> => {
    const newFolder: NoteFolder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      color,
      createdAt: new Date().toISOString(),
      userId: currentUserId,
      parentId: parentId || null,
    };
    setFolders((prev) => [...prev.filter((f) => f.id !== newFolder.id), newFolder]);
    await saveFolder(newFolder, currentUserId);
    return newFolder;
  };

  const updateFolder = async (folder: NoteFolder) => {
    const updated: NoteFolder = {
      ...folder,
      userId: folder.userId || currentUserId,
      parentId: folder.parentId || null,
    };
    setFolders((prev) => prev.map((f) => (f.id === folder.id ? updated : f)));
    await saveFolder(updated, currentUserId);
  };

  const deleteFolder = async (folderId: string) => {
    // Calcul récursif de tous les sous-dossiers descendants
    const toDelete = new Set<string>([folderId]);
    let added = true;
    while (added) {
      added = false;
      for (const f of folders) {
        if (f.parentId && toDelete.has(f.parentId) && !toDelete.has(f.id)) {
          toDelete.add(f.id);
          added = true;
        }
      }
    }

    toDelete.forEach((id) => deletedIdsRef.current.add(id));
    setFolders((prev) => prev.filter((f) => !toDelete.has(f.id)));
    // Dissocier les notes de ces dossiers pour ne perdre aucune note
    setNotes((prev) =>
      prev.map((n) => (n.folderId && toDelete.has(n.folderId) ? { ...n, folderId: undefined } : n))
    );
    await deleteFolderById(folderId, currentUserId);
  };

  // Actions Événements Calendrier (Mise à jour optimiste instantanée + persistance)
  const addEvent = async (data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> => {
    const now = new Date().toISOString();
    const newEvent: CalendarEvent = {
      ...data,
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      userId: currentUserId,
      createdAt: now,
      updatedAt: now,
    };
    setEvents((prev) => [newEvent, ...prev.filter((e) => e.id !== newEvent.id)]);
    await saveEvent(newEvent, currentUserId);
    return newEvent;
  };

  const updateEvent = async (event: CalendarEvent) => {
    const updated: CalendarEvent = {
      ...event,
      userId: event.userId || currentUserId,
      updatedAt: new Date().toISOString(),
    };
    setEvents((prev) => prev.map((e) => (e.id === event.id ? updated : e)));
    await saveEvent(updated, currentUserId);
  };

  const deleteEvent = async (eventId: string) => {
    deletedIdsRef.current.add(eventId);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    await deleteEventById(eventId, currentUserId);
  };

  const deleteAllEventsAction = async () => {
    events.forEach((e) => deletedIdsRef.current.add(e.id));
    setEvents([]);
    await deleteAllEvents(currentUserId);
  };

  const importEvents = async (
    incomingEvents: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<number> => {
    if (!incomingEvents || incomingEvents.length === 0) return 0;
    const now = new Date().toISOString();

    const prepared: CalendarEvent[] = incomingEvents.map((e) => ({
      ...e,
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      userId: currentUserId,
      createdAt: now,
      updatedAt: now,
    }));

    setEvents((prev) => {
      const existingMap = new Map<string, CalendarEvent>(prev.map((item) => [item.id, item]));
      const externalIdMap = new Map<string, string>();
      prev.forEach((item) => {
        if (item.externalId) {
          externalIdMap.set(item.externalId, item.id);
        }
      });

      prepared.forEach((item) => {
        if (item.externalId && externalIdMap.has(item.externalId)) {
          const existingId = externalIdMap.get(item.externalId)!;
          const prevItem = existingMap.get(existingId);
          existingMap.set(existingId, {
            ...item,
            id: existingId,
            createdAt: prevItem?.createdAt || now,
          });
        } else {
          existingMap.set(item.id, item);
        }
      });

      return Array.from(existingMap.values());
    });

    await saveEventsBatch(prepared, currentUserId);
    return prepared.length;
  };

  // Synchronisation iCal / Google Calendar
  const addICalFeed = async (name: string, url: string, color: string = '#3b82f6'): Promise<ICalSyncFeed> => {
    const newFeed: ICalSyncFeed = {
      id: 'feed-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      url: url.trim(),
      color,
      autoSync: true,
      eventsCount: 0,
    };
    const nextFeeds = [...icalFeeds.filter((f) => f.id !== newFeed.id), newFeed];
    setIcalFeeds(nextFeeds);
    saveLocalICalFeeds(nextFeeds);

    // Déclenche une synchronisation initiale immédiate
    syncICalFeed(newFeed.id, nextFeeds);
    return newFeed;
  };

  const deleteICalFeed = async (feedId: string) => {
    const nextFeeds = icalFeeds.filter((f) => f.id !== feedId);
    setIcalFeeds(nextFeeds);
    saveLocalICalFeeds(nextFeeds);
  };

  const syncICalFeed = async (
    feedId: string,
    currentFeedsList?: ICalSyncFeed[]
  ): Promise<{ success: boolean; count: number; error?: string }> => {
    const list = currentFeedsList || icalFeeds;
    const feed = list.find((f) => f.id === feedId);
    if (!feed) return { success: false, count: 0, error: 'Flux non trouvé' };

    try {
      const isGoogle = feed.url.includes('google.com') || feed.url.includes('calendar.google');
      const icsRaw = await fetchICalFromUrl(feed.url);
      const parsed = parseICal(icsRaw, isGoogle ? 'google' : 'ical');

      // Tag parsed events with feed color
      const tagged = parsed.map((e) => ({
        ...e,
        color: feed.color || e.color,
      }));

      const importedCount = await importEvents(tagged);

      const now = new Date().toISOString();
      const updatedList = list.map((f) =>
        f.id === feedId
          ? {
              ...f,
              lastSyncedAt: now,
              eventsCount: importedCount,
              error: undefined,
            }
          : f
      );
      setIcalFeeds(updatedList);
      saveLocalICalFeeds(updatedList);

      return { success: true, count: importedCount };
    } catch (err: any) {
      const errorMsg = err?.message || 'Erreur lors de la synchronisation du flux';
      const updatedList = list.map((f) =>
        f.id === feedId
          ? {
              ...f,
              error: errorMsg,
            }
          : f
      );
      setIcalFeeds(updatedList);
      saveLocalICalFeeds(updatedList);
      return { success: false, count: 0, error: errorMsg };
    }
  };

  const syncAllICalFeeds = async () => {
    const feedsToSync = icalFeeds.length > 0 ? icalFeeds : getLocalICalFeeds();
    for (const feed of feedsToSync) {
      if (feed.autoSync !== false) {
        await syncICalFeed(feed.id, feedsToSync);
      }
    }
  };

  // Synchronisation automatique périodique des flux connectés (au démarrage et toutes les 15 minutes)
  useEffect(() => {
    const feeds = getLocalICalFeeds();
    if (feeds.some((f) => f.autoSync !== false)) {
      syncAllICalFeeds();
    }
    const interval = setInterval(() => {
      syncAllICalFeeds();
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DataContext.Provider
      value={{
        tasks,
        projects,
        notes,
        folders,
        events,
        icalFeeds,
        stats,
        isLoading,
        isFirebaseConnected: isFirebaseConfigured,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        addProject,
        updateProject,
        deleteProject,
        addNote,
        updateNote,
        deleteNote,
        addFolder,
        updateFolder,
        deleteFolder,
        addEvent,
        updateEvent,
        deleteEvent,
        deleteAllEvents: deleteAllEventsAction,
        importEvents,
        addICalFeed,
        deleteICalFeed,
        syncICalFeed,
        syncAllICalFeeds,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData doit être utilisé à l\'intérieur d\'un DataProvider');
  }
  return context;
};

export default DataContext;
