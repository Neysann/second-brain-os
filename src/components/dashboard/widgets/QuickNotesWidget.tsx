'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { FileText, Plus, ExternalLink, Trash2, Settings } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { QuickNotesWidgetSettings } from '@/types/dashboard';

interface QuickNotesWidgetProps {
  settings?: QuickNotesWidgetSettings;
  onOpenSettings?: () => void;
}

export const QuickNotesWidget: React.FC<QuickNotesWidgetProps> = ({
  settings,
  onOpenSettings,
}) => {
  const { notes, addNote, deleteNote } = useData();
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardColor = settings?.cardColor || settings?.themeColor || 'amber';
  const fontSize = settings?.fontSize || 'medium';
  const defaultTag = settings?.defaultTag || 'mémo';

  // Config de style dynamique selon la couleur
  const colorStyles = useMemo(() => {
    switch (cardColor) {
      case 'purple':
        return {
          bg: 'bg-purple-500/10 border-purple-500/20 text-zinc-800 dark:text-zinc-200',
          hoverBg: 'hover:bg-purple-500/15',
          dot: 'bg-purple-500',
          tag: 'bg-purple-500/20 text-purple-800 dark:text-purple-300',
          headerIcon: 'text-purple-500 dark:text-purple-400',
          btnBg: 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-800 dark:text-purple-300 border-purple-500/30',
          submitBg: 'bg-purple-600 hover:bg-purple-500',
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-zinc-800 dark:text-zinc-200',
          hoverBg: 'hover:bg-emerald-500/15',
          dot: 'bg-emerald-500',
          tag: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300',
          headerIcon: 'text-emerald-500 dark:text-emerald-400',
          btnBg: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
          submitBg: 'bg-emerald-600 hover:bg-emerald-500',
        };
      case 'cyan':
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/20 text-zinc-800 dark:text-zinc-200',
          hoverBg: 'hover:bg-cyan-500/15',
          dot: 'bg-cyan-500',
          tag: 'bg-cyan-500/20 text-cyan-800 dark:text-cyan-300',
          headerIcon: 'text-cyan-500 dark:text-cyan-400',
          btnBg: 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-800 dark:text-cyan-300 border-cyan-500/30',
          submitBg: 'bg-cyan-600 hover:bg-cyan-500',
        };
      case 'rose':
        return {
          bg: 'bg-rose-500/10 border-rose-500/20 text-zinc-800 dark:text-zinc-200',
          hoverBg: 'hover:bg-rose-500/15',
          dot: 'bg-rose-500',
          tag: 'bg-rose-500/20 text-rose-800 dark:text-rose-300',
          headerIcon: 'text-rose-500 dark:text-rose-400',
          btnBg: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-800 dark:text-rose-300 border-rose-500/30',
          submitBg: 'bg-rose-600 hover:bg-rose-500',
        };
      case 'dark':
        return {
          bg: 'bg-zinc-900/70 border-zinc-700/60 text-zinc-100',
          hoverBg: 'hover:bg-zinc-800/60',
          dot: 'bg-zinc-400',
          tag: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
          headerIcon: 'text-zinc-400',
          btnBg: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700',
          submitBg: 'bg-zinc-700 hover:bg-zinc-600',
        };
      case 'amber':
      default:
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-zinc-800 dark:text-zinc-200',
          hoverBg: 'hover:bg-amber-500/15',
          dot: 'bg-amber-500',
          tag: 'bg-amber-500/20 text-amber-800 dark:text-amber-300',
          headerIcon: 'text-amber-500 dark:text-amber-400',
          btnBg: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border-amber-500/30',
          submitBg: 'bg-amber-500 hover:bg-amber-600',
        };
    }
  }, [cardColor]);

  const textSizeClass =
    fontSize === 'small' || (fontSize as string) === 'sm'
      ? 'text-[11px]'
      : fontSize === 'large' || (fontSize as string) === 'lg'
      ? 'text-[13px]'
      : 'text-xs';

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
        tags: [defaultTag, 'inbox'],
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
    <div className="flex flex-col h-full justify-between p-3 select-none group/widget">
      {/* En-tête */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <FileText className={`w-3.5 h-3.5 ${colorStyles.headerIcon}`} />
          <span>Notes & Mémos</span>
          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
            ({notes.length})
          </span>
        </span>
        <div className="flex items-center gap-1.5">
          <Link
            href="/notes"
            className="text-[10px] text-zinc-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors flex items-center gap-0.5"
            title="Ouvrir la section Notes"
          >
            Voir tout <ExternalLink className="w-2.5 h-2.5" />
          </Link>
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-0.5 rounded text-zinc-400 hover:text-amber-500 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              title="Options notes"
            >
              <Settings className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* Contenu : Liste synchronisée avec /notes */}
      {recentNotes.length === 0 ? (
        <div className={`my-1.5 p-2.5 rounded-xl border ${colorStyles.bg} flex-1 flex flex-col justify-center gap-1.5`}>
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
            <span>💡</span>
            <span>Mémos instantanés</span>
          </div>
          <p className="text-[11px] leading-tight">
            Tapez un mémo rapide ci-dessous pour créer une note synchronisée en direct avec votre écran <strong>Notes</strong>.
          </p>
        </div>
      ) : (
        <div className={`my-1.5 p-1.5 rounded-xl border ${colorStyles.bg} flex-1 overflow-y-auto max-h-[110px] scrollbar-thin space-y-1`}>
          {recentNotes.map((note) => (
            <div
              key={note.id}
              className={`flex items-center justify-between p-1 rounded-lg ${colorStyles.hoverBg} transition-colors group`}
            >
              <Link
                href="/notes"
                className="flex items-center gap-1.5 min-w-0 flex-1 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                title="Ouvrir dans l'éditeur de notes"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${colorStyles.dot} shrink-0`} />
                <span className={`${textSizeClass} font-semibold truncate`}>
                  {note.title || 'Note sans titre'}
                </span>
                {note.tags && note.tags.length > 0 && (
                  <span className={`text-[9px] px-1 py-0.2 rounded ${colorStyles.tag} font-mono shrink-0 hidden sm:inline`}>
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
            placeholder={`Titre du mémo (${defaultTag})...`}
            autoFocus
            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500"
          />
          <button
            type="button"
            onClick={handleAddQuickNote}
            disabled={isSubmitting || !newNoteText.trim()}
            className={`p-1 rounded-lg text-white cursor-pointer shadow-xs transition-colors ${colorStyles.submitBg} disabled:opacity-50`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsInputOpen(true)}
          className={`w-full py-1 rounded-xl text-xs font-semibold border transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer ${colorStyles.btnBg}`}
        >
          <Plus className="w-3 h-3" />
          <span>+ Ajouter un mémo</span>
        </button>
      )}
    </div>
  );
};

export default QuickNotesWidget;
