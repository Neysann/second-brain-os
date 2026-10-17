'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Clock as ClockIcon, Bell, Moon, Sun, ArrowRightLeft, Settings } from 'lucide-react';
import { WidgetSize, ClockWidgetSettings, SecondaryClockCity } from '@/types/dashboard';

interface ClockWidgetProps {
  size?: WidgetSize;
  settings?: ClockWidgetSettings;
  onOpenSettings?: () => void;
}

const DEFAULT_SECONDARY_CITIES: SecondaryClockCity[] = [
  { name: 'Tokyo', country: 'Japon', timezone: 'Asia/Tokyo', flag: '🇯🇵' },
  { name: 'New York', country: 'États-Unis', timezone: 'America/New_York', flag: '🇺🇸' },
  { name: 'San Francisco', country: 'États-Unis', timezone: 'America/Los_Angeles', flag: '🇺🇸' },
  { name: 'Londres', country: 'Royaume-Uni', timezone: 'Europe/London', flag: '🇬🇧' },
  { name: 'Dubaï', country: 'Émirats arabes unis', timezone: 'Asia/Dubai', flag: '🇦🇪' },
];

export const ClockWidget: React.FC<ClockWidgetProps> = ({
  size = 'small',
  settings,
  onOpenSettings,
}) => {
  const { theme } = useTheme();
  const [time, setTime] = useState<Date | null>(null);
  const [secondaryCityIndex, setSecondaryCityIndex] = useState(0);

  const displayMode = settings?.mode || (size === 'small' ? 'analog' : 'dual');
  const primaryCityName = settings?.primaryCityName || 'Paris';
  const primaryTimezone = settings?.primaryTimezone || 'Europe/Paris';
  const secondaryCities =
    settings?.secondaryCities && settings.secondaryCities.length > 0
      ? settings.secondaryCities
      : DEFAULT_SECONDARY_CITIES;
  const showSeconds = settings?.showSeconds ?? true;
  const timeFormat = settings?.timeFormat || '24h';
  const showWeekNumber = settings?.showWeekNumber ?? true;

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

  // Formatage pour un fuseau horaire donné
  const formatTimeForZone = (tz: string) => {
    try {
      const is12h = timeFormat === '12h';
      const formatter = new Intl.DateTimeFormat('fr-FR', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: is12h,
      });
      const parts = formatter.formatToParts(time);
      const hourStr = parts.find((p) => p.type === 'hour')?.value || '00';
      const minStr = parts.find((p) => p.type === 'minute')?.value || '00';
      const secStr = parts.find((p) => p.type === 'second')?.value || '00';
      const period = parts.find((p) => p.type === 'dayPeriod')?.value || '';

      // Calcul heure 24h pour savoir si c'est le jour
      const formatter24 = new Intl.DateTimeFormat('fr-FR', {
        timeZone: tz,
        hour: 'numeric',
        hour12: false,
      });
      const raw24h = parseInt(formatter24.format(time), 10);

      return {
        digitalShort: `${hourStr}:${minStr}${period ? ' ' + period : ''}`,
        seconds: secStr,
        rawHour: raw24h,
        rawMinute: parseInt(minStr, 10),
        rawSecond: parseInt(secStr, 10),
        isDay: raw24h >= 6 && raw24h < 20,
      };
    } catch {
      const h = time.getHours();
      return {
        digitalShort: time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        seconds: String(time.getSeconds()).padStart(2, '0'),
        rawHour: h,
        rawMinute: time.getMinutes(),
        rawSecond: time.getSeconds(),
        isDay: h >= 6 && h < 20,
      };
    }
  };

  const primaryTimeData = formatTimeForZone(primaryTimezone);

  // Aiguilles horloge analogique basées sur le fuseau primaire
  const hourAngle = (primaryTimeData.rawHour % 12) * 30 + primaryTimeData.rawMinute * 0.5;
  const minuteAngle = primaryTimeData.rawMinute * 6 + primaryTimeData.rawSecond * 0.1;
  const secondAngle = primaryTimeData.rawSecond * 6;

  // Date locale primaire
  let formattedDate = '';
  try {
    formattedDate = new Intl.DateTimeFormat('fr-FR', {
      timeZone: primaryTimezone,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(time);
  } catch {
    formattedDate = time.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  // Ville secondaire sélectionnée
  const activeSecCity = secondaryCities[secondaryCityIndex % secondaryCities.length];
  const secTimezone = activeSecCity.timezone || 'Asia/Tokyo';
  const secTimeData = formatTimeForZone(secTimezone);

  // Calcul du décalage approximatif en heures
  let diffHours = 0;
  try {
    const d1 = new Date(time.toLocaleString('en-US', { timeZone: primaryTimezone }));
    const d2 = new Date(time.toLocaleString('en-US', { timeZone: secTimezone }));
    diffHours = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60));
  } catch {}

  const diffStr =
    diffHours === 0
      ? 'Même heure'
      : diffHours > 0
      ? `+${diffHours}h par rapport à ${primaryCityName}`
      : `${diffHours}h par rapport à ${primaryCityName}`;

  // Calcul numéro de semaine ISO
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
  if (size === 'medium' || size === 'large' || displayMode === 'dual') {
    return (
      <div className="flex flex-col h-full justify-between p-3.5 select-none animate-in fade-in duration-200 group/widget">
        {/* En-tête OneUI */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800/80 pb-2">
          <div className="flex items-center gap-1.5">
            <ClockIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="text-zinc-800 dark:text-zinc-200 font-bold">Horloge Mondiale & Fuseaux</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-amber-500 dark:text-amber-400/90 font-mono flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Bell className="w-2.5 h-2.5" />
              <span>07:30</span>
            </span>
            <button
              type="button"
              onClick={() =>
                setSecondaryCityIndex((prev) => (prev + 1) % secondaryCities.length)
              }
              className="text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-800"
              title="Changer de ville secondaire"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>{activeSecCity.name}</span>
            </button>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-1 rounded-lg text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors opacity-70 group-hover/widget:opacity-100 cursor-pointer"
                title="Options de l'horloge"
              >
                <Settings className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Zone Centrale : Deux Cadres Villes OneUI */}
        <div className="grid grid-cols-2 gap-3 my-auto items-center">
          {/* Ville 1 : Primaire */}
          <div className="p-3 rounded-2xl bg-zinc-50/90 dark:bg-zinc-950/60 border border-zinc-200/90 dark:border-zinc-800/80 flex flex-col justify-between h-full shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <span className="flex items-center gap-1">
                <span>📍</span> {primaryCityName}
              </span>
              {primaryTimeData.isDay ? (
                <Sun className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              )}
            </div>

            <div className="my-2 text-center">
              <div className="font-mono text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-baseline justify-center">
                <span>{primaryTimeData.digitalShort}</span>
                {showSeconds && (
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-normal ml-1">
                    :{primaryTimeData.seconds}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize truncate mt-0.5">
                {formattedDate}
              </div>
            </div>

            <div className="text-[9px] text-zinc-400 dark:text-zinc-500 text-center font-mono">
              Heure Principale
            </div>
          </div>

          {/* Ville 2 : Internationale */}
          <div className="p-3 rounded-2xl bg-zinc-50/90 dark:bg-zinc-950/60 border border-zinc-200/90 dark:border-zinc-800/80 flex flex-col justify-between h-full shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <span className="flex items-center gap-1">
                <span>{activeSecCity.flag || '🌐'}</span> {activeSecCity.name}
              </span>
              {secTimeData.isDay ? (
                <Sun className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              )}
            </div>

            <div className="my-2 text-center">
              <div className="font-mono text-3xl font-black tracking-tight text-purple-600 dark:text-purple-300">
                {secTimeData.digitalShort}
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                {diffStr}
              </div>
            </div>

            <div className="text-[9px] text-zinc-400 dark:text-zinc-500 text-center font-mono">
              {activeSecCity.country}
            </div>
          </div>
        </div>

        {/* Pied OneUI */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
          {showWeekNumber ? (
            <span className="font-mono">Semaine {weekNum}</span>
          ) : (
            <span className="font-mono">{primaryTimezone}</span>
          )}
          <span className="text-zinc-400 dark:text-zinc-500">
            {secondaryCities.length} ville{secondaryCities.length > 1 ? 's' : ''} configurée{secondaryCities.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    );
  }

  // Si taille Small et Mode Digital
  if (displayMode === 'digital') {
    return (
      <div className="flex flex-col h-full items-center justify-between p-3 select-none group/widget">
        <div className="w-full flex items-center justify-between text-[11px] font-semibold text-zinc-400">
          <span className="flex items-center gap-1.5">
            <ClockIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>Horloge Digitale</span>
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[70px]">
              {primaryCityName}
            </span>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-0.5 rounded text-zinc-400 hover:text-purple-400 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                title="Options"
              >
                <Settings className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        <div className="my-auto text-center">
          <div className="font-mono text-4xl font-black tracking-tight text-zinc-900 dark:text-white flex items-baseline justify-center">
            <span>{primaryTimeData.digitalShort}</span>
            {showSeconds && (
              <span className="text-xs text-purple-500 font-normal ml-1">
                :{primaryTimeData.seconds}
              </span>
            )}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 capitalize truncate mt-1">
            {formattedDate}
          </div>
        </div>

        <div className="w-full flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-200 dark:border-zinc-800/60 font-mono">
          <span>{primaryTimeData.isDay ? '☀️ Jour' : '🌙 Nuit'}</span>
          {showWeekNumber && <span>S{weekNum}</span>}
        </div>
      </div>
    );
  }

  // Si taille Small (Carré classique) : Cadran Analogique SVG
  return (
    <div className="flex flex-col h-full items-center justify-between p-3 select-none group/widget">
      {/* En-tête */}
      <div className="w-full flex items-center justify-between text-[11px] font-semibold text-zinc-400">
        <span className="flex items-center gap-1.5">
          <ClockIcon className="w-3.5 h-3.5 text-purple-400" />
          <span>Horloge</span>
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[75px]">
            {primaryCityName}
          </span>
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-0.5 rounded text-zinc-400 hover:text-purple-400 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              title="Options"
            >
              <Settings className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
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
          {showSeconds && (
            <line
              x1="50"
              y1="50"
              x2={50 + 37 * Math.sin((secondAngle * Math.PI) / 180)}
              y2={50 - 37 * Math.cos((secondAngle * Math.PI) / 180)}
              className="stroke-rose-500"
              strokeWidth="1"
              strokeLinecap="round"
            />
          )}

          {/* Pivot central */}
          <circle cx="50" cy="50" r="3" className="fill-purple-500" />
          <circle cx="50" cy="50" r="1.5" className="fill-white" />
        </svg>
      </div>

      {/* Heure Numérique & Date */}
      <div className="text-center">
        <div className="font-mono text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          {primaryTimeData.digitalShort}
        </div>
        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize truncate max-w-[150px]">
          {formattedDate}
        </div>
      </div>
    </div>
  );
};

export default ClockWidget;
