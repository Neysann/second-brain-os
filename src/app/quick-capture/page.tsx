'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  CheckCircle2,
  FileText,
  CheckSquare,
  Lightbulb,
  Mic,
  MicOff,
  X,
  Send,
  Calendar,
  Tag,
  FolderGit2,
  CornerDownLeft,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { TaskPriority } from '@/types';

type CaptureType = 'task' | 'note' | 'idea';

export default function QuickCapturePage() {
  const { addTask, addNote, folders, projects } = useData();
  const { user } = useAuth();

  const [captureType, setCaptureType] = useState<CaptureType>('task');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Focus automatique au chargement
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);

    // Initialisation SpeechRecognition si disponible
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'fr-FR';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (captureType === 'task') {
            setTitle((prev) => (prev ? prev + ' ' : '') + transcript.trim());
          } else {
            setContent((prev) => (prev ? prev + ' ' : '') + transcript.trim());
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    // Raccourci Échap pour fermer la fenêtre
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [captureType]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('La reconnaissance vocale n\'est pas supportée sur ce navigateur/moteur.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.hideQuickCapture) {
      (window as any).electronAPI.hideQuickCapture();
    } else if (typeof window !== 'undefined' && window.opener) {
      window.close();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (captureType === 'task') {
        addTask({
          title: title.trim(),
          description: content.trim() || undefined,
          status: 'todo',
          priority,
          category: 'project',
          dueDate: dueDate || undefined,
          tags: ['capture-rapide', 'desktop'],
        });
      } else if (captureType === 'note') {
        addNote({
          title: title.trim(),
          content: content.trim() || '# ' + title.trim(),
          category: 'resource',
          tags: ['capture-rapide', 'brouillon'],
          isPinned: false,
        });
      } else if (captureType === 'idea') {
        // Idée brute vers l'Inbox PARA
        addNote({
          title: `💡 Idée : ${title.trim()}`,
          content: `${content.trim() ? content.trim() + '\n\n' : ''}*Capturé rapidement via le raccourci Alt+Espace le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}*`,
          category: 'resource',
          tags: ['inbox', 'idee', 'para-inbox'],
          isPinned: false,
        });
      }

      setIsSaved(true);
      setTitle('');
      setContent('');

      // Auto-fermeture après confirmation
      setTimeout(() => {
        setIsSaved(false);
        setIsSubmitting(false);
        handleClose();
      }, 700);
    } catch (err) {
      console.error('Erreur sauvegarde rapide:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-3 select-none">
      <div className="w-full max-w-xl bg-zinc-950/95 border border-purple-500/40 rounded-2xl shadow-2xl shadow-purple-950/80 backdrop-blur-2xl overflow-hidden transition-all text-zinc-100 flex flex-col">
        {/* Barre supérieure déplaçable (drag region) */}
        <div
          className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800 cursor-move"
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/40">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            </span>
            <span className="text-xs font-black tracking-wide bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              SYNTROPY OS — CAPTURE RAPIDE
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              Alt + Espace
            </span>
          </div>

          <div
            className="flex items-center gap-2"
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Fermer (Échap)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sélecteur de type : Tâche / Note / Idée */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-1 border-b border-zinc-800/60 bg-zinc-900/40">
          {[
            { id: 'task' as CaptureType, label: 'Tâche', icon: CheckSquare, color: 'text-blue-400' },
            { id: 'note' as CaptureType, label: 'Note', icon: FileText, color: 'text-purple-400' },
            { id: 'idea' as CaptureType, label: 'Idée Inbox', icon: Lightbulb, color: 'text-amber-400' },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = captureType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCaptureType(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Formulaire de saisie rapide */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Titre principal */}
          <div className="relative">
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                captureType === 'task'
                  ? 'Ex: Réviser le chapitre 4 ou envoyer le rapport...'
                  : captureType === 'note'
                  ? 'Titre de la note...'
                  : 'Une idée spontanée, intuition ou inspiration...'
              }
              className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
              disabled={isSubmitting || isSaved}
            />
          </div>

          {/* Contenu secondaire / description */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                captureType === 'task'
                  ? 'Détails facultatifs, liens ou sous-étapes...'
                  : 'Contenu Markdown, points clés ou réflexions...'
              }
              rows={2}
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/60 transition-all resize-none"
              disabled={isSubmitting || isSaved}
            />
          </div>

          {/* Paramètres contextuels pour tâche */}
          {captureType === 'task' && (
            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Priorité:</span>
                {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                      priority === p
                        ? p === 'urgent'
                          ? 'bg-rose-500 text-white'
                          : p === 'high'
                          ? 'bg-amber-500 text-black'
                          : 'bg-purple-600 text-white'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {p === 'low' ? 'Basse' : p === 'medium' ? 'Normale' : p === 'high' ? 'Haute' : 'Urgente'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
                <Calendar className="w-3 h-3 text-zinc-500" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-transparent text-[11px] text-zinc-300 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Barre d'action inférieure */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
                }`}
                title="Dictée vocale"
              >
                {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                <span className="text-[11px] hidden sm:inline">
                  {isListening ? 'Écoute en cours...' : 'Dicter'}
                </span>
              </button>

              <span className="text-[10px] text-zinc-500 hidden sm:inline">
                Appuyez sur <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">Entrée</kbd> pour valider
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={!title.trim() || isSubmitting || isSaved}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg ${
                  isSaved
                    ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                    : title.trim()
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Enregistré !</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Enregistrer</span>
                    <CornerDownLeft className="w-3 h-3 opacity-70" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
