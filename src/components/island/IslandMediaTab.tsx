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
  Radio,
  Volume2,
} from 'lucide-react';
import { SMTCMediaInfo, SyncedLyricLine } from '@/types/island';

interface IslandMediaTabProps {
  media: SMTCMediaInfo | null;
  dominantColor: string;
  onControl: (action: 'play' | 'pause' | 'toggle' | 'next' | 'previous') => void;
  onSelectSession: (appId: string) => void;
  fallbackArtwork: string | null;
  isNothing?: boolean;
  isCyberpunk?: boolean;
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
  isNothing,
  isCyberpunk,
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

  // Synchronise la position locale avec interpolation fluide toutes les 250ms
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
        // Ignorer les erreurs réseau LRCLIB
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

  const durationMs = media?.durationMs || 0;
  const progressPct =
    durationMs > 0 ? Math.min(100, Math.max(0, (localPosMs / durationMs) * 100)) : 0;

  if (!hasMedia) {
    return (
      <div className="flex flex-col items-center justify-center h-[210px] text-center px-4 select-none">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-zinc-400">
          <Disc3 className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
        </div>
        <p className="text-xs font-bold text-zinc-200">Aucune lecture multimédia détectée</p>
        <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
          Lancez un titre sur Spotify, Apple Music, YouTube, Deezer ou VLC pour contrôler votre musique en direct.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between h-[215px] px-3.5 py-2.5 select-none">
      {/* Barre supérieure : sélecteur de source SMTC + bouton Paroles */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
            style={{ backgroundColor: dominantColor }}
          />
          {media?.sessions && media.sessions.length > 1 ? (
            <select
              value={media.appId || ''}
              onChange={(e) => onSelectSession(e.target.value)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-zinc-200 outline-none cursor-pointer truncate max-w-[180px]"
            >
              {media.sessions.map((s) => (
                <option key={s.id} value={s.id} className="bg-zinc-900 text-zinc-100">
                  {s.label} {s.status === 'playing' ? '▶' : ''}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 truncate flex items-center gap-1">
              <Radio className="w-3 h-3 text-zinc-400" />
              <span>{media?.sessions?.[0]?.label || 'Windows Media'}</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowLyrics((v) => !v)}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
            showLyrics
              ? 'bg-white text-black border-white shadow-sm'
              : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
          }`}
        >
          <Mic2 className="w-3 h-3" />
          <span>Paroles</span>
        </button>
      </div>

      {/* Corps central : Pochette + Infos OU Paroles Synchronisées */}
      {showLyrics ? (
        <div className="my-1.5 h-[108px] overflow-y-auto rounded-xl bg-black/40 border border-white/10 px-3 py-2 space-y-1.5 scrollbar-thin">
          {lyricsLoading ? (
            <div className="flex items-center justify-center h-full text-[11px] text-zinc-400 animate-pulse">
              Recherche des paroles synchronisées (LRCLIB)...
            </div>
          ) : lyrics.length > 0 ? (
            lyrics.map((line, i) => {
              const isCurrent = i === activeLyricIndex;
              return (
                <div
                  key={`${line.timeMs}-${i}`}
                  ref={isCurrent ? activeLyricRef : null}
                  className={`text-xs transition-all duration-300 leading-snug ${
                    isCurrent
                      ? 'text-white font-extrabold scale-[1.02] origin-left'
                      : i < activeLyricIndex
                      ? 'text-zinc-500 font-medium'
                      : 'text-zinc-400 font-medium'
                  }`}
                  style={isCurrent ? { textShadow: `0 0 12px ${dominantColor}` } : undefined}
                >
                  {line.text}
                </div>
              );
            })
          ) : plainLyrics ? (
            <div className="text-[11px] text-zinc-300 whitespace-pre-line leading-relaxed">
              {plainLyrics}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[11px] text-zinc-500">
              Aucune parole synchronisée trouvée pour ce titre.
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3.5 my-1">
          {/* Pochette d'album avec halo dynamique */}
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-white/15 shadow-lg bg-zinc-900">
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
                  background: `radial-gradient(circle at 30% 30%, ${dominantColor}, #18181b)`,
                }}
              >
                <Music className="w-8 h-8 text-white/80" />
              </div>
            )}
          </div>

          {/* Titre, Artiste, Album & Visualizer */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-white truncate leading-tight">
                {media?.title}
              </h3>
              {/* Égaliseur animé */}
              <div className="flex items-end gap-[2.5px] h-3.5 flex-shrink-0">
                {[0, 1, 2, 3].map((bar) => (
                  <span
                    key={bar}
                    className="w-[3px] rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: isNothing
                        ? '#D71920'
                        : isCyberpunk
                        ? '#FCEE0A'
                        : dominantColor,
                      height: isPlaying ? `${[75, 100, 55, 90][bar]}%` : '25%',
                      animation: isPlaying
                        ? `pulse ${0.6 + bar * 0.15}s ease-in-out infinite alternate`
                        : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            <p className="text-xs font-semibold text-zinc-300 truncate mt-0.5">
              {media?.artist || 'Artiste inconnu'}
            </p>
            {media?.albumTitle && (
              <p className="text-[10px] text-zinc-500 truncate mt-0.5">{media.albumTitle}</p>
            )}
          </div>
        </div>
      )}

      {/* Barre de progression + Contrôles Multimédia */}
      <div className="space-y-1.5">
        {durationMs > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-zinc-400 w-7 text-right">
              {formatMs(localPosMs)}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: isNothing
                    ? '#D71920'
                    : isCyberpunk
                    ? '#FCEE0A'
                    : dominantColor,
                }}
              />
            </div>
            <span className="text-[9px] font-mono text-zinc-400 w-7">
              {formatMs(durationMs)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-center gap-5 pt-0.5">
          <button
            type="button"
            onClick={() => onControl('previous')}
            className="p-1.5 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-all active:scale-90 cursor-pointer"
            title="Titre précédent"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            type="button"
            onClick={() => onControl('toggle')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-black bg-white hover:bg-zinc-200 transition-all active:scale-95 shadow-md cursor-pointer"
            title={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 ml-0.5 fill-current" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onControl('next')}
            className="p-1.5 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-all active:scale-90 cursor-pointer"
            title="Titre suivant"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
