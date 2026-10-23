import { db, isFirebaseConfigured } from './firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  where,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { Task, Project, Note, NoteFolder, CalendarEvent, ICalSyncFeed, NoteAttachment } from '@/types';
import { Book, ReadingProfile } from '@/types/reading';
import { INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_NOTES } from './mockData';
import {
  saveAttachmentLocally,
  getAttachmentLocally,
  deleteAttachmentLocally,
} from './attachmentStorage';

const LOCAL_STORAGE_KEYS = {
  TASKS: 'second_brain_tasks_v1',
  PROJECTS: 'second_brain_projects_v1',
  NOTES: 'second_brain_notes_v1',
  FOLDERS: 'second_brain_folders_v1',
  EVENTS: 'second_brain_events_v1',
  ICAL_FEEDS: 'second_brain_ical_feeds_v1',
  BOOKS: 'syntropy_reading_books_v1',
  READING_PROFILE: 'syntropy_reading_profile_v1',
};

// --- GESTIONNAIRES LOCAL STORAGE (MODE DÉGRADÉ / PAR UTILISATEUR) ---

export const getLocalTasks = (userId?: string): Task[] => {
  if (typeof window === 'undefined') return INITIAL_TASKS;
  const key = userId ? `${LOCAL_STORAGE_KEYS.TASKS}_${userId}` : LOCAL_STORAGE_KEYS.TASKS;
  const saved = localStorage.getItem(key);
  if (!saved) {
    const initial = userId && userId !== 'local-user' ? [] : INITIAL_TASKS;
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
};

export const getLocalProjects = (userId?: string): Project[] => {
  if (typeof window === 'undefined') return INITIAL_PROJECTS;
  const key = userId ? `${LOCAL_STORAGE_KEYS.PROJECTS}_${userId}` : LOCAL_STORAGE_KEYS.PROJECTS;
  const saved = localStorage.getItem(key);
  if (!saved) {
    const initial = userId && userId !== 'local-user' ? [] : INITIAL_PROJECTS;
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
};

export const getLocalNotes = (userId?: string): Note[] => {
  if (typeof window === 'undefined') return INITIAL_NOTES;
  const key = userId ? `${LOCAL_STORAGE_KEYS.NOTES}_${userId}` : LOCAL_STORAGE_KEYS.NOTES;
  const saved = localStorage.getItem(key);
  if (!saved) {
    const initial = userId && userId !== 'local-user' ? [] : INITIAL_NOTES;
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
};

export const INITIAL_FOLDERS: NoteFolder[] = [
  { id: 'folder-1', name: 'Cours & Études', color: '#6366f1', createdAt: new Date().toISOString() },
  { id: 'folder-2', name: 'Projets & Code', color: '#8b5cf6', createdAt: new Date().toISOString() },
  { id: 'folder-3', name: 'Documentation', color: '#06b6d4', createdAt: new Date().toISOString() },
  { id: 'folder-4', name: 'Personnel', color: '#10b981', createdAt: new Date().toISOString() },
];

export const getLocalFolders = (userId?: string): NoteFolder[] => {
  if (typeof window === 'undefined') return INITIAL_FOLDERS;
  const key = userId ? `${LOCAL_STORAGE_KEYS.FOLDERS}_${userId}` : LOCAL_STORAGE_KEYS.FOLDERS;
  const saved = localStorage.getItem(key);
  if (!saved) {
    localStorage.setItem(key, JSON.stringify(INITIAL_FOLDERS));
    return INITIAL_FOLDERS;
  }
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_FOLDERS;
  } catch {
    return INITIAL_FOLDERS;
  }
};

const notifyLocalChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('second_brain_data_changed'));
  }
};

// --- ABONNEMENT EN TEMPS RÉEL UNIFIÉ & CLOISONNÉ PAR UTILISATEUR ---

export const subscribeToTasks = (
  userId: string | undefined,
  callback: (tasks: Task[]) => void,
  onError?: (error: unknown) => void
): (() => void) => {
  // 1. Rendu immédiat depuis le cache local (0ms de latence)
  callback(getLocalTasks(userId));

  // 2. Écoute réactive des événements locaux (créations, modifications, suppressions)
  const localHandler = () => {
    callback(getLocalTasks(userId));
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('second_brain_data_changed', localHandler);
  }

  // 3. Écoute Firestore en temps réel en arrière-plan
  let unsubFirestore = () => {};
  if (isFirebaseConfigured && db) {
    try {
      const tasksRef = collection(db, 'tasks');
      const q = userId
        ? query(tasksRef, where('userId', '==', userId))
        : query(tasksRef, orderBy('createdAt', 'desc'));

      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const tasks: Task[] = snapshot.docs
              .map((d) => ({
                id: d.id,
                ...(d.data() as Omit<Task, 'id'>),
              }))
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // Mettre à jour le cache local pour garder la persistance synchronisée
            const key = userId ? `${LOCAL_STORAGE_KEYS.TASKS}_${userId}` : LOCAL_STORAGE_KEYS.TASKS;
            if (typeof window !== 'undefined') {
              localStorage.setItem(key, JSON.stringify(tasks));
            }
            callback(tasks);
          } else {
            callback(getLocalTasks(userId));
          }
        },
        (error) => {
          console.warn('[Firestore] Erreur écoute tasks, bascule locale :', error);
          if (onError) onError(error);
          callback(getLocalTasks(userId));
        }
      );
    } catch (e) {
      console.warn('[Firestore] Exception abonnement tasks, fallback local :', e);
    }
  }

  return () => {
    unsubFirestore();
    if (typeof window !== 'undefined') {
      window.removeEventListener('second_brain_data_changed', localHandler);
    }
  };
};

export const subscribeToProjects = (
  userId: string | undefined,
  callback: (projects: Project[]) => void,
  onError?: (error: unknown) => void
): (() => void) => {
  // 1. Rendu immédiat depuis le cache local (0ms de latence)
  callback(getLocalProjects(userId));

  // 2. Écoute réactive des événements locaux
  const localHandler = () => {
    callback(getLocalProjects(userId));
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('second_brain_data_changed', localHandler);
  }

  // 3. Écoute Firestore en temps réel en arrière-plan
  let unsubFirestore = () => {};
  if (isFirebaseConfigured && db) {
    try {
      const projectsRef = collection(db, 'projects');
      const q = userId
        ? query(projectsRef, where('userId', '==', userId))
        : query(projectsRef, orderBy('createdAt', 'desc'));

      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const projects: Project[] = snapshot.docs
              .map((d) => ({
                id: d.id,
                ...(d.data() as Omit<Project, 'id'>),
              }))
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            const key = userId ? `${LOCAL_STORAGE_KEYS.PROJECTS}_${userId}` : LOCAL_STORAGE_KEYS.PROJECTS;
            if (typeof window !== 'undefined') {
              localStorage.setItem(key, JSON.stringify(projects));
            }
            callback(projects);
          } else {
            callback(getLocalProjects(userId));
          }
        },
        (error) => {
          console.warn('[Firestore] Erreur écoute projects, bascule locale :', error);
          if (onError) onError(error);
          callback(getLocalProjects(userId));
        }
      );
    } catch (e) {
      console.warn('[Firestore] Exception abonnement projects, fallback local :', e);
    }
  }

  return () => {
    unsubFirestore();
    if (typeof window !== 'undefined') {
      window.removeEventListener('second_brain_data_changed', localHandler);
    }
  };
};

export const subscribeToNotes = (
  userId: string | undefined,
  callback: (notes: Note[]) => void,
  onError?: (error: unknown) => void
): (() => void) => {
  // 1. Rendu immédiat depuis le cache local (0ms de latence)
  callback(getLocalNotes(userId));

  // 2. Écoute réactive des événements locaux
  const localHandler = () => {
    callback(getLocalNotes(userId));
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('second_brain_data_changed', localHandler);
  }

  // 3. Écoute Firestore en temps réel en arrière-plan
  let unsubFirestore = () => {};
  if (isFirebaseConfigured && db) {
    try {
      const notesRef = collection(db, 'notes');
      const q = userId
        ? query(notesRef, where('userId', '==', userId))
        : query(notesRef, orderBy('updatedAt', 'desc'));

      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const notes: Note[] = snapshot.docs
              .map((d) => ({
                id: d.id,
                ...(d.data() as Omit<Note, 'id'>),
              }))
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

            const key = userId ? `${LOCAL_STORAGE_KEYS.NOTES}_${userId}` : LOCAL_STORAGE_KEYS.NOTES;
            if (typeof window !== 'undefined') {
              localStorage.setItem(key, JSON.stringify(notes));
            }
            callback(notes);
          } else {
            callback(getLocalNotes(userId));
          }
        },
        (error) => {
          console.warn('[Firestore] Erreur écoute notes, bascule locale :', error);
          if (onError) onError(error);
          callback(getLocalNotes(userId));
        }
      );
    } catch (e) {
      console.warn('[Firestore] Exception abonnement notes, fallback local :', e);
    }
  }

  return () => {
    unsubFirestore();
    if (typeof window !== 'undefined') {
      window.removeEventListener('second_brain_data_changed', localHandler);
    }
  };
};

export const subscribeToFolders = (
  userId: string | undefined,
  callback: (folders: NoteFolder[]) => void,
  onError?: (error: unknown) => void
): (() => void) => {
  // 1. Rendu immédiat depuis le cache local (0ms de latence)
  callback(getLocalFolders(userId));

  // 2. Écoute réactive des événements locaux
  const localHandler = () => {
    callback(getLocalFolders(userId));
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('second_brain_data_changed', localHandler);
  }

  // 3. Écoute Firestore en temps réel en arrière-plan
  let unsubFirestore = () => {};
  if (isFirebaseConfigured && db) {
    try {
      const foldersRef = collection(db, 'folders');
      const q = userId
        ? query(foldersRef, where('userId', '==', userId))
        : query(foldersRef, orderBy('createdAt', 'desc'));

      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const folders: NoteFolder[] = snapshot.docs
              .map((d) => ({
                id: d.id,
                ...(d.data() as Omit<NoteFolder, 'id'>),
              }))
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            const key = userId ? `${LOCAL_STORAGE_KEYS.FOLDERS}_${userId}` : LOCAL_STORAGE_KEYS.FOLDERS;
            if (typeof window !== 'undefined') {
              localStorage.setItem(key, JSON.stringify(folders));
            }
            callback(folders);
          } else {
            callback(getLocalFolders(userId));
          }
        },
        (error) => {
          console.warn('[Firestore] Erreur écoute folders, bascule locale :', error);
          if (onError) onError(error);
          callback(getLocalFolders(userId));
        }
      );
    } catch (e) {
      console.warn('[Firestore] Exception abonnement folders, fallback local :', e);
    }
  }

  return () => {
    unsubFirestore();
    if (typeof window !== 'undefined') {
      window.removeEventListener('second_brain_data_changed', localHandler);
    }
  };
};

// --- OPÉRATIONS CRUD TÂCHES ---

export const saveTask = async (task: Task, userId?: string): Promise<void> => {
  const currentUserId = task.userId || userId || null;
  const taskToSave: Task = { ...task, userId: currentUserId || undefined, updatedAt: new Date().toISOString() };

  // 1. Toujours enregistrer immédiatement dans le cache local synchrone et notifier les écouteurs
  const key = currentUserId ? `${LOCAL_STORAGE_KEYS.TASKS}_${currentUserId}` : LOCAL_STORAGE_KEYS.TASKS;
  const tasks = getLocalTasks(currentUserId || undefined);
  const index = tasks.findIndex((t) => t.id === task.id);
  if (index >= 0) {
    tasks[index] = taskToSave;
  } else {
    tasks.unshift(taskToSave);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(tasks));
    notifyLocalChange();
  }

  // 2. Synchronisation Cloud Firestore
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'tasks', task.id), {
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        category: task.category,
        projectId: task.projectId || null,
        dueDate: task.dueDate || null,
        completedAt: task.completedAt || null,
        tags: task.tags || [],
        createdAt: task.createdAt,
        updatedAt: taskToSave.updatedAt,
        userId: currentUserId,
      });
    } catch (err) {
      console.warn('[Firestore] Erreur saveTask, conservé en cache local :', err);
    }
  }
};

export const deleteTaskById = async (taskId: string, userId?: string): Promise<void> => {
  const currentUserId = userId || null;

  // 1. Mise à jour immédiate du cache local
  const key = currentUserId ? `${LOCAL_STORAGE_KEYS.TASKS}_${currentUserId}` : LOCAL_STORAGE_KEYS.TASKS;
  const tasks = getLocalTasks(userId).filter((t) => t.id !== taskId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(tasks));
    notifyLocalChange();
  }

  // 2. Suppression Cloud Firestore
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (err) {
      console.warn('[Firestore] Erreur deleteTaskById :', err);
    }
  }
};

// --- OPÉRATIONS CRUD PROJETS ---

export const saveProject = async (project: Project, userId?: string): Promise<void> => {
  const currentUserId = project.userId || userId || null;
  const projectToSave: Project = { ...project, userId: currentUserId || undefined, updatedAt: new Date().toISOString() };

  // 1. LocalStorage immédiat
  const key = currentUserId ? `${LOCAL_STORAGE_KEYS.PROJECTS}_${currentUserId}` : LOCAL_STORAGE_KEYS.PROJECTS;
  const projects = getLocalProjects(currentUserId || undefined);
  const index = projects.findIndex((p) => p.id === project.id);
  if (index >= 0) {
    projects[index] = projectToSave;
  } else {
    projects.unshift(projectToSave);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(projects));
    notifyLocalChange();
  }

  // 2. Synchronisation Cloud Firestore
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'projects', project.id), {
        title: project.title,
        description: project.description || '',
        category: project.category,
        status: project.status,
        color: project.color || '#6366f1',
        deadline: project.deadline || null,
        tags: project.tags || [],
        createdAt: project.createdAt,
        updatedAt: projectToSave.updatedAt,
        userId: currentUserId,
      });
    } catch (err) {
      console.warn('[Firestore] Erreur saveProject :', err);
    }
  }
};

export const deleteProjectById = async (projectId: string, userId?: string): Promise<void> => {
  const currentUserId = userId || null;

  // 1. LocalStorage immédiat
  const key = currentUserId ? `${LOCAL_STORAGE_KEYS.PROJECTS}_${currentUserId}` : LOCAL_STORAGE_KEYS.PROJECTS;
  const projects = getLocalProjects(userId).filter((p) => p.id !== projectId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(projects));
    notifyLocalChange();
  }

  // 2. Suppression Cloud Firestore
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
    } catch (err) {
      console.warn('[Firestore] Erreur deleteProjectById :', err);
    }
  }
};

// --- OPÉRATIONS CRUD NOTES ---

export const INK_INLINE_LIMIT = 800_000;
export const INK_CHUNK_SIZE = 700_000;
export const ATTACHMENT_CHUNK_SIZE = 700_000;

export const loadInkChunks = async (noteId: string): Promise<string | null> => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const chunksRef = collection(db, 'notes', noteId, 'inkChunks');
    const q = query(chunksRef, orderBy('i', 'asc'));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const parts: string[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (typeof data.data === 'string') {
        parts.push(data.data);
      }
    });
    return parts.join('');
  } catch (err) {
    console.warn('[Firestore] Erreur loadInkChunks :', err);
    return null;
  }
};

export const loadInkBlocksChunks = async (noteId: string): Promise<string | null> => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const chunksRef = collection(db, 'notes', noteId, 'inkBlocksChunks');
    const q = query(chunksRef, orderBy('i', 'asc'));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const parts: string[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (typeof data.data === 'string') {
        parts.push(data.data);
      }
    });
    return parts.join('');
  } catch (err) {
    console.warn('[Firestore] Erreur loadInkBlocksChunks :', err);
    return null;
  }
};

/**
 * Récupère le dataUrl complet d'une pièce jointe :
 * 1. Vérifie si déjà en mémoire
 * 2. Vérifie dans le cache permanent local IndexedDB (0ms)
 * 3. Télécharge et assemble les fragments depuis Cloud Firestore (tablette / autres appareils)
 */
export const loadAttachmentDataUrl = async (
  noteId: string,
  att: NoteAttachment
): Promise<string | null> => {
  if (!att || !att.id) return null;

  // 1. Déjà en mémoire avec contenu valide
  if (att.dataUrl && att.dataUrl.length > 100) {
    saveAttachmentLocally(att.id, att.dataUrl).catch(() => {});
    return att.dataUrl;
  }

  // 2. Cache local IndexedDB (0ms)
  try {
    const cached = await getAttachmentLocally(att.id);
    if (cached) {
      return cached;
    }
  } catch (err) {
    console.warn('[IndexedDB] Erreur lecture cache pièce jointe :', err);
  }

  // 3. Téléchargement depuis les sous-collections Cloud Firestore
  if (!isFirebaseConfigured || !db) return null;

  try {
    const chunksCount = att.chunksCount || 0;
    if (chunksCount > 0) {
      // Téléchargement parallèle haute performance de tous les fragments
      const chunkPromises = [];
      for (let i = 0; i < chunksCount; i++) {
        const chunkDocRef = doc(db, 'notes', noteId, 'attachmentChunks', `${att.id}_${i}`);
        chunkPromises.push(getDoc(chunkDocRef));
      }
      const snapshots = await Promise.all(chunkPromises);
      const parts: string[] = [];
      for (let i = 0; i < snapshots.length; i++) {
        const snap = snapshots[i];
        if (snap.exists()) {
          const chunkData = snap.data();
          if (typeof chunkData.data === 'string') {
            parts.push(chunkData.data);
          }
        }
      }
      if (parts.length === chunksCount) {
        const reassembled = parts.join('');
        await saveAttachmentLocally(att.id, reassembled);
        return reassembled;
      }
    }

    // Fallback : requête directe ordonnée en mémoire sur la sous-collection
    const chunksRef = collection(db, 'notes', noteId, 'attachmentChunks');
    const q = query(chunksRef, where('attId', '==', att.id));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docsData: { i: number; data: string }[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (typeof data.data === 'string') {
          docsData.push({ i: typeof data.i === 'number' ? data.i : 0, data: data.data });
        }
      });
      docsData.sort((a, b) => a.i - b.i);
      const reassembled = docsData.map((d) => d.data).join('');
      if (reassembled.length > 0) {
        await saveAttachmentLocally(att.id, reassembled);
        return reassembled;
      }
    }

    return null;
  } catch (err) {
    console.warn(`[Firestore] Erreur téléchargement pièce jointe ${att.id} :`, err);
    return null;
  }
};

/**
 * Supprime les fragments d'une pièce jointe de Cloud Firestore et du cache local
 */
export const deleteAttachmentChunks = async (
  noteId: string,
  attId: string,
  chunksCount?: number
): Promise<void> => {
  // 1. Suppression du cache IndexedDB
  deleteAttachmentLocally(attId).catch(() => {});

  // 2. Suppression de Cloud Firestore
  if (!isFirebaseConfigured || !db) return;
  try {
    const count = chunksCount && chunksCount > 0 ? chunksCount : 60;
    const batch = writeBatch(db);
    for (let i = 0; i < count; i++) {
      const chunkDocRef = doc(db, 'notes', noteId, 'attachmentChunks', `${attId}_${i}`);
      batch.delete(chunkDocRef);
    }
    await batch.commit().catch(() => {});
  } catch (err) {
    console.warn(`[Firestore] Erreur suppression fragments attachment ${attId} :`, err);
  }
};

export const saveNote = async (note: Note, userId?: string): Promise<void> => {
  const currentUserId = note.userId || userId || null;
  const noteToSave: Note = {
    ...note,
    userId: currentUserId || undefined,
    format: note.format || 'text',
    updatedAt: new Date().toISOString(),
  };

  // 1. Mise en cache IndexedDB des fichiers et assainissement pour LocalStorage
  const localAttachments = (note.attachments || []).map((att) => {
    if (att.dataUrl) {
      saveAttachmentLocally(att.id, att.dataUrl).catch(() => {});
    }
    return {
      ...att,
      dataUrl: '', // Préservé en IndexedDB pour ne pas saturer le quota 5 Mo de localStorage
    };
  });

  const noteForLocal: Note = {
    ...noteToSave,
    attachments: localAttachments,
  };

  const key = currentUserId ? `${LOCAL_STORAGE_KEYS.NOTES}_${currentUserId}` : LOCAL_STORAGE_KEYS.NOTES;
  const notes = getLocalNotes(currentUserId || undefined);
  const index = notes.findIndex((n) => n.id === note.id);
  if (index >= 0) {
    notes[index] = noteForLocal;
  } else {
    notes.unshift(noteForLocal);
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(notes));
    } catch {
      try {
        const fallbackNotes = notes.map((n) => {
          let out = n;
          if (n.id === note.id && n.ink && n.ink.length > 200_000) {
            out = { ...out, ink: null, inkChunks: n.inkChunks || 1 };
          }
          if (n.id === note.id && n.inkBlocks && n.inkBlocks.length > 200_000) {
            out = { ...out, inkBlocks: null, inkBlocksChunks: n.inkBlocksChunks || 1 };
          }
          return out;
        });
        localStorage.setItem(key, JSON.stringify(fallbackNotes));
      } catch (e2) {
        console.warn('[LocalStorage] Quota dépassé, impossible de cacher localement :', e2);
      }
    }
    notifyLocalChange();
  }

  // 2. Synchronisation Cloud Firestore
  if (isFirebaseConfigured && db) {
    try {
      let finalInk: string | null = note.ink ?? null;
      let finalChunksCount = note.inkChunks ?? 0;

      // Gestion de la sous-collection de chunks Stylus si > INK_INLINE_LIMIT (~800 Ko)
      if (typeof note.ink === 'string' && note.ink.length > INK_INLINE_LIMIT) {
        const batch = writeBatch(db);
        const chunkCount = Math.ceil(note.ink.length / INK_CHUNK_SIZE);
        for (let i = 0; i < chunkCount; i++) {
          const slice = note.ink.slice(i * INK_CHUNK_SIZE, (i + 1) * INK_CHUNK_SIZE);
          const chunkDocRef = doc(db, 'notes', note.id, 'inkChunks', `${i}`);
          batch.set(chunkDocRef, { i, data: slice });
        }
        if (note.inkChunks && note.inkChunks > chunkCount) {
          for (let i = chunkCount; i < note.inkChunks; i++) {
            const chunkDocRef = doc(db, 'notes', note.id, 'inkChunks', `${i}`);
            batch.delete(chunkDocRef);
          }
        }
        await batch.commit();
        finalInk = null;
        finalChunksCount = chunkCount;
      } else if (typeof note.ink === 'string' && note.ink.length <= INK_INLINE_LIMIT) {
        if (note.inkChunks && note.inkChunks > 0) {
          try {
            const batch = writeBatch(db);
            for (let i = 0; i < note.inkChunks; i++) {
              const chunkDocRef = doc(db, 'notes', note.id, 'inkChunks', `${i}`);
              batch.delete(chunkDocRef);
            }
            await batch.commit();
          } catch (cleanErr) {
            console.warn('[Firestore] Erreur nettoyage anciens chunks ink :', cleanErr);
          }
          finalChunksCount = 0;
        }
      }

      // Emplacements manuscrits intégrés aux notes classiques : même stratégie de segmentation
      let finalInkBlocks: string | null = note.inkBlocks ?? null;
      let finalInkBlocksChunks = note.inkBlocksChunks ?? 0;

      if (typeof note.inkBlocks === 'string' && note.inkBlocks.length > INK_INLINE_LIMIT) {
        const batch = writeBatch(db);
        const chunkCount = Math.ceil(note.inkBlocks.length / INK_CHUNK_SIZE);
        for (let i = 0; i < chunkCount; i++) {
          const slice = note.inkBlocks.slice(i * INK_CHUNK_SIZE, (i + 1) * INK_CHUNK_SIZE);
          batch.set(doc(db, 'notes', note.id, 'inkBlocksChunks', `${i}`), { i, data: slice });
        }
        if (note.inkBlocksChunks && note.inkBlocksChunks > chunkCount) {
          for (let i = chunkCount; i < note.inkBlocksChunks; i++) {
            batch.delete(doc(db, 'notes', note.id, 'inkBlocksChunks', `${i}`));
          }
        }
        await batch.commit();
        finalInkBlocks = null;
        finalInkBlocksChunks = chunkCount;
      } else if (typeof note.inkBlocks === 'string' && note.inkBlocksChunks && note.inkBlocksChunks > 0) {
        try {
          const batch = writeBatch(db);
          for (let i = 0; i < note.inkBlocksChunks; i++) {
            batch.delete(doc(db, 'notes', note.id, 'inkBlocksChunks', `${i}`));
          }
          await batch.commit();
        } catch (cleanErr) {
          console.warn('[Firestore] Erreur nettoyage anciens chunks inkBlocks :', cleanErr);
        }
        finalInkBlocksChunks = 0;
      }

      // Synchronisation segmentée des pièces jointes vers la sous-collection attachmentChunks
      const firestoreAttachments: NoteAttachment[] = [];
      if (note.attachments && note.attachments.length > 0) {
        for (const att of note.attachments) {
          let chunksCount = att.chunksCount || 0;

          // Récupération des données binaires (mémoire ou cache permanent IndexedDB)
          let fullData = att.dataUrl;
          if (!fullData || fullData.length === 0) {
            fullData = (await getAttachmentLocally(att.id)) || '';
          }

          // Si le fichier possède un dataUrl et doit être synchronisé sur le Cloud
          if (fullData && fullData.length > 0) {
            saveAttachmentLocally(att.id, fullData).catch(() => {});
            // Ne découper et uploader les fragments sur Firestore que si ce n'est pas encore synchronisé
            if (!att.isCloudSynced || !chunksCount || chunksCount === 0) {
              try {
                const chunkCount = Math.ceil(fullData.length / ATTACHMENT_CHUNK_SIZE);
                const batch = writeBatch(db);
                for (let i = 0; i < chunkCount; i++) {
                  const slice = fullData.slice(
                    i * ATTACHMENT_CHUNK_SIZE,
                    (i + 1) * ATTACHMENT_CHUNK_SIZE
                  );
                  const chunkDocRef = doc(db, 'notes', note.id, 'attachmentChunks', `${att.id}_${i}`);
                  batch.set(chunkDocRef, {
                    noteId: note.id,
                    attId: att.id,
                    i,
                    count: chunkCount,
                    data: slice,
                  });
                }
                await batch.commit();
                chunksCount = chunkCount;
              } catch (chunkErr) {
                console.warn(`[Firestore] Erreur segmentation pièce jointe ${att.id} :`, chunkErr);
              }
            }
          }

          firestoreAttachments.push({
            id: att.id,
            name: att.name || 'Document',
            type: att.type || 'application/octet-stream',
            size: Number(att.size) || 0,
            uploadedAt: att.uploadedAt || new Date().toISOString(),
            thumbnailUrl: att.thumbnailUrl || null, // STRICTEMENT null et jamais undefined pour Firestore
            chunksCount,
            isCloudSynced: chunksCount > 0 ? true : Boolean(att.isCloudSynced),
            dataUrl: '', // Omis du document Firestore principal pour ne JAMAIS dépasser la limite de 1 Mo
          });
        }
      }

      await setDoc(doc(db, 'notes', note.id), {
        title: note.title || 'Note sans titre',
        content: note.content || '',
        category: note.category || 'resource',
        folderId: note.folderId || null,
        projectId: note.projectId || null,
        tags: note.tags || [],
        isPinned: Boolean(note.isPinned),
        attachments: firestoreAttachments,
        format: noteToSave.format || 'text',
        ink: finalInk || null,
        inkChunks: finalChunksCount || 0,
        inkBlocks: finalInkBlocks || null,
        inkBlocksChunks: finalInkBlocksChunks || 0,
        createdAt: note.createdAt || new Date().toISOString(),
        updatedAt: noteToSave.updatedAt || new Date().toISOString(),
        userId: currentUserId || null,
      });
    } catch (err) {
      console.warn('[Firestore] Erreur saveNote :', err);
    }
  }
};

export const deleteNoteById = async (noteId: string, userId?: string): Promise<void> => {
  const currentUserId = userId || null;

  // 1. LocalStorage immédiat
  const key = currentUserId ? `${LOCAL_STORAGE_KEYS.NOTES}_${currentUserId}` : LOCAL_STORAGE_KEYS.NOTES;
  const notes = getLocalNotes(userId);
  const targetNote = notes.find((n) => n.id === noteId);
  const filtered = notes.filter((n) => n.id !== noteId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(filtered));
    notifyLocalChange();
  }

  // 2. Nettoyage IndexedDB et Cloud Firestore
  if (targetNote?.attachments && targetNote.attachments.length > 0) {
    for (const att of targetNote.attachments) {
      deleteAttachmentLocally(att.id).catch(() => {});
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      // Nettoyage des chunks ink
      if (targetNote?.inkChunks && targetNote.inkChunks > 0) {
        const batch = writeBatch(db);
        for (let i = 0; i < targetNote.inkChunks; i++) {
          batch.delete(doc(db, 'notes', noteId, 'inkChunks', `${i}`));
        }
        await batch.commit().catch(() => {});
      }

      // Nettoyage des chunks des emplacements manuscrits intégrés
      if (targetNote?.inkBlocksChunks && targetNote.inkBlocksChunks > 0) {
        const batch = writeBatch(db);
        for (let i = 0; i < targetNote.inkBlocksChunks; i++) {
          batch.delete(doc(db, 'notes', noteId, 'inkBlocksChunks', `${i}`));
        }
        await batch.commit().catch(() => {});
      }

      // Nettoyage des chunks attachments
      if (targetNote?.attachments && targetNote.attachments.length > 0) {
        for (const att of targetNote.attachments) {
          if (att.chunksCount && att.chunksCount > 0) {
            const batch = writeBatch(db);
            for (let i = 0; i < att.chunksCount; i++) {
              batch.delete(doc(db, 'notes', noteId, 'attachmentChunks', `${att.id}_${i}`));
            }
            await batch.commit().catch(() => {});
          }
        }
      }

      await deleteDoc(doc(db, 'notes', noteId));
    } catch (err) {
      console.warn('[Firestore] Erreur deleteNoteById :', err);
    }
  }
};

// --- OPÉRATIONS CRUD DOSSIERS (FOLDERS) ---

export const saveFolder = async (folder: NoteFolder, userId?: string): Promise<void> => {
  const currentUserId = folder.userId || userId || null;
  const folderToSave: NoteFolder = {
    ...folder,
    userId: currentUserId || undefined,
    parentId: folder.parentId || null,
  };

  // 1. LocalStorage immédiat
  const key = currentUserId ? `${LOCAL_STORAGE_KEYS.FOLDERS}_${currentUserId}` : LOCAL_STORAGE_KEYS.FOLDERS;
  const folders = getLocalFolders(currentUserId || undefined);
  const index = folders.findIndex((f) => f.id === folder.id);
  if (index >= 0) {
    folders[index] = folderToSave;
  } else {
    folders.push(folderToSave);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(folders));
    notifyLocalChange();
  }

  // 2. Synchronisation Cloud Firestore
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'folders', folder.id), {
        name: folder.name,
        color: folder.color || '#6366f1',
        icon: folder.icon || 'Folder',
        createdAt: folder.createdAt,
        userId: currentUserId,
        parentId: folder.parentId || null,
      });
    } catch (err) {
      console.warn('[Firestore] Erreur saveFolder :', err);
    }
  }
};

export const deleteFolderById = async (folderId: string, userId?: string): Promise<void> => {
  const currentUserId = userId || null;

  // 1. LocalStorage immédiat avec calcul récursif de tous les sous-dossiers descendants
  const key = currentUserId ? `${LOCAL_STORAGE_KEYS.FOLDERS}_${currentUserId}` : LOCAL_STORAGE_KEYS.FOLDERS;
  const allFolders = getLocalFolders(userId);

  const toDelete = new Set<string>([folderId]);
  let added = true;
  while (added) {
    added = false;
    for (const f of allFolders) {
      if (f.parentId && toDelete.has(f.parentId) && !toDelete.has(f.id)) {
        toDelete.add(f.id);
        added = true;
      }
    }
  }

  const remaining = allFolders.filter((f) => !toDelete.has(f.id));
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(remaining));
    notifyLocalChange();
  }

  // 2. Suppression Cloud Firestore par lot
  if (isFirebaseConfigured && db) {
    try {
      const firestore = db;
      const batch = writeBatch(firestore);
      for (const id of toDelete) {
        batch.delete(doc(firestore, 'folders', id));
      }
      await batch.commit().catch(() => {});
    } catch (err) {
      console.warn('[Firestore] Erreur deleteFolderById :', err);
    }
  }
};

// ============================================================================
// ÉVÉNEMENTS DU CALENDRIER & FLUX ICAL (GOOGLE / APPLE / OUTLOOK)
// ============================================================================

export const getLocalEvents = (userId?: string): CalendarEvent[] => {
  if (typeof window === 'undefined') return [];
  const key = userId ? `${LOCAL_STORAGE_KEYS.EVENTS}_${userId}` : LOCAL_STORAGE_KEYS.EVENTS;
  const saved = localStorage.getItem(key);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
};

export const getLocalICalFeeds = (userId?: string): ICalSyncFeed[] => {
  if (typeof window === 'undefined') return [];
  const key = userId ? `${LOCAL_STORAGE_KEYS.ICAL_FEEDS}_${userId}` : LOCAL_STORAGE_KEYS.ICAL_FEEDS;
  const saved = localStorage.getItem(key);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
};

export const saveLocalICalFeeds = (feeds: ICalSyncFeed[], userId?: string): void => {
  if (typeof window === 'undefined') return;
  const key = userId ? `${LOCAL_STORAGE_KEYS.ICAL_FEEDS}_${userId}` : LOCAL_STORAGE_KEYS.ICAL_FEEDS;
  localStorage.setItem(key, JSON.stringify(feeds));
};

export const subscribeToEvents = (
  userId: string | undefined,
  callback: (events: CalendarEvent[]) => void,
  onError?: (error: unknown) => void
): (() => void) => {
  // 1. Rendu immédiat depuis le cache local (0ms de latence)
  callback(getLocalEvents(userId));

  // 2. Écoute réactive des événements locaux
  const localHandler = () => {
    callback(getLocalEvents(userId));
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('second_brain_data_changed', localHandler);
  }

  // 3. Écoute Firestore en temps réel en arrière-plan
  let unsubFirestore = () => {};
  if (isFirebaseConfigured && db) {
    try {
      const eventsRef = collection(db, 'events');
      const q = userId
        ? query(eventsRef, where('userId', '==', userId))
        : query(eventsRef, orderBy('startDate', 'asc'));

      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteEvents: CalendarEvent[] = [];
            snapshot.forEach((d) => {
              const data = d.data();
              remoteEvents.push({
                id: d.id,
                title: data.title || '',
                description: data.description || '',
                startDate: data.startDate || '',
                endDate: data.endDate || '',
                allDay: data.allDay ?? true,
                color: data.color || '#8b5cf6',
                location: data.location || '',
                category: data.category || 'event',
                source: data.source || 'manual',
                externalId: data.externalId,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
                userId: data.userId,
              });
            });

            // Sauvegarde dans le cache local
            const key = userId ? `${LOCAL_STORAGE_KEYS.EVENTS}_${userId}` : LOCAL_STORAGE_KEYS.EVENTS;
            if (typeof window !== 'undefined') {
              localStorage.setItem(key, JSON.stringify(remoteEvents));
            }
            callback(remoteEvents);
          }
        },
        (err) => {
          console.warn('[Firestore] Erreur écoute events :', err);
          if (onError) onError(err);
        }
      );
    } catch (e) {
      console.warn('[Firestore] Exception abonnement events, fallback local :', e);
    }
  }

  return () => {
    unsubFirestore();
    if (typeof window !== 'undefined') {
      window.removeEventListener('second_brain_data_changed', localHandler);
    }
  };
};

export const saveEvent = async (event: CalendarEvent, userId?: string): Promise<void> => {
  const currentUserId = userId || null;
  const eventToSave: CalendarEvent = { ...event, userId: currentUserId || undefined };

  // 1. LocalStorage immédiat
  const key = currentUserId ? `${LOCAL_STORAGE_KEYS.EVENTS}_${currentUserId}` : LOCAL_STORAGE_KEYS.EVENTS;
  const events = getLocalEvents(userId);
  const index = events.findIndex((e) => e.id === event.id);
  if (index >= 0) {
    events[index] = eventToSave;
  } else {
    events.push(eventToSave);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(events));
    notifyLocalChange();
  }

  // 2. Synchronisation Cloud Firestore
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'events', event.id), {
        title: event.title,
        description: event.description || '',
        startDate: event.startDate,
        endDate: event.endDate || event.startDate,
        allDay: event.allDay ?? true,
        color: event.color || '#8b5cf6',
        location: event.location || '',
        category: event.category || 'event',
        source: event.source || 'manual',
        externalId: event.externalId || null,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        userId: currentUserId,
      });
    } catch (err) {
      console.warn('[Firestore] Erreur saveEvent :', err);
    }
  }
};

export const saveEventsBatch = async (newEvents: CalendarEvent[], userId?: string): Promise<void> => {
  if (!newEvents.length) return;
  const currentUserId = userId || null;

  // 1. Mise à jour LocalStorage immédiate avec déduplication par ID ou externalId
  const key = currentUserId ? `${LOCAL_STORAGE_KEYS.EVENTS}_${currentUserId}` : LOCAL_STORAGE_KEYS.EVENTS;
  const existing = getLocalEvents(userId);
  const existingMap = new Map<string, CalendarEvent>();
  existing.forEach((e) => {
    existingMap.set(e.id, e);
    if (e.externalId) existingMap.set(`ext_${e.externalId}`, e);
  });

  newEvents.forEach((ne) => {
    const toSave: CalendarEvent = { ...ne, userId: currentUserId || undefined };
    if (ne.externalId && existingMap.has(`ext_${ne.externalId}`)) {
      const old = existingMap.get(`ext_${ne.externalId}`)!;
      existingMap.set(old.id, { ...toSave, id: old.id });
    } else {
      existingMap.set(ne.id, toSave);
    }
  });

  const merged = Array.from(new Set(Array.from(existingMap.values())));
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(merged));
    notifyLocalChange();
  }

  // 2. Firestore batch save
  if (isFirebaseConfigured && db) {
    try {
      const batch = writeBatch(db);
      newEvents.forEach((ev) => {
        const ref = doc(db!, 'events', ev.id);
        batch.set(ref, {
          title: ev.title,
          description: ev.description || '',
          startDate: ev.startDate,
          endDate: ev.endDate || ev.startDate,
          allDay: ev.allDay ?? true,
          color: ev.color || '#8b5cf6',
          location: ev.location || '',
          category: ev.category || 'event',
          source: ev.source || 'manual',
          externalId: ev.externalId || null,
          createdAt: ev.createdAt,
          updatedAt: ev.updatedAt,
          userId: currentUserId,
        });
      });
      await batch.commit();
    } catch (err) {
      console.warn('[Firestore] Erreur saveEventsBatch :', err);
    }
  }
};

export const deleteEventById = async (eventId: string, userId?: string): Promise<void> => {
  const currentUserId = userId || null;

  // 1. LocalStorage immédiat
  const key = currentUserId ? `${LOCAL_STORAGE_KEYS.EVENTS}_${currentUserId}` : LOCAL_STORAGE_KEYS.EVENTS;
  const events = getLocalEvents(userId).filter((e) => e.id !== eventId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(events));
    notifyLocalChange();
  }

  // 2. Suppression Cloud Firestore
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (err) {
      console.warn('[Firestore] Erreur deleteEventById :', err);
    }
  }
};

export const deleteAllEvents = async (userId?: string): Promise<void> => {
  const currentUserId = userId || null;

  // 1. Vider le LocalStorage
  const key = currentUserId ? `${LOCAL_STORAGE_KEYS.EVENTS}_${currentUserId}` : LOCAL_STORAGE_KEYS.EVENTS;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
    notifyLocalChange();
  }

  // 2. Vider Firestore pour cet utilisateur
  if (isFirebaseConfigured && db) {
    try {
      const eventsRef = collection(db, 'events');
      const q = currentUserId
        ? query(eventsRef, where('userId', '==', currentUserId))
        : query(eventsRef);

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach((d) => {
          batch.delete(d.ref);
        });
        await batch.commit();
      }
    } catch (err) {
      console.warn('[Firestore] Erreur deleteAllEvents :', err);
    }
  }
};

// --- GESTIONNAIRES LECTURES (LIVRES, MANGA, ROMANS, STREAK & OBJECTIFS) ---

export const getLocalBooks = (userId?: string): Book[] => {
  if (typeof window === 'undefined') return [];
  const key = userId ? `${LOCAL_STORAGE_KEYS.BOOKS}_${userId}` : LOCAL_STORAGE_KEYS.BOOKS;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  // Migration automatique depuis l'ancienne clé globale sans userId
  const legacy = localStorage.getItem('syntropy_reading_books_v1');
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (key !== 'syntropy_reading_books_v1') {
          localStorage.setItem(key, legacy);
        }
        return parsed;
      }
    } catch {}
  }
  return [];
};

export const getLocalReadingProfile = (userId?: string): ReadingProfile => {
  const defaultProfile: ReadingProfile = { yearlyGoal: 12, dayLog: {} };
  if (typeof window === 'undefined') return defaultProfile;
  const key = userId ? `${LOCAL_STORAGE_KEYS.READING_PROFILE}_${userId}` : LOCAL_STORAGE_KEYS.READING_PROFILE;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        yearlyGoal: Number(parsed.yearlyGoal) || 12,
        dayLog: parsed.dayLog || {},
      };
    } catch {
      return defaultProfile;
    }
  }
  // Migration automatique depuis les anciennes clés globales
  const legacyLog = localStorage.getItem('syntropy_reading_log_v1');
  const legacyGoal = localStorage.getItem('syntropy_reading_goal_v1');
  if (legacyLog || legacyGoal) {
    try {
      const profile: ReadingProfile = {
        yearlyGoal: Number(legacyGoal) || 12,
        dayLog: legacyLog ? JSON.parse(legacyLog) : {},
      };
      localStorage.setItem(key, JSON.stringify(profile));
      return profile;
    } catch {}
  }
  return defaultProfile;
};

export const subscribeToBooks = (
  userId: string | undefined,
  callback: (books: Book[]) => void,
  onError?: (error: unknown) => void
): (() => void) => {
  // 1. Rendu immédiat depuis le cache local (0ms de latence)
  callback(getLocalBooks(userId));

  // 2. Écoute réactive des événements locaux
  const localHandler = () => {
    callback(getLocalBooks(userId));
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('second_brain_data_changed', localHandler);
  }

  // 3. Écoute Firestore en temps réel en arrière-plan
  let unsubFirestore = () => {};
  if (isFirebaseConfigured && db) {
    try {
      const booksRef = collection(db, 'books');
      const q = userId
        ? query(booksRef, where('userId', '==', userId))
        : query(booksRef, orderBy('createdAt', 'desc'));

      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const books: Book[] = snapshot.docs
              .map((d) => ({
                id: d.id,
                ...(d.data() as Omit<Book, 'id'>),
              }))
              .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

            const key = userId ? `${LOCAL_STORAGE_KEYS.BOOKS}_${userId}` : LOCAL_STORAGE_KEYS.BOOKS;
            if (typeof window !== 'undefined') {
              localStorage.setItem(key, JSON.stringify(books));
            }
            callback(books);
          } else {
            // Snapshot vide : si on a des livres locaux non encore migrés vers le Cloud, on les transfère automatiquement !
            const localBooks = getLocalBooks(userId);
            if (localBooks.length > 0 && userId) {
              localBooks.forEach((b) => {
                saveBook(b, userId).catch(() => {});
              });
            }
            callback(localBooks);
          }
        },
        (error) => {
          console.warn('[Firestore] Erreur écoute books, bascule locale :', error);
          if (onError) onError(error);
          callback(getLocalBooks(userId));
        }
      );
    } catch (e) {
      console.warn('[Firestore] Exception abonnement books, fallback local :', e);
    }
  }

  return () => {
    unsubFirestore();
    if (typeof window !== 'undefined') {
      window.removeEventListener('second_brain_data_changed', localHandler);
    }
  };
};

export const saveBook = async (book: Book, userId?: string): Promise<void> => {
  const currentUserId = book.userId || userId || null;
  const bookToSave: Book = {
    ...book,
    userId: currentUserId || undefined,
    updatedAt: new Date().toISOString(),
  };

  // 1. Toujours enregistrer immédiatement dans le cache local
  const key = currentUserId ? `${LOCAL_STORAGE_KEYS.BOOKS}_${currentUserId}` : LOCAL_STORAGE_KEYS.BOOKS;
  const books = getLocalBooks(currentUserId || undefined);
  const index = books.findIndex((b) => b.id === book.id);
  if (index >= 0) {
    books[index] = bookToSave;
  } else {
    books.unshift(bookToSave);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(books));
    notifyLocalChange();
  }

  // 2. Synchronisation Cloud Firestore
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'books', book.id), {
        title: book.title,
        author: book.author || '',
        kind: book.kind,
        coverUrl: book.coverUrl || null,
        status: book.status,
        unit: book.unit,
        totalPages: book.totalPages || 0,
        progress: book.progress || 0,
        startedAt: book.startedAt || null,
        finishedAt: book.finishedAt || null,
        createdAt: book.createdAt,
        updatedAt: bookToSave.updatedAt,
        userId: currentUserId,
      });
    } catch (err) {
      console.warn('[Firestore] Erreur saveBook, conservé en cache local :', err);
    }
  }
};

export const deleteBookById = async (bookId: string, userId?: string): Promise<void> => {
  const currentUserId = userId || null;

  // 1. LocalStorage immédiat
  const key = currentUserId ? `${LOCAL_STORAGE_KEYS.BOOKS}_${currentUserId}` : LOCAL_STORAGE_KEYS.BOOKS;
  const books = getLocalBooks(userId).filter((b) => b.id !== bookId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(books));
    notifyLocalChange();
  }

  // 2. Suppression Cloud Firestore
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'books', bookId));
    } catch (err) {
      console.warn('[Firestore] Erreur deleteBookById :', err);
    }
  }
};

export const subscribeToReadingProfile = (
  userId: string | undefined,
  callback: (profile: ReadingProfile) => void,
  onError?: (error: unknown) => void
): (() => void) => {
  // 1. Rendu immédiat local
  callback(getLocalReadingProfile(userId));

  // 2. Écoute réactive locale
  const localHandler = () => {
    callback(getLocalReadingProfile(userId));
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('second_brain_data_changed', localHandler);
  }

  // 3. Écoute Firestore
  let unsubFirestore = () => {};
  if (isFirebaseConfigured && db && userId) {
    try {
      const profileRef = doc(db, 'reading_profiles', userId);
      unsubFirestore = onSnapshot(
        profileRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as ReadingProfile;
            const profile: ReadingProfile = {
              userId,
              yearlyGoal: Number(data.yearlyGoal) || 12,
              dayLog: data.dayLog || {},
              updatedAt: data.updatedAt,
            };
            const key = `${LOCAL_STORAGE_KEYS.READING_PROFILE}_${userId}`;
            if (typeof window !== 'undefined') {
              localStorage.setItem(key, JSON.stringify(profile));
            }
            callback(profile);
          } else {
            // S'il n'existe pas encore dans Firestore, on migre le profil local s'il a des logs
            const local = getLocalReadingProfile(userId);
            if (Object.keys(local.dayLog || {}).length > 0 || local.yearlyGoal !== 12) {
              saveReadingProfile(local, userId).catch(() => {});
            }
            callback(local);
          }
        },
        (error) => {
          console.warn('[Firestore] Erreur écoute reading_profile :', error);
          if (onError) onError(error);
          callback(getLocalReadingProfile(userId));
        }
      );
    } catch (e) {
      console.warn('[Firestore] Exception reading_profile :', e);
    }
  }

  return () => {
    unsubFirestore();
    if (typeof window !== 'undefined') {
      window.removeEventListener('second_brain_data_changed', localHandler);
    }
  };
};

export const saveReadingProfile = async (profile: ReadingProfile, userId?: string): Promise<void> => {
  const currentUserId = profile.userId || userId || null;
  const profileToSave: ReadingProfile = {
    ...profile,
    userId: currentUserId || undefined,
    updatedAt: new Date().toISOString(),
  };

  const key = currentUserId ? `${LOCAL_STORAGE_KEYS.READING_PROFILE}_${currentUserId}` : LOCAL_STORAGE_KEYS.READING_PROFILE;
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(profileToSave));
    notifyLocalChange();
  }

  if (isFirebaseConfigured && db && currentUserId) {
    try {
      await setDoc(doc(db, 'reading_profiles', currentUserId), {
        yearlyGoal: profileToSave.yearlyGoal || 12,
        dayLog: profileToSave.dayLog || {},
        updatedAt: profileToSave.updatedAt,
        userId: currentUserId,
      }, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Erreur saveReadingProfile :', err);
    }
  }
};


