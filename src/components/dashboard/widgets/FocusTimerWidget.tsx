'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { FocusTimerWidgetSettings } from '@/types/dashboard';

interface FocusTimerWidgetProps {
  settings?: FocusTimerWidgetSettings;
  onOpenSettings?: () => void;
}

export const FocusTimerWidget: React.FC<FocusTimerWidgetProps> = ({
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
          <span className={`text-[10px] ${
            isNothing ? 'font-ndot text-white bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded' : 'text-zinc-400 font-mono'
          }`}>
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
      <div className={`flex items-center justify-center p-0.5 rounded-full w-fit mx-auto text-[10px] font-semibold ${
        isNothing ? 'bg-black border border-white/20' : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl'
      }`}>
        <button
          type="button"
          onClick={() => handleModeChange('focus')}
          className={`px-3 py-1 transition-colors cursor-pointer ${
            isNothing ? 'rounded-full font-ndot uppercase tracking-wider' : 'rounded-lg'
          } ${
            mode === 'focus'
              ? (isNothing ? 'bg-[#D71920] text-white shadow-xs' : 'bg-purple-600 text-white shadow-xs')
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
              ? (isNothing ? 'bg-white text-black font-bold shadow-xs' : 'bg-purple-600 text-white shadow-xs')
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Pause ({breakMinutes}m)
        </button>
      </div>

      {/* Cercle avec le temps restant & Glyph LED Ring */}
      <div className="relative flex items-center justify-center my-auto">
        {isNothing ? (
          /* Anneau Glyph LED authentique à 24 segments lumineux */
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {[...Array(24)].map((_, i) => {
                const angle = (i * 15 * Math.PI) / 180;
                const x1 = 50 + 38 * Math.sin(angle);
                const y1 = 50 - 38 * Math.cos(angle);
                const x2 = 50 + 44 * Math.sin(angle);
                const y2 = 50 - 44 * Math.cos(angle);
                const segmentProgress = ((24 - i) / 24) * 100;
                const isLit = progress >= segmentProgress;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={
                      isLit
                        ? mode === 'focus'
                          ? '#D71920'
                          : '#ffffff'
                        : 'rgba(255, 255, 255, 0.12)'
                    }
                    strokeWidth={isLit ? '2.5' : '1.5'}
                    strokeLinecap="round"
                    className={isLit ? 'glyph-led-strip' : ''}
                  />
                );
              })}
              {/* Cercle central subtil */}
              <circle
                cx="50"
                cy="50"
                r="32"
                className="fill-black stroke-white/10"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-ndot text-2xl tracking-widest text-white">
                {formattedTime}
              </span>
              <span className="text-[9px] font-ndot uppercase tracking-wider text-zinc-400 flex items-center gap-1 mt-0.5">
                {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] animate-ping" />}
                <span>{mode === 'focus' ? 'REC • FOCUS' : 'PAUSE'}</span>
              </span>
            </div>
          </div>
        ) : (
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
        )}
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
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
      </div>
    </div>
  );
};

export default FocusTimerWidget;
