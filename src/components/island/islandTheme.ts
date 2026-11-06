import React from 'react';
import { AppSettings } from '@/types';

export interface IslandThemeTokens {
  mode: 'syntropy' | 'nothing' | 'cyberpunk';
  isOled: boolean;
  neonIntensity: 'vibrant' | 'subtle' | 'none';

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
    tintedNotchBg: '#0c0818',
    tintedPillBg: '#0f0a1e',
    darkTextOnAccent: false,
  },
  aether: {
    hex: '#6366f1',
    secondaryHex: '#3b82f6',
    rgb: '99, 102, 241',
    tintedNotchBg: '#080c1c',
    tintedPillBg: '#0a1024',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
    darkTextOnAccent: false,
  },
  mix: {
    hex: '#8b5cf6',
    secondaryHex: '#06b6d4',
    rgb: '139, 92, 246',
    tintedNotchBg: '#090d18',
    tintedPillBg: '#0b101e',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 50%, #10b981 100%)',
    darkTextOnAccent: false,
  },
  cyan: {
    hex: '#06b6d4',
    secondaryHex: '#22d3ee',
    rgb: '6, 182, 212',
    tintedNotchBg: '#061218',
    tintedPillBg: '#08171f',
    darkTextOnAccent: true,
  },
  emerald: {
    hex: '#10b981',
    secondaryHex: '#34d399',
    rgb: '16, 185, 129',
    tintedNotchBg: '#061410',
    tintedPillBg: '#081a14',
    darkTextOnAccent: true,
  },
  amber: {
    hex: '#f59e0b',
    secondaryHex: '#fbbf24',
    rgb: '245, 158, 11',
    tintedNotchBg: '#140f06',
    tintedPillBg: '#1a1308',
    darkTextOnAccent: true,
  },
  red: {
    hex: '#e03148',
    secondaryHex: '#f87171',
    rgb: '224, 49, 72',
    tintedNotchBg: '#15080c',
    tintedPillBg: '#1b0a0f',
    darkTextOnAccent: false,
  },
  rose: {
    hex: '#e03148',
    secondaryHex: '#f87171',
    rgb: '224, 49, 72',
    tintedNotchBg: '#15080c',
    tintedPillBg: '#1b0a0f',
    darkTextOnAccent: false,
  },
  monochrome: {
    hex: '#f4f4f5',
    secondaryHex: '#a1a1aa',
    rgb: '244, 244, 245',
    tintedNotchBg: '#0b0b0e',
    tintedPillBg: '#0e0e12',
    darkTextOnAccent: true,
  },
};

export function getIslandThemeTokens(
  settings: AppSettings,
  isNotch: boolean
): IslandThemeTokens {
  const uiStyle = settings.uiStyle || 'syntropy';
  const isOled = settings.darkBgStyle === 'oled';
  const neon = settings.neonIntensity || 'vibrant';

  // =========================================================================
  // 1. THÈME SECRET : NOTHING OS EDITION (NDot57 + Rouge #D71920 + Dot Matrix)
  // =========================================================================
  if (uiStyle === 'nothing') {
    const baseBg = '#060608'; // Noir carbone profond non-zéro (safe Win32 hit-test)
    return {
      mode: 'nothing',
      isOled,
      neonIntensity: neon,
      accentHex: '#D71920',
      accentSecondaryHex: '#FFFFFF',
      accentGradient: '#D71920',
      surfaceBg: baseBg,
      surfaceGradient:
        'radial-gradient(120% 100% at 50% 100%, rgba(215, 25, 32, 0.10) 0%, rgba(6, 6, 8, 0) 70%)',
      earFill: baseBg,
      boxShadow: isNotch
        ? 'inset 0 -1px 0 rgba(255,255,255,0.20), inset 1px 0 0 rgba(255,255,255,0.12), inset -1px 0 0 rgba(255,255,255,0.12), 0 16px 38px rgba(0,0,0,0.85)'
        : 'inset 0 0 0 1px rgba(255,255,255,0.20), 0 16px 38px rgba(0,0,0,0.85), 0 0 20px rgba(215,25,32,0.14)',
      activeTabStyle: {
        backgroundColor: '#D71920',
        boxShadow: '0 0 12px rgba(215, 25, 32, 0.45)',
      },
      activeTabTextClass: 'text-white',
      primaryBtnStyle: {
        backgroundColor: '#D71920',
        boxShadow: '0 0 12px rgba(215, 25, 32, 0.35)',
      },
      primaryBtnTextClass: 'text-white',
      progressFillStyle: {
        backgroundColor: '#D71920',
      },
      subtleActiveStyle: {
        backgroundColor: 'rgba(215, 25, 32, 0.16)',
        borderColor: 'rgba(215, 25, 32, 0.40)',
      },
      clockFontClass: 'font-ndot tracking-widest',
      clockStyle: { color: '#FFFFFF' },
      bodyFontClass: 'font-ntype',
      statusDotColor: '#D71920',
      statusDotShadow: '0 0 9px rgba(215, 25, 32, 0.9)',
    };
  }

  // =========================================================================
  // 2. THÈME SECRET : CYBERPUNK HUD 2077 (Fond #070a14 + Jaune #FCEE0A + Cyan #00F0FF)
  // =========================================================================
  if (uiStyle === 'cyberpunk') {
    const baseBg = '#070a14';
    return {
      mode: 'cyberpunk',
      isOled: false,
      neonIntensity: 'vibrant',
      accentHex: '#FCEE0A',
      accentSecondaryHex: '#00F0FF',
      accentGradient: 'linear-gradient(90deg, #FCEE0A 0%, #00F0FF 100%)',
      surfaceBg: baseBg,
      surfaceGradient:
        'linear-gradient(180deg, rgba(7, 10, 20, 0) 0%, rgba(0, 240, 255, 0.07) 55%, rgba(252, 238, 10, 0.08) 100%)',
      earFill: baseBg,
      boxShadow: isNotch
        ? 'inset 0 -1px 0 rgba(252,238,10,0.52), inset 1px 0 0 rgba(0,240,255,0.30), inset -1px 0 0 rgba(0,240,255,0.30), 0 16px 38px rgba(0,0,0,0.88), 0 4px 22px rgba(252,238,10,0.16)'
        : 'inset 0 0 0 1px rgba(252,238,10,0.52), 0 16px 38px rgba(0,0,0,0.88), 0 0 24px rgba(0,240,255,0.18)',
      activeTabStyle: {
        backgroundColor: '#FCEE0A',
        boxShadow: '0 0 14px rgba(252, 238, 10, 0.5)',
      },
      activeTabTextClass: 'text-zinc-950 font-bold',
      primaryBtnStyle: {
        backgroundColor: '#FCEE0A',
        boxShadow: '0 0 14px rgba(252, 238, 10, 0.4)',
      },
      primaryBtnTextClass: 'text-zinc-950 font-bold',
      progressFillStyle: {
        backgroundImage: 'linear-gradient(90deg, #FCEE0A 0%, #00F0FF 100%)',
        boxShadow: '0 0 8px rgba(0, 240, 255, 0.5)',
      },
      subtleActiveStyle: {
        backgroundColor: 'rgba(0, 240, 255, 0.12)',
        borderColor: 'rgba(252, 238, 10, 0.42)',
      },
      clockFontClass: 'font-mono tracking-wider',
      clockStyle: {
        color: '#00F0FF',
        textShadow: '0 0 10px rgba(0, 240, 255, 0.55)',
      },
      bodyFontClass: '',
      statusDotColor: '#FCEE0A',
      statusDotShadow: '0 0 10px rgba(252, 238, 10, 0.9)',
    };
  }

  // =========================================================================
  // 3. THÈME SYNTROPY IMMERSIF (8 palettes d'accentuation + OLED + Néon)
  // =========================================================================
  const accentKey = settings.accentColor || 'purple';
  const pal = SYNTROPY_ACCENTS[accentKey] || SYNTROPY_ACCENTS.purple;

  // Jamais #000000 pur : en OLED on garde #060609 avec reflet immersif doux
  const baseBg = isOled
    ? '#060609'
    : isNotch
    ? pal.tintedNotchBg
    : pal.tintedPillBg;

  const borderAlpha = neon === 'none' ? 0.22 : neon === 'subtle' ? 0.30 : 0.42;
  const outerGlow =
    neon === 'none' || isOled
      ? '0 18px 40px rgba(0,0,0,0.82)'
      : neon === 'subtle'
      ? `0 18px 40px rgba(0,0,0,0.82), 0 4px 20px rgba(${pal.rgb}, 0.14)`
      : `0 18px 40px rgba(0,0,0,0.82), 0 6px 28px rgba(${pal.rgb}, 0.25)`;

  const boxShadow = isNotch
    ? `inset 0 -1px 0 rgba(${pal.rgb}, ${borderAlpha}), inset 1px 0 0 rgba(${pal.rgb}, ${
        borderAlpha * 0.65
      }), inset -1px 0 0 rgba(${pal.rgb}, ${borderAlpha * 0.65}), ${outerGlow}`
    : `inset 0 0 0 1px rgba(${pal.rgb}, ${borderAlpha}), ${outerGlow}`;

  const surfaceGradient =
    accentKey === 'mix'
      ? `radial-gradient(120% 95% at 15% 100%, rgba(139, 92, 246, ${
          isOled ? '0.14' : '0.22'
        }) 0%, transparent 60%), radial-gradient(120% 95% at 85% 100%, rgba(6, 182, 212, ${
          isOled ? '0.12' : '0.20'
        }) 0%, transparent 60%)`
      : accentKey === 'aether'
      ? `radial-gradient(130% 100% at 50% 105%, rgba(99, 102, 241, ${
          isOled ? '0.16' : '0.25'
        }) 0%, rgba(59, 130, 246, 0.08) 45%, transparent 75%)`
      : `radial-gradient(130% 100% at 50% 105%, rgba(${pal.rgb}, ${
          isOled ? '0.14' : '0.22'
        }) 0%, transparent 72%)`;

  const btnGlow =
    neon === 'none' || isOled
      ? undefined
      : `0 0 14px rgba(${pal.rgb}, ${neon === 'subtle' ? '0.25' : '0.42'})`;

  const fillCss: React.CSSProperties = pal.gradient
    ? { backgroundImage: pal.gradient, boxShadow: btnGlow }
    : { backgroundColor: pal.hex, boxShadow: btnGlow };

  const progressCss: React.CSSProperties = pal.gradient
    ? { backgroundImage: pal.gradient }
    : { backgroundColor: pal.hex };

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
    accentHex: pal.hex,
    accentSecondaryHex: pal.secondaryHex,
    accentGradient: pal.gradient || pal.hex,
    surfaceBg: baseBg,
    surfaceGradient,
    earFill: baseBg,
    boxShadow,
    activeTabStyle: fillCss,
    activeTabTextClass: pal.darkTextOnAccent ? 'text-zinc-950 font-semibold' : 'text-white',
    primaryBtnStyle: fillCss,
    primaryBtnTextClass: pal.darkTextOnAccent ? 'text-zinc-950 font-semibold' : 'text-white',
    progressFillStyle: progressCss,
    subtleActiveStyle: {
      backgroundColor: `rgba(${pal.rgb}, 0.16)`,
      borderColor: `rgba(${pal.rgb}, 0.36)`,
    },
    clockFontClass:
      settings.typography === 'mono' ? 'font-mono tracking-tight' : 'tracking-tight',
    clockStyle: { color: '#FAFAFA' },
    bodyFontClass: typoClass,
    statusDotColor: pal.hex,
    statusDotShadow:
      neon === 'none' ? 'none' : `0 0 9px rgba(${pal.rgb}, 0.85)`,
  };
}
