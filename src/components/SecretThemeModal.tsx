'use client';

import React, { useEffect } from 'react';
import {
  Sparkles,
  X,
  Check,
  Terminal,
  Layers,
  Cpu,
  PlusCircle,
  Flame,
  Zap,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

/**
 * Son rétro 8-bit de déverrouillage d'arcade (Web Audio API natif, 0 fichier externe)
 */
export function playSecretUnlockSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const notes = [440, 554.37, 659.25, 880]; // A4 -> C#5 -> E5 -> A5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.24);
    });
  } catch (_) {}
}

export interface SecretThemeItem {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  badge: string;
  badgeColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  isCurrent: (settings: any) => boolean;
  onSelect: (updateFn: (partial: any) => void) => void;
  previewElement: React.ReactNode;
}

interface SecretThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotification?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const SecretThemeModal: React.FC<SecretThemeModalProps> = ({
  isOpen,
  onClose,
  onNotification,
}) => {
  const { settings, updateMultipleSettings } = useSettings();

  // Écoute de la touche Échap pour fermer la modale
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCyberpunkCurrent = settings.uiStyle === 'cyberpunk';
  const isNothingCurrent = (settings.uiStyle === 'nothing' || settings.darkBgStyle === 'oled') && !isCyberpunkCurrent;
  const isClassiqueCurrent = !isNothingCurrent && !isCyberpunkCurrent;

  /**
   * REGISTRE DES THÈMES SECRETS
   * Modulaire : Vous pouvez rajouter d'autres thèmes dans cette liste à tout moment !
   */
  const THEMES_LIST: SecretThemeItem[] = [
    {
      id: 'syntropy',
      name: 'Syntropy Classique',
      subtitle: 'Liquid Glass & Design System Originel',
      description:
        'Surfaces translucides inspirées d\'iOS avec flou d\'arrière-plan (backdrop blur), halos d\'aurore boréale subtils et personnalisation complète de la palette de couleurs d\'accent.',
      badge: 'Officiel',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
      borderColor: 'hover:border-purple-500/50',
      icon: Layers,
      isCurrent: () => isClassiqueCurrent,
      onSelect: (update) => {
        update({
          uiStyle: 'syntropy',
          darkBgStyle: 'zinc',
          accentColor: settings.previousAccentColor || 'purple',
        });
        onNotification?.('Thème Classique (Liquid Glass) réactivé !', 'success');
      },
      previewElement: (
        <div className="w-full h-20 rounded-xl bg-gradient-to-br from-zinc-900/90 to-zinc-950 p-3 flex flex-col justify-between border border-white/10 shadow-inner relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-16 h-16 bg-purple-500/30 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-zinc-400">Surface Verre</span>
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          </div>
          <div className="flex gap-1.5">
            <div className="h-2 w-12 rounded bg-purple-500/50" />
            <div className="h-2 w-6 rounded bg-indigo-500/30" />
          </div>
        </div>
      ),
    },
    {
      id: 'nothing',
      name: 'Nothing OS Edition',
      subtitle: 'Écosystème Matériel, NDot & Glyph',
      description:
        'Immersion intégrale dans les codes industriels de Nothing : noir absolu OLED (#000000), typographie matricielle NDot 57, accent Rouge vermillon Nothing (#D71920) et interface Glyph dynamique.',
      badge: 'Secret',
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
      borderColor: 'hover:border-red-500/50',
      icon: Cpu,
      isCurrent: () => isNothingCurrent,
      onSelect: (update) => {
        update({
          uiStyle: 'nothing',
          darkBgStyle: 'oled',
          accentColor: 'red',
        });
        onNotification?.('Direction Artistique Nothing OS activée !', 'success');
      },
      previewElement: (
        <div className="w-full h-20 rounded-xl bg-black p-3 flex flex-col justify-between border border-red-500/30 shadow-inner relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-[#D71920]">NOTHING (OS)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D71920]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[14px] font-mono tracking-tighter text-white font-bold leading-none">
              N·DOT 57
            </div>
            <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-[#D71920]" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk HUD',
      subtitle: 'Cyberdeck, Découpes Angulaires & Cascade Matrix',
      description:
        'Esthétique Cyberdeck complète : bordures biseautées, tags techniques (CAL-001, CLK-001...), accents jaune fluo (#FCEE0A) et cyan (#00F0FF), horloge numérique et cascade Matrix discrète en arrière-plan.',
      badge: 'Secret',
      badgeColor: 'bg-yellow-500/20 text-[#FCEE0A] border-yellow-500/40',
      borderColor: 'hover:border-yellow-500/50',
      icon: Zap,
      isCurrent: () => isCyberpunkCurrent,
      onSelect: (update) => {
        update({
          uiStyle: 'cyberpunk',
          darkBgStyle: 'oled',
          theme: 'dark',
          accentColor: 'amber',
        });
        onNotification?.('Direction Artistique Cyberpunk HUD activée !', 'success');
      },
      previewElement: (
        <div className="w-full h-20 rounded-xl bg-[#070a14] p-3 flex flex-col justify-between border border-[#FCEE0A]/50 shadow-inner relative overflow-hidden font-mono">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#00F0FF] font-bold">● SYSTÈME SYNCHRONISÉ</span>
            <span className="text-[#FCEE0A]">CLK-001</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[#00F0FF] text-base font-bold tracking-wider font-mono">09:24:17</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#FCEE0A] text-black font-extrabold uppercase">
              HUD ACTIF
            </span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-zinc-950/95 border border-purple-500/40 rounded-2xl shadow-2xl shadow-purple-500/20 overflow-hidden flex flex-col text-white animate-in zoom-in-95 duration-200 relative"
      >
        {/* Glow cyberpunk d'arrière plan */}
        <div className="absolute top-0 left-1/4 right-1/4 h-24 bg-gradient-to-b from-purple-600/20 to-transparent blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Terminal className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Laboratoire Secret • Thèmes</h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Déverrouillé
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Laboratoire secret déverrouillé. Choisissez votre direction artistique.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {THEMES_LIST.map((th) => {
              const active = th.isCurrent(settings);
              const Icon = th.icon;

              return (
                <div
                  key={th.id}
                  onClick={() => th.onSelect(updateMultipleSettings)}
                  className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left ${
                    active
                      ? 'bg-zinc-900/90 border-purple-500 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/50'
                      : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/70 ' + th.borderColor
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg border ${
                          active
                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                            : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60 group-hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                          {th.name}
                        </h4>
                        <p className="text-[11px] text-zinc-400">{th.subtitle}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${th.badgeColor}`}
                    >
                      {th.badge}
                    </span>
                  </div>

                  {/* Preview Element */}
                  {th.previewElement}

                  {/* Description */}
                  <p className="text-xs text-zinc-400 leading-relaxed">{th.description}</p>

                  {/* Action Button */}
                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">
                      {active ? 'Thème actuellement appliqué' : 'Cliquer pour basculer'}
                    </span>
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                      }`}
                    >
                      {active ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Actif</span>
                        </>
                      ) : (
                        <span>Activer</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Slot d'extension pour les futurs thèmes */}
          <div className="p-4 rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500">
                <PlusCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-zinc-300">Emplacement pour futurs thèmes secrets</p>
                <p className="text-[11px] text-zinc-500">
                  Prêt pour l&apos;ajout de nouvelles directions artistiques (Cyberpunk, Retro Terminal, etc.)
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-zinc-600 uppercase px-2 py-1 rounded bg-zinc-900/60 border border-zinc-800">
              Modulaire
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-zinc-900/60 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-mono text-[11px]">Syntropy OS • Laboratoire Expérimental</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition-colors"
          >
            Fermer (Échap)
          </button>
        </div>
      </div>
    </div>
  );
};
