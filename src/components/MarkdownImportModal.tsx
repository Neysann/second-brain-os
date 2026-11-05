'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCode,
  X,
  FilePlus,
  ArrowDownToLine,
  RefreshCw,
  Tag,
  Check,
  FileText,
  Sparkles,
  Info,
} from 'lucide-react';
import { ParsedMarkdownNote } from '@/lib/markdownImporter';

interface MarkdownImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedNote: ParsedMarkdownNote | null;
  currentNoteTitle?: string;
  onInsertAppend: (note: ParsedMarkdownNote, customTitle?: string) => void;
  onInsertReplace: (note: ParsedMarkdownNote, customTitle?: string) => void;
  onCreateNewNote: (note: ParsedMarkdownNote, customTitle?: string) => void;
  isDark: boolean;
}

export default function MarkdownImportModal({
  isOpen,
  onClose,
  parsedNote,
  currentNoteTitle,
  onInsertAppend,
  onInsertReplace,
  onCreateNewNote,
  isDark,
}: MarkdownImportModalProps) {
  const [editedTitle, setEditedTitle] = useState('');

  useEffect(() => {
    if (parsedNote) {
      setEditedTitle(parsedNote.title || '');
    }
  }, [parsedNote]);

  // Raccourci Échap pour fermer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !parsedNote) return null;

  const previewSnippet = parsedNote.content.slice(0, 450);
  const isTruncated = parsedNote.content.length > 450;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden transition-all animate-in zoom-in-95 duration-150 ${
          isDark
            ? 'bg-zinc-900/95 border-zinc-800 text-zinc-100 shadow-cyan-950/20'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-400/20'
        }`}
      >
        {/* Header de la Modale */}
        <div
          className={`p-5 border-b flex items-center justify-between gap-3 ${
            isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-100 bg-zinc-50/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner flex-shrink-0">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Importer un fichier Markdown</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold">
                  .md
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Fichier source : <span className="font-mono text-cyan-400">{parsedNote.fileName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                : 'border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800'
            }`}
            title="Fermer (Échap)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps & Aperçu du Fichier Importé */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Métadonnées détectées */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            {/* Titre extrait */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Titre de la note :</span>
              </label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Titre de la note"
                className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none transition-all ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-cyan-500'
                    : 'bg-white border-zinc-300 text-zinc-900 focus:border-cyan-600'
                }`}
              />
            </div>

            {/* Tags extraits */}
            {parsedNote.tags.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5">
                  <Tag className="w-3.5 h-3.5 text-purple-400" />
                  <span>Tags détectés ({parsedNote.tags.length}) :</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {parsedNote.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Aperçu du Markdown */}
            <div>
              <div className="text-[11px] font-semibold text-zinc-400 mb-1.5 flex items-center justify-between">
                <span>Extrait du contenu :</span>
                {parsedNote.hasFrontmatter && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Frontmatter YAML extrait proprement
                  </span>
                )}
              </div>
              <pre
                className={`p-3 rounded-xl border text-[11px] font-mono whitespace-pre-wrap break-words max-h-32 overflow-y-auto ${
                  isDark
                    ? 'bg-zinc-900/80 border-zinc-800 text-zinc-300'
                    : 'bg-white border-zinc-200 text-zinc-700'
                }`}
              >
                {previewSnippet}
                {isTruncated && '...'}
              </pre>
            </div>
          </div>

          {/* Choix d'action : Créer ou Insérer */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
              Que souhaitez-vous faire ?
            </div>

            {/* Option 1 : Créer une nouvelle note */}
            <button
              type="button"
              onClick={() => {
                onCreateNewNote(parsedNote, editedTitle.trim());
                onClose();
              }}
              className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer group ${
                isDark
                  ? 'bg-indigo-950/20 hover:bg-indigo-900/30 border-indigo-500/30 hover:border-indigo-400'
                  : 'bg-indigo-50 hover:bg-indigo-100/70 border-indigo-200 hover:border-indigo-300'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <FilePlus className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-300">
                    Créer comme nouvelle note
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300">
                    Recommandé
                  </span>
                </div>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Crée une note autonome avec ce titre, ce contenu et ces tags dans le dossier actif.
                </p>
              </div>
            </button>

            {/* Option 2 : Insérer dans la note actuelle (si une note est ouverte) */}
            {currentNoteTitle && (
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200'
                }`}
              >
                <div>
                  <div className="text-xs font-bold flex items-center gap-2 text-cyan-400">
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>Insérer dans la note ouverte :</span>
                  </div>
                  <div className={`text-[11px] mt-0.5 truncate ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Note active : « <span className="font-semibold text-zinc-200">{currentNoteTitle}</span> »
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {/* Ajouter à la fin */}
                  <button
                    type="button"
                    onClick={() => {
                      onInsertAppend(parsedNote, editedTitle.trim());
                      onClose();
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all cursor-pointer ${
                      isDark
                        ? 'bg-zinc-800/60 hover:bg-zinc-800 border-zinc-700 hover:border-cyan-500/40 text-zinc-200'
                        : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 hover:border-cyan-500 text-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-cyan-400">
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>Ajouter à la fin</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      Conserve le texte existant et ajoute le fichier à la suite.
                    </p>
                  </button>

                  {/* Remplacer le contenu */}
                  <button
                    type="button"
                    onClick={() => {
                      onInsertReplace(parsedNote, editedTitle.trim());
                      onClose();
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all cursor-pointer ${
                      isDark
                        ? 'bg-zinc-800/60 hover:bg-zinc-800 border-zinc-700 hover:border-amber-500/40 text-zinc-200'
                        : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 hover:border-amber-500 text-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-400">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Remplacer le texte</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      Écrase le contenu de la note actuelle par ce fichier Markdown.
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-zinc-800 bg-zinc-950/40 text-zinc-400' : 'border-zinc-100 bg-zinc-50 text-zinc-600'
          }`}
        >
          <span className="flex items-center gap-1.5 text-[11px]">
            <Info className="w-3.5 h-3.5 text-zinc-500" />
            <span>Aucune pièce jointe binaire n&apos;est créée : la note reste légère et rapide.</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`px-3 py-1.5 rounded-xl border font-medium transition-colors cursor-pointer ${
              isDark
                ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                : 'border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700'
            }`}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

