'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Mic2,
  Disc3,
  RefreshCw,
} from 'lucide-react';
import { SMTCMediaInfo, SyncedLyricLine } from '@/types/island';
import { IslandThemeTokens } from './islandTheme';

interface IslandMediaTabProps {
  media: SMTCMediaInfo | null;
  dominantColor: string;
  onControl: (action: 'play' | 'pause' | 'toggle' | 'next' | 'previous') => void;
  onSelectSession: (appId: string) => void;
  fallbackArtwork: string | null;
  themeTokens: IslandThemeTokens;
}

function parseLrc(lrc: string): SyncedLyricLine[] {
  const lines = lrc.split(/\r?\n/);
  const result: SyncedLyricLine[] = [];
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const rawLine of lines) {
    const matches = [...rawLine.matchAll(timeRegex)];
    if (matches.length === 0) continue;
    const text = rawLine.replace(timeRegex, '').trim();
    if (!text) continue;
    for (const m of matches) {
      const mins = parseInt(m[1], 10);
      const secs = parseInt(m[2], 10);
      const msStr = m[3] || '0';
      const ms = msStr.length === 2 ? parseInt(msStr, 10) * 10 : parseInt(msStr.padEnd(3, '0'), 10);
      result.push({
        timeMs: mins * 60000 + secs * 1000 + ms,
        text,
      });
    }
  }
  return result.sort((a, b) => a.timeMs - b.timeMs);
}

function formatMs(ms?: number): string {
  if (!ms || ms < 0 || !Number.isFinite(ms)) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export const IslandMediaTab: React.FC<IslandMediaTabProps> = ({
  media,
  dominantColor,
  onControl,
  onSelectSession,
  fallbackArtwork,
  themeTokens,
}) => {
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<SyncedLyricLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [localPosMs, setLocalPosMs] = useState<number>(0);
  const lastTrackKeyRef = useRef<string>('');
  const activeLyricRef = useRef<HTMLDivElement | null>(null);

  const hasMedia = Boolean(media?.hasSession && media?.title);
  const isPlaying = media?.status === 'playing';
  const artworkUrl = media?.thumbnailBase64 || fallbackArtwork || null;

  const isNothing = themeTokens.mode === 'nothing';
  const isCyberpunk = themeTokens.mode === 'cyberpunk';
  const numFontClass = isNothing ? 'font-ndot' : isCyberpunk ? 'font-mono' : 'tabular-nums';

  useEffect(() => {
    if (typeof media?.positionMs === 'number') {
      setLocalPosMs(media.positionMs);
    }
  }, [media?.positionMs, media?.title]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setLocalPosMs((prev) => {
        const max = media?.durationMs || 0;
        if (max > 0 && prev + 250 > max) return max;
        return prev + 250;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [isPlaying, media?.durationMs]);

  // Récupération automatique des paroles synchronisées LRC sur LRCLIB
  useEffect(() => {
    if (!showLyrics || !media?.title) return;
    const trackKey = `${media.artist || ''}__${media.title}`;
    if (trackKey === lastTrackKeyRef.current && (lyrics.length > 0 || plainLyrics)) return;
    lastTrackKeyRef.current = trackKey;

    let cancelled = false;
    const fetchLyrics = async () => {
      setLyricsLoading(true);
      setLyrics([]);
      setPlainLyrics(null);
      try {
        const cleanTitle = media.title!
          .replace(/\(.*?\)|\[.*?\]/g, '')
          .replace(/feat\..*$/i, '')
          .trim();
        const cleanArtist = (media.artist || '').replace(/ - Topic$/i, '').trim();
        const queryUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(
          cleanTitle
        )}&artist_name=${encodeURIComponent(cleanArtist)}`;

        let rawText = '';
        const electron = (window as any).electronAPI;
        if (electron?.fetchUrl) {
          const res = await electron.fetchUrl(queryUrl);
          if (res?.ok && res.data) rawText = res.data;
        } else {
          const r = await fetch(queryUrl);
          if (r.ok) rawText = await r.text();
        }

        if (cancelled || !rawText) return;
        const list = JSON.parse(rawText);
        if (Array.isArray(list) && list.length > 0) {
          const best = list.find((item: any) => item.syncedLyrics) || list[0];
          if (best.syncedLyrics) {
            setLyrics(parseLrc(best.syncedLyrics));
          } else if (best.plainLyrics) {
            setPlainLyrics(best.plainLyrics);
          }
        }
      } catch {
      } finally {
        if (!cancelled) setLyricsLoading(false);
      }
    };

    fetchLyrics();
    return () => {
      cancelled = true;
    };
  }, [showLyrics, media?.title, media?.artist]);

  const activeLyricIndex = React.useMemo(() => {
    if (lyrics.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (localPosMs >= lyrics[i].timeMs) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [lyrics, localPosMs]);

  useEffect(() => {
    if (activeLyricRef.current && showLyrics) {
      activeLyricRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLyricIndex, showLyrics]);

  const handleCycleSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    const sessions = media?.sessions || [];
    if (sessions.length <= 1) return;
    const curIdx = sessions.findIndex((s) => s.id === media?.appId);
    const next = sessions[(curIdx + 1) % sessions.length];
    if (next) onSelectSession(next.id);
  };

  const currentSourceLabel =
    media?.sessions?.find((s) => s.id === media.appId)?.label ||
    media?.sessions?.[0]?.label ||
    'Média';

  const durationMs = media?.durationMs || 0;
  const progressPct =
    durationMs > 0 ? Math.min(100, Math.max(0, (localPosMs / durationMs) * 100)) : 0;

  if (!hasMedia) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 select-none">
        <div
          className="w-11 h-11 rounded-2xl border flex items-center justify-center mb-2.5"
          style={{
            ...themeTokens.subtleActiveStyle,
            color: themeTokens.accentHex,
          }}
        >
          <Disc3 className="w-5 h-5" />
        </div>
        <p className={`text-[13px] font-medium text-zinc-200 ${isNothing ? 'font-ndot tracking-wider' : ''}`}>
          Aucune lecture en cours
        </p>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          Lancez un titre sur Spotify, YouTube ou Apple Music
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col justify-between h-full px-5 pb-4 pt-1 select-none overflow-hidden">
      {/* Halo ambiant subtil derrière la pochette */}
      {!themeTokens.isOled && themeTokens.neonIntensity !== 'none' && themeTokens.accentIntensity >= 25 && (
        <div
          className="pointer-events-none absolute -left-6 top-2 w-32 h-32 rounded-full blur-2xl transition-all duration-700"
          style={{
            opacity: Number((0.06 + 0.18 * (themeTokens.accentIntensity / 100)).toFixed(2)),
            backgroundColor:
              isCyberpunk || isNothing ? themeTokens.accentHex : dominantColor || themeTokens.accentHex,
          }}
        />
      )}

      {showLyrics ? (
        <div className="relative z-10 flex flex-col h-[112px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-zinc-400 truncate max-w-[280px]">
              {media?.title} — {media?.artist}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowLyrics(false);
              }}
              style={themeTokens.primaryBtnStyle}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-transform active:scale-95 ${themeTokens.primaryBtnTextClass}`}
            >
              Pochette
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-none">
            {lyricsLoading ? (
              <div className="flex items-center justify-center h-full text-xs text-zinc-400">
                Chargement des paroles...
              </div>
            ) : lyrics.length > 0 ? (
              lyrics.map((line, i) => {
                const isCurrent = i === activeLyricIndex;
                return (
                  <div
                    key={`${line.timeMs}-${i}`}
                    ref={isCurrent ? activeLyricRef : null}
                    style={
                      isCurrent && isCyberpunk && themeTokens.accentIntensity >= 15
                        ? { color: '#00F0FF', textShadow: '0 0 8px rgba(0,240,255,0.4)' }
                        : undefined
                    }
                    className={`transition-all duration-300 leading-snug ${
                      isCurrent
                        ? 'text-[13px] text-white font-semibold'
                        : 'text-xs text-zinc-500 font-medium'
                    }`}
                  >
                    {line.text}
                  </div>
                );
              })
            ) : plainLyrics ? (
              <div className="text-xs text-zinc-400 whitespace-pre-line leading-relaxed">
                {plainLyrics}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-zinc-500">
                Paroles indisponibles pour ce titre
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex items-center gap-4">
          {/* Pochette haute définition */}
          <div
            className={`w-[74px] h-[74px] overflow-hidden flex-shrink-0 bg-zinc-900 shadow-lg ring-1 ${
              isCyberpunk && themeTokens.accentIntensity >= 25
                ? 'rounded-xl ring-[#FCEE0A]/40'
                : isNothing || isCyberpunk
                ? 'rounded-xl ring-white/20'
                : 'rounded-2xl ring-white/15'
            }`}
          >
            {artworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artworkUrl}
                alt={media?.title || 'Album'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${themeTokens.accentHex}, #18181b)`,
                }}
              >
                <Music className="w-7 h-7 text-white/85" />
              </div>
            )}
          </div>

          {/* Métadonnées épurées */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold text-white tracking-tight truncate">
                {media?.title}
              </h3>

              <div className="flex items-center gap-1 flex-shrink-0">
                {media?.sessions && media.sessions.length > 1 && (
                  <button
                    type="button"
                    onClick={handleCycleSession}
                    className={`h-6 px-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-[10px] font-medium text-zinc-200 flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                      isNothing
                        ? 'font-ndot uppercase'
                        : isCyberpunk && themeTokens.accentIntensity >= 15
                        ? 'font-mono text-[#00F0FF]'
                        : isCyberpunk
                        ? 'font-mono'
                        : ''
                    }`}
                    title="Changer de lecteur audio"
                  >
                    <span>{currentSourceLabel}</span>
                    <RefreshCw className="w-2.5 h-2.5 opacity-75" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLyrics(true);
                  }}
                  className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                  title="Paroles synchronisées"
                >
                  <Mic2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-[12.5px] text-zinc-300/90 truncate mt-0.5">
              {media?.artist || currentSourceLabel}
            </p>
            {media?.albumTitle && (
              <p className="text-[11px] text-zinc-500 truncate mt-0.5">{media.albumTitle}</p>
            )}
          </div>
        </div>
      )}

      {/* Timeline + Contrôles tactiles thématisés */}
      <div className="relative z-10 space-y-2 pt-1">
        <div className="flex items-center gap-2.5">
          <span
            className={`text-[10px] font-medium text-zinc-400 w-8 text-right ${numFontClass}`}
            style={
              isCyberpunk && themeTokens.accentIntensity >= 15 ? { color: '#00F0FF' } : undefined
            }
          >
            {durationMs > 0 ? formatMs(localPosMs) : '--:--'}
          </span>
          <div className="flex-1 h-[4px] rounded-full bg-white/[0.12] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${durationMs > 0 ? progressPct : isPlaying ? 100 : 0}%`,
                ...themeTokens.progressFillStyle,
              }}
            />
          </div>
          <span className={`text-[10px] font-medium text-zinc-400 w-8 ${numFontClass}`}>
            {durationMs > 0 ? formatMs(durationMs) : '--:--'}
          </span>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onControl('previous');
            }}
            className="w-9 h-9 rounded-full bg-white/[0.03] hover:bg-white/[0.10] flex items-center justify-center text-zinc-200 hover:text-white transition-all active:scale-90 cursor-pointer"
            title="Précédent"
          >
            <SkipBack className="w-[18px] h-[18px] fill-current" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onControl('toggle');
            }}
            style={themeTokens.primaryBtnStyle}
            className={`w-10 h-10 rounded-full flex items-center justify-center hover:brightness-110 hover:scale-105 active:scale-95 transition-all cursor-pointer ${themeTokens.primaryBtnTextClass}`}
            title={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isPlaying ? (
              <Pause className="w-[18px] h-[18px] fill-current" />
            ) : (
              <Play className="w-[18px] h-[18px] ml-0.5 fill-current" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onControl('next');
            }}
            className="w-9 h-9 rounded-full bg-white/[0.03] hover:bg-white/[0.10] flex items-center justify-center text-zinc-200 hover:text-white transition-all active:scale-90 cursor-pointer"
            title="Suivant"
          >
            <SkipForward className="w-[18px] h-[18px] fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
