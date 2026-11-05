'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  ExternalLink,
  Plus,
  Trash2,
  Laptop,
  Sparkles,
  Radio,
  Headphones,
  Check,
  Disc,
  ListMusic,
} from 'lucide-react';
import { AudioPlayerWidgetSettings, WidgetSize } from '@/types/dashboard';

interface PCMediaInfo {
  title?: string;
  artist?: string;
  albumTitle?: string;
  appId?: string;
  status?: string; // 'Playing' | 'Paused' | 'Stopped'
  canPlay?: boolean;
  canPause?: boolean;
  canNext?: boolean;
  canPrevious?: boolean;
  active?: boolean;
}

interface SavedPlaylist {
  id: string;
  title: string;
  service: 'spotify' | 'youtube' | 'deezer';
  urlOrId: string;
}

const DEFAULT_PLAYLISTS: SavedPlaylist[] = [
  { id: 'p-1', title: 'Lofi Beats to Study', service: 'spotify', urlOrId: '37i9dQZF1DXcBWIGoYBM5M' },
  { id: 'p-2', title: 'Deep Focus & Ambient', service: 'spotify', urlOrId: '37i9dQZF1DWZeKCadgRdKQ' },
  { id: 'p-3', title: 'Lofi Girl Live Radio', service: 'youtube', urlOrId: 'jfKfPfyJRdk' },
  { id: 'p-4', title: 'Synthwave Chill Radio', service: 'youtube', urlOrId: '4xDzrJKXOOY' },
  { id: 'p-5', title: 'Flow Concentration', service: 'deezer', urlOrId: '1306931615' },
];

const ZEN_SOUNDS: { id: string; name: string; desc: string; icon: string }[] = [
  { id: 'alpha', name: 'Ondes Alpha (432Hz)', desc: 'Concentration profonde et flow', icon: '🧠' },
  { id: 'rain', name: 'Pluie Douce', desc: 'Gouttes apaisantes sur vitre', icon: '🌧️' },
  { id: 'waves', name: 'Vagues de l’Océan', desc: 'Ressac régulier relaxant', icon: '🌊' },
  { id: 'cafe', name: 'Café & Ambiance', desc: 'Murmures feutrés de brasserie', icon: '☕' },
  { id: 'fire', name: 'Feu de Cheminée', desc: 'Crépitement chaleureux de bûches', icon: '🔥' },
  { id: 'birds', name: 'Forêt & Oiseaux', desc: 'Sérénade naturelle apaisante', icon: '🌲' },
];

interface AudioPlayerWidgetProps {
  size?: WidgetSize;
  settings?: AudioPlayerWidgetSettings;
  onOpenSettings?: () => void;
}

export const AudioPlayerWidget: React.FC<AudioPlayerWidgetProps> = ({
  size = 'small',
  settings,
  onOpenSettings,
}) => {
  // Mode actif : 'pc' (écoute PC), 'stream' (playlists/lecteur intégré), 'zen' (lofi local)
  const [activeMode, setActiveMode] = useState<'pc' | 'stream' | 'zen'>('pc');

  // État de détection multimédia du PC
  const [pcMedia, setPcMedia] = useState<PCMediaInfo | null>(null);
  const [isDesktopAvailable, setIsDesktopAvailable] = useState(false);

  // Playlists sauvegardées
  const [playlists, setPlaylists] = useState<SavedPlaylist[]>(DEFAULT_PLAYLISTS);
  const [activePlaylist, setActivePlaylist] = useState<SavedPlaylist>(DEFAULT_PLAYLISTS[0]);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [newPlaylistUrl, setNewPlaylistUrl] = useState('');
  const [isAddingPlaylist, setIsAddingPlaylist] = useState(false);

  // État Zen Lo-Fi
  const [isZenPlaying, setIsZenPlaying] = useState(false);
  const [activeZenSound, setActiveZenSound] = useState('alpha');
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);

  // Web Audio Context pour le mode Zen
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Détection initiale Desktop et polling SMTC
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const electronAPI = (window as unknown as { electronAPI?: any })?.electronAPI;
    const isDesktop = Boolean(electronAPI?.isDesktop && electronAPI?.getNowPlaying);
    setIsDesktopAvailable(isDesktop);

    if (!isDesktop) {
      setActiveMode('stream');
      return;
    }

    let isSubscribed = true;

    const checkNowPlaying = async () => {
      try {
        const info = await electronAPI.getNowPlaying();
        if (isSubscribed) {
          if (info && info.active) {
            setPcMedia(info);
          } else {
            setPcMedia((prev) => (prev?.active ? { ...prev, active: false } : prev));
          }
        }
      } catch (_) {}
    };

    checkNowPlaying();
    const interval = setInterval(checkNowPlaying, 2500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  // Charger les playlists depuis LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('syntropy_user_playlists');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlaylists(parsed);
          setActivePlaylist(parsed[0]);
        }
      }
    } catch (_) {}
  }, []);

  // Contrôles média Windows (Play, Pause, Suivant, Précédent)
  const handleControlPcMedia = async (action: 'play' | 'pause' | 'toggle' | 'next' | 'previous') => {
    const electronAPI = (window as unknown as { electronAPI?: any })?.electronAPI;
    if (!electronAPI?.controlMedia) return;

    try {
      await electronAPI.controlMedia(action);
      // Actualiser immédiatement après le clic
      setTimeout(async () => {
        const updated = await electronAPI.getNowPlaying();
        if (updated) setPcMedia(updated);
      }, 300);
    } catch (_) {}
  };

  // Gestion du générateur audio Zen
  const stopZenAudio = () => {
    try {
      if (osc1Ref.current) {
        osc1Ref.current.stop();
        osc1Ref.current.disconnect();
        osc1Ref.current = null;
      }
      if (osc2Ref.current) {
        osc2Ref.current.stop();
        osc2Ref.current.disconnect();
        osc2Ref.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch (_) {}
    setIsZenPlaying(false);
  };

  const startZenAudio = (soundId: string) => {
    stopZenAudio();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(isMuted ? 0 : volume * 0.15, ctx.currentTime);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      if (soundId === 'alpha') {
        // Battements binauraux 432Hz / ondes alpha 10Hz
        const oscLeft = ctx.createOscillator();
        const oscRight = ctx.createOscillator();
        oscLeft.type = 'sine';
        oscRight.type = 'sine';
        oscLeft.frequency.setValueAtTime(432, ctx.currentTime);
        oscRight.frequency.setValueAtTime(442, ctx.currentTime); // 10Hz diff
        oscLeft.connect(masterGain);
        oscRight.connect(masterGain);
        oscLeft.start();
        oscRight.start();
        osc1Ref.current = oscLeft;
        osc2Ref.current = oscRight;
      } else {
        // Synthèse bruit blanc/rose pour pluie/vagues/feu
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02; // bruit rose/marron apaisant
          lastOut = output[i];
          output[i] *= 3.5;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = soundId === 'fire' ? 'bandpass' : 'lowpass';
        filter.frequency.setValueAtTime(soundId === 'rain' ? 800 : soundId === 'waves' ? 400 : 1200, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();
      }

      setIsZenPlaying(true);
    } catch (_) {}
  };

  const toggleZen = () => {
    if (isZenPlaying) {
      stopZenAudio();
    } else {
      startZenAudio(activeZenSound);
    }
  };

  useEffect(() => {
    return () => stopZenAudio();
  }, []);

  // Formattage du lecteur intégré (Embed iframe)
  const embedUrl = useMemo(() => {
    const { service, urlOrId } = activePlaylist;
    if (service === 'spotify') {
      let clean = urlOrId;
      const match = clean.match(/(playlist|album|track|artist)\/([a-zA-Z0-9]+)/);
      if (match) return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
      return `https://open.spotify.com/embed/playlist/${clean}?utm_source=generator&theme=0`;
    }
    if (service === 'youtube') {
      let clean = urlOrId;
      if (clean.includes('v=')) clean = clean.split('v=')[1]?.split('&')[0] || clean;
      else if (clean.includes('youtu.be/')) clean = clean.split('youtu.be/')[1]?.split('?')[0] || clean;
      return `https://www.youtube.com/embed/${clean}?autoplay=0&enablejsapi=1`;
    }
    if (service === 'deezer') {
      let clean = urlOrId;
      const match = clean.match(/(playlist|album|track)\/([0-9]+)/);
      if (match) return `https://widget.deezer.com/widget/dark/${match[1]}/${match[2]}?app_id=457142&autoplay=false&radius=true&tracklist=true`;
      return `https://widget.deezer.com/widget/dark/playlist/${clean}?app_id=457142&autoplay=false&radius=true&tracklist=true`;
    }
    return '';
  }, [activePlaylist]);

  // Ajouter une nouvelle playlist utilisateur
  const handleAddPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim() || !newPlaylistUrl.trim()) return;

    let service: 'spotify' | 'youtube' | 'deezer' = 'spotify';
    if (newPlaylistUrl.includes('youtube.com') || newPlaylistUrl.includes('youtu.be')) service = 'youtube';
    else if (newPlaylistUrl.includes('deezer.com')) service = 'deezer';

    const newP: SavedPlaylist = {
      id: `p-${Date.now()}`,
      title: newPlaylistTitle.trim(),
      service,
      urlOrId: newPlaylistUrl.trim(),
    };

    const updated = [newP, ...playlists];
    setPlaylists(updated);
    setActivePlaylist(newP);
    setNewPlaylistTitle('');
    setNewPlaylistUrl('');
    setIsAddingPlaylist(false);
    try {
      localStorage.setItem('syntropy_user_playlists', JSON.stringify(updated));
    } catch (_) {}
  };

  const handleDeletePlaylist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = playlists.filter((p) => p.id !== id);
    setPlaylists(updated);
    if (activePlaylist.id === id && updated.length > 0) setActivePlaylist(updated[0]);
    try {
      localStorage.setItem('syntropy_user_playlists', JSON.stringify(updated));
    } catch (_) {}
  };

  // Déterminer le nom lisible de l'application PC active
  const pcAppName = useMemo(() => {
    if (!pcMedia?.appId) return 'Lecteur PC';
    const app = pcMedia.appId.toLowerCase();
    if (app.includes('spotify')) return 'Spotify Desktop';
    if (app.includes('music.youtube')) return 'YouTube Music';
    if (app.includes('chrome')) return 'Google Chrome';
    if (app.includes('edge')) return 'Microsoft Edge';
    if (app.includes('vlc')) return 'VLC Media Player';
    if (app.includes('deezer')) return 'Deezer';
    if (app.includes('apple')) return 'Apple Music';
    return pcMedia.appId.split('!')[0] || 'Lecteur Multimédia';
  }, [pcMedia?.appId]);

  const isPcPlaying = pcMedia?.status === 'Playing';

  // =========================================================================
  // 1. AFFICHAGE SMALL (1x1) : Mini-Lecteur Épuré
  // =========================================================================
  if (size === 'small') {
    return (
      <div className="flex flex-col h-full justify-between p-3 select-none">
        {/* Header */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-purple-500" />
            <span className="truncate">{pcMedia?.active ? pcAppName : 'Musique & Ambiance'}</span>
          </span>
          {pcMedia?.active && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Application active sur le PC" />
          )}
        </div>

        {/* Contenu Principal */}
        {pcMedia?.active ? (
          <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-col justify-between my-auto">
            <div className="min-w-0">
              <span className="text-[9px] uppercase tracking-wider font-bold text-purple-400 block truncate">
                {pcAppName}
              </span>
              <h4 className="text-xs font-bold text-zinc-100 truncate mt-0.5">
                {pcMedia.title || 'Piste en lecture'}
              </h4>
              <p className="text-[10px] text-zinc-400 truncate">
                {pcMedia.artist || 'Artiste inconnu'}
              </p>
            </div>

            {/* Barre de contrôle direct */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-purple-500/20">
              <button
                onClick={() => handleControlPcMedia('previous')}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Piste précédente"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleControlPcMedia(isPcPlaying ? 'pause' : 'play')}
                className="w-7 h-7 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-600/30 cursor-pointer transition-transform active:scale-95"
                title={isPcPlaying ? 'Mettre en pause' : 'Lancer la lecture'}
              >
                {isPcPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              </button>

              <button
                onClick={() => handleControlPcMedia('next')}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Piste suivante"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between my-auto">
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-purple-500 block">
                {activeMode === 'zen' ? 'Générateur Lo-Fi' : activePlaylist.service.toUpperCase()}
              </span>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                {activeMode === 'zen' ? 'Ondes Alpha 432Hz' : activePlaylist.title}
              </h4>
            </div>

            <button
              onClick={() => {
                if (activeMode === 'zen') toggleZen();
                else window.open(activePlaylist.urlOrId.startsWith('http') ? activePlaylist.urlOrId : `https://open.spotify.com/playlist/${activePlaylist.urlOrId}`, '_blank');
              }}
              className="mt-2.5 w-full py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            >
              {isZenPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isZenPlaying ? 'Arrêter' : 'Lancer le son'}</span>
            </button>
          </div>
        )}

        {/* Footer métrique */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono px-0.5">
          <span>{isDesktopAvailable ? 'Synchro PC Active' : 'Mode Web'}</span>
          <span>{pcMedia?.status || (isZenPlaying ? 'En écoute' : 'En veille')}</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. AFFICHAGE MEDIUM (2x1) : Barre Multimédia Complète & Sélecteur
  // =========================================================================
  if (size === 'medium') {
    return (
      <div className="flex flex-col h-full justify-between p-3.5 select-none space-y-2">
        {/* Header avec Onglets de Mode */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Music className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-bold">Lecteur & Playlists</span>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            {isDesktopAvailable && (
              <button
                onClick={() => setActiveMode('pc')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                  activeMode === 'pc'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Laptop className="w-3 h-3" />
                <span>PC {pcMedia?.active && '●'}</span>
              </button>
            )}
            <button
              onClick={() => setActiveMode('stream')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                activeMode === 'stream'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ListMusic className="w-3 h-3" />
              <span>Playlists</span>
            </button>
            <button
              onClick={() => setActiveMode('zen')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                activeMode === 'zen'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Headphones className="w-3 h-3" />
              <span>Zen</span>
            </button>
          </div>
        </div>

        {/* Corps selon le mode actif */}
        {activeMode === 'pc' && (
          <div className="flex-1 flex flex-col justify-between p-3 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
            {pcMedia?.active ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 block">
                      En direct de {pcAppName}
                    </span>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {pcMedia.title || 'Titre en cours'}
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {pcMedia.artist || 'Artiste'}
                    </p>
                  </div>

                  {/* Boutons de contrôle média */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleControlPcMedia('previous')}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleControlPcMedia(isPcPlaying ? 'pause' : 'play')}
                      className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-600/30 cursor-pointer"
                    >
                      {isPcPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <button
                      onClick={() => handleControlPcMedia('next')}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Animation Soundwaves */}
                <div className="flex items-center gap-1 pt-2">
                  <span className="text-[10px] text-zinc-400 font-mono">{pcMedia.status}</span>
                  <div className="flex items-end gap-0.5 ml-auto h-3">
                    {[0.8, 1.4, 0.6, 1.8, 1.1, 0.4].map((h, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-full bg-purple-500 transition-all ${isPcPlaying ? 'animate-pulse' : 'opacity-40'}`}
                        style={{ height: `${h * (isPcPlaying ? 10 : 3)}px` }}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-2 space-y-1">
                <Laptop className="w-5 h-5 text-zinc-500 mx-auto" />
                <p className="text-xs text-zinc-400">Aucune application audio détectée sur le PC</p>
                <span className="text-[10px] text-zinc-500 block">Lancez Spotify, YouTube ou Deezer sur Windows</span>
              </div>
            )}
          </div>
        )}

        {activeMode === 'stream' && (
          <div className="flex-1 flex flex-col justify-between p-3 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 block">
                  {activePlaylist.service.toUpperCase()}
                </span>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {activePlaylist.title}
                </h4>
              </div>

              <select
                value={activePlaylist.id}
                onChange={(e) => {
                  const target = playlists.find((p) => p.id === e.target.value);
                  if (target) setActivePlaylist(target);
                }}
                className="px-2 py-1 rounded-xl text-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 max-w-[130px] truncate"
              >
                {playlists.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-800/80">
              <a
                href={activePlaylist.urlOrId.startsWith('http') ? activePlaylist.urlOrId : `https://open.spotify.com/playlist/${activePlaylist.urlOrId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-semibold text-purple-500 hover:text-purple-400 transition-colors"
              >
                <span>Ouvrir sur {activePlaylist.service}</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <span className="text-[10px] text-zinc-500 font-mono">
                {playlists.length} playlists
              </span>
            </div>
          </div>
        )}

        {activeMode === 'zen' && (
          <div className="flex-1 flex flex-col justify-between p-3 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 block">Ambiance Focus</span>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {ZEN_SOUNDS.find((s) => s.id === activeZenSound)?.name}
                </h4>
              </div>

              <button
                onClick={toggleZen}
                className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isZenPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isZenPlaying ? 'Stop' : 'Lancer'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1 pt-1.5">
              {ZEN_SOUNDS.slice(0, 3).map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveZenSound(s.id);
                    if (isZenPlaying) startZenAudio(s.id);
                  }}
                  className={`p-1 rounded-lg text-[10px] font-semibold truncate transition-colors cursor-pointer ${
                    activeZenSound === s.id
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {s.icon} {s.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 3. AFFICHAGE LARGE & FULL (2x2 ou 4x1) : Studio Audio Complet
  // =========================================================================
  return (
    <div className="flex flex-col h-full p-4 select-none space-y-3">
      {/* Header avec Statut PC & Onglets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <span>Studio Audio & Musique</span>
              {pcMedia?.active && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                  <Disc className="w-2.5 h-2.5 animate-spin" /> {pcAppName} connecté
                </span>
              )}
            </h3>
            <p className="text-[11px] text-zinc-400">
              Contrôlez vos applications Windows, connectez vos playlists ou activez les ondes de concentration.
            </p>
          </div>
        </div>

        {/* Bouton Ajouter Playlist */}
        <button
          onClick={() => setIsAddingPlaylist(!isAddingPlaylist)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Connecter une playlist</span>
        </button>
      </div>

      {/* Formulaire d'ajout rapide si ouvert */}
      {isAddingPlaylist && (
        <form onSubmit={handleAddPlaylist} className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-purple-500/30 space-y-2 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={newPlaylistTitle}
              onChange={(e) => setNewPlaylistTitle(e.target.value)}
              placeholder="Nom de votre playlist (ex: Synthwave Focus)"
              className="px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
              required
            />
            <input
              type="text"
              value={newPlaylistUrl}
              onChange={(e) => setNewPlaylistUrl(e.target.value)}
              placeholder="Lien Spotify, YouTube ou Deezer"
              className="px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingPlaylist(false)}
              className="px-3 py-1 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded-xl text-xs font-semibold bg-purple-600 text-white cursor-pointer shadow-xs"
            >
              Sauvegarder dans Syntropy
            </button>
          </div>
        </form>
      )}

      {/* Bannière Détection PC Windows si active */}
      {pcMedia?.active && (
        <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
                En lecture sur votre PC • {pcAppName}
              </span>
              <h4 className="text-xs font-bold text-zinc-100 truncate">
                {pcMedia.title || 'Piste en cours'}
              </h4>
              <p className="text-[11px] text-zinc-400 truncate">
                {pcMedia.artist || 'Artiste'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => handleControlPcMedia('previous')}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleControlPcMedia(isPcPlaying ? 'pause' : 'play')}
              className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 cursor-pointer transition-transform active:scale-95"
            >
              {isPcPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button
              onClick={() => handleControlPcMedia('next')}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Grille Playlists + Sons d'ambiance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0">
        {/* Colonne 1 : Mes Playlists Connectées */}
        <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <ListMusic className="w-3.5 h-3.5 text-purple-500" />
              <span>Vos Playlists</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">{playlists.length} connectées</span>
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-[170px] pr-1 scrollbar-thin">
            {playlists.map((p) => {
              const isSelected = activePlaylist.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setActivePlaylist(p)}
                  className={`p-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/15 text-purple-300 font-bold'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md font-mono uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {p.service}
                    </span>
                    <span className="text-xs truncate">{p.title}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <a
                      href={p.urlOrId.startsWith('http') ? p.urlOrId : `https://open.spotify.com/playlist/${p.urlOrId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-purple-400"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {playlists.length > 1 && (
                      <button
                        onClick={(e) => handleDeletePlaylist(p.id, e)}
                        className="p-1 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lecteur iframe miniature */}
          {embedUrl && (
            <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <iframe
                src={embedUrl}
                width="100%"
                height="80"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-xl shadow-xs"
              />
            </div>
          )}
        </div>

        {/* Colonne 2 : Générateur Zen & Ondes Cérébrales */}
        <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-cyan-400" />
              <span>Générateur d'Ambiance Lo-Fi</span>
            </span>
            <button
              onClick={toggleZen}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                isZenPlaying ? 'bg-rose-600 text-white' : 'bg-purple-600 text-white'
              }`}
            >
              {isZenPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isZenPlaying ? 'Couper le son' : 'Activer l’ambiance'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 overflow-y-auto max-h-[170px] pr-1">
            {ZEN_SOUNDS.map((s) => {
              const isSelected = activeZenSound === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveZenSound(s.id);
                    if (isZenPlaying) startZenAudio(s.id);
                  }}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/15 text-purple-300 font-bold'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span>{s.icon}</span>
                    {isSelected && <Check className="w-3 h-3 text-purple-400" />}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold block mt-1">{s.name}</span>
                    <span className="text-[9px] text-zinc-500 block leading-tight">{s.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Contrôle du Volume */}
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 mt-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const val = Number(e.target.value);
                setVolume(val);
                setIsMuted(false);
                if (gainNodeRef.current && audioCtxRef.current) {
                  gainNodeRef.current.gain.setValueAtTime(val * 0.15, audioCtxRef.current.currentTime);
                }
              }}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayerWidget;
