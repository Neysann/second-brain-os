'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { FocusTimerWidgetSettings } from '@/types/dashboard';

interface FocusTimerWidgetProps {
  settings?: FocusTimerWidgetSettings;
  onOpenSettings?: () => void;
}

export const FocusTimerWidget: React.FC<FocusTimerWidgetProps> = ({
  settings,
  onOpenSettings,
}) => {
  const focusMinutes = settings?.focusDuration || 25;
  const breakMinutes = settings?.breakDuration || 5;
  const soundAlert = settings?.soundAlert ?? true;

  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(focusMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Mettre à jour si les réglages changent et qu'on ne tourne pas
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
    }
  }, [focusMinutes, breakMinutes, mode, isRunning]);

  const totalTime = mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60;

  // Signal sonore Web Audio doux à la fin
  const playAlertSound = () => {
    if (!soundAlert || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // La5
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
      // Bascule automatique
      if (mode === 'focus') {
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
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(newMode === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col h-full justify-between p-3 select-none group/widget">
      {/* En-tête */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
          <span>Minuteur focus</span>
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-zinc-400 font-mono">
            {mode === 'focus' ? `${focusMinutes}m` : `${breakMinutes}m`}
          </span>
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-0.5 rounded text-zinc-400 hover:text-purple-500 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              title="Paramètres minuteur"
            >
              <Settings className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* Onglets Focus / Pause */}
      <div className="flex items-center justify-center p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-fit mx-auto text-[10px] font-semibold">
        <button
          type="button"
          onClick={() => handleModeChange('focus')}
          className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
            mode === 'focus'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          Focus ({focusMinutes}m)
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('break')}
          className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
            mode === 'break'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
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
              mode === 'focus' ? 'stroke-purple-600 dark:stroke-purple-500' : 'stroke-emerald-500 dark:stroke-emerald-400'
            }`}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {formattedTime}
          </span>
          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase font-medium">
            {mode === 'focus' ? 'Concentration' : 'Détente'}
          </span>
        </div>
      </div>

      {/* Contrôles Play/Pause & Reset */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Réinitialiser"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setIsRunning(!isRunning)}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform active:scale-95 shadow-md cursor-pointer ${
            isRunning
              ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
              : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
          }`}
          title={isRunning ? 'Mettre en pause' : 'Démarrer'}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
      </div>
    </div>
  );
};

export default FocusTimerWidget;
