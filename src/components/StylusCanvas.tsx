'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Pen,
  PenTool,
  Highlighter,
  Eraser,
  Lasso,
  Shapes,
  Hand,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Minimize,
  Download,
  Image as ImageIcon,
  FileCode,
  Trash2,
  Grid3x3,
  Sparkles,
} from 'lucide-react';
import type {
  InkBackground,
  InkDocument,
  InkEraserMode,
  InkPaperColor,
  InkPenTool,
  InkTool,
  InkWidthPreset,
} from '@/types';
import {
  InkEngine,
  InkSettings,
  InkUiState,
} from '@/lib/inkEngine';
import { PAPER_COLORS, getDefaultPenColor } from '@/lib/ink';

export interface StylusCanvasProps {
  initialDocument: InkDocument;
  onChange?: (doc: InkDocument) => void;
  exportName?: string;
  className?: string;
  /** Hauteur fixe en pixels (emplacement manuscrit intégré à une note). Par défaut : plein conteneur. */
  height?: number;
}

const PRESET_COLORS = [
  { name: 'Noir Encre', value: '#18181b' },
  { name: 'Blanc', value: '#ffffff' },
  { name: 'Violet Synaptique', value: '#a855f7' },
  { name: 'Cyan Néon', value: '#22d3ee' },
  { name: 'Vert Émeraude', value: '#10b981' },
  { name: 'Jaune Surligneur', value: '#facc15' },
  { name: 'Rouge', value: '#ef4444' },
];

export const StylusCanvas: React.FC<StylusCanvasProps> = ({
  initialDocument,
  onChange,
  exportName = 'note-manuscrite',
  className = '',
  height,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<InkEngine | null>(null);

  // Paramètres d'outils
  const [tool, setTool] = useState<InkTool>('pen');
  const [eraserMode, setEraserMode] = useState<InkEraserMode>('stroke');
  const [paperColor, setPaperColor] = useState<InkPaperColor>(initialDocument.paperColor || 'dark');
  // Couleur de base adaptée au contraste de la feuille (Noir sur feuille claire, Blanc sur feuille sombre)
  const [color, setColor] = useState<string>(() => {
    const pc = initialDocument.paperColor || 'dark';
    return getDefaultPenColor(pc);
  });
  const [widthPreset, setWidthPreset] = useState<InkWidthPreset>('medium');
  const [shapeAssist, setShapeAssist] = useState<boolean>(false);
  const [fingerDraws, setFingerDraws] = useState<boolean>(false);
  const [background, setBackground] = useState<InkBackground>(initialDocument.background || 'dark');

  // État UI du moteur
  const [uiState, setUiState] = useState<InkUiState>({
    canUndo: false,
    canRedo: false,
    scale: 1,
    hasSelection: false,
    hasStrokes: false,
    view: { x: 0, y: 0, scale: 1 },
  });

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [exportMenuOpen, setExportMenuOpen] = useState<boolean>(false);

  // Instanciation de l'engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initialSettings: InkSettings = {
      tool,
      eraserMode,
      color,
      widthPreset,
      shapeAssist,
      fingerDraws,
    };

    const engine = new InkEngine(canvas, {
      doc: initialDocument,
      settings: initialSettings,
      onChange: (doc) => {
        onChange?.(doc);
      },
      onUiChange: (ui) => {
        setUiState(ui);
      },
    });

    engineRef.current = engine;

    // ResizeObserver attaché au canvasContainerRef DIRECT (exclut la barre d'outils)
    // Cela garantit une précision de coordonnées 1:1 sans décalage vertical du stylet
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          const dpr = window.devicePixelRatio || 1;
          engine.resize(width, height, dpr);
        }
      }
    });

    if (canvasContainerRef.current) {
      ro.observe(canvasContainerRef.current);
    }

    return () => {
      ro.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronisation des settings avec l'engine
  useEffect(() => {
    engineRef.current?.setSettings({
      tool,
      eraserMode,
      color,
      widthPreset,
      shapeAssist,
      fingerDraws,
    });
  }, [tool, eraserMode, color, widthPreset, shapeAssist, fingerDraws]);

  // Synchronisation du motif de fond
  const handleBackgroundChange = (bg: InkBackground) => {
    setBackground(bg);
    engineRef.current?.setBackground(bg);
  };

  // Changement d'outil avec adaptation fluide de la couleur
  const handleSelectTool = (newTool: InkTool) => {
    if (newTool === 'highlighter' && (color.toLowerCase() === '#18181b' || color.toLowerCase() === '#ffffff')) {
      setColor('#facc15');
    } else if ((newTool === 'pen' || newTool === 'fountain') && color === '#facc15') {
      setColor(getDefaultPenColor(paperColor));
    }
    setTool(newTool);
  };

  // Synchronisation de la couleur de la feuille avec adaptation automatique de la couleur de base du stylo
  const handlePaperColorChange = (pc: InkPaperColor) => {
    const prevDefault = getDefaultPenColor(paperColor);
    const nextDefault = getDefaultPenColor(pc);

    setPaperColor(pc);
    engineRef.current?.setPaperColor(pc);

    // Si la couleur actuelle était la couleur de base précédente (ou contraste incompatible),
    // basculer automatiquement vers la nouvelle couleur de base adaptée (Noir sur blanc/jauni, Blanc sur sombre)
    const lowerColor = color.toLowerCase();
    const isContrastIssue =
      ((pc === 'white' || pc === 'sepia') && (lowerColor === '#ffffff' || lowerColor === '#fff')) ||
      ((pc === 'dark' || pc === 'slate') && (lowerColor === '#18181b' || lowerColor === '#000000' || lowerColor === '#09090b'));

    if (lowerColor === prevDefault.toLowerCase() || isContrastIssue) {
      setColor(nextDefault);
    }
  };

  // Fullscreen handling robuste (évite que le plein écran saute)
  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;

    if (!document.fullscreenElement && !isFullscreen) {
      try {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        }
      } catch {
        // Fallback CSS plein écran si le navigateur bloque
      }
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          // ignore
        }
      }
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Exports
  const handleExportPng = async () => {
    if (!engineRef.current) return;
    const blob = await engineRef.current.exportPng();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportName}.png`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  const handleExportSvg = () => {
    if (!engineRef.current) return;
    const svgStr = engineRef.current.exportSvg();
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportName}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  return (
    <div
      ref={containerRef}
      style={height && !isFullscreen ? { height: `${height}px` } : undefined}
      className={`relative flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden select-none border border-zinc-800 rounded-2xl shadow-2xl transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-[100] w-screen h-screen rounded-none border-none'
          : height
          ? 'w-full'
          : 'w-full h-full min-h-[580px]'
      } ${className}`}
    >
      {/* Barre d'outils supérieure */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800/80 z-30 w-full min-h-[48px]">
        {/* Zone gauche et centrale : Outils, Épaisseur, Couleurs, Papier, Fond, Zoom (défilable horizontalement sur petits écrans) */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 min-w-0 flex-1">
          {/* Outils Stylos & Gomme & Lasso */}
          <div className="flex items-center gap-1 bg-zinc-950/70 p-1 rounded-xl border border-zinc-800/60 flex-shrink-0">
            <button
              type="button"
              onClick={() => handleSelectTool('pen')}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                tool === 'pen'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
              title="Stylo Bille (Trait net & fluide)"
            >
              <Pen className="w-4 h-4" />
              <span className="hidden sm:inline">Bille</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTool('fountain')}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                tool === 'fountain'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
              title="Stylo Plume Calligraphique (Sensible à la pression & vitesse)"
            >
              <PenTool className="w-4 h-4" />
              <span className="hidden sm:inline">Plume</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTool('highlighter')}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                tool === 'highlighter'
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
              title="Surligneur (Semi-transparent)"
            >
              <Highlighter className="w-4 h-4" />
              <span className="hidden sm:inline">Surligneur</span>
            </button>

            <div className="h-4 w-px bg-zinc-800 mx-0.5" />

            {/* Gomme */}
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => handleSelectTool('eraser')}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                  tool === 'eraser'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
                title="Gomme intelligente"
              >
                <Eraser className="w-4 h-4" />
                <span className="hidden sm:inline">Gomme</span>
              </button>
              {tool === 'eraser' && (
                <div className="flex items-center ml-1 bg-zinc-900 border border-zinc-700/60 rounded-md p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setEraserMode('stroke')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      eraserMode === 'stroke' ? 'bg-zinc-700 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="Effacer le trait entier"
                  >
                    Trait
                  </button>
                  <button
                    type="button"
                    onClick={() => setEraserMode('pixel')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      eraserMode === 'pixel' ? 'bg-zinc-700 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="Gomme par pixel"
                  >
                    Pixel
                  </button>
                </div>
              )}
            </div>

            {/* Lasso */}
            <button
              type="button"
              onClick={() => handleSelectTool('lasso')}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                tool === 'lasso'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
              title="Outil Lasso (Déplacer, redimensionner ou supprimer un tracé)"
            >
              <Lasso className="w-4 h-4" />
              <span className="hidden sm:inline">Lasso</span>
            </button>

            {uiState.hasSelection && (
              <button
                type="button"
                onClick={() => engineRef.current?.deleteSelection()}
                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors ml-1 cursor-pointer"
                title="Supprimer la sélection"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Épaisseur */}
          <div className="flex items-center gap-1 bg-zinc-950/70 p-1 rounded-xl border border-zinc-800/60 flex-shrink-0">
            {(['thin', 'medium', 'thick'] as InkWidthPreset[]).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWidthPreset(w)}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  widthPreset === w
                    ? 'bg-zinc-700 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
                title={`Épaisseur ${w === 'thin' ? 'Fine' : w === 'medium' ? 'Moyenne' : 'Épaisse'}`}
              >
                {w === 'thin' ? 'Fin' : w === 'medium' ? 'Moyen' : 'Épais'}
              </button>
            ))}
          </div>

          {/* Palette de couleurs */}
          <div className="flex items-center gap-1.5 bg-zinc-950/70 px-2 py-1 rounded-xl border border-zinc-800/60 flex-shrink-0">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`w-5 h-5 rounded-full transition-transform border cursor-pointer ${
                  color.toLowerCase() === c.value.toLowerCase()
                    ? 'scale-125 border-white ring-2 ring-purple-500/50'
                    : 'border-zinc-700 hover:scale-110'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}

            {/* Sélecteur personnalisé */}
            <label
              className="relative w-5 h-5 rounded-full cursor-pointer border border-zinc-700 overflow-hidden hover:scale-110 transition-transform ml-0.5"
              title="Couleur personnalisée"
            >
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div
                className="w-full h-full"
                style={{
                  background:
                    'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)',
                }}
              />
            </label>
          </div>

          {/* Couleur de la feuille (Papier) - Version compacte */}
          <div className="flex items-center gap-1 bg-zinc-950/70 p-1 rounded-xl border border-zinc-800/60 text-xs flex-shrink-0" title="Couleur de la feuille">
            <span className="text-[10px] text-zinc-400 font-medium px-1 hidden md:inline">Feuille :</span>
            {(
              [
                { id: 'dark', label: 'Noir', bg: '#09090b', title: 'Feuille Noir Pur OLED' },
                { id: 'white', label: 'Blanc', bg: '#ffffff', title: 'Feuille Blanche' },
                { id: 'sepia', label: 'Jauni', bg: '#fbf0d9', title: 'Feuille Jaunie / Crème (Confort yeux)' },
                { id: 'slate', label: 'Ardoise', bg: '#1e293b', title: 'Feuille Ardoise Sombre' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePaperColorChange(p.id)}
                className={`w-5 h-5 rounded-md transition-all flex items-center justify-center border cursor-pointer ${
                  paperColor === p.id
                    ? 'ring-2 ring-purple-500 scale-110 border-white shadow-xs'
                    : 'border-zinc-700/80 opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                style={{ backgroundColor: p.bg }}
                title={p.title}
              >
                {paperColor === p.id && (
                  <span className={`w-1.5 h-1.5 rounded-full ${p.id === 'white' || p.id === 'sepia' ? 'bg-zinc-900' : 'bg-white'}`} />
                )}
              </button>
            ))}
          </div>

          {/* Type d'arrière-plan */}
          <div className="flex items-center bg-zinc-950/70 p-1 rounded-xl border border-zinc-800/60 text-xs flex-shrink-0">
            <button
              type="button"
              onClick={() => handleBackgroundChange('dark')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                background === 'dark' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Fond uni sans quadrillage"
            >
              Uni
            </button>
            <button
              type="button"
              onClick={() => handleBackgroundChange('lined')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                background === 'lined' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Fond ligné"
            >
              Ligné
            </button>
            <button
              type="button"
              onClick={() => handleBackgroundChange('dots')}
              className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                background === 'dots' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Grille de points (Dot grid)"
            >
              <Grid3x3 className="w-3 h-3" />
              <span className="hidden sm:inline">Points</span>
            </button>
          </div>

          {/* Formes & Doigt */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShapeAssist((prev) => !prev)}
              className={`p-2 rounded-xl transition-colors border cursor-pointer ${
                shapeAssist
                  ? 'bg-purple-600/30 text-purple-300 border-purple-500/50 shadow-sm'
                  : 'bg-zinc-950/70 text-zinc-400 border-zinc-800/60 hover:text-zinc-200'
              }`}
              title="Aide au dessin géométrique (rectangles, cercles, lignes, flèches)"
            >
              <Shapes className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setFingerDraws((prev) => !prev)}
              className={`p-2 rounded-xl transition-colors border cursor-pointer ${
                fingerDraws
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-zinc-950/70 text-zinc-400 border-zinc-800/60 hover:text-zinc-200'
              }`}
              title={fingerDraws ? 'Tracer au doigt activé' : 'Doigt = Défilement / Zoom (Rejet paume)'}
            >
              <Hand className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center bg-zinc-950/70 px-1 py-0.5 rounded-xl border border-zinc-800/60 flex-shrink-0">
            <button
              type="button"
              onClick={() => engineRef.current?.zoomBy(1 / 1.2)}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Zoom arrière"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-zinc-400 px-1 min-w-[2.8rem] text-center">
              {Math.round(uiState.scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => engineRef.current?.zoomBy(1.2)}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Zoom avant"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => engineRef.current?.resetView()}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors ml-0.5 cursor-pointer"
              title="Recentrer le contenu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Zone droite fixe (JAMAIS coupée) : Undo, Redo, Export, Plein écran */}
        <div className="flex items-center gap-1.5 flex-shrink-0 pl-2 border-l border-zinc-800/80 z-30">
          {/* Undo / Redo */}
          <button
            type="button"
            disabled={!uiState.canUndo}
            onClick={() => engineRef.current?.undo()}
            className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800/60 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Annuler (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={!uiState.canRedo}
            onClick={() => engineRef.current?.redo()}
            className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800/60 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Rétablir (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Menu Export */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer shadow-xs"
              title="Exporter la note manuscrite (PNG / SVG)"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span className="hidden xl:inline">Export</span>
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={handleExportPng}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                  Exporter PNG
                </button>
                <button
                  type="button"
                  onClick={handleExportSvg}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  Exporter SVG
                </button>
              </div>
            )}
          </div>

          {/* Plein écran (Très visible, fixé à droite) */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm ${
              isFullscreen
                ? 'bg-purple-600 text-white border-purple-400 shadow-purple-500/25 ring-2 ring-purple-500/30'
                : 'bg-zinc-800/90 text-zinc-100 hover:text-white hover:bg-zinc-700 border-zinc-700'
            }`}
            title={isFullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-white" /> : <Maximize className="w-4 h-4 text-purple-400" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Quitter' : 'Plein écran'}</span>
          </button>
        </div>
      </div>

      {/* Surface de dessin Canvas */}
      <div
        ref={canvasContainerRef}
        className="relative flex-1 w-full h-full min-h-0 cursor-crosshair overflow-hidden"
        style={{ backgroundColor: PAPER_COLORS[paperColor]?.bg || '#09090b' }}
      >
        <canvas
          ref={canvasRef}
          tabIndex={0}
          className="absolute inset-0 outline-none block"
        />

        {/* Indication visuelle si le canevas est vierge */}
        {!uiState.hasStrokes && (
          <div
            className={`pointer-events-none absolute inset-0 flex items-center justify-center text-sm tracking-wide ${
              paperColor === 'white' || paperColor === 'sepia' ? 'text-zinc-600/60' : 'text-zinc-600/40'
            }`}
          >
            Surface de dessin tactile & stylet Syntropy — Utilisez votre stylet, deux doigts pour zoomer/défiler
          </div>
        )}
      </div>
    </div>
  );
};

export default StylusCanvas;
