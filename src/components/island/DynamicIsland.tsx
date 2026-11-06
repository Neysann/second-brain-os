'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Music,
  CheckSquare,
  Flame,
  Inbox,
  ArrowUpRight,
  ChevronUp,
} from 'lucide-react';
import {
  IslandStyle,
  IslandTrigger,
  IslandTab,
  SMTCMediaInfo,
  ShelfItem,
  ClipboardEntry,
} from '@/types/island';
import { useData } from '@/context/DataContext';
import { useSettings } from '@/context/SettingsContext';
import { IslandMediaTab } from './IslandMediaTab';
import { IslandTasksCaptureTab } from './IslandTasksCaptureTab';
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

const VALID_TABS: IslandTab[] = ['media', 'tasks', 'shelf', 'habits'];

export const DynamicIsland: React.FC = () => {
  const { tasks } = useData();
  const { settings } = useSettings();

  const [islandStyle, setIslandStyle] = useState<IslandStyle>('notch');
  const [islandTrigger, setIslandTrigger] = useState<IslandTrigger>('hover');
  const [activeTab, setActiveTab] = useState<IslandTab>('media');
  const [clipboardEnabled, setClipboardEnabled] = useState<boolean>(true);

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isCaptureFocused, setIsCaptureFocused] = useState<boolean>(false);
  const [autoFocusCapture, setAutoFocusCapture] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const [media, setMedia] = useState<SMTCMediaInfo | null>(null);
  const [fallbackArtwork, setFallbackArtwork] = useState<string | null>(null);
  const [dominantColor, setDominantColor] = useState<string>('#a855f7');
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardEntry[]>([]);
  const [shelfItems, setShelfItems] = useState<ShelfItem[]>([]);
  const [clockStr, setClockStr] = useState<string>('');

  const islandTriggerRef = useRef<IslandTrigger>(islandTrigger);
  const isCaptureFocusedRef = useRef<boolean>(false);
  const isDraggingOverRef = useRef<boolean>(false);
  const suppressHoverUntilLeaveRef = useRef<boolean>(false);
  const lastFetchedArtKeyRef = useRef<string>('');

  useEffect(() => {
    islandTriggerRef.current = islandTrigger;
  }, [islandTrigger]);

  useEffect(() => {
    isCaptureFocusedRef.current = isCaptureFocused;
  }, [isCaptureFocused]);

  useEffect(() => {
    isDraggingOverRef.current = isDraggingOver;
  }, [isDraggingOver]);

  const accentHex =
    settings.uiStyle === 'cyberpunk'
      ? '#FCEE0A'
      : settings.uiStyle === 'nothing'
      ? '#D71920'
      : ACCENT_HEX_MAP[settings.accentColor || 'purple'] || '#a855f7';

  // Transparence totale du canevas Electron
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

  // Horloge minimale HH:mm
  useEffect(() => {
    const updateClock = () => {
      setClockStr(
        new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 10000);
    return () => clearInterval(timer);
  }, []);

  const isMediaPlaying = Boolean(media?.hasSession && media?.status === 'playing' && media?.title);
  const isNotch = islandStyle === 'notch';

  const currentWidth = isExpanded ? 452 : isMediaPlaying ? 252 : 108;
  const currentHeight = isExpanded ? 248 : isMediaPlaying ? (isNotch ? 34 : 36) : isNotch ? 31 : 33;
  const currentTop = isNotch ? 0 : 8;

  // Synchronisation permanente de la hitbox exacte avec le Main Process Electron
  useEffect(() => {
    const electron = (window as any).electronAPI;
    electron?.setIslandHitbox?.({
      width: currentWidth,
      height: currentHeight,
      top: currentTop,
    });
  }, [currentWidth, currentHeight, currentTop]);

  // Configuration + Événements IPC Main Process (survol natif sans perte de clic)
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
      if (cfg.dynamicIslandDefaultTab && VALID_TABS.includes(cfg.dynamicIslandDefaultTab)) {
        setActiveTab(cfg.dynamicIslandDefaultTab);
      }
      if (typeof cfg.dynamicIslandClipboardHistory === 'boolean') {
        setClipboardEnabled(cfg.dynamicIslandClipboardHistory);
      }
    };

    electron.getDesktopConfig?.().then(applyCfg).catch(() => {});

    const unsubCfg = electron.onIslandConfigUpdated?.(applyCfg) || (() => {});

    const unsubHover =
      electron.onIslandHover?.((hovered: boolean) => {
        if (hovered) {
          if (!suppressHoverUntilLeaveRef.current && islandTriggerRef.current === 'hover') {
            setIsExpanded(true);
          }
        } else {
          suppressHoverUntilLeaveRef.current = false;
          if (!isCaptureFocusedRef.current && !isDraggingOverRef.current) {
            setIsExpanded(false);
          }
        }
      }) || (() => {});

    const unsubCapture =
      electron.onActivateIslandCapture?.(() => {
        suppressHoverUntilLeaveRef.current = false;
        setIsExpanded(true);
        setActiveTab('tasks');
        setAutoFocusCapture(true);
        setTimeout(() => setAutoFocusCapture(false), 300);
      }) || (() => {});

    const unsubPreview =
      electron.onIslandPreview?.(() => {
        suppressHoverUntilLeaveRef.current = false;
        setIsExpanded(true);
        setTimeout(() => {
          if (!isCaptureFocusedRef.current) {
            setIsExpanded(false);
          }
        }, 4500);
      }) || (() => {});

    return () => {
      unsubCfg();
      unsubHover();
      unsubCapture();
      unsubPreview();
    };
  }, []);

  // Polling Média SMTC (toutes les 2s)
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
    const interval = setInterval(pollMedia, 2000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fallback Pochette iTunes Search API
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

  // Extraction de la couleur dominante de l'album
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

    const unsub =
      electron.onClipboardUpdated?.((list: ClipboardEntry[]) => {
        if (Array.isArray(list)) setClipboardHistory(list);
      }) || (() => {});

    return () => unsub();
  }, []);

  const handleControlMedia = async (action: 'play' | 'pause' | 'toggle' | 'next' | 'previous') => {
    const electron = (window as any).electronAPI;
    if (!electron?.controlMedia) return;
    await electron.controlMedia(action);
    setTimeout(async () => {
      const updated = await electron.getNowPlaying?.();
      if (updated) setMedia(updated);
    }, 220);
  };

  const handleSelectMediaSession = async (appId: string) => {
    const electron = (window as any).electronAPI;
    if (!electron?.selectMediaSession) return;
    await electron.selectMediaSession(appId);
    const updated = await electron.getNowPlaying?.();
    if (updated) setMedia(updated);
  };

  // Fallback survol navigateur (hors Electron)
  const handleBrowserMouseEnter = () => {
    const electron = (window as any).electronAPI;
    electron?.setIslandIgnoreMouse?.(false);
    if (!electron?.isDesktop && islandTrigger === 'hover' && !suppressHoverUntilLeaveRef.current) {
      setIsExpanded(true);
    }
  };

  const handleBrowserMouseLeave = () => {
    const electron = (window as any).electronAPI;
    if (!electron?.isDesktop && !isCaptureFocused && !isDraggingOver) {
      suppressHoverUntilLeaveRef.current = false;
      setIsExpanded(false);
    }
  };

  const handleCollapsedClick = () => {
    suppressHoverUntilLeaveRef.current = false;
    const electron = (window as any).electronAPI;
    electron?.setIslandIgnoreMouse?.(false);
    setIsExpanded(true);
  };

  const handleForceClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    suppressHoverUntilLeaveRef.current = true;
    setIsCaptureFocused(false);
    setIsExpanded(false);
    const electron = (window as any).electronAPI;
    electron?.setIslandFocusable?.(false);
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

  const pendingTasksCount = useMemo(
    () => tasks.filter((t) => t.status !== 'done').length,
    [tasks]
  );

  const artworkUrl = media?.thumbnailBase64 || fallbackArtwork || null;

  const openCorrespondingRoute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const routeMap: Record<IslandTab, string> = {
      media: '/',
      tasks: '/tasks',
      shelf: '/notes',
      habits: '/habits',
    };
    const electron = (window as any).electronAPI;
    electron?.openMainAppRoute?.(routeMap[activeTab] || '/');
  };

  return (
    <div
      className="w-full h-full flex justify-center items-start bg-transparent overflow-hidden select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <style>{`
        @keyframes notchEq {
          0%, 100% { transform: scaleY(0.28); }
          50% { transform: scaleY(1); }
        }
      `}</style>

      <div
        onMouseEnter={handleBrowserMouseEnter}
        onMouseLeave={handleBrowserMouseLeave}
        onClick={!isExpanded ? handleCollapsedClick : undefined}
        style={{
          marginTop: currentTop,
          width: currentWidth,
          height: currentHeight,
          transition:
            'width 300ms cubic-bezier(0.22, 1, 0.36, 1), height 300ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 300ms cubic-bezier(0.22, 1, 0.36, 1)',
          backgroundColor: isNotch ? '#000000' : '#060608',
          boxShadow: isNotch
            ? 'inset 0 -1px 0 rgba(255,255,255,0.08), 0 18px 40px rgba(0,0,0,0.75)'
            : 'inset 0 0 0 1px rgba(255,255,255,0.09), 0 18px 40px rgba(0,0,0,0.8)',
        }}
        className={`relative flex flex-col text-white overflow-visible ${
          isNotch
            ? isExpanded
              ? 'rounded-b-[28px] rounded-t-none'
              : 'rounded-b-[16px] rounded-t-none cursor-pointer'
            : isExpanded
            ? 'rounded-[28px]'
            : 'rounded-full cursor-pointer'
        }`}
      >
        {/* Congés concaves fluides pour la Living Notch soudée à y = 0 */}
        {isNotch && (
          <>
            <svg
              className="absolute -left-3.5 top-0 w-3.5 h-3.5 text-black pointer-events-none"
              viewBox="0 0 14 14"
              fill="currentColor"
            >
              <path d="M14 0H0C7.732 0 14 6.268 14 14V0Z" />
            </svg>
            <svg
              className="absolute -right-3.5 top-0 w-3.5 h-3.5 text-black pointer-events-none"
              viewBox="0 0 14 14"
              fill="currentColor"
            >
              <path d="M0 0H14C6.268 0 0 6.268 0 14V0Z" />
            </svg>
          </>
        )}

        {/* ============================================================ */}
        {/* ÉTAT FERMÉ : ULTRA-ÉPURÉ (HEURE + POINT OU MUSIQUE)          */}
        {/* ============================================================ */}
        {!isExpanded ? (
          <div className="w-full h-full px-3 flex items-center justify-between gap-2 overflow-hidden">
            {isMediaPlaying ? (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  {artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={artworkUrl}
                      alt=""
                      className="w-5 h-5 rounded-[6px] object-cover flex-shrink-0 ring-1 ring-white/15"
                    />
                  ) : (
                    <div
                      className="w-5 h-5 rounded-[6px] flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: dominantColor }}
                    >
                      <Music className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <span className="text-[11.5px] font-medium text-white/95 truncate">
                    {media?.title}
                  </span>
                </div>

                {/* Égaliseur Apple Music fluide 60 FPS */}
                <div className="flex items-center gap-[2.5px] h-3.5 flex-shrink-0 pr-0.5">
                  {[0.55, 0.85, 0.65, 0.95].map((dur, idx) => (
                    <span
                      key={idx}
                      className="w-[2.5px] h-3 rounded-full origin-center"
                      style={{
                        backgroundColor: dominantColor,
                        animation: `notchEq ${dur}s ease-in-out ${idx * 0.12}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full flex items-center justify-center gap-2">
                <span
                  className="w-[5.5px] h-[5.5px] rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: pendingTasksCount > 0 ? accentHex : '#34d399',
                    boxShadow: `0 0 8px ${pendingTasksCount > 0 ? accentHex : '#34d399'}`,
                  }}
                />
                <span className="text-xs font-medium tracking-tight text-white/90 tabular-nums">
                  {clockStr}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* ============================================================ */
          /* ÉTAT OUVERT : DESIGN APPLE / BORINGNOTCH SANS ENCOMBREMENT   */
          /* ============================================================ */
          <div className="flex flex-col w-full h-full overflow-hidden">
            {/* Barre supérieure d'icônes pures (zéro texte tassé) */}
            <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
              <div className="flex items-center gap-1 bg-white/[0.05] p-1 rounded-full">
                {(
                  [
                    { id: 'media' as IslandTab, icon: Music, title: 'Média' },
                    { id: 'tasks' as IslandTab, icon: CheckSquare, title: 'Tâches & Capture' },
                    { id: 'shelf' as IslandTab, icon: Inbox, title: 'Presse-papiers & Dropzone' },
                    { id: 'habits' as IslandTab, icon: Flame, title: 'Habitudes & Lecture' },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab(tab.id);
                      }}
                      title={tab.title}
                      className={`w-9 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                        active
                          ? 'bg-white text-black shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={openCorrespondingRoute}
                  className="w-7 h-7 rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                  title="Ouvrir dans l'application"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleForceClose}
                  className="w-7 h-7 rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                  title="Replier"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contenu aéré plein format */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'media' && (
                <IslandMediaTab
                  media={media}
                  dominantColor={dominantColor}
                  onControl={handleControlMedia}
                  onSelectSession={handleSelectMediaSession}
                  fallbackArtwork={fallbackArtwork}
                />
              )}

              {activeTab === 'tasks' && (
                <IslandTasksCaptureTab
                  autoFocusCapture={autoFocusCapture}
                  onCaptureActiveChange={setIsCaptureFocused}
                  onCloseIsland={() => handleForceClose()}
                  accentHex={accentHex}
                />
              )}

              {activeTab === 'shelf' && (
                <IslandShelfClipboardTab
                  shelfItems={shelfItems}
                  onRemoveShelfItem={(id) =>
                    setShelfItems((prev) => prev.filter((item) => item.id !== id))
                  }
                  onClearShelf={() => setShelfItems([])}
                  clipboardHistory={clipboardHistory}
                  clipboardEnabled={clipboardEnabled}
                  onCopyClipboard={(id) => {
                    const electron = (window as any).electronAPI;
                    electron?.copyClipboardItem?.(id);
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
                />
              )}

              {activeTab === 'habits' && <IslandHabitsReadingTab />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicIsland;
