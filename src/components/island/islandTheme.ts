import React from 'react';
import { AppSettings } from '@/types';

export interface IslandThemeTokens {
  mode: 'syntropy' | 'nothing' | 'cyberpunk';
  isOled: boolean;
  neonIntensity: 'vibrant' | 'subtle' | 'none';
  accentIntensity: number; // 0..100
  decorOpacity: number; // 0..1 (dot-matrix Nothing / scanlines & brackets Cyberpunk)

  accentHex: string;
  accentSecondaryHex: string;
  accentGradient: string;

  // Couleur de fond opaque (JAMAIS #000000 pur pour éviter le click-through Win32 LWA_COLORKEY)
  surfaceBg: string;
  surfaceGradient: string;
  earFill: string;
  boxShadow: string;

  activeTabStyle: React.CSSProperties;
  activeTabTextClass: string;
  primaryBtnStyle: React.CSSProperties;
  primaryBtnTextClass: string;
  progressFillStyle: React.CSSProperties;
  subtleActiveStyle: React.CSSProperties;

  clockFontClass: string;
  clockStyle: React.CSSProperties;
  bodyFontClass: string;

  statusDotColor: string;
  statusDotShadow: string;
}

interface AccentPaletteDef {
  hex: string;
  secondaryHex: string;
  rgb: string;
  tintedNotchBg: string;
  tintedPillBg: string;
  gradient?: string;
  darkTextOnAccent?: boolean;
}

const SYNTROPY_ACCENTS: Record<string, AccentPaletteDef> = {
  purple: {
    hex: '#8b5cf6',
    secondaryHex: '#a855f7',
    rgb: '139, 92, 246',
    tintedNotchBg: '#100a20',
    tintedPillBg: '#140c28',
    darkTextOnAccent: false,
  },
  aether: {
    hex: '#6366f1',
    secondaryHex: '#3b82f6',
    rgb: '99, 102, 241',
    tintedNotchBg: '#0a1024',
    tintedPillBg: '#0d142e',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
    darkTextOnAccent: false,
  },
  mix: {
    hex: '#8b5cf6',
    secondaryHex: '#06b6d4',
    rgb: '139, 92, 246',
    tintedNotchBg: '#0b1020',
    tintedPillBg: '#0e1528',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 50%, #10b981 100%)',
    darkTextOnAccent: false,
  },
  cyan: {
    hex: '#06b6d4',
    secondaryHex: '#22d3ee',
    rgb: '6, 182, 212',
    tintedNotchBg: '#08171f',
    tintedPillBg: '#0a1d27',
    darkTextOnAccent: true,
  },
  emerald: {
    hex: '#10b981',
    secondaryHex: '#34d399',
    rgb: '16, 185, 129',
    tintedNotchBg: '#081914',
    tintedPillBg: '#0a2019',
    darkTextOnAccent: true,
  },
  amber: {
    hex: '#f59e0b',
    secondaryHex: '#fbbf24',
    rgb: '245, 158, 11',
    tintedNotchBg: '#191208',
    tintedPillBg: '#20170a',
    darkTextOnAccent: true,
  },
  red: {
    hex: '#e03148',
    secondaryHex: '#f87171',
    rgb: '224, 49, 72',
    tintedNotchBg: '#19090e',
    tintedPillBg: '#200b12',
    darkTextOnAccent: false,
  },
  rose: {
    hex: '#e03148',
    secondaryHex: '#f87171',
    rgb: '224, 49, 72',
    tintedNotchBg: '#19090e',
    tintedPillBg: '#200b12',
    darkTextOnAccent: false,
  },
  monochrome: {
    hex: '#f4f4f5',
    secondaryHex: '#a1a1aa',
    rgb: '244, 244, 245',
    tintedNotchBg: '#0e0e12',
    tintedPillBg: '#121217',
    darkTextOnAccent: true,
  },
};

function parseHexRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return [10, 10, 14];
  return [
    parseInt(clean.slice(0, 2), 16) || 8,
    parseInt(clean.slice(2, 4), 16) || 8,
    parseInt(clean.slice(4, 6), 16) || 11,
  ];
}

/**
 * Interpolation linéaire entre deux couleurs hex avec plancher RGB >= 8
 * afin d'interdire mathématiquement le #000000 pur (Win32 LWA_COLORKEY).
 */
function mixSafeBgHex(hexA: string, hexB: string, ratio: number): string {
  const k = Math.max(0, Math.min(1, ratio));
  const [r1, g1, b1] = parseHexRgb(hexA);
  const [r2, g2, b2] = parseHexRgb(hexB);
  const r = Math.max(8, Math.min(255, Math.round(r1 + (r2 - r1) * k)));
  const g = Math.max(8, Math.min(255, Math.round(g1 + (g2 - g1) * k)));
  const b = Math.max(10, Math.min(255, Math.round(b1 + (b2 - b1) * k)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
    .toString(16)
    .padStart(2, '0')}`;
}

function fmtAlpha(val: number): string {
  return Math.max(0, Math.min(1, val)).toFixed(3);
}

export function getIslandThemeTokens(
  settings: AppSettings,
  isNotch: boolean,
  accentIntensity: number = 70
): IslandThemeTokens {
  const pct = Math.max(
    0,
    Math.min(100, typeof accentIntensity === 'number' && Number.isFinite(accentIntensity) ? Math.round(accentIntensity) : 70)
  );
  const t = pct / 100;
  const isMinimal = pct < 12; // ~0% : Monochrome pur
  const useAccentedPrimaryBtn = pct >= 48; // >= 48% : Boutons principaux colorés (Équilibré / Immersif)

  const uiStyle = settings.uiStyle || 'syntropy';
  const isOled = settings.darkBgStyle === 'oled';
  const neon = settings.neonIntensity || 'vibrant';

  // Progression continue de la teinte de surface (0 de 0..50%, puis montée progressive 50..100%)
  const surfaceTintRatio = pct <= 50 ? 0 : (pct - 50) / 50;
  // Progression continue du reflet interne (0 de 0..30%, puis montée 30..100%)
  const innerGlowRatio = pct <= 30 ? 0 : (pct - 30) / 70;
  // Progression continue du halo externe (0 de 0..55%, puis montée 55..100%)
  const outerHaloRatio = pct <= 55 ? 0 : (pct - 55) / 45;
  // Progression de la bordure colorée (0 à 0%, montée continue jusqu'à 100%)
  const borderAccentRatio = pct <= 10 ? 0 : (pct - 10) / 90;

  // =========================================================================
  // 1. THÈME SECRET : NOTHING OS EDITION (NDot57 + Rouge #D71920 + Dot Matrix)
  // =========================================================================
  if (uiStyle === 'nothing') {
    const neutralBg = '#08080b';
    const crimsonBg = isNotch ? '#16080b' : '#1b090d';
    const baseBg = mixSafeBgHex(neutralBg, crimsonBg, surfaceTintRatio * 0.9);
    const decorOpacity = Number((0.35 + 0.65 * t).toFixed(2));

    const whiteBorderA = 0.12 + 0.08 * (1 - borderAccentRatio);
    const redBorderA = 0.44 * borderAccentRatio;
    const rimColor =
      borderAccentRatio > 0.35
        ? `rgba(215, 25, 32, ${fmtAlpha(0.16 + redBorderA)})`
        : `rgba(255, 255, 255, ${fmtAlpha(whiteBorderA)})`;
    const sideRimColor =
      borderAccentRatio > 0.45
        ? `rgba(215, 25, 32, ${fmtAlpha(0.10 + redBorderA * 0.65)})`
        : `rgba(255, 255, 255, ${fmtAlpha(whiteBorderA * 0.65)})`;

    const outerShadow =
      outerHaloRatio > 0
        ? `0 16px 38px rgba(0,0,0,0.85), 0 4px 24px rgba(215, 25, 32, ${fmtAlpha(0.26 * outerHaloRatio)})`
        : '0 16px 38px rgba(0,0,0,0.85)';

    const boxShadow = isNotch
      ? `inset 0 -1px 0 ${rimColor}, inset 1px 0 0 ${sideRimColor}, inset -1px 0 0 ${sideRimColor}, ${outerShadow}`
      : `inset 0 0 0 1px ${rimColor}, ${outerShadow}`;

    const surfaceGradient =
      innerGlowRatio > 0
        ? `radial-gradient(120% 100% at 50% 100%, rgba(215, 25, 32, ${fmtAlpha(
            0.20 * innerGlowRatio
          )}) 0%, rgba(8, 8, 11, 0) 72%)`
        : 'none';

    const tabGlow = pct >= 40 ? `0 0 12px rgba(215, 25, 32, ${fmtAlpha(0.2 + 0.35 * t)})` : undefined;
    const btnGlow = pct >= 55 ? `0 0 14px rgba(215, 25, 32, ${fmtAlpha(0.18 + 0.32 * t)})` : undefined;

    return {
      mode: 'nothing',
      isOled,
      neonIntensity: neon,
      accentIntensity: pct,
      decorOpacity,
      accentHex: isMinimal ? '#f4f4f5' : '#D71920',
      accentSecondaryHex: '#FFFFFF',
      accentGradient: isMinimal ? '#FFFFFF' : '#D71920',
      surfaceBg: baseBg,
      surfaceGradient,
      earFill: baseBg,
      boxShadow,
      activeTabStyle: isMinimal
        ? { backgroundColor: '#FFFFFF' }
        : { backgroundColor: '#D71920', boxShadow: tabGlow },
      activeTabTextClass: isMinimal ? 'text-zinc-950 font-semibold' : 'text-white',
      primaryBtnStyle: useAccentedPrimaryBtn
        ? { backgroundColor: '#D71920', boxShadow: btnGlow }
        : { backgroundColor: '#FFFFFF' },
      primaryBtnTextClass: useAccentedPrimaryBtn ? 'text-white' : 'text-zinc-950 font-semibold',
      progressFillStyle: {
        backgroundColor: isMinimal ? '#FFFFFF' : '#D71920',
      },
      subtleActiveStyle: isMinimal
        ? {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderColor: 'rgba(255, 255, 255, 0.20)',
          }
        : {
            backgroundColor: `rgba(215, 25, 32, ${fmtAlpha(0.10 + 0.12 * t)})`,
            borderColor: `rgba(215, 25, 32, ${fmtAlpha(0.24 + 0.26 * t)})`,
          },
      clockFontClass: 'font-ndot tracking-widest',
      clockStyle: { color: '#FFFFFF' },
      bodyFontClass: 'font-ntype',
      statusDotColor: '#D71920',
      statusDotShadow:
        pct < 10 ? 'none' : `0 0 9px rgba(215, 25, 32, ${fmtAlpha(0.45 + 0.5 * t)})`,
    };
  }

  // =========================================================================
  // 2. THÈME SECRET : CYBERPUNK HUD 2077 (Fond #080b16 + Jaune #FCEE0A + Cyan #00F0FF)
  // =========================================================================
  if (uiStyle === 'cyberpunk') {
    const neutralCyberBg = '#08090f';
    const fullCyberBg = isNotch ? '#090e1f' : '#0b1228';
    const baseBg = mixSafeBgHex(neutralCyberBg, fullCyberBg, surfaceTintRatio);
    const decorOpacity = isMinimal ? 0 : Number((0.2 + 0.8 * t).toFixed(2));

    const yellowBorderA = 0.62 * borderAccentRatio;
    const cyanBorderA = 0.42 * borderAccentRatio;
    const bottomRim =
      borderAccentRatio > 0.05
        ? `rgba(252, 238, 10, ${fmtAlpha(0.12 + yellowBorderA)})`
        : 'rgba(255, 255, 255, 0.12)';
    const sideRim =
      borderAccentRatio > 0.05
        ? `rgba(0, 240, 255, ${fmtAlpha(0.08 + cyanBorderA)})`
        : 'rgba(255, 255, 255, 0.08)';

    const outerShadow =
      outerHaloRatio > 0
        ? `0 16px 38px rgba(0,0,0,0.88), 0 4px 24px rgba(252, 238, 10, ${fmtAlpha(
            0.22 * outerHaloRatio
          )}), 0 0 18px rgba(0, 240, 255, ${fmtAlpha(0.18 * outerHaloRatio)})`
        : '0 16px 38px rgba(0,0,0,0.88)';

    const boxShadow = isNotch
      ? `inset 0 -1px 0 ${bottomRim}, inset 1px 0 0 ${sideRim}, inset -1px 0 0 ${sideRim}, ${outerShadow}`
      : `inset 0 0 0 1px ${bottomRim}, ${outerShadow}`;

    const surfaceGradient =
      innerGlowRatio > 0
        ? `linear-gradient(180deg, rgba(8, 11, 22, 0) 0%, rgba(0, 240, 255, ${fmtAlpha(
            0.11 * innerGlowRatio
          )}) 55%, rgba(252, 238, 10, ${fmtAlpha(0.13 * innerGlowRatio)}) 100%)`
        : 'none';

    const yellowGlow =
      pct >= 40 ? `0 0 14px rgba(252, 238, 10, ${fmtAlpha(0.2 + 0.38 * t)})` : undefined;

    return {
      mode: 'cyberpunk',
      isOled: false,
      neonIntensity: pct < 15 ? 'none' : pct < 55 ? 'subtle' : 'vibrant',
      accentIntensity: pct,
      decorOpacity,
      accentHex: isMinimal ? '#f4f4f5' : '#FCEE0A',
      accentSecondaryHex: isMinimal ? '#a1a1aa' : '#00F0FF',
      accentGradient: isMinimal
        ? '#FFFFFF'
        : 'linear-gradient(90deg, #FCEE0A 0%, #00F0FF 100%)',
      surfaceBg: baseBg,
      surfaceGradient,
      earFill: baseBg,
      boxShadow,
      activeTabStyle: isMinimal
        ? { backgroundColor: '#FFFFFF' }
        : { backgroundColor: '#FCEE0A', boxShadow: yellowGlow },
      activeTabTextClass: 'text-zinc-950 font-bold',
      primaryBtnStyle: useAccentedPrimaryBtn
        ? { backgroundColor: '#FCEE0A', boxShadow: yellowGlow }
        : { backgroundColor: '#FFFFFF' },
      primaryBtnTextClass: 'text-zinc-950 font-bold',
      progressFillStyle: isMinimal
        ? { backgroundColor: '#FFFFFF' }
        : {
            backgroundImage: 'linear-gradient(90deg, #FCEE0A 0%, #00F0FF 100%)',
            boxShadow:
              pct >= 45 ? `0 0 8px rgba(0, 240, 255, ${fmtAlpha(0.25 + 0.35 * t)})` : undefined,
          },
      subtleActiveStyle: isMinimal
        ? {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderColor: 'rgba(255, 255, 255, 0.18)',
          }
        : {
            backgroundColor: `rgba(0, 240, 255, ${fmtAlpha(0.08 + 0.10 * t)})`,
            borderColor: `rgba(252, 238, 10, ${fmtAlpha(0.22 + 0.30 * t)})`,
          },
      clockFontClass: 'font-mono tracking-wider',
      clockStyle: isMinimal
        ? { color: '#FAFAFA' }
        : {
            color: '#00F0FF',
            textShadow:
              pct >= 35 ? `0 0 10px rgba(0, 240, 255, ${fmtAlpha(0.25 + 0.4 * t)})` : 'none',
          },
      bodyFontClass: '',
      statusDotColor: '#FCEE0A',
      statusDotShadow:
        pct < 10 ? 'none' : `0 0 10px rgba(252, 238, 10, ${fmtAlpha(0.45 + 0.48 * t)})`,
    };
  }

  // =========================================================================
  // 3. THÈME SYNTROPY (8 palettes d'accentuation + OLED + Currencies 0..100%)
  // =========================================================================
  const accentKey = settings.accentColor || 'purple';
  const pal = SYNTROPY_ACCENTS[accentKey] || SYNTROPY_ACCENTS.purple;

  const neutralDarkBg = '#08080b';
  const targetTintedBg = isNotch ? pal.tintedNotchBg : pal.tintedPillBg;
  // En mode OLED, le fond reste noir carbone jusqu'à 75%, puis accepte une nuance feutrée si l'utilisateur pousse à 100% Immersif
  const effectiveSurfaceMix = isOled
    ? Math.max(0, (pct - 75) / 25) * 0.55
    : surfaceTintRatio;
  const baseBg = mixSafeBgHex(neutralDarkBg, targetTintedBg, effectiveSurfaceMix);

  const neonFactor = neon === 'none' ? 0.55 : neon === 'subtle' ? 0.8 : 1;
  const maxBorderAlpha = (neon === 'none' ? 0.28 : neon === 'subtle' ? 0.38 : 0.52);
  const accentBorderA = maxBorderAlpha * borderAccentRatio;

  const bottomRim =
    borderAccentRatio > 0.08
      ? `rgba(${pal.rgb}, ${fmtAlpha(0.10 + accentBorderA)})`
      : 'rgba(255, 255, 255, 0.11)';
  const sideRim =
    borderAccentRatio > 0.08
      ? `rgba(${pal.rgb}, ${fmtAlpha((0.10 + accentBorderA) * 0.65)})`
      : 'rgba(255, 255, 255, 0.08)';

  const outerGlowAlpha =
    neon === 'none' ? 0.10 * outerHaloRatio : 0.28 * outerHaloRatio * neonFactor;
  const outerGlow =
    outerGlowAlpha > 0.01 && (!isOled || pct > 80)
      ? `0 18px 40px rgba(0,0,0,0.82), 0 6px 28px rgba(${pal.rgb}, ${fmtAlpha(outerGlowAlpha)})`
      : '0 18px 40px rgba(0,0,0,0.82)';

  const boxShadow = isNotch
    ? `inset 0 -1px 0 ${bottomRim}, inset 1px 0 0 ${sideRim}, inset -1px 0 0 ${sideRim}, ${outerGlow}`
    : `inset 0 0 0 1px ${bottomRim}, ${outerGlow}`;

  const gradAlphaScale = innerGlowRatio * (isOled ? 0.6 : 1);
  const surfaceGradient =
    gradAlphaScale <= 0.01
      ? 'none'
      : accentKey === 'mix'
      ? `radial-gradient(120% 95% at 15% 100%, rgba(139, 92, 246, ${fmtAlpha(
          0.26 * gradAlphaScale
        )}) 0%, transparent 60%), radial-gradient(120% 95% at 85% 100%, rgba(6, 182, 212, ${fmtAlpha(
          0.24 * gradAlphaScale
        )}) 0%, transparent 60%)`
      : accentKey === 'aether'
      ? `radial-gradient(130% 100% at 50% 105%, rgba(99, 102, 241, ${fmtAlpha(
          0.28 * gradAlphaScale
        )}) 0%, rgba(59, 130, 246, ${fmtAlpha(0.10 * gradAlphaScale)}) 45%, transparent 75%)`
      : `radial-gradient(130% 100% at 50% 105%, rgba(${pal.rgb}, ${fmtAlpha(
          0.26 * gradAlphaScale
        )}) 0%, transparent 72%)`;

  const btnGlow =
    neon === 'none' || isOled || pct < 45
      ? undefined
      : `0 0 14px rgba(${pal.rgb}, ${fmtAlpha((0.15 + 0.30 * t) * neonFactor)})`;

  const accentedFillCss: React.CSSProperties = pal.gradient
    ? { backgroundImage: pal.gradient, boxShadow: btnGlow }
    : { backgroundColor: pal.hex, boxShadow: btnGlow };

  const progressCss: React.CSSProperties = isMinimal
    ? { backgroundColor: '#FFFFFF' }
    : pal.gradient
    ? { backgroundImage: pal.gradient }
    : { backgroundColor: pal.hex };

  const accentedTextClass = pal.darkTextOnAccent ? 'text-zinc-950 font-semibold' : 'text-white';

  const typoClass =
    settings.typography === 'mono'
      ? 'font-mono'
      : settings.typography === 'serif'
      ? 'font-serif'
      : '';

  return {
    mode: 'syntropy',
    isOled,
    neonIntensity: neon,
    accentIntensity: pct,
    decorOpacity: t,
    accentHex: isMinimal ? '#e4e4e7' : pal.hex,
    accentSecondaryHex: isMinimal ? '#a1a1aa' : pal.secondaryHex,
    accentGradient: isMinimal ? '#FFFFFF' : pal.gradient || pal.hex,
    surfaceBg: baseBg,
    surfaceGradient,
    earFill: baseBg,
    boxShadow,
    activeTabStyle: isMinimal ? { backgroundColor: '#FFFFFF' } : accentedFillCss,
    activeTabTextClass: isMinimal ? 'text-zinc-950 font-semibold' : accentedTextClass,
    primaryBtnStyle: useAccentedPrimaryBtn ? accentedFillCss : { backgroundColor: '#FFFFFF' },
    primaryBtnTextClass: useAccentedPrimaryBtn ? accentedTextClass : 'text-zinc-950 font-semibold',
    progressFillStyle: progressCss,
    subtleActiveStyle: isMinimal
      ? {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderColor: 'rgba(255, 255, 255, 0.18)',
        }
      : {
          backgroundColor: `rgba(${pal.rgb}, ${fmtAlpha(0.10 + 0.10 * t)})`,
          borderColor: `rgba(${pal.rgb}, ${fmtAlpha(0.22 + 0.22 * t)})`,
        },
    clockFontClass:
      settings.typography === 'mono' ? 'font-mono tracking-tight' : 'tracking-tight',
    clockStyle: { color: '#FAFAFA' },
    bodyFontClass: typoClass,
    statusDotColor: pal.hex,
    statusDotShadow:
      neon === 'none' || pct < 10
        ? 'none'
        : `0 0 9px rgba(${pal.rgb}, ${fmtAlpha(0.45 + 0.45 * t)})`,
  };
}
