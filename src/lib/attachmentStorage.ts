// ==============================================================================
// SYNTROPY OS — GESTION DU STOCKAGE LOCAL PERMANENT DES PIÈCES JOINTES (INDEXEDDB)
// ==============================================================================
// Permet de mettre en cache les fichiers volumineux (PDF, PPTX, Images jusqu'à 25 Mo)
// sans saturer la limite stricte de 5 Mo de localStorage.

const DB_NAME = 'syntropy_attachment_cache';
const DB_VERSION = 1;
const STORE_NAME = 'files';

interface CachedFileRecord {
  id: string;
  dataUrl: string;
  cachedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB non disponible hors navigateur'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('[IndexedDB] Erreur ouverture cache attachments :', request.error);
        reject(request.error);
      };
    } catch (err) {
      console.warn('[IndexedDB] Exception ouverture cache attachments :', err);
      reject(err);
    }
  });

  return dbPromise;
}

/**
 * Enregistre une pièce jointe (dataUrl base64) dans le cache local IndexedDB.
 */
export async function saveAttachmentLocally(attId: string, dataUrl: string): Promise<void> {
  if (!attId || !dataUrl || typeof window === 'undefined') return;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: CachedFileRecord = {
        id: attId,
        dataUrl,
        cachedAt: Date.now(),
      };
      const req = store.put(record);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Impossible de cacher le fichier ${attId} :`, err);
  }
}

/**
 * Récupère le dataUrl d'une pièce jointe depuis le cache local IndexedDB (0ms de latence).
 */
export async function getAttachmentLocally(attId: string): Promise<string | null> {
  if (!attId || typeof window === 'undefined') return null;
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(attId);

      req.onsuccess = () => {
        const record = req.result as CachedFileRecord | undefined;
        resolve(record?.dataUrl || null);
      };

      req.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn(`[IndexedDB] Erreur lecture fichier ${attId} :`, err);
    return null;
  }
}

/**
 * Supprime une pièce jointe du cache local IndexedDB.
 */
export async function deleteAttachmentLocally(attId: string): Promise<void> {
  if (!attId || typeof window === 'undefined') return;
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(attId);

      req.onsuccess = () => resolve();
      req.onerror = () => resolve(); // Ignore les erreurs de suppression
    });
  } catch (err) {
    console.warn(`[IndexedDB] Erreur suppression fichier ${attId} :`, err);
  }
}

/**
 * Vide l'ensemble du cache des pièces jointes locales.
 */
export async function clearAllAttachmentsLocally(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('[IndexedDB] Erreur vidage cache attachments :', err);
  }
}
