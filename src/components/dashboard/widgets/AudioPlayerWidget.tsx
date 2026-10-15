'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  Link as LinkIcon,
  Sparkles,
  Radio,
  Check,
} from 'lucide-react';

type MusicService = 'spotify' | 'deezer' | 'youtube' | 'zen';

interface PresetItem {
  id: string;
  title: string;
  subtitle: string;
  urlOrId: string;
}

const SPOTIFY_PRESETS: PresetItem[] = [
  {
    id: 'sp-1',
    title: 'Lofi Beats',
    subtitle: 'Beats to relax/study to',
    urlOrId: '37i9dQZF1DXcBWIGoYBM5M',
  },
  {
    id: 'sp-2',
    title: 'Deep Focus',
    subtitle: 'Ambient & study flow',
    urlOrId: '37i9dQZF1DWZeKCadgRdKQ',
  },
  {
    id: 'sp-3',
    title: 'Peaceful Piano',
    subtitle: 'Concentration acoustique',
    urlOrId: '37i9dQZF1DX4sWSpwq3LiO',
  },
];

const DEEZER_PRESETS: PresetItem[] = [
  {
    id: 'dz-1',
    title: 'Flow Focus',
    subtitle: 'Concentration & Flow',
    urlOrId: '1306931615',
  },
  {
    id: 'dz-2',
    title: 'Lo-Fi Chill',
    subtitle: 'Vibes douces et reposantes',
    urlOrId: '53362031',
  },
  {
    id: 'dz-3',
    title: 'Electronic Focus',
    subtitle: 'Deep ambient minimal',
    urlOrId: '10287042882',
  },
];

const YOUTUBE_PRESETS: PresetItem[] = [
  {
    id: 'yt-1',
    title: 'Lofi Girl Live',
    subtitle: 'Beats to relax/study to',
    urlOrId: 'jfKfPfyJRdk',
  },
  {
    id: 'yt-2',
    title: 'Synthwave Radio',
    subtitle: 'Chill synth / retro beats',
    urlOrId: '4xDzrJKXOOY',
  },
  {
    id: 'yt-3',
    title: 'Coffee Shop Ambience',
    subtitle: 'Pluie douce & acoustique',
    urlOrId: 'lP26UCnoH9s',
  },
];

export const AudioPlayerWidget: React.FC = () => {
  // Service actif
  const [activeService, setActiveService] = useState<MusicService>('spotify');

  // Sélections actives par service
  const [selectedSpotify, setSelectedSpotify] = useState(SPOTIFY_PRESETS[0].urlOrId);
  const [selectedDeezer, setSelectedDeezer] = useState(DEEZER_PRESETS[0].urlOrId);
  const [selectedYoutube, setSelectedYoutube] = useState(YOUTUBE_PRESETS[0].urlOrId);

  // Inputs personnalisés
  const [customInput, setCustomInput] = useState('');
  const [isInputOpen, setIsInputOpen] = useState(false);

  // État pour Zen Lo-Fi
  const [isZenPlaying, setIsZenPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Chargement des préférences enregistrées
  useEffect(() => {
    try {
      const savedService = localStorage.getItem('syntropy_music_service') as MusicService;
      if (savedService) setActiveService(savedService);

      const savedSp = localStorage.getItem('syntropy_music_spotify');
      if (savedSp) setSelectedSpotify(savedSp);

      const savedDz = localStorage.getItem('syntropy_music_deezer');
      if (savedDz) setSelectedDeezer(savedDz);

      const savedYt = localStorage.getItem('syntropy_music_youtube');
      if (savedYt) setSelectedYoutube(savedYt);
    } catch {}
  }, []);

  const handleSelectService = (srv: MusicService) => {
    setActiveService(srv);
    localStorage.setItem('syntropy_music_service', srv);
    setIsInputOpen(false);
    setCustomInput('');
  };

  // Convertisseur pour liens Spotify personnalisés
  const spotifyEmbedUrl = useMemo(() => {
    let idOrPath = selectedSpotify;
    if (idOrPath.includes('spotify.com/')) {
      const match = idOrPath.match(/(playlist|album|track|artist)\/([a-zA-Z0-9]+)/);
      if (match) {
        return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
      }
    }
    return `https://open.spotify.com/embed/playlist/${idOrPath}?utm_source=generator&theme=0`;
  }, [selectedSpotify]);

  // Convertisseur pour liens Deezer personnalisés
  const deezerEmbedUrl = useMemo(() => {
    let idOrPath = selectedDeezer;
    if (idOrPath.includes('deezer.com/')) {
      const match = idOrPath.match(/(playlist|album|track)\/([0-9]+)/);
      if (match) {
        return `https://widget.deezer.com/widget/dark/${match[1]}/${match[2]}?app_id=457142&autoplay=false&radius=true&tracklist=true`;
      }
    }
    return `https://widget.deezer.com/widget/dark/playlist/${idOrPath}?app_id=457142&autoplay=false&radius=true&tracklist=true`;
  }, [selectedDeezer]);

  // Convertisseur pour liens YouTube personnalisés
  const youtubeEmbedUrl = useMemo(() => {
    let idOrPath = selectedYoutube;
    if (idOrPath.includes('youtube.com/watch?v=')) {
      const vMatch = idOrPath.match(/v=([a-zA-Z0-9_-]+)/);
      if (vMatch) idOrPath = vMatch[1];
    } else if (idOrPath.includes('youtu.be/')) {
      const bMatch = idOrPath.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (bMatch) idOrPath = bMatch[1];
    }
    return `https://www.youtube.com/embed/${idOrPath}?autoplay=0&enablejsapi=1`;
  }, [selectedYoutube]);

  // Soumission d'un lien personnalisé
  const handleApplyCustomLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const clean = customInput.trim();

    if (activeService === 'spotify') {
      setSelectedSpotify(clean);
      localStorage.setItem('syntropy_music_spotify', clean);
    } else if (activeService === 'deezer') {
      setSelectedDeezer(clean);
      localStorage.setItem('syntropy_music_deezer', clean);
    } else if (activeService === 'youtube') {
      setSelectedYoutube(clean);
      localStorage.setItem('syntropy_music_youtube', clean);
    }

    setCustomInput('');
    setIsInputOpen(false);
  };

  // Moteur audio Lo-Fi Zen (Web Audio binaural synth)
  const startZen = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(isMuted ? 0 : volume * 0.12, ctx.currentTime);
      gain.connect(ctx.destination);
      gainNodeRef.current = gain;

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(136.1, ctx.currentTime); // Om tone
      osc1.connect(gain);
      osc1.start();
      osc1Ref.current = osc1;

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(140.1, ctx.currentTime); // 4Hz Theta beat
      osc2.connect(gain);
      osc2.start();
      osc2Ref.current = osc2;

      setIsZenPlaying(true);
    } catch (e) {
      console.warn('AudioContext error', e);
    }
  };

  const stopZen = () => {
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
    } catch {}
    setIsZenPlaying(false);
  };

  const toggleZen = () => {
    if (isZenPlaying) {
      stopZen();
    } else {
      startZen();
    }
  };

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(
        isMuted ? 0 : volume * 0.12,
        audioCtxRef.current.currentTime
      );
    }
  }, [volume, isMuted]);

  useEffect(() => {
    return () => {
      stopZen();
    };
  }, []);

  return (
    <div className="flex flex-col h-full justify-between p-3 select-none">
      {/* 1. En-tête : Titre et Sélecteur de Services */}
      <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5 truncate">
          <Music className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
          <span className="font-bold text-zinc-800 dark:text-zinc-200">Lecteur Audio</span>
        </span>

        {/* Boutons d'onglets de services */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => handleSelectService('spotify')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
              activeService === 'spotify'
                ? 'bg-emerald-500 text-black shadow-sm shadow-emerald-500/30'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
            title="Spotify"
          >
            Spotify
          </button>
          <button
            type="button"
            onClick={() => handleSelectService('deezer')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
              activeService === 'deezer'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
            title="Deezer"
          >
            Deezer
          </button>
          <button
            type="button"
            onClick={() => handleSelectService('youtube')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
              activeService === 'youtube'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
            title="YouTube Music"
          >
            YT Music
          </button>
          <button
            type="button"
            onClick={() => handleSelectService('zen')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
              activeService === 'zen'
                ? 'bg-amber-500 text-black shadow-sm shadow-amber-500/30'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
            title="Générateur Lo-Fi Zen (Ondes cérébrales)"
          >
            Zen
          </button>
        </div>
      </div>

      {/* 2. Contenu selon le service actif */}
      <div className="flex-1 my-1.5 flex flex-col justify-center min-h-[105px] overflow-hidden rounded-xl bg-zinc-50/90 dark:bg-zinc-950/40 border border-zinc-200/90 dark:border-zinc-800/80 relative">
        {/* CAS 1 : SPOTIFY */}
        {activeService === 'spotify' && (
          <div className="w-full h-full flex flex-col justify-between p-1">
            <iframe
              src={spotifyEmbedUrl}
              width="100%"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-lg shadow-sm"
              title="Spotify Player"
            />
            {/* Presets rapides Spotify */}
            <div className="flex items-center justify-between px-1 pt-1 gap-1">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                {SPOTIFY_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedSpotify(p.urlOrId);
                      localStorage.setItem('syntropy_music_spotify', p.urlOrId);
                    }}
                    className={`text-[9px] px-1.5 py-0.5 rounded font-medium truncate cursor-pointer transition-colors ${
                      selectedSpotify === p.urlOrId
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIsInputOpen(!isInputOpen)}
                className="text-[9px] text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 flex items-center gap-0.5 cursor-pointer flex-shrink-0"
                title="Coller votre lien Spotify"
              >
                <LinkIcon className="w-2.5 h-2.5" />
                <span>Lien</span>
              </button>
            </div>
          </div>
        )}

        {/* CAS 2 : DEEZER */}
        {activeService === 'deezer' && (
          <div className="w-full h-full flex flex-col justify-between p-1">
            <iframe
              src={deezerEmbedUrl}
              width="100%"
              height="80"
              frameBorder="0"
              allow="encrypted-media; clipboard-write"
              loading="lazy"
              className="rounded-lg shadow-sm"
              title="Deezer Player"
            />
            {/* Presets rapides Deezer */}
            <div className="flex items-center justify-between px-1 pt-1 gap-1">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                {DEEZER_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedDeezer(p.urlOrId);
                      localStorage.setItem('syntropy_music_deezer', p.urlOrId);
                    }}
                    className={`text-[9px] px-1.5 py-0.5 rounded font-medium truncate cursor-pointer transition-colors ${
                      selectedDeezer === p.urlOrId
                        ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/40'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIsInputOpen(!isInputOpen)}
                className="text-[9px] text-zinc-500 hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-400 flex items-center gap-0.5 cursor-pointer flex-shrink-0"
                title="Coller votre lien Deezer"
              >
                <LinkIcon className="w-2.5 h-2.5" />
                <span>Lien</span>
              </button>
            </div>
          </div>
        )}

        {/* CAS 3 : YOUTUBE MUSIC */}
        {activeService === 'youtube' && (
          <div className="w-full h-full flex flex-col justify-between p-1">
            <div className="w-full h-[76px] rounded-lg overflow-hidden bg-black flex items-center justify-center">
              <iframe
                src={youtubeEmbedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                loading="lazy"
                title="YouTube Player"
              />
            </div>
            {/* Presets rapides YouTube */}
            <div className="flex items-center justify-between px-1 pt-1 gap-1">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                {YOUTUBE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedYoutube(p.urlOrId);
                      localStorage.setItem('syntropy_music_youtube', p.urlOrId);
                    }}
                    className={`text-[9px] px-1.5 py-0.5 rounded font-medium truncate cursor-pointer transition-colors ${
                      selectedYoutube === p.urlOrId
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIsInputOpen(!isInputOpen)}
                className="text-[9px] text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 flex items-center gap-0.5 cursor-pointer flex-shrink-0"
                title="Coller une vidéo / stream YouTube"
              >
                <LinkIcon className="w-2.5 h-2.5" />
                <span>Lien</span>
              </button>
            </div>
          </div>
        )}

        {/* CAS 4 : ZEN LO-FI BINAURAL */}
        {activeService === 'zen' && (
          <div className="w-full h-full p-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={toggleZen}
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 active:scale-95 transition-transform cursor-pointer flex-shrink-0"
              >
                {isZenPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1 truncate">
                  <span>Ondes Theta 136Hz</span>
                  {isZenPlaying && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
                  )}
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                  Générateur binaural sans pub
                </div>
              </div>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-16 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        )}

        {/* Champ popover pour coller un lien personnalisé */}
        {isInputOpen && activeService !== 'zen' && (
          <form
            onSubmit={handleApplyCustomLink}
            className="absolute inset-x-1 bottom-1 p-2 rounded-lg bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-700 shadow-xl flex items-center gap-1.5 z-10 animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder={`Lien ${activeService === 'spotify' ? 'Spotify' : activeService === 'deezer' ? 'Deezer' : 'YouTube'}...`}
              className="flex-1 px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-purple-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => setIsInputOpen(false)}
              className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 text-xs px-1"
            >
              ✕
            </button>
          </form>
        )}
      </div>

      {/* 3. Pied : Badge statut & indicateur */}
      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5 border-t border-zinc-200 dark:border-zinc-800/60 font-mono">
        <span className="capitalize">
          Source : <strong className="text-zinc-700 dark:text-zinc-300">{activeService}</strong>
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
          <span>Multiservice V2</span>
        </span>
      </div>
    </div>
  );
};

export default AudioPlayerWidget;
