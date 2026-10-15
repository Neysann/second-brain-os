'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { FileText, Plus, ExternalLink, Trash2, Tag } from 'lucide-react';
import { useData } from '@/context/DataContext';

export const QuickNotesWidget: React.FC = () => {
  const { notes, addNote, deleteNote } = useData();
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trier les notes réelles par date de modification / création décroissante
  const recentNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt))
      .slice(0, 4);
  }, [notes]);

  const handleAddQuickNote = async () => {
    if (!newNoteText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addNote({
        title: newNoteText.trim(),
        content: '',
        category: 'resource',
        tags: ['mémo', 'inbox'],
      });
      setNewNoteText('');
      setIsInputOpen(false);
    } catch (err) {
      console.error("Erreur lors de l'ajout du mémo:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddQuickNote();
    }
  };

  return (
    <div className="flex flex-col h-full justify-between p-3 select-none">
      {/* En-tête */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Notes & Mémos</span>
          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
            ({notes.length})
          </span>
        </span>
        <Link
          href="/notes"
          className="text-[10px] text-zinc-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors flex items-center gap-0.5"
          title="Ouvrir la section Notes"
        >
          Voir tout <ExternalLink className="w-2.5 h-2.5" />
        </Link>
      </div>

      {/* Contenu : Liste synchronisée avec /notes */}
      {recentNotes.length === 0 ? (
        <div className="my-1.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-zinc-800 dark:text-zinc-200 flex-1 flex flex-col justify-center gap-1.5">
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <span>💡</span>
            <span>Mémos instantanés</span>
          </div>
          <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-tight">
            Tapez un mémo rapide ci-dessous pour créer une note synchronisée en direct avec votre écran <strong className="text-zinc-900 dark:text-white">Notes</strong>.
          </p>
        </div>
      ) : (
        <div className="my-1.5 p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-zinc-800 dark:text-zinc-200 flex-1 overflow-y-auto max-h-[110px] scrollbar-thin space-y-1">
          {recentNotes.map((note) => (
            <div
              key={note.id}
              className="flex items-center justify-between p-1 rounded-lg hover:bg-amber-500/15 transition-colors group"
            >
              <Link
                href="/notes"
                className="flex items-center gap-1.5 min-w-0 flex-1 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                title="Ouvrir dans l'éditeur de notes"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-xs font-semibold truncate">
                  {note.title || 'Note sans titre'}
                </span>
                {note.tags && note.tags.length > 0 && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono shrink-0 hidden sm:inline">
                    #{note.tags[0]}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={() => deleteNote(note.id)}
                className="p-1 rounded text-zinc-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ml-1"
                title="Supprimer la note"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Champ d'ajout rapide inline */}
      {isInputOpen ? (
        <div className="flex items-center gap-1 mt-1">
          <input
            type="text"
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Titre du mémo rapide..."
            autoFocus
            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500"
          />
          <button
            type="button"
            onClick={handleAddQuickNote}
            disabled={isSubmitting || !newNoteText.trim()}
            className="p-1 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsInputOpen(true)}
          className="w-full py-1 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>+ Ajouter un mémo</span>
        </button>
      )}
    </div>
  );
};

export default QuickNotesWidget;
