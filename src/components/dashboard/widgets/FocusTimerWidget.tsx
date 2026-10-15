'use client';

import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';

export const FocusTimerWidget: React.FC = () => {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const totalTime = mode === 'focus' ? 25 * 60 : 5 * 60;

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      // Bascule automatique
      if (mode === 'focus') {
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('focus');
        setTimeLeft(25 * 60);
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, mode]);

  const handleModeChange = (newMode: 'focus' | 'break') => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col h-full justify-between p-3 select-none">
      {/* En-tête */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
          <span>Minuteur focus</span>
        </span>
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
          Focus
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
          Pause
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
