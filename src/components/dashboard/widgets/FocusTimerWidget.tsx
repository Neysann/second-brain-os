'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, Settings, Flame, Bell, Coffee, Zap } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { FocusTimerWidgetSettings, WidgetSize } from '@/types/dashboard';
import {
  loadPomodoroSyncState,
  broadcastPomodoroState,
  subscribeSyntropySync,
} from '@/lib/islandSync';

interface FocusTimerWidgetProps {
  size?: WidgetSize;
  settings?: FocusTimerWidgetSettings;
  onOpenSettings?: () => void;
}

export const FocusTimerWidget: React.FC<FocusTimerWidgetProps> = ({
  size = 'small',
  settings,
  onOpenSettings,
}) => {
  const { settings: appSettings } = useSettings();
  const isNothing = appSettings?.uiStyle === 'nothing';
  const focusMinutes = settings?.focusDuration || 25;
  const breakMinutes = settings?.breakDuration || 5;
  const soundAlert = settings?.soundAlert ?? true;

  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(focusMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('syntropy_pomodoro_completed_today');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const isApplyingExternalSyncRef = useRef(false);

  // Hydratation initiale et synchronisation inter-fenêtres (Dynamic Island <-> Dashboard)
  useEffect(() => {
    const initial = loadPomodoroSyncState(focusMinutes);
    isApplyingExternalSyncRef.current = true;
    setMode(initial.mode);
    setTimeLeft(initial.timeLeft);
    setIsRunning(initial.isRunning);
    setCompletedSessions(initial.completedSessions);
    setTimeout(() => {
      isApplyingExternalSyncRef.current = false;
    }, 50);

    const unsub = subscribeSyntropySync((msg) => {
      if (msg.type === 'pomodoro-sync') {
        isApplyingExternalSyncRef.current = true;
        setMode(msg.state.mode);
        setTimeLeft(msg.state.timeLeft);
        setIsRunning(msg.state.isRunning);
        setCompletedSessions(msg.state.completedSessions);
        setTimeout(() => {
          isApplyingExternalSyncRef.current = false;
        }, 50);
      }
    });
    return () => unsub();
  }, []);

  const totalTime = mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60;

  // Broadcast vers la Dynamic Island lors des changements d'état
  useEffect(() => {
    if (isApplyingExternalSyncRef.current) return;
    broadcastPomodoroState({
      mode,
      timeLeft,
      totalTime,
      isRunning,
      completedSessions,
    });
  }, [isRunning, mode, completedSessions]);

  // Signal sonore Web Audio doux à la fin
  const playAlertSound = () => {
    if (!soundAlert || typeof window === 'undefined') return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {}
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      playAlertSound();
      if (mode === 'focus') {
        setCompletedSessions((prev) => {
          const next = prev + 1;
          if (typeof window !== 'undefined') {
            localStorage.setItem('syntropy_pomodoro_completed_today', String(next));
          }
          return next;
        });
        setMode('break');
        setTimeLeft(breakMinutes * 60);
      } else {
        setMode('focus');
        setTimeLeft(focusMinutes * 60);
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, mode, focusMinutes, breakMinutes, soundAlert]);

  const handleModeChange = (newMode: 'focus' | 'break') => {
    const nextTime = newMode === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(nextTime);
    broadcastPomodoroState({
      mode: newMode,
      timeLeft: nextTime,
      totalTime: nextTime,
      isRunning: false,
      completedSessions,
    });
  };

  const handleReset = () => {
    const nextTime = mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
    setIsRunning(false);
    setTimeLeft(nextTime);
    broadcastPomodoroState({
      mode,
      timeLeft: nextTime,
      totalTime: nextTime,
      isRunning: false,
      completedSessions,
    });
  };

  const setCustomMinutes = (mins: number) => {
    const nextTime = mins * 60;
    setIsRunning(false);
    setMode('focus');
    setTimeLeft(nextTime);
    broadcastPomodoroState({
      mode: 'focus',
      timeLeft: nextTime,
      totalTime: nextTime,
      isRunning: false,
      completedSessions,
    });
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  // ==========================================
  // VUE 1 : FORMAT SMALL (1x1) - COMPACT DIAL
  // ==========================================
  if (size === 'small') {
    return (
      <div className="flex flex-col h-full justify-between p-3 select-none">
        {/* En-tête minimal */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5 truncate">
            <Timer className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
            <span className="truncate">{mode === 'focus' ? 'Focus' : 'Pause'}</span>
          </span>
          <button
            type="button"
            onClick={() => handleModeChange(mode === 'focus' ? 'break' : 'focus')}
            className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            title="Basculer le mode"
          >
            {mode === 'focus' ? 'Passer en pause' : 'Passer en focus'}
          </button>
        </div>

        {/* Cercle avec Play/Pause interactif au centre */}
        <div className="relative flex items-center justify-center my-auto">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="30"
              className="stroke-zinc-200 dark:stroke-zinc-800"
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r="30"
              className={`transition-all duration-500 ${
                mode === 'focus'
                  ? 'stroke-purple-600 dark:stroke-purple-500'
                  : 'stroke-emerald-500 dark:stroke-emerald-400'
              }`}
              strokeWidth="4"
              strokeDasharray={2 * Math.PI * 30}
              strokeDashoffset={2 * Math.PI * 30 - (progress / 100) * (2 * Math.PI * 30)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-base font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Contrôles compacts */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Remettre à zéro"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className={`px-3 py-1 rounded-full text-xs font-semibold text-white transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
              isRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-purple-600 hover:bg-purple-500'
            }`}
          >
            {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
            <span>{isRunning ? 'Pause' : 'Start'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VUE 2 : FORMAT LARGE / FULL (2x2 ou 4x1) - POMODORO STUDIO
  // ==========================================
  if (size === 'large' || size === 'full') {
    return (
      <div className="flex flex-col h-full justify-between p-3.5 select-none gap-3">
        {/* En-tête large avec statut et sessions complétées */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <span>Station Pomodoro & Deep Work</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400">
                  {completedSessions} {completedSessions > 1 ? 'sessions' : 'session'} aujourd&apos;hui
                </span>
              </div>
              <div className="text-[10px] text-zinc-400">
                Rythme recommandé : 25min de focus intense, 5min de détente active
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleModeChange(mode === 'focus' ? 'break' : 'focus')}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                mode === 'focus'
                  ? 'bg-purple-600/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
                  : 'bg-emerald-600/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              Mode : {mode === 'focus' ? 'Focus' : 'Pause'}
            </button>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-1 rounded-lg text-zinc-400 hover:text-purple-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Paramètres"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Corps central : Deux colonnes (Timer visuel & Réglages / Presets) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-auto items-center">
          {/* Colonne gauche : Grand cadran circulaire */}
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  className="stroke-zinc-200 dark:stroke-zinc-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  className={`transition-all duration-500 ${
                    mode === 'focus'
                      ? 'stroke-purple-600 dark:stroke-purple-500'
                      : 'stroke-emerald-500 dark:stroke-emerald-400'
                  }`}
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 - (progress / 100) * (2 * Math.PI * 52)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                  {formattedTime}
                </span>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                  {mode === 'focus' ? 'Concentration' : 'Pause café'}
                </span>
              </div>
            </div>

            {/* Boutons d'action sous le cadran */}
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                title="Réinitialiser"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className={`px-6 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                  isRunning
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                    : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isRunning ? 'Pause' : 'Démarrer'}</span>
              </button>
            </div>
          </div>

          {/* Colonne droite : Presets rapides & Indicateurs de session */}
          <div className="flex flex-col justify-between h-full gap-2.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                Presets rapides de concentration
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Sprint', mins: 15, icon: Zap },
                  { label: 'Classique', mins: 25, icon: Timer },
                  { label: 'Deep Work', mins: 45, icon: Flame },
                  { label: 'Master', mins: 60, icon: Coffee },
                ].map((item) => (
                  <button
                    key={item.mins}
                    type="button"
                    onClick={() => setCustomMinutes(item.mins)}
                    className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-left transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {item.label}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400">{item.mins} min</div>
                    </div>
                    <item.icon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-purple-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Badge sessions du jour */}
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍅</span>
                <div>
                  <div className="text-xs font-bold text-purple-900 dark:text-purple-200">
                    Cycle actuel : {completedSessions % 4 + 1} / 4
                  </div>
                  <div className="text-[10px] text-purple-700 dark:text-purple-300">
                    Pause longue de 15m après 4 sessions
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((dot) => (
                  <span
                    key={dot}
                    className={`w-2.5 h-2.5 rounded-full ${
                      (completedSessions % 4) >= dot
                        ? 'bg-purple-600 dark:bg-purple-400 shadow-xs'
                        : 'bg-purple-500/20'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VUE 3 : FORMAT MEDIUM (2x1) - BALANCED POMODORO
  // ==========================================
  return (
    <div className="flex flex-col h-full justify-between p-3 select-none group/widget">
      {/* En-tête */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          {isNothing ? (
            <>
              <span className="nothing-red-dot" />
              <span className="font-ndot text-white uppercase tracking-wider">GLYPH // TIMER</span>
            </>
          ) : (
            <>
              <Timer className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
              <span>Minuteur focus</span>
            </>
          )}
        </span>
        <div className="flex items-center gap-1">
          <span
            className={`text-[10px] ${
              isNothing
                ? 'font-ndot text-white bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded'
                : 'text-zinc-400 font-mono'
            }`}
          >
            {mode === 'focus' ? `${focusMinutes}M` : `${breakMinutes}M`}
          </span>
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-0.5 rounded text-zinc-400 hover:text-white opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              title="Paramètres minuteur"
            >
              <Settings className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* Onglets Focus / Pause */}
      <div
        className={`flex items-center justify-center p-0.5 rounded-full w-fit mx-auto text-[10px] font-semibold ${
          isNothing
            ? 'bg-black border border-white/20'
            : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl'
        }`}
      >
        <button
          type="button"
          onClick={() => handleModeChange('focus')}
          className={`px-3 py-1 transition-colors cursor-pointer ${
            isNothing ? 'rounded-full font-ndot uppercase tracking-wider' : 'rounded-lg'
          } ${
            mode === 'focus'
              ? isNothing
                ? 'bg-[#D71920] text-white shadow-xs'
                : 'bg-purple-600 text-white shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Focus ({focusMinutes}m)
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('break')}
          className={`px-3 py-1 transition-colors cursor-pointer ${
            isNothing ? 'rounded-full font-ndot uppercase tracking-wider' : 'rounded-lg'
          } ${
            mode === 'break'
              ? isNothing
                ? 'bg-white text-black font-bold shadow-xs'
                : 'bg-purple-600 text-white shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Pause ({breakMinutes}m)
        </button>
      </div>

      {/* Cercle avec le temps restant */}
      <div className="relative flex items-center justify-center my-auto">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="stroke-zinc-200 dark:stroke-zinc-800"
            strokeWidth="5"
            fill="transparent"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            className={`transition-all duration-500 ${
              mode === 'focus'
                ? 'stroke-purple-600 dark:stroke-purple-500'
                : 'stroke-emerald-500 dark:stroke-emerald-400'
            }`}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            {formattedTime}
          </span>
          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-medium uppercase">
            {mode === 'focus' ? 'Concentration' : 'Détente'}
          </span>
        </div>
      </div>

      {/* Contrôles Play/Pause & Reset */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleReset}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isNothing
              ? 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800'
          }`}
          title="Réinitialiser"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setIsRunning(!isRunning)}
          className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer ${
            isRunning
              ? isNothing
                ? 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30 shadow-md'
              : isNothing
              ? 'bg-[#D71920] hover:bg-[#b01319] shadow-[0_0_14px_rgba(215,25,32,0.8)] border border-[#D71920]'
              : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30 shadow-md'
          }`}
          title={isRunning ? 'Mettre en pause' : 'Démarrer'}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
        </button>
      </div>
    </div>
  );
};

export default FocusTimerWidget;
