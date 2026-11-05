'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Music,
  CheckSquare,
  Timer,
  Flame,
  Inbox,
  Sparkles,
  Calendar,
  Video,
  Cpu,
  HardDrive,
  Maximize2,
  X,
} from 'lucide-react';
import {
  IslandStyle,
  IslandTrigger,
  IslandTab,
  SMTCMediaInfo,
  ShelfItem,
  ClipboardEntry,
  SystemStats,
  PomodoroSyncState,
} from '@/types/island';
import { useData } from '@/context/DataContext';
import { useDailyLife } from '@/context/DailyLifeContext';
import { useSettings } from '@/context/SettingsContext';
import {
  loadPomodoroSyncState,
  broadcastPomodoroState,
  subscribeSyntropySync,
} from '@/lib/islandSync';
import { IslandMediaTab } from './IslandMediaTab';
import { IslandTasksCaptureTab } from './IslandTasksCaptureTab';
import { IslandFocusAgendaTab, extractVideoCallUrl } from './IslandFocusAgendaTab';
import { IslandHabitsReadingTab } from './IslandHabitsReadingTab';
import { IslandShelfClipboardTab } from './IslandShelfClipboardTab';

const ACCENT_HEX_MAP: Record<string, string> = {
  purple: '#a855f7',
  aether: '#6366f1',
  cyan: '#06b6d4',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  rose: '#f43f5e',
  cyberpunk: '#FCEE0A',
  monochrome: '#e4e4e7',
};

export const DynamicIsland: React.FC = () => {
  const { tasks, events } = useData();
  const { habits, habitHistory } = useDailyLife();
  const { settings } = useSettings();

  // Configuration Desktop Dynamic Island
  const [islandStyle, setIslandStyle] = useState<IslandStyle>('pill');
  const [islandTrigger, setIslandTrigger] = useState<IslandTrigger>('hover');
  const [activeTab, setActiveTab] = useState<IslandTab>('media');
  const [clipboardEnabled, setClipboardEnabled] = useState<boolean>(true);
  const [systemStatsEnabled, setSystemStatsEnabled] = useState<boolean>(true);

  // État d'expansion et de capture clavier
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isCaptureFocused, setIsCaptureFocused] = useState<boolean>(false);
  const [autoFocusCapture, setAutoFocusCapture] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Données temps réel
  const [media, setMedia] = useState<SMTCMediaInfo | null>(null);
  const [fallbackArtwork, setFallbackArtwork] = useState<string | null>(null);
  const [dominantColor, setDominantColor] = useState<string>('#a855f7');
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardEntry[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [shelfItems, setShelfItems] = useState<ShelfItem[]>([]);
  const [clockStr, setClockStr] = useState<string>('');

  // Minuteur Pomodoro synchronisé
  const [pomodoro, setPomodoro] = useState<PomodoroSyncState>(() => loadPomodoroSyncState(25));
  const isApplyingExternalPomodoroRef = useRef(false);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedArtKeyRef = useRef<string>('');

  // Thème Syntropy OS
  const isNothing = settings.uiStyle === 'nothing';
  const isCyberpunk = settings.uiStyle === 'cyberpunk';
  const isOled = settings.darkBgStyle === 'oled';
  const accentHex = isCyberpunk
    ? '#FCEE0A'
    : isNothing
    ? '#D71920'
    : ACCENT_HEX_MAP[settings.accentColor || 'purple'] || '#a855f7';

  // Assurer la transparence totale du body Electron
  useEffect(() => {
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;
    document.documentElement.style.backgroundColor = 'transparent';
    document.body.style.backgroundColor = 'transparent';
    return () => {
      document.documentElement.style.backgroundColor = prevHtmlBg;
      document.body.style.backgroundColor = prevBodyBg;
    };
  }, []);

  // Horloge HH:mm
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockStr(
        now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 15000);
    return () => clearInterval(timer);
  }, []);

  // Chargement et écoute de la configuration Desktop
  useEffect(() => {
    const electron = (window as any).electronAPI;
    if (!electron) return;

    const applyCfg = (cfg: any) => {
      if (!cfg) return;
      if (cfg.dynamicIslandStyle === 'pill' || cfg.dynamicIslandStyle === 'notch') {
        setIslandStyle(cfg.dynamicIslandStyle);
      }
      if (cfg.dynamicIslandTrigger === 'hover' || cfg.dynamicIslandTrigger === 'click') {
        setIslandTrigger(cfg.dynamicIslandTrigger);
      }
      if (cfg.dynamicIslandDefaultTab) {
        setActiveTab(cfg.dynamicIslandDefaultTab);
      }
      if (typeof cfg.dynamicIslandClipboardHistory === 'boolean') {
        setClipboardEnabled(cfg.dynamicIslandClipboardHistory);
      }
      if (typeof cfg.dynamicIslandSystemStats === 'boolean') {
        setSystemStatsEnabled(cfg.dynamicIslandSystemStats);
      }
    };

    if (electron.getDesktopConfig) {
      electron.getDesktopConfig().then(applyCfg).catch(() => {});
    }

    const unsubCfg = electron.onIslandConfigUpdated
      ? electron.onIslandConfigUpdated(applyCfg)
      : () => {};

    const unsubCapture = electron.onActivateIslandCapture
      ? electron.onActivateIslandCapture(() => {
          electron.setIslandIgnoreMouse?.(false);
          setIsExpanded(true);
          setActiveTab('tasks');
          setAutoFocusCapture(true);
          setTimeout(() => setAutoFocusCapture(false), 300);
        })
      : () => {};

    const unsubPreview = electron.onIslandPreview
      ? electron.onIslandPreview(() => {
          setIsExpanded(true);
          setTimeout(() => {
            setIsExpanded((prev) => (isCaptureFocused ? prev : false));
          }, 3800);
        })
      : () => {};

    return () => {
      unsubCfg();
      unsubCapture();
      unsubPreview();
    };
  }, [isCaptureFocused]);

  // Polling Média Windows SMTC (toutes les 2.5s)
  useEffect(() => {
    const electron = (window as any).electronAPI;
    if (!electron?.getNowPlaying) return;

    let mounted = true;
    const pollMedia = async () => {
      try {
        const res = await electron.getNowPlaying();
        if (mounted && res) {
          setMedia(res);
        }
      } catch {}
    };

    pollMedia();
    const interval = setInterval(pollMedia, 2500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fallback Pochette iTunes Search API si SMTC ne renvoie pas de miniature
  useEffect(() => {
    if (!media?.hasSession || !media?.title) {
      setFallbackArtwork(null);
      return;
    }
    if (media.thumbnailBase64) {
      setFallbackArtwork(null);
      return;
    }

    const key = `${media.artist || ''}__${media.title}`;
    if (key === lastFetchedArtKeyRef.current) return;
    lastFetchedArtKeyRef.current = key;

    let cancelled = false;
    const fetchArt = async () => {
      try {
        const q = encodeURIComponent(`${media.artist || ''} ${media.title || ''}`.trim());
        const url = `https://itunes.apple.com/search?term=${q}&entity=song&limit=1`;
        const electron = (window as any).electronAPI;
        let raw = '';
        if (electron?.fetchUrl) {
          const r = await electron.fetchUrl(url);
          if (r?.ok && r.data) raw = r.data;
        } else {
          const r = await fetch(url);
          if (r.ok) raw = await r.text();
        }
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw);
        const art = parsed?.results?.[0]?.artworkUrl100;
        if (art) {
          setFallbackArtwork(art.replace('100x100bb', '300x300bb'));
        }
      } catch {}
    };

    fetchArt();
    return () => {
      cancelled = true;
    };
  }, [media?.hasSession, media?.title, media?.artist, media?.thumbnailBase64]);

  // Extraction de la couleur dominante de la pochette via <canvas>
  useEffect(() => {
    const src = media?.thumbnailBase64 || fallbackArtwork;
    if (!src) {
      setDominantColor(accentHex);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 16, 16);
        const data = ctx.getImageData(0, 0, 16, 16).data;
        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];
          // Ignorer les pixels trop sombres ou trop blancs
          const brightness = (pr + pg + pb) / 3;
          if (brightness > 30 && brightness < 235) {
            r += pr;
            g += pg;
            b += pb;
            count++;
          }
        }
        if (count > 0) {
          r = Math.min(255, Math.round((r / count) * 1.15));
          g = Math.min(255, Math.round((g / count) * 1.15));
          b = Math.min(255, Math.round((b / count) * 1.15));
          setDominantColor(`rgb(${r}, ${g}, ${b})`);
        } else {
          setDominantColor(accentHex);
        }
      } catch {
        setDominantColor(accentHex);
      }
    };
    img.src = src;
  }, [media?.thumbnailBase64, fallbackArtwork, accentHex]);

  // Presse-papiers intelligent
  useEffect(() => {
    const electron = (window as any).electronAPI;
    if (!electron?.getClipboardHistory) return;

    electron
      .getClipboardHistory()
      .then((list: ClipboardEntry[]) => {
        if (Array.isArray(list)) setClipboardHistory(list);
      })
      .catch(() => {});

    const unsub = electron.onClipboardUpdated
      ? electron.onClipboardUpdated((list: ClipboardEntry[]) => {
          if (Array.isArray(list)) setClipboardHistory(list);
        })
      : () => {};

    return () => unsub();
  }, []);

  // Monitoring CPU / RAM (toutes les 3.5s)
  useEffect(() => {
    const electron = (window as any).electronAPI;
    if (!electron?.getSystemStats || !systemStatsEnabled) return;

    let mounted = true;
    const pollStats = async () => {
      try {
        const st = await electron.getSystemStats();
        if (mounted && st) setSystemStats(st);
      } catch {}
    };
    pollStats();
    const interval = setInterval(pollStats, 3500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [systemStatsEnabled]);

  // Synchronisation temps réel du Pomodoro avec le Dashboard
  useEffect(() => {
    const unsub = subscribeSyntropySync((msg) => {
      if (msg.type === 'pomodoro-sync') {
        isApplyingExternalPomodoroRef.current = true;
        setPomodoro(msg.state);
        setTimeout(() => {
          isApplyingExternalPomodoroRef.current = false;
        }, 50);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!pomodoro.isRunning) return;
    const interval = setInterval(() => {
      setPomodoro((prev) => {
        if (!prev.isRunning) return prev;
        if (prev.timeLeft <= 1) {
          const nextCompleted =
            prev.mode === 'focus' ? prev.completedSessions + 1 : prev.completedSessions;
          const nextMode = prev.mode === 'focus' ? 'break' : 'focus';
          const nextTotal = nextMode === 'focus' ? 25 * 60 : 5 * 60;
          const nextState: PomodoroSyncState = {
            mode: nextMode,
            timeLeft: nextTotal,
            totalTime: nextTotal,
            isRunning: false,
            completedSessions: nextCompleted,
            updatedAt: Date.now(),
          };
          broadcastPomodoroState(nextState);
          return nextState;
        }
        return {
          ...prev,
          timeLeft: prev.timeLeft - 1,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pomodoro.isRunning]);

  const handleTogglePomodoro = () => {
    setPomodoro((prev) => {
      const next = { ...prev, isRunning: !prev.isRunning, updatedAt: Date.now() };
      broadcastPomodoroState(next);
      return next;
    });
  };

  const handleResetPomodoro = () => {
    setPomodoro((prev) => {
      const next = {
        ...prev,
        isRunning: false,
        timeLeft: prev.totalTime,
        updatedAt: Date.now(),
      };
      broadcastPomodoroState(next);
      return next;
    });
  };

  const handleSwitchPomodoroMode = (mode: 'focus' | 'break') => {
    const total = mode === 'focus' ? 25 * 60 : 5 * 60;
    const next: PomodoroSyncState = {
      mode,
      timeLeft: total,
      totalTime: total,
      isRunning: false,
      completedSessions: pomodoro.completedSessions,
      updatedAt: Date.now(),
    };
    setPomodoro(next);
    broadcastPomodoroState(next);
  };

  const handleSetCustomMinutes = (mins: number) => {
    const total = mins * 60;
    const next: PomodoroSyncState = {
      mode: 'focus',
      timeLeft: total,
      totalTime: total,
      isRunning: false,
      completedSessions: pomodoro.completedSessions,
      updatedAt: Date.now(),
    };
    setPomodoro(next);
    broadcastPomodoroState(next);
  };

  // Contrôle Média
  const handleControlMedia = async (action: 'play' | 'pause' | 'toggle' | 'next' | 'previous') => {
    const electron = (window as any).electronAPI;
    if (!electron?.controlMedia) return;
    await electron.controlMedia(action);
    setTimeout(async () => {
      const updated = await electron.getNowPlaying?.();
      if (updated) setMedia(updated);
    }, 250);
  };

  const handleSelectMediaSession = async (appId: string) => {
    const electron = (window as any).electronAPI;
    if (!electron?.selectMediaSession) return;
    await electron.selectMediaSession(appId);
    const updated = await electron.getNowPlaying?.();
    if (updated) setMedia(updated);
  };

  // Gestion Click-Through chirurgical & Expansion
  const handleMouseEnter = () => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    const electron = (window as any).electronAPI;
    electron?.setIslandIgnoreMouse?.(false);
    if (islandTrigger === 'hover') {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (isCaptureFocused || isDraggingOver) return;
    collapseTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
      const electron = (window as any).electronAPI;
      electron?.setIslandFocusable?.(false);
      electron?.setIslandIgnoreMouse?.(true);
    }, 180);
  };

  const handleCollapsedClick = () => {
    const electron = (window as any).electronAPI;
    electron?.setIslandIgnoreMouse?.(false);
    setIsExpanded(true);
  };

  const handleForceClose = () => {
    setIsCaptureFocused(false);
    setIsExpanded(false);
    const electron = (window as any).electronAPI;
    electron?.setIslandFocusable?.(false);
    electron?.setIslandIgnoreMouse?.(true);
  };

  // Drag & Drop vers Dropzone Shelf
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) {
      setIsDraggingOver(true);
      const electron = (window as any).electronAPI;
      electron?.setIslandIgnoreMouse?.(false);
      setIsExpanded(true);
      setActiveTab('shelf');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    setIsExpanded(true);
    setActiveTab('shelf');

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : undefined;
          const isImg = file.type.startsWith('image/');
          const newItem: ShelfItem = {
            id: `shelf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: isImg ? 'image' : 'file',
            name: file.name,
            dataUrl,
            mimeType: file.type,
            size: file.size,
            createdAt: new Date().toISOString(),
          };
          setShelfItems((prev) => [newItem, ...prev.slice(0, 14)]);
        };
        reader.readAsDataURL(file);
      }
      return;
    }

    const droppedText =
      e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (droppedText && droppedText.trim()) {
      const trimmed = droppedText.trim();
      const isUrl = /^https?:\/\/\S+$/i.test(trimmed);
      const newItem: ShelfItem = {
        id: `shelf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: isUrl ? 'link' : 'text',
        name: trimmed.slice(0, 60),
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      setShelfItems((prev) => [newItem, ...prev.slice(0, 14)]);
    }
  };

  // Détection d'un événement agenda imminent (< 30 min)
  const imminentEvent = useMemo(() => {
    const now = Date.now();
    for (const ev of events) {
      if (!ev.startDate || !ev.startDate.includes('T')) continue;
      const startMs = new Date(ev.startDate).getTime();
      const diffMins = Math.round((startMs - now) / 60000);
      if (diffMins >= -15 && diffMins <= 30) {
        return { event: ev, diffMins, videoUrl: extractVideoCallUrl(ev) };
      }
    }
    return null;
  }, [events]);

  // Compteurs rapides pour le mode repos
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingTasksCount = useMemo(
    () => tasks.filter((t) => t.status !== 'done').length,
    [tasks]
  );
  const completedHabitsToday = useMemo(
    () => habits.filter((h) => !!habitHistory[h.id]?.[todayStr]).length,
    [habits, habitHistory, todayStr]
  );

  const isMediaPlaying = Boolean(media?.hasSession && media?.status === 'playing' && media?.title);
  const hasAnyMedia = Boolean(media?.hasSession && media?.title);
  const artworkUrl = media?.thumbnailBase64 || fallbackArtwork || null;

  const pomoMins = String(Math.floor(pomodoro.timeLeft / 60)).padStart(2, '0');
  const pomoSecs = String(pomodoro.timeLeft % 60).padStart(2, '0');

  // Styles de conteneur selon le thème (Syntropy Liquid Glass / Nothing / Cyberpunk / OLED) et le mode (pill vs notch)
  const isNotch = islandStyle === 'notch';

  const containerThemeClasses = useMemo(() => {
    if (isNotch) {
      return 'bg-[#050507] text-white border-b border-x border-white/10 shadow-[0_14px_38px_rgba(0,0,0,0.85)]';
    }
    if (isNothing) {
      return 'bg-black/95 text-white border border-white/25 shadow-[0_10px_32px_rgba(0,0,0,0.9)] font-ntype';
    }
    if (isCyberpunk) {
      return 'bg-[#070a14]/95 text-[#00F0FF] border border-[#FCEE0A]/75 shadow-[0_0_25px_rgba(252,238,10,0.22)] font-mono';
    }
    if (isOled) {
      return 'bg-black/95 text-zinc-100 border border-white/15 shadow-[0_12px_36px_rgba(0,0,0,0.95)] backdrop-blur-2xl';
    }
    return 'bg-zinc-950/90 text-zinc-100 border border-white/15 shadow-[0_12px_36px_rgba(0,0,0,0.75)] backdrop-blur-2xl';
  }, [isNotch, isNothing, isCyberpunk, isOled]);

  return (
    <div
      className="w-full h-full flex justify-center items-start bg-transparent overflow-hidden select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={!isExpanded ? handleCollapsedClick : undefined}
        style={{
          marginTop: isNotch ? 0 : 8,
          width: isExpanded ? 510 : isMediaPlaying || pomodoro.isRunning || imminentEvent ? 310 : 256,
          height: isExpanded ? 298 : isNotch ? 36 : 38,
          transition: 'all 340ms cubic-bezier(0.22, 1, 0.36, 1)',
          borderColor:
            !isNotch && !isNothing && !isCyberpunk && isExpanded ? `${accentHex}55` : undefined,
        }}
        className={`relative flex flex-col justify-between overflow-visible ${
          isNotch
            ? isExpanded
              ? 'rounded-b-[26px] rounded-t-none'
              : 'rounded-b-[18px] rounded-t-none'
            : isExpanded
            ? 'rounded-[28px]'
            : 'rounded-full cursor-pointer'
        } ${containerThemeClasses}`}
      >
        {/* Oreilles concaves SVG pour le mode Living Notch (y = 0) */}
        {isNotch && (
          <>
            <svg
              className="absolute -left-3 top-0 w-3 h-3 text-[#050507] pointer-events-none"
              viewBox="0 0 12 12"
              fill="currentColor"
            >
              <path d="M12 0H0C6.627 0 12 5.373 12 12V0Z" />
            </svg>
            <svg
              className="absolute -right-3 top-0 w-3 h-3 text-[#050507] pointer-events-none"
              viewBox="0 0 12 12"
              fill="currentColor"
            >
              <path d="M0 0H12C5.373 0 0 5.373 0 12V0Z" />
            </svg>
          </>
        )}

        {/* ============================================================ */}
        {/* ÉTAT 1 : PILULE / NOTCH COMPACTE (COLLAPSED)                 */}
        {/* ============================================================ */}
        {!isExpanded ? (
          <div className="w-full h-full px-3.5 flex items-center justify-between gap-2 overflow-hidden">
            {/* Priorité 1 : Pomodoro actif */}
            {pomodoro.isRunning ? (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full animate-ping flex-shrink-0"
                    style={{ backgroundColor: accentHex }}
                  />
                  <span className="text-[11px] font-bold text-zinc-200 truncate">
                    {pomodoro.mode === 'focus' ? 'Focus Deep Work' : 'Pause active'}
                  </span>
                </div>
                <span
                  className="font-mono text-xs font-black px-2 py-0.5 rounded-full bg-white/10"
                  style={{ color: accentHex }}
                >
                  {pomoMins}:{pomoSecs}
                </span>
              </>
            ) : imminentEvent ? (
              /* Priorité 2 : Réunion / Événement imminent (< 30 min) */
              <>
                <div className="flex items-center gap-1.5 min-w-0">
                  {imminentEvent.videoUrl ? (
                    <Video className="w-3.5 h-3.5 text-emerald-400 animate-pulse flex-shrink-0" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  )}
                  <span className="text-[11px] font-bold text-white truncate">
                    {imminentEvent.event.title}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 flex-shrink-0">
                  {imminentEvent.diffMins <= 0 ? 'En cours' : `${imminentEvent.diffMins} min`}
                </span>
              </>
            ) : isMediaPlaying ? (
              /* Priorité 3 : Média en cours de lecture */
              <>
                <div className="flex items-center gap-2 min-w-0">
                  {artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={artworkUrl}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover border border-white/20 flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: dominantColor }}
                    >
                      <Music className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <span className="text-[11px] font-bold text-white truncate">
                    {media?.title}
                  </span>
                  {media?.artist && (
                    <span className="text-[10px] text-zinc-400 truncate hidden sm:inline">
                      • {media.artist}
                    </span>
                  )}
                </div>

                {/* Mini égaliseur animé */}
                <div className="flex items-end gap-[2px] h-3 flex-shrink-0">
                  {[0, 1, 2, 3].map((b) => (
                    <span
                      key={b}
                      className="w-[2.5px] rounded-full"
                      style={{
                        backgroundColor: isNothing
                          ? '#D71920'
                          : isCyberpunk
                          ? '#FCEE0A'
                          : dominantColor,
                        height: `${[70, 100, 50, 85][b]}%`,
                        animation: `pulse ${0.55 + b * 0.15}s ease-in-out infinite alternate`,
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              /* Priorité 4 : État Repos (Logo Syntropy + Compteurs + Horloge) */
              <>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: accentHex }}
                  />
                  <span className="text-[11px] font-extrabold tracking-tight text-white">
                    Syntropy
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-300">
                  <span className="px-1.5 py-0.5 rounded-full bg-white/8 text-zinc-200">
                    ✓ {pendingTasksCount}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-white/8 text-zinc-200">
                    🔥 {completedHabitsToday}/{habits.length}
                  </span>
                  <span className="text-zinc-400 font-semibold">{clockStr}</span>
                </div>
              </>
            )}
          </div>
        ) : (
          /* ============================================================ */
          /* ÉTAT 2 : CARTE ÉTENDUE (5 ONGLETS + SYSTEM MONITOR)          */
          /* ============================================================ */
          <div className="flex flex-col justify-between w-full h-full overflow-hidden">
            {/* Barre de navigation supérieure des 5 onglets */}
            <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5 border-b border-white/10">
              <div className="flex items-center gap-1">
                {(
                  [
                    {
                      id: 'media' as IslandTab,
                      label: 'Média',
                      icon: Music,
                      badge: hasAnyMedia ? '●' : undefined,
                    },
                    {
                      id: 'tasks' as IslandTab,
                      label: 'Tâches',
                      icon: CheckSquare,
                      badge: pendingTasksCount > 0 ? String(pendingTasksCount) : undefined,
                    },
                    {
                      id: 'focus' as IslandTab,
                      label: 'Focus & Agenda',
                      icon: Timer,
                      badge: pomodoro.isRunning ? `${pomoMins}:${pomoSecs}` : undefined,
                    },
                    {
                      id: 'habits' as IslandTab,
                      label: 'Habitudes',
                      icon: Flame,
                      badge: `${completedHabitsToday}/${habits.length}`,
                    },
                    {
                      id: 'shelf' as IslandTab,
                      label: 'Shelf & Clips',
                      icon: Inbox,
                      badge:
                        shelfItems.length > 0 ? String(shelfItems.length) : undefined,
                    },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        active
                          ? 'bg-white text-black shadow-xs'
                          : 'text-zinc-400 hover:text-white hover:bg-white/8'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span
                          className={`text-[9px] font-mono px-1 rounded-full ${
                            active ? 'bg-black/15 text-black' : 'bg-white/10 text-zinc-300'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const electron = (window as any).electronAPI;
                    electron?.openMainAppRoute?.('/');
                  }}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Ouvrir Syntropy OS"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleForceClose}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Réduire la Dynamic Island"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Contenu de l'onglet actif */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'media' && (
                <IslandMediaTab
                  media={media}
                  dominantColor={dominantColor}
                  onControl={handleControlMedia}
                  onSelectSession={handleSelectMediaSession}
                  fallbackArtwork={fallbackArtwork}
                  isNothing={isNothing}
                  isCyberpunk={isCyberpunk}
                />
              )}

              {activeTab === 'tasks' && (
                <IslandTasksCaptureTab
                  autoFocusCapture={autoFocusCapture}
                  onCaptureActiveChange={setIsCaptureFocused}
                  onCloseIsland={handleForceClose}
                  accentHex={accentHex}
                />
              )}

              {activeTab === 'focus' && (
                <IslandFocusAgendaTab
                  pomodoro={pomodoro}
                  onTogglePomodoro={handleTogglePomodoro}
                  onResetPomodoro={handleResetPomodoro}
                  onSwitchPomodoroMode={handleSwitchPomodoroMode}
                  onSetCustomMinutes={handleSetCustomMinutes}
                  events={events}
                  accentHex={accentHex}
                />
              )}

              {activeTab === 'habits' && <IslandHabitsReadingTab accentHex={accentHex} />}

              {activeTab === 'shelf' && (
                <IslandShelfClipboardTab
                  shelfItems={shelfItems}
                  onRemoveShelfItem={(id) =>
                    setShelfItems((prev) => prev.filter((item) => item.id !== id))
                  }
                  onClearShelf={() => setShelfItems([])}
                  clipboardHistory={clipboardHistory}
                  clipboardEnabled={clipboardEnabled}
                  onCopyClipboard={(text) => {
                    const electron = (window as any).electronAPI;
                    electron?.copyClipboardItem?.(text);
                  }}
                  onPinClipboard={async (id) => {
                    const electron = (window as any).electronAPI;
                    const updated = await electron?.pinClipboardItem?.(id);
                    if (Array.isArray(updated)) setClipboardHistory(updated);
                  }}
                  onDeleteClipboard={async (id) => {
                    const electron = (window as any).electronAPI;
                    const updated = await electron?.deleteClipboardItem?.(id);
                    if (Array.isArray(updated)) setClipboardHistory(updated);
                  }}
                  onClearClipboard={async () => {
                    const electron = (window as any).electronAPI;
                    const updated = await electron?.clearClipboardHistory?.();
                    if (Array.isArray(updated)) setClipboardHistory(updated);
                  }}
                  accentHex={accentHex}
                />
              )}
            </div>

            {/* Pied de carte : Mini-moniteur Système CPU / RAM + Horloge */}
            <div className="px-3.5 py-1.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-zinc-400 bg-black/25">
              {systemStatsEnabled && systemStats ? (
                <div className="flex items-center gap-3">
                  <span
                    className={`flex items-center gap-1 ${
                      systemStats.cpuPercent > 85 ? 'text-rose-400 font-bold' : 'text-zinc-400'
                    }`}
                  >
                    <Cpu className="w-3 h-3" />
                    <span>CPU {systemStats.cpuPercent}%</span>
                  </span>
                  <span
                    className={`flex items-center gap-1 ${
                      systemStats.ramPercent > 85 ? 'text-amber-400 font-bold' : 'text-zinc-400'
                    }`}
                  >
                    <HardDrive className="w-3 h-3" />
                    <span>
                      RAM {systemStats.ramPercent}% ({systemStats.ramUsedGb}/
                      {systemStats.ramTotalGb} Go)
                    </span>
                  </span>
                </div>
              ) : (
                <span className="text-zinc-500">Syntropy OS Dynamic Island</span>
              )}

              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Alt+Espace : Capture</span>
                <span className="text-zinc-300 font-semibold">{clockStr}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default DynamicIsland;
