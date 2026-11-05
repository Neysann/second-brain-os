'use client';

import React, { useMemo } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  Video,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { CalendarEvent } from '@/types';
import { PomodoroSyncState } from '@/types/island';

export function extractVideoCallUrl(event: CalendarEvent): string | null {
  const combined = `${event.location || ''} ${event.description || ''}`;
  const regex =
    /https?:\/\/(?:meet\.google\.com\/[a-zA-Z0-9-]+|teams\.microsoft\.com\/l\/meetup-join\/[^\s"<>]+|[a-zA-Z0-9.-]*zoom\.us\/[jw]\/[^\s"<>]+|discord\.(?:gg|com\/channels)\/[^\s"<>]+)/i;
  const match = combined.match(regex);
  return match ? match[0] : null;
}

interface IslandFocusAgendaTabProps {
  pomodoro: PomodoroSyncState;
  onTogglePomodoro: () => void;
  onResetPomodoro: () => void;
  onSwitchPomodoroMode: (mode: 'focus' | 'break') => void;
  onSetCustomMinutes: (mins: number) => void;
  events: CalendarEvent[];
  accentHex: string;
}

export const IslandFocusAgendaTab: React.FC<IslandFocusAgendaTabProps> = ({
  pomodoro,
  onTogglePomodoro,
  onResetPomodoro,
  onSwitchPomodoroMode,
  onSetCustomMinutes,
  events,
  accentHex,
}) => {
  const mins = Math.floor(pomodoro.timeLeft / 60);
  const secs = pomodoro.timeLeft % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progress =
    pomodoro.totalTime > 0
      ? Math.min(100, Math.max(0, ((pomodoro.totalTime - pomodoro.timeLeft) / pomodoro.totalTime) * 100))
      : 0;

  // Événements du jour et à venir
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const todayPrefix = now.toISOString().split('T')[0];

    return events
      .filter((ev) => {
        if (!ev.startDate) return false;
        const datePart = ev.startDate.slice(0, 10);
        return datePart >= todayPrefix;
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 3);
  }, [events]);

  const handleOpenExternal = (url: string) => {
    const electron = (window as any).electronAPI;
    if (electron?.openExternalUrl) {
      electron.openExternalUrl(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const openCalendarInApp = () => {
    const electron = (window as any).electronAPI;
    if (electron?.openMainAppRoute) {
      electron.openMainAppRoute('/calendar');
    }
  };

  const getEventRelativeBadge = (ev: CalendarEvent) => {
    if (!ev.startDate.includes('T')) {
      return 'Journée';
    }
    const startMs = new Date(ev.startDate).getTime();
    const diffMins = Math.round((startMs - Date.now()) / 60000);
    if (diffMins >= -45 && diffMins <= 0) return 'En cours';
    if (diffMins > 0 && diffMins <= 60) return `Dans ${diffMins} min`;
    return ev.startDate.slice(11, 16);
  };

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="grid grid-cols-12 gap-3 h-[215px] px-3.5 py-2 select-none items-center">
      {/* Colonne Gauche (5 cols) : Minuteur Pomodoro Synchronisé */}
      <div className="col-span-5 flex flex-col items-center justify-between h-full py-1.5 px-2 rounded-2xl bg-white/[0.04] border border-white/10">
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Timer className="w-3 h-3" style={{ color: accentHex }} />
            <span>{pomodoro.mode === 'focus' ? 'Focus' : 'Pause'}</span>
          </span>
          <button
            type="button"
            onClick={() => onSwitchPomodoroMode(pomodoro.mode === 'focus' ? 'break' : 'focus')}
            className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/15 text-zinc-300 transition-colors cursor-pointer"
          >
            {pomodoro.mode === 'focus' ? '→ Pause' : '→ Focus'}
          </button>
        </div>

        {/* Anneau circulaire */}
        <div className="relative w-18 h-18 flex items-center justify-center my-0.5">
          <svg className="w-18 h-18 transform -rotate-90" viewBox="0 0 68 68">
            <circle
              cx="34"
              cy="34"
              r={radius}
              className="stroke-white/10"
              strokeWidth="4.5"
              fill="transparent"
            />
            <circle
              cx="34"
              cy="34"
              r={radius}
              stroke={pomodoro.mode === 'focus' ? accentHex : '#10b981'}
              strokeWidth="4.5"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-sm font-black text-white tracking-tight">
              {formattedTime}
            </span>
            <span className="text-[8px] font-mono text-zinc-400">
              🍅 {pomodoro.completedSessions} auj.
            </span>
          </div>
        </div>

        {/* Presets rapides + Contrôles */}
        <div className="w-full space-y-1.5">
          <div className="flex items-center justify-center gap-1">
            {[15, 25, 45].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onSetCustomMinutes(m)}
                className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {m}m
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={onResetPomodoro}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Réinitialiser"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={onTogglePomodoro}
              className="flex-1 py-1 rounded-lg text-[11px] font-bold text-black bg-white hover:bg-zinc-200 flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              {pomodoro.isRunning ? (
                <>
                  <Pause className="w-3 h-3 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Colonne Droite (7 cols) : Agenda Imminent & Visio 1-Clic */}
      <div className="col-span-7 flex flex-col justify-between h-full py-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-cyan-400" />
            <span>Agenda & Réunions</span>
          </span>
          <button
            type="button"
            onClick={openCalendarInApp}
            className="text-[10px] font-semibold text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <span>Calendrier</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>

        <div className="flex-1 mt-1.5 space-y-1.5 overflow-y-auto pr-0.5">
          {upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[155px] text-center rounded-xl bg-white/[0.03] border border-white/[0.06] px-3">
              <Clock className="w-5 h-5 text-zinc-500 mb-1.5" />
              <span className="text-xs font-semibold text-zinc-300">Aucun événement imminent</span>
              <span className="text-[10px] text-zinc-500 mt-0.5">
                Votre agenda est libre pour vos sessions Deep Work.
              </span>
            </div>
          ) : (
            upcomingEvents.map((ev) => {
              const videoUrl = extractVideoCallUrl(ev);
              const badge = getEventRelativeBadge(ev);
              const isImminent = badge.startsWith('Dans ') || badge === 'En cours';

              return (
                <div
                  key={ev.id}
                  className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: ev.color || accentHex }}
                      />
                      <span className="text-xs font-bold text-white truncate">{ev.title}</span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex-shrink-0 ${
                        isImminent
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-white/10 text-zinc-300'
                      }`}
                    >
                      {badge}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-zinc-400 truncate">
                      {ev.startDate.slice(0, 10)}
                      {ev.location ? ` • ${ev.location}` : ''}
                    </span>

                    {videoUrl && (
                      <button
                        type="button"
                        onClick={() => handleOpenExternal(videoUrl)}
                        className="px-2 py-0.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer flex-shrink-0 shadow-sm"
                      >
                        <Video className="w-3 h-3" />
                        <span>Rejoindre</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
