'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  CornerDownLeft,
  Zap,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { TaskPriority } from '@/types';

type CaptureType = 'task' | 'note' | 'idea';

export default function QuickCapturePage() {
  const { addTask, addNote } = useData();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { settings } = useSettings();

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

  // Détection du mode visuel
  const isDark = theme === 'dark';
  const isOled = isDark && settings.darkBgStyle === 'oled';
  const isNothing = settings.uiStyle === 'nothing';
  const isCyberpunk = settings.uiStyle === 'cyberpunk';
  const activeAccent = isCyberpunk
    ? 'cyberpunk'
    : isNothing
    ? 'red'
    : settings.accentColor || 'purple';

  // Assurer la transparence parfaite du body pour la fenêtre Electron flottante
  useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = 'transparent';
    return () => {
      document.body.style.backgroundColor = originalBg;
    };
  }, []);

  // Configuration dynamique des couleurs d'accentuation pour le thème standard Syntropy
  const accentTheme = useMemo(() => {
    switch (activeAccent) {
      case 'aether':
      case 'blue':
        return {
          iconColor: isDark ? 'text-blue-400' : 'text-blue-600',
          iconBg: isDark ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-600',
          titleGradient: isDark
            ? 'from-blue-400 via-indigo-300 to-cyan-400'
            : 'from-blue-600 via-indigo-600 to-cyan-600',
          cardBorderDark: 'border-blue-500/30',
          cardBorderLight: 'border-blue-200',
          cardShadowDark: 'shadow-blue-950/80',
          cardShadowLight: 'shadow-blue-900/10',
          activeTabDark: 'bg-blue-600/30 text-blue-200 border-blue-500/50 shadow-sm',
          activeTabLight: 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm',
          focusRingDark: 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
          focusRingLight: 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30',
          submitBtn: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30',
        };
      case 'emerald':
        return {
          iconColor: isDark ? 'text-emerald-400' : 'text-emerald-600',
          iconBg: isDark ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600',
          titleGradient: isDark
            ? 'from-emerald-400 via-teal-300 to-cyan-400'
            : 'from-emerald-600 via-teal-600 to-cyan-600',
          cardBorderDark: 'border-emerald-500/30',
          cardBorderLight: 'border-emerald-200',
          cardShadowDark: 'shadow-emerald-950/80',
          cardShadowLight: 'shadow-emerald-900/10',
          activeTabDark: 'bg-emerald-600/30 text-emerald-200 border-emerald-500/50 shadow-sm',
          activeTabLight: 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm',
          focusRingDark: 'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500',
          focusRingLight: 'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30',
          submitBtn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30',
        };
      case 'cyan':
        return {
          iconColor: isDark ? 'text-cyan-400' : 'text-cyan-600',
          iconBg: isDark ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-600',
          titleGradient: isDark
            ? 'from-cyan-400 via-blue-300 to-indigo-400'
            : 'from-cyan-600 via-blue-600 to-indigo-600',
          cardBorderDark: 'border-cyan-500/30',
          cardBorderLight: 'border-cyan-200',
          cardShadowDark: 'shadow-cyan-950/80',
          cardShadowLight: 'shadow-cyan-900/10',
          activeTabDark: 'bg-cyan-600/30 text-cyan-200 border-cyan-500/50 shadow-sm',
          activeTabLight: 'bg-cyan-50 text-cyan-700 border-cyan-300 shadow-sm',
          focusRingDark: 'focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500',
          focusRingLight: 'focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30',
          submitBtn: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/30',
        };
      case 'amber':
        return {
          iconColor: isDark ? 'text-amber-400' : 'text-amber-600',
          iconBg: isDark ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-600',
          titleGradient: isDark
            ? 'from-amber-400 via-orange-300 to-rose-400'
            : 'from-amber-600 via-orange-600 to-rose-600',
          cardBorderDark: 'border-amber-500/30',
          cardBorderLight: 'border-amber-200',
          cardShadowDark: 'shadow-amber-950/80',
          cardShadowLight: 'shadow-amber-900/10',
          activeTabDark: 'bg-amber-600/30 text-amber-200 border-amber-500/50 shadow-sm',
          activeTabLight: 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm',
          focusRingDark: 'focus:border-amber-500 focus:ring-1 focus:ring-amber-500',
          focusRingLight: 'focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30',
          submitBtn: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-600/30',
        };
      case 'rose':
      case 'red':
        return {
          iconColor: isDark ? 'text-rose-400' : 'text-rose-600',
          iconBg: isDark ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600',
          titleGradient: isDark
            ? 'from-rose-400 via-pink-300 to-purple-400'
            : 'from-rose-600 via-pink-600 to-purple-600',
          cardBorderDark: 'border-rose-500/30',
          cardBorderLight: 'border-rose-200',
          cardShadowDark: 'shadow-rose-950/80',
          cardShadowLight: 'shadow-rose-900/10',
          activeTabDark: 'bg-rose-600/30 text-rose-200 border-rose-500/50 shadow-sm',
          activeTabLight: 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm',
          focusRingDark: 'focus:border-rose-500 focus:ring-1 focus:ring-rose-500',
          focusRingLight: 'focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30',
          submitBtn: 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-600/30',
        };
      case 'purple':
      default:
        return {
          iconColor: isDark ? 'text-purple-400' : 'text-purple-600',
          iconBg: isDark ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' : 'bg-purple-500/10 border-purple-500/30 text-purple-600',
          titleGradient: isDark
            ? 'from-purple-400 via-indigo-300 to-cyan-400'
            : 'from-purple-600 via-indigo-600 to-cyan-600',
          cardBorderDark: 'border-purple-500/40',
          cardBorderLight: 'border-purple-200',
          cardShadowDark: 'shadow-purple-950/80',
          cardShadowLight: 'shadow-purple-900/10',
          activeTabDark: 'bg-purple-600/30 text-purple-200 border-purple-500/50 shadow-sm',
          activeTabLight: 'bg-purple-50 text-purple-700 border-purple-300 shadow-sm',
          focusRingDark: 'focus:border-purple-500 focus:ring-1 focus:ring-purple-500',
          focusRingLight: 'focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30',
          submitBtn: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30',
        };
    }
  }, [activeAccent, isDark]);

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
      <div
        className={`w-full max-w-xl rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden transition-all flex flex-col ${
          isNothing
            ? 'bg-black border border-white/20 text-white shadow-[0_0_50px_rgba(0,0,0,0.9)] font-ntype'
            : isCyberpunk
            ? 'bg-[#070a14] border-2 border-[#FCEE0A]/70 text-zinc-100 shadow-[0_0_35px_rgba(252,238,10,0.25)] font-mono'
            : isOled
            ? 'bg-black border border-zinc-800 text-zinc-100 shadow-2xl shadow-black'
            : isDark
            ? `bg-zinc-950/95 border ${accentTheme.cardBorderDark} text-zinc-100 shadow-2xl ${accentTheme.cardShadowDark}`
            : `bg-white/95 border ${accentTheme.cardBorderLight} text-zinc-900 shadow-2xl ${accentTheme.cardShadowLight}`
        }`}
      >
        {/* Barre supérieure déplaçable (drag region) */}
        <div
          className={`flex items-center justify-between px-4 py-2.5 border-b cursor-move ${
            isNothing
              ? 'bg-black border-white/10 text-white'
              : isCyberpunk
              ? 'bg-[#0a0f1d] border-[#FCEE0A]/30 text-[#FCEE0A]'
              : isDark
              ? 'bg-zinc-900/80 border-zinc-800 text-zinc-100'
              : 'bg-zinc-50/90 border-zinc-200 text-zinc-900'
          }`}
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          <div className="flex items-center gap-2">
            {isNothing ? (
              <span className="nothing-red-dot mr-1" />
            ) : isCyberpunk ? (
              <Zap className="w-3.5 h-3.5 text-[#FCEE0A] animate-pulse" />
            ) : (
              <span className={`p-1 rounded-lg border ${accentTheme.iconBg}`}>
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              </span>
            )}

            {isNothing ? (
              <span className="font-ndot uppercase tracking-wider text-xs text-white">
                NOTHING OS // CAPTURE
              </span>
            ) : isCyberpunk ? (
              <span className="text-xs font-bold tracking-wider text-[#FCEE0A]">
                CYBERDECK // CAP-001
              </span>
            ) : (
              <span className={`text-xs font-black tracking-wide bg-gradient-to-r ${accentTheme.titleGradient} bg-clip-text text-transparent`}>
                SYNTROPY OS — CAPTURE RAPIDE
              </span>
            )}

            <span
              className={`text-[10px] px-1.5 py-0.5 rounded border ${
                isNothing
                  ? 'font-ndot bg-zinc-900 text-zinc-300 border-white/15'
                  : isCyberpunk
                  ? 'font-mono bg-[#070a14] text-[#00F0FF] border-[#00F0FF]/40'
                  : isDark
                  ? 'font-mono bg-zinc-800 text-zinc-400 border-zinc-700'
                  : 'font-mono bg-zinc-100 text-zinc-600 border-zinc-200'
              }`}
            >
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
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                isNothing
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  : isCyberpunk
                  ? 'text-zinc-400 hover:text-[#FCEE0A] hover:bg-[#FCEE0A]/10'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title="Fermer (Échap)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sélecteur de type : Tâche / Note / Idée */}
        <div
          className={`flex items-center gap-1.5 px-4 pt-3 pb-1 border-b ${
            isNothing
              ? 'bg-zinc-950 border-white/10'
              : isCyberpunk
              ? 'bg-[#070a14] border-[#00F0FF]/20'
              : isDark
              ? 'bg-zinc-900/40 border-zinc-800/60'
              : 'bg-zinc-50/50 border-zinc-200/80'
          }`}
        >
          {[
            { id: 'task' as CaptureType, label: 'Tâche', icon: CheckSquare, color: isDark ? 'text-blue-400' : 'text-blue-600' },
            { id: 'note' as CaptureType, label: 'Note', icon: FileText, color: isDark ? 'text-purple-400' : 'text-purple-600' },
            { id: 'idea' as CaptureType, label: 'Idée Inbox', icon: Lightbulb, color: isDark ? 'text-amber-400' : 'text-amber-600' },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = captureType === tab.id;

            let tabActiveClasses = '';
            if (active) {
              if (isNothing) {
                tabActiveClasses = 'bg-zinc-900 text-white border border-white/30 shadow-sm';
              } else if (isCyberpunk) {
                tabActiveClasses = 'bg-[#FCEE0A]/20 text-[#FCEE0A] border border-[#FCEE0A] shadow-[0_0_10px_rgba(252,238,10,0.3)]';
              } else if (isDark) {
                tabActiveClasses = accentTheme.activeTabDark;
              } else {
                tabActiveClasses = accentTheme.activeTabLight;
              }
            } else {
              if (isNothing) {
                tabActiveClasses = 'text-zinc-400 hover:text-white hover:bg-zinc-900/50';
              } else if (isCyberpunk) {
                tabActiveClasses = 'text-zinc-400 hover:text-[#00F0FF] hover:bg-[#00F0FF]/10';
              } else if (isDark) {
                tabActiveClasses = 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50';
              } else {
                tabActiveClasses = 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100';
              }
            }

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCaptureType(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border border-transparent ${tabActiveClasses}`}
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
              className={`w-full rounded-xl px-3.5 py-2.5 text-sm transition-all font-medium focus:outline-none ${
                isNothing
                  ? 'bg-black border border-white/15 text-white placeholder:text-zinc-600 focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920]/40 font-ntype'
                  : isCyberpunk
                  ? 'bg-[#0a0f1d] border border-[#00F0FF]/40 text-[#00F0FF] placeholder:text-zinc-600 focus:border-[#FCEE0A] focus:ring-1 focus:ring-[#FCEE0A]/40 font-mono'
                  : isDark
                  ? `bg-zinc-900/90 border border-zinc-700/80 text-zinc-100 placeholder:text-zinc-500 ${accentTheme.focusRingDark}`
                  : `bg-zinc-50 border border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:bg-white ${accentTheme.focusRingLight}`
              }`}
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
              className={`w-full rounded-xl px-3.5 py-2 text-xs transition-all resize-none focus:outline-none ${
                isNothing
                  ? 'bg-black border border-white/10 text-zinc-200 placeholder:text-zinc-700 focus:border-[#D71920]/60 font-ntype'
                  : isCyberpunk
                  ? 'bg-[#070a14] border border-[#00F0FF]/25 text-zinc-200 placeholder:text-zinc-600 focus:border-[#FCEE0A]/60 font-mono'
                  : isDark
                  ? 'bg-zinc-900/60 border border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-700'
                  : 'bg-zinc-50/60 border border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-400'
              }`}
              disabled={isSubmitting || isSaved}
            />
          </div>

          {/* Paramètres contextuels pour tâche */}
          {captureType === 'task' && (
            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
              <div
                className={`flex items-center gap-1 rounded-lg px-2 py-1 border ${
                  isNothing
                    ? 'bg-black border-white/15'
                    : isCyberpunk
                    ? 'bg-[#0a0f1d] border-[#00F0FF]/30 font-mono'
                    : isDark
                    ? 'bg-zinc-900 border-zinc-800'
                    : 'bg-zinc-100 border-zinc-200'
                }`}
              >
                <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>
                  Priorité:
                </span>
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
                          : isNothing
                          ? 'bg-[#D71920] text-white'
                          : isCyberpunk
                          ? 'bg-[#FCEE0A] text-black'
                          : 'bg-purple-600 text-white'
                        : isDark
                        ? 'text-zinc-500 hover:text-zinc-300'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {p === 'low' ? 'Basse' : p === 'medium' ? 'Normale' : p === 'high' ? 'Haute' : 'Urgente'}
                  </button>
                ))}
              </div>

              <div
                className={`flex items-center gap-1 rounded-lg px-2 py-1 border ${
                  isNothing
                    ? 'bg-black border-white/15'
                    : isCyberpunk
                    ? 'bg-[#0a0f1d] border-[#00F0FF]/30 font-mono'
                    : isDark
                    ? 'bg-zinc-900 border-zinc-800'
                    : 'bg-zinc-100 border-zinc-200'
                }`}
              >
                <Calendar className={`w-3 h-3 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`} />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`bg-transparent text-[11px] focus:outline-none ${
                    isCyberpunk ? 'text-[#00F0FF]' : isDark ? 'text-zinc-300' : 'text-zinc-700'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Barre d'action inférieure */}
          <div
            className={`flex items-center justify-between pt-2 border-t ${
              isNothing
                ? 'border-white/10'
                : isCyberpunk
                ? 'border-[#00F0FF]/20'
                : isDark
                ? 'border-zinc-800/80'
                : 'border-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse'
                    : isNothing
                    ? 'bg-black hover:bg-zinc-900 text-zinc-400 hover:text-white border-white/15'
                    : isCyberpunk
                    ? 'bg-[#0a0f1d] hover:bg-[#070a14] text-zinc-400 hover:text-[#00F0FF] border-[#00F0FF]/30 font-mono'
                    : isDark
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-200'
                }`}
                title="Dictée vocale"
              >
                {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                <span className="text-[11px] hidden sm:inline">
                  {isListening ? 'Écoute en cours...' : 'Dicter'}
                </span>
              </button>

              <span className={`text-[10px] hidden sm:inline ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                Appuyez sur <kbd className={`px-1 py-0.5 rounded border ${isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>Entrée</kbd> pour valider
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isNothing
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    : isCyberpunk
                    ? 'text-zinc-400 hover:text-[#FCEE0A] hover:bg-[#FCEE0A]/10 font-mono'
                    : isDark
                    ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={!title.trim() || isSubmitting || isSaved}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg ${
                  isSaved
                    ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                    : !title.trim()
                    ? isDark
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-transparent'
                      : 'bg-zinc-200 text-zinc-400 cursor-not-allowed border border-transparent'
                    : isNothing
                    ? 'bg-[#D71920] hover:bg-[#b5141a] text-white shadow-lg shadow-[#D71920]/30 font-ntype uppercase tracking-wider'
                    : isCyberpunk
                    ? 'bg-[#FCEE0A] hover:bg-[#ffe600] text-black font-black uppercase tracking-wider shadow-lg shadow-[#FCEE0A]/40 font-mono'
                    : accentTheme.submitBtn
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
