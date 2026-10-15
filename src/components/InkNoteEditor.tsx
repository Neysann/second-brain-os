'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { Note, InkDocument, InkPaperColor } from '@/types';
import { StylusCanvas } from './StylusCanvas';
import { decodeInk, encodeInk, emptyInkDocument } from '@/lib/inkCodec';
import { loadInkChunks } from '@/lib/dataService';
import { useSettings } from '@/context/SettingsContext';
import { Loader2, Check, CloudUpload, Clock } from 'lucide-react';

export interface InkNoteEditorProps {
  note: Note;
  onSaveInk: (noteId: string, encodedInk: string) => void;
  className?: string;
}

export const InkNoteEditor: React.FC<InkNoteEditorProps> = ({
  note,
  onSaveInk,
  className = '',
}) => {
  const { settings } = useSettings();
  const defaultPaper = (settings.defaultInkPaperColor || 'dark') as InkPaperColor;

  const [doc, setDoc] = useState<InkDocument | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'writing' | 'saving' | 'saved'>('idle');

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDocRef = useRef<InkDocument | null>(null);
  const loadedNoteIdRef = useRef<string | null>(null);
  const currentNoteIdRef = useRef<string>(note.id);

  currentNoteIdRef.current = note.id;

  // Chargement des données d'encre UNIQUEMENT lors du changement de note (note.id)
  // Cela empêche le composant d'être démonté lors des sauvegardes automatiques,
  // ce qui résout le bug où le mode plein écran sautait tout seul.
  useEffect(() => {
    let active = true;

    // Si on a déjà chargé cette note, on ne recharge pas depuis note.ink pour préserver le canevas
    if (loadedNoteIdRef.current === note.id) {
      return;
    }

    setIsLoading(true);

    const load = async () => {
      let rawInk = note.ink;

      // Si l'encre est segmentée en sous-collection Firestore
      if (!rawInk && note.inkChunks && note.inkChunks > 0) {
        rawInk = await loadInkChunks(note.id);
      }

      if (!active) return;

      if (rawInk) {
        const decoded = await decodeInk(rawInk);
        if (active) {
          const documentToLoad = decoded || emptyInkDocument(defaultPaper);
          // Si le document n'a pas de couleur de feuille explicite, utiliser la préférence par défaut
          if (!documentToLoad.paperColor) {
            documentToLoad.paperColor = defaultPaper;
          }
          setDoc(documentToLoad);
          loadedNoteIdRef.current = note.id;
          setIsLoading(false);
        }
      } else {
        setDoc(emptyInkDocument(defaultPaper));
        loadedNoteIdRef.current = note.id;
        setIsLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [note.id, note.ink, note.inkChunks, defaultPaper]);

  // Fonction de flush immédiat pour sauvegarder sans attendre le debounce
  const flushSave = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const pending = pendingDocRef.current;
    if (pending) {
      pendingDocRef.current = null;
      try {
        setSaveStatus('saving');
        const encoded = await encodeInk(pending);
        onSaveInk(currentNoteIdRef.current, encoded);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('[InkNoteEditor] Erreur lors de la sauvegarde :', err);
        setSaveStatus('idle');
      }
    }
  }, [onSaveInk]);

  // Sauvegarde à la fermeture ou au démontage
  useEffect(() => {
    return () => {
      flushSave();
    };
  }, [flushSave]);

  // Détection d'écriture : délai de 3 secondes d'inactivité avant compression et sauvegarde
  const handleChange = useCallback(
    (newDoc: InkDocument) => {
      pendingDocRef.current = newDoc;
      setSaveStatus('writing');

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // 3000 ms (3 secondes) à la fin de l'écriture avant compression et envoi Firestore
      debounceTimerRef.current = setTimeout(async () => {
        debounceTimerRef.current = null;
        const toSave = pendingDocRef.current;
        if (!toSave) return;
        pendingDocRef.current = null;

        try {
          setSaveStatus('saving');
          const encoded = await encodeInk(toSave);
          onSaveInk(currentNoteIdRef.current, encoded);
          setSaveStatus('saved');
          setTimeout(() => {
            setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev));
          }, 2500);
        } catch (err) {
          console.error('[InkNoteEditor] Erreur encodeInk :', err);
          setSaveStatus('idle');
        }
      }, 3000);
    },
    [onSaveInk]
  );

  if (isLoading || !doc) {
    return (
      <div className="flex flex-col items-center justify-center h-[580px] bg-zinc-950 text-zinc-400 rounded-2xl border border-zinc-800">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-3" />
        <span className="text-sm">Chargement du canevas manuscrit...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Badge de statut de sauvegarde manuscrite */}
      {saveStatus !== 'idle' && (
        <div className="absolute bottom-4 right-4 z-40 pointer-events-none">
          {saveStatus === 'writing' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/90 border border-amber-500/40 text-amber-300 text-xs font-medium shadow-lg backdrop-blur-md animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              <span>Enregistrement dans 3s...</span>
            </div>
          )}
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/90 border border-purple-500/40 text-purple-300 text-xs font-medium shadow-lg backdrop-blur-md">
              <CloudUpload className="w-3.5 h-3.5 animate-bounce" />
              <span>Compression & Sauvegarde...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-medium shadow-lg backdrop-blur-md">
              <Check className="w-3.5 h-3.5" />
              <span>Note compressée & enregistrée</span>
            </div>
          )}
        </div>
      )}

      <StylusCanvas
        key={note.id}
        initialDocument={doc}
        onChange={handleChange}
        exportName={`note-${note.title.toLowerCase().replace(/[^a-z0-9]/gi, '_') || 'manuscrit'}`}
        className={className}
      />
    </div>
  );
};

export default InkNoteEditor;
