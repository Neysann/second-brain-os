'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CheckSquare,
  FileText,
  Plus,
  Check,
  Mic,
  MicOff,
  ExternalLink,
  Flame,
  Calendar,
  Send,
} from 'lucide-react';
import { Task, TaskPriority } from '@/types';
import { useData } from '@/context/DataContext';

interface IslandTasksCaptureTabProps {
  autoFocusCapture?: boolean;
  onCaptureActiveChange: (active: boolean) => void;
  onCloseIsland: () => void;
  accentHex: string;
}

export const IslandTasksCaptureTab: React.FC<IslandTasksCaptureTabProps> = ({
  autoFocusCapture,
  onCaptureActiveChange,
  onCloseIsland,
  accentHex,
}) => {
  const { tasks, addTask, addNote, toggleTaskStatus } = useData();

  const [captureMode, setCaptureMode] = useState<'task' | 'note'>('task');
  const [title, setTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [dueDate, setDueDate] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Tri des tâches prioritaires non terminées
  const priorityTasks = React.useMemo(() => {
    const weight: Record<TaskPriority, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return tasks
      .filter((t) => t.status !== 'done')
      .sort((a, b) => {
        const aDueToday = a.dueDate && a.dueDate <= todayStr ? 1 : 0;
        const bDueToday = b.dueDate && b.dueDate <= todayStr ? 1 : 0;
        if (bDueToday !== aDueToday) return bDueToday - aDueToday;
        const pw = (weight[b.priority] || 1) - (weight[a.priority] || 1);
        if (pw !== 0) return pw;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 4);
  }, [tasks, todayStr]);

  // Activation du focus clavier Electron lorsque autoFocusCapture est demandé (Alt+Espace)
  useEffect(() => {
    if (autoFocusCapture) {
      activateInputFocus();
    }
  }, [autoFocusCapture]);

  const activateInputFocus = async () => {
    onCaptureActiveChange(true);
    const electron = (window as any).electronAPI;
    if (electron?.setIslandFocusable) {
      await electron.setIslandFocusable(true);
    }
    setTimeout(() => {
      inputRef.current?.focus();
    }, 40);
  };

  const releaseInputFocus = async () => {
    onCaptureActiveChange(false);
    const electron = (window as any).electronAPI;
    if (electron?.setIslandFocusable) {
      await electron.setIslandFocusable(false);
    }
  };

  // Initialisation Web Speech API
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'fr-FR';
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setTitle((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleDictation = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {}
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    if (captureMode === 'task') {
      await addTask({
        title: trimmed,
        status: 'todo',
        priority,
        category: 'project',
        dueDate: dueDate || todayStr,
        tags: ['dynamic-island'],
      });
    } else {
      await addNote({
        title: trimmed,
        content: noteContent.trim() ? `# ${trimmed}\n\n${noteContent.trim()}` : `# ${trimmed}\n\n`,
        category: 'resource',
        tags: ['dynamic-island', 'note-rapide'],
        isPinned: false,
      });
    }

    setTitle('');
    setNoteContent('');
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1200);
    await releaseInputFocus();
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      await releaseInputFocus();
      const electron = (window as any).electronAPI;
      if (electron?.islandCaptureClosed) {
        await electron.islandCaptureClosed();
      }
      onCloseIsland();
    }
  };

  const openTasksInApp = () => {
    const electron = (window as any).electronAPI;
    if (electron?.openMainAppRoute) {
      electron.openMainAppRoute(captureMode === 'note' ? '/notes' : '/tasks');
    }
  };

  return (
    <div
      className="flex flex-col justify-between h-[215px] px-3.5 py-2 select-none"
      onKeyDown={handleKeyDown}
    >
      {/* Barre Quick-Capture : sélecteur Tâche / Note + Champ rapide */}
      <form onSubmit={handleSubmit} className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setCaptureMode('task')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                captureMode === 'task'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <CheckSquare className="w-3 h-3" />
              <span>Tâche</span>
            </button>
            <button
              type="button"
              onClick={() => setCaptureMode('note')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                captureMode === 'note'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Note</span>
            </button>
          </div>

          {captureMode === 'task' ? (
            <div className="flex items-center gap-1">
              {(['medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer border ${
                    priority === p
                      ? p === 'urgent'
                        ? 'bg-rose-500/30 border-rose-500 text-rose-200'
                        : p === 'high'
                        ? 'bg-amber-500/30 border-amber-500 text-amber-200'
                        : 'bg-purple-500/30 border-purple-500 text-purple-200'
                      : 'bg-white/5 border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {p === 'urgent' ? 'Urgent' : p === 'high' ? 'Haute' : 'Normale'}
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={openTasksInApp}
              className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Ouvrir Notes</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Champ de saisie Quick-Capture */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onFocus={activateInputFocus}
              onBlur={() => {
                setTimeout(() => releaseInputFocus(), 150);
              }}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                captureMode === 'task'
                  ? 'Nouvelle tâche rapide (Entrée pour ajouter)...'
                  : 'Titre de la note rapide (Entrée pour créer)...'
              }
              className="w-full bg-white/8 hover:bg-white/10 focus:bg-black/60 border border-white/15 focus:border-white/40 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none transition-all"
            />
          </div>

          <button
            type="button"
            onClick={toggleDictation}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-500/25 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title="Dictée vocale"
          >
            {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>

          <button
            type="submit"
            disabled={!title.trim()}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
          >
            {justSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        </div>
      </form>

      {/* Liste des tâches prioritaires */}
      <div className="flex-1 mt-2 overflow-y-auto space-y-1 pr-0.5">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
          <span>À faire en priorité ({priorityTasks.length})</span>
          <button
            type="button"
            onClick={openTasksInApp}
            className="text-[10px] font-semibold text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer normal-case"
          >
            <span>Tout voir</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>

        {priorityTasks.length === 0 ? (
          <div className="flex items-center justify-center h-[88px] text-[11px] text-zinc-500">
            🎉 Toutes vos tâches prioritaires sont terminées !
          </div>
        ) : (
          priorityTasks.map((task: Task) => {
            const isUrgent = task.priority === 'urgent';
            const isHigh = task.priority === 'high';
            return (
              <div
                key={task.id}
                onClick={() => toggleTaskStatus(task.id)}
                className="group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.06] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-4 h-4 rounded-md border border-white/25 group-hover:border-white flex items-center justify-center transition-colors flex-shrink-0"
                    style={
                      task.status === 'in_progress'
                        ? { borderColor: accentHex, backgroundColor: `${accentHex}33` }
                        : undefined
                    }
                  >
                    {task.status === 'in_progress' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {task.dueDate && (
                    <span className="text-[9px] font-mono text-zinc-400 flex items-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      {task.dueDate === todayStr ? "Auj." : task.dueDate.slice(5)}
                    </span>
                  )}
                  {(isUrgent || isHigh) && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        isUrgent
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {isUrgent ? 'Urgent' : 'Haute'}
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
};
