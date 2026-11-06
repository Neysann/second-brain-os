'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CheckSquare,
  FileText,
  Plus,
  Check,
  Mic,
  MicOff,
} from 'lucide-react';
import { Task, TaskPriority } from '@/types';
import { useData } from '@/context/DataContext';
import { IslandThemeTokens } from './islandTheme';

interface IslandTasksCaptureTabProps {
  autoFocusCapture?: boolean;
  onCaptureActiveChange: (active: boolean) => void;
  onCloseIsland: () => void;
  themeTokens: IslandThemeTokens;
}

export const IslandTasksCaptureTab: React.FC<IslandTasksCaptureTabProps> = ({
  autoFocusCapture,
  onCaptureActiveChange,
  onCloseIsland,
  themeTokens,
}) => {
  const { tasks, addTask, addNote, toggleTaskStatus } = useData();

  const [captureMode, setCaptureMode] = useState<'task' | 'note'>('task');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [isListening, setIsListening] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const isNothing = themeTokens.mode === 'nothing';
  const isCyberpunk = themeTokens.mode === 'cyberpunk';

  const todayStr = new Date().toISOString().split('T')[0];

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
      .slice(0, 3);
  }, [tasks, todayStr]);

  useEffect(() => {
    if (autoFocusCapture) {
      activateInputFocus();
    }
  }, [autoFocusCapture]);

  useEffect(() => {
    return () => {
      onCaptureActiveChange(false);
      const electron = (window as any).electronAPI;
      electron?.setIslandFocusable?.(false);
    };
  }, []);

  const activateInputFocus = () => {
    onCaptureActiveChange(true);
    const electron = (window as any).electronAPI;
    electron?.setIslandFocusable?.(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 30);
  };

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

  const toggleDictation = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const cyclePriority = (e: React.MouseEvent) => {
    e.stopPropagation();
    const order: TaskPriority[] = ['medium', 'high', 'urgent'];
    const idx = order.indexOf(priority);
    setPriority(order[(idx + 1) % order.length]);
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
        dueDate: todayStr,
        tags: ['notch'],
      });
    } else {
      await addNote({
        title: trimmed,
        content: `# ${trimmed}\n\n`,
        category: 'resource',
        tags: ['notch'],
        isPinned: false,
      });
    }

    setTitle('');
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1200);
    onCaptureActiveChange(false);
    const electron = (window as any).electronAPI;
    electron?.setIslandFocusable?.(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCaptureActiveChange(false);
      const electron = (window as any).electronAPI;
      electron?.islandCaptureClosed?.();
      onCloseIsland();
    }
  };

  const priorityMeta =
    priority === 'urgent'
      ? { label: 'Urgent', dot: '#f43f5e' }
      : priority === 'high'
      ? { label: 'Haute', dot: '#f59e0b' }
      : { label: 'Normale', dot: '#a1a1aa' };

  return (
    <div
      className="flex flex-col justify-between h-full px-5 pb-3.5 pt-1 select-none"
      onKeyDown={handleKeyDown}
    >
      {/* Barre de capture minimaliste */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-center gap-1.5">
          {/* Bascule Tâche / Note */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCaptureMode((m) => (m === 'task' ? 'note' : 'task'));
            }}
            style={themeTokens.subtleActiveStyle}
            className={`h-9 px-2.5 rounded-xl border text-xs font-medium text-zinc-100 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer flex-shrink-0 hover:brightness-110 ${
              isNothing ? 'font-ndot uppercase tracking-wider text-[11px]' : ''
            }`}
            title="Basculer entre Tâche et Note"
          >
            {captureMode === 'task' ? (
              <CheckSquare className="w-3.5 h-3.5" style={{ color: themeTokens.accentHex }} />
            ) : (
              <FileText className="w-3.5 h-3.5" style={{ color: themeTokens.accentHex }} />
            )}
            <span>{captureMode === 'task' ? 'Tâche' : 'Note'}</span>
          </button>

          {/* Champ de saisie épuré */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onMouseDown={activateInputFocus}
              onFocus={activateInputFocus}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                captureMode === 'task'
                  ? 'Ajouter une tâche...'
                  : 'Créer une note rapide...'
              }
              className="w-full h-9 bg-white/[0.06] hover:bg-white/[0.10] focus:bg-white/[0.12] border border-white/[0.08] rounded-xl pl-3 pr-14 text-xs text-white placeholder:text-zinc-500 outline-none transition-all"
            />
            {captureMode === 'task' && (
              <button
                type="button"
                onClick={cyclePriority}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-6 px-2 rounded-lg bg-[#121218] hover:bg-[#1c1c26] border border-white/10 text-[10px] font-medium text-zinc-200 flex items-center gap-1 cursor-pointer transition-colors ${
                  isNothing ? 'font-ndot uppercase' : isCyberpunk ? 'font-mono' : ''
                }`}
                title="Changer la priorité"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: priorityMeta.dot }}
                />
                <span>{priorityMeta.label}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={toggleDictation}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer flex-shrink-0 ${
              isListening
                ? 'bg-rose-500/25 text-rose-300 animate-pulse'
                : 'bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white'
            }`}
            title="Dictée vocale"
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <button
            type="submit"
            disabled={!title.trim() && !justSaved}
            style={themeTokens.primaryBtnStyle}
            className={`w-9 h-9 rounded-xl hover:brightness-110 disabled:opacity-35 flex items-center justify-center transition-all active:scale-95 cursor-pointer flex-shrink-0 ${themeTokens.primaryBtnTextClass}`}
            title="Valider"
          >
            {justSaved ? (
              <Check className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Plus className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </form>

      {/* Liste épurée des 3 tâches prioritaires */}
      <div className="flex-1 mt-2.5 space-y-1.5 overflow-y-auto scrollbar-none">
        {priorityTasks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-zinc-500">
            Aucune tâche en attente
          </div>
        ) : (
          priorityTasks.map((task: Task) => {
            const dotColor =
              task.priority === 'urgent'
                ? '#f43f5e'
                : task.priority === 'high'
                ? '#f59e0b'
                : 'transparent';
            return (
              <button
                key={task.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTaskStatus(task.id);
                }}
                className="w-full h-9 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] flex items-center justify-between gap-2.5 text-left transition-all active:scale-[0.99] cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full border border-zinc-500 group-hover:border-white flex items-center justify-center transition-colors flex-shrink-0"
                    style={
                      task.status === 'in_progress'
                        ? {
                            borderColor: themeTokens.accentHex,
                            backgroundColor: `${themeTokens.accentHex}33`,
                          }
                        : undefined
                    }
                  >
                    {task.status === 'in_progress' && (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: themeTokens.accentHex }}
                      />
                    )}
                  </div>
                  <span className="text-[12.5px] font-medium text-zinc-200 group-hover:text-white truncate">
                    {task.title}
                  </span>
                </div>

                {dotColor !== 'transparent' && (
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: dotColor }}
                  />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
