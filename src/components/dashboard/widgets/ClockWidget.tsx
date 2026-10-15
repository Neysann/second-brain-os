'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Clock as ClockIcon, Globe, Bell, Moon, Sun, ArrowRightLeft } from 'lucide-react';
import { WidgetSize } from '@/types/dashboard';

interface ClockWidgetProps {
  size?: WidgetSize;
}

export const ClockWidget: React.FC<ClockWidgetProps> = ({ size = 'small' }) => {
  const { theme } = useTheme();
  const [time, setTime] = useState<Date | null>(null);
  const [secondaryCityIndex, setSecondaryCityIndex] = useState(0); // 0 = Tokyo, 1 = New York, 2 = San Francisco

  const SECONDARY_CITIES = [
    { name: 'Tokyo', country: 'Japon', offset: 7, flag: '🇯🇵' },
    { name: 'New York', country: 'États-Unis', offset: -6, flag: '🇺🇸' },
    { name: 'San Francisco', country: 'États-Unis', offset: -9, flag: '🇺🇸' },
  ];

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-zinc-500">
        Chargement de l'horloge...
      </div>
    );
  }

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourAngle = (hours % 12) * 30 + minutes * 0.5;
  const minuteAngle = minutes * 6 + seconds * 0.1;
  const secondAngle = seconds * 6;

  const formattedDigital = time.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedSeconds = String(seconds).padStart(2, '0');

  const formattedDate = time.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calcul heure secondaire OneUI
  const secCity = SECONDARY_CITIES[secondaryCityIndex];
  const utcHours = time.getUTCHours();
  const secHours = (utcHours + secCity.offset + 24) % 24;
  const secFormattedDigital = `${String(secHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const isSecDay = secHours >= 6 && secHours < 20;
  const isLocalDay = hours >= 6 && hours < 20;

  // Calcul numéro de semaine
  const getWeekNumber = (d: Date) => {
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  };
  const weekNum = getWeekNumber(time);

  // Si taille Medium ou Large : Mode Dual Clock OneUI Samsung
  if (size === 'medium' || size === 'large') {
    return (
      <div className="flex flex-col h-full justify-between p-3.5 select-none animate-in fade-in duration-200">
        {/* En-tête OneUI */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800/80 pb-2">
          <div className="flex items-center gap-1.5">
            <ClockIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="text-zinc-800 dark:text-zinc-200 font-bold">Horloge Double & Fuseaux</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-amber-500 dark:text-amber-400/90 font-mono flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Bell className="w-2.5 h-2.5" />
              <span>07:30</span>
            </span>
            <button
              type="button"
              onClick={() =>
                setSecondaryCityIndex((prev) => (prev + 1) % SECONDARY_CITIES.length)
              }
              className="text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer"
              title="Changer de ville internationale"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>{secCity.name}</span>
            </button>
          </div>
        </div>

        {/* Zone Centrale : Deux Cadres Villes OneUI */}
        <div className="grid grid-cols-2 gap-3 my-auto items-center">
          {/* Ville 1 : Locale (Paris) */}
          <div className="p-3 rounded-2xl bg-zinc-50/90 dark:bg-zinc-950/60 border border-zinc-200/90 dark:border-zinc-800/80 flex flex-col justify-between h-full shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <span className="flex items-center gap-1">
                <span>🇫🇷</span> Paris
              </span>
              {isLocalDay ? (
                <Sun className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              )}
            </div>

            <div className="my-2 text-center">
              <div className="font-mono text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-baseline justify-center">
                <span>{formattedDigital}</span>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-normal ml-1">
                  :{formattedSeconds}
                </span>
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize truncate mt-0.5">
                {formattedDate}
              </div>
            </div>

            <div className="text-[9px] text-zinc-400 dark:text-zinc-500 text-center font-mono">
              Heure Locale (UTC+2)
            </div>
          </div>

          {/* Ville 2 : Internationale (Tokyo / New York / etc.) */}
          <div className="p-3 rounded-2xl bg-zinc-50/90 dark:bg-zinc-950/60 border border-zinc-200/90 dark:border-zinc-800/80 flex flex-col justify-between h-full shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <span className="flex items-center gap-1">
                <span>{secCity.flag}</span> {secCity.name}
              </span>
              {isSecDay ? (
                <Sun className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              )}
            </div>

            <div className="my-2 text-center">
              <div className="font-mono text-3xl font-black tracking-tight text-purple-600 dark:text-purple-300">
                {secFormattedDigital}
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                {secCity.offset >= 0 ? `+${secCity.offset}h` : `${secCity.offset}h`} par rapport à Paris
              </div>
            </div>

            <div className="text-[9px] text-zinc-400 dark:text-zinc-500 text-center font-mono">
              {secCity.country}
            </div>
          </div>
        </div>

        {/* Pied OneUI */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
          <span className="font-mono">Semaine {weekNum}</span>
          <span className="text-zinc-400 dark:text-zinc-500">Fuseau dynamique actif</span>
        </div>
      </div>
    );
  }

  // Si taille Small (Carré classique) : Cadran Analogique + Heure
  return (
    <div className="flex flex-col h-full items-center justify-between p-3 select-none">
      {/* En-tête */}
      <div className="w-full flex items-center justify-between text-[11px] font-semibold text-zinc-400">
        <span className="flex items-center gap-1.5">
          <ClockIcon className="w-3.5 h-3.5 text-purple-400" />
          Horloge
        </span>
        <span className="text-[10px] text-zinc-500 font-mono">Paris</span>
      </div>

      {/* Cadran Analogique SVG */}
      <div className="relative w-24 h-24 my-auto flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* Bordure extérieure */}
          <circle
            cx="50"
            cy="50"
            r="46"
            className={theme === 'dark' ? 'fill-zinc-950/80 stroke-zinc-800' : 'fill-zinc-100 stroke-zinc-300'}
            strokeWidth="2"
          />

          {/* Anneau subtil */}
          <circle
            cx="50"
            cy="50"
            r="40"
            className="fill-none stroke-purple-500/20"
            strokeWidth="1"
            strokeDasharray="2 4"
          />

          {/* Graduations des heures */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 50 + 38 * Math.sin(angle);
            const y1 = 50 - 38 * Math.cos(angle);
            const x2 = 50 + 43 * Math.sin(angle);
            const y2 = 50 - 43 * Math.cos(angle);
            const isMain = i % 3 === 0;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isMain ? '#a855f7' : '#71717a'}
                strokeWidth={isMain ? '2' : '1'}
                strokeLinecap="round"
              />
            );
          })}

          {/* Aiguille des heures */}
          <line
            x1="50"
            y1="50"
            x2={50 + 24 * Math.sin((hourAngle * Math.PI) / 180)}
            y2={50 - 24 * Math.cos((hourAngle * Math.PI) / 180)}
            className="stroke-purple-300"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Aiguille des minutes */}
          <line
            x1="50"
            y1="50"
            x2={50 + 34 * Math.sin((minuteAngle * Math.PI) / 180)}
            y2={50 - 34 * Math.cos((minuteAngle * Math.PI) / 180)}
            className="stroke-indigo-400"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Aiguille des secondes */}
          <line
            x1="50"
            y1="50"
            x2={50 + 37 * Math.sin((secondAngle * Math.PI) / 180)}
            y2={50 - 37 * Math.cos((secondAngle * Math.PI) / 180)}
            className="stroke-rose-500"
            strokeWidth="1"
            strokeLinecap="round"
          />

          {/* Pivot central */}
          <circle cx="50" cy="50" r="3" className="fill-purple-500" />
          <circle cx="50" cy="50" r="1.5" className="fill-white" />
        </svg>
      </div>

      {/* Heure Numérique & Date */}
      <div className="text-center">
        <div className="font-mono text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          {formattedDigital}
        </div>
        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize truncate max-w-[150px]">
          {formattedDate}
        </div>
      </div>
    </div>
  );
};

export default ClockWidget;
